// ===== Guardado local (en el navegador) y conexión con Supabase =====
(function () {
  const K = (k) => "tmb_" + k;
  const get = (k, d) => { try { const v = localStorage.getItem(K(k)); return v === null ? d : JSON.parse(v); } catch (e) { return d; } };
  const set = (k, v) => { try { localStorage.setItem(K(k), JSON.stringify(v)); } catch (e) {} };

  function uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    const b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }

  const Store = {
    get, set,
    // código al azar del dispositivo: no es un dato personal
    device() { let d = get("device", null); if (!d) { d = uuid(); set("device", d); } return d; },
    apodo: () => get("apodo", ""),
    gotas: () => get("gotas", 0),
    addGotas(n) { set("gotas", get("gotas", 0) + n); },
    best: (j) => get("best_" + j, 0),
    setBest(j, v) { set("best_" + j, v); },
  };

  const C = window.TMB_CONFIG || {};
  const online = () => !!(C.SUPABASE_URL && C.SUPABASE_KEY) && navigator.onLine !== false;

  async function rpc(fn, body) {
    if (!online()) throw new Error("offline");
    const ctl = new AbortController();
    const tm = setTimeout(() => ctl.abort(), 8000);
    try {
      const r = await fetch(`${C.SUPABASE_URL}/rest/v1/rpc/${fn}`, {
        method: "POST", signal: ctl.signal,
        headers: { apikey: C.SUPABASE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error("http " + r.status);
      return await r.json();
    } finally { clearTimeout(tm); }
  }

  const Net = {
    // 'ok' | 'apodo_invalido' | 'apodo_no_permitido' | 'apodo_ocupado' | 'offline'
    async registrar(apodo) {
      try {
        const r = await rpc("registrar_apodo", { p_device: Store.device(), p_apodo: apodo });
        if (r === "ok") set("apodo_subido", apodo);
        return r;
      } catch (e) { return "offline"; }
    },
    // Guarda el mejor puntaje pendiente y lo sube cuando hay internet
    async enviar(juego, puntaje) {
      const pend = get("pendientes", {});
      pend[juego] = Math.max(pend[juego] || 0, puntaje);
      set("pendientes", pend);
      return Net.sincronizar(juego);
    },
    async sincronizar(soloJuego) {
      const apodo = Store.apodo();
      if (!apodo) return null;
      if (get("apodo_subido", "") !== apodo) {
        const r = await Net.registrar(apodo);
        if (r !== "ok") return null;
      }
      const pend = get("pendientes", {});
      let res = null;
      for (const j of Object.keys(pend)) {
        try {
          const r = await rpc("enviar_puntaje", { p_device: Store.device(), p_juego: j, p_puntaje: pend[j] });
          if (r && (r.ok || r.error === "puntaje_invalido")) { delete pend[j]; set("pendientes", pend); }
          if (j === soloJuego) res = r;
        } catch (e) { break; }
      }
      return res;
    },
    async ranking(juego) { return rpc("ver_ranking", { p_juego: juego, p_limite: 50 }); },
    async miRanking(juego) {
      const r = await rpc("mi_ranking", { p_device: Store.device(), p_juego: juego });
      return r && r[0];
    },
  };

  window.Store = Store;
  window.Net = Net;
  window.addEventListener("online", () => Net.sincronizar());
})();
