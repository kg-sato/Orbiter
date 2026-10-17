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
fur=mat('Coat',(.90,.79,.62)); ivory=mat('Ivory',(1,.94,.81)); rose=mat('Rose',(.83,.44,.46)); eye=mat('Eyes',(.055,.11,.15),.26); glow=mat('Glint',(1,.98,.91),.25); patch=mat('Pattern',(.55,.66,.61))
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
head=sphere('HeadMesh',(0,1.36,0),(.84,.74,.59),fur,48,28)
# One continuous, round head: a slightly full lower face, never separate cheek lobes.
for v in head.data.vertices:
    height=v.co.z/.74
    v.co.x*=1+.035*math.exp(-((height+.2)/.45)**2)
bind(head,'Head')
bind(sphere('BodyMesh',(0,.45,0),(.39,.47,.33),fur),'Body')
bind(sphere('Belly',(0,.46,.30),(.22,.27,.035),ivory),'Body')
bind(sphere('Nose',(0,1.24,.591),(.052,.038,.03),eye),'Head')
smile=curve('Smile',[(-.12,1.17,.575),(-.095,1.105,.58),(-.04,1.11,.597),(0,1.17,.598),(.04,1.11,.597),(.095,1.105,.58),(.12,1.17,.575)],.018,eye)
smile.shape_key_add(name='Basis');happy=smile.shape_key_add(name='Happy')
for v in happy.data:v.co.z+=.025*min(1,abs(v.co.x)/.12)
bind(smile,'Head')
for side in [-1,1]:
    tag='L' if side<0 else 'R'
    e=sphere('Eye'+tag,(side*.30,1.40,.543),(.137,.173,.057),eye)
    e.shape_key_add(name='Basis');blink=e.shape_key_add(name='Blink')
    # Local Z is vertical in Blender; export converts it into glTF Y.
    for v in blink.data:v.co.z*=.10
    bind(e,'Head')
    bind(sphere('Glint'+tag,(side*.30-.035,1.46,.593),(.031,.042,.011),glow,16,10),'Head')
    bind(sphere('Blush'+tag,(side*.53,1.22,.448),(.085,.035,.016),rose),'Head')
    brow=sphere('Brow'+tag,(side*.30,1.69,.516),(.085,.025,.024),patch,16,10);bind(brow,'Head')
    bind(sphere('PawMesh'+tag,(side*.23,.31,.30),(.135,.30,.16),fur),'Paw'+tag)
    bind(sphere('Foot'+tag,(side*.23,.10,.35),(.16,.115,.195),fur),'Paw'+tag)
    bind(sphere('Haunch'+tag,(side*.37,.15,-.02),(.22,.18,.24),fur),'Root')
    # Four separately named ear meshes; runtime selects the persistent trait.
    for variant in range(4):
        # Rounded outline with a continuous thick rim and an actual recessed inner bowl.
        height=.36 if variant==1 else .56
        if variant==2:
            outline=[(.245*math.cos(i*math.tau/36),.25+.28*math.sin(i*math.tau/36)) for i in range(36)]
        else:
            corners=[Vector((-.27,0)),Vector((.27,0)),Vector((side*.10,height))];outline=[]
            for i,c in enumerate(corners):
                a=c.lerp(corners[(i-1)%3],.22);b=c.lerp(corners[(i+1)%3],.22)
                for j in range(12):
                    t=j/12;v=(1-t)**2*a+2*(1-t)*t*c+t*t*b;outline.append(tuple(v))
        center=Vector((0,height*.36));count=len(outline)
        profiles=[(.82,-.10),(1.,.015),(.98,.115),(.83,.18),(.64,.145),(.57,.07)]
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
        innerverts=[point((side*.60+center.x,1.81+center.y,.025))]
        for xy in outline:
            v=center+(Vector(xy)-center)*.575
            innerverts.append(point((side*.60+v.x,1.81+v.y,.071+(max(0,v.y/height)*.16 if variant==1 else 0))))
        innermesh=bpy.data.meshes.new('Recessed ear bowl');innermesh.from_pydata(innerverts,[],[(0,j+1,(j+1)%count+1) for j in range(count)]);innermesh.update()
        inner=bpy.data.objects.new('Inner'+tag+str(variant),innermesh);bpy.context.collection.objects.link(inner);inner.data.materials.append(patch)
        for f in inner.data.polygons:f.use_smooth=True
        bind(inner,'Ear'+tag)
        if variant==3:bind(sphere('Tuft'+tag,(side*.68,2.35,.035),(.04,.075,.045),ivory,16,10),'Ear'+tag)
bind(curve('TailMesh',[(.32,.22,-.14),(.71,.25,-.23),(.81,.51,-.26),(.66,.62,-.20)],.085,fur),'Tail')
# Neutral, editable preview pose. Runtime accessories retain the original four identities.
rig['modelVersion']='orbiter-kitten-2';rig['license']='Original Orbiter artwork';rig['triangleBudget']=25000
bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'design/avatar/orbiter-kitten.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'kitten.glb'),export_format='GLB',export_animations=False,export_skins=True,export_morph=True,export_yup=True)
print('ORBITER_MODEL_EXPORTED',sum(len(o.data.polygons) for o in bpy.data.objects if o.type=='MESH'))
