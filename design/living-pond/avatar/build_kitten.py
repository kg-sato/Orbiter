"""Reproducible review avatar. Reads the production builder; writes only here."""
from pathlib import Path
import bpy

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
source = (ROOT / 'design/avatar/build_kitten.py').read_text(encoding='utf-8')

def change(old, new):
    global source
    if old not in source:
        raise RuntimeError('Production model builder changed: ' + old[:70])
    source = source.replace(old, new, 1)

change("OUT = ROOT / 'src/mascot/assets'", "OUT = Path(" + repr(str(HERE)) + ")")
change("ROOT/'design/avatar/orbiter-kitten.blend'", "OUT/'orbiter-kitten.blend'")
change("rig['modelVersion']='orbiter-kitten-2'", "rig['modelVersion']='orbiter-kitten-pond-review-3'")
change("eye=mat('Eyes',(.055,.11,.15),.26)", "eye=mat('Eyes',(.045,.095,.13),.38)")
change("(.137,.173,.057)", "(.132,.169,.055)")
change("(.031,.042,.011)", "(.024,.032,.009)")
change("bind(sphere('Nose',(0,1.24,.591),(.052,.038,.03),eye),'Head')", "bind(sphere('Nose',(0,1.245,.593),(.045,.031,.027),eye),'Head')")
change("[(-.12,1.17,.575),(-.095,1.105,.58),(-.04,1.11,.597),(0,1.17,.598),(.04,1.11,.597),(.095,1.105,.58),(.12,1.17,.575)],.018,eye", "[(-.105,1.165,.58),(-.075,1.125,.596),(-.025,1.14,.608),(0,1.175,.611),(.025,1.14,.608),(.075,1.125,.596),(.105,1.165,.58)],.014,eye")
change("brow=sphere('Brow'+tag,(side*.30,1.69,.516),(.085,.025,.024),patch,16,10)", "brow=sphere('Brow'+tag,(side*.30,1.65,.540),(.065,.016,.013),patch,16,10)")
change("(.135,.30,.16)", "(.143,.285,.169)")
change("(.16,.115,.195)", "(.165,.116,.205)")
change("# Four separately named ear meshes", """# Two shallow toe divisions sit on the foot surface, never change the paw silhouette.
    for toe in [-1, 1]:
        x = side*.23 + toe*.047
        bind(curve('Toe'+tag+str(toe),[(x,.09,.546),(x,.13,.538),(x,.16,.515)],.005,patch),'Paw'+tag)
    # Four separately named ear meshes""")
change("[(.32,.22,-.14),(.71,.25,-.23),(.81,.51,-.26),(.66,.62,-.20)],.085,fur", "[(.32,.22,-.14),(.70,.25,-.24),(.84,.48,-.26),(.79,.67,-.21),(.64,.70,-.18)],.087,fur")
# Keep all original bone names, rest transforms, trait variants and morph targets.
exec(compile(source, str(ROOT/'design/avatar/build_kitten.py'), 'exec'), {'__file__':str(ROOT/'design/avatar/build_kitten.py')})
