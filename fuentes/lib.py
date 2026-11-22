import math
from bagmod import bag

F = 'font-family="DejaVu Sans" font-weight="bold"'

def t(x, y, size, text, fill="#fff", anchor="middle", stroke="#111", sw=None):
    sw = sw if sw is not None else max(3, size * 0.12)
    return (f'<text x="{x}" y="{y}" text-anchor="{anchor}" {F} font-size="{size}" fill="{fill}" '
            f'stroke="{stroke}" stroke-width="{sw:.0f}" paint-order="stroke" stroke-linejoin="round">{text}</text>')

def box(x, y, w, h, fill="#111", r=18, op=0.75, stroke="none"):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" opacity="{op}" stroke="{stroke}" stroke-width="5"/>'

def toxic(cx, cy, r):
    s = [f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="#ffd400" stroke="#111" stroke-width="{r*0.12:.1f}"/>']
    for a in (0, 120, 240):
        s.append(f'<path d="M{cx},{cy} L{cx},{cy-r*0.82} A{r*0.82},{r*0.82} 0 0 1 {cx+r*0.71},{cy-r*0.41} Z" '
                 f'transform="rotate({a-30} {cx} {cy})" fill="#111"/>')
    s.append(f'<circle cx="{cx}" cy="{cy}" r="{r*0.2}" fill="#ffd400" stroke="#111" stroke-width="{r*0.08:.1f}"/>')
    return "".join(s)

def barrel(cx, cy, s=1):
    w, h = 70 * s, 95 * s
    return (f'<rect x="{cx-w/2}" y="{cy-h/2}" width="{w}" height="{h}" rx="{10*s}" fill="#8a8f99" stroke="#111" stroke-width="5"/>'
            f'<rect x="{cx-w/2}" y="{cy-h/2+12*s}" width="{w}" height="{10*s}" fill="#5bd12a"/>'
            f'<rect x="{cx-w/2}" y="{cy+h/2-22*s}" width="{w}" height="{10*s}" fill="#5bd12a"/>' + toxic(cx, cy, 20 * s))

def svg(body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">{body}</svg>'


def goat(x, y, s, col="#f2f2f2", horn="#5a4632", rot=0, mouth=True, legs="run"):
    g = [f'<g transform="translate({x},{y}) rotate({rot}) scale({s})">']
    lg = 'fill="none" stroke="#111" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"'
    lc = f'fill="none" stroke="{col}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"'
    if legs == "run":
        P = ["M-70,30 L-130,90 L-150,120", "M-40,35 L-60,110 L-100,130", "M60,30 L120,85 L160,80", "M85,25 L80,110 L110,140"]
    else:
        P = ["M-70,30 L-75,120", "M-35,35 L-35,125", "M55,30 L55,125", "M85,25 L88,120"]
    for p in P:
        g.append(f'<path d="{p}" {lg}/><path d="{p}" {lc}/>')
    g.append(f'<path d="M-115,-20 Q-160,-60 -140,-75" fill="none" stroke="#111" stroke-width="22" stroke-linecap="round"/>')
    g.append(f'<path d="M-115,-20 Q-160,-60 -140,-75" fill="none" stroke="{col}" stroke-width="12" stroke-linecap="round"/>')
    g.append(f'<ellipse cx="0" cy="0" rx="125" ry="62" fill="{col}" stroke="#111" stroke-width="8"/>')
    g.append(f'<path d="M80,-30 L120,-90" stroke="#111" stroke-width="58" stroke-linecap="round"/><path d="M80,-30 L120,-90" stroke="{col}" stroke-width="42" stroke-linecap="round"/>')
    # cuernos
    g.append(f'<path d="M118,-140 Q90,-200 40,-190 Q80,-175 100,-130 Z" fill="{horn}" stroke="#111" stroke-width="6" stroke-linejoin="round"/>')
    g.append(f'<path d="M140,-140 Q140,-205 95,-215 Q125,-185 122,-135 Z" fill="{horn}" stroke="#111" stroke-width="6" stroke-linejoin="round"/>')
    # oreja y cabeza
    g.append(f'<ellipse cx="95" cy="-120" rx="35" ry="14" fill="{col}" stroke="#111" stroke-width="6" transform="rotate(25 95 -120)"/>')
    g.append(f'<path d="M110,-150 Q170,-160 205,-110 Q215,-80 190,-70 L130,-75 Q100,-100 110,-150 Z" fill="{col}" stroke="#111" stroke-width="8" stroke-linejoin="round"/>')
    # ojo loco
    g.append('<circle cx="150" cy="-122" r="20" fill="#fff" stroke="#111" stroke-width="5"/><circle cx="158" cy="-118" r="8" fill="#111"/>')
    g.append('<path d="M128,-148 L172,-138" stroke="#111" stroke-width="7" stroke-linecap="round"/>')
    if mouth:
        g.append('<path d="M175,-88 Q205,-90 210,-78 Q200,-50 170,-62 Z" fill="#7a1f2b" stroke="#111" stroke-width="5"/>')
        g.append('<path d="M185,-62 Q200,-40 190,-30 Q178,-45 182,-62 Z" fill="#e86a7a" stroke="#111" stroke-width="4"/>')
    g.append('<path d="M150,-72 L160,-30 L170,-70 Z" fill="#cfc6b8" stroke="#111" stroke-width="5" stroke-linejoin="round"/>')
    g.append('<ellipse cx="203" cy="-100" rx="5" ry="4" fill="#111"/>')
    g.append('</g>')
    return "\n".join(g)

