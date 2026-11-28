"""SANISA Kennzeichenhalter – Druckvorlagen (SVG, Maße in mm).

A = 520 x 110 mm  (EU-Standard: PKW + LKW-Front, passt fürs ganze Sortiment)
B = 340 x 200 mm  (zweizeilig, LKW-Heck / Baumaschinen)
Texte auf Englisch, damit sie auch im Export verstanden werden.
Schrift in Pfade umgewandelt (Inter).
"""
import base64
from pathlib import Path
from PIL import Image
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

HERE = Path(__file__).parent
OUT = HERE / "druckvorlagen"
OUT.mkdir(exist_ok=True)
INTER = "/usr/share/fonts/opentype/inter/"
YELLOW, BLACK, WHITE, DARK = "#FED13A", "#141414", "#FFFFFF", "#28272C"

LINE_EN = "TRUCKS  ·  CONSTRUCTION MACHINERY  ·  REAL ESTATE"
WEB = "WWW.SANISA.DE"   # PLATZHALTER – vor Bestellung prüfen!


def text_path(font, text, cap_mm, track_em=0.0):
    f = TTFont(INTER + font)
    gs, cmap, upm = f.getGlyphSet(), f.getBestCmap(), f["head"].unitsPerEm
    s = cap_mm / f["OS/2"].sCapHeight
    pen, x = SVGPathPen(gs), 0.0
    for i, ch in enumerate(text):
        g = cmap[ord(ch)]
        gs[g].draw(TransformPen(pen, (s, 0, 0, -s, x, 0)))
        x += gs[g].width * s + (track_em * upm * s if i < len(text) - 1 else 0)
    return pen.getCommands(), x


def img(name):
    p = HERE / "logo" / f"{name}.png"
    w, h = Image.open(p).size
    return w / h, base64.b64encode(p.read_bytes()).decode()


class Frame:
    def __init__(self, pw, ph, side=8, top=8, bottom=22, r=6):
        self.pw, self.ph = pw, ph
        self.W, self.H = pw + 2 * side, ph + top + bottom
        self.side, self.top, self.bottom, self.r = side, top, bottom, r
        self.strip_y = top + ph            # Oberkante Werbeleiste
        self.el = []

    def logo(self, name, cx, cy, h, anchor="middle"):
        ar, b64 = img(name)
        w = h * ar
        x = cx - w / 2 if anchor == "middle" else cx
        self.el.append(f'<image x="{x:.2f}" y="{cy - h / 2:.2f}" width="{w:.2f}" height="{h:.2f}" '
                       f'href="data:image/png;base64,{b64}"/>')
        return w

    def text(self, s, x, base, cap, color, font="Inter-SemiBold.otf", track=0.08, anchor="start"):
        d, w = text_path(font, s, cap, track)
        if anchor == "middle":
            x -= w / 2
        self.el.append(f'<path transform="translate({x:.2f} {base:.2f})" fill="{color}" d="{d}"/>')
        return w

    def svg(self, strip_color=BLACK, with_plate=False, plate_lines=None):
        W, H, r = self.W, self.H, self.r
        sx, sy = self.side, self.top
        hole = f'M{sx + 1.5},{sy + 1.5} h{self.pw - 3} v{self.ph - 3} h{-(self.pw - 3)} z'
        outer = (f'M{r},0 H{W - r} A{r},{r} 0 0 1 {W},{r} V{H - r} A{r},{r} 0 0 1 {W - r},{H} '
                 f'H{r} A{r},{r} 0 0 1 0,{H - r} V{r} A{r},{r} 0 0 1 {r},0 Z')
        parts = []
        if with_plate:
            parts.append(plate(sx, sy, self.pw, self.ph, plate_lines))
        parts.append(f'<path fill="{BLACK}" fill-rule="evenodd" d="{outer} {hole}"/>')
        if strip_color != BLACK:
            sh = self.bottom - 3
            y0 = self.strip_y + 1.5
            parts.append(f'<rect x="{sx}" y="{y0}" width="{self.pw}" height="{sh}" rx="2.5" fill="{strip_color}"/>')
        # feine Kante als Prägung
        parts.append(f'<path fill="none" stroke="#2c2c2c" stroke-width="0.6" d="{hole}"/>')
        parts += self.el
        return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}mm" height="{H}mm" '
                f'viewBox="0 0 {W} {H}">{"".join(parts)}</svg>')


def plate(x, y, w, h, lines):
    """Muster-Kennzeichen nur für die Vorschau (nicht Teil des Drucks)."""
    s = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="4" fill="#f4f4f1" stroke="#111" stroke-width="1.2"/>',
         f'<rect x="{x + 2}" y="{y + 2}" width="34" height="{h - 4}" rx="2" fill="#123f9c"/>',
         f'<text x="{x + 19}" y="{y + h - 12}" font-family="DejaVu Sans" font-weight="bold" font-size="18" '
         f'fill="#fff" text-anchor="middle">D</text>']
    cx = x + 36 + (w - 36) / 2
    if lines == 1:
        s.append(f'<text x="{cx}" y="{y + h / 2 + 27}" font-family="DejaVu Sans Condensed, DejaVu Sans" '
                 f'font-weight="bold" font-size="76" fill="#111" text-anchor="middle" '
                 f'textLength="{w - 80}" lengthAdjust="spacingAndGlyphs">SA NI 520</text>')
    else:
        s.append(f'<text x="{cx}" y="{y + 88}" font-family="DejaVu Sans" font-weight="bold" font-size="72" '
                 f'fill="#111" text-anchor="middle" textLength="{w - 90}" lengthAdjust="spacingAndGlyphs">SA NI</text>')
        s.append(f'<text x="{cx}" y="{y + 180}" font-family="DejaVu Sans" font-weight="bold" font-size="72" '
                 f'fill="#111" text-anchor="middle" textLength="{w - 90}" lengthAdjust="spacingAndGlyphs">340 L</text>')
    return "".join(s)


def designs():
    out = {}

    # ---------- A: 520 x 110 (PKW + LKW-Front) ----------
    def A():
        return Frame(520, 110, side=8, top=8, bottom=22)

    # A1 Classic – Original-Logo mittig
    f = A(); cy = f.strip_y + f.bottom / 2
    f.logo("sanisa_logo_hell", f.W / 2, cy, 15.5)
    out["A1_520x110_classic"] = (f, BLACK, 1)

    # A2 International – Logo + englische Leistungszeile + Web
    f = A(); cy = f.strip_y + f.bottom / 2
    lh = 11.5
    _, wl = text_path("Inter-SemiBold.otf", LINE_EN, 3.4, 0.08)
    ar, _ = img("sanisa_kompakt_hell")
    gap = 9
    total = lh * ar + gap + 0.6 + gap + wl
    x0 = f.W / 2 - total / 2
    f.logo("sanisa_kompakt_hell", x0, cy, lh, anchor="start")
    xd = x0 + lh * ar + gap
    f.el.append(f'<rect x="{xd:.2f}" y="{cy - 6:.2f}" width="0.6" height="12" fill="{YELLOW}"/>')
    xt = xd + 0.6 + gap
    f.text(LINE_EN, xt, cy - 1.0, 3.4, WHITE)
    f.text(WEB, xt, cy + 5.6, 3.4, YELLOW, font="Inter-Bold.otf", track=0.14)
    out["A2_520x110_international"] = (f, BLACK, 1)

    # A3 Yellow – gelbe Leiste, Logo einfarbig dunkel
    f = A(); cy = f.strip_y + f.bottom / 2
    total = lh * ar + gap + 0.6 + gap + wl
    x0 = f.W / 2 - total / 2
    f.logo("sanisa_kompakt_dunkel", x0, cy, lh, anchor="start")
    xd = x0 + lh * ar + gap
    f.el.append(f'<rect x="{xd:.2f}" y="{cy - 6:.2f}" width="0.6" height="12" fill="{DARK}"/>')
    xt = xd + 0.6 + gap
    f.text(LINE_EN, xt, cy - 1.0, 3.4, DARK)
    f.text(WEB, xt, cy + 5.6, 3.4, DARK, font="Inter-Bold.otf", track=0.14)
    out["A3_520x110_yellow"] = (f, YELLOW, 1)

    # ---------- B: 340 x 200 (LKW-Heck, zweizeilig) ----------
    def B():
        return Frame(340, 200, side=8, top=8, bottom=30, r=7)

    for key, strip, logo, col_line, col_web in [
        ("B2_340x200_international", BLACK, "sanisa_kompakt_hell", WHITE, YELLOW),
        ("B3_340x200_yellow", YELLOW, "sanisa_kompakt_dunkel", DARK, DARK),
    ]:
        f = B(); y = f.strip_y
        f.logo(logo, f.W / 2, y + 10.5, 11)
        line = "TRUCKS · CONSTRUCTION MACHINERY · REAL ESTATE"
        f.text(line, f.W / 2, y + 21.2, 2.9, col_line, track=0.06, anchor="middle")
        f.text(WEB, f.W / 2, y + 26.4, 2.9, col_web, font="Inter-Bold.otf", track=0.16, anchor="middle")
        out[key] = (f, strip, 2)
    return out


if __name__ == "__main__":
    for name, (f, strip, lines) in designs().items():
        (OUT / f"{name}.svg").write_text(f.svg(strip))
        (OUT / f"{name}_vorschau.svg").write_text(f.svg(strip, with_plate=True, plate_lines=lines))
        print(name, f"{f.W} x {f.H} mm")
