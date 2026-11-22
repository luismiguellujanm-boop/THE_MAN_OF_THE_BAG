// ===== CARRERA EN VIVO: salas con código (Supabase Realtime) =====
// Solo apodos, sin chat. Cada jugador envía su distancia 5 veces por segundo.
// Para probar sin internet: abrir el juego con ?local=1 en dos pestañas (usa BroadcastChannel).
(function () {
  const V = { code: null, players: [], host: false };
  let tr = null, me = null, race = null, h = {};
  const LOCAL = /[?&]local=1/.test(location.search);

  function codigo() { return "CABRA-" + Math.floor(1000 + Math.random() * 9000); }
  V.nuevoCodigo = codigo;

  async function loadSb() {
    if (window.supabase && window.supabase.createClient) return;
    await new Promise((ok, no) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
      s.onload = ok; s.onerror = () => no(new Error("sin_internet")); document.head.appendChild(s);
    });
  }
  let sbClient = null;
  async function transSupabase(code, meta, onPresence, onMsg) {
    await loadSb();
    const C = window.TMB_CONFIG;
    sbClient = sbClient || window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_KEY);
    const ch = sbClient.channel("tmb-" + code, { config: { broadcast: { self: false }, presence: { key: meta.id } } });
    ch.on("presence", { event: "sync" }, () => {
      const st = ch.presenceState(), list = [];
      for (const key of Object.keys(st)) if (st[key][0]) list.push(st[key][0]);
      onPresence(list);
    });
    ch.on("broadcast", { event: "m" }, ({ payload }) => onMsg(payload));
    await new Promise((ok, no) => {
      const tm = setTimeout(() => no(new Error("sin_conexion")), 10000);
      ch.subscribe(async (status) => {
        if (status === "SUBSCRIBED") { clearTimeout(tm); await ch.track(meta); ok(); }
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") { clearTimeout(tm); no(new Error("sin_conexion")); }
      });
    });
    return { send: (p) => ch.send({ type: "broadcast", event: "m", payload: p }), close: () => sbClient.removeChannel(ch), update: (m) => ch.track(m) };
  }
  function transLocal(code, meta, onPresence, onMsg) {
    const bc = new BroadcastChannel("tmb-" + code), peers = new Map();
    let mine = meta;
    const emit = () => onPresence([mine, ...[...peers.values()].map((p) => p.meta)]);
    bc.onmessage = (e) => {
      const m = e.data;
      if (m.k === "hello" || m.k === "here" || m.k === "beat") {
        const isNew = !peers.has(m.meta.id); peers.set(m.meta.id, { meta: m.meta, seen: Date.now() });
        if (m.k === "hello") bc.postMessage({ k: "here", meta: mine });
        if (isNew || m.k !== "beat") emit();
      } else if (m.k === "bye") { peers.delete(m.id); emit(); }
      else if (m.k === "m") onMsg(m.p);
    };
    bc.postMessage({ k: "hello", meta: mine });
    const iv = setInterval(() => {
      bc.postMessage({ k: "beat", meta: mine });
      let ch = false; for (const [id, p] of peers) if (Date.now() - p.seen > 4000) { peers.delete(id); ch = true; }
      if (ch) emit();
    }, 1000);
    setTimeout(emit, 50);
    return Promise.resolve({ send: (p) => bc.postMessage({ k: "m", p }), close: () => { bc.postMessage({ k: "bye", id: mine.id }); clearInterval(iv); bc.close(); },
      update: (m) => { mine = m; bc.postMessage({ k: "here", meta: mine }); } });
  }

  // ---------- sala ----------
  V.unir = async function (code, handlers) {
    await V.salir();
    h = handlers || {};
    me = { id: Store.device() + (LOCAL ? "-" + Math.floor(Math.random() * 1e4) : ""), apodo: Store.apodo(), skin: Prog.eq().bolsa, joined: Date.now() };
    V.code = code; race = null;
    const onPresence = (list) => {
      const seen = new Set(); V.players = list.filter((p) => p && !seen.has(p.id) && seen.add(p.id)).sort((a, b) => a.joined - b.joined).slice(0, 6);
      V.host = V.players.length > 0 && V.players[0].id === me.id;
      if (race) for (const id of Object.keys(race.others)) if (!V.players.some((p) => p.id === id) && !race.others[id].out) { race.others[id].out = true; checkWin(); }
      h.onPlayers && h.onPlayers(V.players, V.host);
    };
    tr = await (LOCAL ? transLocal : transSupabase)(code, me, onPresence, onMsg);
    return true;
  };
  V.salir = async function () { if (tr) { try { await tr.close(); } catch (e) {} } tr = null; race = null; V.code = null; V.players = []; };
  V.empezar = function () {
    if (!V.host || V.players.length < 2) return false;
    const msg = { t: "start", seed: Math.floor(Math.random() * 1e9), ids: V.players.map((p) => p.id), delay: 3200 };
    tr.send(msg); onMsg(msg); return true;
  };
  V.yo = () => me;

  function onMsg(m) {
    if (!m || !m.t) return;
    if (m.t === "start") {
      race = { others: {}, mine: { d: 0, out: false } };
      for (const p of V.players) if (p.id !== me.id && m.ids.includes(p.id)) race.others[p.id] = { apodo: p.apodo, skin: p.skin, d: 0, out: false };
      h.onStart && h.onStart(m.seed, m.delay);
      return;
    }
    if (!race) return;
    const o = race.others[m.id];
    if (m.t === "pos" && o) { o.d = m.d; if (m.out) o.out = true; }
    if (m.t === "out" && o) { o.out = true; o.d = m.d; checkWin(); }
    if (m.t === "fx" && m.to === me.id) { Escape.recibir(m.fx); h.onFx && h.onFx(m.fx, m.from); }
  }
  function checkWin() {
    if (!race || race.mine.out || race.ended) return;
    const others = Object.values(race.others);
    if (others.length && others.every((o) => o.out)) { race.ended = true; race.lugar = 1; Escape.vivoGanar(); }
  }

  // ---------- ganchos para el juego ----------
  V.hooks = function () {
    return {
      pos(d, out) { if (!race) return; race.mine.d = d; tr && tr.send({ t: "pos", id: me.id, d, out }); },
      fuera(d) {
        if (!race || race.mine.out) return;
        race.mine.out = true; race.mine.d = d;
        race.lugar = 1 + Object.values(race.others).filter((o) => !o.out).length;
        tr && tr.send({ t: "out", id: me.id, d });
      },
      lanzar(fx) {
        if (!race) return;
        const vivos = Object.entries(race.others).filter(([, o]) => !o.out);
        if (!vivos.length) return;
        let target;
        if (fx === "cabra") target = vivos.sort((a, b) => b[1].d - a[1].d)[0];
        else if (fx === "platano") target = vivos.filter(([, o]) => o.d >= race.mine.d).sort((a, b) => a[1].d - b[1].d)[0] || vivos[0];
        else target = vivos[Math.floor(Math.random() * vivos.length)];
        tr && tr.send({ t: "fx", to: target[0], fx, from: me.apodo });
      },
      rivales() { return race ? Object.values(race.others) : []; },
    };
  };
  V.lugar = () => (race ? race.lugar || 1 : 1);
  V.total = () => (race ? 1 + Object.keys(race.others).length : 1);
  // posición actual entre los que siguen vivos (para las cajas sorpresa)
  Escape.vivoLugar = () => (race ? 1 + Object.values(race.others).filter((o) => !o.out && o.d > race.mine.d).length : 1);
  Escape.vivoTotal = () => (race ? 1 + Object.values(race.others).filter((o) => !o.out).length : 1);

  window.Vivo = V;
})();
