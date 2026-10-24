"""Controlled Foundation projection and actual closed bridge; no Apple SDK/HealthKit execution."""
from pathlib import Path
import shutil
import subprocess
import tempfile
import sys

ROOT = Path(__file__).resolve().parent.parent
CASES = r'''
var checks = 0
func check(_ value: @autoclosure () -> Bool, _ name: String) {
    if !value() { fatalError(name) }; checks += 1
}
let begin = Date(timeIntervalSince1970: 1000), end = Date(timeIntervalSince1970: 2000)
let range = DateInterval(start: begin, end: end)
func sample(_ id: Int, _ kind: HealthImportKind = .energy, _ value: Double = 100,
            _ source: String = "fixture.a", _ start: Double = 1100, _ end: Double = 1200,
            _ state: String? = nil) -> HealthImportSample {
    HealthImportSample(id: String(format: "00000000-0000-0000-0000-%012d", id), type: kind,
        start: Date(timeIntervalSince1970: start), end: Date(timeIntervalSince1970: end),
        value: value, sourceId: source, sourceName: "Fictional source", sleepState: state)
}
let first = sample(1)
let initial = try HealthImportCore.merge(current: [:], upserts: [first, first], deletedIds: [])
check(initial.count == 1, "UUID dedup")
let emptyDelta = try HealthImportCore.merge(current: initial, upserts: [], deletedIds: [])
check(emptyDelta.count == 1, "empty read cannot delete")
let deleted = try HealthImportCore.merge(current: initial, upserts: [first], deletedIds: [first.id])
check(deleted.isEmpty, "explicit deletion wins")
for bad in [sample(2, .energy, -1), sample(2, .energy, .nan), sample(2, .energy, .infinity),
            sample(2, .energy, 1, "", 1100,1200), sample(2,.sleep,1,"fixture",1200,1100)] {
    do { _ = try HealthImportCore.merge(current: [:], upserts: [bad], deletedIds: []); fatalError("invalid accepted") }
    catch { checks += 1 }
}
do { _ = try HealthImportCore.merge(current: [:], upserts: [], deletedIds: ["bad"]); fatalError("bad ID accepted") }
catch { checks += 1 }
do { _ = try HealthImportCore.merge(current: [:], upserts: Array(repeating:first,count:5001), deletedIds: []); fatalError("overflow accepted") }
catch { checks += 1 }
let summary = HealthImportCore.summary(samples:[first,first,sample(2,.energy,200,"fixture.b"),sample(3,.steps,999)],range:range)
let nutrition = summary["nutrition"] as! [String:Any]
check(nutrition["selectionRequired"] as? Bool == true, "multiple sources require choice")
check(nutrition["total"] == nil, "no cross-source nutrition sum")
check(summary["steps"] == nil, "no raw steps aggregate")
check(summary["sleepSeconds"] == nil, "missing sleep is unknown")
let sources = nutrition["sources"] as! [[String:Any]]
check(sources.count == 2 && sources[0]["energyKcal"] as? Double == 100, "source totals UUID dedup")
check(sources[0]["proteinG"] == nil, "missing nutrient not zero")
let sleep = HealthImportCore.summary(samples:[sample(4,.sleep,1,"fixture.a",900,1400,"asleep"),
 sample(5,.sleep,1,"fixture.b",1300,2100,"asleep"),sample(6,.sleep,1,"fixture.a",1000,2000,"inBed")],range:range)
check(sleep["sleepSeconds"] as? Double == 1000, "sleep union clips range and excludes inBed")
let single = HealthImportCore.summary(samples:[first],range:range)["nutrition"] as! [String:Any]
check((single["total"] as? [String:Any])?["energyKcal"] as? Double == 100, "single-source total")
let outside = HealthImportCore.summary(samples:[sample(7,.energy,300,"fixture",2100,2200)],range:range)["nutrition"] as! [String:Any]
check((outside["sources"] as! [[String:Any]]).isEmpty,"outside range excluded")
let bridge = ClosedHealthBridge()
bridge.handleHealth(["requestId":"cap.1","operation":"capabilities","available":true,"consent":true])
let capability = bridge.events.last!.1["value"] as! [String:Any]
check(capability["available"] as? Bool == false,"shipping gate closed")
check(capability["cloud"] as? Bool == false && capability["readOnly"] as? Bool == true,"read-only no cloud")
for operation in ["requestAccess","read"] {
 bridge.handleHealth(["requestId":"forged.1","operation":operation,"available":true,"consent":true,"days":7])
 let error = bridge.events.last!.1["error"] as! [String:Any]
 check(error["code"] as? String == "unavailable","forged consent cannot activate")
}
check(!bridge.healthConsentRequested,"no native prompt with closed gate")
let before = bridge.events.count
for id in ["", "bad id", String(repeating:"x",count:81)] { bridge.handleHealth(["requestId":id,"operation":"read"]) }
check(bridge.events.count == before,"bad IDs ignored")
bridge.handleHealth(["requestId":"stop.1","operation":"disconnect"])
check((bridge.events.last!.1["value"] as? [String:Any])?["status"] as? String == "disconnected","disconnect available when gated")
check(!bridge.healthConsent,"disconnect clears intent")
print("PASS: \(checks) Health projection/closed native bridge assertions; no Apple SDK or live data.")
'''

def main():
    app = (ROOT / 'Scheduler/SchedulerApp.swift').read_text()
    methods = app[app.index('    private func healthReply('):app.index('    func cancelLifeStoreAccess(')]
    bridge = '''import Foundation
final class ClosedHealthBridge {
 let healthIntegrationAvailable = false, lifeStoreAvailable = false
 var lifeStoreConsent = false
 var lifeStoreAccessRequest: String?
 var healthConsent = false, healthGeneration = 0, healthConsentRequested = false
 var healthAccessRequest: String?
 var events: [(String,[String:Any])] = []
 func dispatch(_ event: String, detail: [String:Any]) { events.append((event,detail)) }
''' + methods.replace('private ', '') + '\n}\n'
    with tempfile.TemporaryDirectory(prefix='orbiter-health-tests-') as directory:
        fixture = Path(directory) / 'main.swift'
        fixture.write_text(bridge + CASES)
        binary = Path(directory) / ('health.exe' if sys.platform == 'win32' else 'health')
        subprocess.run([shutil.which('swiftc') or 'swiftc', str(ROOT/'Scheduler/HealthImportCore.swift'),
                        str(ROOT/'Scheduler/HealthKitReader.swift'), str(fixture), '-o',str(binary)],check=True)
        subprocess.run([str(binary)],check=True)

if __name__ == '__main__':
    main()
