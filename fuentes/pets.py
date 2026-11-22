import subprocess, sys
sys.path.insert(0, "/home/claude")
from lib import t
import importlib.util
spec = importlib.util.spec_from_file_location("tmb4", "/home/claude/tmb4_lib.py")
tm = importlib.util.module_from_spec(spec); spec.loader.exec_module(tm)

OUT = sys.argv[1]
K = 'stroke="#111" stroke-width="7" stroke-linejoin="round"'

def eye(x, y, r=17):
    return (f'<ellipse cx="{x}" cy="{y}" rx="{r}" ry="{r*1.15:.0f}" fill="#111"/>'
            f'<circle cx="{x+r*0.35:.0f}" cy="{y-r*0.4:.0f}" r="{r*0.38:.0f}" fill="#fff"/>')

def cat(x, y, s):
    O, W = "#e8954a", "#fff7ea"
    g = [f'<g transform="translate({x},{y}) scale({s})">']
    g.append(f'<path d="M95,300 Q210,300 190,180 Q180,120 215,100" fill="none" stroke="#111" stroke-width="42" stroke-linecap="round"/>')
    g.append(f'<path d="M95,300 Q210,300 190,180 Q180,120 215,100" fill="none" stroke="{O}" stroke-width="28" stroke-linecap="round"/>')
    g.append(f'<path d="M-115,330 Q-140,75 0,55 Q140,75 115,330 Z" fill="{O}" {K}/>')
    g.append(f'<path d="M-60,330 Q-72,130 0,105 Q72,130 60,330 Z" fill="{W}"/>')
    for px in (-42, 42):
        g.append(f'<rect x="{px-24}" y="230" width="48" height="100" rx="20" fill="{W}" {K}/>')
        g.append(f'<ellipse cx="{px}" cy="332" rx="34" ry="18" fill="{W}" {K}/>')
    # orejas
    g.append(f'<path d="M-110,-40 L-95,-150 L-30,-95 Z" fill="{O}" {K}/><path d="M-92,-60 L-88,-120 L-50,-92 Z" fill="#f4b3b3"/>')
    g.append(f'<path d="M110,-40 L95,-150 L30,-95 Z" fill="{O}" {K}/><path d="M92,-60 L88,-120 L50,-92 Z" fill="#f4b3b3"/>')
    g.append(f'<ellipse cx="0" cy="0" rx="130" ry="112" fill="{O}" {K}/>')
    g.append(f'<path d="M-118,30 Q-60,-10 0,-30 Q60,-10 118,30 Q100,105 0,112 Q-100,105 -118,30 Z" fill="{W}"/>')
    g.append(f'<path d="M0,-108 L0,-60 M-30,-104 L-22,-70 M30,-104 L22,-70" stroke="#c46a26" stroke-width="7" stroke-linecap="round"/>')
    g.append(eye(-50, 10) + eye(50, 10))
    g.append('<path d="M-12,40 L12,40 L0,54 Z" fill="#f08aa0" stroke="#111" stroke-width="4" stroke-linejoin="round"/>')
    g.append('<path d="M0,54 Q-12,70 -26,62 M0,54 Q12,70 26,62" fill="none" stroke="#111" stroke-width="5" stroke-linecap="round"/>')
    g.append('<path d="M-60,45 L-125,35 M-60,58 L-125,62 M60,45 L125,35 M60,58 L125,62" stroke="#111" stroke-width="3" stroke-linecap="round"/>')
    g.append('</g>')
    return "\n".join(g)

def dog(x, y, s, base, chest, mark=None, ears="mixed", tongue=False, open_mouth=True):
    g = [f'<g transform="translate({x},{y}) scale({s})">']
    g.append(f'<path d="M100,300 Q190,280 200,200" fill="none" stroke="#111" stroke-width="44" stroke-linecap="round"/>')
    g.append(f'<path d="M100,300 Q190,280 200,200" fill="none" stroke="{base}" stroke-width="30" stroke-linecap="round"/>')
    g.append(f'<path d="M-120,335 Q-145,75 0,55 Q145,75 120,335 Z" fill="{base}" {K}/>')
    g.append(f'<path d="M-55,250 Q-64,120 0,100 Q64,120 55,250 Q0,275 -55,250 Z" fill="{chest}"/>')
    paw = mark or chest
    for px in (-45, 45):
        g.append(f'<rect x="{px-26}" y="225" width="52" height="105" rx="20" fill="{base}" {K}/>')
        g.append(f'<rect x="{px-26}" y="290" width="52" height="40" rx="16" fill="{paw}"/>')
        g.append(f'<ellipse cx="{px}" cy="334" rx="36" ry="18" fill="{paw}" {K}/>')
    # orejas traseras
    if ears == "mixed":
        g.append(f'<path d="M-115,-20 L-120,-150 L-35,-95 Z" fill="{base}" {K}/>')
        g.append(f'<path d="M85,-90 Q170,-90 165,10 Q130,0 110,-40 Z" fill="{base}" {K}/>')
    if ears == "side":
        for sx in (-1, 1):
            g.append(f'<path d="M{sx*95},-90 Q{sx*165},-95 {sx*165},0 Q{sx*165},85 {sx*105},70 Z" fill="{base}" {K}/>')
    g.append(f'<path d="M-125,-10 Q-130,-110 0,-112 Q130,-110 125,-10 Q125,80 0,95 Q-125,80 -125,-10 Z" fill="{base}" {K}/>')
    if ears == "floppy":
        for sx in (-1, 1):
            g.append(f'<path d="M{sx*95},-95 Q{sx*175},-80 {sx*160},40 Q{sx*120},60 {sx*105},-20 Z" fill="{base}" {K}/>')
    # hocico
    g.append(f'<ellipse cx="0" cy="45" rx="72" ry="52" fill="{mark or chest}" {K}/>')
    if mark:
        g.append(f'<ellipse cx="-48" cy="-38" rx="16" ry="10" fill="{mark}"/><ellipse cx="48" cy="-38" rx="16" ry="10" fill="{mark}"/>')
    g.append(eye(-48, -8, 16) + eye(48, -8, 16))
    g.append('<ellipse cx="0" cy="22" rx="24" ry="16" fill="#111"/><ellipse cx="-6" cy="16" rx="7" ry="4" fill="#fff" opacity="0.7"/>')
    if open_mouth:
        g.append('<path d="M-38,52 Q0,95 38,52 Q0,66 -38,52 Z" fill="#5a1a22" stroke="#111" stroke-width="5" stroke-linejoin="round"/>')
    else:
        g.append('<path d="M0,38 L0,56 M0,56 Q-16,70 -30,60 M0,56 Q16,70 30,60" fill="none" stroke="#111" stroke-width="5" stroke-linecap="round"/>')
    if tongue:
        g.append('<path d="M-18,60 L18,60 L18,98 Q0,118 -18,98 Z" fill="#f07a92" stroke="#111" stroke-width="5" stroke-linejoin="round"/><path d="M0,66 L0,96" stroke="#c4546c" stroke-width="4"/>')
    g.append('</g>')
    return "\n".join(g)

def save(name, w, h, body):
    open(f"{OUT}/{name}.svg", "w").write(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{body}</svg>')
    subprocess.run(["rsvg-convert", "-o", f"{OUT}/{name}.png", f"{OUT}/{name}.svg"], check=True)

def card(name, sub, bg, bg2, fig):
    b = [f'<rect width="1080" height="1080" fill="{bg}"/>', f'<rect y="860" width="1080" height="220" fill="{bg2}"/>']
    b.append('<ellipse cx="540" cy="880" rx="230" ry="28" fill="#000" opacity="0.15"/>')
    b.append(fig)
    b.append(t(540, 130, 96, name, fill="#ffe14d"))
    if sub:
        b.append(t(540, 990, 40, sub, sw=5))
    return "\n".join(b)

HARRY = dict(base="#e6c590", chest="#fff7ea", ears="side", open_mouth=False)
KAFU = dict(base="#1f1a17", chest="#1f1a17", mark="#b9773a", ears="floppy", tongue=True, open_mouth=False)

save("1_lucky", 1080, 1080, card("LUCKY", "El gato de la casa", "#cfe9ff", "#a9d4f5", cat(540, 380, 1.45)))
save("2_harryson", 1080, 1080, card("HARRYSON", "5 años", "#fff1c9", "#f5d98f", dog(540, 380, 1.45, **HARRY)))
save("3_kafu", 1080, 1080, card("KAFÚ", "4 años", "#e3f7d4", "#bfe6a3", dog(540, 380, 1.45, **KAFU)))

# 4. equipo completo
b = ['<rect width="1280" height="720" fill="#ffd9e6"/>', '<rect y="600" width="1280" height="120" fill="#6cc24a"/>']
b.append(t(640, 75, 54, "LA FAMILIA DE TMB", fill="#ffe14d"))
for cx in (150, 390, 640, 880, 1120):
    b.append(f'<ellipse cx="{cx}" cy="606" rx="105" ry="16" fill="#000" opacity="0.15"/>')
b.append(tm.big(150, 175, 0.56, wave=True))
b.append(tm.baby(390, 435, 0.5, jump=True))
b.append(cat(640, 455, 0.45))
b.append(dog(880, 455, 0.45, **HARRY))
b.append(dog(1120, 455, 0.45, **KAFU))
for cx, n in [(150, "TMB"), (390, "Bebé TMB"), (640, "Lucky"), (880, "Harryson"), (1120, "Kafú")]:
    b.append(t(cx, 675, 30, n, sw=4))
save("4_familia", 1280, 720, "\n".join(b))
print("ok")
