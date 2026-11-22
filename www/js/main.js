// ===== Menús de la suite =====
(function () {
  const $ = (id) => document.getElementById(id);
  const stage = $("stage"), canvas = $("game"), ui = $("ui"), over = $("over");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const D = DATA;
  let mode = "h", scale = 1, cur = { name: null, p: {} }, game = null, anim = 0;
  Escape.setup(canvas); Carrera.setup(canvas);

  // ---------- escenario: horizontal 1280×720 o vertical 720×1280 ----------
  function fit() {
    const W = mode === "v" ? 720 : 1280, H = mode === "v" ? 1280 : 720;
    scale = Math.min(innerWidth / W, innerHeight / H);
    stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
    (mode === "v" ? Carrera : Escape).resize(scale);
    const coarse = matchMedia("(pointer: coarse)").matches, portrait = innerHeight > innerWidth;
    const need = coarse && ((mode === "h" && portrait) || (mode === "v" && !portrait));
    $("rotar").classList.toggle("on", need); $("rotar").classList.toggle("v", mode === "v");
  }
  function setMode(m) { mode = m; stage.classList.toggle("vertical", m === "v"); fit(); }
  addEventListener("resize", fit);

  let toastT;
  function toast(m) { const t = $("toast"); t.textContent = m; t.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), 2400); }
  function medallas() {
    const n = Prog.revisarMedallas();
    n.forEach((m, i) => setTimeout(() => { Sfx.fx("estrella"); toast(`🏅 ¡Medalla! ${m.emoji} ${m.name}`); }, 600 + i * 2600));
  }

  // ---------- enrutador simple ----------
  function show(name, p = {}) {
    cancelAnimationFrame(anim); cur = { name, p };
    if (!game) setMode(name === "carrera" ? "v" : "h");
    ui.innerHTML = SCR[name](p);
    if (AFTER[name]) AFTER[name](p);
    if (["suite", "mapa", "nivel", "vestidor", "premios", "vitrina", "ranking", "vivo", "apodo"].includes(name)) Sfx.music("menu");
  }
  function overlay(html) { over.innerHTML = html || ""; }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-a]"); if (!b) return;
    Sfx.fx("click");
    const fn = ACT[b.dataset.a]; if (fn) fn(b.dataset, b);
  });

  const top = () => `<div class="topbar">
    <div class="chip" data-a="apodo">👤 ${esc(Store.apodo() || "—")}</div>
    <div class="chip g">💧 ${Store.gotas()}</div><div class="chip d">💎 ${Store.diamantes()}</div>
    <button class="ibtn" data-a="ajustes">⚙️</button></div>`;
  const back = (to, extra = "") => `<button class="ibtn back" data-a="go" data-to="${to}" ${extra}>⬅</button>`;
  const starStr = (n) => "★".repeat(n) + "☆".repeat(3 - n);

  // ---------- pantallas ----------
  const SCR = {
    splash: () => `<div class="scr bg-suite"><div style="position:absolute;right:70px;top:50%;transform:translateY(-50%);width:640px;text-align:center">
      <h1 class="title t-big">THE MAN<br>OF THE BAG</h1><p class="title t-mid green" style="margin:8px 0 26px">· JUEGOS ·</p>
      <button class="btn b-green b-big pulse" data-a="start">TOCA PARA EMPEZAR</button><p class="tiny" id="load">Cargando…</p></div></div>`,

    apodo: () => `<div class="scr bg-suite"><div class="panel center" style="width:640px">
      <h2 class="title">¿CÓMO TE LLAMAN?</h2><p class="hint">Escribe un <b>apodo</b>. Nunca tu nombre real.</p>
      <input class="inp apodo" id="i-apodo" maxlength="14" autocomplete="off" spellcheck="false" placeholder="Ej: Bolsín" value="${esc(Store.apodo())}">
      <p class="msg" id="apodo-msg"></p>
      <div class="row"><button class="btn b-purple" data-a="dado">🎲 INVENTAR</button><button class="btn b-green" data-a="apodoOk">¡LISTO!</button></div>
      <p class="tiny">De 3 a 14 letras o números · Solo apodos · Sin chat</p></div></div>`,

    suite: () => {
      const pend = Prog.pendientes();
      return `<div class="scr bg-suite">${top()}
      <h1 class="title suite-title">THE MAN OF THE BAG</h1>
      <div class="cards">
        <button class="card c-go" data-a="go" data-to="mapa"><span class="em">🐐</span><b>ESCAPE DE LAS CABRAS</b><small>50 niveles · en vivo</small></button>
        <button class="card c-go2" data-a="carrera"><span class="em">🧪</span><b>CARRERA TÓXICA</b><small>¡Nuevo!</small></button>
        <button class="card c-soon" data-a="pronto" data-n="Raise The Man of the Bag"><span class="em">🍼</span><b>RAISE TMB</b><small>Muy pronto</small></button>
        <button class="card c-soon" data-a="pronto" data-n="Música de TMB"><span class="em">🎹</span><b>MÚSICA DE TMB</b><small>Muy pronto</small></button>
      </div>
      <div class="dock">
        <button class="btn b-blue" data-a="go" data-to="vestidor">🎽 Vestidor</button>
        <button class="btn b-yellow" data-a="go" data-to="premios">🎁 Premios${pend ? `<span class="badge">${pend}</span>` : ""}</button>
        <button class="btn b-purple" data-a="go" data-to="vitrina">🏅 Vitrina</button>
        <button class="btn b-green" data-a="rank" data-b="total" data-back="suite">🏆 Ranking</button>
      </div><p class="yt">YouTube: @the_man_of_the_bag</p></div>`;
    },

    mapa: (p) => {
      const w = p.w || Store.get("ult_mundo", 1), d = p.d || 1, WD = D.WORLDS[w - 1];
      const tabs = D.WORLDS.map((x) => `<button class="wtab ${x.id === w ? "on" : ""} ${Prog.worldOpen(x.id) ? "" : "lock"}" data-a="mundo" data-w="${x.id}">${Prog.worldOpen(x.id) ? x.emoji : "🔒"}</button>`).join("");
      const dt = [1, 2, 3].map((x) => `<button class="dtab d${x} ${x === d ? "on" : ""}" data-a="dif" data-w="${w}" data-d="${x}">${["", "Normal", "Difícil", "☠️ Tóxico"][x]}</button>`).join("");
      let lv = "";
      for (let n = 1; n <= 10; n++) {
        const L = D.level(w, n, d), s = Prog.lvGet(L.id).stars, open = Prog.unlocked(w, n, d);
        lv += `<button class="lvl ${open ? "" : "lock"} ${s ? "done" : ""} ${n === 10 ? "boss" : ""}" ${open ? `data-a="nivel" data-w="${w}" data-n="${n}" data-d="${d}"` : ""}>
          <b>${open ? (n === 10 ? "🐐" : n) : "🔒"}</b><span class="st">${open ? starStr(s) : ""}</span></button>`;
      }
      const inf = Prog.passed(w, 10, 1);
      return `<div class="scr" style="background:linear-gradient(${WD.sky[0]},${WD.sky[1]})">
        <img src="img/m${w}_mid.png" style="position:absolute;inset:0;width:100%;opacity:.45"><img src="img/m${w}_near.png" style="position:absolute;inset:0;width:100%;opacity:.5">
        ${back("suite")}<div class="wtabs">${tabs}</div>${top()}
        <div style="position:relative;text-align:center"><h1 class="title wname">${WD.emoji} ${WD.name}</h1>
        <p class="title t-sm white">⭐ ${Prog.worldStars(w)} / 30</p>
        <div class="dtabs">${dt}</div><div class="levels">${lv}</div></div>
        <div class="sidebtns">
          <button class="btn b-purple ${inf ? "" : "off"}" data-a="infinito" data-w="${w}">∞ Infinito${inf ? "" : "<small>Pasa el nivel 10</small>"}</button>
          <button class="btn b-red" data-a="go" data-to="vivo">🏁 En vivo</button>
        </div></div>`;
    },

    nivel: (p) => {
      const L = D.level(p.w, p.n, p.d), WD = D.WORLDS[p.w - 1], s = Prog.lvGet(L.id);
      return `<div class="scr" style="background:linear-gradient(${WD.sky[0]},${WD.sky[1]})">
        <img src="img/m${p.w}_mid.png" style="position:absolute;inset:0;width:100%;opacity:.5">
        ${back("mapa", `data-w="${p.w}" data-d="${p.d}"`)}${top()}
        <div style="position:absolute;left:60px;top:110px;width:420px;text-align:center">
          <canvas class="prev" id="prev" width="300" height="360" style="width:300px;height:360px"></canvas>
          <button class="btn b-blue" data-a="vestir" data-back="nivel">🎽 Cambiar</button></div>
        <div style="position:absolute;left:520px;right:60px;top:110px;text-align:center">
          <h1 class="title">${WD.emoji} ${WD.name}</h1>
          <p class="title t-mid white">Nivel ${p.n}${p.n === 10 ? " · 🐐 CABRA JEFA" : ""} · ${D.DIFS[p.d].name}</p>
          <div class="goals">
            <div class="goal"><span class="s">${s.stars >= 1 ? "⭐" : "☆"}</span>🏁 ${L.meta} m</div>
            <div class="goal"><span class="s">${s.stars >= 2 ? "⭐" : "☆"}</span>💧 ${L.gotasMeta}</div>
            <div class="goal"><span class="s">${s.stars >= 3 ? "⭐" : "☆"}</span>🛡️ 0 golpes</div>
          </div>
          <p class="title t-sm white">Mejor: ${s.best} pts</p><br>
          <button class="btn b-green b-big pulse" data-a="jugarNivel" data-w="${p.w}" data-n="${p.n}" data-d="${p.d}">JUGAR</button>
        </div></div>`;
    },

    resultado: (r) => {
      const t = r.vivo ? (r.lugar === 1 ? "¡GANASTE!" : `#${r.lugar}`) : r.win ? "¡NIVEL SUPERADO!" : r.carrera ? "¡AAAAAH!" : "¡TE ATRAPARON!";
      const s = r.stars || 0;
      const stars = r.nivel ? `<div class="stars3">${[1, 2, 3].map((i) => `<span class="${i <= s ? "on" : ""}">⭐</span>`).join("")}</div>` : "";
      const nextOk = r.win && r.nivel && r.L.n < 10 && Prog.unlocked(r.L.w, r.L.n + 1, r.L.d);
      const btns = r.vivo ? `<button class="btn b-green" data-a="go" data-to="vivo">🏁 SALA</button><button class="btn b-gray" data-a="go" data-to="mapa">MAPA</button>`
        : `<button class="btn b-green" data-a="otra">↻ OTRA VEZ</button>
           ${nextOk ? `<button class="btn b-yellow" data-a="jugarNivel" data-w="${r.L.w}" data-n="${r.L.n + 1}" data-d="${r.L.d}">SIGUIENTE ➜</button>` : ""}
           <button class="btn b-blue" data-a="compartir">📤</button>
           <button class="btn b-gray" data-a="${r.carrera ? "carrera" : "volverMapa"}">${r.carrera ? "MENÚ" : "MAPA"}</button>`;
      return `<div class="scr dim"><div class="panel center" style="min-width:${r.carrera ? 640 : 760}px">
        <h2 class="title ${r.win || r.lugar === 1 ? "" : "red"}">${t}</h2>${stars}
        ${r.record ? `<p class="title t-sm" style="color:#ffd400">⭐ ¡NUEVO RÉCORD! ⭐</p>` : ""}
        <div class="stats"><div><span>${r.carrera ? "🧪" : "🏁"}</span><b>${r.metros} m</b></div><div><span>💧</span><b>+${r.gotas}</b></div>
          ${r.score ? `<div><span>⭐ pts</span><b>${r.score}</b></div>` : ""}</div>
        <p class="msg" id="o-world"></p><div class="row">${btns}</div></div></div>`;
    },

    vestidor: (p) => {
      const slot = p.slot || "bolsa", e = Prog.eq();
      const tabs = D.SLOTS.map(([k, n]) => `<button class="dtab ${k === slot ? "on" : ""}" data-a="slot" data-s="${k}">${n}</button>`).join("");
      let items = slot === "bolsa" ? "" : `<button class="item ${!e[slot] ? "on" : ""}" data-a="equip" data-s="${slot}" data-id=""><span class="em">🚫</span><b>Ninguno</b></button>`;
      for (const it of D.ITEMS.filter((i) => i.slot === slot)) {
        const has = Prog.has(it.id), on = e[slot] === it.id;
        const st = on ? "✔ Puesto" : has ? "Usar" : it.price ? (it.price.g ? `💧 ${it.price.g}` : `💎 ${it.price.d}`) : "🔒 Premio";
        items += `<button class="item ${on ? "on" : ""} ${has ? "" : "lock"} ${it.legend ? "legend" : ""}" data-a="equip" data-s="${slot}" data-id="${it.id}">
          <span class="em">${it.emoji}</span><b>${it.name}</b><small>${st}</small></button>`;
      }
      return `<div class="scr bg-dark">${back(p.back || "suite")}${top()}
        <div class="vest"><div class="vest-left"><h1 class="title" style="margin-top:60px">VESTIDOR</h1>
          <canvas class="prev" id="prev" width="340" height="420" style="width:340px;height:420px"></canvas>
          <p class="tiny">Se usa en todos los juegos de la suite</p></div>
        <div class="vest-right"><div class="dtabs">${tabs}</div><div class="items">${items}</div><p class="msg" id="v-msg"></p></div></div></div>`;
    },

    premios: () => {
      const c = Prog.cofre(), m = Prog.misiones();
      let days = "";
      for (let d = 1; d <= 7; d++) {
        const pr = Prog.premioDia(d), cls = c.disponible ? (d < c.dia ? "past" : d === c.dia ? "now" : "") : d <= c.racha ? "past" : "";
        days += `<div class="day ${cls}"><span class="em">${d === 7 ? "💎" : "🎁"}</span>Día ${d}<span>💧${pr.g}${pr.d ? " 💎" + pr.d : ""}</span></div>`;
      }
      const mis = m.list.map((it, i) => {
        const t = D.MISSIONS.find((x) => x.id === it.id);
        return `<div class="mis"><span class="em">${t.emoji}</span><div class="grow">${t.name.replace("{n}", it.n)}<div class="bar"><i style="width:${(it.prog / it.n) * 100}%"></i></div></div>
          ${it.claimed ? "✔" : it.done ? `<button class="btn b-yellow pulse" data-a="cobrar" data-i="${i}">💧 ${t.r}</button>` : `<b>${it.prog}/${it.n}</b>`}</div>`;
      }).join("");
      return `<div class="scr bg-dark">${back("suite")}${top()}
        <div style="position:absolute;left:80px;right:80px;top:96px;text-align:center">
        <h2 class="title t-mid">🎁 COFRE DIARIO</h2><div class="days">${days}</div>
        ${c.disponible ? `<button class="btn b-green pulse" data-a="cofre">¡ABRIR COFRE!</button>` : `<p class="hint">Vuelve mañana por el siguiente 🎁</p>`}
        <h2 class="title t-mid" style="margin-top:20px">📋 MISIONES DE HOY</h2><div style="max-width:820px;margin:0 auto">${mis}</div></div></div>`;
    },

    vitrina: () => {
      const tr = Prog.trofeos(), have = Prog.medallas();
      const BN = { total: "⭐ Niveles", carrera: "🧪 Caída", inf_1: "∞ 🌾", inf_2: "∞ 🏘️", inf_3: "∞ 🗑️", inf_4: "∞ 🏭", inf_5: "∞ 🧪" };
      const tro = Object.keys(tr).length ? Object.entries(tr).map(([b, v]) => `<div class="trof"><img src="img/trofeo_${["", "oro", "plata", "bronce"][v.lugar]}.png">${BN[b] || b}</div>`).join("")
        : `<p class="hint">Entra al top 3 mundial para ganar la Bolsa de Oro, Plata o Bronce 🏆</p>`;
      const meds = D.MEDALS.map((m) => `<div class="med ${have.includes(m.id) ? "" : "lock"}"><span class="em">${m.emoji}</span>${m.name}</div>`).join("");
      return `<div class="scr bg-dark">${back("suite")}${top()}
        <div style="position:absolute;left:60px;right:60px;top:90px;text-align:center">
        <h2 class="title t-mid">🏆 TROFEOS</h2><div class="trofs">${tro}</div>
        <h2 class="title t-mid">🏅 MEDALLAS ${have.length}/${D.MEDALS.length}</h2><div class="meds" style="margin-top:12px">${meds}</div></div></div>`;
    },

    ranking: (p) => {
      const B = [["total", "⭐ Niveles"], ...D.WORLDS.map((w) => [`escape_inf_${w.id}`, `∞ ${w.emoji}`]), ["carrera_toxica", "🧪 Caída"]];
      const tabs = B.map(([b, n]) => `<button class="dtab ${b === p.b ? "on" : ""}" data-a="rank" data-b="${b}" data-back="${p.back || "suite"}">${n}</button>`).join("");
      return `<div class="scr bg-dark">${back(p.back || "suite")}
        <h1 class="title" style="margin-top:22px">🏆 RANKING MUNDIAL</h1><div class="rtabs">${tabs}</div>
        <div class="podio" id="podio"></div>
        <div class="rank-wrap"><ul class="rank-list" id="rl"></ul><p class="msg" id="rmsg" style="margin-top:40px">Cargando…</p></div>
        <div class="me-row" id="rme"></div></div>`;
    },

    carrera: () => `<div class="scr bg-tube" style="text-align:center">${back("suite")}
      <h1 class="title" style="font-size:100px;margin-top:110px">CARRERA</h1><h1 class="title green" style="font-size:100px">TÓXICA</h1>
      <canvas class="prev" id="prev" width="300" height="380" style="width:300px;height:380px;margin-top:20px"></canvas>
      <div class="col" style="width:420px;margin:20px auto">
        <button class="btn b-green b-big pulse" data-a="jugarCarrera">JUGAR</button>
        <div class="row"><button class="btn b-yellow" data-a="rank" data-b="carrera_toxica" data-back="carrera">🏆</button>
        <button class="btn b-blue" data-a="vestir" data-back="carrera">🎽</button></div></div>
      <p class="title t-sm white">Récord: ${Store.best("carrera_toxica")} m</p></div>`,

    vivo: (p) => {
      if (!Vivo.code) return `<div class="scr bg-dark" style="text-align:center">${back("mapa")}
        <h1 class="title" style="margin-top:60px">🏁 CARRERA EN VIVO</h1><p class="hint">De 2 a 6 amigos · Solo apodos · Sin chat</p>
        <button class="btn b-green b-big" data-a="crearSala" style="margin:20px">CREAR SALA</button>
        <p class="title t-sm white" style="margin:14px">o escribe el código de tu amigo:</p>
        <div class="row"><input class="inp" id="i-code" maxlength="10" placeholder="CABRA-1234"><button class="btn b-yellow" data-a="unirSala">UNIRME</button></div>
        <p class="msg" id="v-msg"></p></div>`;
      const pl = Vivo.players;
      let cards = pl.map((x) => `<div class="player"><img src="img/cabeza_${esc(x.skin || "clasica")}.png">${esc(x.apodo)}</div>`).join("");
      for (let i = pl.length; i < 6; i++) cards += `<div class="player empty">?</div>`;
      return `<div class="scr bg-dark" style="text-align:center"><button class="ibtn back" data-a="salirSala">⬅</button>
        <h1 class="title" style="margin-top:30px">🏁 CARRERA EN VIVO</h1><p class="hint">Comparte este código con tus amigos</p>
        <div class="code">${esc(Vivo.code)}</div><div class="players">${cards}</div>
        <p class="title t-sm green">${pl.length} / 6</p><br>
        ${Vivo.host ? `<button class="btn b-green b-big ${pl.length < 2 ? "off" : "pulse"}" data-a="empezarSala">¡EMPEZAR!</button>`
          : `<p class="hint">Esperando que el anfitrión empiece…</p>`}</div>`;
    },
  };

  // ---------- después de mostrar ----------
  function preview(pose, k = 1.5, feet = 400) {
    const cv = $("prev"); if (!cv) return;
    const c = cv.getContext("2d"), dpr = Math.min(2, (window.devicePixelRatio || 1) * scale);
    cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr;
    const t0 = performance.now();
    const loop = (ts) => {
      anim = requestAnimationFrame(loop);
      const t = (ts - t0) / 1000, e = Prog.eq();
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, cv.width, cv.height);
      const ps = typeof pose === "function" ? pose(t, e) : pose;
      c.fillStyle = "rgba(0,0,0,.25)"; c.beginPath(); c.ellipse(cv.clientWidth / 2, feet, 90, 14, 0, 0, 7); c.fill();
      const lift = e.vehiculo && (ps === "ride" || ps === "scoot") ? 14 * k : 0;
      Gfx.tmbFull(c, e, ps, cv.clientWidth / 2, feet - lift + Math.abs(Math.sin(t * 6)) * -4, k, t);
      if (lift) Gfx.vehiculo(c, e.vehiculo, cv.clientWidth / 2 + 4, feet, k);
    };
    anim = requestAnimationFrame(loop);
  }
  const runPose = (t, e) => (e.vehiculo ? (e.vehiculo === "scooter" ? "scoot" : "ride") : Math.floor(t * 2) % 4 === 3 ? "frun" : `run${Math.floor(t * 8) % 2}`);
  const AFTER = {
    apodo: () => setTimeout(() => $("i-apodo") && $("i-apodo").focus(), 200),
    nivel: () => preview(runPose, 1.3, 345),
    vestidor: () => preview(runPose, 1.6, 400),
    carrera: () => preview("fall", 1.4, 370),
    ranking: (p) => cargarRanking(p.b),
  };

  // ---------- acciones ----------
  const PAL1 = ["Bolsa", "Toxi", "Cabra", "Rayo", "Gota", "Mutante", "Eructo", "Papel", "Turbo", "Súper"];
  const PAL2 = ["Loca", "Veloz", "Verde", "Ninja", "Feliz", "Brava", "Pro", "Kid", "Rex", "Bolt"];
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const RE = /^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ _-]{3,14}$/;
  let ultimaPartida = null, vestBack = "suite", vestBackP = {};

  const ACT = {
    async start() {
      await Sfx.init(); await Gfx.load();
      pantallaCompleta(); Sfx.say("hola"); Net.sincronizar();
      show(Store.apodo() ? "suite" : "apodo");
    },
    go: (d) => {
      if (game) { stopGame(); overlay(""); }
      if (d.to === vestBack && cur.name === "vestidor" && d.to !== "suite") return show(d.to, vestBackP);
      if (d.to === "mapa") return show("mapa", { w: +d.w || Store.get("ult_mundo", 1), d: +d.d || 1 });
      if (d.to === "vestidor") { vestBack = "suite"; vestBackP = {}; }
      if (d.to === "vivo" && !Store.apodo()) return show("apodo");
      show(d.to, {});
    },
    pronto: (d) => toast(`¡${d.n} llega muy pronto!`),
    apodo: () => show("apodo"),
    dado: () => { $("i-apodo").value = pick(PAL1) + pick(PAL2) + Math.floor(Math.random() * 90 + 10); $("apodo-msg").textContent = ""; },
    async apodoOk() {
      const v = $("i-apodo").value.trim().replace(/\s+/g, " "), msg = $("apodo-msg");
      if (!RE.test(v)) { msg.textContent = "Usa de 3 a 14 letras o números."; Sfx.fx("falta"); return; }
      msg.textContent = "Revisando…";
      const r = await Net.registrar(v);
      const M = { apodo_ocupado: "Ese apodo ya lo tiene otro jugador. Prueba otro.", apodo_no_permitido: "Ese apodo no está permitido. Prueba otro.", apodo_invalido: "Usa de 3 a 14 letras o números." };
      if (M[r]) { msg.textContent = M[r]; Sfx.fx("falta"); return; }
      Store.set("apodo", v); if (r === "offline") toast("Sin internet: tu apodo se subirá después");
      Sfx.fx("tada"); show("suite");
    },
    ajustes: () => overlay(`<div class="scr dim"><div class="panel center"><h2 class="title">AJUSTES</h2><div class="col" style="margin-top:16px">
      <button class="btn b-blue" data-a="musica">🎵 Música: ${Sfx.musicOn ? "SÍ" : "NO"}</button>
      <button class="btn b-blue" data-a="sonidos">🔊 Sonidos: ${Sfx.sfxOn ? "SÍ" : "NO"}</button>
      <button class="btn b-purple" data-a="cerrarOv" data-then="apodo">👤 Cambiar apodo</button>
      <button class="btn b-yellow" data-a="tutorial">✋ Ver tutoriales otra vez</button>
      <button class="btn b-gray" data-a="cerrarOv">LISTO</button></div><p class="tiny">Versión 2.0</p></div></div>`),
    musica: () => { Sfx.setMusic(!Sfx.musicOn); ACT.ajustes(); },
    sonidos: () => { Sfx.setSfx(!Sfx.sfxOn); ACT.ajustes(); },
    tutorial: () => { Store.set("tut_escape", false); Store.set("tut_carrera", false); Store.set("hint_doble", false); toast("Los tutoriales saldrán otra vez"); },
    cerrarOv: (d) => { overlay(""); if (d.then === "apodo") show("apodo"); },

    // mapa y niveles
    mundo: (d) => { if (!Prog.worldOpen(+d.w)) { toast("🔒 Pasa el nivel 10 del mundo anterior"); return; } Store.set("ult_mundo", +d.w); show("mapa", { w: +d.w, d: 1 }); },
    dif: (d) => show("mapa", { w: +d.w, d: +d.d }),
    nivel: (d) => show("nivel", { w: +d.w, n: +d.n, d: +d.d }),
    jugarNivel: (d) => { overlay(""); jugarEscape(D.level(+d.w, +d.n, +d.d)); },
    infinito: (d) => { if (!Prog.passed(+d.w, 10, 1)) { toast("🔒 Pasa el nivel 10 de este mundo"); return; } jugarEscape(D.endless(+d.w)); },
    volverMapa: () => { overlay(""); stopGame(); show("mapa", { w: ultimaPartida ? ultimaPartida.w : 1, d: ultimaPartida ? ultimaPartida.d : 1 }); },
    otra: () => { overlay(""); Sfx.say("otra_vez"); if (ultimaPartida && ultimaPartida.carrera) jugarCarrera(); else jugarEscape(ultimaPartida); },
    compartir: async () => {
      const r = ultimaPartida && ultimaPartida.res;
      const text = r && r.carrera ? `¡Caí ${r.metros} m en la Carrera tóxica de The Man of the Bag! 🧪 ¿Me ganas?`
        : `¡Corrí ${r ? r.metros : 0} m escapando de las cabras en el juego de The Man of the Bag! 🐐💨 ¿Me ganas?`;
      const full = `${text} Canal de YouTube: @the_man_of_the_bag`, url = location.href.split("?")[0].split("#")[0];
      try { if (navigator.share) await navigator.share({ title: "The Man of the Bag", text: full, url }); else { await navigator.clipboard.writeText(`${full} ${url}`); toast("¡Mensaje copiado!"); } } catch (e) {}
    },

    // vestidor
    vestir: (d) => { vestBack = d.back; vestBackP = cur.p; show("vestidor", { back: d.back }); },
    slot: (d) => show("vestidor", { slot: d.s, back: cur.p.back }),
    equip: (d, el) => {
      const it = D.ITEMS.find((i) => i.id === d.id);
      if (!d.id) { Prog.equip(d.s, null); return show("vestidor", { slot: d.s, back: cur.p.back }); }
      if (Prog.has(it.id)) { Prog.equip(d.s, it.id); Sfx.fx("pop"); return show("vestidor", { slot: d.s, back: cur.p.back }); }
      if (!it.price) { $("v-msg").textContent = `🔒 ${it.premio}`; return; }
      if (el.dataset.ok !== "1") { el.dataset.ok = "1"; el.querySelector("small").textContent = "¿Comprar?"; return; }
      if (Prog.buy(it)) { Prog.equip(d.s, it.id); Sfx.fx("tada"); toast(`¡Tienes ${it.emoji} ${it.name}!`); show("vestidor", { slot: d.s, back: cur.p.back }); }
      else { Sfx.fx("falta"); $("v-msg").textContent = it.price.g ? "Te faltan gotas 💧 ¡sigue jugando!" : "Te faltan diamantes 💎"; }
    },

    // premios
    cofre: () => { const p = Prog.abrirCofre(); if (p) { Sfx.fx("cofre"); toast(`🎁 +💧${p.g}${p.d ? ` +💎${p.d}` : ""}`); medallas(); } show("premios"); },
    cobrar: (d) => { const r = Prog.cobrarMision(+d.i); if (r) { Sfx.fx("tada"); toast(`+💧${r}`); } show("premios"); },

    // ranking
    rank: (d) => show("ranking", { b: d.b, back: d.back || "suite" }),

    // carrera tóxica
    carrera: () => { overlay(""); stopGame(); setMode("v"); show("carrera"); },
    jugarCarrera: () => jugarCarrera(),

    // pausa
    seguir: () => { overlay(""); game && game.resume(); },
    salir: () => { overlay(""); const c = game === Carrera; stopGame(); if (c) ACT.carrera(); else show("mapa", { w: ultimaPartida.w, d: ultimaPartida.d || 1 }); },

    // en vivo
    crearSala: () => entrarSala(Vivo.nuevoCodigo()),
    unirSala: () => {
      let c = ($("i-code").value || "").trim().toUpperCase().replace(/\s+/g, "");
      if (/^\d{4}$/.test(c)) c = "CABRA-" + c;
      if (!/^CABRA-\d{4}$/.test(c)) { $("v-msg").textContent = "El código es como CABRA-1234"; return; }
      entrarSala(c);
    },
    salirSala: async () => { await Vivo.salir(); show("mapa", { w: 1 }); },
    empezarSala: () => { if (!Vivo.empezar()) toast("Se necesitan al menos 2 jugadores"); },
  };

  // ---------- partidas ----------
  function stopGame() { if (game) game.stop(); game = null; $("meme").classList.remove("on"); }
  function pausar() { if (!game || !game.isRunning()) return; game.pause(); overlay(`<div class="scr dim"><div class="panel center"><h2 class="title">PAUSA</h2>
    <div class="col" style="margin-top:16px"><button class="btn b-green" data-a="seguir">SEGUIR</button><button class="btn b-gray" data-a="salir">SALIR</button></div></div></div>`); }
  document.addEventListener("visibilitychange", () => { if (document.hidden && !(game === Escape && Vivo.code)) pausar(); });

  function jugarEscape(L, vivo) {
    stopGame(); setMode("h"); ui.innerHTML = ""; overlay(""); cancelAnimationFrame(anim);
    ultimaPartida = L; game = Escape;
    Escape.start({ L, tutorial: !vivo && !Store.get("tut_escape", false), onPause: pausar, onOver: (r) => finEscape(r, L, vivo), vivo: vivo && vivo.hooks, seed: vivo && vivo.seed });
  }
  function jugarCarrera() {
    stopGame(); setMode("v"); ui.innerHTML = ""; overlay(""); cancelAnimationFrame(anim);
    ultimaPartida = { carrera: true }; game = Carrera;
    Carrera.start({ onPause: pausar, onOver: finCarrera });
  }
  function meme(cb) { Sfx.fx("meme"); $("meme").classList.add("on"); setTimeout(() => { $("meme").classList.remove("on"); cb(); }, 1400); }

  async function finEscape(r, L, vivo) {
    Store.addGotas(r.gotas);
    if (vivo) {
      const lugar = Vivo.lugar();
      if (lugar === 1) { Prog.stat("vivoGanadas"); Sfx.fx("tada"); }
      const go = () => overlay(SCR.resultado({ vivo: true, lugar, metros: r.metros, gotas: r.gotas }));
      lugar === 1 ? go() : meme(go); medallas(); return;
    }
    const stars = r.win ? r.stars : 0, res = Object.assign({}, r, { stars, nivel: !L.endless, L });
    ultimaPartida.res = res;
    if (!L.endless && r.win) {
      const s = Prog.lvSave(L.id, r.score, stars); res.record = s.mejoro;
      if (L.n === 10 && L.d === 1) { Prog.stat("mundos", L.w, true); if (L.w === 1 && Prog.give("patineta")) setTimeout(() => toast("🛹 ¡Ganaste la PATINETA! Úsala en el Vestidor"), 2500); }
    }
    if (L.endless) { const b = `escape_inf_${L.w}`; res.record = r.metros > Store.best(b); if (res.record) Store.setBest(b, r.metros); }
    const go = () => { overlay(SCR.resultado(res)); if (res.record) setTimeout(() => Sfx.say("record"), 500); subir(res, L); };
    r.win ? go() : meme(go);
    medallas();
  }
  async function finCarrera(r) {
    Store.addGotas(r.gotas);
    const res = { carrera: true, metros: r.metros, gotas: r.gotas, record: r.metros > Store.best("carrera_toxica") };
    if (res.record) Store.setBest("carrera_toxica", r.metros);
    ultimaPartida.res = res;
    meme(() => { overlay(SCR.resultado(res)); subirJuego("carrera_toxica", r.metros, "carrera"); });
    medallas();
  }
  async function subir(res, L) {
    if (!Store.apodo()) return;
    const w = $("o-world");
    if (L.endless) return subirJuego(`escape_inf_${L.w}`, res.metros, `inf_${L.w}`);
    if (!res.win) return;
    if (w) w.textContent = "Subiendo al ranking mundial…";
    const t = await Net.enviarNivel(L.id, res.score, res.stars);
    if (!$("o-world")) return;
    if (t && t.ok) { $("o-world").textContent = `🌎 Puesto mundial: #${t.posicion} · ${t.total} pts`; trofeo("total", t.posicion); }
    else $("o-world").textContent = "Sin internet: se subirá después 📶";
  }
  async function subirJuego(juego, metros, tablero) {
    if (!Store.apodo() || metros <= 0) return;
    if ($("o-world")) $("o-world").textContent = "Subiendo al ranking mundial…";
    const r = await Net.enviar(juego, metros);
    if (!$("o-world")) return;
    if (r && r.ok) { $("o-world").textContent = `🌎 Puesto mundial: #${r.posicion} (tu mejor: ${r.mejor} m)`; trofeo(tablero, r.posicion); }
    else $("o-world").textContent = "Sin internet: se subirá después 📶";
  }
  function trofeo(tablero, lugar) {
    const l = Prog.darTrofeo(tablero, lugar); if (!l) return;
    const met = ["", "oro", "plata", "bronce"][l], e = Prog.eq();
    const conf = Array.from({ length: 40 }, (_, i) => `<i style="left:${(i * 37) % 100}%;background:${["#ff5d73", "#7dff3a", "#ffd23f", "#7fb3e6", "#b9a0f0"][i % 5]};animation-duration:${2 + (i % 5) * 0.4}s;animation-delay:${(i % 7) * 0.2}s"></i>`).join("");
    setTimeout(() => {
      Sfx.fx("cofre"); setTimeout(() => Sfx.say("record"), 600);
      overlay(`<div class="scr" style="background:#2b145a"><div class="rays"></div><div class="confetti">${conf}</div>
        <h1 class="title" style="position:relative;margin-top:30px;font-size:72px">${l === 1 ? "¡RÉCORD MUNDIAL!" : "¡TOP 3 MUNDIAL!"}</h1>
        <p class="title t-sm white" style="position:relative">${esc(Store.apodo())}</p>
        <div class="row" style="position:relative;margin-top:20px;align-items:flex-end"><img src="img/t_${e.bolsa}_flail.png" style="height:380px">
        <img src="img/trofeo_${met}.png" style="height:380px"></div>
        <div style="position:relative;text-align:center;margin-top:16px"><button class="btn b-green" data-a="cerrarTrofeo">¡GENIAL!</button></div></div>`);
    }, 1800);
  }
  ACT.cerrarTrofeo = () => { overlay(SCR.resultado(ultimaPartida.res || {})); medallas(); };

  // ---------- ranking ----------
  async function cargarRanking(b) {
    const msg = $("rmsg"), list = $("rl"), me = $("rme"), pod = $("podio");
    await Net.sincronizar();
    try {
      const rows = await Net.ranking(b);
      if (cur.name !== "ranking") return;
      const yo = Store.apodo().toLowerCase(), u = b === "total" ? "pts" : "m";
      msg.textContent = rows.length ? "" : "¡Todavía nadie! Sé el primero 🏁";
      const met = ["oro", "plata", "bronce"];
      pod.innerHTML = [1, 0, 2].map((i) => rows[i] ? `<div class="pod p${i + 1}"><img src="img/trofeo_${met[i]}.png"><div class="ap">${esc(rows[i].apodo)}</div><div class="base">${rows[i].mejor} ${u}</div></div>` : `<div class="pod"></div>`).join("");
      list.innerHTML = rows.slice(3).map((r) => `<li class="${r.apodo.toLowerCase() === yo ? "yo" : ""}"><span class="pos">#${r.posicion}</span><span class="ap">${esc(r.apodo)}</span><span class="m">${r.mejor} ${u}</span></li>`).join("");
      const mio = await Net.mio(b);
      if (cur.name === "ranking") me.textContent = mio ? `Tú (${mio.apodo}): #${mio.posicion} · ${mio.mejor} ${u}` : "Juega para entrar al ranking";
    } catch (e) {
      msg.textContent = "Sin conexión. Revisa tu internet 📶";
      me.textContent = b === "total" ? `Tu total en este dispositivo: ${Prog.totalLocal()} pts` : "";
    }
  }

  // ---------- sala en vivo ----------
  async function entrarSala(code) {
    const m = $("v-msg"); if (m) m.textContent = "Conectando…";
    try {
      await Vivo.unir(code, {
        onPlayers: () => { if (cur.name === "vivo" && !game) show("vivo"); },
        onStart: (seed, delay) => {
          let n = 3; Sfx.fx("click");
          const tick = () => {
            overlay(`<div class="scr dim"><div class="center title count">${n}</div></div>`); Sfx.fx("salto");
            if (--n > 0) setTimeout(tick, delay / 3); else setTimeout(() => { overlay(""); jugarEscape(D.vivoCfg(), { hooks: Vivo.hooks(), seed }); }, delay / 3);
          };
          tick();
        },
        onFx: (fx, from) => toast(`${{ cabra: "🐐", nube: "☁️", platano: "🍌" }[fx]} ¡${from} te lanzó algo!`),
      });
      show("vivo");
    } catch (e) { if ($("v-msg")) $("v-msg").textContent = "No se pudo conectar. Revisa tu internet 📶"; }
  }

  function pantallaCompleta() {
    if (!matchMedia("(pointer: coarse)").matches) return;
    const el = document.documentElement;
    try { const p = el.requestFullscreen && el.requestFullscreen(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
  }

  // ---------- arranque ----------
  $("ui").addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Enter" && e.target.id === "i-apodo") ACT.apodoOk();
    if (e.key === "Enter" && e.target.id === "i-code") ACT.unirSala();
  });
  fit(); show("splash");
  Gfx.load().then(() => { const l = $("load"); if (l) l.textContent = ""; });
  if ("serviceWorker" in navigator && location.protocol !== "file:") addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  window._tmb = { show, ACT, jugarEscape, jugarCarrera, setMode };  // para pruebas
})();
