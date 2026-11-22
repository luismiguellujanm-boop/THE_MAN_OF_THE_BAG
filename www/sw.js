// Service worker: guarda el juego para que funcione sin internet.
// IMPORTANTE: al publicar cambios, sube el número de VERSION para que los jugadores reciban la actualización.
const VERSION = "tmb-v2.0.0";
const ARCHIVOS = [
  "./",
  "css/style.css",
  "img/cabeza_chicle.png",
  "img/cabeza_clasica.png",
  "img/cabeza_dorada.png",
  "img/cabeza_noche.png",
  "img/hoja_0.png",
  "img/hoja_1.png",
  "img/hoja_2.png",
  "img/hoja_3.png",
  "img/icono_192.png",
  "img/icono_512.png",
  "img/m1_far.png",
  "img/m1_mid.png",
  "img/m1_near.png",
  "img/m2_far.png",
  "img/m2_mid.png",
  "img/m2_near.png",
  "img/m3_far.png",
  "img/m3_mid.png",
  "img/m3_near.png",
  "img/m4_far.png",
  "img/m4_mid.png",
  "img/m4_near.png",
  "img/m5_far.png",
  "img/m5_mid.png",
  "img/m5_near.png",
  "img/meme_perdiste.png",
  "img/portada_suite.jpg",
  "img/sprites.json",
  "img/t_chicle_flail.png",
  "img/t_clasica_flail.png",
  "img/t_dorada_flail.png",
  "img/t_noche_flail.png",
  "img/trofeo_bronce.png",
  "img/trofeo_oro.png",
  "img/trofeo_plata.png",
  "index.html",
  "js/audio.js",
  "js/carrera.js",
  "js/config.js",
  "js/core.js",
  "js/data.js",
  "js/escape.js",
  "js/gfx.js",
  "js/main.js",
  "js/vivo.js",
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
