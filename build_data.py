"""Genera docs/meta.json (alturas 16 bit en base64) y docs/tex.jpg a partir de:
  - height.npy   : DEM float32 (filas = norte->sur), píxel de 10 m
  - color_rgb.jpg: hoja topográfica georreferenciada a la misma rejilla (aprox. 5 m/px)
Uso: python tools/build_data.py height.npy color_rgb.jpg [salida=docs]
"""
import sys, json, base64
import numpy as np
from PIL import Image

dem, tex = sys.argv[1], sys.argv[2]
out = sys.argv[3] if len(sys.argv) > 3 else "docs"
RES_M = 10.0          # tamaño de píxel del DEM
NX, NY = 676, 481     # malla del visor (~40 m)
BORDE = 8             # px del margen de la hoja que se recortan

z = np.load(dem).astype(np.float32)
H, W = z.shape
yi = np.linspace(0, H - 1, NY).round().astype(int)
xi = np.linspace(0, W - 1, NX).round().astype(int)
g = z[np.ix_(yi, xi)]
zmin, zmax = float(g.min()), float(g.max())
q = np.round((g - zmin) / (zmax - zmin) * 65535).astype("<u2")
meta = dict(nx=NX, ny=NY, zmin=zmin, zmax=zmax,
            Wkm=(W - 1) * RES_M / 1000, Hkm=(H - 1) * RES_M / 1000,
            alt=base64.b64encode(q.tobytes()).decode())
json.dump(meta, open(f"{out}/meta.json", "w"))

im = Image.open(tex).convert("RGB")
im = im.crop((BORDE, BORDE, im.width - BORDE, im.height - BORDE))
im = im.resize((4096, round(4096 * im.height / im.width)), Image.LANCZOS)
im.save(f"{out}/tex.jpg", quality=86, subsampling=0, optimize=True)
print("ok", meta["Wkm"], meta["Hkm"], zmin, zmax, im.size)
