// ===== Menús de la suite, apodo, ranking y fin de partida =====
(function () {
  const $ = (id) => document.getElementById(id);
  const stage = $("stage"), canvas = $("game");
  const JUEGO = "escape_cabras";
  let screen = null, rankBack = "s-suite";

  // ---------- escalar el escenario 1280×720 a la pantalla ----------
  function fit() {
    const s = Math.min(innerWidth / 1280, innerHeight / 720);
    stage.style.transform = `translate(-50%, -50%) scale(${s})`;
    stage.style.transformOrigin = "center center";
    Escape.resize(s);
  }
  addEventListener("resize", fit);
  Escape.setup(canvas);

  function show(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("on", s.id === id));
    screen = id;
    if (id === "s-suite") refreshSuite();
    if (id === "s-escape") $("t-record").textContent = Store.best(JUEGO) + " m";
    if (["s-suite", "s-escape", "s-ranking", "s-apodo"].includes(id)) Sfx.music("menu");
  }
  function overlay(id, on) { $(id).classList.toggle("on", on); }
  let toastT;
  function toast(msg) { const t = $("toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), 2200); }

  document.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    Sfx.fx("click");
    if (b.dataset.go) show(b.dataset.go);
    if (b.dataset.soon) toast(`¡${b.dataset.soon} llega muy pronto!`);
  });

  // ---------- 1. Inicio: toca para empezar (activa el sonido) ----------
  const loading = Promise.all([Escape.load()]).then(() => { $("splash-load").textContent = ""; });
  $("b-start").addEventListener("click", async () => {
    await Sfx.init(); await loading;
    pantallaCompleta();
    Sfx.say("hola");
    Net.sincronizar();
    show(Store.apodo() ? "s-suite" : "s-apodo");
    if (!Store.apodo()) setTimeout(() => $("i-apodo").focus(), 300);
  });
  function pantallaCompleta() {
    if (!matchMedia("(pointer: coarse)").matches) return;
    const el = document.documentElement;
    try {
      const p = el.requestFullscreen ? el.requestFullscreen() : null;
      if (p && p.then) p.then(() => window.screen.orientation && window.screen.orientation.lock && window.screen.orientation.lock("landscape").catch(() => {})).catch(() => {});
    } catch (e) {}
  }

  // ---------- 2. Apodo ----------
  const PAL1 = ["Bolsa", "Toxi", "Cabra", "Rayo", "Gota", "Mutante", "Eructo", "Papel", "Turbo", "Súper"];
  const PAL2 = ["Loca", "Veloz", "Verde", "Ninja", "Feliz", "Brava", "Pro", "Kid", "Rex", "Bolt"];
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  $("b-dado").addEventListener("click", () => {
    $("i-apodo").value = pick(PAL1) + pick(PAL2) + Math.floor(Math.random() * 90 + 10);
    $("apodo-msg").textContent = "";
  });
  const RE = /^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ _-]{3,14}$/;
  async function guardarApodo() {
    const v = $("i-apodo").value.trim().replace(/\s+/g, " ");
    const msg = $("apodo-msg");
    if (!RE.test(v)) { msg.textContent = "Usa de 3 a 14 letras o números."; Sfx.fx("falta"); return; }
    msg.textContent = "Revisando…";
    const r = await Net.registrar(v);
    const M = { apodo_ocupado: "Ese apodo ya lo tiene otro jugador. Prueba otro.", apodo_no_permitido: "Ese apodo no está permitido. Prueba otro.", apodo_invalido: "Usa de 3 a 14 letras o números." };
    if (M[r]) { msg.textContent = M[r]; Sfx.fx("falta"); return; }
    Store.set("apodo", v);
    msg.textContent = "";
    if (r === "offline") toast("Sin internet: tu apodo se subirá después");
    Sfx.fx("tada");
    show("s-suite");
  }
  $("b-apodo-ok").addEventListener("click", guardarApodo);
  $("i-apodo").addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Enter") guardarApodo(); });

  // ---------- 3. Suite ----------
  function refreshSuite() { $("t-apodo").textContent = Store.apodo() || "—"; $("t-gotas").textContent = Store.gotas(); }
  $("c-escape").addEventListener("click", () => show("s-escape"));
  $("chip-apodo").addEventListener("click", () => { $("i-apodo").value = Store.apodo(); show("s-apodo"); });
  $("b-ranking-suite").addEventListener("click", () => abrirRanking("s-suite"));

  // ---------- Ajustes ----------
  function pintarAjustes() {
    $("b-musica").textContent = `🎵 Música: ${Sfx.musicOn ? "SÍ" : "NO"}`;
    $("b-sonidos").textContent = `🔊 Sonidos: ${Sfx.sfxOn ? "SÍ" : "NO"}`;
  }
  $("b-ajustes").addEventListener("click", () => { pintarAjustes(); overlay("s-ajustes", true); });
  $("b-musica").addEventListener("click", () => { Sfx.setMusic(!Sfx.musicOn); pintarAjustes(); });
  $("b-sonidos").addEventListener("click", () => { Sfx.setSfx(!Sfx.sfxOn); pintarAjustes(); });
  $("b-cambiar-apodo").addEventListener("click", () => { overlay("s-ajustes", false); $("i-apodo").value = Store.apodo(); show("s-apodo"); });
  $("b-tutorial").addEventListener("click", () => { Store.set("tut_escape", false); toast("El tutorial saldrá en tu próxima partida"); });
  $("b-ajustes-ok").addEventListener("click", () => overlay("s-ajustes", false));

  // ---------- 4. Jugar ----------
  function jugar() {
    show(null);
    Escape.start({ tutorial: !Store.get("tut_escape", false), onOver: finPartida, onPause: pausar });
  }
  $("b-jugar").addEventListener("click", jugar);
  $("b-ranking").addEventListener("click", () => abrirRanking("s-escape"));

  function pausar() { if (!Escape.isRunning()) return; Escape.pause(); overlay("s-pausa", true); }
  $("b-seguir").addEventListener("click", () => { overlay("s-pausa", false); Escape.resume(); });
  $("b-salir").addEventListener("click", () => { overlay("s-pausa", false); Escape.stop(); show("s-escape"); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) pausar(); });

  // ---------- 5. Fin de partida ----------
  let ultimo = null;
  async function finPartida(r) {
    ultimo = r;
    Store.addGotas(r.gotas);
    const prev = Store.best(JUEGO), rec = r.metros > prev && r.metros > 0;
    if (rec) Store.setBest(JUEGO, r.metros);
    $("over-title").textContent = rec ? "¡QUÉ CARRERA!" : "¡TE ATRAPARON!";
    $("over-rec").classList.toggle("on", rec);
    $("o-dist").textContent = r.metros + " m";
    $("o-gotas").textContent = "+" + r.gotas;
    $("o-best").textContent = Store.best(JUEGO) + " m";
    $("o-world").textContent = "";
    overlay("s-over", true);
    if (rec) setTimeout(() => Sfx.say("record"), 400);
    if (r.metros > 0 && Store.apodo()) {
      $("o-world").textContent = "Subiendo al ranking mundial…";
      const res = await Net.enviar(JUEGO, r.metros);
      if (res && res.ok) $("o-world").textContent = `🌎 Puesto mundial: #${res.posicion} (tu mejor: ${res.mejor} m)`;
      else $("o-world").textContent = "Sin internet: tu récord se subirá después 📶";
    }
  }
  $("b-otra").addEventListener("click", () => { overlay("s-over", false); Escape.stop(); Sfx.say("otra_vez"); jugar(); });
  $("b-menu").addEventListener("click", () => { overlay("s-over", false); Escape.stop(); show("s-escape"); });
  $("b-compartir").addEventListener("click", async () => {
    const m = ultimo ? ultimo.metros : Store.best(JUEGO);
    const text = `¡Corrí ${m} m escapando de las cabras en el juego de The Man of the Bag! 🐐💨 ¿Me ganas? Canal de YouTube: @the_man_of_the_bag`;
    const url = location.href.split("#")[0];
    try {
      if (navigator.share) await navigator.share({ title: "Escape de las cabras", text, url });
      else { await navigator.clipboard.writeText(`${text} ${url}`); toast("¡Mensaje copiado! Pégalo donde quieras"); }
    } catch (e) {}
  });

  // ---------- 6. Ranking ----------
  async function abrirRanking(back) {
    rankBack = back; show("s-ranking");
    const list = $("rank-list"), msg = $("rank-msg"), me = $("rank-me");
    list.innerHTML = ""; me.textContent = ""; msg.textContent = "Cargando…";
    await Net.sincronizar(JUEGO);
    try {
      const rows = await Net.ranking(JUEGO);
      const yo = Store.apodo().toLowerCase();
      msg.textContent = rows.length ? "" : "¡Todavía nadie juega! Sé el primero 🏁";
      const medal = ["🥇", "🥈", "🥉"];
      list.innerHTML = rows.map((r) =>
        `<li class="${r.apodo.toLowerCase() === yo ? "yo" : ""}"><span class="pos">${medal[r.posicion - 1] || "#" + r.posicion}</span>` +
        `<span class="ap">${esc(r.apodo)}</span><span class="m">${r.mejor} m</span></li>`).join("");
      const mio = await Net.miRanking(JUEGO);
      me.textContent = mio ? `Tú (${mio.apodo}): puesto #${mio.posicion} · ${mio.mejor} m` : "Juega una partida para entrar al ranking";
    } catch (e) {
      msg.textContent = "Sin conexión. Revisa tu internet e inténtalo otra vez 📶";
      me.textContent = `Tu récord en este dispositivo: ${Store.best(JUEGO)} m`;
    }
  }
  $("b-rank-back").addEventListener("click", () => show(rankBack));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ---------- arranque ----------
  fit();
  show("s-splash");
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
})();
