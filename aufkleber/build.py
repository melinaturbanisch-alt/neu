"""Erzeugt den Frontscheiben-Aufkleber MELVONA MARKETING im Originalmaß.

Maße in Millimetern: 1100 x 300 (110 x 30 cm).
Logo 230 mm hoch, Schrift deutlich kleiner, Schrift im Kupferton des Logos.
Je Variante: mit schwarzem Balken und ohne Balken (transparent, zum Aufkleben auf vorhandenen Balken).
Alle Schriften werden in Pfade umgewandelt (druckfertig, keine Font-Abhängigkeit).
"""
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
import pathlib

OUT = pathlib.Path(__file__).parent
W, H = 1100, 300          # Balken
LOGO_H = 230              # Logohöhe (23 von 30 cm)
CX, CY = W / 2, H / 2
BLACK = "#0b0b0b"
# Farben direkt aus dem Logo gemessen (Helligkeits-Perzentile der Logo-Pixel)
COPPER = "#a47962"        # mittlerer Kupferton des Logos (Linien)
COPPER_STOPS = [          # Metallic-Verlauf aus den gesättigten Logo-Pixeln
    (0.00, "#c9a089"), (0.30, "#b4876e"), (0.60, "#a47962"),
    (0.85, "#8d614a"), (1.00, "#a47962"),
]


def text_path(font_file, text, cap_mm, tracking_em):
    """Gibt (svg-d, breite_mm) für Text in Großbuchstaben zurück, Grundlinie bei y=0."""
    f = TTFont(font_file)
    gs = f.getGlyphSet()
    cmap = f.getBestCmap()
    upm = f["head"].unitsPerEm
    cap = getattr(f["OS/2"], "sCapHeight", 0) or 0.7 * upm
    s = cap_mm / cap
    pen = SVGPathPen(gs)
    x = 0.0
    for i, ch in enumerate(text):
        g = cmap[ord(ch)]
        tp = TransformPen(pen, (s, 0, 0, -s, x, 0))
        gs[g].draw(tp)
        x += gs[g].width * s
        if i < len(text) - 1:
            x += tracking_em * upm * s
    return pen.getCommands(), x


def glyph_bounds(font_file, ch):
    f = TTFont(font_file)
    gs = f.getGlyphSet()
    bp = BoundsPen(gs)
    gs[f.getBestCmap()[ord(ch)]].draw(bp)
    return bp.bounds, gs


def logo_image():
    """Original-Logo (PNG mit Transparenz), exakt 180 mm hoch, mittig."""
    import base64
    from PIL import Image
    f = OUT / "logo_melvona_M.png"
    w_px, h_px = Image.open(f).size
    w = LOGO_H * w_px / h_px
    data = base64.b64encode(f.read_bytes()).decode()
    return w, (f'<image id="LOGO" x="{CX - w / 2:.2f}" y="{CY - LOGO_H / 2:.2f}" width="{w:.2f}" '
               f'height="{LOGO_H}" href="data:image/png;base64,{data}"/>')


LOGO_W, LOGO_SVG = logo_image()

VARIANTS = {
    "A-klassisch": dict(font="/usr/share/fonts/truetype/crosextra/Caladea-Regular.ttf",
                        cap=27, tracking=0.26, label="Serif, klassisch-edel"),
    "B-modern": dict(font="/usr/share/fonts/opentype/inter/Inter-Light.otf",
                     cap=26, tracking=0.34, label="Sans Light, wie der Schriftzug im Logo"),
}

GAP = 50   # Abstand Schrift <-> Logo
MARGIN = 40
LOGO_HALF = LOGO_W / 2
LINE_Y = (16, H - 16)

for name, v in VARIANTS.items():
    d1, w1 = text_path(v["font"], "MELVONA", v["cap"], v["tracking"])
    d2, w2 = text_path(v["font"], "MARKETING", v["cap"], v["tracking"])
    base = CY + v["cap"] / 2
    left_area = (MARGIN, CX - LOGO_HALF - GAP / 2)
    right_area = (CX + LOGO_HALF + GAP / 2, W - MARGIN)
    x1 = (left_area[0] + left_area[1]) / 2 - w1 / 2
    x2 = (right_area[0] + right_area[1]) / 2 - w2 / 2
    assert x1 >= MARGIN and x2 + w2 <= W - MARGIN, (name, x1, x2 + w2)
    stops = "".join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in COPPER_STOPS)
    defs = (f'<defs><linearGradient id="kupfer" gradientUnits="userSpaceOnUse" '
            f'x1="0" y1="{base - v["cap"]:.2f}" x2="0" y2="{base:.2f}">{stops}</linearGradient></defs>')
    for mode, bg in (("mit-balken", f'<rect id="BALKEN" width="{W}" height="{H}" fill="{BLACK}"/>'),
                     ("ohne-balken", "")):
        svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<!-- MELVONA MARKETING Frontscheibe | 1100 x 300 mm | {name} ({v["label"]}) | {mode} -->
<svg xmlns="http://www.w3.org/2000/svg" width="1100mm" height="300mm" viewBox="0 0 {W} {H}">
  {defs}
  {bg}
  <g id="LINIEN" stroke="{COPPER}" stroke-width="1.2">
    <line x1="{MARGIN}" y1="{LINE_Y[0]}" x2="{W - MARGIN}" y2="{LINE_Y[0]}"/>
    <line x1="{MARGIN}" y1="{LINE_Y[1]}" x2="{W - MARGIN}" y2="{LINE_Y[1]}"/>
  </g>
  <g id="SCHRIFT" fill="url(#kupfer)">
    <path transform="translate({x1:.2f},{base:.2f})" d="{d1}"/>
    <path transform="translate({x2:.2f},{base:.2f})" d="{d2}"/>
  </g>
  {LOGO_SVG}
</svg>
'''
        (OUT / f"melvona_frontscheibe_110x30_{name}_{mode}.svg").write_text(svg)
    print(name, "MELVONA", round(w1), "mm  MARKETING", round(w2), "mm  Versalhöhe", v["cap"], "mm  Logo",
          LOGO_H, "x", round(LOGO_W), "mm")
