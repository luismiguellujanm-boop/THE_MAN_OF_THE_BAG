import subprocess, sys
sys.path.insert(0, "/home/claude")
from lib import t

OUT = sys.argv[1]
INK = "#2b1a0e"
BAG, BAGS = "#c8ae84", "#a88f66"
PAW = "#ddd0b8"
SKIN = "#d9b98a"

def eyes(dy=0, w=1.0):
    e = 'stroke="#111" stroke-width="19" stroke-linecap="round"'
    return (f'<path d="M{-80*w},{88+dy} L{-22*w},{84+dy} M{-82*w},{106+dy} L{-20*w},{103+dy}" {e}/>'
            f'<path d="M{22*w},{84+dy} L{80*w},{88+dy} M{20*w},{103+dy} L{82*w},{106+dy}" {e}/>')

def big(x, y, s, coat="#93bcd4", coat2="#4e6f94", pants="#2b2f45", wave=False, sleeve="#7a9cc4", under="#1f3460"):
    g = [f'<g transform="translate({x},{y}) scale({s})">']
    # piernas y zapatos
    for lx in (-72, 8):
        g.append(f'<rect x="{lx}" y="505" width="64" height="200" rx="10" fill="{pants}" stroke="#111" stroke-width="6"/>')
    g.append('<path d="M-88,700 L-4,700 L2,738 L-96,738 Z" fill="#111" stroke="#111" stroke-width="6" stroke-linejoin="round"/>')
    g.append('<path d="M4,700 L88,700 L96,738 L-2,738 Z" fill="#111" stroke="#111" stroke-width="6" stroke-linejoin="round"/>')
    g.append('<path d="M-94,730 L0,730 M2,730 L94,730" stroke="#fff" stroke-width="7"/>')
    # brazos
    sl = f'fill="none" stroke="{coat}" stroke-width="44" stroke-linecap="round" stroke-linejoin="round"'
    ol = 'fill="none" stroke="#111" stroke-width="56" stroke-linecap="round" stroke-linejoin="round"'
    left = "M-80,300 L-118,410 L-122,470"
    right = "M80,300 L160,230 L185,140" if wave else "M80,300 L118,410 L122,470"
    ul = f'fill="none" stroke="{under}" stroke-width="44" stroke-linecap="round" stroke-linejoin="round"'
    for p in (left, right):
        g.append(f'<path d="{p}" {ol}/><path d="{p}" {ul}/>')
    sv = f'fill="none" stroke="{sleeve}" stroke-width="50" stroke-linecap="round"'
    for p in ("M-80,300 L-108,385", "M80,300 L140,248" if wave else "M80,300 L108,385"):
        g.append(f'<path d="{p}" fill="none" stroke="#111" stroke-width="60" stroke-linecap="round"/><path d="{p}" {sv}/>')
    g.append(f'<rect x="-136" y="378" width="56" height="18" rx="5" fill="{coat2}" stroke="#111" stroke-width="5" transform="rotate(-15 -108 387)"/>')
    if wave:
        g.append(f'<rect x="122" y="232" width="56" height="18" rx="5" fill="{coat2}" stroke="#111" stroke-width="5" transform="rotate(-45 150 241)"/>')
    else:
        g.append(f'<rect x="80" y="378" width="56" height="18" rx="5" fill="{coat2}" stroke="#111" stroke-width="5" transform="rotate(15 108 387)"/>')
    # abrigo largo
    g.append(f'<path d="M-88,268 L88,268 L100,530 L-100,530 Z" fill="{coat}" stroke="#111" stroke-width="7" stroke-linejoin="round"/>')
    # tiras del abrigo
    g.append('<path d="M-22,280 Q-30,330 -26,380 M22,280 Q30,320 26,370" fill="none" stroke="#111" stroke-width="5" stroke-linecap="round"/>')
    g.append('<path d="M-26,378 L-28,398 M26,368 L28,388" stroke="#111" stroke-width="10" stroke-linecap="round"/>')
    # puños y manos
    lh = (-122, 495); rh = (190, 120) if wave else (122, 495)
    for (hx, hy), (cx, cy) in [(lh, (-121, 458)), (rh, (182, 155) if wave else (121, 458))]:
        g.append(f'<circle cx="{cx}" cy="{cy}" r="27" fill="{under}" stroke="#111" stroke-width="6"/>')
        g.append(f'<ellipse cx="{hx}" cy="{hy}" rx="20" ry="24" fill="{SKIN}" stroke="#111" stroke-width="6"/>')
    # cuello alto
    g.append(f'<path d="M-100,212 L100,212 L80,276 L-80,276 Z" fill="{coat2}" stroke="#111" stroke-width="7" stroke-linejoin="round"/>')
    # cabeza de bolsa
    g.append('<g transform="translate(0,-18)">')
    g.append(f'''<path d="M-106,0 L106,0 L108,198 L86,215 L62,197 L38,215 L13,197 L-12,215 L-37,197 L-62,215 L-86,197 L-108,212 Z"
      fill="{BAG}" stroke="{INK}" stroke-width="8" stroke-linejoin="round"/>''')
    g.append(f'<path d="M80,10 L100,10 L102,190 L82,200 Z" fill="{BAGS}" opacity="0.55"/>')
    g.append(f'<path d="M-96,26 Q0,36 98,26" fill="none" stroke="{BAGS}" stroke-width="5" stroke-linecap="round"/>')
    g.append('<path d="M-74,54 L-30,52" fill="none" stroke="#111" stroke-width="6" stroke-linecap="round"/>')  # ceja
    g.append(eyes())
    g.append('<path d="M22,158 Q55,160 70,136" fill="none" stroke="#111" stroke-width="6" stroke-linecap="round"/>')
    g.append('</g>')
    g.append('</g>')
    return "\n".join(g)

def baby(x, y, s, jump=False):
    g = [f'<g transform="translate({x},{y}) scale({s})">']
    bl = f'fill="none" stroke="{INK}" stroke-width="50" stroke-linecap="round" stroke-linejoin="round"'
    bi = f'fill="none" stroke="{PAW}" stroke-width="36" stroke-linecap="round" stroke-linejoin="round"'
    legs = ["M-50,210 L-95,300", "M55,210 L90,295"] if not jump else ["M-50,210 L-80,280", "M55,210 L80,280"]
    for p in legs:
        g.append(f'<path d="{p}" {bl}/><path d="{p}" {bi}/>')
    feet = [(-118, 305), (112, 300)] if not jump else [(-95, 290), (98, 290)]
    for fx, fy in feet:
        g.append(f'<ellipse cx="{fx}" cy="{fy}" rx="40" ry="20" fill="{PAW}" stroke="{INK}" stroke-width="7"/>')
    arms = ["M-110,110 L-160,150", "M110,110 L160,150"] if not jump else ["M-110,100 L-165,40", "M110,100 L165,40"]
    for p in arms:
        g.append(f'<path d="{p}" {bl}/><path d="{p}" {bi}/>')
    hands = [(-175, 160), (175, 160)] if not jump else [(-178, 25), (178, 25)]
    for hx, hy in hands:
        g.append(f'<ellipse cx="{hx}" cy="{hy}" rx="40" ry="34" fill="{PAW}" stroke="{INK}" stroke-width="7"/>')
    g.append(f'<path d="M-110,0 L110,-6 L114,212 L-108,218 Z" fill="{BAG}" stroke="{INK}" stroke-width="8" stroke-linejoin="round"/>')
    g.append(f'<path d="M85,4 L106,0 L110,205 L88,208 Z" fill="{BAGS}" opacity="0.55"/>')
    g.append(eyes(dy=-5, w=1.05))
    g.append('<path d="M-60,40 Q-50,22 -32,26" fill="none" stroke="#111" stroke-width="5" stroke-linecap="round"/>')
    g.append('<path d="M20,165 Q55,168 72,145" fill="none" stroke="#111" stroke-width="6" stroke-linecap="round"/>')
    if jump:
        g.append('<ellipse cx="-70" cy="135" rx="18" ry="9" fill="#ff8fa3" opacity="0.7"/><ellipse cx="72" cy="135" rx="18" ry="9" fill="#ff8fa3" opacity="0.7"/>')
    g.append('</g>')
    return "\n".join(g)

def save(name, w, h, body):
    open(f"{OUT}/{name}.svg", "w").write(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{body}</svg>')
    subprocess.run(["rsvg-convert", "-o", f"{OUT}/{name}.png", f"{OUT}/{name}.svg"], check=True)

floor = lambda y, w: f'<ellipse cx="{w}" cy="{y}" rx="170" ry="22" fill="#000" opacity="0.15"/>'

# 1. TMB grande
b = ['<rect width="1080" height="1080" fill="#ffe9a8"/>', '<rect y="900" width="1080" height="180" fill="#f5d27a"/>']
b.append(t(540, 95, 70, "TMB", fill="#ffe14d"))
b.append(t(540, 140, 28, "The Man of the Bag · según tu diseño", fill="#fff", sw=4))
b.append(floor(940, 300) + floor(940, 780))
b.append(big(300, 200, 1.0))
b.append(big(780, 200, 1.0, wave=True))
b.append(t(300, 1000, 30, "Normal", sw=4))
b.append(t(780, 1000, 30, "¡Hola!", sw=4))
save("1_tmb_grande", 1080, 1080, "\n".join(b))

# 2. Bebé TMB
b = ['<rect width="1080" height="1080" fill="#ffd9e6"/>', '<rect y="820" width="1080" height="260" fill="#ffc2d6"/>']
b.append(t(540, 110, 76, "BEBÉ TMB", fill="#ffe14d"))
b.append(floor(840, 300) + floor(840, 780))
b.append(baby(300, 480, 1.05))
b.append(baby(780, 420, 1.05, jump=True))
for (x, y) in [(640, 330), (930, 360), (560, 600)]:
    b.append(f'<path d="M{x},{y} l8,18 20,0 -16,12 6,20 -18,-12 -18,12 6,-20 -16,-12 20,0 Z" fill="#ffd400" stroke="#111" stroke-width="4"/>')
b.append(t(300, 960, 30, "Caminando", sw=4))
b.append(t(780, 960, 30, "¡Feliz!", sw=4))
save("2_bebe_tmb", 1080, 1080, "\n".join(b))

# 3. Crecimiento
b = ['<rect width="1280" height="720" fill="#bfe6ff"/>', '<rect y="610" width="1280" height="110" fill="#6cc24a"/>']
b.append(t(640, 80, 56, "¡TMB VA CRECIENDO!", fill="#ffe14d"))
b.append(floor(612, 230) + floor(612, 960))
b.append(baby(230, 400, 0.65))
b.append(big(960, 165, 0.63, wave=True))
b.append('<path d="M420,420 L700,420" stroke="#111" stroke-width="22" stroke-linecap="round"/><path d="M420,420 L700,420" stroke="#7dff3a" stroke-width="12" stroke-linecap="round"/>')
b.append('<path d="M690,385 L745,420 L690,455 Z" fill="#7dff3a" stroke="#111" stroke-width="6" stroke-linejoin="round"/>')
b.append(t(580, 390, 26, "con tus cuidados", fill="#111", sw=0))
b.append(t(230, 680, 30, "Bebé TMB", sw=4))
b.append(t(960, 680, 30, "TMB grande", sw=4))
save("3_crecimiento", 1280, 720, "\n".join(b))

print("ok")
