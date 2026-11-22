// ===== Sonidos, voces y música =====
// Las voces y sonidos de sintetizador son grabaciones del creador (carpeta sfx/).
// Las frases que aún no se grabaron usan un sonido de reemplazo: cuando estén,
// basta con poner el archivo con el nombre indicado en VOCES y el juego lo usa solo.
(function () {
  const FILES = ["eructo_toxico", "recarga", "rayo_carga", "rayo_disparo", "rayo_final", "rayo_mutante_completo",
    "01_hola", "02_a_correr", "03_toca_para_saltar", "04_desliza_abajo", "05_desliza_adelante",
    "06_aaah_las_cabras", "07_uff_casi", "08_mmm_toxico", "grito_extra"];

  // frase → [archivo de voz, reemplazo mientras no exista]
  const VOCES = {
    hola: ["01_hola"], a_correr: ["02_a_correr"], saltar: ["03_toca_para_saltar"],
    saltar_teclado: ["19_presiona_espacio", "03_toca_para_saltar"],
    agacharse: ["04_desliza_abajo"], poder: ["05_desliza_adelante"],
    las_cabras: ["06_aaah_las_cabras"], casi: ["07_uff_casi"], toxico: ["08_mmm_toxico"],
    unete: ["09_unete", "~pop"], ya_poder: ["10_ya_tengo_poder", "recarga"],
    eructo: ["11_eructo_toxico", null], rayo: ["12_rayo_mutante", null],
    atrapado: ["13_me_atraparon", "grito_extra"], record: ["14_nuevo_record", "~tada"],
    otra_vez: ["15_otra_vez", "02_a_correr"],
  };
  const OPCIONALES = Object.values(VOCES).map((v) => v[0]).filter((f) => !FILES.includes(f));

  const A = { ctx: null, buf: {}, sfxOn: Store.get("sfx", true), musicOn: Store.get("musica", true), voz: null };
  let master, sfxG, musG;

  A.init = function () {
    if (A.ctx) { if (A.ctx.state === "suspended") A.ctx.resume(); return Promise.resolve(); }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return Promise.resolve();
    A.ctx = new AC();
    master = A.ctx.createGain(); master.connect(A.ctx.destination);
    sfxG = A.ctx.createGain(); sfxG.gain.value = A.sfxOn ? 1 : 0; sfxG.connect(master);
    musG = A.ctx.createGain(); musG.gain.value = A.musicOn ? 0.22 : 0; musG.connect(master);
    const load = (f, opt) => fetch(`sfx/${f}.mp3`).then((r) => { if (!r.ok) throw 0; return r.arrayBuffer(); })
      .then((b) => new Promise((ok, no) => A.ctx.decodeAudioData(b, ok, no)))
      .then((d) => { A.buf[f] = d; }).catch(() => { if (!opt) console.warn("Falta sonido", f); });
    return Promise.all([...FILES.map((f) => load(f)), ...OPCIONALES.map((f) => load(f, true))]);
  };

  A.play = function (name, vol = 1, rate = 1) {
    if (!A.ctx || !A.buf[name]) return null;
    const s = A.ctx.createBufferSource(); s.buffer = A.buf[name]; s.playbackRate.value = rate;
    const g = A.ctx.createGain(); g.gain.value = vol; s.connect(g); g.connect(sfxG); s.start();
    return s;
  };

  // Una sola voz a la vez (la nueva corta a la anterior)
  A.say = function (key) {
    const v = VOCES[key]; if (!v) return;
    const file = A.buf[v[0]] ? v[0] : v[1];
    if (!file) return;
    if (file[0] === "~") return A.fx(file.slice(1));
    try { if (A.voz) A.voz.stop(); } catch (e) {}
    A.voz = A.play(file, 1.15);
  };

  // ---- Efectos sintetizados (cortos y originales) ----
  function tone(type, f0, f1, dur, vol, delay = 0) {
    const t = A.ctx.currentTime + delay;
    const o = A.ctx.createOscillator(), g = A.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(sfxG); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, freq = 800) {
    const n = A.ctx.createBufferSource(), len = A.ctx.sampleRate * dur;
    const b = A.ctx.createBuffer(1, len, A.ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    n.buffer = b; const f = A.ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = freq;
    const g = A.ctx.createGain(); g.gain.value = vol; n.connect(f); f.connect(g); g.connect(sfxG); n.start();
  }
  A.fx = function (name) {
    if (!A.ctx) return;
    switch (name) {
      case "salto": tone("square", 260, 620, 0.16, 0.12); break;
      case "salto2": tone("square", 420, 900, 0.14, 0.1); break;
      case "gota": tone("sine", 900, 1500, 0.09, 0.18); tone("sine", 1400, 2000, 0.07, 0.1, 0.05); break;
      case "pop": tone("triangle", 500, 1000, 0.12, 0.25); tone("triangle", 750, 1500, 0.12, 0.2, 0.08); break;
      case "golpe": noise(0.25, 0.6, 500); tone("sine", 160, 60, 0.25, 0.4); break;
      case "boom": noise(0.6, 0.8, 1200); tone("sine", 120, 40, 0.5, 0.5); break;
      case "beee": {
        const t = A.ctx.currentTime, o = A.ctx.createOscillator(), l = A.ctx.createOscillator(), lg = A.ctx.createGain(), g = A.ctx.createGain();
        o.type = "sawtooth"; o.frequency.value = 420; l.frequency.value = 28; lg.gain.value = 40;
        l.connect(lg); lg.connect(o.frequency); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.13, t + 0.05);
        g.gain.setValueAtTime(0.13, t + 0.45); g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
        const f = A.ctx.createBiquadFilter(); f.frequency.value = 1600;
        o.connect(f); f.connect(g); g.connect(sfxG); o.start(t); l.start(t); o.stop(t + 0.75); l.stop(t + 0.75); break;
      }
      case "tada": [523, 659, 784, 1046].forEach((f, i) => tone("square", f, f, 0.22, 0.1, i * 0.1)); break;
      case "click": tone("square", 700, 500, 0.05, 0.08); break;
      case "falta": tone("square", 200, 140, 0.18, 0.1); break;
      case "pierde": tone("triangle", 600, 200, 0.3, 0.2); break;
    }
  };

  // ---- Música original (melodías simples compuestas para el juego) ----
  const N = (n) => 440 * Math.pow(2, (n - 69) / 12);
  const SONGS = {
    // Persecución: La menor, rápida
    cabras: { bpm: 152, lead: [69,72,76,72, 69,72,76,79, 77,76,74,72, 71,72,74,76, 69,72,76,72, 69,72,76,81, 79,77,76,74, 76,0,0,0],
              bass: [45,45,45,45, 40,40,40,40, 41,41,41,41, 43,43,43,43, 45,45,45,45, 40,40,40,40, 41,41,43,43, 45,45,40,40] },
    // Menú: Do mayor, alegre
    menu: { bpm: 112, lead: [72,76,79,76, 77,81,79,0, 76,79,84,79, 81,79,76,0, 74,77,81,77, 79,83,79,0, 84,79,76,79, 72,0,0,0],
            bass: [48,0,55,0, 53,0,55,0, 48,0,55,0, 53,0,52,0, 50,0,57,0, 55,0,55,0, 48,0,55,0, 48,0,48,0] },
  };
  let seq = null;
  A.music = function (name) {
    if (!A.ctx) return;
    if (seq && seq.name === name) return;
    A.stopMusic();
    const song = SONGS[name]; if (!song) return;
    const step = 60 / song.bpm / 2;
    let i = 0, next = A.ctx.currentTime + 0.1;
    seq = { name, id: setInterval(() => {
      while (next < A.ctx.currentTime + 0.25) {
        const l = song.lead[i % song.lead.length], b = song.bass[i % song.bass.length];
        if (l) note("square", N(l), next, step * 0.9, 0.16);
        if (b) note("triangle", N(b), next, step * 0.95, 0.4);
        i++; next += step;
      }
    }, 60) };
  };
  function note(type, f, t, d, v) {
    const o = A.ctx.createOscillator(), g = A.ctx.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(g); g.connect(musG); o.start(t); o.stop(t + d + 0.02);
  }
  A.stopMusic = function () { if (seq) { clearInterval(seq.id); seq = null; } };

  A.setSfx = (on) => { A.sfxOn = on; Store.set("sfx", on); if (sfxG) sfxG.gain.value = on ? 1 : 0; };
  A.setMusic = (on) => { A.musicOn = on; Store.set("musica", on); if (musG) musG.gain.value = on ? 0.22 : 0; };

  document.addEventListener("visibilitychange", () => {
    if (!A.ctx) return;
    if (document.hidden) A.ctx.suspend(); else A.ctx.resume();
  });

  window.Sfx = A;
})();
