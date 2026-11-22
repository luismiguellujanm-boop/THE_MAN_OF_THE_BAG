"""TMB (diseño oficial del creador) en poses de juego + Bebé TMB de colores + cabezas."""
INK = "#2b1a0e"
BAG, BAGS = "#c8ae84", "#a88f66"
SKIN = "#d9b98a"
TOXIC = ("#8dff4a", "#5ccf22")

def eyes(dy=0, w=1.0):
    e = 'stroke="#111" stroke-width="19" stroke-linecap="round"'
    return (f'<path d="M{-80*w},{88+dy} L{-22*w},{84+dy} M{-82*w},{106+dy} L{-20*w},{103+dy}" {e}/>'
            f'<path d="M{22*w},{84+dy} L{80*w},{88+dy} M{20*w},{103+dy} L{82*w},{106+dy}" {e}/>')

def head(color=BAG, shade=BAGS, face="smile", view="front"):
    """Cabeza de bolsa, origen arriba al centro, ~215 de alto.
    view="front": mira a la pantalla · view="side": mira hacia adelante (derecha)."""
    g = [f'<path d="M-106,0 L106,0 L108,198 L86,215 L62,197 L38,215 L13,197 L-12,215 L-37,197 L-62,215 L-86,197 L-108,212 Z" '
         f'fill="{color}" stroke="{INK}" stroke-width="8" stroke-linejoin="round"/>']
    if view == "side":
        # costado de la bolsa a la izquierda (más oscuro) y la cara corrida hacia la derecha
        g.append(f'<path d="M-102,6 L-40,6 L-38,200 L-62,213 L-86,197 L-104,208 Z" fill="{shade}" opacity="0.75"/>')
        g.append(f'<path d="M-40,6 L-38,200" stroke="{INK}" stroke-width="4" opacity="0.5"/>')
        g.append(f'<path d="M-36,26 Q30,34 98,26" fill="none" stroke="{shade}" stroke-width="5" stroke-linecap="round"/>')
        g.append('<path d="M-6,54 L28,52" fill="none" stroke="#111" stroke-width="6" stroke-linecap="round"/>')
        e = 'stroke="#111" stroke-width="17" stroke-linecap="round"'
        g.append(f'<path d="M-8,88 L32,85 M-10,106 L34,103" {e}/><path d="M56,85 L92,88 M54,103 L94,106" {e}/>')
        if face == "shock":
            g.append('<ellipse cx="74" cy="160" rx="15" ry="20" fill="#111"/>')
        elif face == "grin":
            g.append('<path d="M46,150 Q72,170 96,138" fill="none" stroke="#111" stroke-width="7" stroke-linecap="round"/>')
        else:
            g.append('<path d="M52,158 Q78,160 94,138" fill="none" stroke="#111" stroke-width="6" stroke-linecap="round"/>')
        return "".join(g)
    g += [f'<path d="M80,10 L100,10 L102,190 L82,200 Z" fill="{shade}" opacity="0.55"/>',
          f'<path d="M-96,26 Q0,36 98,26" fill="none" stroke="{shade}" stroke-width="5" stroke-linecap="round"/>',
          '<path d="M-74,54 L-30,52" fill="none" stroke="#111" stroke-width="6" stroke-linecap="round"/>',
          eyes()]
    if face == "shock":
        g.append('<ellipse cx="40" cy="160" rx="18" ry="24" fill="#111"/>')
    elif face == "grin":
        g.append('<path d="M10,150 Q45,175 78,135" fill="none" stroke="#111" stroke-width="7" stroke-linecap="round"/>')
    elif face == "talk":
        g.append('<ellipse cx="45" cy="155" rx="22" ry="17" fill="#7a1f2b" stroke="#111" stroke-width="6"/>')
    else:
        g.append('<path d="M22,158 Q55,160 70,136" fill="none" stroke="#111" stroke-width="6" stroke-linecap="round"/>')
    return "".join(g)

def head_icon(x, y, s, color=BAG, shade=BAGS, face="smile", op=1):
    return f'<g transform="translate({x},{y}) scale({s})" opacity="{op}"><g transform="translate(0,-107)">{head(color, shade, face)}</g></g>'

POSES = {
    #        pierna atrás                    pierna adelante                 brazo atrás                      brazo adelante
    "run":   ("M-35,505 L-115,590 L-200,560", "M35,505 L110,600 L95,700", "M-80,300 L-150,370 L-125,450", "M80,300 L150,365 L215,300"),
    "jump":  ("M-35,505 L-95,600 L-40,670",   "M35,505 L110,585 L70,665", "M-80,300 L-170,230 L-210,130", "M80,300 L170,230 L210,130"),
    "flail": ("M-35,505 L-110,600 L-170,640", "M35,505 L115,590 L120,690", "M-80,300 L-180,280 L-240,190", "M80,300 L180,330 L250,260"),
    "throw": ("M-35,505 L-110,595 L-190,580", "M35,505 L100,600 L110,700", "M-80,300 L-150,380 L-120,460", "M80,300 L200,290 L310,255"),
    "run2":  ("M-35,505 L30,600 L15,700",     "M35,505 L-45,590 L-130,565", "M-80,300 L-20,370 L45,315",  "M80,300 L20,380 L45,455"),
    "fall":  ("M-35,505 L-80,595 L-70,690", "M35,505 L85,590 L100,680", "M-80,300 L-180,230 L-215,130", "M80,300 L180,240 L220,150"),
    "hold":  ("M-35,505 L-70,600 L-55,695", "M35,505 L75,600 L60,695", "M-80,300 L-110,180 L-115,60", "M80,300 L110,180 L115,60"),
    "ride":  ("M-35,505 L-95,590 L-80,690", "M35,505 L95,595 L95,690", "M-80,300 L-170,330 L-245,300", "M80,300 L170,320 L240,280"),
    "scoot": ("M-35,505 L-100,600 L-170,660", "M35,505 L45,600 L50,690", "M-80,300 L60,330 L150,300", "M80,300 L170,320 L240,290"),
    "stand": ("M-35,505 L-38,600 L-40,700",   "M35,505 L38,600 L40,700",   "M-80,300 L-118,410 L-122,470", "M80,300 L118,410 L122,470"),
}

def limb_end(p):
    pts = p.split("L")[-1].strip().split(",")
    return float(pts[0]), float(pts[1])

def limb_mid(p):
    pts = p.replace("M", "").split("L")[1].strip().split(",")
    return float(pts[0]), float(pts[1])

HEAD_DY = -18

def tmb(x, y, s, pose="run", bag=None, face="smile", coat="#93bcd4", coat2="#4e6f94",
        pants="#2b2f45", sleeve="#7a9cc4", under="#1f3460", flip=1, view="front"):
    """TMB grande. (x, y) = punto entre los pies, en el suelo. Alto total ~ 772*s."""
    color, shade = bag or (BAG, BAGS)
    bl, fl, ba, fa = POSES[pose]
    g = [f'<g transform="translate({x},{y - 738*s}) scale({s*flip},{s})">']
    # piernas
    for p in (bl, fl):
        g.append(f'<path d="{p}" fill="none" stroke="#111" stroke-width="76" stroke-linecap="round" stroke-linejoin="round"/>')
        g.append(f'<path d="{p}" fill="none" stroke="{pants}" stroke-width="62" stroke-linecap="round" stroke-linejoin="round"/>')
        ex, ey = limb_end(p)
        g.append(f'<g transform="translate({ex},{ey+18})"><path d="M-40,-18 L52,-18 L58,16 L-46,16 Z" fill="#111" stroke="#111" stroke-width="6" stroke-linejoin="round"/>'
                 f'<path d="M-44,10 L56,10" stroke="#fff" stroke-width="7"/></g>')
    def arm(p):
        o = []
        o.append(f'<path d="{p}" fill="none" stroke="#111" stroke-width="58" stroke-linecap="round" stroke-linejoin="round"/>')
        o.append(f'<path d="{p}" fill="none" stroke="{under}" stroke-width="44" stroke-linecap="round" stroke-linejoin="round"/>')
        mx, my = limb_mid(p)
        sp = p.split("L")[0] + f"L{mx},{my}"
        o.append(f'<path d="{sp}" fill="none" stroke="#111" stroke-width="60" stroke-linecap="round"/>')
        o.append(f'<path d="{sp}" fill="none" stroke="{sleeve}" stroke-width="48" stroke-linecap="round"/>')
        o.append(f'<circle cx="{mx}" cy="{my}" r="27" fill="{coat2}" stroke="#111" stroke-width="5"/>')
        ex, ey = limb_end(p)
        o.append(f'<ellipse cx="{ex}" cy="{ey}" rx="22" ry="25" fill="{SKIN}" stroke="#111" stroke-width="6"/>')
        return "".join(o)
    g.append(arm(ba))
    # sudadera (un solo color) con 2 tiras
    g.append(f'<path d="M-88,268 L88,268 L100,530 L-100,530 Z" fill="{coat}" stroke="#111" stroke-width="7" stroke-linejoin="round"/>')
    sx = 34 if view == "side" else 0
    g.append(f'<path d="M{-22+sx},280 Q{-30+sx},330 {-26+sx},380 M{22+sx},280 Q{30+sx},320 {26+sx},370" fill="none" stroke="#111" stroke-width="5" stroke-linecap="round"/>')
    g.append(f'<path d="M{-26+sx},378 L{-28+sx},398 M{26+sx},368 L{28+sx},388" stroke="#111" stroke-width="10" stroke-linecap="round"/>')
    if view == "side":
        g.append(f'<path d="M-88,268 L-40,268 L-36,530 L-100,530 Z" fill="#000" opacity="0.12"/>')
    g.append(arm(fa))
    # cuello alto
    g.append(f'<path d="M-100,212 L100,212 L80,276 L-80,276 Z" fill="{coat2}" stroke="#111" stroke-width="7" stroke-linejoin="round"/>')
    # cabeza separada del cuello
    g.append(f'<g transform="translate(0,{HEAD_DY})">{head(color, shade, face, view)}</g>')
    g.append('</g>')
    return "\n".join(g)

def baby(x, y, s, color=BAG, shade=BAGS, paw="#ddd0b8", arms="up", step=0):
    """Bebé TMB de colores (pandilla). (x, y) = suelo."""
    g = [f'<g transform="translate({x},{y - 320*s}) scale({s})">']
    bl = f'fill="none" stroke="{INK}" stroke-width="50" stroke-linecap="round" stroke-linejoin="round"'
    bi = f'fill="none" stroke="{paw}" stroke-width="36" stroke-linecap="round" stroke-linejoin="round"'
    legs = ["M-50,210 L-110,280", "M55,210 L100,290"] if step == 0 else ["M-50,210 L-20,290", "M55,210 L120,270"]
    for p in legs:
        g.append(f'<path d="{p}" {bl}/><path d="{p}" {bi}/>')
        ex, ey = limb_end(p)
        g.append(f'<ellipse cx="{ex}" cy="{ey+12}" rx="40" ry="20" fill="{paw}" stroke="{INK}" stroke-width="7"/>')
    ap = ["M-110,100 L-165,40", "M110,100 L165,40"] if arms == "up" else ["M-110,110 L-160,150", "M110,110 L160,150"]
    for p in ap:
        g.append(f'<path d="{p}" {bl}/><path d="{p}" {bi}/>')
        ex, ey = limb_end(p)
        g.append(f'<ellipse cx="{ex}" cy="{ey}" rx="40" ry="34" fill="{paw}" stroke="{INK}" stroke-width="7"/>')
    g.append(f'<path d="M-110,0 L110,-6 L114,212 L-108,218 Z" fill="{color}" stroke="{INK}" stroke-width="8" stroke-linejoin="round"/>')
    g.append(f'<path d="M85,4 L106,0 L110,205 L88,208 Z" fill="{shade}" opacity="0.55"/>')
    g.append(eyes(dy=-5, w=1.05))
    g.append('<path d="M-60,40 Q-50,22 -32,26" fill="none" stroke="#111" stroke-width="5" stroke-linecap="round"/>')
    g.append('<path d="M20,165 Q55,168 72,145" fill="none" stroke="#111" stroke-width="6" stroke-linecap="round"/>')
    g.append('</g>')
    return "\n".join(g)

def bolsita(x, y, s, color="#f0a0c0", shade="#c97a9c", step=0, arms="up"):
    """Bolsita de la pandilla (NO es Bebé TMB): bolsa de papel abierta, ojos redondos,
    boca abierta y extremidades de palito. (x, y) = suelo."""
    g = [f'<g transform="translate({x},{y - 330*s}) scale({s})">']
    lk = 'fill="none" stroke="#111" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"'
    legs = ["M-35,230 L-70,285 L-95,300", "M35,230 L60,300"] if step == 0 else ["M-35,230 L-20,300", "M35,230 L80,280 L105,295"]
    for p in legs:
        g.append(f'<path d="{p}" {lk}/>')
        ex, ey = limb_end(p)
        g.append(f'<ellipse cx="{ex+8}" cy="{ey+8}" rx="26" ry="12" fill="#111"/>')
    ap = ["M-80,120 L-130,60 L-140,20", "M80,120 L130,60 L140,20"] if arms == "up" else ["M-80,130 L-125,170", "M80,130 L125,170"]
    for p in ap:
        g.append(f'<path d="{p}" {lk}/>')
        ex, ey = limb_end(p)
        g.append(f'<circle cx="{ex}" cy="{ey}" r="15" fill="#111"/>')
    # bolsa abierta: más angosta arriba, borde superior en zigzag, base doblada
    g.append(f'<path d="M-78,0 L-58,-18 L-39,0 L-19,-18 L0,0 L19,-18 L39,0 L58,-18 L78,0 L92,240 L-92,240 Z" '
             f'fill="{color}" stroke="#111" stroke-width="8" stroke-linejoin="round"/>')
    g.append(f'<path d="M62,8 L78,6 L90,232 L70,232 Z" fill="{shade}" opacity="0.6"/>')
    g.append(f'<path d="M-88,206 L88,206" stroke="{shade}" stroke-width="6" stroke-linecap="round"/>')
    g.append('<path d="M-70,40 Q0,52 70,40" fill="none" stroke="#111" stroke-width="4" stroke-dasharray="10 9" opacity="0.5"/>')
    # ojos redondos con brillo y boca abierta
    for ex in (-34, 34):
        g.append(f'<circle cx="{ex}" cy="100" r="20" fill="#fff" stroke="#111" stroke-width="5"/><circle cx="{ex+4}" cy="104" r="10" fill="#111"/><circle cx="{ex+8}" cy="99" r="3.5" fill="#fff"/>')
    g.append('<path d="M-30,140 Q0,190 30,140 Z" fill="#7a1f2b" stroke="#111" stroke-width="6" stroke-linejoin="round"/>')
    g.append('<path d="M-14,160 Q0,176 14,160 Q0,168 -14,160 Z" fill="#e86a7a"/>')
    g.append('</g>')
    return "\n".join(g)
