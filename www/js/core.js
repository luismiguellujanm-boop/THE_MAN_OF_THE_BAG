// ===== Guardado local, progreso, recompensas y conexión con Supabase =====
(function () {
  const K = (k) => "tmb_" + k;
  const get = (k, d) => { try { const v = localStorage.getItem(K(k)); return v === null ? d : JSON.parse(v); } catch (e) { return d; } };
  const set = (k, v) => { try { localStorage.setItem(K(k), JSON.stringify(v)); } catch (e) {} };
  function uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    const b = crypto.getRandomValues(new Uint8Array(16)); b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }
  const hoy = (off = 0) => { const d = new Date(Date.now() + off * 864e5); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };

  const Store = {
    get, set, hoy,
    device() { let d = get("device", null); if (!d) { d = uuid(); set("device", d); } return d; },
    apodo: () => get("apodo", ""),
    gotas: () => get("gotas", 0),
    diamantes: () => get("diamantes", 0),
    addGotas(n) { set("gotas", Math.max(0, get("gotas", 0) + n)); },
    addDiamantes(n) { set("diamantes", Math.max(0, get("diamantes", 0) + n)); },
    best: (j) => get("best_" + j, 0),
    setBest(j, v) { set("best_" + j, v); },
  };

  // ---------- Progreso, inventario y recompensas ----------
  const Prog = {
    // niveles: { "m1n01d1": {best, stars} }
    lv: () => get("niveles", {}),
    lvGet(id) { return Prog.lv()[id] || { best: 0, stars: 0 }; },
    lvSave(id, best, stars) {
      const all = Prog.lv(), cur = all[id] || { best: 0, stars: 0 };
      const nuevo = { best: Math.max(cur.best, best), stars: Math.max(cur.stars, stars) };
      const ganadas = nuevo.stars - cur.stars;
      all[id] = nuevo; set("niveles", all);
      if (ganadas > 0) { Prog.stat("estrellas", ganadas); Prog.ev("estrella", ganadas); }
      return { mejoro: best > cur.best, ganadas };
    },
    passed: (w, n, d) => Prog.lvGet(`m${w}n${String(n).padStart(2, "0")}d${d}`).stars > 0,
    unlocked(w, n, d) {
      if (w > 1 && !Prog.passed(w - 1, 10, 1)) return false;
      if (d === 1) return n === 1 || Prog.passed(w, n - 1, 1);
      return Prog.passed(w, n, d - 1);
    },
    worldOpen: (w) => w === 1 || Prog.passed(w - 1, 10, 1),
    worldStars(w) { let s = 0; for (let n = 1; n <= 10; n++) for (let d = 1; d <= 3; d++) s += Prog.lvGet(`m${w}n${String(n).padStart(2, "0")}d${d}`).stars; return s; },
    totalLocal() { return Object.values(Prog.lv()).reduce((a, b) => a + b.best, 0); },

    // estadísticas para medallas
    stats: () => get("stats", {}),
    stat(k, n = 1, max = false) {
      const s = Prog.stats(); s[k] = max ? Math.max(s[k] || 0, n) : (s[k] || 0) + n; set("stats", s);
    },

    // inventario y vestidor
    owned: () => get("inventario", ["clasica"]),
    has: (id) => Prog.owned().includes(id) || (DATA.ITEMS.find((i) => i.id === id) || {}).free,
    give(id) { const o = Prog.owned(); if (!o.includes(id)) { o.push(id); set("inventario", o); return true; } return false; },
    eq: () => Object.assign({ bolsa: "clasica", cabeza: null, espalda: null, vehiculo: null, estela: null }, get("vestido", {})),
    equip(slot, id) { const e = Prog.eq(); e[slot] = id; set("vestido", e); },
    buy(item) {
      if (Prog.has(item.id) || !item.price) return false;
      if (item.price.g && Store.gotas() >= item.price.g) { Store.addGotas(-item.price.g); Prog.give(item.id); return true; }
      if (item.price.d && Store.diamantes() >= item.price.d) { Store.addDiamantes(-item.price.d); Prog.give(item.id); return true; }
      return false;
    },

    // cofre diario con racha (si faltas, baja un poco)
    cofre() {
      const c = get("cofre", { last: null, racha: 0 });
      const disponible = c.last !== hoy();
      let racha = c.racha;
      if (disponible) racha = c.last === hoy(-1) ? (c.racha % 7) + 1 : c.last ? Math.max(1, c.racha - 2) : 1;
      return { disponible, dia: racha, racha: c.racha };
    },
    premioDia: (d) => (d === 7 ? { g: 150, d: 1 } : { g: 20 * d }),
    abrirCofre() {
      const c = Prog.cofre(); if (!c.disponible) return null;
      const p = Prog.premioDia(c.dia);
      Store.addGotas(p.g || 0); Store.addDiamantes(p.d || 0);
      set("cofre", { last: hoy(), racha: c.dia }); Prog.stat("rachaMax", c.dia, true);
      return p;
    },

    // misiones del día
    misiones() {
      const day = hoy(); let m = get("misiones", null);
      if (!m || m.day !== day) {
        let seed = [...day].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
        const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
        const pool = DATA.MISSIONS.slice(), list = [];
        while (list.length < 3) {
          const t = pool.splice(Math.floor(rnd() * pool.length), 1)[0];
          list.push({ id: t.id, n: t.n[Math.floor(rnd() * t.n.length)], prog: 0, done: false, claimed: false });
        }
        m = { day, list }; set("misiones", m);
      }
      return m;
    },
    ev(evName, n = 1) {
      const m = Prog.misiones(); let changed = false;
      for (const it of m.list) {
        const t = DATA.MISSIONS.find((x) => x.id === it.id);
        if (t.ev !== evName || it.done) continue;
        it.prog = t.max ? Math.max(it.prog, n) : it.prog + n;
        if (it.prog >= it.n) { it.prog = it.n; it.done = true; }
        changed = true;
      }
      if (changed) set("misiones", m);
    },
    cobrarMision(i) {
      const m = Prog.misiones(), it = m.list[i];
      if (!it || !it.done || it.claimed) return 0;
      const r = DATA.MISSIONS.find((x) => x.id === it.id).r;
      it.claimed = true; set("misiones", m); Store.addGotas(r); return r;
    },
    pendientes() {
      const m = Prog.misiones().list.filter((x) => x.done && !x.claimed).length;
      return m + (Prog.cofre().disponible ? 1 : 0);
    },

    // medallas: devuelve las nuevas
    medallas: () => get("medallas", []),
    revisarMedallas() {
      const s = Prog.stats(), have = Prog.medallas(), nuevas = [];
      for (const md of DATA.MEDALS) {
        if (!have.includes(md.id) && md.test(s)) {
          have.push(md.id); nuevas.push(md);
          Store.addGotas(md.r.g || 0); Store.addDiamantes(md.r.d || 0);
        }
      }
      if (nuevas.length) set("medallas", have);
      return nuevas;
    },

    // trofeos del top 3: { tablero: {lugar, fecha} }
    trofeos: () => get("trofeos", {}),
    darTrofeo(tablero, lugar) {
      if (lugar < 1 || lugar > 3) return null;
      const t = Prog.trofeos(), prev = t[tablero];
      if (prev && prev.lugar <= lugar) return null;
      t[tablero] = { lugar, fecha: hoy() }; set("trofeos", t);
      Prog.stat("trofeos", Object.keys(t).length, true);
      Prog.give("corona");
      return lugar;
    },
  };

  // ---------- Supabase ----------
  const C = window.TMB_CONFIG || {};
  const online = () => !!(C.SUPABASE_URL && C.SUPABASE_KEY) && navigator.onLine !== false;
  async function rpc(fn, body) {
    if (!online()) throw new Error("offline");
    const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 8000);
    try {
      const r = await fetch(`${C.SUPABASE_URL}/rest/v1/rpc/${fn}`, {
        method: "POST", signal: ctl.signal,
        headers: { apikey: C.SUPABASE_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error("http " + r.status);
      return await r.json();
    } finally { clearTimeout(tm); }
  }
  const Net = {
    async registrar(apodo) {
      try { const r = await rpc("registrar_apodo", { p_device: Store.device(), p_apodo: apodo }); if (r === "ok") set("apodo_subido", apodo); return r; }
      catch (e) { return "offline"; }
    },
    async asegurarApodo() {
      const a = Store.apodo(); if (!a) return false;
      if (get("apodo_subido", "") === a) return true;
      return (await Net.registrar(a)) === "ok";
    },
    // pendientes: { juego: puntaje } y niveles { id: [puntaje, estrellas] }
    async enviar(juego, puntaje) {
      const p = get("pendientes", {}); p[juego] = Math.max(p[juego] || 0, puntaje); set("pendientes", p);
      return (await Net.sincronizar())[juego] || null;
    },
    async enviarNivel(id, puntaje, estrellas) {
      const p = get("pend_niveles", {}), c = p[id] || [0, 0];
      p[id] = [Math.max(c[0], puntaje), Math.max(c[1], estrellas)]; set("pend_niveles", p);
      return (await Net.sincronizar()).__total || null;
    },
    async sincronizar() {
      const out = {};
      if (!(await Net.asegurarApodo())) return out;
      const p = get("pendientes", {});
      for (const j of Object.keys(p)) {
        try {
          const r = await rpc("enviar_puntaje", { p_device: Store.device(), p_juego: j, p_puntaje: p[j] });
          if (r && (r.ok || r.error === "puntaje_invalido")) { delete p[j]; set("pendientes", p); }
          out[j] = r;
        } catch (e) { return out; }
      }
      const pn = get("pend_niveles", {});
      for (const id of Object.keys(pn)) {
        try {
          const r = await rpc("enviar_nivel", { p_device: Store.device(), p_nivel: id, p_puntaje: pn[id][0], p_estrellas: pn[id][1] });
          if (r && (r.ok || r.error === "puntaje_invalido")) { delete pn[id]; set("pend_niveles", pn); }
          if (r && r.ok) out.__total = r;
        } catch (e) { return out; }
      }
      return out;
    },
    async ranking(juego) {
      if (juego === "total") return rpc("ver_ranking_total", { p_limite: 50 });
      return rpc("ver_ranking", { p_juego: juego, p_limite: 50 });
    },
    async mio(juego) {
      const r = juego === "total" ? await rpc("mi_ranking_total", { p_device: Store.device() })
        : await rpc("mi_ranking", { p_device: Store.device(), p_juego: juego });
      return r && r[0];
    },
  };

  window.Store = Store; window.Prog = Prog; window.Net = Net;
  window.addEventListener("online", () => Net.sincronizar());
})();
