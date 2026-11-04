"""Erzeugt den Frontscheiben-Aufkleber MELVONA MARKETING im Originalmaß.

Maße in Millimetern: 1100 x 300 (110 x 30 cm).
Logo max. 180 mm hoch, Schrift deutlich kleiner.
Alle Schriften werden in Pfade umgewandelt (druckfertig, keine Font-Abhängigkeit).
"""
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
import pathlib

OUT = pathlib.Path(__file__).parent
W, H = 1100, 300          # Balken
LOGO_H = 180              # max. Logohöhe
CX, CY = W / 2, H / 2
BLACK = "#0b0b0b"
COPPER = "#b87745"        # Kupfer / Rosegold (Folie: Kupfer-Chrom oder Rosegold-Metallic)


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


def logo_placeholder():
    """Platzhalter-Monogramm (180 mm hoch). Bitte durch das Original-Logo (Vektor) ersetzen."""
    ff = "/usr/share/fonts/truetype/freefont/FreeSerifBold.ttf"
    (x0, y0, x1, y1), gs = glyph_bounds(ff, "M")
    m_h = LOGO_H                   # Platzhalter nutzt die vollen 180 mm
    s = m_h / (y1 - y0)
    m_w = (x1 - x0) * s
    left = CX - m_w / 2
    base = CY + LOGO_H / 2         # Unterkante Logo = 240
    pen = SVGPathPen(gs)
    tp = TransformPen(pen, (s, 0, 0, -s, left - x0 * s, base + y0 * s))
    f = TTFont(ff)
    gs[f.getBestCmap()[ord("M")]].draw(tp)
    top = base - m_h               # 110
    # Schnörkel (Schlange/Ranke) rechts oben, endet bei y = 60 (Logo-Oberkante)
    r = left + m_w * 0.72
    swirl = (
        f"M{r - 6:.1f},{top + 8:.1f} "
        f"C{r - 30:.1f},{top - 20:.1f} {r + 4:.1f},{top - 52:.1f} {r + 26:.1f},{top - 48:.1f} "
        f"C{r + 52:.1f},{top - 43:.1f} {r + 52:.1f},{top - 6:.1f} {r + 30:.1f},{top + 6:.1f} "
        f"C{r + 18:.1f},{top + 13:.1f} {r + 8:.1f},{top + 4:.1f} {r + 14:.1f},{top - 6:.1f}"
    )
    return (
        f'<g id="LOGO-PLATZHALTER" fill="{COPPER}">'
        f'<path d="{pen.getCommands()}"/>'
        "</g>"
    )


VARIANTS = {
    "A-klassisch": dict(font="/usr/share/fonts/truetype/crosextra/Caladea-Regular.ttf",
                        cap=28, tracking=0.28, label="Serif, klassisch-edel (nah am Entwurf)"),
    "B-modern": dict(font="/usr/share/fonts/opentype/inter/Inter-Light.otf",
                     cap=26, tracking=0.36, label="Sans Light, modern-luxuriös"),
}

GAP = 55   # Abstand Schrift <-> Logo (vom Logo-Rand aus)
LOGO_HALF = 95

for name, v in VARIANTS.items():
    d1, w1 = text_path(v["font"], "MELVONA", v["cap"], v["tracking"])
    d2, w2 = text_path(v["font"], "MARKETING", v["cap"], v["tracking"])
    base = CY + v["cap"] / 2
    # beide Wörter optisch mittig in ihrer Hälfte
    left_area = (40, CX - LOGO_HALF - GAP / 2)
    right_area = (CX + LOGO_HALF + GAP / 2, W - 40)
    x1 = (left_area[0] + left_area[1]) / 2 - w1 / 2
    x2 = (right_area[0] + right_area[1]) / 2 - w2 / 2
    assert x1 > 40 and x2 + w2 < W - 40, (name, x1, x2 + w2)
    line_y = (22, H - 22)
    svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<!-- MELVONA MARKETING Frontscheibe | 1100 x 300 mm | Variante {name}: {v["label"]} -->
<svg xmlns="http://www.w3.org/2000/svg" width="1100mm" height="300mm" viewBox="0 0 {W} {H}">
  <rect id="BALKEN" width="{W}" height="{H}" fill="{BLACK}"/>
  <g id="LINIEN" stroke="{COPPER}" stroke-width="1.2">
    <line x1="40" y1="{line_y[0]}" x2="{W-40}" y2="{line_y[0]}"/>
    <line x1="40" y1="{line_y[1]}" x2="{W-40}" y2="{line_y[1]}"/>
  </g>
  <g id="SCHRIFT" fill="{COPPER}">
    <path transform="translate({x1:.2f},{base:.2f})" d="{d1}"/>
    <path transform="translate({x2:.2f},{base:.2f})" d="{d2}"/>
  </g>
  {logo_placeholder()}
</svg>
'''
    (OUT / f"melvona_frontscheibe_110x30_{name}.svg").write_text(svg)
    print(name, "MELVONA", round(w1), "mm  MARKETING", round(w2), "mm  Versalhöhe", v["cap"], "mm")
