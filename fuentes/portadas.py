import sys, subprocess, math, random
sys.path.insert(0, "/home/claude")
from lib import t, goat
from tmbpose import tmb, baby
OUT = sys.argv[1]
src = open("/home/claude/pets.py").read()
ns = {"t": t}
exec(src[src.index("K = 'stroke"):src.index("def save")], ns)
exec(src[src.index("HARRY ="):src.index('save("1_lucky"')], ns)
cat, dog, HARRY, KAFU = ns["cat"], ns["dog"], ns["HARRY"], ns["KAFU"]
sys.argv = [sys.argv[0], "/tmp"]
import screens_v2 as SV
W, H, G = 1280, 720, 585
def save(name, body):
    s = f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}">{SV.DEFS}{body}</svg>'
    open(f"/tmp/{name}.svg", "w").write(s)
    subprocess.run(["rsvg-convert", "-o", f"{OUT}/{name}.png", f"/tmp/{name}.svg"], check=True)
    subprocess.run(["convert", f"{OUT}/{name}.png", "-quality", "86", f"{OUT}/{name}.jpg"], check=True)
    subprocess.run(["rm", f"{OUT}/{name}.png"])

# Portada de la suite
b = ['<rect width="1280" height="720" fill="#2b145a"/>']
for i in range(18):
    a = i * math.pi / 9
    b.append(f'<path d="M640,260 L{640+1600*math.cos(a):.0f},{260+1600*math.sin(a):.0f}" stroke="#fff" stroke-opacity="0.05" stroke-width="90"/>')
b.append('<rect y="600" width="1280" height="120" fill="#4caf2a"/><rect y="590" width="1280" height="20" fill="#6cc24a"/>')
b.append('<circle cx="170" cy="470" r="150" fill="#7dff3a" opacity="0.25" filter="url(#glow)"/>')
b.append(tmb(170, 600, 0.52, pose="flail", face="grin"))
b.append(baby(370, 600, 0.38))
b.append(cat(1000, 470, 0.38))
b.append(dog(1100, 475, 0.37, **HARRY))
b.append(dog(1205, 478, 0.36, **KAFU))
save("portada_suite", "\n".join(b))

# Portada de Escape de las cabras (sin botones; los botones los pone el juego)
b = SV.world(sky="dusk", seed=2)
b.append('<rect width="1280" height="720" fill="#000" opacity="0.25"/>')
b.append('<circle cx="380" cy="420" r="130" fill="#7dff3a" opacity="0.35" filter="url(#glow)"/>')
b.append(tmb(380, 545, 0.3, pose="jump", face="grin"))
b.append(SV.goat_g(110, 0.42, mouth=True))
b.append(SV.goat_g(610, 0.42, col="#ff9ec4", legs="stand"))
save("portada_escape", "\n".join(b))
print("ok")
