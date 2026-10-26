"""Offline, disposable sprite trial; never modifies the source GLB or .blend.

Render with Blender: blender -b --factory-startup -P this_file -- --frames-dir build/companion-lite/frames
Pack with Pillow: python this_file --pack --frames-dir build/companion-lite/frames
"""
from pathlib import Path
import argparse
import hashlib
import json
import math
import sys

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "src/mascot/assets/kitten.glb"
FRAME_COUNT, FPS, SIZE = 16, 8, 192


def arguments():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--frames-dir", type=Path, default=ROOT / "build/companion-lite/frames")
    parser.add_argument("--output-dir", type=Path, default=ROOT / "design/companion-lite/assets")
    parser.add_argument("--pack", action="store_true")
    parser.add_argument("--only-first", action="store_true", help="Render one frame for framing review")
    args = parser.parse_args(argv)
    for field in ("frames_dir", "output_dir"):
        value = getattr(args, field)
        setattr(args, field, value if value.is_absolute() else ROOT / value)
    return args


def render(args):
    import bpy
    from mathutils import Vector

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(SOURCE))
    scene = bpy.context.scene
    meshes = [obj for obj in scene.objects if obj.type == "MESH"]
    rigs = [obj for obj in scene.objects if obj.type == "ARMATURE"]
    if not meshes or len(rigs) != 1:
        raise RuntimeError("Expected the original kitten mesh and a single armature")
    import re
    hidden = []
    for obj in meshes:
        match = re.fullmatch(r"(?:Ear|Inner)[LR](\d)", obj.name)
        if (match and int(match[1]) != 0) or obj.name.startswith("Tuft"):
            obj.hide_render = True
            hidden.append(obj.name)
    rig = rigs[0]
    for name in ("Root", "Head", "Body", "EarL", "EarR"):
        if name not in rig.pose.bones:
            raise RuntimeError("Missing original rig bone: " + name)
    # Identity zero has the plain warm coat and pointed ears. Preserve the
    # imported original materials, bone hierarchy, shape keys and geometry.
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 8
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 4
    scene.cycles.diffuse_bounces = 2
    scene.cycles.glossy_bounces = 2
    scene.render.resolution_x = scene.render.resolution_y = SIZE
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    scene.render.fps = FPS
    scene.view_settings.view_transform = "Standard"
    if scene.world is None:
        scene.world = bpy.data.worlds.new("Trial world")
    scene.world.color = (0.18, 0.20, 0.23)
    scene.world.use_nodes = True
    scene.world.node_tree.nodes["Background"].inputs[0].default_value = (0.38, 0.44, 0.52, 1)
    scene.world.node_tree.nodes["Background"].inputs[1].default_value = 0.45

    def aim(obj, point):
        obj.rotation_euler = (Vector(point) - obj.location).to_track_quat("-Z", "Y").to_euler()

    for name, location, energy, size in (
        ("Soft key", (-3, -4, 5), 260, 4),
        ("Pond fill", (3, -2, 2.8), 130, 3),
        ("Ear rim", (1, 3, 4), 220, 3),
    ):
        data = bpy.data.lights.new(name, "AREA")
        data.energy, data.shape, data.size = energy, "DISK", size
        light = bpy.data.objects.new(name, data)
        scene.collection.objects.link(light)
        light.location = location
        aim(light, (0, 0, 1.15))
    camera_data = bpy.data.cameras.new("Trial camera")
    camera = bpy.data.objects.new("Trial camera", camera_data)
    scene.collection.objects.link(camera)
    camera.location = (1.1, -6, 2.3)
    camera_data.type = "ORTHO"
    camera_data.ortho_scale = 2.95
    aim(camera, (0.02, 0, 1.18))
    scene.camera = camera
    head = rig.pose.bones["Head"]
    body = rig.pose.bones["Body"]
    head.rotation_mode = "XYZ"
    args.frames_dir.mkdir(parents=True, exist_ok=True)
    for frame in range(1 if args.only_first else FRAME_COUNT):
        phase = frame / FRAME_COUNT * math.tau
        # Periodic sampling excludes the duplicate endpoint for a seamless loop.
        breath = math.sin(phase) * 0.008
        body.scale = (1 + breath * 0.5, 1 + breath * 0.5, 1 + breath)
        head.rotation_euler = (0, math.sin(phase) * 0.012, math.cos(phase) * 0.008)
        # A single two-frame blink; the original Blink morph supplies the lids.
        blink = {5: 0.75, 6: 1.0, 7: 0.25}.get(frame, 0.0)
        for obj in meshes:
            if obj.data.shape_keys and "Blink" in obj.data.shape_keys.key_blocks:
                obj.data.shape_keys.key_blocks["Blink"].value = blink
            if obj.name in ("GlintL", "GlintR"):
                obj.hide_render = blink > 0.5
        scene.frame_set(frame + 1)
        bpy.context.view_layer.update()
        scene.render.filepath = str(args.frames_dir / f"frame-{frame:02d}.png")
        bpy.ops.render.render(write_still=True)
        print("ORBITER_LITE_FRAME", frame, flush=True)
    info = {
        "source": str(SOURCE.relative_to(ROOT)).replace("\\", "/"),
        "source_sha256": hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
        "blender": bpy.app.version_string,
        "render_engine": scene.render.engine,
        "render_device": "CPU",
        "samples": scene.cycles.samples,
        "identity": "Neutral original coat; ear variant 0; authored neutral proportions",
        "hidden_variants": hidden,
        "conditions": "Orthographic near-front camera, three soft area lights, transparent film; breathing and original Blink morph",
        "limitations": [
            "One fixed identity, angle, lighting and neutral pose only",
            "Runtime growth, procedural coat paint, scarf, charm and earned cosmetics are not represented",
            "Not a pixel-identical substitute for the Three.js renderer",
            "Preview trial only; no default application renderer change",
        ],
    }
    (args.frames_dir / "render-info.json").write_text(json.dumps(info, indent=2) + "\n", encoding="utf-8")


def pack(args):
    from PIL import Image

    info = json.loads((args.frames_dir / "render-info.json").read_text(encoding="utf-8"))
    if info["source_sha256"] != hashlib.sha256(SOURCE.read_bytes()).hexdigest():
        raise RuntimeError("Source changed after render; rerender before packing")
    strip = Image.new("RGBA", (SIZE * FRAME_COUNT, SIZE), (0, 0, 0, 0))
    boxes = []
    for frame in range(FRAME_COUNT):
        with Image.open(args.frames_dir / f"frame-{frame:02d}.png") as image:
            image = image.convert("RGBA")
            if image.size != (SIZE, SIZE) or not image.getbbox():
                raise RuntimeError("Wrong size or empty frame: " + str(frame))
            boxes.append(image.getbbox())
            strip.paste(image, (frame * SIZE, 0))
    args.output_dir.mkdir(parents=True, exist_ok=True)
    output = args.output_dir / "kitten-idle.webp"
    strip.save(output, "WEBP", lossless=True, method=6, exact=True)
    with Image.open(output) as decoded:
        if decoded.size != strip.size or decoded.convert("RGBA").tobytes() != strip.tobytes():
            raise RuntimeError("Atlas roundtrip changed image pixels")
    info.update({
        "asset": output.name,
        "format": "lossless WebP horizontal sprite strip (not animated WebP)",
        "frames": FRAME_COUNT,
        "fps": FPS,
        "duration_seconds": FRAME_COUNT / FPS,
        "frame_width": SIZE,
        "frame_height": SIZE,
        "atlas_width": strip.width,
        "atlas_height": strip.height,
        "decoded_rgba_bytes": strip.width * strip.height * 4,
        "file_bytes": output.stat().st_size,
        "asset_sha256": hashlib.sha256(output.read_bytes()).hexdigest(),
        "frame_alpha_bounds": boxes,
    })
    (args.output_dir / "manifest.json").write_text(json.dumps(info, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({key: info[key] for key in ("asset", "file_bytes", "atlas_width", "atlas_height", "decoded_rgba_bytes")}, indent=2))


if __name__ == "__main__":
    args = arguments()
    pack(args) if args.pack else render(args)
