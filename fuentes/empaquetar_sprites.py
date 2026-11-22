"""Junta los sprites chicos en hojas grandes (menos archivos y carga más rápida).
Uso: python3 fuentes/empaquetar_sprites.py   (después de generar los sprites)
Deja sueltos los que se usan directo en el HTML (fondos, cabezas, trofeos, TMB celebrando)."""
import json, os, re
from PIL import Image
IMG = os.path.join(os.path.dirname(__file__), "..", "www", "img")
atlas = json.load(open(os.path.join(IMG, "sprites.json")))
SUELTOS = re.compile(r"^(m\d_(far|mid|near)|cabeza_.*|trofeo_.*|t_[a-z]+_flail)$")
pack = sorted([n for n in atlas if not SUELTOS.match(n)], key=lambda n: -atlas[n]["h"])
SIZE = 2048
sheets, cur, x, y, rowh = [], None, 0, 0, 0
def nueva():
    global cur, x, y, rowh
    cur = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0)); sheets.append(cur); x = y = rowh = 0
nueva()
for n in pack:
    im = Image.open(os.path.join(IMG, n + ".png")).convert("RGBA")
    w, h = im.size
    if x + w > SIZE: x, y, rowh = 0, y + rowh + 2, 0
    if y + h > SIZE: nueva()
    cur.paste(im, (x, y))
    atlas[n].update({"sheet": len(sheets) - 1, "x": x, "y": y})
    x += w + 2; rowh = max(rowh, h)
    os.remove(os.path.join(IMG, n + ".png"))
for i, s in enumerate(sheets):
    bbox = s.getbbox(); s = s.crop((0, 0, SIZE, bbox[3]))
    s.save(os.path.join(IMG, f"hoja_{i}.png"), optimize=True)
json.dump({"sheets": len(sheets), "sprites": atlas}, open(os.path.join(IMG, "sprites.json"), "w"))
print(len(pack), "sprites en", len(sheets), "hojas")
