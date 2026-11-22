"""Sugerencia: trofeo 'La Bolsa de Oro' y momento de RÉCORD MUNDIAL."""
import sys, subprocess, math, random
sys.path.insert(0, "/home/claude")
from lib import t, box, goat
from tmbpose import tmb
OUT = "/tmp"

METAL = {
    "oro":    dict(main="#ffd23f", dark="#e0a800", horn="#c98a1a", hornl="#8a5a10", ink="#5a3a00", gem="#7dff3a", num="#1"),
    "plata":  dict(main="#e3e8ef", dark="#aab4c2", horn="#9aa5b5", hornl="#6b7685", ink="#3a4350", gem="#7fd3ff", num="#2"),
    "bronce": dict(main="#e8a064", dark="#b86b30", horn="#9a5a28", hornl="#6b3a14", ink="#4a2408", gem="#ffb36b", num="#3"),
}
def trophy(x, y, s=1.0, metal="oro"):
    """Trofeo: (x, y) = base en el suelo."""
    M = METAL[metal]
    g = [f'<g transform="translate({x},{y}) scale({s})">']
    # base
    g.append('<rect x="-120" y="-70" width="240" height="70" rx="10" fill="#3a2a5a" stroke="#111" stroke-width="7"/>')
    g.append(f'<rect x="-120" y="-70" width="240" height="14" fill="{M['main']}" stroke="#111" stroke-width="5"/>')
    g.append(f'<rect x="-60" y="-52" width="120" height="40" rx="6" fill="{M['main']}" stroke="#111" stroke-width="4"/>')
    g.append(t(0, -22, 30, M["num"], fill="#111", sw=0))
    # pie con gota tóxica
    g.append(f'<path d="M-50,-70 L50,-70 L28,-120 L-28,-120 Z" fill="{M['dark']}" stroke="#111" stroke-width="6" stroke-linejoin="round"/>')
    g.append(f'<path d="M0,-180 Q36,-140 0,-112 Q-36,-140 0,-180 Z" fill="{M['gem']}" stroke="#111" stroke-width="6"/>')
    g.append('<path d="M-10,-150 Q-12,-160 -4,-168" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/>')
    g.append(f'<rect x="-40" y="-200" width="80" height="26" rx="8" fill="{M['dark']}" stroke="#111" stroke-width="6"/>')
    # asas = cuernos de cabra dorados
    for sx in (-1, 1):
        g.append(f'<path d="M{sx*95},-330 Q{sx*210},-360 {sx*200},-250 Q{sx*190},-190 {sx*120},-230 Q{sx*170},-250 {sx*165},-290 Q{sx*160},-320 {sx*100},-300 Z" fill="{M['horn']}" stroke="#111" stroke-width="7" stroke-linejoin="round"/>')
        for i in range(3):
            g.append(f'<path d="M{sx*(150+i*12)},{-335+i*30} l{sx*18},8" stroke="{M['hornl']}" stroke-width="5"/>')
    # copa = bolsa dorada abierta (borde zigzag arriba) con la cara de TMB
    g.append(f'<path d="M-110,-420 L-88,-440 L-66,-420 L-44,-440 L-22,-420 L0,-440 L22,-420 L44,-440 L66,-420 L88,-440 L110,-420 L100,-200 L-100,-200 Z" fill="{M['main']}" stroke="#111" stroke-width="8" stroke-linejoin="round"/>')
    g.append(f'<path d="M70,-418 L104,-418 L96,-205 L66,-205 Z" fill="{M['dark']}" opacity="0.8"/>')
    g.append('<path d="M-88,-380 Q-60,-392 -40,-386" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round" opacity="0.8"/>')
    g.append(f'<path d="M-60,-352 L-28,-354" stroke="{M['ink']}" stroke-width="6" stroke-linecap="round"/>')
    e = f'stroke="{M["ink"]}" stroke-width="15" stroke-linecap="round"'
    g.append(f'<path d="M-68,-326 L-22,-329 M-70,-310 L-20,-312" {e}/><path d="M20,-329 L66,-326 M18,-312 L68,-310" {e}/>')
    g.append(f'<path d="M14,-262 Q42,-262 56,-282" stroke="{M['ink']}" stroke-width="7" fill="none" stroke-linecap="round"/>')
    g.append('</g>')
    return "".join(g)

def sparkle(x, y, r, c="#fff"):
    return f'<path d="M{x},{y-r} Q{x+r*0.15},{y-r*0.15} {x+r},{y} Q{x+r*0.15},{y+r*0.15} {x},{y+r} Q{x-r*0.15},{y+r*0.15} {x-r},{y} Q{x-r*0.15},{y-r*0.15} {x},{y-r} Z" fill="{c}"/>'

def save(name, w, h, body):
    open(f"/tmp/{name}.svg", "w").write(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}">{body}</svg>')
    subprocess.run(["rsvg-convert", "-o", f"{OUT}/{name}.png", f"/tmp/{name}.svg"], check=True)

