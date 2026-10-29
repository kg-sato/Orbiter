"""Original Orbiter kitten. Run with Blender --background --python this_file.
Outputs the editable .blend and a self-contained GLB; no downloaded models/textures.
Coordinates intentionally match the existing companion pose channels (Y is up at runtime).
"""
import bpy, math
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'src/mascot/assets'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def mat(name, color, rough=.7):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF'); bs.inputs['Base Color'].default_value=(*color,1); bs.inputs['Roughness'].default_value=rough
    return m
fur=mat('Coat',(.90,.79,.62),.9); ivory=mat('Ivory',(1,.94,.81),.95); rose=mat('Rose',(.73,.43,.43),.9); eye=mat('Eyes',(.035,.075,.09),.62); glow=mat('Glint',(1,.98,.91),.5); patch=mat('Pattern',(.55,.66,.61))
def point(p): return (p[0],-p[2],p[1])
def sphere(name,p,s,material,segments=24,rings=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,location=point(p))
    o=bpy.context.object; o.name=name; o.scale=(s[0],s[2],s[1]); bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(material)
    for f in o.data.polygons:f.use_smooth=True
    return o
def curve(name,points,radius,material):
    c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=10;c.bevel_depth=radius;c.bevel_resolution=2
    s=c.splines.new('BEZIER');s.bezier_points.add(len(points)-1)
    for b,p in zip(s.bezier_points,points):b.co=point(p);b.handle_left_type=b.handle_right_type='AUTO'
    o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.data.materials.append(material)
    bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False)
    return o
# A small explicit rig: editable pose bones, exported as a real skin.
arm=bpy.data.armatures.new('OrbiterRig'); rig=bpy.data.objects.new('OrbiterRig',arm);bpy.context.collection.objects.link(rig)
bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
positions={'Root':(0,0,0),'Head':(0,1.36,0),'Body':(0,.60,0),'EarL':(-.60,1.84,0),'EarR':(.60,1.84,0),'PawL':(-.24,.60,.13),'PawR':(.24,.60,.13),'Tail':(0,0,0)}
for name,p in positions.items():
    b=arm.edit_bones.new(name);b.head=point(p);b.tail=b.head+Vector((0,0,.15))
    if name!='Root':b.parent=arm.edit_bones['Head' if name.startswith('Ear') else 'Root']
bpy.ops.object.mode_set(mode='OBJECT');rig.select_set(False)
def bind(o,bone):
    group=o.vertex_groups.new(name=bone);group.add(list(range(len(o.data.vertices))),1,'REPLACE')
    mod=o.modifiers.new('Orbiter skin','ARMATURE');mod.object=rig;o.parent=rig
    return o
head=sphere('HeadMesh',(0,1.36,0),(.78,.65,.55),fur,48,28)
# One continuous, round head: a slightly full lower face, never separate cheek lobes.
for v in head.data.vertices:
    height=v.co.z/.65
    # Broad lower cheeks and a gently narrower brow: a sculpted pear, not a ball.
    v.co.x*=1+.075*math.exp(-((height+.28)/.42)**2)-.045*max(0,height)
bind(head,'Head')
bind(sphere('BodyMesh',(0,.46,0),(.44,.49,.35),fur),'Body')
bind(sphere('Belly',(0,.45,.32),(.23,.28,.028),ivory),'Body')
bind(sphere('Muzzle',(0,1.16,.51),(.19,.105,.055),ivory),'Head')
bind(sphere('Nose',(0,1.205,.565),(.034,.023,.019),rose),'Head')
smile=curve('Smile',[(-.083,1.135,.554),(-.051,1.111,.566),(0,1.133,.573),(.051,1.111,.566),(.083,1.135,.554)],.009,eye)
smile.shape_key_add(name='Basis');happy=smile.shape_key_add(name='Happy')
for v in happy.data:v.co.z+=.025*min(1,abs(v.co.x)/.12)
bind(smile,'Head')
for side in [-1,1]:
    tag='L' if side<0 else 'R'
    e=sphere('Eye'+tag,(side*.275,1.405,.514),(.11,.137,.035),eye)
    for v in e.data.vertices:v.co.z+=side*.13*v.co.x
    e.shape_key_add(name='Basis');blink=e.shape_key_add(name='Blink')
    # Local Z is vertical in Blender; export converts it into glTF Y.
    for v in blink.data:v.co.z*=.10
    bind(e,'Head')
    bind(sphere('Glint'+tag,(side*.275-.026,1.449,.551),(.013,.020,.005),glow,16,10),'Head')
    bind(sphere('Blush'+tag,(side*.49,1.235,.432),(.055,.021,.009),rose),'Head')
    bind(sphere('PawMesh'+tag,(side*.23,.29,.30),(.15,.255,.155),fur),'Paw'+tag)
    bind(sphere('Foot'+tag,(side*.23,.10,.35),(.16,.10,.19),fur),'Paw'+tag)
    bind(sphere('Haunch'+tag,(side*.36,.16,-.02),(.24,.20,.26),fur),'Root')
    # Two shallow toe divisions sit on the foot surface, never change the paw silhouette.
    for toe in [-1, 1]:
        x = side*.23 + toe*.047
        bind(curve('Toe'+tag+str(toe),[(x,.09,.546),(x,.13,.538),(x,.16,.515)],.005,patch),'Paw'+tag)
    # Four separately named ear meshes; runtime selects the persistent trait.
    for variant in range(4):
        # Rounded outline with a continuous thick rim and an actual recessed inner bowl.
        height=.33 if variant==1 else .49
        if variant==2:
            outline=[(.245*math.cos(i*math.tau/36),.25+.28*math.sin(i*math.tau/36)) for i in range(36)]
        else:
            corners=[Vector((-.27,0)),Vector((.27,0)),Vector((side*.10,height))];outline=[]
            for i,c in enumerate(corners):
                a=c.lerp(corners[(i-1)%3],.22);b=c.lerp(corners[(i+1)%3],.22)
                for j in range(12):
                    t=j/12;v=(1-t)**2*a+2*(1-t)*t*c+t*t*b;outline.append(tuple(v))
        center=Vector((0,height*.36));count=len(outline)
        profiles=[(.82,-.055),(1.,.005),(.98,.055),(.85,.095),(.68,.08),(.61,.045)]
        verts=[];faces=[]
        for scale,depth in profiles:
            for xy in outline:
                v=center+(Vector(xy)-center)*scale
                fold=max(0,v.y/height)*.16 if variant==1 else 0
                verts.append(point((side*.60+v.x,1.81+v.y,depth+fold)))
        for ring in range(len(profiles)-1):
            for j in range(count):faces.append((ring*count+j,ring*count+(j+1)%count,(ring+1)*count+(j+1)%count,(ring+1)*count+j))
        faces.append(tuple(reversed(range(count))))
        mesh=bpy.data.meshes.new('Sculpted ear rim');mesh.from_pydata(verts,[],faces);mesh.update()
        o=bpy.data.objects.new('Ear'+tag+str(variant),mesh);bpy.context.collection.objects.link(o);o.data.materials.append(fur)
        for f in o.data.polygons:f.use_smooth=True
        bind(o,'Ear'+tag)
        # Inner surface sits behind the lip, not as a pink capsule pasted on its front.
        innerverts=[point((side*.60+center.x,1.81+center.y,.038))]
        for xy in outline:
            v=center+(Vector(xy)-center)*.615
            innerverts.append(point((side*.60+v.x,1.81+v.y,.046+(max(0,v.y/height)*.16 if variant==1 else 0))))
        innermesh=bpy.data.meshes.new('Recessed ear bowl');innermesh.from_pydata(innerverts,[],[(0,j+1,(j+1)%count+1) for j in range(count)]);innermesh.update()
        inner=bpy.data.objects.new('Inner'+tag+str(variant),innermesh);bpy.context.collection.objects.link(inner);inner.data.materials.append(rose)
        for f in inner.data.polygons:f.use_smooth=True
        bind(inner,'Ear'+tag)
        if variant==3:bind(sphere('Tuft'+tag,(side*.68,2.35,.035),(.04,.075,.045),ivory,16,10),'Ear'+tag)
bind(curve('TailMesh',[(.32,.22,-.14),(.70,.25,-.24),(.84,.48,-.26),(.79,.67,-.21),(.64,.70,-.18)],.087,fur),'Tail')
# Neutral, editable preview pose. Runtime accessories retain the original four identities.
rig['modelVersion']='orbiter-kitten-stillwater-1';rig['license']='Original Orbiter artwork';rig['triangleBudget']=25000
bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'design/avatar/orbiter-kitten-stillwater.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'kitten.glb'),export_format='GLB',export_animations=False,export_skins=True,export_morph=True,export_yup=True)
print('ORBITER_MODEL_EXPORTED',sum(len(o.data.polygons) for o in bpy.data.objects if o.type=='MESH'))
