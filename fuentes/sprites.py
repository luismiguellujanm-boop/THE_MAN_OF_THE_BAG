"""Genera los sprites PNG de Escape de las cabras (estilo oficial de TMB).
Uso: python3 sprites.py <carpeta_img>
Todos se dibujan al doble de tamaño (RES=2) y el juego los pinta a la mitad.
Cada sprite tiene un ancla (ax, ay) = punto que toca el suelo (o centro)."""
import sys, json, subprocess, math, os
sys.path.insert(0, "/home/claude")
from tmbpose import tmb, bolsita, head_icon, TOXIC
from lib import barrel, goat

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
ATLAS = {}

def render(name, w, h, ax, ay, body):
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{body}</svg>'
    p = f"/tmp/{name}.svg"
    open(p, "w").write(svg)
    subprocess.run(["rsvg-convert", "-o", f"{OUT}/{name}.png", p], check=True)
    ATLAS[name] = {"w": w, "h": h, "ax": ax, "ay": ay}

# ---------- TMB (juego: escala 0.25 → render 0.5) ----------
S = 0.5
W, H, AX, AY = 360, 420, 150, 405
for name, pose, face, tox in [
    ("tmb_run0", "run", "smile", False), ("tmb_run1", "run2", "smile", False),
    ("tmb_jump", "jump", "grin", False), ("tmb_throw", "throw", "grin", False),
    ("tmb_caught", "flail", "shock", False), ("tmb_stand", "stand", "smile", False),
    ("tmb_flail", "flail", "grin", False),
    ("tox_run0", "run", "grin", True), ("tox_run1", "run2", "grin", True),
    ("tox_jump", "jump", "grin", True), ("tox_throw", "throw", "grin", True),
]:
    kw = dict(bag=TOXIC, coat="#b8f59a", coat2="#4e9f4a") if tox else {}
    render(name, W, H, AX, AY, tmb(AX, AY, S, pose=pose, face=face, **kw))

# ---------- Bolsitas de la pandilla (diseño propio, NO es Bebé TMB) ----------
COLS = {"rosa": ("#f0a0c0", "#c97a9c"), "azul": ("#7fb3e6", "#5a8cc0"), "verde": ("#9fdc7a", "#76b356"),
        "lila": ("#b9a0f0", "#8f78c8"), "naranja": ("#ffb36b", "#d98a45"), "toxica": TOXIC}
for c, (col, sh) in COLS.items():
    for st in (0, 1):
        render(f"bolsa_{c}{st}", 160, 150, 80, 142, bolsita(80, 142, 0.4, color=col, shade=sh, step=st))

# ---------- Cabras ----------
GS = 0.84
for name, legs, col in [("cabra0", "run", "#f2f2f2"), ("cabra1", "stand", "#f2f2f2"),
                        ("cabrar0", "run", "#ff9ec4"), ("cabrar1", "stand", "#ff9ec4")]:
    render(name, 340, 320, 140, 305, goat(140, 305 - 135 * GS, GS, col=col, legs=legs))

# ---------- Obstáculos y objetos ----------
render("barril", 160, 200, 80, 196, barrel(80, 196 - 95, 2))
crate = ('<g transform="translate(80,196)">'
         '<rect x="-70" y="-140" width="140" height="140" rx="8" fill="#c0874a" stroke="#111" stroke-width="8"/>'
         '<rect x="-56" y="-126" width="112" height="112" fill="none" stroke="#8a5a2b" stroke-width="10"/>'
         '<path d="M-56,-126 L56,-14 M56,-126 L-56,-14" stroke="#8a5a2b" stroke-width="14"/>'
         '<rect x="-70" y="-140" width="140" height="140" rx="8" fill="none" stroke="#111" stroke-width="8"/></g>')
render("caja", 160, 200, 80, 196, crate)
pipe = ('<g>'
        '<rect x="110" y="0" width="70" height="300" fill="#6f7a88" stroke="#111" stroke-width="8"/>'
        '<rect x="100" y="30" width="90" height="26" rx="6" fill="#8a96a6" stroke="#111" stroke-width="6"/>'
        '<path d="M20,300 L180,300 L180,372 L20,372 Z" fill="#6f7a88" stroke="#111" stroke-width="8" stroke-linejoin="round"/>'
        '<rect x="6" y="290" width="40" height="92" rx="8" fill="#8a96a6" stroke="#111" stroke-width="7"/>'
        '<rect x="96" y="292" width="98" height="88" rx="10" fill="#8a96a6" stroke="#111" stroke-width="7"/>'
        '<path d="M40,372 Q50,392 40,408 Q30,392 40,372 Z M90,372 Q104,400 90,420 Q76,400 90,372 Z M140,372 Q150,390 140,404 Q130,390 140,372 Z" fill="#7dff3a" stroke="#111" stroke-width="4"/>'
        '<path d="M60,316 L150,316" stroke="#7dff3a" stroke-width="12" stroke-linecap="round" opacity="0.8"/></g>')
render("tubo", 200, 430, 100, 420, pipe)
drop = '<path d="M40,6 Q78,54 40,86 Q2,54 40,6 Z" fill="#7dff3a" stroke="#111" stroke-width="7"/><path d="M28,50 Q26,38 34,30" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" opacity="0.8"/>'
render("gota", 80, 92, 40, 46, drop)
render("cabeza", 240, 240, 120, 120, head_icon(120, 120, 1.0))

# ---------- Fondos (1280 de ancho, se repiten sin cortes) ----------
G = 585
def mountains():
    xs = [0, 140, 260, 400, 540, 680, 820, 960, 1100, 1280]
    ys = [G-250, G-330, G-240, G-350, G-250, G-330, G-230, G-340, G-260, G-250]
    pts = " ".join(f"{x},{y}" for x, y in zip(xs, ys))
    return f'<polygon points="{pts} 1280,{G} 0,{G}" fill="#8a7fc0" opacity="0.75"/>'
render("fondo_montes", 1280, 720, 0, 0, mountains())

def factory(fx):
    b = [f'<rect x="{fx}" y="{G-220}" width="220" height="180" fill="#5c5470"/>',
         f'<rect x="{fx+30}" y="{G-330}" width="40" height="120" fill="#4a4360"/><rect x="{fx+130}" y="{G-290}" width="40" height="80" fill="#4a4360"/>']
    for (cx, cy) in [(fx+50, G-360), (fx+150, G-320)]:
        b.append(f'<circle cx="{cx}" cy="{cy}" r="26" fill="#9dff5a" opacity="0.6"/><circle cx="{cx+24}" cy="{cy-32}" r="20" fill="#9dff5a" opacity="0.45"/>')
    for wx in range(fx + 20, fx + 210, 48):
        b.append(f'<rect x="{wx}" y="{G-180}" width="26" height="28" fill="#c8ff8a" opacity="0.8"/>')
    return "".join(b)
hills = f'<path d="M0,{G-100} Q320,{G-170} 640,{G-100} Q960,{G-30} 1280,{G-100} L1280,{G} L0,{G} Z" fill="#5fb83e"/>'
render("fondo_fabrica", 1280, 720, 0, 0, factory(700) + hills)

trees = []
for i, x in enumerate(range(40, 1280, 160)):
    dx = [0, 20, -15, 10, -20, 15, 0, -10][i % 8]
    x += dx
    trees.append(f'<rect x="{x-8}" y="{G-95}" width="16" height="60" fill="#6e4520"/><circle cx="{x}" cy="{G-110}" r="36" fill="#3f9a2a"/><circle cx="{x-14}" cy="{G-120}" r="14" fill="#55b23a"/>')
render("fondo_arboles", 1280, 720, 0, 0, "".join(trees))

# ---------- Íconos de la app (PWA) ----------
for size in (192, 512):
    s = size / 512
    body = (f'<rect width="{size}" height="{size}" fill="#2b145a"/>'
            f'<circle cx="{size/2}" cy="{size/2}" r="{size*0.42}" fill="#7dff3a" opacity="0.35"/>'
            f'{head_icon(size/2, size/2, 1.45*s)}')
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}">{body}</svg>'
    open("/tmp/ic.svg", "w").write(svg)
    subprocess.run(["rsvg-convert", "-o", f"{OUT}/icono_{size}.png", "/tmp/ic.svg"], check=True)

json.dump(ATLAS, open(f"{OUT}/sprites.json", "w"), indent=0)
print(len(ATLAS), "sprites")
