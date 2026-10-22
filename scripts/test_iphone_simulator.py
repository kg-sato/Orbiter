"""Runner orchestration tests; these do not execute Swift or an iOS simulator."""
import json
from pathlib import Path
import plistlib
import subprocess
import tempfile
import time
import unittest
from unittest.mock import patch
import run_iphone_simulator as runner

RUNTIME = "com.apple.CoreSimulator.SimRuntime.iOS-26-5"
TYPE = "com.apple.CoreSimulator.SimDeviceType.iPhone-17"
DEVICE = "8acff873-e6b0-4588-b411-9a75d38f43f0"
INVENTORY = {RUNTIME: [{"name": "iPhone 17", "isAvailable": True, "deviceTypeIdentifier": TYPE}]}


class RunnerTests(unittest.TestCase):
    def test_command_timeout_preserves_bounded_boot_diagnostics(self):
        error = subprocess.TimeoutExpired(["xcrun"], 480, output=b"Data migration in progress")
        with patch.object(runner.subprocess, "run", side_effect=error):
            with self.assertRaisesRegex(RuntimeError, "Data migration in progress"):
                runner.command("xcrun", "simctl", "bootstatus", timeout=480)

    def test_select_only_available_iphone_on_latest_runtime(self):
        devices = dict(INVENTORY)
        devices["com.apple.CoreSimulator.SimRuntime.iOS-18-0"] = [
            {"name": "iPhone SE", "isAvailable": True, "deviceTypeIdentifier": "old"}]
        devices[RUNTIME] = INVENTORY[RUNTIME] + [
            {"name": "iPhone 99", "isAvailable": False, "deviceTypeIdentifier": "unavailable"},
            {"name": "iPad", "isAvailable": True, "deviceTypeIdentifier": "tablet"}]
        self.assertEqual(runner.select_device(devices, []), ("iPhone 17", TYPE, RUNTIME))
        with self.assertRaisesRegex(RuntimeError, "No compatible"):
            runner.select_device(devices, [], "missing")

    def test_template_name_fallback(self):
        devices = {RUNTIME: [{"name": "iPhone 17", "isAvailable": True}]}
        self.assertEqual(runner.select_device(devices, [{"name": "iPhone 17", "identifier": TYPE}])[1], TYPE)

    def test_reject_windows_before_any_device_command(self):
        with patch.object(runner.platform, "system", return_value="Windows"), patch.object(runner, "command") as command:
            with self.assertRaisesRegex(RuntimeError, "require macOS"):
                runner.run(Path("unused"), Path("unused"))
            command.assert_not_called()

    def simulate(self, fail=False, created=DEVICE, expired=False, missing_snapshot=False):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        root = Path(temporary.name)
        app = root / "Scheduler.app"
        app.mkdir()
        (app / "Info.plist").write_bytes(plistlib.dumps({"CFBundleIdentifier": "fixture.orbiter", "CFBundleShortVersionString": "0.5.3"}))
        calls = []
        def command(*args, **kwargs):
            calls.append(args)
            if args[:4] == ("xcrun", "simctl", "list", "devices"):
                return json.dumps({"devices": INVENTORY})
            if args[:4] == ("xcrun", "simctl", "list", "devicetypes"):
                return json.dumps({"devicetypes": []})
            if args[:3] == ("xcrun", "simctl", "create"):
                return created
            if args[:3] == ("xcrun", "simctl", "get_app_container"):
                return str(root / "container")
            return "Xcode fixture" if args[0] == "xcodebuild" else ""
        documents = root / "container/Documents"
        documents.mkdir(parents=True)
        for phase in ("seed", "verify"):
            if not missing_snapshot:
                (documents / f"orbiter-smoke-{phase}.png").write_bytes(b"\x89PNG\r\n\x1a\nfixture")
        reports = [{"success": not fail, "phase": phase, "checks": ["fixture-check"], "errors": [], "version": "0.5.3", "expectedExpiry": time.time() * 1000 + (-1000 if expired else 45000)} for phase in ("seed", "verify")]
        with patch.object(runner.platform, "system", return_value="Darwin"), patch.object(runner, "command", side_effect=command), \
             patch.object(runner, "wait_report", side_effect=reports), patch.object(runner.time, "sleep"):
            if fail or created != DEVICE or expired or missing_snapshot:
                with self.assertRaises((RuntimeError, ValueError)):
                    runner.run(app, root / "evidence")
            else:
                runner.run(app, root / "evidence")
        return calls, json.loads((root / "evidence/run.json").read_text()), root / "evidence"

    def test_success_relaunch_and_cleanup_own_device(self):
        calls, metadata, evidence = self.simulate()
        launches = [args[-1] for args in calls if args[:3] == ("xcrun", "simctl", "launch")]
        self.assertEqual(launches, ["--orbiter-smoke-phase=seed", "--orbiter-smoke-phase=verify"])
        self.assertEqual(metadata["status"], "passed")
        self.assertTrue((evidence / "orbiter-smoke-verify.json").is_file())
        self.assertTrue((evidence / "orbiter-smoke-seed.png").is_file())
        self.assertTrue((evidence / "orbiter-smoke-verify.png").is_file())
        self.assertFalse(any(args[:3] == ("xcrun", "simctl", "io") for args in calls))
        self.assertEqual(calls[-2:], [("xcrun", "simctl", "shutdown", DEVICE), ("xcrun", "simctl", "delete", DEVICE)])

    def test_seed_termination_is_not_delayed_by_simulator_screenshot(self):
        calls, _, _ = self.simulate()
        seed = next(i for i, args in enumerate(calls) if "--orbiter-smoke-phase=seed" in args)
        stopped = next(i for i in range(seed + 1, len(calls)) if calls[i][:3] == ("xcrun", "simctl", "terminate"))
        self.assertFalse(any(args[:3] == ("xcrun", "simctl", "io") for args in calls[seed:stopped]))

    def test_failed_check_stops_and_keeps_evidence(self):
        calls, metadata, evidence = self.simulate(fail=True)
        self.assertEqual(metadata["status"], "failed")
        self.assertEqual(metadata["phase"], "seed")
        self.assertTrue((evidence / "orbiter-smoke-seed.json").is_file())
        self.assertEqual(calls[-1], ("xcrun", "simctl", "delete", DEVICE))
        self.assertFalse(any("--orbiter-smoke-phase=verify" in args for args in calls))

    def test_expired_before_termination_cannot_claim_recovery(self):
        calls, metadata, _ = self.simulate(expired=True)
        self.assertEqual(metadata["status"], "failed")
        self.assertNotIn("stoppedBeforeExpiry", metadata)
        self.assertFalse(any("--orbiter-smoke-phase=verify" in args for args in calls))

    def test_missing_native_snapshot_cannot_pass(self):
        calls, metadata, _ = self.simulate(missing_snapshot=True)
        self.assertEqual(metadata["status"], "failed")
        self.assertIn("screenshot is missing or invalid", metadata["error"])
        self.assertFalse(any("--orbiter-smoke-phase=verify" in args for args in calls))

    def test_setup_failure_still_writes_report(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            with patch.object(runner.platform, "system", return_value="Darwin"):
                with self.assertRaises(FileNotFoundError):
                    runner.run(root / "missing.app", root / "output")
            self.assertEqual(json.loads((root / "output/run.json").read_text())["phase"], "setup")

    def test_invalid_created_id_never_mutates_any_device(self):
        calls, metadata, _ = self.simulate(created="booted")
        self.assertEqual(metadata["status"], "failed")
        self.assertFalse(any(args[2] in ("boot", "shutdown", "delete", "install") for args in calls if len(args) > 2))


if __name__ == "__main__":
    unittest.main()
