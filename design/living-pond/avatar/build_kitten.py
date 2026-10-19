"""Export the promoted production model into this isolated study directory."""
from pathlib import Path
import bpy
HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
builder = ROOT / 'design/avatar/build_kitten.py'
source = builder.read_text(encoding='utf-8')
source = source.replace("OUT = ROOT / 'src/mascot/assets'", 'OUT = Path(' + repr(str(HERE)) + ')')
source = source.replace("ROOT/'design/avatar/orbiter-kitten-051.blend'", "OUT/'orbiter-kitten.blend'")
exec(compile(source, str(builder), 'exec'), {'__file__': str(builder)})
