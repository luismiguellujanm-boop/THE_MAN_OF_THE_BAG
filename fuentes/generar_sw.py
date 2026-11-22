"""Actualiza la lista de archivos del service worker (sw.js).
Uso: python3 fuentes/generar_sw.py   (desde la carpeta del repositorio)
Ejecutarlo cada vez que agregues o quites archivos en www/."""
import os, re, json
root = os.path.join(os.path.dirname(__file__), "..", "www")
files = ["./"]
for d, _, fs in os.walk(root):
    for f in fs:
        rel = os.path.relpath(os.path.join(d, f), root).replace(os.sep, "/")
        if rel != "sw.js":
            files.append(rel)
sw = open(os.path.join(root, "sw.js"), encoding="utf-8").read()
sw = re.sub(r"const ARCHIVOS = \[.*?\];", "const ARCHIVOS = " + json.dumps(sorted(files), indent=2) + ";", sw, flags=re.S)
open(os.path.join(root, "sw.js"), "w", encoding="utf-8").write(sw)
print(len(files), "archivos en sw.js")
