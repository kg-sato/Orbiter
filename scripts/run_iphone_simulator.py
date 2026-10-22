"""Run the opt-in WKWebView smoke checks on a newly created, disposable iPhone.

Requires macOS/Xcode. Never selects, erases, or installs into an existing device.
Reports contain fictional fixtures only; this is not a physical-device acceptance run.
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import platform
import plistlib
import subprocess
import shutil
import time
import uuid


def command(*args: str, timeout: int = 90, check: bool = True) -> str:
    if args[:2] == ("xcrun", "simctl"):
        print("Simulator operation: " + args[2], flush=True)
    try:
        result = subprocess.run(args, capture_output=True, text=True, timeout=timeout)
    except subprocess.TimeoutExpired as error:
        partial = error.stdout or ""
        if isinstance(partial, bytes):
            partial = partial.decode("utf-8", errors="replace")
        raise RuntimeError(f"{args[0:3]} timed out after {timeout}s. Last output: {partial[-2500:]}") from error
    if check and result.returncode:
        raise RuntimeError(f"{args[0:3]} failed ({result.returncode}): {result.stderr[-2500:]}")
    return result.stdout.strip()


def select_device(devices: dict, types: list, requested: str | None = None) -> tuple[str, str, str]:
    """Use an available template to choose a compatible runtime; do not reuse it."""
    identifiers = {item["name"]: item["identifier"] for item in types}
    candidates = []
    for runtime, entries in devices.items():
        if ".iOS-" not in runtime:
            continue
        for entry in entries:
            name = entry.get("name", "")
            device_type = entry.get("deviceTypeIdentifier") or identifiers.get(name)
            if entry.get("isAvailable", False) and name.startswith("iPhone") and device_type:
                if requested and name != requested:
                    continue
                version = tuple(int(part) for part in runtime.split(".iOS-")[-1].split("-"))
                candidates.append((version, name, device_type, runtime))
    if not candidates:
        raise RuntimeError("No compatible available iPhone template found" + (f": {requested}" if requested else ""))
    # Latest installed runtime, then a base iPhone before the larger Pro/Plus models.
    newest = max(item[0] for item in candidates)
    selected = min((item for item in candidates if item[0] == newest),
                   key=lambda item: (any(word in item[1] for word in ("Pro", "Plus", "Max")), item[1]))
    return selected[1], selected[2], selected[3]


def wait_report(path: Path, timeout: int = 120) -> dict:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if path.is_file():
            return json.loads(path.read_text(encoding="utf-8"))
        time.sleep(1)
    raise TimeoutError(f"Native smoke report did not arrive: {path.name}")


def run(app: Path, output: Path, device_name: str | None = None) -> None:
    if platform.system() != "Darwin":
        raise RuntimeError("Native iPhone simulator checks require macOS with Xcode; no browser substitute was run.")
    output.mkdir(parents=True, exist_ok=True)
    metadata = {"commit": os.environ.get("GITHUB_SHA"), "status": "running"}
    simulator = None
    current_phase = "setup"
    try:
        with (app / "Info.plist").open("rb") as stream:
            info = plistlib.load(stream)
        bundle = info["CFBundleIdentifier"]
        inventory = json.loads(command("xcrun", "simctl", "list", "devices", "available", "--json"))
        types = json.loads(command("xcrun", "simctl", "list", "devicetypes", "--json"))["devicetypes"]
        name, device_type, runtime = select_device(inventory["devices"], types, device_name)
        metadata.update(device=name, runtime=runtime, bundle=bundle,
                        version=info.get("CFBundleShortVersionString"), xcode=command("xcodebuild", "-version"))
        created = command("xcrun", "simctl", "create", "Orbiter-smoke-" + uuid.uuid4().hex[:10], device_type, runtime)
        # Refuse to send mutating device commands unless creation returned exactly one UUID.
        simulator = str(uuid.UUID(created))
        command("xcrun", "simctl", "boot", simulator)
        command("xcrun", "simctl", "bootstatus", simulator, "-b", timeout=480)
        command("xcrun", "simctl", "install", simulator, str(app), timeout=120)
        container = Path(command("xcrun", "simctl", "get_app_container", simulator, bundle, "data"))
        for phase in ("seed", "verify"):
            current_phase = phase
            report = container / "Documents" / f"orbiter-smoke-{phase}.json"
            command("xcrun", "simctl", "launch", simulator, bundle, f"--orbiter-smoke-phase={phase}")
            result = wait_report(report)
            (output / report.name).write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
            # Seed already includes a WKWebView snapshot. A full simulator screenshot can
            # stall for tens of seconds, so never put it before the timed termination.
            if phase == "verify":
                command("xcrun", "simctl", "io", simulator, "screenshot", str(output / f"{phase}.png"))
            if (result.get("phase") != phase or result.get("version") != info.get("CFBundleShortVersionString")
                    or not result.get("checks") or result.get("errors") != []):
                raise RuntimeError(f"Incomplete or mismatched native {phase} report")
            native_snapshot = container / "Documents" / f"orbiter-smoke-{phase}.png"
            if native_snapshot.is_file():
                shutil.copy2(native_snapshot, output / native_snapshot.name)
            if result.get("success") is not True:
                raise RuntimeError(f"Native {phase} checks failed; inspect {report.name}")
            command("xcrun", "simctl", "terminate", simulator, bundle)
            if phase == "seed":
                # The seed's fictional timer expires while the app process is stopped.
                expiry = result.get("expectedExpiry")
                stopped_at = time.time() * 1000
                if not isinstance(expiry, (int, float)) or not 0 < expiry - stopped_at <= 60000:
                    raise RuntimeError("Cannot prove process stopped before fictional timer expired")
                metadata["stoppedBeforeExpiry"] = True
                time.sleep((expiry - stopped_at) / 1000 + 2)
        metadata["status"] = "passed"
    except Exception as error:
        metadata.update(status="failed", phase=current_phase, error=str(error))
        if simulator:
            try:
                command("xcrun", "simctl", "io", simulator, "screenshot", str(output / "failure.png"), check=False)
            except Exception:
                pass
        raise
    finally:
        (output / "run.json").write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
        if simulator:
            # Only this run's UUID; never shutdown/delete all, erase, or touch a user's simulator.
            for operation in ("shutdown", "delete"):
                try:
                    command("xcrun", "simctl", operation, simulator)
                except Exception as error:
                    print(f"Cleanup {operation} failed for disposable simulator: {error}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--app", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=Path("build/iphone-simulator"))
    parser.add_argument("--device", help="Exact available simulator template name; a new device is always created")
    args = parser.parse_args()
    run(args.app.resolve(), args.output.resolve(), args.device)
