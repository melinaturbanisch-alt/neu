"""Vier Design-Konzepte für den Frontscheiben-Aufkleber (1100 x 300 mm).

Logo steht immer groß in der Mitte (230 mm), Schrift im Kupferton des Logos.
Je Konzept: mit schwarzem Balken und ohne Balken (transparent).
"""
import random
from build import (OUT, W, H, CX, CY, BLACK, COPPER, COPPER_STOPS, LOGO_H, LOGO_W,
                   LOGO_SVG, text_path)

INTER = "/usr/share/fonts/opentype/inter/"
MARGIN = 40
GAP = 50
LOGO_HALF = LOGO_W / 2
L_AREA = (MARGIN, CX - LOGO_HALF - GAP / 2)
R_AREA = (CX + LOGO_HALF + GAP / 2, W - MARGIN)


def copper_grad(gid, y_top, y_bot):
    stops = "".join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in COPPER_STOPS)
    return (f'<linearGradient id="{gid}" gradientUnits="userSpaceOnUse" x1="0" y1="{y_top:.2f}" '
            f'x2="0" y2="{y_bot:.2f}">{stops}</linearGradient>')


def words(font_l, font_r, cap_l, cap_r, track_l, track_r, skew=0, base=None, align="center"):
    """MELVONA links, MARKETING rechts. Gibt (svg, defs, geometrie) zurück."""
    d1, w1 = text_path(font_l, "MELVONA", cap_l, track_l)
    d2, w2 = text_path(font_r, "MARKETING", cap_r, track_r)
    cap = max(cap_l, cap_r)
    base = base if base is not None else CY + cap / 2
    if align == "center":
        x1 = sum(L_AREA) / 2 - w1 / 2
        x2 = sum(R_AREA) / 2 - w2 / 2
    else:  # zum Logo hin ausgerichtet
        x1 = L_AREA[1] - w1
        x2 = R_AREA[0]
    assert x1 >= MARGIN - 1 and x2 + w2 <= W - MARGIN + 1, (x1, x2 + w2)
    sk = f" skewX({skew})" if skew else ""
    svg = (f'<g id="SCHRIFT" fill="url(#kupfer)">'
           f'<path transform="translate({x1:.2f},{base:.2f}){sk}" d="{d1}"/>'
           f'<path transform="translate({x2:.2f},{base:.2f}){sk}" d="{d2}"/></g>')
    return svg, copper_grad("kupfer", base - cap, base), dict(x1=x1, w1=w1, x2=x2, w2=w2, base=base, cap=cap)


# --------------------------------------------------------------------------- Konzepte

def k1_glow():
    """Lichtschein hinter dem Logo, Linien laufen nach außen aus."""
    t, g, _ = words(INTER + "Inter-Light.otf", INTER + "Inter-Light.otf", 26, 26, 0.34, 0.34)
    defs = g + (
        '<radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">'
        '<stop offset="0" stop-color="#b4876e" stop-opacity="0.38"/>'
        '<stop offset="0.45" stop-color="#8d614a" stop-opacity="0.14"/>'
        '<stop offset="1" stop-color="#8d614a" stop-opacity="0"/></radialGradient>'
        '<linearGradient id="fade" x1="0" x2="1" y1="0" y2="0">'
        '<stop offset="0" stop-color="#a47962" stop-opacity="0"/>'
        '<stop offset="0.5" stop-color="#c9a089" stop-opacity="1"/>'
        '<stop offset="1" stop-color="#a47962" stop-opacity="0"/></linearGradient>')
    art = (f'<ellipse cx="{CX}" cy="{CY}" rx="300" ry="150" fill="url(#glow)"/>'
           f'<rect x="{MARGIN}" y="15.4" width="{W - 2 * MARGIN}" height="1.2" fill="url(#fade)"/>'
           f'<rect x="{MARGIN}" y="{H - 16.6}" width="{W - 2 * MARGIN}" height="1.2" fill="url(#fade)"/>')
    return defs, art + t


def k2_speed():
    """Motorsport: kursive Schrift, spitz zulaufende Speed-Linien nach außen."""
    t, g, m = words(INTER + "Inter-LightItalic.otf", INTER + "Inter-LightItalic.otf", 26, 26, 0.30, 0.30,
                    skew=-8, base=CY + 8, align="logo")
    y = m["base"] + 14
    defs = g + (
        '<linearGradient id="spL" x1="0" x2="1"><stop offset="0" stop-color="#a47962" stop-opacity="0"/>'
        '<stop offset="1" stop-color="#c9a089"/></linearGradient>'
        '<linearGradient id="spR" x1="0" x2="1"><stop offset="0" stop-color="#c9a089"/>'
        '<stop offset="1" stop-color="#a47962" stop-opacity="0"/></linearGradient>')
    lx, rx = L_AREA[1], R_AREA[0]
    art = ""
    for dy, th, ln in ((0, 3.2, 1.0), (8, 1.8, 0.72), (14, 1.0, 0.45)):
        lenL = (lx - MARGIN) * ln
        lenR = (W - MARGIN - rx) * ln
        yy = y + dy
        # Linie: am Logo dick, außen spitz
        art +=f'<polygon points="{lx:.1f},{yy:.1f} {lx:.1f},{yy + th:.1f} {lx - lenL:.1f},{yy + th:.1f}" fill="url(#spL)"/>'
        art += f'<polygon points="{rx:.1f},{yy:.1f} {rx:.1f},{yy + th:.1f} {rx + lenR:.1f},{yy + th:.1f}" fill="url(#spR)"/>'
    return defs, t + art


def k3_wireframe():
    """Dezentes Polygon-Netz wie im Logo, läuft zu Logo und Rand hin aus."""
    t, g, m = words(INTER + "Inter-Light.otf", INTER + "Inter-Light.otf", 26, 26, 0.34, 0.34)
    rnd = random.Random(7)
    step = 38
    cols, rows = int(W / step) + 2, int(H / step) + 2
    pts = [[(c * step + rnd.uniform(-13, 13), r * step + rnd.uniform(-13, 13)) for c in range(cols)]
           for r in range(rows)]
    lines = []
    for r in range(rows - 1):
        for c in range(cols - 1):
            a, b, d, e = pts[r][c], pts[r][c + 1], pts[r + 1][c], pts[r + 1][c + 1]
            tri = [(a, b, e), (a, e, d)] if (r + c) % 2 else [(a, b, d), (b, e, d)]
            for p1, p2, p3 in tri:
                for u, v in ((p1, p2), (p2, p3), (p3, p1)):
                    lines.append((u, v))
    seen, out = set(), []
    for u, v in lines:
        k = tuple(sorted((tuple(round(x, 1) for x in u), tuple(round(x, 1) for x in v))))
        if k in seen:
            continue
        seen.add(k)
        mx = (u[0] + v[0]) / 2
        dist = abs(mx - CX)
        # Netz nur seitlich, um Logo frei, nach außen dünner
        if dist < LOGO_HALF + 20:
            continue
        op = min(1, (dist - LOGO_HALF - 20) / 120) * max(0, 1 - (dist - 330) / 220)
        # rund um die Schrift fast ausblenden (Lesbarkeit)
        my = (u[1] + v[1]) / 2
        if abs(my - (m["base"] - m["cap"] / 2)) < 42:
            op *= 0.12
        else:
            op *= min(1, (abs(my - (m["base"] - m["cap"] / 2)) - 42) / 40 + 0.12)
        if op <= 0.03:
            continue
        out.append(f'<line x1="{u[0]:.1f}" y1="{u[1]:.1f}" x2="{v[0]:.1f}" y2="{v[1]:.1f}" '
                   f'stroke-opacity="{0.42 * op:.2f}"/>')
    art = (f'<clipPath id="bar"><rect width="{W}" height="{H}"/></clipPath>'
           f'<g clip-path="url(#bar)" stroke="#a47962" stroke-width="0.8">{"".join(out)}</g>')
    # Schrift bekommt eine schwarze Unterlage, damit das Netz sie nicht stört
    return g, art + t


def k4_kontrast():
    """Gewichts-Kontrast: MELVONA kräftig, MARKETING fein, Trennstriche am Logo."""
    t, g, m = words(INTER + "Inter-Medium.otf", INTER + "Inter-ExtraLight.otf", 27, 27, 0.30, 0.42)
    vx = (L_AREA[1] + 8, R_AREA[0] - 8)
    defs = g + ('<linearGradient id="vfade" x1="0" x2="0" y1="0" y2="1">'
                '<stop offset="0" stop-color="#c9a089" stop-opacity="0"/>'
                '<stop offset="0.5" stop-color="#c9a089"/>'
                '<stop offset="1" stop-color="#c9a089" stop-opacity="0"/></linearGradient>')
    art = "".join(f'<rect x="{x - 0.6:.1f}" y="{CY - 70}" width="1.2" height="140" fill="url(#vfade)"/>' for x in vx)
    art += (f'<g stroke="{COPPER}" stroke-width="1.2">'
            f'<line x1="{MARGIN}" y1="16" x2="{W - MARGIN}" y2="16"/>'
            f'<line x1="{MARGIN}" y1="{H - 16}" x2="{W - MARGIN}" y2="{H - 16}"/></g>')
    return defs, art + t


CONCEPTS = {
    "1-glow": (k1_glow, "Lichtschein hinter dem Logo, Linien laufen aus"),
    "2-speed": (k2_speed, "Motorsport: kursiv mit Speed-Linien"),
    "3-wireframe": (k3_wireframe, "Polygon-Netz wie im Logo im Hintergrund"),
    "4-kontrast": (k4_kontrast, "Fett/fein-Kontrast mit Trennstrichen"),
}


def main():
    (OUT / "konzepte").mkdir(exist_ok=True)
    for name, (fn, label) in CONCEPTS.items():
        defs, art = fn()
        for mode, bg in (("mit-balken", f'<rect id="BALKEN" width="{W}" height="{H}" fill="{BLACK}"/>'),
                         ("ohne-balken", "")):
            svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<!-- MELVONA MARKETING Frontscheibe | 1100 x 300 mm | Konzept {name}: {label} | {mode} -->
<svg xmlns="http://www.w3.org/2000/svg" width="1100mm" height="300mm" viewBox="0 0 {W} {H}">
  <defs>{defs}</defs>
  {bg}
  {art}
  {LOGO_SVG}
</svg>
'''
            (OUT / "konzepte" / f"melvona_110x30_konzept-{name}_{mode}.svg").write_text(svg)
        print(name, label)


if __name__ == "__main__":
    main()
