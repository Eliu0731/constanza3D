# Constanza 3D

Visor 3D interactivo de la hoja topográfica **Constanza 1:50 000** (hoja 6072 I, ICM/DMA, 1988)
sobre el relieve de Copernicus GLO-30. Se puede rotar, acercar, desplazar y volar en "vuelo de pájaro".
Hecho con [three.js](https://threejs.org); funciona sin servidor propio (sitio estático).

## Controles
- Arrastrar: rotar · Rueda / pellizco: zoom · Clic derecho / dos dedos: desplazar
- Vistas rápidas (pájaro, cenital, N/S/E/O), rotación automática
- Exageración vertical, sombreado, azimut y elevación del sol

## Publicar en GitHub Pages
1. Sube este repositorio a GitHub.
2. **Settings → Pages → Build and deployment → Deploy from a branch**.
3. Rama `main`, carpeta **`/docs`** → Save. La página queda en `https://<usuario>.github.io/<repo>/`.

## Probar en local
El visor carga archivos con `fetch`, así que no funciona abriendo `index.html` con doble clic:

```bash
python3 -m http.server 8000 --directory docs
# abrir http://localhost:8000
```

## Reconstruir
```bash
npm install
npm run build                      # empaqueta src/viewer.js -> docs/viewer.js
pip install numpy pillow
python tools/build_data.py height.npy color_rgb.jpg docs   # regenera docs/meta.json y docs/tex.jpg
```
`height.npy` es el DEM (10 m, EPSG:32619) y `color_rgb.jpg` la hoja georreferenciada a esa misma rejilla.

## Datos y avisos
- La hoja topográfica lleva la leyenda *Limited distribution* (reimpresión DMA/NIMA). Verifica que su
  publicación esté permitida antes de hacer público el repositorio.
- Relieve: Copernicus GLO-30 (© ESA / Copernicus, uso conforme a su licencia).
- El DEM (WGS84) y la hoja (NAD27) se alinearon sin corrección vertical; es una visualización, no un producto cartográfico.
