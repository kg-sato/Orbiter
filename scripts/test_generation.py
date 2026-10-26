"""Exercise production generators in disposable files; compiler output is a fixture."""
from contextlib import redirect_stdout
from io import StringIO
from pathlib import Path
import re
import runpy
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch


ROOT = Path(__file__).resolve().parent.parent


class GenerationTests(unittest.TestCase):
    def setUp(self):
        (ROOT / "build").mkdir(exist_ok=True)
        temporary = tempfile.TemporaryDirectory(prefix="generation-test-", dir=ROOT / "build")
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        for name in ("Application.html", "package.json", "sw.js"):
            shutil.copyfile(ROOT / name, self.root / name)
        shutil.copytree(ROOT / "web", self.root / "web")
        (self.root / "scripts").mkdir()
        (self.root / "Scheduler").mkdir()
        (self.root / "build").mkdir()
        for name in ("build_core.py", "sync_app.py", "sync_preview.py"):
            shutil.copyfile(ROOT / "scripts" / name, self.root / "scripts" / name)
        # External compilation is outside this regression's scope. Stable fixture
        # output still goes through the actual embedding and downstream scripts.
        for name in ("study-core.js", "orbiter-cat.js"):
            (self.root / "build" / name).write_text("/* fixture compiler output */", encoding="utf-8")

    def run_generator(self, name):
        with redirect_stdout(StringIO()):
            runpy.run_path(str(self.root / "scripts" / name), run_name="__main__")

    def test_core_regeneration_preserves_bytes_and_shell_version(self):
        original_run = subprocess.run
        compiler_calls = []

        def run(command, **kwargs):
            if command[0] == "node":
                compiler_calls.append(command)
                return subprocess.CompletedProcess(command, 0)
            self.assertEqual(command[0], sys.executable)
            return original_run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, **kwargs)

        outputs = ("Application.html", "Scheduler/Application.html",
                   "design/scheduler-ui-preview/index.html", "sw.js")
        with patch("subprocess.run", side_effect=run):
            self.run_generator("build_core.py")
            before = {name: (self.root / name).read_bytes() for name in outputs}
            self.run_generator("build_core.py")
        self.assertEqual(len(compiler_calls), 6)
        for name in outputs:
            self.assertEqual(before[name], (self.root / name).read_bytes(), name)
        html = (self.root / "Application.html").read_text(encoding="utf-8")
        labels = ("orbiter-life-styles", "orbiter-health-data", "orbiter-life-model",
                  "orbiter-native-life-journal", "orbiter-life-sync", "orbiter-life-hub",
                  "orbiter-companion-guide-styles", "orbiter-companion-guide")
        positions = []
        for label in labels:
            marker = 'id="' + label + '"'
            self.assertEqual(html.count(marker), 1, label)
            positions.append(html.index(marker))
        self.assertEqual(positions, sorted(positions), "Life modules must retain dependency order")

    def test_preview_external_web_assets_resolve(self):
        self.run_generator("sync_preview.py")
        target = self.root / "design/scheduler-ui-preview/index.html"
        html = target.read_text(encoding="utf-8")
        assets = re.findall(r'''(?:src|href)=["']([^"']*web/[^"']*)["']''', html)
        self.assertTrue(assets, "Expected production web asset references")
        for asset in assets:
            self.assertTrue(asset.startswith("../../web/"), asset)
            self.assertTrue((target.parent / asset).is_file(), asset)
        for name in ("account.css", "cloud-sync.js", "account-sync.js"):
            self.assertIn("../../web/" + name, assets)
        self.assertIn('data-preview="true"', html)


if __name__ == "__main__":
    unittest.main()
