"""Kleine Auto-Sticker für den Lack: Heck (unter der Heckscheibe) und Fahrertür.

Alle Maße in mm, transparenter Hintergrund (Konturschnitt durch die Druckerei).
Schrift im Kupfer-Verlauf des Logos, Schrift in Pfade umgewandelt.
"""
import base64
from PIL import Image
from build import OUT, COPPER_STOPS, text_path

INTER = "/usr/share/fonts/opentype/inter/"
LOGO = OUT / "logo_melvona_M.png"
LW, LH = Image.open(LOGO).size
LOGO_B64 = base64.b64encode(LOGO.read_bytes()).decode()
PAD = 5  # Rand rundum (Schnittzugabe)
DIR = OUT / "sticker"


def grad(gid, y0, y1):
    stops = "".join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in COPPER_STOPS)
    return (f'<linearGradient id="{gid}" gradientUnits="userSpaceOnUse" x1="0" y1="{y0:.2f}" x2="0" '
            f'y2="{y1:.2f}">{stops}</linearGradient>')


class Doc:
    def __init__(self):
        self.defs, self.body, self.n = [], [], 0

    def logo(self, x, y, h):
        w = h * LW / LH
        self.body.append(f'<image x="{x:.2f}" y="{y:.2f}" width="{w:.2f}" height="{h:.2f}" '
                         f'href="data:image/png;base64,{LOGO_B64}"/>')
        return w

    def text(self, s, x, base, cap, track, font="Inter-Light.otf", width=None):
        """Text ab x mit Grundlinie base. width -> Laufweite wird angepasst, bis die Breite passt."""
        if width:
            d0, w0 = text_path(INTER + font, s, cap, 0)
            n = len(s) - 1
            track_mm = (width - w0) / n
            upm_scale = cap / 0.727  # Inter: Versalhöhe ~0.727 em
            track = track_mm / upm_scale
        d, w = text_path(INTER + font, s, cap, track)
        self.n += 1
        gid = f"k{self.n}"
        self.defs.append(grad(gid, base - cap, base))
        self.body.append(f'<path fill="url(#{gid})" transform="translate({x:.2f},{base:.2f})" d="{d}"/>')
        return w

    def line(self, x1, y1, x2, y2, sw=0.6):
        self.body.append(f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" '
                         f'stroke="#a47962" stroke-width="{sw}"/>')

    def save(self, name, w, h, note):
        svg = (f'<?xml version="1.0" encoding="UTF-8"?>\n<!-- {note} | {w:.0f} x {h:.0f} mm -->\n'
               f'<svg xmlns="http://www.w3.org/2000/svg" width="{w:.1f}mm" height="{h:.1f}mm" '
               f'viewBox="0 0 {w:.2f} {h:.2f}"><defs>{"".join(self.defs)}</defs>{"".join(self.body)}</svg>\n')
        DIR.mkdir(exist_ok=True)
        (DIR / f"{name}.svg").write_text(svg)
        print(f"{name}: {w:.0f} x {h:.0f} mm  ({note})")


def heck_1_nur_logo(h=140):
    d = Doc()
    w = d.logo(PAD, PAD, h)
    d.save("heck-1_nur-logo", w + 2 * PAD, h + 2 * PAD, "Heck: nur Logo")


def heck_2_logo_mit_schrift(h=120):
    d = Doc()
    lw = h * LW / LH
    tw = 175
    W = tw + 2 * PAD
    d.logo((W - lw) / 2, PAD, h)
    cap = 7
    base = PAD + h + 10 + cap
    d.text("MELVONA MARKETING", PAD, base, cap, 0, width=tw)
    d.save("heck-2_logo-mit-schrift", W, base + PAD, "Heck: Logo groß, Schriftzug klein darunter")


def heck_3_quer(h=90):
    d = Doc()
    lw = d.logo(PAD, PAD, h)
    x = PAD + lw + 14
    d.line(x, PAD + 18, x, PAD + h - 18, 0.8)
    x += 14
    cap = 15
    tw = 150
    mid = PAD + h / 2
    d.text("MELVONA", x, mid - 6, cap, 0, font="Inter-Regular.otf", width=tw)
    d.text("MARKETING", x, mid + 6 + cap, cap, 0, font="Inter-Light.otf", width=tw)
    d.save("heck-3_quer", x + tw + PAD, h + 2 * PAD, "Heck: Logo links, Schrift zweizeilig rechts")


def tuer_1_schriftzug(width=500):
    d = Doc()
    cap = 24
    d.text("MELVONA MARKETING", PAD, PAD + cap, cap, 0, font="Inter-Regular.otf", width=width)
    d.save("tuer-1_schriftzug", width + 2 * PAD, cap + 2 * PAD, "Tür: nur Schriftzug")


def tuer_2_logo_schriftzug(width=520):
    d = Doc()
    h = 70
    lw = d.logo(PAD, PAD, h)
    x = PAD + lw + 22
    cap = 20
    d.text("MELVONA MARKETING", x, PAD + h / 2 + cap / 2, cap, 0, font="Inter-Regular.otf",
           width=width - lw - 22)
    d.save("tuer-2_logo-schriftzug", width + 2 * PAD, h + 2 * PAD, "Tür: kleines Logo + Schriftzug")


if __name__ == "__main__":
    heck_1_nur_logo()
    heck_2_logo_mit_schrift()
    heck_3_quer()
    tuer_1_schriftzug()
    tuer_2_logo_schriftzug()
