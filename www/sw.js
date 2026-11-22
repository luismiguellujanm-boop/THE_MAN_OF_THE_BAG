// Service worker: guarda el juego para que funcione sin internet.
// IMPORTANTE: al publicar cambios, sube el número de VERSION para que los jugadores reciban la actualización.
const VERSION = "tmb-v1.0.0";
const ARCHIVOS = [
  "./",
  "css/style.css",
  "img/barril.png",
  "img/bolsa_azul0.png",
  "img/bolsa_azul1.png",
  "img/bolsa_lila0.png",
  "img/bolsa_lila1.png",
  "img/bolsa_naranja0.png",
  "img/bolsa_naranja1.png",
  "img/bolsa_rosa0.png",
  "img/bolsa_rosa1.png",
  "img/bolsa_toxica0.png",
  "img/bolsa_toxica1.png",
  "img/bolsa_verde0.png",
  "img/bolsa_verde1.png",
  "img/cabeza.png",
  "img/cabra0.png",
  "img/cabra1.png",
  "img/cabrar0.png",
  "img/cabrar1.png",
  "img/caja.png",
  "img/fondo_arboles.png",
  "img/fondo_fabrica.png",
  "img/fondo_montes.png",
  "img/gota.png",
  "img/icono_192.png",
  "img/icono_512.png",
  "img/portada_escape.jpg",
  "img/portada_suite.jpg",
  "img/sprites.json",
  "img/tmb_caught.png",
  "img/tmb_flail.png",
  "img/tmb_jump.png",
  "img/tmb_run0.png",
  "img/tmb_run1.png",
  "img/tmb_stand.png",
  "img/tmb_throw.png",
  "img/tox_jump.png",
  "img/tox_run0.png",
  "img/tox_run1.png",
  "img/tox_throw.png",
  "img/tubo.png",
  "index.html",
  "js/audio.js",
  "js/config.js",
  "js/core.js",
  "js/escape.js",
  "js/main.js",
  "manifest.webmanifest",
  "sfx/01_hola.mp3",
  "sfx/02_a_correr.mp3",
  "sfx/03_toca_para_saltar.mp3",
  "sfx/04_desliza_abajo.mp3",
  "sfx/05_desliza_adelante.mp3",
  "sfx/06_aaah_las_cabras.mp3",
  "sfx/07_uff_casi.mp3",
  "sfx/08_mmm_toxico.mp3",
  "sfx/eructo_toxico.mp3",
  "sfx/grito_extra.mp3",
  "sfx/rayo_carga.mp3",
  "sfx/rayo_disparo.mp3",
  "sfx/rayo_final.mp3",
  "sfx/rayo_mutante_completo.mp3",
  "sfx/recarga.mp3"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return; // Supabase va directo a internet
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request).then((resp) => {
    if (resp.ok && url.pathname.match(/\.(mp3|png|jpg)$/)) { const cp = resp.clone(); caches.open(VERSION).then((c) => c.put(e.request, cp)); }
    return resp;
  })));
});
