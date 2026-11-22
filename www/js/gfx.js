// ===== Dibujo compartido: sprites, textos y accesorios de TMB =====
(function () {
  const S = {}; let loading = null;
  const FONT = '"Arial Rounded MT Bold","Trebuchet MS","Segoe UI",sans-serif';
  const Gfx = { S, FONT };

  Gfx.load = function () {
    if (loading) return loading;
    const im = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
    loading = fetch("img/sprites.json").then((r) => r.json()).then(async (data) => {
      const hojas = await Promise.all(Array.from({ length: data.sheets }, (_, i) => im(`img/hoja_${i}.png`)));
      await Promise.all(Object.entries(data.sprites).map(async ([n, a]) => {
        const img = a.sheet !== undefined ? hojas[a.sheet] : await im(`img/${n}.png`);
        if (img) S[n] = Object.assign({ img, x: a.x || 0, y: a.y || 0 }, a);
      }));
    });
    return loading;
  };
  Gfx.img = function (src) { return new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; }); };

  // Dibuja un sprite con su ancla en (x, y). Los sprites están al doble de tamaño.
  Gfx.spr = function (ctx, n, x, y, sx = 1, sy = sx, a = 1, rot = 0) {
    const s = S[n]; if (!s) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale(sx, sy);
    ctx.drawImage(s.img, s.x, s.y, s.w, s.h, -s.ax / 2, -s.ay / 2, s.w / 2, s.h / 2); ctx.restore();
  };
  Gfx.rr = function (ctx, x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); };
  Gfx.txt = function (ctx, s, x, y, size, fill = "#fff", align = "center", stroke = "#111") {
    ctx.font = `900 ${size}px ${FONT}`; ctx.textAlign = align; ctx.textBaseline = "middle";
    ctx.lineJoin = "round"; ctx.lineWidth = Math.max(3, size * 0.16); ctx.strokeStyle = stroke;
    if (stroke) ctx.strokeText(s, x, y);
    ctx.fillStyle = fill; ctx.fillText(s, x, y);
  };
  Gfx.star = function (ctx, x, y, r, fill = "#ffd400") {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = "#111"; ctx.lineWidth = Math.max(2, r * 0.15); ctx.stroke();
  };

  // Nombre del sprite de TMB según aspecto de bolsa y pose
  Gfx.tmb = (skin, pose, tox) => (tox && ["run0", "run1", "jump", "throw", "ride", "scoot"].includes(pose) ? `t_tox_${pose}` : `t_${skin || "clasica"}_${pose}`);

  // ---------- Accesorios ----------
  // (x, y) = pies de TMB; k = escala (1 = tamaño de Escape de las cabras); sy = aplastado al agacharse
  // capa "back" se dibuja antes del cuerpo y "front" después.
  Gfx.acc = function (ctx, eq, x, y, k, o = {}) {
    const sy = o.sy || 1, view = o.view || "side", t = o.t || 0, layer = o.layer || "front";
    const P = (px, py) => [x + px * k, y - py * k * sy];
    ctx.save(); ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.strokeStyle = "#111"; ctx.lineWidth = 3 * k;
    const head = (fn) => { const [hx, hy] = P(0, 189); ctx.save(); ctx.translate(hx, hy); ctx.scale(k, k * sy); fn(); ctx.restore(); };
    if (layer === "back") {
      if (eq.espalda === "capa") {
        const w = Math.sin(t * 12) * 6;
        ctx.fillStyle = "#e23b4f"; ctx.beginPath();
        if (view === "side") { const a = P(-14, 125), b = P(14, 125), c = P(-75 - w, 40), d = P(-30, 30); ctx.moveTo(...a); ctx.lineTo(...b); ctx.lineTo(...d); ctx.lineTo(...c); }
        else { const a = P(-24, 125), b = P(24, 125), c = P(40 + w, 30), d = P(-40 - w, 30); ctx.moveTo(...a); ctx.lineTo(...b); ctx.lineTo(...c); ctx.lineTo(...d); }
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      if (eq.espalda === "mochila" && view === "side") { const [mx, my] = P(-40, 115); ctx.fillStyle = "#2a6fd6"; Gfx.rr(ctx, mx, my, 22 * k, 52 * k * sy, 6 * k); ctx.fill(); ctx.stroke(); }
      if (eq.espalda === "tanque") {
        const [mx, my] = P(view === "side" ? -44 : -16, 120);
        ctx.fillStyle = "#4e9f4a"; Gfx.rr(ctx, mx, my, (view === "side" ? 22 : 32) * k, 60 * k * sy, 10 * k); ctx.fill(); ctx.stroke();
        ctx.fillStyle = `rgba(125,255,58,${0.5 + Math.sin(t * 8) * 0.3})`; Gfx.rr(ctx, mx + 4 * k, my + 10 * k, (view === "side" ? 14 : 24) * k, 16 * k * sy, 4 * k); ctx.fill();
      }
      ctx.restore(); return;
    }
    if (eq.espalda === "mochila" && view === "front") {
      ctx.strokeStyle = "#2a6fd6"; ctx.lineWidth = 5 * k;
      ctx.beginPath(); ctx.moveTo(...P(-16, 118)); ctx.lineTo(...P(-18, 80)); ctx.moveTo(...P(16, 118)); ctx.lineTo(...P(18, 80)); ctx.stroke();
      ctx.strokeStyle = "#111"; ctx.lineWidth = 3 * k;
    }
    if (eq.cabeza === "gorra") head(() => {
      ctx.fillStyle = "#e23b4f"; ctx.beginPath(); ctx.ellipse(0, 6, 29, 16, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath();
      if (view === "side") ctx.ellipse(28, 5, 20, 5, 0, 0, Math.PI * 2); else ctx.ellipse(0, 7, 30, 6, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke(); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(0, -9, 3.5, 0, 7); ctx.fill();
    });
    if (eq.cabeza === "casco") head(() => {
      ctx.fillStyle = "#ffd400"; ctx.beginPath(); ctx.ellipse(0, 10, 33, 24, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#111"; ctx.fillRect(-4, -13, 8, 22); ctx.fillStyle = "#ffd400"; ctx.fillRect(-36, 6, 72, 7); ctx.strokeRect(-36, 6, 72, 7);
    });
    if (eq.cabeza === "audifonos") head(() => {
      ctx.strokeStyle = "#222"; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(0, 18, 31, 26, 0, Math.PI, 0); ctx.stroke();
      ctx.fillStyle = "#7b5cff"; ctx.strokeStyle = "#111"; ctx.lineWidth = 3;
      const cups = view === "side" ? [-6] : [-33, 33];
      for (const cx of cups) { Gfx.rr(ctx, cx - 9, 16, 18, 28, 7); ctx.fill(); ctx.stroke(); }
    });
    if (eq.cabeza === "corona") head(() => {
      ctx.fillStyle = "#c98a1a";
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 18, -2); ctx.quadraticCurveTo(s * 44, -10, s * 40, -30); ctx.quadraticCurveTo(s * 36, -16, s * 12, -10); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = "#ffd23f"; ctx.beginPath(); ctx.moveTo(-24, 4); ctx.lineTo(-26, -20); ctx.lineTo(-12, -8); ctx.lineTo(0, -26); ctx.lineTo(12, -8); ctx.lineTo(26, -20); ctx.lineTo(24, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#7dff3a"; ctx.beginPath(); ctx.arc(0, -6, 4, 0, 7); ctx.fill(); ctx.stroke();
    });
    ctx.restore();
  };

  // Vehículo bajo los pies (x, y = suelo). rot = inclinación al saltar.
  Gfx.vehiculo = function (ctx, v, x, y, k, rot = 0) {
    if (!v) return;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k);
    ctx.strokeStyle = "#111"; ctx.lineWidth = 3; ctx.lineJoin = "round";
    if (v === "patineta") {
      ctx.fillStyle = "#e23b4f"; ctx.beginPath(); ctx.moveTo(-46, -12); ctx.quadraticCurveTo(-54, -18, -50, -6); ctx.lineTo(48, -6); ctx.quadraticCurveTo(54, -18, 46, -12); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#ffd400"; for (const wx of [-28, 30]) { ctx.beginPath(); ctx.arc(wx, -1, 6, 0, 7); ctx.fill(); ctx.stroke(); }
    } else if (v === "scooter") {
      ctx.fillStyle = "#2a6fd6"; Gfx.rr(ctx, -34, -14, 80, 9, 4); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "#555"; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(44, -10); ctx.lineTo(58, -112); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(48, -112); ctx.lineTo(70, -112); ctx.stroke();
      ctx.strokeStyle = "#111"; ctx.lineWidth = 3; ctx.fillStyle = "#222";
      for (const wx of [-26, 48]) { ctx.beginPath(); ctx.arc(wx, -2, 8, 0, 7); ctx.fill(); ctx.stroke(); }
    }
    ctx.restore();
  };

  // Estela detrás de TMB (x, y = centro del cuerpo)
  Gfx.estela = function (ctx, e, x, y, k, t, dir = -1) {
    if (!e) return;
    ctx.save();
    for (let i = 1; i <= 7; i++) {
      const a = 1 - i / 8, px = x + dir * i * 20 * k, py = y + Math.sin(t * 9 + i) * 6 * k;
      ctx.globalAlpha = a;
      if (e === "gotas") { ctx.fillStyle = "#7dff3a"; ctx.beginPath(); ctx.arc(px, py, (7 - i * 0.6) * k, 0, 7); ctx.fill(); }
      else if (e === "chispas") Gfx.star(ctx, px, py, (9 - i * 0.8) * k, i % 2 ? "#ffd400" : "#fff");
      else if (e === "arcoiris") {
        const cols = ["#ff5d73", "#ffb36b", "#ffd84d", "#7dff3a", "#7fb3e6", "#b9a0f0"];
        cols.forEach((c, j) => { ctx.fillStyle = c; ctx.fillRect(px - 10 * k, py - 24 * k + j * 8 * k, 21 * k, 8 * k); });
      }
    }
    ctx.restore();
  };

  // TMB completo con accesorios (para el vestidor y menús)
  Gfx.tmbFull = function (ctx, eq, pose, x, y, k, t, o = {}) {
    const view = ["run0", "run1", "jump", "throw", "ride", "scoot"].includes(pose) ? "side" : "front";
    Gfx.estela(ctx, eq.estela, x - 20 * k, y - 80 * k, k, t);
    Gfx.acc(ctx, eq, x, y, k, { view, t, layer: "back" });
    Gfx.spr(ctx, Gfx.tmb(eq.bolsa, pose, o.tox), x, y, k);
    Gfx.acc(ctx, eq, x, y, k, { view, t });
  };

  window.Gfx = Gfx;
})();
