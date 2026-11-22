"""Maquetas del evento ESTAMPIDA en Escape de las cabras."""
import sys, subprocess, math
OUT = sys.argv[1]
sys.path.insert(0, "/home/claude")
sys.argv = [sys.argv[0], "/tmp"]
import screens_v2 as SV
from lib import t, box, goat
from tmbpose import tmb
W, H, G = 1280, 720, 585
COLS = [("#7fb3e6", "#3d5f8a"), ("#b9a0f0", "#5a4632"), ("#ffd84d", "#5a4632"), ("#ffb36b", "#5a4632"), ("#9fdc7a", "#3d6b2a")]

def goat_left(x, s=0.4, col="#f2f2f2", horn="#5a4632", lift=0, rot=0, legs="run"):
    g = goat(0, 0, s, col=col, horn=horn, legs=legs, rot=rot)
    return f'<g transform="translate({x},{G - 135*s - lift}) scale(-1,1)">{g}</g>'

def dust(b, x, n=5):
    for i in range(n):
        b.append(f'<circle cx="{x + i*38}" cy="{G - 8 - (i%2)*10}" r="{20 + (i%3)*8}" fill="#e8d3a8" opacity="0.75"/>')

def save(name, body):
    open(f"/tmp/{name}.svg", "w").write(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}">{SV.DEFS}{body}</svg>')
    subprocess.run(["rsvg-convert", "-o", f"{OUT}/{name}.png", f"/tmp/{name}.svg"], check=True)

def warn(b, y=330):
    """Aviso sin texto: señal de peligro con cabeza de cabra en el borde derecho."""
    b.append('<rect x="1060" y="92" width="220" height="628" fill="#ff2a3d" opacity="0.12"/>')
    b.append(f'<path d="M1150,{y-90} L1240,{y+60} L1060,{y+60} Z" fill="#ffd400" stroke="#111" stroke-width="9" stroke-linejoin="round"/>')
    b.append(t(1150, y + 42, 96, "!", fill="#111", sw=0))
    b.append(f'<path d="M1050,{y+130} L990,{y+160} L1050,{y+190} Z" fill="#ff3b4f" stroke="#111" stroke-width="5"/>')
    b.append(f'<path d="M1050,{y+160} L1120,{y+160}" stroke="#ff3b4f" stroke-width="16" stroke-linecap="round"/>')

def run(x, lift=0, pose="run", face="smile", view="side"):
    return tmb(x, G - lift, 0.25, pose=pose, face=face, view=view)

# ---------- 1. AVISO ----------
b = SV.world(seed=11); SV.speed(b)
b.append(SV.goat_g(110, 0.42))
SV.gang(b, 470, 2)
b.append(run(600, pose="run", face="shock"))
warn(b)
for i, (c, h) in enumerate(COLS[:3]):
    b.append(f'<g opacity="0.55">{goat_left(1240 + i*70, 0.3, col=c, horn=h)}</g>')
dust(b, 1180)
SV.hud(b, dist="612 m", fill=0.4, gang=2)
save("8_estampida_aviso", "\n".join(b))

# ---------- 2. MANADA (doble salto) ----------
b = SV.world(seed=12); SV.speed(b)
b.append(SV.goat_g(90, 0.4))
xs = [520, 640, 760, 880, 1000, 1120]
for i, x in enumerate(xs):
    c, h = COLS[i % len(COLS)]
    b.append(goat_left(x, 0.36, col=c, horn=h, legs="run" if i % 2 else "stand"))
dust(b, 560, 9)
b.append(f'<path d="M560,{G-20} Q620,{G-170} 680,{G-170} Q760,{G-240} 860,{G-200}" fill="none" stroke="#fff" stroke-width="6" stroke-dasharray="14 10"/>')
b.append(run(800, lift=190, pose="jump", face="grin"))
b.append(f'<ellipse cx="800" cy="{G-185}" rx="40" ry="10" fill="#fff" opacity="0.7"/>')

SV.hud(b, dist="640 m", fill=0.45, gang=2)
save("9_estampida_manada", "\n".join(b))

# ---------- 3. CABRA LOCA ----------
b = SV.world(seed=13); SV.speed(b)
b.append(SV.goat_g(90, 0.4))
SV.gang(b, 420, 2)
b.append(run(560, pose="run", face="shock", view="front"))
# rebotes de la cabra loca
pts = []
for i in range(60):
    x = 1240 - i * 9
    y = G - 60 - abs(math.sin(i / 60 * 2.6 * math.pi)) * 210
    pts.append(f"{x},{y:.0f}")
b.append(f'<polyline points="{" ".join(pts)}" fill="none" stroke="#ff5d73" stroke-width="5" stroke-dasharray="12 10"/>')
gx = 900
b.append(goat_left(gx, 0.4, col="#ff5d73", horn="#3d1f1f", lift=200, rot=-20))
for (x, y) in [(gx - 70, G - 330), (gx + 60, G - 350), (gx + 100, G - 290)]:
    b.append(f'<path d="M{x},{y} l6,14 15,0 -12,9 5,15 -14,-9 -14,9 5,-15 -12,-9 15,0 Z" fill="#ffd400" stroke="#111" stroke-width="3"/>')


SV.hud(b, dist="655 m", fill=0.45, gang=2)
save("10_cabra_loca", "\n".join(b))
print("ok")
