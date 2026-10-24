import Foundation
#if os(iOS) && canImport(HealthKit)
import HealthKit
import UIKit

// Foreground/manual source foundation. Root bridge gating and native consent
// remain mandatory; no background observer, writes, cursor or health persistence.
final class HealthKitReader {
    static let shared = HealthKitReader()
    private let store = HKHealthStore()
    private let queue = DispatchQueue(label: "com.kgsato.orbit.health-reader")
    private var generation = 0
    private var queries: [HKQuery] = []
    private var completion: (([String: Any]) -> Void)?
    private var anchor: HKQueryAnchor?
    private var scopeStart: Date?
    private var scopeTimeZone: String?
    private var snapshot: [String: HealthImportSample] = [:]

    private var types: [(HealthImportKind, HKSampleType)] {
        var result: [(HealthImportKind, HKSampleType)] = []
        for (kind, identifier): (HealthImportKind, HKQuantityTypeIdentifier) in [
            (.energy, .dietaryEnergyConsumed), (.protein, .dietaryProtein),
            (.carbohydrate, .dietaryCarbohydrates), (.fat, .dietaryFat), (.steps, .stepCount)
        ] {
            if let type = HKObjectType.quantityType(forIdentifier: identifier) { result.append((kind, type)) }
        }
        if let type = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) { result.append((.sleep, type)) }
        return result
    }

    private func respond(_ value: [String: Any], to callback: @escaping ([String: Any]) -> Void) {
        DispatchQueue.main.async { callback(value) }
    }

    func requestAuthorization(completion callback: @escaping ([String: Any]) -> Void) {
        DispatchQueue.main.async {
            guard UIApplication.shared.applicationState == .active else {
                callback(["status": "background", "readAccess": "notDisclosed"]); return
            }
            guard HKHealthStore.isHealthDataAvailable(), self.types.count == HealthImportKind.allCases.count else {
                callback(["status": "unavailable", "readAccess": "notDisclosed"]); return
            }
            self.store.requestAuthorization(toShare: [], read: Set(self.types.map { $0.1 as HKObjectType })) { success, error in
                // Apple intentionally does not disclose read-permission decisions.
                self.respond(["status": success && error == nil ? "requestCompleted" : "error",
                              "readAccess": "notDisclosed"], to: callback)
            }
        }
    }

    func cancel() {
        queue.async {
            self.stopCurrent()
            self.anchor = nil; self.snapshot = [:]; self.scopeStart = nil; self.scopeTimeZone = nil
        }
    }

    private func stopCurrent() {
        generation += 1
        for query in queries { store.stop(query) }
        queries = []
        if let callback = completion { respond(["status": "cancelled", "readAccess": "notDisclosed"], to: callback) }
        completion = nil
    }

    func read(days: Int = 7, completion callback: @escaping ([String: Any]) -> Void) {
        guard (1...31).contains(days) else {
            respond(["status": "invalid", "readAccess": "notDisclosed"], to: callback); return
        }
        DispatchQueue.main.async {
            guard UIApplication.shared.applicationState == .active else {
                callback(["status": "background", "readAccess": "notDisclosed"]); return
            }
            guard HKHealthStore.isHealthDataAvailable() else {
                callback(["status": "unavailable", "readAccess": "notDisclosed"]); return
            }
            self.queue.async { self.begin(days: days, callback: callback) }
        }
    }

    private func finish(_ value: [String: Any], generation token: Int) {
        guard token == generation, let callback = completion else { return }
        for query in queries { store.stop(query) }
        queries = []; completion = nil
        respond(value, to: callback)
    }

    private func begin(days: Int, callback: @escaping ([String: Any]) -> Void) {
        stopCurrent()
        completion = callback
        let token = generation, now = Date(), calendar = Calendar.current
        guard let start = calendar.date(byAdding: .day, value: -(days - 1), to: calendar.startOfDay(for: now)),
              types.count == HealthImportKind.allCases.count else {
            finish(["status": "unavailable", "readAccess": "notDisclosed"], generation: token); return
        }
        let range = DateInterval(start: start, end: now)
        let timeZone = calendar.timeZone.identifier
        let sameScope = scopeStart == start && scopeTimeZone == timeZone
        let base = sameScope ? snapshot : [:]
        // Reuse a fixed start and open end so advancing time cannot hide a
        // previously returned future-dated sample behind an advanced anchor.
        // Summaries are always clipped to the explicit requested range below.
        let predicate = HKQuery.predicateForSamples(withStart: start, end: nil, options: [])
        let descriptors = types.map { HKQueryDescriptor(sampleType: $0.1, predicate: predicate) }
        let query = HKAnchoredObjectQuery(queryDescriptors: descriptors, anchor: sameScope ? anchor : nil,
                                         limit: HealthImportCore.maximumRecords + 1) { _, added, deleted, nextAnchor, error in
            self.queue.async {
                guard token == self.generation, self.completion != nil else { return }
                guard error == nil else {
                    self.finish(["status": "error", "readAccess": "notDisclosed"], generation: token); return
                }
                let added = added ?? [], deleted = deleted ?? []
                guard added.count + deleted.count <= HealthImportCore.maximumRecords else {
                    self.finish(["status": "tooLarge", "readAccess": "notDisclosed"], generation: token); return
                }
                do {
                    let samples = try added.map(self.project)
                    let deletedIds = deleted.map { $0.uuid.uuidString }
                    let candidate = try HealthImportCore.merge(current: base, upserts: samples, deletedIds: deletedIds)
                    self.readSteps(range: range, generation: token) { steps in
                        let formatter = ISO8601DateFormatter()
                        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
                        var summary = HealthImportCore.summary(samples: Array(candidate.values), range: range)
                        summary["steps"] = steps
                        // Commit the entire snapshot/anchor only after every sample
                        // type and statistics query completes successfully in bounds.
                        self.anchor = nextAnchor ?? (sameScope ? self.anchor : nil)
                        self.snapshot = candidate; self.scopeStart = start; self.scopeTimeZone = timeZone
                        let deletionSet = Set(deletedIds)
                        let delta = Dictionary(samples.filter { !deletionSet.contains($0.id) }.map { ($0.id, $0) },
                                               uniquingKeysWith: { _, last in last }).values.sorted { $0.id < $1.id }
                        self.finish(["status": "ok", "schemaVersion": 1, "owner": "device", "provider": "appleHealth",
                            "readAccess": "notDisclosed", "fetchedAt": formatter.string(from: Date()), "samples": delta.map { $0.dictionary(using: formatter) },
                            "deletedIds": Array(deletionSet).sorted(), "summary": summary,
                            "range": ["start": formatter.string(from: start), "end": formatter.string(from: now),
                                      "timeZone": timeZone]], generation: token)
                    }
                } catch {
                    self.finish(["status": error is HealthImportFailure && { if case HealthImportFailure.tooLarge = error { return true }; return false }() ? "tooLarge" : "invalid",
                                 "readAccess": "notDisclosed"], generation: token)
                }
            }
        }
        queries.append(query); store.execute(query)
    }

    private func readSteps(range: DateInterval, generation token: Int, done: @escaping ([String: Any]) -> Void) {
        guard let type = HKObjectType.quantityType(forIdentifier: .stepCount) else {
            finish(["status": "unavailable", "readAccess": "notDisclosed"], generation: token); return
        }
        let predicate = HKQuery.predicateForSamples(withStart: range.start, end: range.end, options: [])
        let calendar = Calendar.current
        let query = HKStatisticsCollectionQuery(quantityType: type, quantitySamplePredicate: predicate,
            options: .cumulativeSum, anchorDate: calendar.startOfDay(for: range.start), intervalComponents: DateComponents(day: 1))
        query.initialResultsHandler = { _, collection, error in
            self.queue.async {
                guard token == self.generation, self.completion != nil else { return }
                guard error == nil, let collection else {
                    self.finish(["status": "error", "readAccess": "notDisclosed"], generation: token); return
                }
                let formatter = DateFormatter()
                formatter.calendar = calendar; formatter.timeZone = calendar.timeZone
                formatter.locale = Locale(identifier: "en_US_POSIX"); formatter.dateFormat = "yyyy-MM-dd"
                var days: [[String: Any]] = [], total = 0.0, hasValue = false
                collection.enumerateStatistics(from: range.start, to: range.end) { statistic, _ in
                    var day: [String: Any] = ["date": formatter.string(from: statistic.startDate), "status": "unavailableOrNoReadableData"]
                    if let count = statistic.sumQuantity()?.doubleValue(for: .count()), count.isFinite, count >= 0 {
                        day["status"] = "available"; day["value"] = count; total += count; hasValue = true
                    }
                    days.append(day)
                }
                var value: [String: Any] = ["status": hasValue ? "available" : "unavailableOrNoReadableData",
                                          "method": "healthKitCumulativeSum", "days": days]
                if hasValue { value["value"] = total }
                done(value)
            }
        }
        queries.append(query); store.execute(query)
    }

    private func project(_ sample: HKSample) throws -> HealthImportSample {
        guard let kind = types.first(where: { $0.1.identifier == sample.sampleType.identifier })?.0 else {
            throw HealthImportFailure.invalid
        }
        let value: Double, sleepState: String?, sleepCategory: String?
        if let quantity = sample as? HKQuantitySample {
            let unit: HKUnit = kind == .energy ? .kilocalorie() : kind == .steps ? .count() : .gram()
            value = quantity.quantity.doubleValue(for: unit); sleepState = nil; sleepCategory = nil
        } else if let category = sample as? HKCategorySample, kind == .sleep {
            value = Double(category.value)
            switch HKCategoryValueSleepAnalysis(rawValue: category.value) {
            case .asleepUnspecified?: sleepCategory = "asleepUnspecified"
            case .asleepCore?: sleepCategory = "asleepCore"
            case .asleepDeep?: sleepCategory = "asleepDeep"
            case .asleepREM?: sleepCategory = "asleepREM"
            case .awake?: sleepCategory = "awake"
            case .inBed?: sleepCategory = "inBed"
            default: sleepCategory = "unknown"
            }
            switch HKCategoryValueSleepAnalysis(rawValue: category.value) {
            case .asleepUnspecified?, .asleepCore?, .asleepDeep?, .asleepREM?: sleepState = "asleep"
            case .awake?: sleepState = "awake"
            case .inBed?: sleepState = "inBed"
            default: sleepState = "unknown"
            }
        } else { throw HealthImportFailure.invalid }
        let source = sample.sourceRevision.source
        return HealthImportSample(id: sample.uuid.uuidString, type: kind, start: sample.startDate, end: sample.endDate,
                                  value: value, sourceId: source.bundleIdentifier, sourceName: source.name, sleepState: sleepState, sleepCategory: sleepCategory)
    }
}
#else
// Compiles without HealthKit on non-iOS test hosts; never simulates connectivity.
final class HealthKitReader {
    static let shared = HealthKitReader()
    func requestAuthorization(completion: @escaping ([String: Any]) -> Void) {
        completion(["status": "unavailable", "readAccess": "notDisclosed"])
    }
    func read(days: Int = 7, completion: @escaping ([String: Any]) -> Void) {
        completion(["status": "unavailable", "readAccess": "notDisclosed"])
    }
    func cancel() {}
}
#endif
