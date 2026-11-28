"""Freistellen des SANISA-Logos (JPG) in transparente PNG-Varianten.

Hinweis: Für den Druck besser die Original-Vektordatei (AI/EPS/PDF) des Logos verwenden.
"""
from pathlib import Path
import numpy as np
from PIL import Image

D = Path(__file__).parent / "logo"
YELLOW = (254, 209, 58)
DARK = (40, 39, 44)
WHITE = (255, 255, 255)

a = np.asarray(Image.open(D / "sanisa_logo_original.jpg").convert("RGB")).astype(float)
H, W, _ = a.shape
MARK_X = 300  # links davon: gelbes Zeichen, rechts: Schrift
alpha = np.zeros((H, W))
alpha[:, :MARK_X] = np.clip((255 - a[:, :MARK_X, 2]) / (255 - YELLOW[2]), 0, 1)
alpha[:, MARK_X:] = np.clip((255 - a[:, MARK_X:].mean(2)) / (255 - 38), 0, 1)
is_mark = np.zeros((H, W), bool)
is_mark[:, :MARK_X] = True


def render(mark_col, text_col, al=alpha):
    out = np.zeros((H, W, 4))
    out[..., :3] = np.where(is_mark[..., None], mark_col, text_col)
    out[..., 3] = al * 255
    return Image.fromarray(out.astype(np.uint8), "RGBA")


def compact(img):
    """Zeichen + SANISA ohne Unterzeile; Zeichen auf Höhe der Schrift skaliert."""
    TEXT_H = 186
    mark = img.crop((0, 0, 251, H)).resize((round(251 * TEXT_H / H), TEXT_H), Image.LANCZOS)
    text = img.crop((351, 0, W, TEXT_H))
    gap = 64
    c = Image.new("RGBA", (mark.width + gap + text.width, TEXT_H), (0, 0, 0, 0))
    c.paste(mark, (0, 0))
    c.paste(text, (mark.width + gap, 0))
    return c


variants = {
    "hell": (YELLOW, WHITE),      # für schwarzen Rahmen
    "original": (YELLOW, DARK),   # für weißen/hellen Grund
    "dunkel": (DARK, DARK),       # einfarbig, für gelben Grund
}
for name, (mc, tc) in variants.items():
    full = render(mc, tc)
    full.save(D / f"sanisa_logo_{name}.png")
    compact(full).save(D / f"sanisa_kompakt_{name}.png")
print("ok")


# Buchstaben-Spalten von "SANISA" im Original (px), für eine breiter gesperrte Version
LETTERS = [(351, 486), (490, 666), (667, 839), (858, 942), (963, 1094), (1097, 1280)]


def wide(img, extra=150):
    """Zeichen + SANISA mit größerem Buchstabenabstand (Buchstaben selbst unverzerrt)."""
    TEXT_H = 186
    mark = img.crop((0, 0, 251, H)).resize((round(251 * TEXT_H / H), TEXT_H), Image.LANCZOS)
    gaps = [b[0] - a[1] for a, b in zip(LETTERS, LETTERS[1:])]
    width = mark.width + 64 + extra + sum(r - l for l, r in LETTERS) + sum(gaps) + extra * len(gaps)
    c = Image.new("RGBA", (width, TEXT_H), (0, 0, 0, 0))
    c.paste(mark, (0, 0))
    x = mark.width + 64 + extra
    for i, (l, r) in enumerate(LETTERS):
        c.paste(img.crop((l, 0, r, TEXT_H)), (x, 0))
        x += (r - l) + (gaps[i] + extra if i < len(gaps) else 0)
    return c


for name, (mc, tc) in variants.items():
    wide(render(mc, tc)).save(D / f"sanisa_breit_{name}.png")
