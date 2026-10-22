import SwiftUI
import UIKit
import WebKit
import UniformTypeIdentifiers
import UserNotifications

// A small native shell; all scheduling logic remains in Application.html.
@main
struct SchedulerApp: App {
    var body: some Scene {
        WindowGroup { ScheduleScreen().preferredColorScheme(.dark) }
    }
}

struct ScheduleDocument: FileDocument {
    static var readableContentTypes: [UTType] { [.json, UTType(filenameExtension: "ics") ?? .plainText] }
    var text: String
    init(text: String = "") { self.text = text }
    init(configuration: ReadConfiguration) throws {
        guard let data = configuration.file.regularFileContents,
              let value = String(data: data, encoding: .utf8) else {
            throw CocoaError(.fileReadCorruptFile)
        }
        text = value
    }
    func fileWrapper(configuration: WriteConfiguration) throws -> FileWrapper {
        FileWrapper(regularFileWithContents: Data(text.utf8))
    }
}

struct ScheduleScreen: View {
    @StateObject private var bridge = ScheduleBridge()

    var body: some View {
        ScheduleWebView(bridge: bridge)
            .background(Color(red: 0.082, green: 0.078, blue: 0.114))
            .overlay {
                if let error = bridge.loadingError {
                    VStack(spacing: 16) {
                        Text("Could not open your planner").font(.headline)
                        Text(error).multilineTextAlignment(.center)
                        Button("Try again") {
                            bridge.loadingError = nil
                            bridge.webView?.reload()
                        }
                    }
                    .padding(24)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color(red: 0.082, green: 0.078, blue: 0.114))
                }
            }
            .fileImporter(isPresented: $bridge.importing, allowedContentTypes: [.json]) { result in
                switch result {
                case .success(let url):
                    let access = url.startAccessingSecurityScopedResource()
                    defer { if access { url.stopAccessingSecurityScopedResource() } }
                    do {
                        let text = try String(contentsOf: url, encoding: .utf8)
                        bridge.dispatch("nativeScheduleImport", detail: text)
                    } catch {
                        bridge.status("Could not read this JSON file. Your schedule was not changed.", error: true)
                    }
                case .failure:
                    bridge.status("Import cancelled. Your schedule was not changed.")
                }
            }
            .fileExporter(isPresented: $bridge.exporting, document: bridge.document,
                          contentType: bridge.exportType, defaultFilename: bridge.exportFilename) { result in
                switch result {
                case .success: bridge.status("Schedule exported.")
                case .failure: bridge.status("Export was not completed. Your schedule is still saved on this device.", error: true)
                }
            }
    }
}

final class ScheduleBridge: NSObject, ObservableObject, WKScriptMessageHandler, UNUserNotificationCenterDelegate {
    @Published var importing = false
    @Published var exporting = false
    @Published var document = ScheduleDocument()
    @Published var exportType: UTType = .json
    @Published var exportFilename = "Orbiter-backup"
    @Published var loadingError: String?
    weak var webView: WKWebView?
    private var reminderGeneration = 0
    private let focusReminderID = "scheduler.focus.complete"
    private var activeReminderID = UserDefaults.standard.string(forKey: "Scheduler.activeFocusReminder")

    override init() {
        super.init()
        UNUserNotificationCenter.current().delegate = self
    }

    // Each request has a unique ID, so a stale asynchronous add can cancel itself
    // without removing the newer session's reminder. Persist the active ID across launches.
    private func syncFocusReminder(endAt: Double?) {
        reminderGeneration += 1
        let generation = reminderGeneration
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: [focusReminderID] + (activeReminderID.map { [$0] } ?? []))
        activeReminderID = nil
        UserDefaults.standard.removeObject(forKey: "Scheduler.activeFocusReminder")
        guard let endAt, endAt.isFinite else { return }
        let requestID = focusReminderID + "." + UUID().uuidString
        activeReminderID = requestID
        UserDefaults.standard.set(requestID, forKey: "Scheduler.activeFocusReminder")
        center.getNotificationSettings { [weak self] settings in
            DispatchQueue.main.async {
                guard let self, self.reminderGeneration == generation else { return }
                guard settings.authorizationStatus == .authorized || settings.authorizationStatus == .provisional else { return }
                let delay = endAt / 1000 - Date().timeIntervalSince1970
                guard delay > 1, delay <= 90 * 60 + 5 else { return }
                let content = UNMutableNotificationContent()
                content.title = "Focus session complete"
                content.body = "Your study session is finished. Take a moment to recharge."
                content.sound = .default
                let trigger = UNTimeIntervalNotificationTrigger(timeInterval: delay, repeats: false)
                center.add(UNNotificationRequest(identifier: requestID, content: content, trigger: trigger)) { [weak self] error in
                    DispatchQueue.main.async {
                        guard let self, self.reminderGeneration == generation else {
                            center.removePendingNotificationRequests(withIdentifiers: [requestID])
                            return
                        }
                        if error != nil { self.status("Could not schedule the focus reminder.", error: true) }
                    }
                }
            }
        }
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner, .sound])
    }


    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        // Accept Files requests only from the bundled main document, not embedded or remote pages.
        guard message.frameInfo.isMainFrame,
              let bundledURL = Bundle.main.url(forResource: "Application", withExtension: "html"),
              message.frameInfo.request.url?.standardizedFileURL == bundledURL.standardizedFileURL,
              let body = message.body as? [String: Any], let action = body["action"] as? String else { return }
        if action == "haptic" {
            UISelectionFeedbackGenerator().selectionChanged()
        } else if action == "focusReminder" {
            syncFocusReminder(endAt: body["endAt"] as? Double)
        } else if action == "requestReminders" {
            UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) { [weak self] granted, _ in
                DispatchQueue.main.async {
                    self?.dispatch("nativeReminderPermission", detail: ["granted": granted])
                }
            }
        } else if action == "import" {
            importing = true
        } else if action == "export", let text = body["text"] as? String {
            exportType = .json
            exportFilename = "Orbiter-backup"
            document = ScheduleDocument(text: text)
            exporting = true
        } else if action == "exportCalendar", let text = body["text"] as? String {
            // The local web app creates a standards-based snapshot; Files owns the save UI.
            exportType = UTType(filenameExtension: "ics") ?? .plainText
            exportFilename = "scheduler-week"
            document = ScheduleDocument(text: text)
            exporting = true
        }
    }

    func dispatch(_ event: String, detail: Any) {
        // JSON serialization keeps imported text as data, never JavaScript source.
        guard let data = try? JSONSerialization.data(withJSONObject: ["type": event, "detail": detail]),
              let json = String(data: data, encoding: .utf8) else { return }
        webView?.evaluateJavaScript("(() => { const message = \(json); window.dispatchEvent(new CustomEvent(message.type, {detail: message.detail})); })();", completionHandler: nil)
    }

    func status(_ message: String, error: Bool = false) {
        dispatch("nativeScheduleStatus", detail: ["message": message, "error": error])
    }
}

struct ScheduleWebView: UIViewRepresentable {
    let bridge: ScheduleBridge

    func makeCoordinator() -> Coordinator { Coordinator(bridge: bridge) }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        // Offline iPhone beta: preserve this data store and its existing storage keys.
        configuration.websiteDataStore = .default()
        configuration.userContentController.add(bridge, name: "scheduleFiles")
        let view = WKWebView(frame: .zero, configuration: configuration)
        view.navigationDelegate = context.coordinator
        view.isOpaque = false
        view.backgroundColor = .clear
        view.scrollView.backgroundColor = .clear
        view.scrollView.contentInsetAdjustmentBehavior = .never
        bridge.webView = view
        if let url = Bundle.main.url(forResource: "Application", withExtension: "html") {
            context.coordinator.allowedURL = url
            view.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
        } else {
            bridge.loadingError = "The bundled planner is missing. Reinstall this beta; your existing data has not been cleared."
        }
        return view
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    static func dismantleUIView(_ uiView: WKWebView, coordinator: Coordinator) {
        // Release the bridge registration when SwiftUI removes this web view.
        uiView.configuration.userContentController.removeScriptMessageHandler(forName: "scheduleFiles")
        uiView.navigationDelegate = nil
    }

    final class Coordinator: NSObject, WKNavigationDelegate {
        private let bridge: ScheduleBridge
        init(bridge: ScheduleBridge) { self.bridge = bridge }
        var allowedURL: URL?
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            bridge.loadingError = nil
        }
        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            bridge.loadingError = "Your saved data has not been cleared. Try reopening the planner."
        }
        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            bridge.loadingError = "Your saved data has not been cleared. Try reopening the planner."
        }
        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = navigationAction.request.url else { decisionHandler(.cancel); return }
            // Restrict navigation to the bundled app. Future web authentication needs a deliberate separate flow.
            decisionHandler(url.isFileURL && url.standardizedFileURL == allowedURL?.standardizedFileURL ? .allow : .cancel)
        }
        func webViewWebContentProcessDidTerminate(_ webView: WKWebView) { webView.reload() }
    }
}
