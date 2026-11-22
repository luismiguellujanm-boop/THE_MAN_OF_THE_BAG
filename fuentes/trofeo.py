"""Sugerencia: trofeo 'La Bolsa de Oro' y momento de RÉCORD MUNDIAL."""
import sys, subprocess, math, random
sys.path.insert(0, "/home/claude")
from lib import t, box, goat
from tmbpose import tmb
OUT = sys.argv[1]

METAL = {
    "oro":    dict(main="#ffd23f", dark="#e0a800", horn="#c98a1a", hornl="#8a5a10", ink="#5a3a00", gem="#7dff3a", num="#1"),
    "plata":  dict(main="#e3e8ef", dark="#aab4c2", horn="#9aa5b5", hornl="#6b7685", ink="#3a4350", gem="#7fd3ff", num="#2"),
    "bronce": dict(main="#e8a064", dark="#b86b30", horn="#9a5a28", hornl="#6b3a14", ink="#4a2408", gem="#ffb36b", num="#3"),
}
def trophy(x, y, s=1.0, metal="oro"):
    """Trofeo: (x, y) = base en el suelo."""
    M = METAL[metal]
    g = [f'<g transform="translate({x},{y}) scale({s})">']
    # base
    g.append('<rect x="-120" y="-70" width="240" height="70" rx="10" fill="#3a2a5a" stroke="#111" stroke-width="7"/>')
    g.append(f'<rect x="-120" y="-70" width="240" height="14" fill="{M['main']}" stroke="#111" stroke-width="5"/>')
    g.append(f'<rect x="-60" y="-52" width="120" height="40" rx="6" fill="{M['main']}" stroke="#111" stroke-width="4"/>')
    g.append(t(0, -22, 30, M["num"], fill="#111", sw=0))
    # pie con gota tóxica
    g.append(f'<path d="M-50,-70 L50,-70 L28,-120 L-28,-120 Z" fill="{M['dark']}" stroke="#111" stroke-width="6" stroke-linejoin="round"/>')
    g.append(f'<path d="M0,-180 Q36,-140 0,-112 Q-36,-140 0,-180 Z" fill="{M['gem']}" stroke="#111" stroke-width="6"/>')
    g.append('<path d="M-10,-150 Q-12,-160 -4,-168" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/>')
    g.append(f'<rect x="-40" y="-200" width="80" height="26" rx="8" fill="{M['dark']}" stroke="#111" stroke-width="6"/>')
    # asas = cuernos de cabra dorados
    for sx in (-1, 1):
        g.append(f'<path d="M{sx*95},-330 Q{sx*210},-360 {sx*200},-250 Q{sx*190},-190 {sx*120},-230 Q{sx*170},-250 {sx*165},-290 Q{sx*160},-320 {sx*100},-300 Z" fill="{M['horn']}" stroke="#111" stroke-width="7" stroke-linejoin="round"/>')
        for i in range(3):
            g.append(f'<path d="M{sx*(150+i*12)},{-335+i*30} l{sx*18},8" stroke="{M['hornl']}" stroke-width="5"/>')
    # copa = bolsa dorada abierta (borde zigzag arriba) con la cara de TMB
    g.append(f'<path d="M-110,-420 L-88,-440 L-66,-420 L-44,-440 L-22,-420 L0,-440 L22,-420 L44,-440 L66,-420 L88,-440 L110,-420 L100,-200 L-100,-200 Z" fill="{M['main']}" stroke="#111" stroke-width="8" stroke-linejoin="round"/>')
    g.append(f'<path d="M70,-418 L104,-418 L96,-205 L66,-205 Z" fill="{M['dark']}" opacity="0.8"/>')
    g.append('<path d="M-88,-380 Q-60,-392 -40,-386" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round" opacity="0.8"/>')
    g.append(f'<path d="M-60,-352 L-28,-354" stroke="{M['ink']}" stroke-width="6" stroke-linecap="round"/>')
    e = f'stroke="{M["ink"]}" stroke-width="15" stroke-linecap="round"'
    g.append(f'<path d="M-68,-326 L-22,-329 M-70,-310 L-20,-312" {e}/><path d="M20,-329 L66,-326 M18,-312 L68,-310" {e}/>')
    g.append(f'<path d="M14,-262 Q42,-262 56,-282" stroke="{M['ink']}" stroke-width="7" fill="none" stroke-linecap="round"/>')
    g.append('</g>')
    return "".join(g)

def sparkle(x, y, r, c="#fff"):
    return f'<path d="M{x},{y-r} Q{x+r*0.15},{y-r*0.15} {x+r},{y} Q{x+r*0.15},{y+r*0.15} {x},{y+r} Q{x-r*0.15},{y+r*0.15} {x-r},{y} Q{x-r*0.15},{y-r*0.15} {x},{y-r} Z" fill="{c}"/>'

def save(name, w, h, body):
    open(f"/tmp/{name}.svg", "w").write(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}">{body}</svg>')
    subprocess.run(["rsvg-convert", "-o", f"{OUT}/{name}.png", f"/tmp/{name}.svg"], check=True)

r = random.Random(4)
def rays(b, cx, cy, w, h, n=20, col="#ffd23f", op=0.12):
    for i in range(n):
        a = i * 2 * math.pi / n
        b.append(f'<path d="M{cx},{cy} L{cx+2000*math.cos(a):.0f},{cy+2000*math.sin(a):.0f} L{cx+2000*math.cos(a+0.14):.0f},{cy+2000*math.sin(a+0.14):.0f} Z" fill="{col}" opacity="{op}"/>')
def confetti(b, w, h, n=80):
    cols = ["#ff5d73", "#7dff3a", "#ffd23f", "#7fb3e6", "#b9a0f0", "#ffb36b"]
    for _ in range(n):
        x, y = r.randint(0, w), r.randint(0, h - 120)
        b.append(f'<rect x="{x}" y="{y}" width="{r.randint(8,16)}" height="{r.randint(14,26)}" fill="{r.choice(cols)}" transform="rotate({r.randint(0,180)} {x} {y})"/>')

# ---------- 1. El trofeo solo ----------
b = ['<rect width="1080" height="1080" fill="#2b145a"/>']
rays(b, 540, 520, 1080, 1080, op=0.14)
b.append('<circle cx="540" cy="560" r="330" fill="#ffd23f" opacity="0.18"/>')
b.append(trophy(540, 900, 1.45))
for (x, y, rr) in [(250, 300, 30), (830, 260, 38), (880, 640, 24), (210, 700, 26), (760, 150, 18)]:
    b.append(sparkle(x, y, rr))
b.append(t(540, 120, 84, "LA BOLSA DE ORO", fill="#ffd23f"))
b.append(t(540, 1000, 34, "Trofeo del récord mundial", fill="#fff", sw=5))
save("12_trofeo_bolsa_de_oro", 1080, 1080, "\n".join(b))

# ---------- 2. Momento: ¡RÉCORD MUNDIAL! ----------
W, H, G = 1280, 720, 640
b = ['<rect width="1280" height="720" fill="#2b145a"/>']
rays(b, 760, 330, W, H, n=24, op=0.13)
b.append(f'<rect y="{G}" width="{W}" height="{H-G}" fill="#4caf2a"/><rect y="{G-10}" width="{W}" height="20" fill="#6cc24a"/>')
confetti(b, W, H)
# podio
b.append(f'<rect x="600" y="{G-120}" width="320" height="120" fill="#ffd23f" stroke="#111" stroke-width="7"/>')
b.append(t(760, G - 45, 64, "1", fill="#111", sw=0))
b.append('<circle cx="760" cy="300" r="190" fill="#ffd23f" opacity="0.25"/>')
b.append(trophy(760, G - 120, 0.76))
# TMB mirando a la pantalla, feliz
b.append('<circle cx="380" cy="470" r="170" fill="#7dff3a" opacity="0.18"/>')
b.append(tmb(380, G, 0.4, pose="flail", face="grin", view="front"))
# cabras mareadas al fondo
for (x, c) in [(1050, "#f2f2f2"), (1185, "#ff9ec4")]:
    b.append(f'<g transform="translate({x},{G-60}) scale(-1,1)">{goat(0, 0, 0.32, col=c, legs="stand")}</g>')
    for i in range(3):
        a = i * 2.1
        b.append(f'<path d="M{x+20+math.cos(a)*40:.0f},{G-150+math.sin(a)*12:.0f} l5,11 12,0 -10,7 4,12 -11,-7 -11,7 4,-12 -10,-7 12,0 Z" fill="#ffd400" stroke="#111" stroke-width="2"/>')
for (x, y, rr) in [(560, 120, 26), (980, 170, 30), (640, 260, 18), (1000, 420, 22)]:
    b.append(sparkle(x, y, rr))
b.append(t(640, 85, 72, "¡RÉCORD MUNDIAL!", fill="#ffd23f"))
b.append(box(490, 108, 300, 56, fill="#000", r=18, op=0.45))
b.append(t(640, 146, 28, "Bolsín · 2.340 m", fill="#fff", sw=0))
save("13_record_mundial", W, H, "\n".join(b))

# ---------- 3. Podio: oro, plata y bronce ----------
b = ['<rect width="1280" height="720" fill="#2b145a"/>']
rays(b, 640, 260, W, H, n=24, op=0.12)
b.append(f'<rect y="{G}" width="{W}" height="{H-G}" fill="#4caf2a"/><rect y="{G-10}" width="{W}" height="20" fill="#6cc24a"/>')
confetti(b, W, H, 60)
for (cx, w, hgt, col, metal, name, m) in [(640, 280, 170, "#ffd23f", "oro", "Bolsín", "2.340 m"),
                                          (360, 260, 115, "#e3e8ef", "plata", "ToxiKid", "2.105 m"),
                                          (920, 260, 80, "#e8a064", "bronce", "CabraLoca", "1.980 m")]:
    top = G - hgt
    b.append(f'<rect x="{cx-w/2}" y="{top}" width="{w}" height="{hgt}" fill="{col}" stroke="#111" stroke-width="7"/>')
    b.append(t(cx, top + min(hgt - 18, 70), 48, METAL[metal]["num"].replace("#", ""), fill="#111", sw=0))
    sc = {"oro": 0.62, "plata": 0.52, "bronce": 0.48}[metal]
    if metal == "oro":
        b.append(f'<circle cx="{cx}" cy="{top-150}" r="150" fill="#ffd23f" opacity="0.22"/>')
    b.append(trophy(cx, top, sc, metal))
    b.append(box(cx - 115, top - 445 * sc - 78, 230, 62, fill="#000", r=18, op=0.45))
    b.append(t(cx, top - 445 * sc - 53, 24, name, fill="#fff", sw=0))
    b.append(t(cx, top - 445 * sc - 27, 20, m, fill="#ffd84d", sw=0))
b.append(tmb(1140, G, 0.32, pose="flail", face="grin", view="front"))
b.append(f'<g transform="translate(110,{G-55}) scale(-1,1)">{goat(0, 0, 0.32, legs="stand")}</g>')
b.append(t(640, 70, 60, "TOP 3 MUNDIAL", fill="#ffd23f"))
save("14_podio_top3", W, H, "\n".join(b))
print("ok")
