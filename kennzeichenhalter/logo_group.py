"""SANISA GROUP Logo freistellen + Lockups für den Kennzeichenhalter.

- nur:  Zeichen + SANISA (Original-Buchstabenabstände, nichts gesperrt)
- group: wie nur, „GROUP“ rechts daneben statt darunter (Grundlinie bündig mit SANISA)
"""
from pathlib import Path
import numpy as np
from PIL import Image

D = Path(__file__).parent / "logo"
YELLOW, DARK, WHITE = (254, 209, 58), (40, 39, 44), (255, 255, 255)
a = np.asarray(Image.open(D / "sanisa_group_original.jpg").convert("RGB")).astype(float)
H, W, _ = a.shape
MX = 260
al = np.zeros((H, W))
al[:, :MX] = np.clip((255 - a[:, :MX, 2]) / (255 - YELLOW[2]), 0, 1)
al[:, MX:] = np.clip((255 - a[:, MX:].mean(2)) / (255 - 38), 0, 1)
mark_mask = np.zeros((H, W), bool); mark_mask[:, :MX] = True

TOP, BASE = 1, 198            # SANISA-Zeilen
GROUP = (949, 229, 1280, 263)  # GROUP-Bereich
GROUP_SCALE = 1.8              # GROUP etwas größer, weil es jetzt daneben steht


def render(mc, tc):
    o = np.zeros((H, W, 4))
    o[..., :3] = np.where(mark_mask[..., None], mc, tc)
    o[..., 3] = al * 255
    return Image.fromarray(o.astype(np.uint8), "RGBA")


def lockup(img, group):
    th = BASE - TOP
    s = th / H
    mark = img.crop((0, 0, 221, H)).resize((round(221 * s), th), Image.LANCZOS)
    gap = round(77 * s)  # Original-Abstand Zeichen–Schrift, mitskaliert
    text = img.crop((297, TOP, 1280, BASE))
    parts = [(mark, 0), (text, mark.width + gap)]
    w = mark.width + gap + text.width
    if group:
        g = img.crop(GROUP)
        g = g.resize((round(g.width * GROUP_SCALE), round(g.height * GROUP_SCALE)), Image.LANCZOS)
        gx = w + 70
        parts.append((g, gx, th - g.height))
        w = gx + g.width
    c = Image.new("RGBA", (w, th), (0, 0, 0, 0))
    for p in parts:
        c.alpha_composite(p[0], (p[1], p[2] if len(p) > 2 else 0))
    return c


for name, (mc, tc) in {"hell": (YELLOW, WHITE), "dunkel": (DARK, DARK), "original": (YELLOW, DARK)}.items():
    img = render(mc, tc)
    lockup(img, False).save(D / f"group_nur-logo_{name}.png")
    lockup(img, True).save(D / f"group_mit-group_{name}.png")
print("ok")
