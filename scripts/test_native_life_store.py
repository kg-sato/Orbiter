"""Compile real Foundation store logic with a controlled in-memory disk.

No health fixtures or persisted test data. Does not claim iOS file-protection,
backup-exclusion, Apple SDK compilation, or physical-device verification.
"""
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parent.parent

CASES = r'''
import Foundation
final class MemoryStorage: LifeStoreStorage {
    var protectedDataAvailable = true
    var data: Data?
    var reads = 0, writes = 0
    var readFailure: Error?, writeFailure: Error?
    func read() throws -> Data? {
        reads += 1
        if let readFailure { throw readFailure }
        return data
    }
    func write(_ data: Data) throws {
        writes += 1
        if let writeFailure { throw writeFailure }
        self.data = data
    }
}
let valid = "{\"schemaVersion\":1,\"entries\":[]}"
var checks = 0
func check(_ condition: @autoclosure () -> Bool, _ name: String) {
    if !condition() { fatalError("FAILED: " + name) }
    checks += 1
}
func fresh() -> (ProtectedLifeStore, MemoryStorage) {
    let disk = MemoryStorage()
    return (ProtectedLifeStore(storage: disk), disk)
}
final class ResultCounts: @unchecked Sendable {
    let lock = NSLock()
    var winners = 0, conflicts = 0
    func record(_ status: LifeStoreStatus) {
        lock.lock()
        defer { lock.unlock() }
        if status == .ok { winners += 1 }
        if status == .conflict { conflicts += 1 }
    }
}
do {
    let (store, disk) = fresh()
    check(store.read(owner: "device", consent: false).status == .optInRequired, "read requires explicit consent")
    check(store.write(owner: "device", expectedRevision: 0, json: valid, consent: false).status == .optInRequired, "write requires consent")
    check(store.delete(owner: "device", expectedRevision: 0, consent: false).status == .optInRequired, "delete requires consent")
    check(disk.reads == 0 && disk.writes == 0, "no IO before opt-in")
    check(store.read(owner: "other", consent: true).status == .invalid, "foreign owner rejected")
    check(store.write(owner: "../device", expectedRevision: 0, json: valid, consent: true).status == .invalid, "path owner rejected")
    check(store.delete(owner: "", expectedRevision: 0, consent: true).status == .invalid, "empty owner rejected")
    check(disk.reads == 0 && disk.writes == 0, "invalid owner has no IO")
    disk.protectedDataAvailable = false
    check(store.read(owner: "device", consent: true).status == .locked, "locked read")
    check(store.write(owner: "device", expectedRevision: 0, json: valid, consent: true).status == .locked, "locked write")
    check(store.delete(owner: "device", expectedRevision: 0, consent: true).status == .locked, "locked delete")
    check(disk.reads == 0 && disk.writes == 0, "locked store has no IO")
}
do {
    let (store, disk) = fresh()
    let empty = store.read(owner: "device", consent: true)
    check(empty.status == .ok && empty.revision == 0 && empty.json == nil, "empty revision zero")
    let first = store.write(owner: "device", expectedRevision: 0, json: valid, consent: true)
    check(first.status == .ok && first.revision == 1 && first.json != nil, "first CAS write")
    check(store.read(owner: "device", consent: true).json == first.json, "read roundtrip")
    let conflict = store.write(owner: "device", expectedRevision: 0, json: valid, consent: true)
    check(conflict.status == .conflict && conflict.revision == 1 && conflict.json == nil, "stale write conflicts without payload disclosure")
    check(disk.writes == 1, "conflict does not write")
    check(store.delete(owner: "device", expectedRevision: 0, consent: true).status == .conflict, "stale delete conflicts")
    let deleted = store.delete(owner: "device", expectedRevision: 1, consent: true)
    check(deleted.status == .ok && deleted.revision == 2 && deleted.json == nil, "delete advances tombstone revision")
    let read = store.read(owner: "device", consent: true)
    check(read.status == .ok && read.revision == 2 && read.json == nil, "deleted payload stays absent")
    check(!String(data: disk.data!, encoding: .utf8)!.contains("entries"), "tombstone contains no prior payload")
    check(store.write(owner: "device", expectedRevision: 0, json: valid, consent: true).status == .conflict, "deletion prevents stale-create ABA")
    check(store.write(owner: "device", expectedRevision: 2, json: valid, consent: true).revision == 3, "new revision after deletion")
    check(first.dictionary["owner"] as? String == "device" && first.dictionary["status"] as? String == "ok", "bridge dictionary contract")
    check(first.dictionary["json"] is String && first.dictionary["revision"] as? Int == 1, "bridge payload/revision fields")
}
for json in ["", "null", "[]", "{invalid", "{}", "{\"schemaVersion\":2}", "{\"schemaVersion\":true}", "{\"schemaVersion\":\"1\"}"] {
    let (store, disk) = fresh()
    check(store.write(owner: "device", expectedRevision: 0, json: json, consent: true).status == .invalid, "invalid schema/JSON rejected")
    check(disk.writes == 0, "invalid JSON cannot replace data")
}
do {
    let (store, disk) = fresh()
    let oversized = "{\"schemaVersion\":1,\"note\":\"" + String(repeating: "x", count: LifeStoreCodec.maximumBytes) + "\"}"
    check(store.write(owner: "device", expectedRevision: 0, json: oversized, consent: true).status == .invalid, "5MiB UTF8 bound")
    check(disk.writes == 0, "oversize write leaves disk alone")
    check(store.write(owner: "device", expectedRevision: -1, json: valid, consent: true).status == .invalid, "negative expected revision rejected")
    check(store.write(owner: "device", expectedRevision: LifeStoreCodec.maximumRevision, json: valid, consent: true).status == .invalid, "revision overflow rejected")
}
for corrupt in ["garbage", "{}", "{\"schemaVersion\":1,\"owner\":\"other\",\"revision\":1,\"payload\":null}", "{\"schemaVersion\":1,\"owner\":\"device\",\"revision\":true,\"payload\":null}", "{\"schemaVersion\":1,\"owner\":\"device\",\"revision\":0,\"payload\":null}"] {
    let (store, disk) = fresh(); disk.data = Data(corrupt.utf8)
    check(store.read(owner: "device", consent: true).status == .corrupt, "corrupt store explicit")
    check(store.write(owner: "device", expectedRevision: 0, json: valid, consent: true).status == .corrupt, "corrupt store not overwritten")
    check(store.delete(owner: "device", expectedRevision: 0, consent: true).status == .corrupt, "corrupt delete not silent reset")
    check(disk.writes == 0 && disk.data == Data(corrupt.utf8), "corrupt bytes preserved")
}
do {
    let (store, disk) = fresh(); disk.readFailure = LifeStoreFailure.locked
    check(store.read(owner: "device", consent: true).status == .locked, "mid-read lock explicit")
    disk.readFailure = LifeStoreFailure.io
    check(store.read(owner: "device", consent: true).status == .error, "read error explicit")
    disk.readFailure = nil; disk.writeFailure = LifeStoreFailure.io
    check(store.write(owner: "device", expectedRevision: 0, json: valid, consent: true).status == .error, "write error explicit")
    check(store.read(owner: "device", consent: true).revision == 0, "failed write cannot advance revision")
}
// Serialized competing CAS operations: exactly one caller may own revision zero.
do {
    let (store, disk) = fresh()
    let group = DispatchGroup(), counts = ResultCounts()
    for _ in 0..<12 {
        group.enter()
        DispatchQueue.global().async {
            let result = store.write(owner: "device", expectedRevision: 0, json: valid, consent: true)
            counts.record(result.status)
            group.leave()
        }
    }
    group.wait()
    check(counts.winners == 1 && counts.conflicts == 11 && disk.writes == 1, "serialized CAS admits exactly one writer")
}
#if !os(iOS)
check(ProtectedLifeStore.shared.read(owner: "device", consent: true).status == .unavailable, "native production backend unavailable off iOS")
#endif
'''

BRIDGE_CASES = r'''
do {
    let bridge = DisabledBridge()
    bridge.handleLifeStore(["requestId": "capabilities.1", "operation": "capabilities", "consent": true])
    check(bridge.events.count == 1 && bridge.events[0].0 == "nativeLifeStoreResult", "capability response event")
    let value = bridge.events[0].1["value"] as? [String: Any]
    check(value?["read"] as? Bool == false && value?["write"] as? Bool == false, "shipping native read/write gates closed")
    check(value?["owner"] as? String == "device" && value?["cloud"] as? Bool == false, "capabilities device-only no cloud")
    check(value?["healthKit"] as? Bool == false, "no HealthKit permission/capability")
    for operation in ["read", "write", "clear", "requestAccess"] {
        for owner in ["device", "other", "../escape"] {
            bridge.handleLifeStore(["requestId": "forged.1", "operation": operation, "owner": owner,
                                    "consent": true, "available": true, "expectedRevision": 0,
                                    "json": NSNull()])
            let error = bridge.events.last?.1["error"] as? [String: Any]
            check(bridge.events.last?.1["ok"] as? Bool == false && error?["code"] as? String == "unavailable",
                  "forged web consent/owner/payload cannot enable CRUD")
            check(bridge.events.last?.1["value"] == nil, "disabled CRUD exposes no stored JSON")
        }
    }
    let before = bridge.events.count
    for id in ["", "bad id", "../", String(repeating: "x", count: 81)] {
        bridge.handleLifeStore(["requestId": id, "operation": "read", "consent": true])
    }
    bridge.handleLifeStore(["operation": "read"])
    check(bridge.events.count == before, "malformed request IDs ignored")
    bridge.handleLifeStore(["requestId": "unknown.1", "operation": "enable"])
    let error = bridge.events.last?.1["error"] as? [String: Any]
    check(error?["code"] as? String == "invalid", "unknown bridge operation rejected")
    bridge.lifeStoreAccessRequest = "forged.native"
    bridge.confirmLifeStoreAccess()
    check(!bridge.lifeStoreConsent, "confirmation cannot bypass shipping gate")
}
do {
    // Synthetic future-enabled fixture; production constant remains false.
    let bridge = FutureConsentBridge()
    bridge.handleLifeStore(["requestId":"access.1", "operation":"requestAccess", "consent":true])
    check(bridge.lifeStoreConsentRequested && !bridge.lifeStoreConsent, "web intent only opens native confirmation")
    bridge.cancelLifeStoreAccess()
    check(!bridge.lifeStoreConsent && bridge.lifeStoreAccessRequest == nil, "native cancel keeps access closed")
    bridge.handleLifeStore(["requestId":"access.2", "operation":"requestAccess", "consent":true])
    bridge.confirmLifeStoreAccess()
    check(bridge.lifeStoreConsent && !bridge.lifeStoreConsentRequested, "native confirmation grants session intent")
    check((bridge.events.last?.1["value"] as? [String:Any])?["status"] as? String == "consented", "confirmation has correlated consent result")
    bridge.handleLifeStore(["requestId":"stop.1", "operation":"revoke"])
    check(!bridge.lifeStoreConsent && !bridge.healthConsent, "revoke immediately removes journal and Health consent")
}
print("PASS: \(checks) native life-store/disabled-bridge Foundation assertions; controlled disk, not iOS protection.")
'''


def main():
    swift = shutil.which('swiftc')
    if not swift:
        raise RuntimeError('Swift compiler required for Foundation storage checks')
    app = (ROOT / 'Scheduler/SchedulerApp.swift').read_text(encoding='utf-8')
    properties = app[app.index('    private let lifeStoreAvailable'):app.index('    private var reminderGeneration')]
    handler = app[app.index('    func cancelLifeStoreAccess('):app.index('    func userContentController(')]
    bridge = 'final class DisabledBridge {\n' + (properties + handler).replace('private ', '') + r'''
    var events: [(String, [String: Any])] = []
    var lifeStoreConsentRequested = false
    func cancelHealthAccess() { healthAccessRequest = nil }
    func dispatch(_ event: String, detail: [String: Any]) { events.append((event, detail)) }
}
'''
    with tempfile.TemporaryDirectory(prefix='orbiter-life-store-tests-') as directory:
        fixture = Path(directory) / 'main.swift'
        future = bridge.replace('class DisabledBridge', 'class FutureConsentBridge').replace('lifeStoreAvailable = false', 'lifeStoreAvailable = true')
        fixture.write_text(bridge + future + CASES + BRIDGE_CASES, encoding='utf-8')
        binary = Path(directory) / ('life-store-tests.exe' if sys.platform == 'win32' else 'life-store-tests')
        subprocess.run([swift, str(ROOT / 'Scheduler/ProtectedLifeStore.swift'), str(ROOT / 'Scheduler/HealthImportCore.swift'), str(ROOT / 'Scheduler/HealthKitReader.swift'), str(fixture), '-o', str(binary)], check=True)
        subprocess.run([str(binary)], check=True)


if __name__ == '__main__':
    main()
