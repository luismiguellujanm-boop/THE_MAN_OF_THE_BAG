INK="#2b1a0e"
def bag(x, y, s, rot=0, mouth="open", arms="up", body=True, color="#c9965f", shade="#a9763f", crown=False, flip=1, run=False):
    g = [f'<g transform="translate({x},{y}) rotate({rot}) scale({s*flip},{s})">']
    if body:
        if run:
            lg = 'fill="none" stroke="#2f3e6b" stroke-width="58" stroke-linecap="round" stroke-linejoin="round"'
            g.append(f'<path d="M-30,440 L-120,500 L-170,470" {lg}/><ellipse cx="-190" cy="465" rx="48" ry="22" fill="#111" transform="rotate(-30 -190 465)"/>')
            g.append(f'<path d="M40,440 L90,520 L70,580" {lg}/><ellipse cx="100" cy="595" rx="52" ry="22" fill="#111"/>')
        else:
            g.append('<rect x="-80" y="440" width="62" height="115" rx="12" fill="#2f3e6b" stroke="#111" stroke-width="6"/>')
            g.append('<rect x="18" y="440" width="62" height="115" rx="12" fill="#2f3e6b" stroke="#111" stroke-width="6"/>')
            g.append('<ellipse cx="-52" cy="565" rx="52" ry="22" fill="#111"/><ellipse cx="52" cy="565" rx="52" ry="22" fill="#111"/>')
        g.append('<rect x="-105" y="300" width="210" height="160" rx="35" fill="#1f1f1f"/>')
    # arms (drawn before bag so they come out from behind)
    arm = 'fill="none" stroke="#1a1a1a" stroke-width="46" stroke-linecap="round" stroke-linejoin="round"'
    if arms == "up":
        g.append(f'<path d="M-120,250 L-215,150 L-245,45" {arm}/><circle cx="-248" cy="30" r="34" fill="#1a1a1a"/>')
        g.append(f'<path d="M120,250 L215,150 L245,45" {arm}/><circle cx="248" cy="30" r="34" fill="#1a1a1a"/>')
    elif arms == "throw":
        g.append(f'<path d="M-120,250 L-215,300 L-250,380" {arm}/><circle cx="-252" cy="392" r="32" fill="#1a1a1a"/>')
        g.append(f'<path d="M120,230 L230,170 L280,70" {arm}/><circle cx="284" cy="58" r="34" fill="#1a1a1a"/>')
    elif arms == "flail":
        g.append(f'<path d="M-120,200 L-235,170 L-290,80" {arm}/><circle cx="-295" cy="68" r="32" fill="#1a1a1a"/>')
        g.append(f'<path d="M120,230 L240,260 L300,200" {arm}/><circle cx="306" cy="190" r="32" fill="#1a1a1a"/>')
    # bag body
    g.append(f'''<path d="M-150,20 L-120,0 L-80,18 L-40,2 L0,20 L40,0 L80,16 L120,2 L150,20
      L156,322 L130,346 L105,322 L80,348 L55,322 L30,346 L5,320 L-20,346 L-45,322 L-70,348 L-95,322 L-120,345 L-152,322 Z"
      fill="{color}" stroke="{INK}" stroke-width="9" stroke-linejoin="round"/>''')
    g.append(f'<path d="M118,30 L148,30 L152,318 L120,330 Z" fill="{shade}" opacity="0.55"/>')
    g.append(f'<path d="M-140,48 Q0,64 145,48" fill="none" stroke="{shade}" stroke-width="6" stroke-linecap="round"/>')
    g.append(f'<path d="M-60,300 L-40,240 M70,290 L55,250" stroke="{shade}" stroke-width="5" stroke-linecap="round"/>')
    # eyes: thick scribble bars
    e = 'stroke="#111" stroke-width="17" stroke-linecap="round"'
    g.append(f'<path d="M-98,118 L-28,110 M-100,140 L-24,132 M-94,160 L-34,154" {e}/>')
    g.append(f'<path d="M28,110 L98,118 M24,132 L100,140 M34,154 L94,160" {e}/>')
    if mouth == "open":
        g.append(f'<path d="M-62,200 L62,200 Q58,272 0,277 Q-58,272 -62,200 Z" fill="#fff" stroke="#111" stroke-width="9" stroke-linejoin="round"/>')
        g.append('<path d="M-30,262 Q0,240 30,262 Q0,276 -30,262 Z" fill="#e86a7a"/>')
    elif mouth == "shock":
        g.append('<ellipse cx="0" cy="235" rx="38" ry="50" fill="#111"/><ellipse cx="0" cy="258" rx="22" ry="14" fill="#e86a7a"/>')
    if arms == "hold":
        g.append(f'<path d="M-130,330 L-150,400 L-95,430" {arm}/>')
        g.append(f'<path d="M130,330 L150,400 L95,430" {arm}/>')
    if crown:
        g.append('<path d="M-80,10 L-90,-80 L-45,-40 L0,-100 L45,-40 L90,-80 L80,10 Z" fill="#ffd400" stroke="#111" stroke-width="8" stroke-linejoin="round"/>')
        g.append('<circle cx="0" cy="-30" r="12" fill="#ff4d6d" stroke="#111" stroke-width="4"/>')
    g.append('</g>')
    return "\n".join(g)

