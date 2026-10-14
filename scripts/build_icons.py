"""Render code-owned mascot SVG consistently into web, Apple and Windows icon sources."""
from pathlib import Path
import subprocess
root = Path(__file__).resolve().parent.parent
subprocess.run(['node', str(root / 'scripts/render_mascot_icons.cjs')], cwd=root, check=True)
