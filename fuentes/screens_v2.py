import random, subprocess, sys, math
sys.path.insert(0, "/home/claude")
from bagmod import bag
from lib import t, box, barrel, goat
from tmbpose import tmb, bolsita as baby, head_icon, TOXIC

OUT = sys.argv[1]
W, H = 1280, 720
G = 585  # línea del suelo
C = {"tan": ("#c8ae84", "#a88f66"), "blue": ("#7fb3e6", "#5a8cc0"), "pink": ("#f0a0c0", "#c97a9c"),
     "green": ("#9fdc7a", "#76b356"), "purple": ("#b9a0f0", "#8f78c8"), "toxic": ("#7dff3a", "#4fc21a")}
DEFS = '''<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a6fd6"/><stop offset="1" stop-color="#bfe6ff"/></linearGradient>
<linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b1e6e"/><stop offset="1" stop-color="#ff9a5a"/></linearGradient>
<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
<filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
</defs>'''

def save(name, body):
    s = f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">{DEFS}{body}</svg>'
    open(f"{OUT}/{name}.svg", "w").write(s)
    subprocess.run(["rsvg-convert", "-o", f"{OUT}/{name}.png", f"{OUT}/{name}.svg"], check=True)

def world(sky="sky", seed=1):
    r = random.Random(seed)
    b = [f'<rect width="{W}" height="{H}" fill="url(#{sky})"/>']
    b.append('<circle cx="1080" cy="170" r="60" fill="#fff3b0" opacity="0.85"/>')
    for (x, y, w) in [(200, 150, 100), (620, 120, 80), (900, 200, 90)]:
        b.append(f'<ellipse cx="{x}" cy="{y}" rx="{w}" ry="32" fill="#fff" opacity="0.85"/><ellipse cx="{x+45}" cy="{y-15}" rx="{w*0.6:.0f}" ry="32" fill="#fff" opacity="0.85"/>')
    # capa 1: montañas
    pts = "0,{0} 140,{1} 260,{2} 400,{3} 540,{4} 680,{5} 820,{6} 960,{7} 1100,{8} 1280,{9}".format(
        G-200, G-310, G-230, G-340, G-240, G-320, G-220, G-330, G-250, G-300)
    b.append(f'<polygon points="{pts} 1280,{G} 0,{G}" fill="#8a7fc0" opacity="0.7"/>')
    # capa 2: fábrica tóxica
    fx = 760
    b.append(f'<rect x="{fx}" y="{G-220}" width="220" height="180" fill="#5c5470"/>')
    b.append(f'<rect x="{fx+30}" y="{G-330}" width="40" height="120" fill="#4a4360"/><rect x="{fx+130}" y="{G-290}" width="40" height="80" fill="#4a4360"/>')
    for (cx, cy) in [(fx+50, G-360), (fx+150, G-320)]:
        b.append(f'<circle cx="{cx}" cy="{cy}" r="26" fill="#9dff5a" opacity="0.6"/><circle cx="{cx+24}" cy="{cy-32}" r="20" fill="#9dff5a" opacity="0.45"/>')
    for wx in range(fx + 20, fx + 210, 48):
        b.append(f'<rect x="{wx}" y="{G-180}" width="26" height="28" fill="#c8ff8a" opacity="0.8"/>')
    # capa 3: colinas y árboles
    b.append(f'<path d="M0,{G-90} Q250,{G-170} 520,{G-100} Q800,{G-40} 1050,{G-120} Q1180,{G-150} 1280,{G-100} L1280,{G} L0,{G} Z" fill="#5fb83e"/>')
    for x in range(30, W, 150):
        x += r.randint(-25, 25)
        b.append(f'<rect x="{x-7}" y="{G-95}" width="14" height="55" fill="#6e4520"/><circle cx="{x}" cy="{G-108}" r="34" fill="#3f9a2a"/>')
    # suelo
    b.append(f'<rect x="0" y="{G}" width="{W}" height="{H-G}" fill="#8b5a2b"/><rect x="0" y="{G-12}" width="{W}" height="26" fill="#4caf2a"/>')
    for x in range(0, W + 40, 60):
        b.append(f'<rect x="{x}" y="{G+32}" width="30" height="12" rx="6" fill="#6e4520"/>')
    for x in range(0, W, 130):
        b.append(f'<path d="M{x},{G+85} L{x+60},{G+85}" stroke="#a87442" stroke-width="8" stroke-linecap="round"/>')
    return b

def speed(b, n=22, y0=300, y1=560, seed=5):
    r = random.Random(seed)
    for _ in range(n):
        x = r.randint(0, W); y = r.randint(y0, y1)
        b.append(f'<path d="M{x},{y} L{x-r.randint(50,140)},{y}" stroke="#fff" stroke-opacity="0.35" stroke-width="5" stroke-linecap="round"/>')

def drop(x, y, s=1):
    return f'<path d="M{x},{y-26*s} Q{x+20*s},{y} {x},{y+16*s} Q{x-20*s},{y} {x},{y-26*s} Z" fill="#7dff3a" stroke="#111" stroke-width="5"/>'

def hud(b, dist="348 m", fill=0.5, gang=3, glow=False):
    b.append(box(0, 0, W, 92, fill="#000", r=0, op=0.45))
    b.append(box(20, 20, 180, 52, fill="#2a6fd6", r=14, op=0.95))
    b.append(t(110, 57, 28, dist, sw=0))
    b.append(box(1080, 20, 180, 52, fill="#fff", r=14, op=0.95))
    b.append(head_icon(1117, 46, 0.17))
    b.append(t(1195, 57, 28, f"x {gang}", fill="#111", sw=0))
    x0, w = 330, 620
    b.append(t(640, 26, 18, "BARRA TÓXICA", fill="#9dff5a", sw=0))
    if glow:
        b.append(f'<rect x="{x0}" y="34" width="{w}" height="44" rx="20" fill="#7dff3a" filter="url(#soft)"/>')
    b.append(f'<rect x="{x0}" y="38" width="{w}" height="36" rx="16" fill="#222" stroke="#fff" stroke-width="4"/>')
    b.append(f'<rect x="{x0+5}" y="43" width="{(w-10)*fill:.0f}" height="26" rx="12" fill="#7dff3a"/>')
    b.append(f'<path d="M{x0+w/2},38 L{x0+w/2},74" stroke="#fff" stroke-width="4" stroke-dasharray="6 5"/>')
    b.append(drop(x0 + w/2 - 110, 58, 0.6) + t(x0 + w/2 - 88, 67, 18, "ERUCTO", anchor="start", sw=3))
    b.append(f'<path d="M{x0+w-20},44 l-14,16 h10 l-8,16 22,-20 h-11 l9,-12 Z" fill="#ffd400" stroke="#111" stroke-width="2"/>')

def hand(x, y, s=1, rot=0):
    return (f'<g transform="translate({x},{y}) rotate({rot}) scale({s})">'
            '<rect x="-14" y="-70" width="28" height="80" rx="14" fill="#fff" stroke="#111" stroke-width="5"/>'
            '<path d="M-14,-5 Q-50,-10 -45,30 L-35,80 Q-20,110 25,110 Q60,105 62,60 L62,0 Q62,-18 46,-18 Q32,-18 32,0 Q32,-25 16,-25 Q2,-25 2,-5 Z" fill="#fff" stroke="#111" stroke-width="5" stroke-linejoin="round"/>'
            '</g>')

def runner(x, s=0.25, lift=0, pose="run", toxic=False, face="smile"):
    return tmb(x, G - lift, s, pose=pose, bag=TOXIC if toxic else None, face=face)

def gang(b, x0, n, cols=("pink", "blue", "green", "purple")):
    for i in range(n):
        c = cols[i % len(cols)]
        b.append(baby(x0 - i * 62, G - (i % 2) * 14, 0.2, color=C[c][0], shade=C[c][1], step=i % 2))

def goat_g(x, s=0.42, **kw):
    return goat(x, G - 135 * s, s, **kw)

def barrel_g(x):
    return barrel(x, G - 45, 1.0)

# ---------- 1. INICIO ----------
b = world(sky="dusk", seed=2)
b.append(box(0, 0, W, H, fill="#000", r=0, op=0.25))
b.append(t(380, 120, 96, "ESCAPE", fill="#ffe14d"))
b.append(t(380, 190, 54, "DE LAS CABRAS", fill="#9dff5a"))
b.append(t(380, 232, 24, "The man of the bag", fill="#fff", sw=4))
b.append('<circle cx="380" cy="400" r="120" fill="#7dff3a" opacity="0.35" filter="url(#glow)"/>')
b.append(tmb(380, 470, 0.27, pose="jump", face="grin"))
b.append(goat_g(110, 0.42, mouth=True))
b.append(goat_g(600, 0.42, col="#ff9ec4", legs="stand"))
b.append(box(770, 150, 440, 100, fill="#2ee66b", r=30, op=1, stroke="#111"))
b.append(t(990, 216, 46, "JUGAR", fill="#111", sw=0))
b.append(box(770, 275, 440, 85, fill="#7b5cff", r=26, op=1, stroke="#111"))
b.append(t(990, 330, 34, "CARRERA EN VIVO", sw=0))
b.append(box(770, 385, 210, 75, fill="#ffd400", r=22, op=1, stroke="#111"))
b.append(t(875, 433, 28, "RANKING", fill="#111", sw=0))
b.append(box(1000, 385, 210, 75, fill="#2a6fd6", r=22, op=1, stroke="#111"))
b.append(t(1105, 433, 28, "BOLSAS", sw=0))
save("1_inicio", "\n".join(b))

# ---------- 2. TUTORIAL ----------
b = world(seed=3)
speed(b)
b.append(barrel_g(830))
b.append(goat_g(110, 0.42))
b.append(runner(500, pose="flail"))
b.append(f'<path d="M560,{G-20} Q720,{G-330} 900,{G-40}" fill="none" stroke="#fff" stroke-width="7" stroke-dasharray="16 12"/>')
hud(b, dist="12 m", fill=0.05, gang=0)
b.append(box(0, 92, W, H - 92, fill="#000", r=0, op=0.35))
b.append(box(390, 130, 500, 130, fill="#fff", r=30, op=0.95, stroke="#111"))
b.append(t(640, 187, 44, "¡TOCA PARA", fill="#111", sw=0))
b.append(t(640, 240, 44, "SALTAR!", fill="#2a9d1a", sw=0))
for rr, op in [(65, 0.25), (42, 0.45)]:
    b.append(f'<circle cx="1080" cy="420" r="{rr}" fill="#fff" opacity="{op}"/>')
b.append(hand(1095, 435, 0.9))
b.append(t(640, 690, 24, "Primera partida · 1 de 3", fill="#fff", sw=4))
save("2_tutorial", "\n".join(b))

# ---------- 3. CARRERA CON PANDILLA ----------
b = world(seed=4)
speed(b)
for i, x in enumerate(range(720, 1000, 60)):
    b.append(drop(x, 330 - (i % 2) * 20))
b.append(barrel_g(1180))
b.append(baby(1030, G, 0.2, color=C["purple"][0], shade=C["purple"][1]))
b.append(t(1030, G - 82, 20, "¡ÚNETE!", fill="#ffe14d", sw=3))
for x in (40, 110):
    b.append(f'<circle cx="{x}" cy="{G-10}" r="26" fill="#e8d3a8" opacity="0.8"/>')
b.append(goat_g(110, 0.42, rot=-6))
gang(b, 500, 3)
b.append(runner(620, lift=40, pose="jump", face="grin"))
hud(b, dist="521 m", fill=0.62, gang=4)
save("3_pandilla", "\n".join(b))

# ---------- 4. ERUCTO TÓXICO ----------
b = world(sky="dusk", seed=6)
speed(b)
b.append(goat_g(100, 0.4, rot=-6))
gang(b, 390, 2)
b.append(runner(510, pose="throw", face="grin"))
b.append(f'<path d="M600,{G-110} Q700,{G-130} 780,{G-100}" fill="none" stroke="#7dff3a" stroke-width="14" stroke-linecap="round" opacity="0.6"/>')
b.append(f'<circle cx="780" cy="{G-100}" r="28" fill="#7dff3a" stroke="#111" stroke-width="6"/>')
ex, ey = 980, G - 60
b.append(f'<circle cx="{ex}" cy="{ey}" r="110" fill="#7dff3a" opacity="0.5" filter="url(#glow)"/>')
pts = " ".join(f"{ex+math.cos(i*math.pi/8)*(95 if i%2==0 else 55):.0f},{ey+math.sin(i*math.pi/8)*(95 if i%2==0 else 55):.0f}" for i in range(16))
b.append(f'<polygon points="{pts}" fill="#ffd400" stroke="#111" stroke-width="6"/>')
b.append(f'<circle cx="{ex}" cy="{ey}" r="40" fill="#7dff3a"/>')
for (dx, dy, rot) in [(-100, -120, 30), (90, -140, -40), (130, 10, 70)]:
    b.append(f'<rect x="{ex+dx-18}" y="{ey+dy-10}" width="36" height="20" fill="#8a8f99" stroke="#111" stroke-width="4" transform="rotate({rot} {ex+dx} {ey+dy})"/>')
b.append(t(640, 190, 72, "¡ERUCTO TÓXICO!", fill="#9dff5a"))
b.append(t(640, 235, 24, "Desliza hacia adelante · usa media barra", fill="#fff", sw=4))
hud(b, dist="690 m", fill=0.18, gang=3)
save("4_eructo", "\n".join(b))

# ---------- 5. RAYO MUTANTE ----------
b = world(seed=7)
b.append(box(0, 0, W, H, fill="#1a0033", r=0, op=0.45))
by = G - 100
b.append(f'<rect x="560" y="{by-55}" width="720" height="110" fill="#7dff3a" opacity="0.7" filter="url(#glow)"/>')
b.append(f'<rect x="560" y="{by-30}" width="720" height="60" rx="30" fill="#c8ff8a"/>')
b.append(f'<rect x="560" y="{by-10}" width="720" height="20" rx="10" fill="#fff"/>')
for (x, y, rot) in [(820, by - 90, 25), (1000, by - 130, -35), (1150, by + 80, 60), (920, by + 70, 15)]:
    b.append(f'<rect x="{x-18}" y="{y-10}" width="36" height="20" fill="#c0874a" stroke="#111" stroke-width="4" transform="rotate({rot} {x} {y})"/>')
b.append(goat(170, 300, 0.36, rot=-35, legs="stand"))
b.append(goat(60, 430, 0.3, col="#d9d0c3", rot=-60, legs="stand"))
b.append(t(130, 210, 36, "¡BEEE!", fill="#fff", sw=5))
b.append(f'<circle cx="470" cy="{G-90}" r="150" fill="#7dff3a" opacity="0.55" filter="url(#glow)"/>')
gang(b, 360, 2, cols=("toxic",))
b.append(runner(480, pose="throw", toxic=True, face="grin"))
b.append(t(640, 210, 88, "¡RAYO MUTANTE!", fill="#ffe14d"))
hud(b, dist="903 m", fill=1.0, gang=3, glow=True)
save("5_rayo", "\n".join(b))

# ---------- 6. SALA EN VIVO ----------
b = [f'<rect width="{W}" height="{H}" fill="#2b145a"/>']
for i in range(16):
    a = i * math.pi / 8
    b.append(f'<path d="M640,150 L{640+1500*math.cos(a):.0f},{150+1500*math.sin(a):.0f}" stroke="#fff" stroke-opacity="0.06" stroke-width="70"/>')
b.append(t(330, 85, 52, "CARRERA EN VIVO", fill="#ffe14d"))
b.append(t(330, 128, 24, "Comparte este código con tus amigos", fill="#fff", sw=4))
b.append(box(700, 35, 420, 110, fill="#fff", r=28, op=1, stroke="#111"))
b.append(t(910, 113, 68, "CABRA-42", fill="#111", sw=0))
players = [("Bolsín", "tan", True), ("ToxiKid", "blue", True), ("CabraLoca", "pink", True), ("Bolsita99", "green", True), ("", "purple", False), ("", "purple", False)]
for i, (name, col, ok) in enumerate(players):
    x = 160 + i * 192; y = 185
    b.append(box(x - 88, y, 176, 250, fill="#fff" if ok else "#000", r=24, op=0.12 if ok else 0.3))
    if ok:
        b.append(head_icon(x, y + 100, 0.55, color=C[col][0], shade=C[col][1]))
        b.append(t(x, y + 220, 24, name, sw=0))
    else:
        b.append(f'<circle cx="{x}" cy="{y+105}" r="52" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="12 10" opacity="0.6"/>')
        b.append(t(x, y + 123, 50, "?", fill="#fff", sw=0))
        b.append(t(x, y + 220, 20, "Esperando...", fill="#bbb", sw=0))
b.append(t(640, 500, 30, "Jugadores: 4 / 6", fill="#9dff5a", sw=0))
b.append(box(415, 535, 450, 100, fill="#2ee66b", r=30, op=1, stroke="#111"))
b.append(t(640, 601, 44, "¡EMPEZAR!", fill="#111", sw=0))
b.append(t(640, 685, 22, "Solo apodos · sin chat", fill="#bbb", sw=0))
save("6_sala_en_vivo", "\n".join(b))

# ---------- 7. CARRERA EN VIVO ----------
b = world(seed=9)
speed(b)
for (x, col, name, lift) in [(860, "blue", "ToxiKid", 0), (380, "pink", "CabraLoca", 30)]:
    b.append(f'<g opacity="0.4">{tmb(x, G - lift, 0.23, pose="run", bag=C[col])}</g>')
    b.append(t(x, G - 190 - lift, 20, name, fill="#fff", sw=4))
b.append(f'<g transform="rotate(10 1070 {G-200})"><rect x="1030" y="{G-240}" width="80" height="80" rx="12" fill="#7b5cff" stroke="#111" stroke-width="6"/></g>')
b.append(t(1070, G - 175, 60, "?", fill="#9dff5a", sw=6))
b.append(f'<circle cx="1070" cy="{G-200}" r="70" fill="#b9a0f0" opacity="0.35" filter="url(#glow)"/>')
b.append(f'<path d="M220,{G} Q250,{G-35} 280,{G} Q265,{G-15} 250,{G} Q235,{G-15} 220,{G} Z" fill="#ffd400" stroke="#111" stroke-width="4"/>')
b.append(goat_g(90, 0.4, rot=-6))
b.append(runner(600, pose="run"))
# barra de progreso de carrera
b.append(box(0, 0, W, 120, fill="#000", r=0, op=0.5))
b.append('<rect x="60" y="55" width="1110" height="16" rx="8" fill="#fff" opacity="0.5"/>')
b.append('<path d="M1175,25 L1175,85" stroke="#fff" stroke-width="5"/><rect x="1177" y="25" width="34" height="24" fill="#fff"/><rect x="1177" y="25" width="17" height="12" fill="#111"/><rect x="1194" y="37" width="17" height="12" fill="#111"/>')
racers = [(0.72, "blue", False), (0.55, "tan", False), (0.40, "pink", False), (0.18, "green", True)]
for p, col, out in racers:
    x = 60 + 1110 * p
    if out:
        b.append(head_icon(x, 55, 0.2, color="#999", shade="#777", face="shock", op=0.5))
    else:
        b.append(head_icon(x, 55, 0.2, color=C[col][0], shade=C[col][1]))
b.append(f'<path d="M{60+1110*0.55},98 l-12,16 h24 Z" fill="#ffe14d"/>')
b.append(box(20, 135, 290, 46, fill="#000", r=14, op=0.5))
b.append(t(165, 167, 24, "2.º lugar · Vivos 3/4", fill="#fff", sw=0))
b.append(box(1110, 135, 150, 150, fill="#000", r=24, op=0.55, stroke="#9dff5a"))
b.append('<ellipse cx="1185" cy="200" rx="50" ry="28" fill="#9dff5a" opacity="0.9"/><ellipse cx="1160" cy="187" rx="28" ry="23" fill="#9dff5a"/><ellipse cx="1205" cy="185" rx="26" ry="21" fill="#9dff5a"/>')
b.append(t(1185, 268, 16, "NUBE APESTOSA", fill="#fff", sw=0))
b.append(t(640, 175, 28, "¡ToxiKid te lanzó una cabra rabiosa!", fill="#ff4d6d", sw=5))
save("7_carrera_en_vivo", "\n".join(b))
print("ok")
