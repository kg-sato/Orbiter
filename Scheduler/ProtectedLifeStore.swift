import Foundation
#if canImport(CoreFoundation)
import CoreFoundation
#endif
#if os(iOS)
import UIKit
import Darwin
#endif

// Source foundation only. The shipping bridge must stay disabled until native
// consent, Apple SDK and physical lock/backup-exclusion checks are complete.
enum LifeStoreStatus: String {
    case ok, optInRequired, locked, corrupt, conflict, invalid, error, unavailable
}

struct LifeStoreResult {
    let status: LifeStoreStatus
    var revision: Int? = nil
    var json: String? = nil
    var dictionary: [String: Any] {
        var value: [String: Any] = ["status": status.rawValue, "owner": "device"]
        if let revision { value["revision"] = revision }
        if let json { value["json"] = json }
        return value
    }
}

enum LifeStoreFailure: Error { case locked, corrupt, invalid, io }

// A small storage boundary permits controlled Foundation tests without claiming
// that a desktop fake provides iOS file protection or backup exclusion.
protocol LifeStoreStorage {
    var protectedDataAvailable: Bool { get }
    func read() throws -> Data?
    func write(_ data: Data) throws
}

struct LifeStoreRecord {
    let revision: Int
    let json: String?
}

enum LifeStoreCodec {
    static let maximumBytes = 5 * 1024 * 1024
    static let maximumEnvelopeBytes = maximumBytes + 4096
    static let maximumRevision = 9_007_199_254_740_991

    private static func integer(_ value: Any?) -> Int? {
        guard let number = value as? NSNumber,
              number.doubleValue >= 0, number.doubleValue <= Double(maximumRevision),
              number.doubleValue.rounded(.towardZero) == number.doubleValue else { return nil }
        #if canImport(CoreFoundation)
        guard CFGetTypeID(number) != CFBooleanGetTypeID() else { return nil }
        #else
        // Swift's Windows Foundation has no CoreFoundation module.
        guard String(cString: number.objCType) != "c" else { return nil }
        #endif
        return number.intValue
    }

    static func payload(_ json: String) throws -> [String: Any] {
        let data = Data(json.utf8)
        guard data.count <= maximumBytes,
              let value = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              integer(value["schemaVersion"]) == 1 else { throw LifeStoreFailure.invalid }
        return value
    }

    static func encode(revision: Int, json: String?) throws -> Data {
        let value: Any
        if let json { value = try payload(json) } else { value = NSNull() }
        let data = try JSONSerialization.data(withJSONObject: [
            "schemaVersion": 1, "owner": "device", "revision": revision, "payload": value
        ], options: [.sortedKeys])
        guard data.count <= maximumEnvelopeBytes else { throw LifeStoreFailure.invalid }
        return data
    }

    static func decode(_ data: Data?) throws -> LifeStoreRecord {
        guard let data else { return LifeStoreRecord(revision: 0, json: nil) }
        guard data.count <= maximumEnvelopeBytes,
              let value = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              integer(value["schemaVersion"]) == 1, value["owner"] as? String == "device",
              let revision = integer(value["revision"]), revision > 0,
              let payload = value["payload"] else { throw LifeStoreFailure.corrupt }
        if payload is NSNull { return LifeStoreRecord(revision: revision, json: nil) }
        guard let object = payload as? [String: Any], integer(object["schemaVersion"]) == 1,
              let encoded = try? JSONSerialization.data(withJSONObject: object, options: [.sortedKeys]),
              encoded.count <= maximumBytes, let json = String(data: encoded, encoding: .utf8) else {
            throw LifeStoreFailure.corrupt
        }
        return LifeStoreRecord(revision: revision, json: json)
    }
}

final class ProtectedLifeStore {
    static let shared = ProtectedLifeStore()
    private let storage: LifeStoreStorage?
    private let queue = DispatchQueue(label: "com.kgsato.orbit.protected-life-store")

    private init() {
        #if os(iOS)
        storage = IOSLifeStoreStorage()
        #else
        storage = nil
        #endif
    }

    // Internal controlled-test injection; the default backend exists only on iOS.
    init(storage: LifeStoreStorage) { self.storage = storage }

    func read(owner: String, consent: Bool) -> LifeStoreResult {
        perform(owner: owner, consent: consent) { storage in
            let current = try LifeStoreCodec.decode(storage.read())
            return LifeStoreResult(status: .ok, revision: current.revision, json: current.json)
        }
    }

    func write(owner: String, expectedRevision: Int, json: String, consent: Bool) -> LifeStoreResult {
        mutate(owner: owner, expectedRevision: expectedRevision, json: json, consent: consent)
    }

    func delete(owner: String, expectedRevision: Int, consent: Bool) -> LifeStoreResult {
        // Keep only a revision tombstone, so a stale pre-deletion write cannot
        // recreate health data by mistaking the deleted store for a new store.
        mutate(owner: owner, expectedRevision: expectedRevision, json: nil, consent: consent)
    }

    private func mutate(owner: String, expectedRevision: Int, json: String?, consent: Bool) -> LifeStoreResult {
        guard expectedRevision >= 0, expectedRevision < LifeStoreCodec.maximumRevision else {
            return LifeStoreResult(status: .invalid)
        }
        return perform(owner: owner, consent: consent) { storage in
            if let json { _ = try LifeStoreCodec.payload(json) }
            let current = try LifeStoreCodec.decode(storage.read())
            guard current.revision == expectedRevision else {
                return LifeStoreResult(status: .conflict, revision: current.revision)
            }
            let revision = current.revision + 1
            let encoded = try LifeStoreCodec.encode(revision: revision, json: json)
            try storage.write(encoded)
            let saved = try LifeStoreCodec.decode(encoded)
            return LifeStoreResult(status: .ok, revision: saved.revision, json: saved.json)
        }
    }

    private func perform(owner: String, consent: Bool,
                         operation: (LifeStoreStorage) throws -> LifeStoreResult) -> LifeStoreResult {
        guard owner == "device" else { return LifeStoreResult(status: .invalid) }
        guard consent else { return LifeStoreResult(status: .optInRequired) }
        guard let storage else { return LifeStoreResult(status: .unavailable) }
        // Read UIKit availability before entering the serial queue; a caller on
        // main must not wait for queue work that synchronously waits on main.
        guard storage.protectedDataAvailable else { return LifeStoreResult(status: .locked) }
        return queue.sync {
            do { return try operation(storage) }
            catch LifeStoreFailure.locked { return LifeStoreResult(status: .locked) }
            catch LifeStoreFailure.corrupt { return LifeStoreResult(status: .corrupt) }
            catch LifeStoreFailure.invalid { return LifeStoreResult(status: .invalid) }
            catch { return LifeStoreResult(status: .error) } // Never expose payloads or raw paths.
        }
    }
}

#if os(iOS)
private final class IOSLifeStoreStorage: LifeStoreStorage {
    private let files = FileManager.default
    var protectedDataAvailable: Bool {
        if Thread.isMainThread { return UIApplication.shared.isProtectedDataAvailable }
        return DispatchQueue.main.sync { UIApplication.shared.isProtectedDataAvailable }
    }

    private func secure(_ url: URL) throws {
        try files.setAttributes([.protectionKey: FileProtectionType.complete], ofItemAtPath: url.path)
        var excluded = URLResourceValues()
        excluded.isExcludedFromBackup = true
        var mutableURL = url
        try mutableURL.setResourceValues(excluded)
        let attributes = try files.attributesOfItem(atPath: url.path)
        let protection = (attributes[.protectionKey] as? FileProtectionType)?.rawValue ??
            (attributes[.protectionKey] as? String)
        let actual = try url.resourceValues(forKeys: [.isExcludedFromBackupKey, .isSymbolicLinkKey])
        guard protection == FileProtectionType.complete.rawValue,
              actual.isExcludedFromBackup == true, actual.isSymbolicLink != true else { throw LifeStoreFailure.io }
    }

    private func directory() throws -> URL {
        let base = try files.url(for: .applicationSupportDirectory, in: .userDomainMask,
                                 appropriateFor: nil, create: true)
        let directory = base.appendingPathComponent("OrbiterLife", isDirectory: true)
        if files.fileExists(atPath: directory.path) {
            let values = try directory.resourceValues(forKeys: [.isDirectoryKey, .isSymbolicLinkKey])
            guard values.isDirectory == true, values.isSymbolicLink != true else { throw LifeStoreFailure.corrupt }
        } else {
            try files.createDirectory(at: directory, withIntermediateDirectories: false,
                                      attributes: [.protectionKey: FileProtectionType.complete])
        }
        try secure(directory) // Exclude/protect the container before any health bytes exist.
        // Remove protected/excluded staging files left by an interrupted save.
        // The serial store never has an active staging writer during this step.
        for item in try files.contentsOfDirectory(at: directory, includingPropertiesForKeys: nil) {
            let name = item.lastPathComponent
            if name.hasPrefix(".pending-"), UUID(uuidString: String(name.dropFirst(9))) != nil {
                try files.removeItem(at: item)
            }
        }
        return directory
    }

    private func checkedFile(_ url: URL) throws {
        let values = try url.resourceValues(forKeys: [.isRegularFileKey, .isSymbolicLinkKey])
        guard values.isRegularFile == true, values.isSymbolicLink != true else { throw LifeStoreFailure.corrupt }
        try secure(url)
    }

    func read() throws -> Data? {
        do {
            let target = try directory().appendingPathComponent("device.json")
            if !files.fileExists(atPath: target.path) { return nil }
            try checkedFile(target)
            let handle = try FileHandle(forReadingFrom: target)
            defer { try? handle.close() }
            var data = Data()
            while let part = try handle.read(upToCount: 64 * 1024), !part.isEmpty {
                guard data.count + part.count <= LifeStoreCodec.maximumEnvelopeBytes else { throw LifeStoreFailure.corrupt }
                data.append(part)
            }
            return data
        } catch { throw mapped(error) }
    }

    func write(_ data: Data) throws {
        var temporary: URL?
        defer { if let temporary { try? files.removeItem(at: temporary) } }
        do {
            let container = try directory()
            let target = container.appendingPathComponent("device.json")
            if files.fileExists(atPath: target.path) { try checkedFile(target) }
            let staging = container.appendingPathComponent(".pending-" + UUID().uuidString)
            temporary = staging
            guard files.createFile(atPath: staging.path, contents: nil,
                                   attributes: [.protectionKey: FileProtectionType.complete,
                                                .posixPermissions: 0o600]) else { throw LifeStoreFailure.io }
            try secure(staging) // Both attributes verified BEFORE writing payload bytes.
            let handle = try FileHandle(forWritingTo: staging)
            do {
                try handle.write(contentsOf: data)
                try handle.synchronize()
                try handle.close()
            } catch { try? handle.close(); throw error }
            try secure(staging)
            // Same-directory POSIX rename atomically replaces the file while
            // preserving the protected/excluded staging inode and its metadata.
            let result = staging.path.withCString { source in
                target.path.withCString { destination in Darwin.rename(source, destination) }
            }
            guard result == 0 else { throw NSError(domain: NSPOSIXErrorDomain, code: Int(errno)) }
            temporary = nil
            try checkedFile(target)
        } catch { throw mapped(error) }
    }

    private func mapped(_ error: Error) -> Error {
        if let failure = error as? LifeStoreFailure { return failure }
        let value = error as NSError
        if (value.domain == NSCocoaErrorDomain && [NSFileReadNoPermissionError, NSFileWriteNoPermissionError].contains(value.code)) ||
            (value.domain == NSPOSIXErrorDomain && [Int(EACCES), Int(EPERM)].contains(value.code)) {
            return LifeStoreFailure.locked
        }
        return LifeStoreFailure.io
    }
}
#endif
