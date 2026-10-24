import Foundation

enum HealthImportKind: String, CaseIterable {
    case energy, protein, carbohydrate, fat, sleep, steps
    var unit: String {
        switch self {
        case .energy: return "kcal"
        case .protein, .carbohydrate, .fat: return "g"
        case .steps: return "count"
        case .sleep: return "sleepCategory"
        }
    }
}

struct HealthImportSample {
    let id: String
    let type: HealthImportKind
    let start: Date
    let end: Date
    let value: Double
    let sourceId: String
    let sourceName: String
    var sleepState: String? = nil
    var sleepCategory: String? = nil

    func dictionary(using formatter: ISO8601DateFormatter) -> [String: Any] {
        var result: [String: Any] = ["id": id, "type": type.rawValue,
            "start": formatter.string(from: start), "end": formatter.string(from: end),
            "value": value, "unit": type.unit, "sourceId": sourceId, "sourceName": sourceName]
        if let sleepState { result["sleepState"] = sleepState }
        if let sleepCategory { result["sleepCategory"] = sleepCategory }
        return result
    }
}

enum HealthImportFailure: Error { case invalid, tooLarge }

// Projection and bounded delta merge only. No persistence, authorization claims,
// meal reconstruction, or source-specific assumptions belong in this core.
enum HealthImportCore {
    static let maximumRecords = 5000

    static func merge(current: [String: HealthImportSample], upserts: [HealthImportSample],
                      deletedIds: [String]) throws -> [String: HealthImportSample] {
        guard upserts.count + deletedIds.count <= maximumRecords else { throw HealthImportFailure.tooLarge }
        let deleted = Set(deletedIds)
        guard deleted.allSatisfy({ UUID(uuidString: $0) != nil }) else { throw HealthImportFailure.invalid }
        var result = current
        for id in deleted { result.removeValue(forKey: id) }
        for sample in upserts {
            guard UUID(uuidString: sample.id) != nil, sample.value.isFinite, sample.value >= 0,
                  sample.start.timeIntervalSince1970.isFinite, sample.end.timeIntervalSince1970.isFinite,
                  sample.end >= sample.start, !sample.sourceId.isEmpty,
                  sample.sourceId.utf8.count <= 512, sample.sourceName.utf8.count <= 512 else {
                throw HealthImportFailure.invalid
            }
            // A deletion explicitly returned in this transaction wins over an
            // upsert with the same UUID; an empty result never implies deletion.
            if !deleted.contains(sample.id) { result[sample.id] = sample }
        }
        guard result.count <= maximumRecords else { throw HealthImportFailure.tooLarge }
        return result
    }

    static func summary(samples: [HealthImportSample], range: DateInterval) -> [String: Any] {
        // UUID dedup prevents repeated imports; different apps can log the same
        // meal under different UUIDs, so nutrition stays separated by source.
        let unique = Dictionary(samples.map { ($0.id, $0) }, uniquingKeysWith: { _, last in last })
        var sources: [String: [String: Any]] = [:]
        var intervals: [(Date, Date)] = []
        for sample in unique.values {
            if sample.type == .sleep, sample.sleepState == "asleep" {
                let start = max(sample.start, range.start), end = min(sample.end, range.end)
                if end > start { intervals.append((start, end)) }
                continue
            }
            guard sample.start >= range.start, sample.start < range.end else { continue }
            let field: String
            switch sample.type {
            case .energy: field = "energyKcal"
            case .protein: field = "proteinG"
            case .carbohydrate: field = "carbohydrateG"
            case .fat: field = "fatG"
            default: continue // Steps are supplied only by HealthKit statistics.
            }
            var source = sources[sample.sourceId] ?? ["sourceId": sample.sourceId, "sourceName": sample.sourceName]
            source[field] = (source[field] as? Double ?? 0) + sample.value
            sources[sample.sourceId] = source
        }
        intervals.sort { $0.0 < $1.0 }
        var seconds = 0.0, run: (Date, Date)?
        for interval in intervals {
            if let previous = run {
                if interval.0 <= previous.1 { run = (previous.0, max(previous.1, interval.1)) }
                else { seconds += previous.1.timeIntervalSince(previous.0); run = interval }
            } else { run = interval }
        }
        if let run { seconds += run.1.timeIntervalSince(run.0) }
        let ordered = sources.keys.sorted().compactMap { sources[$0] }
        var nutrition: [String: Any] = ["selectionRequired": ordered.count > 1, "sources": ordered]
        if ordered.count == 1 { nutrition["total"] = ordered[0] }
        var result: [String: Any] = ["nutrition": nutrition]
        if !intervals.isEmpty { result["sleepSeconds"] = seconds }
        return result
    }
}
