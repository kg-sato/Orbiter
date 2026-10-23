#if DEBUG && targetEnvironment(simulator)
import Foundation
import UIKit
import WebKit

// Explicitly invoked by CI on a newly created disposable simulator only.
// Never compiled into Release or physical-device builds.
final class SimulatorSmoke {
    static var phase: String? {
        ProcessInfo.processInfo.arguments.first { $0.hasPrefix("--orbiter-smoke-phase=") }
            .map { String($0.dropFirst("--orbiter-smoke-phase=".count)) }
            .flatMap { ["seed", "verify"].contains($0) ? $0 : nil }
    }
    static var exportedJSON: String?
    private var started = false
    private var checks: [String] = []
    private var expectedExpiry: Double?

    static func configure(_ controller: WKUserContentController) {
        guard phase != nil else { return }
        controller.addUserScript(WKUserScript(source: """
          window.__orbiterSmokeErrors = [];
          addEventListener('error', () => window.__orbiterSmokeErrors.push('javascript-error'));
          addEventListener('unhandledrejection', () => window.__orbiterSmokeErrors.push('unhandled-rejection'));
          document.addEventListener('securitypolicyviolation', () => window.__orbiterSmokeErrors.push('csp-violation'));
          """, injectionTime: .atDocumentStart, forMainFrameOnly: true))
    }

    func run(webView: WKWebView, bridge: ScheduleBridge) {
        guard let phase = Self.phase, !started else { return }
        started = true
        Task { @MainActor in
            do {
                try await wait(webView, "Boolean(window.OrbiterUI && window.SchedulerAccountBridge)", "application-ready")
                try await check(webView, "!document.querySelector('#open-account') && typeof window.OrbiterCloud === 'undefined' && /Account sync is unavailable/.test(document.querySelector('.account-entry')?.textContent || '')", "offline-account-disclosure")
                try await check(webView, "document.documentElement.scrollWidth <= innerWidth + 1", "no-horizontal-overflow")
                try await check(webView, "Boolean(document.querySelector('#iphone-privacy summary'))", "privacy-disclosure-present")
                if phase == "seed" {
                    try await seed(webView, bridge)
                } else {
                    try await verify(webView)
                }
                try await check(webView, "window.__orbiterSmokeErrors.length === 0", "no-javascript-or-csp-errors")
                await finish(webView, phase: phase, error: nil)
            } catch {
                await finish(webView, phase: phase, error: error.localizedDescription)
            }
        }
    }

    @MainActor private func seed(_ webView: WKWebView, _ bridge: ScheduleBridge) async throws {
        _ = try await js(webView, "window.__orbiterSmokeOriginal = JSON.stringify(window.OrbiterUI.snapshot()); true")
        bridge.dispatch("nativeScheduleImport", detail: "{invalid")
        try await Task.sleep(nanoseconds: 350_000_000)
        try await check(webView, "JSON.stringify(window.OrbiterUI.snapshot()) === window.__orbiterSmokeOriginal", "invalid-native-import-preserves-data")
        let fixture = try await js(webView, """
          (() => {
            const data = JSON.parse(window.__orbiterSmokeOriginal);
            data.study ||= {tasks: [], sessions: [], preferences: {name: '', goal: 10, motion: false, solid: false}, timer: {duration: 25, remaining: 1500, endAt: null, title: ''}};
            data.study.preferences.name = 'Orbiter simulator smoke fixture';
            data.study.preferences.reminders = false;
            data.study.preferences.motion = false;
            data.study.sessions = [];
            data.study.timer = {duration: 1, remaining: 60, endAt: null, title: 'Orbiter simulator smoke fixture', taskId: null};
            return JSON.stringify(data);
          })()
          """) as? String
        guard let fixture else { throw failure("fixture-serialization") }
        bridge.dispatch("nativeScheduleImport", detail: fixture)
        try await wait(webView, "window.OrbiterUI.snapshot().study.preferences.name === 'Orbiter simulator smoke fixture'", "valid-native-import")
        Self.exportedJSON = nil
        _ = try await js(webView, "document.querySelector('#export-dialog').showModal(); document.querySelector('#export-backup').click(); true")
        let exportDeadline = Date().addingTimeInterval(10)
        while Self.exportedJSON == nil && Date() < exportDeadline {
            try await Task.sleep(nanoseconds: 100_000_000)
        }
        guard let exported = Self.exportedJSON,
              let exportData = exported.data(using: .utf8),
              let exportObject = try JSONSerialization.jsonObject(with: exportData) as? NSDictionary,
              let current = try await js(webView, "JSON.stringify(window.OrbiterUI.snapshot())") as? String,
              let currentData = current.data(using: .utf8),
              let currentObject = try JSONSerialization.jsonObject(with: currentData) as? NSDictionary,
              exportObject.isEqual(currentObject) else { throw failure("native-export-bridge-roundtrip") }
        checks.append("native-export-bridge-roundtrip")
        try await check(webView, "!document.querySelector('#export-dialog').open", "export-dialog-closed")
        _ = try await js(webView, "document.querySelector('#focus-start').click(); true")
        try await wait(webView, "window.OrbiterUI.snapshot().study.timer.endAt > Date.now()", "focus-start")
        _ = try await js(webView, "document.querySelector('#focus-start').click(); true")
        try await wait(webView, "window.OrbiterUI.snapshot().study.timer.endAt === null && window.OrbiterUI.snapshot().study.timer.remaining > 0", "focus-pause")
        _ = try await js(webView, "document.querySelector('#focus-start').click(); true")
        try await wait(webView, "window.OrbiterUI.snapshot().study.timer.endAt > Date.now()", "focus-resume")
        // Persist a short active session, then let the runner terminate and relaunch after expiry.
        let expiring = try await js(webView, """
          (() => {
            const data = JSON.parse(JSON.stringify(window.OrbiterUI.snapshot()));
            data.study.timer.duration = 3;
            data.study.timer.remaining = 180;
            data.study.timer.endAt = Date.now() + 180000;
            return JSON.stringify(data);
          })()
          """) as? String
        guard let expiring else { throw failure("expiry-fixture-serialization") }
        bridge.dispatch("nativeScheduleImport", detail: expiring)
        try await wait(webView, "window.OrbiterUI.snapshot().study.timer.endAt > Date.now() && window.OrbiterUI.snapshot().study.timer.remaining === 180", "active-timer-persisted-for-relaunch")
        expectedExpiry = try await js(webView, "window.OrbiterUI.snapshot().study.timer.endAt") as? Double
        guard let expectedExpiry, expectedExpiry > Date().timeIntervalSince1970 * 1000 else {
            throw failure("expiry-deadline-missing")
        }
    }

    @MainActor private func verify(_ webView: WKWebView) async throws {
        try await check(webView, "window.OrbiterUI.snapshot().study.preferences.name === 'Orbiter simulator smoke fixture'", "workspace-persists-across-process-relaunch")
        try await wait(webView, "window.OrbiterUI.snapshot().study.timer.endAt === null && window.OrbiterUI.snapshot().study.timer.remaining === 0 && window.OrbiterUI.snapshot().study.sessions.filter(s => s.title === 'Orbiter simulator smoke fixture').length === 1", "expired-focus-recorded-once")
        try await Task.sleep(nanoseconds: 1_500_000_000)
        try await check(webView, "window.OrbiterUI.snapshot().study.sessions.filter(s => s.title === 'Orbiter simulator smoke fixture').length === 1", "completion-not-duplicated")
        _ = try await js(webView, "document.querySelector('#profile').click(); document.querySelector('#iphone-privacy').open = true; true")
        try await check(webView, "document.querySelector('#iphone-privacy').open", "privacy-disclosure-opens")
    }

    @MainActor private func js(_ webView: WKWebView, _ source: String) async throws -> Any? {
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Any?, Error>) in
            webView.evaluateJavaScript(source) { value, error in
                if let error { continuation.resume(throwing: error) }
                else { continuation.resume(returning: value) }
            }
        }
    }

    @MainActor private func check(_ webView: WKWebView, _ expression: String, _ name: String) async throws {
        guard try await js(webView, expression) as? Bool == true else { throw failure(name) }
        checks.append(name)
    }

    @MainActor private func wait(_ webView: WKWebView, _ expression: String, _ name: String) async throws {
        let deadline = Date().addingTimeInterval(15)
        while Date() < deadline {
            if (try? await js(webView, expression)) as? Bool == true {
                checks.append(name)
                return
            }
            try await Task.sleep(nanoseconds: 150_000_000)
        }
        throw failure(name + "-timeout")
    }

    private func failure(_ stage: String) -> NSError {
        NSError(domain: "OrbiterSimulatorSmoke", code: 1, userInfo: [NSLocalizedDescriptionKey: stage])
    }

    @MainActor private func finish(_ webView: WKWebView, phase: String, error: String?) async {
        let directory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let screenshot = "orbiter-smoke-\(phase).png"
        var errors = error.map { [$0] } ?? []
        do {
            let image: UIImage = try await withCheckedThrowingContinuation { continuation in
                webView.takeSnapshot(with: nil) { image, error in
                    if let image { continuation.resume(returning: image) }
                    else { continuation.resume(throwing: error ?? self.failure("snapshot-failed")) }
                }
            }
            guard let png = image.pngData() else { throw failure("snapshot-encoding") }
            try png.write(to: directory.appendingPathComponent(screenshot), options: .atomic)
        } catch {
            errors.append("snapshot-failed")
        }
        let report: [String: Any] = [
            "phase": phase, "success": errors.isEmpty, "checks": checks, "errors": errors,
            "screenshot": screenshot, "version": Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "unknown",
            "ios": UIDevice.current.systemVersion, "expectedExpiry": expectedExpiry ?? 0,
            "coverage": "Actual WKWebView and native bridge; programmatic DOM activation. Files picker, touch hit testing, notification delivery and physical device not tested."
        ]
        do {
            let data = try JSONSerialization.data(withJSONObject: report, options: [.prettyPrinted, .sortedKeys])
            try data.write(to: directory.appendingPathComponent("orbiter-smoke-\(phase).json"), options: .atomic)
        } catch {
            NSLog("Orbiter simulator smoke could not write report")
        }
    }
}
#endif
