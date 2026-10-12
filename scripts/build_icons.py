"""Render the original eclipse mark as opaque PNGs with Python's standard library.

Geometry is code-owned so small launcher icons remain crisp without downloaded art.
Run: python scripts/build_icons.py. This regenerates web icons and the Apple icon.
"""
from pathlib import Path
import math
import struct
import zlib

ROOT = Path(__file__).resolve().parent.parent


def mix(a, b, ratio):
    return tuple(a[i] * (1 - ratio) + b[i] * ratio for i in range(3))


def pixel(x, y):
    """Opaque eclipse icon with a dark horizon and layered accretion light."""
    background = mix((9, 13, 28), (36, 35, 60), max(0, min(1, .55-.3*x-.35*y)))
    radius = math.hypot(x, y)
    glow = math.exp(-((radius-.4)/.13)**2)*.25
    background = mix(background, (113, 91, 178), glow)
    rx, ry = .94*x-.342*y, .342*x+.94*y
    ellipse = math.sqrt((rx/.77)**2+(ry/.235)**2)
    ring = .92 < ellipse < 1.08
    color = mix((131, 152, 221), (239, 216, 226), max(0,min(1,.55-rx*.4-ry)))
    if ring:
        background = color
    if radius < .40:
        background = mix((7, 10, 23), (29, 26, 49), (radius/.4)**8*.7)
    if .395 < radius < .425 and y < -.08:
        background = mix((174, 157, 226), (243, 228, 245), max(0,min(1,.6-x)))
    if ring and ry > 0:
        background = color
    # A small four-point guiding star keeps the mark distinct at launcher sizes.
    sx, sy = abs(x-.52), abs(y+.57)
    if (sx/.024+sy/.075)<1 or (sx/.075+sy/.024)<1:
        background = (242, 213, 186)
    return background


def chunk(kind, data):
    return struct.pack('!I',len(data))+kind+data+struct.pack('!I',zlib.crc32(kind+data)&0xffffffff)


def render(size, path):
    rows = bytearray()
    # Four subpixel samples smooth the diagonal orbital ring at launcher sizes.
    for row in range(size):
        rows.append(0)
        for col in range(size):
            values = [pixel(2*(col+dx)/size-1,2*(row+dy)/size-1) for dx,dy in ((.25,.25),(.75,.25),(.25,.75),(.75,.75))]
            rows.extend(round(sum(value[channel] for value in values)/4) for channel in range(3))
    header=struct.pack('!2I5B',size,size,8,2,0,0,0)
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',header)+chunk(b'IDAT',zlib.compress(rows,9))+chunk(b'IEND',b''))
    print(f'Rendered {path.relative_to(ROOT)} ({size}px)')


if __name__ == '__main__':
    for size in (180,192,512):
        render(size,ROOT/f'web/icons/orbit-{size}.png')
    render(1024,ROOT/'Scheduler/Assets.xcassets/AppIcon.appiconset/AppIcon.png')
