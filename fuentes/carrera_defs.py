"""Maquetas verticales (720x1280) de CARRERA TÓXICA con el TMB oficial."""
import sys, subprocess, random, math
sys.path.insert(0, "/home/claude")
from lib import t, box, barrel
from tmbpose import tmb, head_icon, TOXIC, bolsita
import importlib.util
_sp = importlib.util.spec_from_file_location("tmb4_lib", "/home/claude/tmb4_lib.py")
_tl = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(_tl)
baby = _tl.baby
OUT = "/tmp"
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

