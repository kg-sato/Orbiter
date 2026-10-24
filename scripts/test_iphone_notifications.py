"""Compile actual native reminder methods with controlled callback fakes.

Runs with Swift on Windows/macOS. This checks lifecycle logic, not the Apple
framework ABI, permission UI or notification delivery on a real iPhone.
"""
from pathlib import Path
import re
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parent.parent

MOCKS = r'''import Foundation

// Execute main-queue work serially; notification callback order is controlled by
// each case below. This intentionally does not model Apple's delivery service.
struct DispatchQueue {
    static let main = DispatchQueue()
    static var executingMain = false
    func async(execute: () -> Void) {
        let wasMain = Self.executingMain
        Self.executingMain = true
        defer { Self.executingMain = wasMain }
        execute()
    }
}
final class TestWebView {
    var loading: Bool
    var readOffMain = false
    init(isLoading: Bool) { loading = isLoading }
    var isLoading: Bool {
        if !DispatchQueue.executingMain { readOffMain = true }
        return loading
    }
}
final class Defaults {
    var values: [String: String] = [:]
    func string(forKey key: String) -> String? { values[key] }
    func set(_ value: String, forKey key: String) { values[key] = value }
    func removeObject(forKey key: String) { values.removeValue(forKey: key) }
}
enum UserDefaults { static let standard = Defaults() }
enum AuthorizationStatus { case authorized, provisional, ephemeral, denied, notDetermined, future }
enum NotificationSetting { case enabled, disabled, notSupported }
struct UNNotificationSettings {
    let authorizationStatus: AuthorizationStatus
    var alertSetting: NotificationSetting = .enabled
    var soundSetting: NotificationSetting = .enabled
}
struct AuthorizationOptions: OptionSet {
    let rawValue: Int
    static let alert = AuthorizationOptions(rawValue: 1)
    static let sound = AuthorizationOptions(rawValue: 2)
}
struct NotificationSound { static let `default` = NotificationSound() }
final class UNMutableNotificationContent {
    var title = "", body = ""
    var sound: NotificationSound?
}
struct UNTimeIntervalNotificationTrigger {
    let timeInterval: Double
    let repeats: Bool
}
struct UNNotificationRequest {
    let identifier: String
    let content: UNMutableNotificationContent
    let trigger: UNTimeIntervalNotificationTrigger
}
struct UNNotification { let request: UNNotificationRequest }
struct UNNotificationPresentationOptions: OptionSet {
    let rawValue: Int
    static let banner = UNNotificationPresentationOptions(rawValue: 1)
    static let sound = UNNotificationPresentationOptions(rawValue: 2)
}
final class UNUserNotificationCenter {
    static var instance = UNUserNotificationCenter()
    static func current() -> UNUserNotificationCenter { instance }
    var settings: [(UNNotificationSettings) -> Void] = []
    var adds: [(UNNotificationRequest, (Error?) -> Void)] = []
    var pendingQueries: [([UNNotificationRequest]) -> Void] = []
    var permissions: [(Bool, Error?) -> Void] = []
    var pending: [String: UNNotificationRequest] = [:]
    var removed: [String] = []
    func getNotificationSettings(completionHandler: @escaping (UNNotificationSettings) -> Void) {
        settings.append(completionHandler)
    }
    func getPendingNotificationRequests(completionHandler: @escaping ([UNNotificationRequest]) -> Void) {
        pendingQueries.append(completionHandler)
    }
    func replyPending(_ index: Int = 0, requests: [UNNotificationRequest]? = nil) {
        pendingQueries[index](requests ?? Array(pending.values))
    }
    func add(_ request: UNNotificationRequest, withCompletionHandler: @escaping (Error?) -> Void) {
        adds.append((request, withCompletionHandler))
    }
    func removePendingNotificationRequests(withIdentifiers ids: [String]) {
        removed += ids
        for id in ids { pending.removeValue(forKey: id) }
    }
    func requestAuthorization(options: AuthorizationOptions, completionHandler: @escaping (Bool, Error?) -> Void) {
        permissions.append(completionHandler)
    }
    func replySettings(_ index: Int = 0, _ status: AuthorizationStatus = .authorized,
                       alerts: NotificationSetting = .enabled, sounds: NotificationSetting = .enabled) {
        settings[index](UNNotificationSettings(authorizationStatus: status, alertSetting: alerts, soundSetting: sounds))
    }
    func finishAdd(_ index: Int = 0, error: Error? = nil) {
        let (request, callback) = adds[index]
        if error == nil { pending[request.identifier] = request }
        callback(error)
    }
}
struct TestError: Error {}
'''

CASES = r'''
let key = "Scheduler.activeFocusReminder"
let pendingKey = "Scheduler.pendingFocusReminder"
var checks = 0
func require(_ condition: @autoclosure () -> Bool, _ name: String) {
    if !condition() { fatalError("FAILED: " + name) }
    checks += 1
}
func fresh(savedID: String? = nil, savedPendingID: String? = nil) -> (Bridge, UNUserNotificationCenter) {
    UserDefaults.standard.values = [:]
    if let savedID { UserDefaults.standard.set(savedID, forKey: key) }
    if let savedPendingID { UserDefaults.standard.set(savedPendingID, forKey: pendingKey) }
    UNUserNotificationCenter.instance = UNUserNotificationCenter()
    return (Bridge(), UNUserNotificationCenter.instance)
}
func expiry(_ seconds: Double) -> Double { (Date().timeIntervalSince1970 + seconds) * 1000 }

// A 240-minute session must schedule, but never be persisted before acceptance.
do {
    let (b, c) = fresh(savedID: "saved.previous")
    b.syncFocusReminder(endAt: expiry(240 * 60))
    require(c.removed.contains("saved.previous"), "previous launch reminder cancelled")
    require(c.removed.contains("scheduler.focus.complete"), "legacy identifier cancelled")
    require(UserDefaults.standard.string(forKey: key) == nil, "old persisted ID cleared")
    c.replySettings()
    require(c.adds.count == 1, "four-hour session accepted")
    require(c.adds[0].0.trigger.timeInterval > 14390, "four-hour delay retained")
    require(!c.adds[0].0.trigger.repeats, "completion is not repeating")
    require(b.pendingReminderID == c.adds[0].0.identifier, "in-flight request tracked")
    require(UserDefaults.standard.string(forKey: pendingKey) == b.pendingReminderID, "in-flight cancellation handle survives relaunch")
    require(b.activeReminderID == nil && UserDefaults.standard.string(forKey: key) == nil, "not active before completion")
    c.finishAdd()
    require(UserDefaults.standard.string(forKey: key) == c.adds[0].0.identifier, "successful add persisted")
    require(b.pendingReminderID == nil && UserDefaults.standard.string(forKey: pendingKey) == nil, "in-flight ID cleared after success")
    b.syncFocusReminder(endAt: nil)
    require(c.pending.isEmpty && b.activeReminderID == nil, "pause cancels accepted request")
    require(UserDefaults.standard.string(forKey: key) == nil, "pause clears saved ID")
}
// An interrupted add from a prior launch remains cancellable, without claiming success.
do {
    let (b, c) = fresh(savedPendingID: "prior-launch.in-flight")
    require(b.activeReminderID == nil, "relaunch pending ID is not accepted ID")
    b.syncFocusReminder(endAt: nil)
    require(c.removed.contains("prior-launch.in-flight") && b.pendingReminderID == nil, "relaunch cancels interrupted add")
    require(UserDefaults.standard.string(forKey: pendingKey) == nil, "relaunch clears interrupted handle")
}
// Invalid, expired, and over-limit values never become reminders.
for seconds: Double in [-1, 240 * 60 + 30] {
    let (b, c) = fresh()
    b.syncFocusReminder(endAt: expiry(seconds)); c.replySettings()
    require(c.adds.isEmpty && b.activeReminderID == nil, "invalid remaining interval rejected")
}
for endAt in [Double.nan, Double.infinity, -Double.infinity] {
    let (b, c) = fresh()
    b.syncFocusReminder(endAt: endAt)
    require(c.adds.isEmpty && b.activeReminderID == nil && b.pendingReminderID == nil, "nonfinite timestamp rejected")
}
do {
    let (b, c) = fresh(); b.syncFocusReminder(endAt: expiry(0.75)); c.replySettings()
    require(c.adds.count == 1 && c.adds[0].0.trigger.timeInterval == 1, "positive subsecond remainder retained")
}
// Missing permission leaves no false active ID; provisional permission is usable.
for status: AuthorizationStatus in [.denied, .notDetermined] {
    let (b, c) = fresh(); b.syncFocusReminder(endAt: expiry(60)); c.replySettings(0, status)
    require(c.adds.isEmpty && UserDefaults.standard.string(forKey: key) == nil, "unauthorized does not persist")
}
do {
    let (b, c) = fresh(); b.syncFocusReminder(endAt: expiry(60)); c.replySettings(0, .provisional)
    require(c.adds.count == 1, "provisional authorization schedules")
}
// Old settings callbacks cannot schedule after cancel or a replacement.
do {
    let (b, c) = fresh(); b.syncFocusReminder(endAt: expiry(60)); b.syncFocusReminder(endAt: nil)
    c.replySettings(); require(c.adds.isEmpty, "cancel invalidates stale settings")
}
do {
    let (b, c) = fresh(); b.syncFocusReminder(endAt: expiry(60)); b.syncFocusReminder(endAt: expiry(120))
    c.replySettings(1); c.replySettings(0)
    require(c.adds.count == 1 && c.adds[0].0.trigger.timeInterval > 110, "newest settings wins")
}
// A cancelled in-flight add that succeeds late must remove only its own request.
do {
    let (b, c) = fresh(); b.syncFocusReminder(endAt: expiry(60)); c.replySettings()
    let oldID = c.adds[0].0.identifier
    b.syncFocusReminder(endAt: expiry(120)); require(c.removed.contains(oldID), "replacement cancels in-flight ID immediately")
    c.replySettings(1); c.finishAdd(1)
    let newID = c.adds[1].0.identifier
    c.finishAdd(0)
    require(c.pending.count == 1 && c.pending[newID] != nil, "late old success cannot leave duplicate or cancel replacement")
    require(b.activeReminderID == newID && UserDefaults.standard.string(forKey: key) == newID, "late old success cannot overwrite persistence")
}
do {
    let (b, c) = fresh(); b.syncFocusReminder(endAt: expiry(60)); c.replySettings()
    b.syncFocusReminder(endAt: expiry(120)); c.replySettings(1)
    let newID = c.adds[1].0.identifier
    c.finishAdd(0)
    require(b.pendingReminderID == newID && UserDefaults.standard.string(forKey: pendingKey) == newID, "stale success preserves newer in-flight handle")
    c.finishAdd(1)
    require(c.pending.count == 1 && c.pending[newID] != nil, "replacement still accepts after stale cleanup")
}
do {
    let (b, c) = fresh(); b.syncFocusReminder(endAt: expiry(60)); c.replySettings()
    b.syncFocusReminder(endAt: nil); c.finishAdd()
    require(c.pending.isEmpty && UserDefaults.standard.string(forKey: key) == nil, "late success after pause is removed")
}
do {
    let (b, c) = fresh(); b.syncFocusReminder(endAt: expiry(60)); c.replySettings(); c.finishAdd(error: TestError())
    require(b.activeReminderID == nil && b.pendingReminderID == nil && c.pending.isEmpty, "failed add cleans state")
    require(UserDefaults.standard.string(forKey: key) == nil && b.errors.count == 1, "failed add reports error without persistence")
    require(UserDefaults.standard.string(forKey: pendingKey) == nil, "failed add clears persisted pending handle")
}
// Permission failure is not a denial; the UI receives an error without granted.
do {
    let (b, c) = fresh(); b.requestReminderPermission(); c.permissions[0](false, TestError())
    require(b.events[0].0 == "nativeReminderPermission" && b.events[0].1["error"] is String, "permission error reported")
    require(b.events[0].1["granted"] == nil, "permission error is not a denial")
}
for granted in [false, true] {
    let (b, c) = fresh(); b.requestReminderPermission(); c.permissions[0](granted, nil)
    require(b.events[0].1["granted"] as? Bool == granted && b.events[0].1["error"] == nil, "permission result preserved")
}
// Repeated planner renders keep the same accepted or in-flight request intact.
do {
    let (b, c) = fresh(), deadline = expiry(60)
    b.syncFocusReminder(endAt: deadline); c.replySettings()
    let id = c.adds[0].0.identifier, removed = c.removed.count
    b.syncFocusReminder(endAt: deadline)
    require(c.adds.count == 1 && c.settings.count == 1 && c.removed.count == removed, "same deadline preserves in-flight request")
    require(b.pendingReminderID == id, "same deadline retains pending handle")
    c.finishAdd(); b.syncFocusReminder(endAt: deadline)
    require(c.adds.count == 1 && b.activeReminderID == id && c.pending[id] != nil, "same deadline preserves accepted request")
    b.syncFocusReminder(endAt: nil)
    require(b.reminderEndAt == nil, "cancellation clears deadline")
}
// Foreground permission reconciliation bypasses the no-op guard.
do {
    let (b, c) = fresh(), deadline = expiry(60)
    b.syncFocusReminder(endAt: deadline); c.replySettings(); c.finishAdd()
    let oldID = c.adds[0].0.identifier
    let revokeQuery = c.settings.count
    b.syncFocusReminder(endAt: deadline, force: true); c.replySettings(revokeQuery, .denied)
    require(c.pending.isEmpty && b.activeReminderID == nil && c.removed.contains(oldID), "forced reconciliation cancels reminder after revocation")
    let restoreQuery = c.settings.count
    b.syncFocusReminder(endAt: deadline, force: true); c.replySettings(restoreQuery); c.finishAdd(1)
    require(c.adds.count == 2 && b.activeReminderID != oldID, "forced reconciliation restores permitted deadline")
}
// System status preserves each authorization distinction and delivery flags.
for (status, expected): (AuthorizationStatus, String) in [
    (.authorized, "allowed"), (.provisional, "quiet"), (.ephemeral, "temporary"),
    (.denied, "blocked"), (.notDetermined, "notRequested"), (.future, "unknown")
] {
    let (b, c) = fresh(); b.refreshReminderStatus()
    c.replySettings(0, status, alerts: .disabled, sounds: .enabled)
    require(b.events.isEmpty && c.pendingQueries.count == 1, "status waits for actual pending snapshot")
    c.replyPending()
    require(b.events.count == 1 && b.events[0].0 == "nativeReminderStatus", "status has dedicated event")
    require(b.events[0].1["authorization"] as? String == expected, "authorization status mapped")
    require(b.events[0].1["alerts"] as? Bool == false && b.events[0].1["sounds"] as? Bool == true, "sound and alert flags stay independent")
}
do {
    let (b, c) = fresh(); b.refreshReminderStatus()
    c.replySettings(0, .authorized, alerts: .enabled, sounds: .notSupported)
    c.replyPending()
    require(b.events[0].1["alerts"] as? Bool == true && b.events[0].1["sounds"] as? Bool == false, "unsupported sound is not enabled")
    require(c.permissions.isEmpty && c.adds.isEmpty, "status query never prompts or schedules")
}
do {
    let (b, c) = fresh(); b.refreshReminderStatus(); b.refreshReminderStatus()
    c.replySettings(1, .denied); c.replySettings(0, .authorized)
    c.replyPending()
    require(b.events.count == 1 && b.events[0].1["authorization"] as? String == "blocked", "stale status callback cannot overwrite latest status")
}
for failed in [false, true] {
    let (b, c) = fresh(); b.requestReminderPermission()
    c.permissions[0](true, failed ? TestError() : nil)
    require(c.settings.count == 1, "permission completion refreshes actual system status")
    c.replySettings(0, .provisional, alerts: .disabled, sounds: .disabled)
    c.replyPending()
    require(b.events.count == 2 && b.events[1].1["authorization"] as? String == "quiet", "permission result followed by system status")
}
// Temporary permission is treated consistently with the displayed status.
do {
    let (b, c) = fresh(); b.syncFocusReminder(endAt: expiry(60)); c.replySettings(0, .ephemeral)
    require(c.adds.count == 1, "temporary authorization schedules")
}
func request(_ id: String) -> UNNotificationRequest {
    UNNotificationRequest(identifier: id, content: UNMutableNotificationContent(),
                          trigger: UNTimeIntervalNotificationTrigger(timeInterval: 60, repeats: false))
}
// Only our exact legacy ID and dotted namespace contribute to pending status.
for (ids, expected): ([String], Bool) in [
    ([], false), (["other.reminder"], false), (["scheduler.focus.complete-foreign"], false),
    (["scheduler.focus.complete"], true), (["scheduler.focus.complete.session"], true)
] {
    let (b, c) = fresh(); b.refreshReminderStatus(); c.replySettings()
    c.replyPending(requests: ids.map(request))
    require(b.events.last?.1["pending"] as? Bool == expected, "pending snapshot filters focus namespace")
    require(c.adds.isEmpty && c.permissions.isEmpty, "pending check never reschedules or prompts")
}
// A later refresh wins even if an older pending query completes last.
do {
    let (b, c) = fresh(); b.refreshReminderStatus(); c.replySettings()
    b.refreshReminderStatus(); c.replySettings(1)
    c.replyPending(1, requests: []); c.replyPending(0, requests: [request("scheduler.focus.complete.old")])
    require(b.events.count == 1 && b.events[0].1["pending"] as? Bool == false, "out-of-order pending query cannot restore stale status")
}
// A schedule change invalidates a settings or pending query from before it.
do {
    let (b, c) = fresh(); b.refreshReminderStatus()
    b.syncFocusReminder(endAt: expiry(60)); c.replySettings(0)
    require(c.pendingQueries.isEmpty && b.events.isEmpty, "schedule change invalidates old settings query")
}
do {
    let (b, c) = fresh(); b.refreshReminderStatus(); c.replySettings()
    b.syncFocusReminder(endAt: expiry(60))
    c.replyPending(requests: [request("scheduler.focus.complete.old")])
    require(b.events.isEmpty, "schedule change invalidates old pending snapshot")
}
// Accepted add, failed add, and cancellation each cause a fresh actual snapshot.
do {
    let (b, c) = fresh(); b.syncFocusReminder(endAt: expiry(60)); c.replySettings(); c.finishAdd()
    require(c.settings.count == 2, "accepted add requests status refresh")
    c.replySettings(1); c.replyPending()
    require(b.events.last?.1["pending"] as? Bool == true, "accepted add reports actual pending request")
    b.syncFocusReminder(endAt: nil)
    require(c.settings.count == 3, "cancel requests status refresh")
    c.replySettings(2); c.replyPending(1)
    require(b.events.last?.1["pending"] as? Bool == false, "cancel reports no focus request")
}
do {
    let (b, c) = fresh(); b.syncFocusReminder(endAt: expiry(60)); c.replySettings(); c.finishAdd(error: TestError())
    require(c.settings.count == 2, "failed add requests status refresh")
    c.replySettings(1); c.replyPending()
    require(b.events.last?.1["pending"] as? Bool == false, "failed add does not claim pending")
}
// Acceptance invalidates an earlier pending query from the same scheduling generation.
do {
    let (b, c) = fresh(); b.syncFocusReminder(endAt: expiry(60)); c.replySettings()
    b.refreshReminderStatus(); c.replySettings(1)
    c.finishAdd(); c.replyPending(requests: [])
    require(b.events.isEmpty, "accepted add invalidates pre-acceptance pending snapshot")
    c.replySettings(2); c.replyPending(1)
    require(b.events.last?.1["pending"] as? Bool == true, "new accepted snapshot wins")
}
// Foreground focus completion is already announced in the planner; other types remain audible.
for (id, silent) in [("scheduler.focus.complete", true), ("scheduler.focus.complete.session", true),
                     ("other.reminder", false), ("scheduler.focus.complete-foreign", false)] {
    let (b, c) = fresh(); var result: UNNotificationPresentationOptions?
    b.webView = TestWebView(isLoading: false)
    b.userNotificationCenter(c, willPresent: UNNotification(request: request(id))) { result = $0 }
    require(result != nil, "foreground delegate always completes")
    require(result == (silent ? [] : [.banner, .sound]), "foreground presentation respects focus namespace")
    require(b.webView?.readOffMain == false, "foreground WebKit state is read on main")
}
// A missing, loading, or failed planner must retain the system notification.
for (hasView, isLoading, loadError) in [(false, false, false), (true, true, false), (true, false, true)] {
    let (b, c) = fresh(); var result: UNNotificationPresentationOptions?
    if hasView { b.webView = TestWebView(isLoading: isLoading) }
    b.loadingError = loadError ? "Planner unavailable" : nil
    b.userNotificationCenter(c, willPresent: UNNotification(request: request("scheduler.focus.complete.session"))) { result = $0 }
    require(result == [.banner, .sound], "unavailable foreground planner preserves notification fallback")
    require(b.webView?.readOffMain != true, "fallback WebKit access stays on main")
}
print("PASS: \(checks) native reminder lifecycle assertions; controlled Swift fakes, not iOS delivery.")
'''


def main():
    swift = shutil.which('swiftc')
    if not swift:
        raise RuntimeError('Install Swift to execute native reminder lifecycle checks')
    source = (ROOT / 'Scheduler/SchedulerApp.swift').read_text(encoding='utf-8')
    props = source[source.index('    private var reminderGeneration'):source.index('    override init()', source.index('    private var reminderGeneration'))]
    # Extract only reminder logic; UIKit Settings navigation remains an Apple-only check.
    methods = ''
    for name in ('syncFocusReminder', 'requestReminderPermission', 'refreshReminderStatus', 'userNotificationCenter'):
        prefix = '    func ' if name == 'userNotificationCenter' else '    private func '
        start = source.index(prefix + name + '(')
        body = source.index('{', start)
        depth = 1
        end = body + 1
        while depth:
            depth += (source[end] == '{') - (source[end] == '}')
            end += 1
        methods += source[start:end] + '\n'
    bridge = 'final class Bridge {\n' + (props + methods).replace('private ', '') + r'''
    var errors: [String] = []
    var events: [(String, [String: Any])] = []
    var webView: TestWebView?
    var loadingError: String?
    func status(_ message: String, error: Bool = false) { if error { errors.append(message) } }
    func dispatch(_ event: String, detail: [String: Any]) { events.append((event, detail)) }
}
'''
    if not re.search(r'id="focus-duration"[^>]*max="240"', (ROOT / 'Application.html').read_text(encoding='utf-8')):
        raise ValueError('Review reminder bound: planner no longer declares a 240-minute maximum')
    with tempfile.TemporaryDirectory(prefix='orbiter-reminder-tests-') as directory:
        test = Path(directory) / 'main.swift'
        binary = Path(directory) / ('reminder-tests.exe' if __import__('sys').platform == 'win32' else 'reminder-tests')
        test.write_text(MOCKS + bridge + CASES, encoding='utf-8')
        subprocess.run([swift, str(test), '-o', str(binary)], check=True)
        subprocess.run([str(binary)], check=True)


if __name__ == '__main__':
    main()
