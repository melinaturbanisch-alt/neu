"""SANISA – kleine LKW-Aufkleber (Händler-Emblem), Maße in mm.

Klein und dezent, damit neue Besitzer sie dranlassen. Texte Englisch.
Logo-Grafiken aus ../kennzeichenhalter/logo, Schrift als Pfade (Inter).
"""
import sys
from pathlib import Path
HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent / "kennzeichenhalter"))
from halter import text_path, img, YELLOW, WHITE, DARK  # noqa: E402

OUT = HERE / "druckvorlagen"
OUT.mkdir(exist_ok=True)
BLACK = "#141414"


class Sticker:
    def __init__(self, w, h):
        self.w, self.h, self.el = w, h, []

    def add(self, s):
        self.el.append(s)

    def logo(self, name, cx, cy, h):
        ar, b64 = img(name)
        w = h * ar
        self.add(f'<image x="{cx - w / 2:.2f}" y="{cy - h / 2:.2f}" width="{w:.2f}" height="{h:.2f}" '
                 f'href="data:image/png;base64,{b64}"/>')
        return w

    def text(self, s, cx, base, cap, color, font="Inter-SemiBold.otf", track=0.1):
        d, w = text_path(font, s, cap, track)
        self.add(f'<path transform="translate({cx - w / 2:.2f} {base:.2f})" fill="{color}" d="{d}"/>')

    def svg(self):
        return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.w}mm" height="{self.h}mm" '
                f'viewBox="0 0 {self.w} {self.h}">{"".join(self.el)}</svg>')


def badge(w, h, bg, logo, top, bottom, c_top, c_bot, line):
    """Emblem mit abgerundeten Ecken, feine gelbe Kontur."""
    s = Sticker(w, h)
    r = h * 0.18
    s.add(f'<rect x="0" y="0" width="{w}" height="{h}" rx="{r:.2f}" fill="{bg}"/>')
    s.add(f'<rect x="1.6" y="1.6" width="{w - 3.2}" height="{h - 3.2}" rx="{r - 1.4:.2f}" fill="none" '
          f'stroke="{line}" stroke-width="0.5"/>')
    s.text(top, w / 2, h * 0.255, h * 0.075, c_top, track=0.35)
    s.logo(logo, w / 2, h * 0.52, h * 0.30)
    s.text(bottom, w / 2, h * 0.86, h * 0.075, c_bot, track=0.2)
    return s


designs = {}

# 1 – Händler-Emblem schwarz (passt auf jede Lackfarbe), 150 x 50 mm
designs["1_emblem_schwarz_150x50"] = badge(
    150, 50, BLACK, "group_nur-logo_hell", "SUPPLIED BY", "TRUCKS & CONSTRUCTION MACHINERY",
    "#bdbdbd", YELLOW, YELLOW)

# 2 – Händler-Emblem weiß, für dunkle LKW, 150 x 50 mm
designs["2_emblem_weiss_150x50"] = badge(
    150, 50, "#FFFFFF", "group_nur-logo_original", "SUPPLIED BY", "TRUCKS & CONSTRUCTION MACHINERY",
    "#6b6b6b", DARK, YELLOW)

# 3 – nur Logo, freigestellt (ohne Hintergrund, Konturschnitt), 200 mm breit
ar, _ = img("group_nur-logo_hell")
for key, logo in [("3_logo-freigestellt_hell", "group_nur-logo_hell"),
                  ("4_logo-freigestellt_dunkel", "group_nur-logo_original")]:
    s = Sticker(200, round(200 / ar, 1))
    s.logo(logo, 100, s.h / 2, s.h)
    designs[f"{key}_200x{s.h:g}"] = s

# 5 – Frontscheibe innen, klein, 100 x 30 mm (Druck seitenverkehrt für Innenseite – Hinweis an Druckerei)
s = Sticker(100, 30)
s.add(f'<rect width="100" height="30" rx="4" fill="{BLACK}"/>')
s.logo("group_nur-logo_hell", 50, 12.5, 11)
s.text("TRUCKS & CONSTRUCTION MACHINERY", 50, 25, 2.3, YELLOW, track=0.12)
designs["5_scheibe_100x30"] = s

if __name__ == "__main__":
    for k, s in designs.items():
        (OUT / f"{k}.svg").write_text(s.svg())
        print(k, s.w, "x", s.h, "mm")
