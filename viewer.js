import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const $ = (id) => document.getElementById(id);
const cont = $('vista');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
cont.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 400);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI * 0.495; controls.minDistance = 1.5; controls.maxDistance = 90;
controls.zoomToCursor = true;

const amb = new THREE.AmbientLight(0xffffff, 1), sun = new THREE.DirectionalLight(0xfff4e0, 1);
scene.add(amb, sun, sun.target);

function resize() {
  const w = cont.clientWidth, h = cont.clientHeight;
  renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

let meta, hq, geo, pos, skirt, terr, exag = 2;
const BASE = -0.2; // km, fondo del bloque

function altura(i) { return (hq[i] / 65535) * (meta.zmax - meta.zmin) / 1000; } // km sobre zmin

function construir() {
  const { nx, ny, Wkm, Hkm } = meta;
  pos = new Float32Array(nx * ny * 3); const uv = new Float32Array(nx * ny * 2);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const k = j * nx + i;
    pos[3 * k] = (i / (nx - 1) - 0.5) * Wkm; pos[3 * k + 2] = (j / (ny - 1) - 0.5) * Hkm;
    uv[2 * k] = i / (nx - 1); uv[2 * k + 1] = 1 - j / (ny - 1);
  }
  const idx = new Uint32Array((nx - 1) * (ny - 1) * 6); let t = 0;
  for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
    idx[t++] = a; idx[t++] = c; idx[t++] = b; idx[t++] = b; idx[t++] = c; idx[t++] = d;
  }
  geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  return geo;
}

function alturas() {
  const { nx, ny } = meta;
  for (let k = 0; k < nx * ny; k++) pos[3 * k + 1] = altura(k) * exag;
  geo.attributes.position.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere();
  construirFalda();
}

function construirFalda() {
  if (skirt) { scene.remove(skirt); skirt.geometry.dispose(); }
  const { nx, ny } = meta; const P = [];
  const quad = (a, b) => { // a,b índices de vértices consecutivos del borde
    const ax = pos[3 * a], ay = pos[3 * a + 1], az = pos[3 * a + 2], bx = pos[3 * b], by = pos[3 * b + 1], bz = pos[3 * b + 2];
    P.push(ax, ay, az, ax, BASE, az, bx, by, bz, bx, by, bz, ax, BASE, az, bx, BASE, bz);
  };
  for (let i = 0; i < nx - 1; i++) { quad(i + 1, i); quad((ny - 1) * nx + i, (ny - 1) * nx + i + 1); }
  for (let j = 0; j < ny - 1; j++) { quad(j * nx, (j + 1) * nx); quad((j + 1) * nx + nx - 1, j * nx + nx - 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.computeVertexNormals();
  skirt = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: 0x9c8f78, side: THREE.DoubleSide }));
  scene.add(skirt);
}

function luz() {
  const s = +$('luz').value / 100, az = +$('az').value * Math.PI / 180, el = +$('el').value * Math.PI / 180;
  amb.intensity = Math.PI * (1 - 0.5 * s); sun.intensity = Math.PI * 1.0 * s;
  sun.position.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).multiplyScalar(100);
  $('luzv').textContent = Math.round(s * 100) + '%'; $('azv').textContent = Math.round(az * 180 / Math.PI) + '°'; $('elv').textContent = Math.round(el * 180 / Math.PI) + '°';
}

const VISTAS = {
  cenital: { p: [-1.8, 42, 0.01], t: [-1.8, 0, 0] },
  pajaro: { p: [-10, 16, 30], t: [0, 0.4, 0.5] },
  sur: { p: [0, 10, 31], t: [0, 0.6, 0] },
  oeste: { p: [-33, 10, 3], t: [0, 0.6, 0] },
  este: { p: [33, 10, -3], t: [0, 0.6, 0] },
  norte: { p: [0, 10, -31], t: [0, 0.6, 0] },
};
let anim = null;
function ir(nombre) {
  const v = VISTAS[nombre]; anim = { t0: performance.now(), p0: camera.position.clone(), q0: controls.target.clone(), p1: new THREE.Vector3(...v.p), q1: new THREE.Vector3(...v.t) };
}
function paso(now) {
  if (anim) {
    const u = Math.min(1, (now - anim.t0) / 1100), e = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
    camera.position.lerpVectors(anim.p0, anim.p1, e); controls.target.lerpVectors(anim.q0, anim.q1, e);
    if (u >= 1) anim = null;
  }
  controls.update(); renderer.render(scene, camera); requestAnimationFrame(paso);
}

document.querySelectorAll('[data-vista]').forEach((b) => b.addEventListener('click', () => ir(b.dataset.vista)));
['luz', 'az', 'el'].forEach((id) => $(id).addEventListener('input', luz));
let pend = false;
$('ex').addEventListener('input', () => {
  exag = +$('ex').value; $('exv').textContent = '×' + exag.toFixed(1);
  if (!pend) { pend = true; requestAnimationFrame(() => { pend = false; alturas(); }); }
});
$('rot').addEventListener('click', (e) => { controls.autoRotate = !controls.autoRotate; controls.autoRotateSpeed = 0.6; e.currentTarget.classList.toggle('on', controls.autoRotate); });
controls.addEventListener('start', () => { anim = null; });

(async () => {
  try {
    meta = await (await fetch('meta.json')).json();
    const bin = atob(meta.alt), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); hq = new Uint16Array(u8.buffer);
    construirTerreno();
  } catch (err) { $('carga').textContent = 'No se pudo cargar: ' + err; }
})();

function construirTerreno() {
  construir(); alturas(); luz();
  const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  terr = new THREE.Mesh(geo, mat); scene.add(terr);
  new THREE.TextureLoader().load('tex.jpg', (tx) => {
    tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = renderer.capabilities.getMaxAnisotropy();
    tx.generateMipmaps = true; tx.minFilter = THREE.LinearMipmapLinearFilter;
    mat.map = tx; mat.needsUpdate = true; $('carga').style.display = 'none';
  });
  const v = VISTAS.pajaro; camera.position.set(...v.p); controls.target.set(...v.t);
  requestAnimationFrame(paso);
}
