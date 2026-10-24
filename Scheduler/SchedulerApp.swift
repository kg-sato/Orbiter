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
    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        ScheduleWebView(bridge: bridge)
            .background(Color(red: 0.082, green: 0.078, blue: 0.114))
            .onChange(of: scenePhase) { phase in
                if phase == .active { bridge.dispatch("nativeReminderRefresh", detail: [:]) }
            }
<<<<<<< HEAD
            .alert("Connect Apple Health?", isPresented: $bridge.healthConsentRequested) {
                Button("Continue") { bridge.confirmHealthAccess() }
                Button("Cancel", role: .cancel) { bridge.cancelHealthAccess() }
            } message: {
                Text("Orbiter will ask to read nutrition, sleep and steps from Apple Health. It will not write to Health or upload these readings. You choose access in Apple's next screen.")
            }
            .alert("Enable private journal?", isPresented: $bridge.lifeStoreConsentRequested) {
                Button("Enable journal") { bridge.confirmLifeStoreAccess() }
                Button("Cancel", role: .cancel) { bridge.cancelLifeStoreAccess() }
            } message: {
                Text("Keep a separate journal on this iPhone for food, sleep, steps, habits and reflections. It is not uploaded or included in study exports. Access lasts for this app session. You can stop access or delete the journal separately.")
            }
=======
>>>>>>> dc7db3f6bb4c7a6e249725b8d44a0697ded53f3a
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
    @Published var healthConsentRequested = false
    @Published var lifeStoreConsentRequested = false
    weak var webView: WKWebView?
    // Native storage foundation exists, but no release/consent approval is implied.
    // Keep this gate closed until Apple SDK + physical protection/backup checks.
    private let lifeStoreAvailable = false
    private var lifeStoreConsent = false
    private var lifeStoreGeneration = 0
    private var lifeStoreAccessRequest: String?
    private let lifeStoreQueue = DispatchQueue(label: "com.kgsato.orbiter.life-store")
    private let healthIntegrationAvailable = false
    private var healthConsent = false
    private var healthGeneration = 0
    private var healthAccessRequest: String?
    private var reminderGeneration = 0
    private var reminderStatusGeneration = 0
    private var reminderEndAt: Double?
    private let focusReminderID = "scheduler.focus.complete"
    private var activeReminderID = UserDefaults.standard.string(forKey: "Scheduler.activeFocusReminder")
    private var pendingReminderID = UserDefaults.standard.string(forKey: "Scheduler.pendingFocusReminder")

    override init() {
        super.init()
        UNUserNotificationCenter.current().delegate = self
    }

    // All reminder state is changed on the main queue. Unique IDs let a stale
    // asynchronous add cancel itself without removing a newer session's reminder.
    private func syncFocusReminder(endAt: Double?, force: Bool = false) {
        // Unrelated workspace saves must not cancel a valid accepted/in-flight
        // reminder. Foreground and permission reconciliation explicitly bypass this.
        if !force, let endAt, endAt == reminderEndAt,
           activeReminderID != nil || pendingReminderID != nil { return }
        reminderGeneration += 1
        reminderStatusGeneration += 1 // Discard status snapshots from before this change.
        let generation = reminderGeneration
        let center = UNUserNotificationCenter.current()
        let previousIDs = [focusReminderID] + [activeReminderID, pendingReminderID].compactMap { $0 }
        center.removePendingNotificationRequests(withIdentifiers: previousIDs)
        activeReminderID = nil
        pendingReminderID = nil
        reminderEndAt = nil
        UserDefaults.standard.removeObject(forKey: "Scheduler.activeFocusReminder")
        UserDefaults.standard.removeObject(forKey: "Scheduler.pendingFocusReminder")
        guard let endAt, endAt.isFinite else {
            refreshReminderStatus()
            return
        }
        center.getNotificationSettings { [weak self] settings in
            DispatchQueue.main.async {
                guard let self, self.reminderGeneration == generation else { return }
                guard settings.authorizationStatus == .authorized || settings.authorizationStatus == .provisional || settings.authorizationStatus == .ephemeral else {
                    self.refreshReminderStatus()
                    return
                }
                let delay = endAt / 1000 - Date().timeIntervalSince1970
                // Match the planner's 1...240 minute custom duration. A nearly
                // completed session still gets a reminder; expired sessions do not.
                guard delay > 0, delay <= 240 * 60 + 5 else {
                    self.refreshReminderStatus()
                    return
                }
                let requestID = self.focusReminderID + "." + UUID().uuidString
                self.reminderEndAt = endAt
                self.pendingReminderID = requestID
                // Retain a cancellation handle if the process exits before add completes.
                UserDefaults.standard.set(requestID, forKey: "Scheduler.pendingFocusReminder")
                let content = UNMutableNotificationContent()
                content.title = "Focus session complete"
                content.body = "Your study session is finished. Take a moment to recharge."
                content.sound = .default
                let trigger = UNTimeIntervalNotificationTrigger(timeInterval: max(1, delay), repeats: false)
                center.add(UNNotificationRequest(identifier: requestID, content: content, trigger: trigger)) { [weak self] error in
                    DispatchQueue.main.async {
                        guard let self, self.reminderGeneration == generation else {
                            center.removePendingNotificationRequests(withIdentifiers: [requestID])
                            if UserDefaults.standard.string(forKey: "Scheduler.pendingFocusReminder") == requestID {
                                UserDefaults.standard.removeObject(forKey: "Scheduler.pendingFocusReminder")
                            }
                            self?.refreshReminderStatus()
                            return
                        }
                        if error != nil {
                            self.pendingReminderID = nil
                            UserDefaults.standard.removeObject(forKey: "Scheduler.pendingFocusReminder")
                            center.removePendingNotificationRequests(withIdentifiers: [requestID])
                            self.status("Could not schedule the focus reminder. Your focus timer is still running.", error: true)
                            self.refreshReminderStatus()
                            return
                        }
                        // Persist acceptance before dropping the cancellation handle,
                        // so a process exit cannot leave the request without an ID.
                        self.activeReminderID = requestID
                        UserDefaults.standard.set(requestID, forKey: "Scheduler.activeFocusReminder")
                        self.pendingReminderID = nil
                        UserDefaults.standard.removeObject(forKey: "Scheduler.pendingFocusReminder")
                        self.refreshReminderStatus()
                    }
                }
            }
        }
    }

    private func requestReminderPermission() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) { [weak self] granted, error in
            DispatchQueue.main.async {
                guard let self else { return }
                if error != nil {
                    self.dispatch("nativeReminderPermission", detail: ["error": "Could not check notification permission. Please try again."])
                } else {
                    self.dispatch("nativeReminderPermission", detail: ["granted": granted])
                }
                self.refreshReminderStatus()
            }
        }
    }

    // Read current system settings and actual pending requests without prompting
    // or changing opt-in. Pending is a snapshot, never a delivery guarantee.
    private func refreshReminderStatus() {
        reminderStatusGeneration += 1
        let generation = reminderStatusGeneration
        let schedulingGeneration = reminderGeneration
        let center = UNUserNotificationCenter.current()
        center.getNotificationSettings { [weak self] settings in
            DispatchQueue.main.async {
                guard let self, self.reminderStatusGeneration == generation,
                      self.reminderGeneration == schedulingGeneration else { return }
                center.getPendingNotificationRequests { [weak self] requests in
                    DispatchQueue.main.async {
                        guard let self, self.reminderStatusGeneration == generation,
                              self.reminderGeneration == schedulingGeneration else { return }
                        let authorization: String
                        switch settings.authorizationStatus {
                        case .authorized: authorization = "allowed"
                        case .provisional: authorization = "quiet"
                        case .ephemeral: authorization = "temporary"
                        case .denied: authorization = "blocked"
                        case .notDetermined: authorization = "notRequested"
                        @unknown default: authorization = "unknown"
                        }
                        let pending = requests.contains {
                            $0.identifier == self.focusReminderID || $0.identifier.hasPrefix(self.focusReminderID + ".")
                        }
                        self.dispatch("nativeReminderStatus", detail: [
                            "authorization": authorization,
                            "alerts": settings.alertSetting == .enabled,
                            "sounds": settings.soundSetting == .enabled,
                            "pending": pending
                        ])
                    }
                }
            }
        }
    }

    private func openReminderSettings() {
        guard let url = URL(string: UIApplication.openNotificationSettingsURLString) else { return }
        UIApplication.shared.open(url, options: [:]) { [weak self] opened in
            if !opened {
                DispatchQueue.main.async {
                    self?.status("Could not open Settings. Open iPhone Settings, then Notifications and Orbiter.", error: true)
                }
            }
        }
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        // The loaded foreground planner announces focus completion itself.
        // Keep a system fallback during load failures, and read UIKit state on main.
        DispatchQueue.main.async { [weak self] in
            guard let self else {
                completionHandler([.banner, .sound])
                return
            }
            let identifier = notification.request.identifier
            let isFocus = identifier == self.focusReminderID || identifier.hasPrefix(self.focusReminderID + ".")
            if isFocus, self.loadingError == nil, let webView = self.webView, !webView.isLoading {
                completionHandler([])
            } else {
                completionHandler([.banner, .sound])
            }
        }
    }


    private func healthReply(_ requestId: String, value: [String: Any]) {
        let status = value["status"] as? String ?? "error"
        if ["ok", "requestCompleted", "disconnected"].contains(status) {
            dispatch("nativeHealthResult", detail: ["requestId": requestId, "ok": true, "value": value])
        } else {
            dispatch("nativeHealthResult", detail: ["requestId": requestId, "ok": false,
                "error": ["code": status, "message": "The read-only Health operation could not be completed. Study data was not changed."]])
        }
    }

    func cancelHealthAccess() {
        healthConsentRequested = false
        if let requestId = healthAccessRequest {
            healthAccessRequest = nil
            healthReply(requestId, value: ["status": "cancelled"])
        }
    }

    func confirmHealthAccess() {
        healthConsentRequested = false
        guard healthIntegrationAvailable, lifeStoreAvailable, lifeStoreConsent,
              let requestId = healthAccessRequest else { cancelHealthAccess(); return }
        let generation = healthGeneration
        HealthKitReader.shared.requestAuthorization { [weak self] value in
            DispatchQueue.main.async {
                guard let self else { return }
                guard self.healthGeneration == generation, self.healthAccessRequest == requestId else { return }
                self.healthAccessRequest = nil
                self.healthConsent = value["status"] as? String == "requestCompleted"
                self.healthReply(requestId, value: value)
            }
        }
    }

    private func handleHealth(_ body: [String: Any]) {
        guard let requestId = body["requestId"] as? String,
              requestId.range(of: "^[A-Za-z0-9._-]{1,80}$", options: .regularExpression) != nil else { return }
        guard let operation = body["operation"] as? String,
              ["capabilities", "requestAccess", "read", "disconnect"].contains(operation) else {
            healthReply(requestId, value: ["status": "invalid"]); return
        }
        let available = healthIntegrationAvailable && lifeStoreAvailable
        if operation == "capabilities" {
            dispatch("nativeHealthResult", detail: ["requestId": requestId, "ok": true, "value": [
                "contractVersion": 1, "owner": "device", "provider": "appleHealth",
                "available": available, "readOnly": true, "cloud": false,
                "reason": "Apple Health requires validated native storage, owned signing, Xcode and physical iPhone checks."
            ]])
            return
        }
        if operation == "disconnect" {
            healthGeneration += 1; healthConsent = false; cancelHealthAccess()
            if available { HealthKitReader.shared.cancel() }
            healthReply(requestId, value: ["status": "disconnected"])
            return
        }
        guard available else { healthReply(requestId, value: ["status": "unavailable"]); return }
        if operation == "requestAccess" {
            guard body["consent"] as? Bool == true else { healthReply(requestId, value: ["status": "optInRequired"]); return }
            guard lifeStoreConsent else { healthReply(requestId, value: ["status": "optInRequired"]); return }
            guard healthAccessRequest == nil, lifeStoreAccessRequest == nil else { healthReply(requestId, value: ["status": "busy"]); return }
            healthAccessRequest = requestId; healthConsentRequested = true
            return
        }
        guard healthConsent else { healthReply(requestId, value: ["status": "optInRequired"]); return }
        guard let days = body["days"] as? Int, (1...31).contains(days) else {
            healthReply(requestId, value: ["status": "invalid"]); return
        }
        let generation = healthGeneration
        HealthKitReader.shared.read(days: days) { [weak self] value in
            DispatchQueue.main.async {
                guard let self else { return }
                guard self.healthGeneration == generation else {
                    self.healthReply(requestId, value: ["status": "cancelled"]); return
                }
                self.healthReply(requestId, value: value)
            }
        }
    }

    func cancelLifeStoreAccess() {
        lifeStoreConsentRequested = false
        if let requestId = lifeStoreAccessRequest {
            lifeStoreAccessRequest = nil
            dispatch("nativeLifeStoreResult", detail: ["requestId": requestId, "ok": false,
                "error": ["code": "cancelled", "message": "Journal consent was cancelled."]])
        }
    }

    func confirmLifeStoreAccess() {
        guard lifeStoreAvailable, let requestId = lifeStoreAccessRequest else { cancelLifeStoreAccess(); return }
        lifeStoreConsentRequested = false; lifeStoreAccessRequest = nil; lifeStoreConsent = true
        dispatch("nativeLifeStoreResult", detail: ["requestId": requestId, "ok": true,
            "value": ["status": "consented", "owner": "device"]])
    }

    private func handleLifeStore(_ body: [String: Any]) {
        guard let requestId = body["requestId"] as? String,
              requestId.range(of: "^[A-Za-z0-9._-]{1,80}$", options: .regularExpression) != nil else { return }
        func reject(_ code: String, _ message: String) {
            dispatch("nativeLifeStoreResult", detail: ["requestId": requestId, "ok": false,
                     "error": ["code": code, "message": message]])
        }
        guard let operation = body["operation"] as? String,
              ["capabilities", "requestAccess", "revoke", "read", "write", "clear"].contains(operation) else {
            reject("invalid", "Unsupported life storage operation."); return
        }
        if operation == "capabilities" {
            dispatch("nativeLifeStoreResult", detail: ["requestId": requestId, "ok": true, "value": [
                "contractVersion": 1, "owner": "device", "read": lifeStoreAvailable,
                "available": lifeStoreAvailable, "consented": lifeStoreConsent,
                "write": lifeStoreAvailable, "cloud": false, "healthKit": false,
                "reason": "Protected iPhone health storage is not enabled. Native validation and consent are still required."
            ]])
            return
        }
        if operation == "revoke" {
            lifeStoreGeneration += 1; lifeStoreConsent = false; cancelLifeStoreAccess()
            healthGeneration += 1; healthConsent = false; cancelHealthAccess()
            if healthIntegrationAvailable { HealthKitReader.shared.cancel() }
            // An already accepted disk operation may complete; revocation is not deletion or rollback.
            lifeStoreQueue.async { [weak self] in
                guard let self else { return }
                DispatchQueue.main.async {
                self.dispatch("nativeLifeStoreResult", detail: ["requestId": requestId, "ok": true,
                    "value": ["status": "revoked", "owner": "device"]])
            } }
            return
        }
        // Reject before inspecting health payloads, disk access or consent changes.
        guard lifeStoreAvailable else {
            reject("unavailable", "Protected iPhone health storage is not enabled."); return
        }
        if operation == "requestAccess" {
            guard body["consent"] as? Bool == true else { reject("optInRequired", "Confirm journal access first."); return }
            guard lifeStoreAccessRequest == nil, healthAccessRequest == nil else { reject("busy", "Finish the current consent request."); return }
            lifeStoreAccessRequest = requestId; lifeStoreConsentRequested = true
            return
        }
        guard let owner = body["owner"] as? String, owner == "device" else {
            reject("invalidOwner", "Native device ownership is required."); return
        }
        guard lifeStoreConsent else { reject("optInRequired", "Native consent is required."); return }
        // No web-supplied owner/account/consent value can enable the store.
        let expectedRevision = body["expectedRevision"] as? Int
        let json = body["json"] as? String
        guard operation == "read" || (expectedRevision != nil && expectedRevision! >= 0) else {
            reject("invalid", "A valid expected revision is required."); return
        }
        guard operation != "write" || json != nil else {
            reject("invalid", "Journal JSON is required."); return
        }
        let generation = lifeStoreGeneration
        let acceptedConsent = lifeStoreConsent
        lifeStoreQueue.async { [weak self] in
            guard let self else { return }
            let result: LifeStoreResult
            if operation == "read" { result = ProtectedLifeStore.shared.read(owner: owner, consent: acceptedConsent) }
            else if operation == "write" {
                result = ProtectedLifeStore.shared.write(owner: owner, expectedRevision: expectedRevision!, json: json!, consent: acceptedConsent)
            } else {
                result = ProtectedLifeStore.shared.delete(owner: owner, expectedRevision: expectedRevision!, consent: acceptedConsent)
            }
            DispatchQueue.main.async {
                guard self.lifeStoreGeneration == generation, self.lifeStoreConsent else {
                    self.dispatch("nativeLifeStoreResult", detail: ["requestId": requestId, "ok": false,
                        "error": ["code": "cancelled", "message": "Journal access ended. Reconcile before retrying a change."]])
                    return
                }
                let value = result.dictionary
                if value["status"] as? String == "ok" {
                    self.dispatch("nativeLifeStoreResult", detail: ["requestId": requestId, "ok": true, "value": value])
                } else {
                    self.dispatch("nativeLifeStoreResult", detail: ["requestId": requestId, "ok": false,
                        "error": ["code": value["status"] as? String ?? "error",
                                  "message": "The protected journal operation could not be completed. Your study data was not changed."]])
                }
            }
        }
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        // Accept Files requests only from the bundled main document, not embedded or remote pages.
        guard message.frameInfo.isMainFrame,
              let bundledURL = Bundle.main.url(forResource: "Application", withExtension: "html"),
              message.frameInfo.request.url?.standardizedFileURL == bundledURL.standardizedFileURL,
              let body = message.body as? [String: Any], let action = body["action"] as? String else { return }
        if action == "health" {
            handleHealth(body)
        } else if action == "lifeStore" {
            handleLifeStore(body)
        } else if action == "haptic" {
            UISelectionFeedbackGenerator().selectionChanged()
        } else if action == "focusReminder" {
            syncFocusReminder(endAt: body["endAt"] as? Double, force: body["force"] as? Bool ?? false)
        } else if action == "requestReminders" {
            requestReminderPermission()
        } else if action == "reminderStatus" {
            refreshReminderStatus()
        } else if action == "openReminderSettings" {
            openReminderSettings()
        } else if action == "import" {
            importing = true
        } else if action == "export", let text = body["text"] as? String {
            exportType = .json
            exportFilename = "Orbiter-backup"
            document = ScheduleDocument(text: text)
            #if DEBUG && targetEnvironment(simulator)
            if SimulatorSmoke.phase != nil {
                SimulatorSmoke.exportedJSON = text
                return // Observe the real bridge without presenting a system Files sheet in CI.
            }
            #endif
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
        #if DEBUG && targetEnvironment(simulator)
        SimulatorSmoke.configure(configuration.userContentController)
        #endif
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
        #if DEBUG && targetEnvironment(simulator)
        private let smoke = SimulatorSmoke()
        #endif
        init(bridge: ScheduleBridge) { self.bridge = bridge }
        var allowedURL: URL?
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            bridge.loadingError = nil
            #if DEBUG && targetEnvironment(simulator)
            smoke.run(webView: webView, bridge: bridge)
            #endif
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
