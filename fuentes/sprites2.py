"""Sprites v2 de la suite (TMB con aspectos, cabras de colores, 5 mundos, Carrera tóxica, trofeos).
Uso: python3 sprites2.py <carpeta_img>"""
import sys, json, subprocess, os, math, random
sys.path.insert(0, "/home/claude")
from tmbpose import tmb, bolsita, head_icon, TOXIC
from lib import barrel, goat
import importlib.util
def _load(n, p):
    sp = importlib.util.spec_from_file_location(n, p); m = importlib.util.module_from_spec(sp); sp.loader.exec_module(m); return m
OUT = sys.argv[1]
sys.argv = [sys.argv[0], "/tmp"]
tl = _load("tmb4_lib", "/home/claude/tmb4_lib.py")
car = _load("carrera_mod", "/home/claude/carrera_defs.py")
tro = _load("trofeo_mod", "/home/claude/trofeo_defs.py")
os.makedirs(OUT, exist_ok=True)
ATLAS = {}

def render(name, w, h, ax, ay, body):
    p = f"/tmp/s_{name}.svg"
    open(p, "w").write(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{body}</svg>')
    subprocess.run(["rsvg-convert", "-o", f"{OUT}/{name}.png", p], check=True)
    os.remove(p)
    ATLAS[name] = {"w": w, "h": h, "ax": ax, "ay": ay}

# ---------- TMB: aspectos de bolsa × poses ----------
SKINS = {"clasica": None, "chicle": ("#ff9ec9", "#d9709f"), "noche": ("#8a90b8", "#666c94"), "dorada": ("#ffd23f", "#e0a800")}
POSES = [  # nombre, pose, cara, vista
    ("run0", "run", "smile", "side"), ("run1", "run2", "smile", "side"), ("jump", "jump", "grin", "side"),
    ("throw", "throw", "grin", "side"), ("ride", "ride", "smile", "side"), ("scoot", "scoot", "smile", "side"),
    ("frun", "run", "grin", "front"), ("ftalk", "stand", "talk", "front"), ("caught", "flail", "shock", "front"),
    ("flail", "flail", "grin", "front"), ("fall", "fall", "grin", "front"), ("hold", "hold", "grin", "front"),
    ("stand", "stand", "smile", "front"),
]
S, W, H, AX, AY = 0.5, 380, 430, 160, 412
for sk, col in SKINS.items():
    for nm, pose, face, view in POSES:
        render(f"t_{sk}_{nm}", W, H, AX, AY, tmb(AX, AY, S, pose=pose, face=face, view=view, bag=col))
for nm, pose, face, view in POSES[:6]:
    render(f"t_tox_{nm}", W, H, AX, AY, tmb(AX, AY, S, pose=pose, face="grin", view=view, bag=TOXIC, coat="#b8f59a", coat2="#4e9f4a"))
for sk, col in SKINS.items():
    c = col or ("#c8ae84", "#a88f66")
    render(f"cabeza_{sk}", 240, 240, 120, 120, head_icon(120, 120, 1.0, color=c[0], shade=c[1]))

# ---------- Bolsitas de la pandilla ----------
COLS = {"rosa": ("#f0a0c0", "#c97a9c"), "azul": ("#7fb3e6", "#5a8cc0"), "verde": ("#9fdc7a", "#76b356"),
        "lila": ("#b9a0f0", "#8f78c8"), "naranja": ("#ffb36b", "#d98a45"), "toxica": TOXIC}
for c, (col, sh) in COLS.items():
    for st in (0, 1):
        render(f"bolsa_{c}{st}", 160, 150, 80, 142, bolsita(80, 142, 0.4, color=col, shade=sh, step=st))

# ---------- Cabras de colores (miran a la derecha) ----------
GS = 0.84
GOATS = {"blanca": ("#f2f2f2", "#5a4632"), "rosa": ("#ff9ec4", "#5a4632"), "azul": ("#7fb3e6", "#3d5f8a"),
         "lila": ("#b9a0f0", "#5a4632"), "amarilla": ("#ffd84d", "#5a4632"), "naranja": ("#ffb36b", "#5a4632"),
         "verde": ("#9fdc7a", "#3d6b2a"), "loca": ("#ff5d73", "#3d1f1f"), "jefa": ("#5b5470", "#ffd23f")}
for n, (col, horn) in GOATS.items():
    for fr, legs in ((0, "run"), (1, "stand")):
        render(f"cabra_{n}{fr}", 340, 320, 140, 305, goat(140, 305 - 135 * GS, GS, col=col, horn=horn, legs=legs))

# ---------- Obstáculos por mundo ----------
render("barril", 160, 200, 80, 196, barrel(80, 196 - 95, 2))
def crate(fill="#c0874a", line="#8a5a2b"):
    return (f'<g transform="translate(80,196)"><rect x="-70" y="-140" width="140" height="140" rx="8" fill="{fill}" stroke="#111" stroke-width="8"/>'
            f'<rect x="-56" y="-126" width="112" height="112" fill="none" stroke="{line}" stroke-width="10"/>'
            f'<path d="M-56,-126 L56,-14 M56,-126 L-56,-14" stroke="{line}" stroke-width="14"/>'
            '<rect x="-70" y="-140" width="140" height="140" rx="8" fill="none" stroke="#111" stroke-width="8"/></g>')
render("caja", 160, 200, 80, 196, crate())
render("caja_metal", 160, 200, 80, 196, crate("#8a96a6", "#5c6672"))
render("barril_tox", 160, 200, 80, 196, barrel(80, 196 - 95, 2) + '<ellipse cx="80" cy="20" rx="60" ry="14" fill="#7dff3a" stroke="#111" stroke-width="5"/>')
def hanging(body, w=200, h=430):
    return body
pipe = ('<path d="M20,300 L180,300 L180,372 L20,372 Z" fill="#6f7a88" stroke="#111" stroke-width="8"/>'
        '<rect x="110" y="0" width="70" height="300" fill="#6f7a88" stroke="#111" stroke-width="8"/>'
        '<rect x="6" y="290" width="40" height="92" rx="8" fill="#8a96a6" stroke="#111" stroke-width="7"/>'
        '<rect x="96" y="292" width="98" height="88" rx="10" fill="#8a96a6" stroke="#111" stroke-width="7"/>'
        '<path d="M40,372 Q50,392 40,408 Q30,392 40,372 Z M90,372 Q104,400 90,420 Q76,400 90,372 Z M140,372 Q150,390 140,404 Q130,390 140,372 Z" fill="#7dff3a" stroke="#111" stroke-width="4"/>')
render("tubo", 200, 430, 100, 420, pipe)
sign = ('<rect x="92" y="0" width="16" height="250" fill="#555" stroke="#111" stroke-width="5"/>'
        '<rect x="10" y="250" width="180" height="130" rx="14" fill="#ffd400" stroke="#111" stroke-width="8"/>'
        '<path d="M60,345 Q100,280 140,345" fill="none" stroke="#111" stroke-width="10" stroke-linecap="round"/>'
        '<circle cx="80" cy="300" r="10" fill="#111"/><circle cx="120" cy="300" r="10" fill="#111"/>'
        '<path d="M100,250 L40,250 M100,250 L160,250" stroke="#111" stroke-width="6"/>')
render("letrero", 200, 430, 100, 420, sign)
hook = ('<rect x="94" y="0" width="12" height="270" fill="#333"/>'
        '<path d="M100,270 L100,300 Q60,300 60,340 Q60,380 100,380 Q140,380 140,345" fill="none" stroke="#c9a227" stroke-width="22" stroke-linecap="round"/>'
        '<path d="M100,270 L100,300 Q60,300 60,340 Q60,380 100,380 Q140,380 140,345" fill="none" stroke="#111" stroke-width="5" stroke-linecap="round" opacity="0.5"/>'
        '<rect x="20" y="380" width="160" height="40" rx="8" fill="#6e4520" stroke="#111" stroke-width="7"/>')
render("gancho", 200, 430, 100, 420, hook)
render("tacho", 160, 200, 80, 196,
       '<path d="M30,60 L130,60 L120,196 L40,196 Z" fill="#3c8d5a" stroke="#111" stroke-width="8" stroke-linejoin="round"/>'
       '<rect x="20" y="40" width="120" height="26" rx="8" fill="#4fae70" stroke="#111" stroke-width="7"/>'
       '<rect x="65" y="22" width="30" height="20" rx="6" fill="#4fae70" stroke="#111" stroke-width="6"/>'
       '<path d="M60,90 L62,170 M100,90 L98,170" stroke="#2a6b42" stroke-width="8" stroke-linecap="round"/>')
render("banca", 260, 200, 130, 196,
       '<rect x="20" y="70" width="220" height="30" rx="6" fill="#c0874a" stroke="#111" stroke-width="7"/>'
       '<rect x="20" y="20" width="220" height="26" rx="6" fill="#c0874a" stroke="#111" stroke-width="7"/>'
       '<rect x="40" y="96" width="18" height="100" fill="#333" stroke="#111" stroke-width="5"/><rect x="202" y="96" width="18" height="100" fill="#333" stroke="#111" stroke-width="5"/>'
       '<rect x="40" y="40" width="14" height="40" fill="#333"/><rect x="206" y="40" width="14" height="40" fill="#333"/>')
render("bolsa_basura", 180, 200, 90, 196,
       '<path d="M90,30 Q60,40 70,60 Q20,90 22,150 Q24,196 90,196 Q156,196 158,150 Q160,90 110,60 Q120,40 90,30 Z" fill="#26262e" stroke="#111" stroke-width="8"/>'
       '<path d="M78,32 L70,10 M100,32 L112,12" stroke="#26262e" stroke-width="10" stroke-linecap="round"/>'
       '<path d="M50,120 Q60,100 70,110" stroke="#55556a" stroke-width="8" fill="none" stroke-linecap="round"/>')
render("llantas", 180, 200, 90, 196,
       ''.join(f'<ellipse cx="90" cy="{176 - i*52}" rx="78" ry="26" fill="#2b2b2b" stroke="#111" stroke-width="7"/><ellipse cx="90" cy="{176 - i*52}" rx="34" ry="10" fill="#555"/>' for i in range(3)))
drop = '<path d="M40,6 Q78,54 40,86 Q2,54 40,6 Z" fill="#7dff3a" stroke="#111" stroke-width="7"/><path d="M28,50 Q26,38 34,30" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" opacity="0.8"/>'
render("gota", 80, 92, 40, 46, drop)
render("caja_sorpresa", 140, 140, 70, 70,
       '<rect x="10" y="10" width="120" height="120" rx="18" fill="#7b5cff" stroke="#111" stroke-width="8"/>'
       '<text x="70" y="104" text-anchor="middle" font-family="DejaVu Sans" font-weight="bold" font-size="90" fill="#9dff5a" stroke="#111" stroke-width="5" paint-order="stroke">?</text>')
render("platano", 120, 70, 60, 64,
       '<path d="M10,60 Q60,-10 110,60 Q90,40 60,40 Q30,40 10,60 Z" fill="#ffd400" stroke="#111" stroke-width="6" stroke-linejoin="round"/>')

# ---------- Fondos de los 5 mundos (1280×720, se repiten sin cortes) ----------
G = 585
r = random.Random(7)
def seamless_ridge(base, amp, n, col, op=1):
    xs = [i * 1280 / n for i in range(n + 1)]
    ys = [base - amp * (0.5 + 0.5 * math.sin(i * 2 * math.pi / n * 2 + 1)) - r.randint(0, int(amp * 0.4)) for i in range(n + 1)]
    ys[-1] = ys[0]
    pts = " ".join(f"{x:.0f},{y:.0f}" for x, y in zip(xs, ys))
    return f'<polygon points="{pts} 1280,{G} 0,{G}" fill="{col}" opacity="{op}"/>'
def hills(col, base=90, amp=70):
    return f'<path d="M0,{G-base} Q320,{G-base-amp} 640,{G-base} Q960,{G-base+amp} 1280,{G-base} L1280,{G} L0,{G} Z" fill="{col}"/>'
def tree(x, c1="#3f9a2a", c2="#55b23a"):
    return f'<rect x="{x-8}" y="{G-95}" width="16" height="60" fill="#6e4520"/><circle cx="{x}" cy="{G-110}" r="36" fill="{c1}"/><circle cx="{x-14}" cy="{G-120}" r="14" fill="{c2}"/>'
def lay(name, body): render(name, 1280, 720, 0, 0, body)

# Mundo 1: La granja
lay("m1_far", seamless_ridge(G - 230, 110, 8, "#8a7fc0", 0.75))
barn = ('<g transform="translate(760,0)"><rect x="0" y="{0}" width="200" height="150" fill="#c0392b" stroke="#111" stroke-width="5"/>'
        '<path d="M-15,{1} L100,{2} L215,{1} Z" fill="#8e2a20" stroke="#111" stroke-width="5"/>'
        '<rect x="70" y="{3}" width="60" height="80" fill="#fff" stroke="#111" stroke-width="4"/><path d="M70,{3} L130,{4} M130,{3} L70,{4}" stroke="#c0392b" stroke-width="6"/>'
        '<rect x="230" y="{5}" width="60" height="200" rx="28" fill="#b8bcc4" stroke="#111" stroke-width="5"/></g>').format(G-170, G-170, G-240, G-100, G-20, G-220)
lay("m1_mid", barn + hills("#5fb83e"))
fence = "".join(f'<rect x="{x}" y="{G-70}" width="12" height="60" fill="#d9b98a" stroke="#6e4520" stroke-width="3"/>' for x in range(0, 1280, 64))
fence += f'<rect x="0" y="{G-60}" width="1280" height="8" fill="#d9b98a"/><rect x="0" y="{G-36}" width="1280" height="8" fill="#d9b98a"/>'
lay("m1_near", "".join(tree(x) for x in (100, 420, 740, 1060)) + fence)

# Mundo 2: El pueblo
lay("m2_far", "".join(f'<rect x="{x}" y="{G-180-h}" width="{w}" height="{180+h}" fill="#a58fb8" opacity="0.7"/>' for x, w, h in [(0,90,60),(100,70,120),(180,110,30),(300,80,150),(390,120,80),(520,90,40),(620,70,170),(700,120,60),(830,90,110),(930,140,50),(1080,80,140),(1170,110,70)]))
houses = ""
for i, (x, c) in enumerate([(30,"#ffb36b"),(250,"#7fb3e6"),(470,"#f0a0c0"),(690,"#9fdc7a"),(910,"#ffd84d"),(1130,"#b9a0f0")]):
    houses += (f'<rect x="{x}" y="{G-170}" width="170" height="170" fill="{c}" stroke="#111" stroke-width="5"/>'
               f'<path d="M{x-12},{G-170} L{x+85},{G-240} L{x+182},{G-170} Z" fill="#8e4a3a" stroke="#111" stroke-width="5"/>'
               f'<rect x="{x+25}" y="{G-130}" width="40" height="40" fill="#fff8c8" stroke="#111" stroke-width="4"/><rect x="{x+105}" y="{G-130}" width="40" height="40" fill="#fff8c8" stroke="#111" stroke-width="4"/>'
               f'<rect x="{x+65}" y="{G-75}" width="40" height="75" fill="#6e4520" stroke="#111" stroke-width="4"/>')
lay("m2_mid", houses)
lamps = "".join(f'<rect x="{x}" y="{G-200}" width="10" height="200" fill="#333"/><rect x="{x-20}" y="{G-210}" width="50" height="16" rx="6" fill="#333"/><circle cx="{x+5}" cy="{G-192}" r="10" fill="#fff3b0"/>' for x in (150, 470, 790, 1110))
bushes = "".join(f'<ellipse cx="{x}" cy="{G-18}" rx="60" ry="30" fill="#3f9a2a"/>' for x in (300, 620, 940, 1260, -20))
lay("m2_near", lamps + bushes)

# Mundo 3: El basurero
lay("m3_far", seamless_ridge(G - 200, 140, 6, "#7a6a55", 0.8))
piles = ""
for x in range(0, 1280, 180):
    piles += f'<path d="M{x},{G} Q{x+90},{G-170-r.randint(0,60)} {x+200},{G} Z" fill="#8a7a5c" stroke="#5a4a32" stroke-width="4"/>'
    for _ in range(5):
        px, py = x + r.randint(30, 170), G - r.randint(20, 110)
        piles += f'<rect x="{px}" y="{py}" width="{r.randint(14,30)}" height="{r.randint(10,22)}" fill="{r.choice(["#c0392b","#2a6fd6","#ffd400","#7dff3a","#eee"])}" transform="rotate({r.randint(0,90)} {px} {py})"/>'
crane = f'<rect x="980" y="{G-380}" width="22" height="380" fill="#ffb000" stroke="#111" stroke-width="4"/><rect x="760" y="{G-390}" width="420" height="20" fill="#ffb000" stroke="#111" stroke-width="4"/><path d="M820,{G-370} L820,{G-250}" stroke="#333" stroke-width="5"/><path d="M800,{G-250} L840,{G-250} L830,{G-230} L810,{G-230} Z" fill="#333"/>'
lay("m3_mid", crane + piles)
bags = "".join(f'<path d="M{x},{G} Q{x-30},{G-50} {x},{G-60} Q{x+30},{G-50} {x},{G} Z" fill="#26262e"/>' for x in range(60, 1280, 230))
lay("m3_near", bags + "".join(f'<rect x="{x}" y="{G-90}" width="10" height="90" fill="#6b6b6b" transform="rotate({r.randint(-12,12)} {x} {G})"/>' for x in range(20, 1280, 110)))

# Mundo 4: La fábrica tóxica (noche)
lay("m4_far", "".join(f'<rect x="{x}" y="{G-260-h}" width="{w}" height="{260+h}" fill="#2a2440"/>' + "".join(f'<rect x="{x+12+j*22}" y="{G-230-h+k*34}" width="10" height="14" fill="#c8ff8a" opacity="0.6"/>' for j in range(max(1,w//22-1)) for k in range(3)) for x, w, h in [(0,120,40),(160,90,100),(300,150,20),(500,110,80),(660,140,10),(860,100,120),(1020,160,50),(1200,80,90)]))
fac = ""
for fx in (60, 700):
    fac += (f'<rect x="{fx}" y="{G-230}" width="380" height="230" fill="#4a4360" stroke="#111" stroke-width="4"/>'
            f'<rect x="{fx+40}" y="{G-380}" width="50" height="150" fill="#3a3350"/><rect x="{fx+260}" y="{G-340}" width="50" height="110" fill="#3a3350"/>'
            f'<circle cx="{fx+65}" cy="{G-410}" r="34" fill="#7dff3a" opacity="0.55"/><circle cx="{fx+95}" cy="{G-450}" r="26" fill="#7dff3a" opacity="0.4"/>'
            + "".join(f'<rect x="{fx+30+j*70}" y="{G-170}" width="40" height="40" fill="#c8ff8a" opacity="0.85"/>' for j in range(5)))
lay("m4_mid", fac)
lay("m4_near", "".join(f'<rect x="{x}" y="{G-140}" width="30" height="140" fill="#5c6672" stroke="#111" stroke-width="3"/><rect x="{x-8}" y="{G-150}" width="46" height="16" fill="#8a96a6"/><path d="M{x+15},{G-134} L{x+15},{G-104}" stroke="#7dff3a" stroke-width="6"/>' for x in range(80, 1280, 300)))

# Mundo 5: El balde tóxico
bucket = (f'<path d="M-40,{G-40} L60,{G-420} L1220,{G-420} L1320,{G-40} Z" fill="#3a4a5a" opacity="0.55"/>'
          f'<rect x="40" y="{G-440}" width="1200" height="36" rx="16" fill="#56687a" opacity="0.6"/>')
lay("m5_far", bucket)
bub = "".join(f'<circle cx="{r.randint(0,1280)}" cy="{r.randint(150,G-60)}" r="{r.randint(6,22)}" fill="#b8ff8c" opacity="0.5"/>' for _ in range(40))
lay("m5_mid", bub + hills("#46c22a", 70, 50))
lay("m5_near", "".join(f'<path d="M{x},0 L{x+40},0 L{x+20},{r.randint(80,170)} Z" fill="#2f7d1a" opacity="0.8"/>' for x in range(0, 1280, 140)) +
    "".join(f'<ellipse cx="{x}" cy="{G-10}" rx="70" ry="16" fill="#7dff3a" opacity="0.6"/>' for x in range(100, 1280, 320)))

# ---------- Carrera tóxica ----------
render("bebe", 300, 260, 150, 240, tl.baby(150, 150, 0.45, jump=True))
render("paracaidas", 360, 220, 180, 200, car.chute(180, 130, 1.0))

# ---------- Trofeos, meme, íconos ----------
for m in ("oro", "plata", "bronce"):
    render(f"trofeo_{m}", 300, 340, 150, 330, tro.trophy(150, 330, 0.68, m))
for size in (192, 512):
    s = size / 512
    body = (f'<rect width="{size}" height="{size}" fill="#2b145a"/><circle cx="{size/2}" cy="{size/2}" r="{size*0.42}" fill="#7dff3a" opacity="0.35"/>{head_icon(size/2, size/2, 1.45*s)}')
    open("/tmp/ic.svg", "w").write(f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}">{body}</svg>')
    subprocess.run(["rsvg-convert", "-o", f"{OUT}/icono_{size}.png", "/tmp/ic.svg"], check=True)

json.dump(ATLAS, open(f"{OUT}/sprites.json", "w"))
print(len(ATLAS), "sprites")
