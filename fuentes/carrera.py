"""Maquetas verticales (720x1280) de CARRERA TÓXICA con el TMB oficial."""
import sys, subprocess, random, math
sys.path.insert(0, "/home/claude")
from lib import t, box, barrel
from tmbpose import tmb, head_icon, TOXIC, bolsita
import importlib.util
_sp = importlib.util.spec_from_file_location("tmb4_lib", "/home/claude/tmb4_lib.py")
_tl = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(_tl)
baby = _tl.baby
OUT = sys.argv[1]
W, H = 720, 1280
DEFS = '''<defs>
<linearGradient id="shaft" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0f1a14"/><stop offset="0.5" stop-color="#2c4a37"/><stop offset="1" stop-color="#0f1a14"/></linearGradient>
<linearGradient id="deep" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#03140a" stop-opacity="0.75"/></linearGradient>
<radialGradient id="glowc"><stop offset="0" stop-color="#7dff3a" stop-opacity="0.8"/><stop offset="1" stop-color="#7dff3a" stop-opacity="0"/></radialGradient>
<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>
<filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
</defs>'''

def save(name, body):
    open(f"/tmp/{name}.svg", "w").write(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">{DEFS}{body}</svg>')
    subprocess.run(["rsvg-convert", "-o", f"{OUT}/{name}.png", f"/tmp/{name}.svg"], check=True)

def tube(seed=1, speed=True, deep=True):
    r = random.Random(seed)
    b = [f'<rect width="{W}" height="{H}" fill="url(#shaft)"/>']
    # placas de metal del fondo
    for y in range(-40, H, 170):
        b.append(f'<path d="M80,{y} L640,{y}" stroke="#1a2a20" stroke-width="5"/>')
        for x in (110, 610):
            b.append(f'<circle cx="{x}" cy="{y+20}" r="6" fill="#3d5a47"/>')
    # tuberías verticales del fondo
    for x, w, c in [(170, 34, "#35503f"), (520, 46, "#304a3a"), (360, 22, "#2a4234")]:
        b.append(f'<rect x="{x}" y="0" width="{w}" height="{H}" fill="{c}" opacity="0.8"/>')
        for y in range(r.randint(0, 200), H, 260):
            b.append(f'<rect x="{x-6}" y="{y}" width="{w+12}" height="18" rx="4" fill="#466a54"/>')
    # brillo tóxico al fondo del tubo
    b.append('<ellipse cx="360" cy="1180" rx="380" ry="220" fill="#7dff3a" opacity="0.18" filter="url(#glow)"/>')
    # paredes con franjas de peligro
    for side in (0, 1):
        x0 = 0 if side == 0 else 640
        b.append(f'<rect x="{x0}" y="0" width="80" height="{H}" fill="#4a5560" stroke="#111" stroke-width="6"/>')
        for y in range(r.randint(-60, 0), H, 120):
            b.append(f'<rect x="{x0+8}" y="{y}" width="64" height="110" rx="6" fill="#56636f" stroke="#2b333b" stroke-width="3"/>')
            b.append(f'<circle cx="{x0+18}" cy="{y+12}" r="4" fill="#2b333b"/><circle cx="{x0+62}" cy="{y+12}" r="4" fill="#2b333b"/>')
        # goteo verde en la pared
        for _ in range(3):
            y = r.randint(0, H - 200); xx = x0 + r.randint(20, 60)
            b.append(f'<path d="M{xx},{y} L{xx},{y+r.randint(60,160)}" stroke="#7dff3a" stroke-width="8" stroke-linecap="round" opacity="0.7"/>')
    if speed:
        for _ in range(26):
            x = r.randint(90, 630); y = r.randint(100, H)
            b.append(f'<path d="M{x},{y} L{x},{y-r.randint(60,170)}" stroke="#fff" stroke-opacity="0.22" stroke-width="4" stroke-linecap="round"/>')
    if deep:
        b.append(f'<rect width="{W}" height="{H}" fill="url(#deep)"/>')
    return b

def depth_sign(b, y, m, side=0):
    x = 8 if side == 0 else 648
    b.append(f'<rect x="{x}" y="{y}" width="64" height="40" rx="6" fill="#ffd400" stroke="#111" stroke-width="4"/>')
    b.append(t(x + 32, y + 28, 18, f"{m}m", fill="#111", sw=0))

def beam(b, y, side, length):
    """Tubería horizontal que sale de una pared."""
    if side == 0:
        x0, x1 = 70, 70 + length
    else:
        x0, x1 = 650 - length, 650
    b.append(f'<rect x="{x0}" y="{y-26}" width="{x1-x0}" height="52" fill="#6f7a88" stroke="#111" stroke-width="6"/>')
    b.append(f'<rect x="{x0}" y="{y-26}" width="{x1-x0}" height="14" fill="#8a96a6"/>')
    end = x1 if side == 0 else x0
    b.append(f'<rect x="{end-18}" y="{y-36}" width="36" height="72" rx="8" fill="#8a96a6" stroke="#111" stroke-width="6"/>')
    for i in range(3):
        b.append(f'<path d="M{end-14},{y-30+i*22} L{end+14},{y-18+i*22}" stroke="#ffd400" stroke-width="7"/>')
    b.append(f'<path d="M{end},{y+36} Q{end+8},{y+56} {end},{y+70} Q{end-8},{y+56} {end},{y+36} Z" fill="#7dff3a" stroke="#111" stroke-width="3"/>')

def jet(b, y, side, length=330):
    """Chorro tóxico que sale de una boquilla en la pared."""
    if side == 0:
        nx, d = 70, 1
    else:
        nx, d = 650, -1
    b.append(f'<path d="M{nx},{y-18} L{nx+d*length},{y-55} L{nx+d*length},{y+55} L{nx},{y+18} Z" fill="#7dff3a" opacity="0.55" filter="url(#soft)"/>')
    b.append(f'<path d="M{nx},{y-12} Q{nx+d*length*0.5},{y-30} {nx+d*length},{y-40} L{nx+d*length},{y+40} Q{nx+d*length*0.5},{y+30} {nx},{y+12} Z" fill="#b8ff8c" opacity="0.85"/>')
    for i in range(7):
        cx = nx + d * (60 + i * 42); cy = y + ((i * 37) % 50) - 25
        b.append(f'<circle cx="{cx}" cy="{cy}" r="{6 + i % 3 * 3}" fill="#7dff3a" stroke="#111" stroke-width="2"/>')
    bx = nx if side == 0 else nx - 46
    b.append(f'<rect x="{bx}" y="{y-26}" width="46" height="52" rx="8" fill="#4a4360" stroke="#111" stroke-width="6"/>')

def falling_barrel(b, x, y, rot):
    b.append(f'<g transform="rotate({rot} {x} {y})">{barrel(x, y, 1.0)}</g>')

def drop(x, y, s=1):
    return f'<path d="M{x},{y-26*s} Q{x+20*s},{y} {x},{y+16*s} Q{x-20*s},{y} {x},{y-26*s} Z" fill="#7dff3a" stroke="#111" stroke-width="5"/>'

def faller(x, y, s=0.3, pose="fall", face="grin", toxic=False):
    """TMB cayendo: (x, y) = centro del cuerpo."""
    return tmb(x, y + 380 * s, s, pose=pose, face=face, bag=TOXIC if toxic else None)

def chute(x, y, s=1.0, color="#c8ae84", shade="#a88f66"):
    """Paracaídas hecho con otra bolsa de papel (boca hacia abajo)."""
    g = [f'<g transform="translate({x},{y}) scale({s})">']
    g.append(f'<path d="M-150,40 Q-160,-90 -90,-120 L90,-120 Q160,-90 150,40 L128,58 L106,40 L84,58 L62,40 L40,58 L18,40 L-4,58 L-26,40 L-48,58 L-70,40 L-92,58 L-114,40 L-136,58 Z" fill="{color}" stroke="#2b1a0e" stroke-width="8" stroke-linejoin="round"/>')
    g.append(f'<path d="M100,-112 Q140,-80 140,30" fill="none" stroke="{shade}" stroke-width="14" opacity="0.6"/>')
    g.append(f'<path d="M-120,-60 Q0,-80 120,-60" fill="none" stroke="{shade}" stroke-width="6"/>')
    g.append('<path d="M-60,-10 L-40,-30 M10,-50 L30,-20 M70,-20 L90,10" stroke="#a88f66" stroke-width="5" stroke-linecap="round"/>')
    g.append('</g>')
    return "".join(g)

def hud(b, depth="235 m", gotas=12, chutes=1, speed=0.45):
    b.append(box(0, 0, W, 120, fill="#000", r=0, op=0.55))
    b.append(box(18, 18, 300, 84, fill="#2a6fd6", r=18, op=0.95))
    b.append(t(168, 50, 18, "PROFUNDIDAD", fill="#bfe6ff", sw=0))
    b.append(t(168, 88, 38, depth, sw=0))
    b.append(box(334, 18, 170, 84, fill="#fff", r=18, op=0.95))
    b.append(drop(374, 62, 0.9))
    b.append(t(445, 75, 34, f"{gotas}", fill="#111", sw=0))
    b.append(box(520, 18, 182, 84, fill="#fff", r=18, op=0.95))
    b.append(chute(565, 72, 0.22))
    b.append(t(645, 75, 34, f"x {chutes}", fill="#111", sw=0))
    # velocímetro de caída
    b.append(f'<rect x="18" y="132" width="684" height="16" rx="8" fill="#222" stroke="#fff" stroke-width="3"/>')
    b.append(f'<rect x="21" y="135" width="{678*speed:.0f}" height="10" rx="5" fill="#ff9a3a"/>')
    b.append(t(360, 175, 18, "VELOCIDAD DE CAÍDA", fill="#ffd8a8", sw=4))

def hand(x, y, s=1, rot=0):
    return (f'<g transform="translate({x},{y}) rotate({rot}) scale({s})">'
            '<rect x="-14" y="-70" width="28" height="80" rx="14" fill="#fff" stroke="#111" stroke-width="5"/>'
            '<path d="M-14,-5 Q-50,-10 -45,30 L-35,80 Q-20,110 25,110 Q60,105 62,60 L62,0 Q62,-18 46,-18 Q32,-18 32,0 Q32,-25 16,-25 Q2,-25 2,-5 Z" fill="#fff" stroke="#111" stroke-width="5" stroke-linejoin="round"/></g>')

# ---------- 1. INICIO ----------
b = tube(seed=2, speed=False)
b.append('<rect width="720" height="1280" fill="#000" opacity="0.2"/>')
b.append(t(360, 150, 104, "CARRERA", fill="#ffe14d"))
b.append(t(360, 255, 104, "TÓXICA", fill="#9dff5a"))
b.append(t(360, 305, 26, "The man of the bag", fill="#fff", sw=4))
b.append('<circle cx="360" cy="560" r="170" fill="url(#glowc)"/>')
b.append(faller(360, 520, 0.36, pose="fall", face="grin"))
for (x, y) in [(200, 420), (540, 470), (230, 700), (500, 660)]:
    b.append(drop(x, y, 1.1))
b.append(box(150, 820, 420, 110, fill="#2ee66b", r=32, op=1, stroke="#111"))
b.append(t(360, 893, 52, "JUGAR", fill="#111", sw=0))
b.append(box(150, 960, 200, 90, fill="#ffd400", r=26, op=1, stroke="#111"))
b.append(t(250, 1018, 30, "RANKING", fill="#111", sw=0))
b.append(box(370, 960, 200, 90, fill="#2a6fd6", r=26, op=1, stroke="#111"))
b.append(t(470, 1018, 30, "BOLSAS", sw=0))
b.append(t(360, 1120, 30, "Tu récord: 482 m", fill="#fff", sw=5))
b.append(t(360, 1225, 22, "¡Cae lo más profundo que puedas!", fill="#c8ff8a", sw=4))
save("1_inicio", "\n".join(b))

# ---------- 2. TUTORIAL ----------
b = tube(seed=3)
beam(b, 900, 1, 300)
b.append(faller(360, 560, 0.3))
b.append(f'<path d="M300,700 Q250,800 200,880" fill="none" stroke="#fff" stroke-width="7" stroke-dasharray="16 12"/>')
b.append('<path d="M190,860 L200,895 L228,872" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/>')
hud(b, depth="8 m", gotas=0, chutes=1, speed=0.15)
b.append(box(0, 120, W, H - 120, fill="#000", r=0, op=0.35))
b.append(box(70, 230, 580, 170, fill="#fff", r=32, op=0.97, stroke="#111"))
b.append(t(360, 300, 42, "¡DESLIZA A LOS", fill="#111", sw=0))
b.append(t(360, 360, 42, "LADOS!", fill="#2a9d1a", sw=0))
b.append(f'<path d="M230,1080 L490,1080" stroke="#fff" stroke-width="8" stroke-dasharray="14 10" opacity="0.8"/>')
b.append('<path d="M215,1080 L245,1060 L245,1100 Z M505,1080 L475,1060 L475,1100 Z" fill="#fff"/>')
b.append(hand(400, 1110, 1.0))
b.append(t(360, 1230, 26, "En PC: ← → o A D", fill="#fff", sw=4))
save("2_tutorial", "\n".join(b))

# ---------- 3. CAÍDA (juego) ----------
b = tube(seed=4)
depth_sign(b, 300, 250, 0); depth_sign(b, 980, 300, 1)
beam(b, 420, 0, 330)
jet(b, 760, 1, 320)
falling_barrel(b, 520, 1080, 25)
beam(b, 1160, 1, 260)
for i in range(5):
    b.append(drop(520, 330 + i * 60, 0.9))
b.append(faller(470, 610, 0.3, face="smile"))
b.append(t(560, 520, 26, "¡Uff!", fill="#fff", sw=5))
hud(b, depth="263 m", gotas=34, chutes=1, speed=0.62)
save("3_caida", "\n".join(b))

# ---------- 4. PARACAÍDAS ----------
b = tube(seed=5, speed=False)
for i in range(10):
    x = 120 + (i * 61) % 480; y = 300 + (i * 97) % 800
    b.append(f'<path d="M{x},{y} L{x},{y-40}" stroke="#fff" stroke-opacity="0.15" stroke-width="3"/>')
jet(b, 980, 0, 300)
beam(b, 1180, 1, 340)
cx, cy = 360, 500
b.append(chute(cx, cy, 1.15))
for dx in (-160, -60, 60, 160):
    b.append(f'<path d="M{cx+dx*1.0},{cy+60} L{cx + (-34 if dx < 0 else 34)},{cy+250}" stroke="#111" stroke-width="4"/>')
b.append(faller(cx, cy + 330, 0.3, pose="hold", face="grin"))
b.append(t(360, 265, 64, "¡PARACAÍDAS!", fill="#ffe14d"))
b.append(t(360, 320, 26, "Caes más lento unos segundos", fill="#fff", sw=4))
hud(b, depth="341 m", gotas=41, chutes=0, speed=0.18)
save("4_paracaidas", "\n".join(b))

# ---------- 5. ENCOGERSE (TMB vuelve a ser Bebé TMB) ----------
b = tube(seed=6)
gy = 720
b.append(f'<rect x="70" y="{gy-34}" width="230" height="68" fill="#6f7a88" stroke="#111" stroke-width="6"/>')
b.append(f'<rect x="420" y="{gy-34}" width="230" height="68" fill="#6f7a88" stroke="#111" stroke-width="6"/>')
for x0 in (290, 430):
    b.append(f'<rect x="{x0-14}" y="{gy-44}" width="28" height="88" rx="8" fill="#8a96a6" stroke="#111" stroke-width="6"/>')
    for i in range(3):
        b.append(f'<path d="M{x0-10},{gy-38+i*28} L{x0+10},{gy-26+i*28}" stroke="#ffd400" stroke-width="7"/>')
b.append(f'<circle cx="360" cy="{gy-20}" r="95" fill="url(#glowc)"/>')
# nube de transformación arriba (de donde viene TMB grande)
for (x, y, r) in [(330, 500, 34), (385, 490, 40), (360, 470, 30), (310, 470, 24), (410, 515, 26)]:
    b.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#fff" opacity="0.8"/>')
b.append(t(360, 500, 26, "¡PUF!", fill="#111", sw=0))
b.append(f'<path d="M360,550 L360,600" stroke="#fff" stroke-width="6" stroke-dasharray="8 8" opacity="0.7"/>')
b.append(baby(360, gy - 70, 0.2, jump=True))
for (x, y) in [(290, 620), (440, 630), (320, 830), (400, 840), (470, 720), (250, 730)]:
    b.append(f'<path d="M{x},{y-12} L{x+4},{y-4} L{x+12},{y} L{x+4},{y+4} L{x},{y+12} L{x-4},{y+4} L{x-12},{y} L{x-4},{y-4} Z" fill="#ffe14d" stroke="#111" stroke-width="2"/>')
jet(b, 1100, 0, 280)
b.append(t(360, 290, 66, "¡ME ENCOJO!", fill="#9dff5a"))
b.append(t(360, 350, 26, "TMB vuelve a ser bebé unos segundos", fill="#fff", sw=4))
b.append(t(360, 390, 26, "y pasa por los huecos pequeños", fill="#fff", sw=4))
hud(b, depth="412 m", gotas=55, chutes=1, speed=0.7)
save("5_encogerse", "\n".join(b))

# ---------- 6. FIN ----------
b = tube(seed=7, speed=False)
b.append('<rect width="720" height="1280" fill="#000" opacity="0.5"/>')
b.append(box(60, 200, 600, 860, fill="#2b145a", r=40, op=1, stroke="#111"))
b.append(t(360, 300, 60, "¡AAAAAH!", fill="#ff5d73"))
b.append(faller(360, 470, 0.22, pose="flail", face="shock"))
b.append(t(360, 640, 36, "⭐ ¡NUEVO RÉCORD! ⭐", fill="#ffd400", sw=5))
for i, (lbl, val) in enumerate([("Profundidad", "512 m"), ("Gotas", "+63"), ("Récord", "512 m")]):
    x = 150 + i * 210
    b.append(box(x - 95, 690, 190, 120, fill="#fff", r=20, op=0.1))
    b.append(t(x, 730, 20, lbl, fill="#c9bfe8", sw=0))
    b.append(t(x, 785, 38, val, sw=0))
b.append(t(360, 860, 24, "Puesto mundial: #3", fill="#ffd84d", sw=0))
b.append(box(110, 900, 240, 90, fill="#2ee66b", r=26, op=1, stroke="#111"))
b.append(t(230, 958, 30, "¡OTRA VEZ!", fill="#111", sw=0))
b.append(box(370, 900, 240, 90, fill="#2a6fd6", r=26, op=1, stroke="#111"))
b.append(t(490, 958, 30, "COMPARTIR", sw=0))
save("6_fin", "\n".join(b))
print("ok")
