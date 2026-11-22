// ===== CARRERA TÓXICA (vertical 720×1280) =====
// TMB cae por el tubo de la fábrica. Arrastra el dedo (o ← →, A D) para moverte.
// Tocar (o Espacio/↑) = abrir paracaídas si tienes. La píldora tóxica te convierte en Bebé TMB para pasar huecos chicos.
(function () {
  const W = 720, H = 1280, PY = 400, WALL = 80;
  const C = {};
  let canvas, ctx, k = 1, st = null, raf = 0, last = 0, cb = {}, eq = null;
  const spr = (...a) => Gfx.spr(ctx, ...a), rr = (...a) => Gfx.rr(ctx, ...a), txt = (...a) => Gfx.txt(ctx, ...a);
  const rnd = (a, b) => a + Math.random() * (b - a);

  C.setup = function (cv) { canvas = cv; ctx = cv.getContext("2d"); };
  C.resize = function (scale) { k = Math.min(2, Math.max(1, scale * (window.devicePixelRatio || 1))); canvas.width = Math.round(W * k); canvas.height = Math.round(H * k); };

  function nuevo() {
    return { t: 0, cam: 0, speed: 260, x: W / 2, vx: 0, keys: 0, objs: [], parts: [], gotas: 0, chutes: 1, chute: 0, baby: 0,
      next: 900, over: false, overT: 0, sent: false, paused: false, hintT: Store.get("tut_carrera", false) ? 0 : 3.5, lastSay: 0 };
  }
  const depth = () => Math.floor(st.cam / 50);

  // ---------- generación ----------
  function add(o) { st.objs.push(o); return o; }
  function spawn(y) {
    const d = depth(), r = Math.random();
    if (d > 60 && r < 0.16) {                      // hueco chico: necesitas ser Bebé TMB
      const gx = rnd(WALL + 90, W - WALL - 90);
      add({ type: "pildora", x: gx, y: y - 520 });
      add({ type: "par", y, gx, gw: 64 });
      return 620;
    }
    if (r < 0.42) {
      const side = Math.random() < 0.5 ? 0 : 1, len = rnd(200, 330 + Math.min(120, d * 0.3));
      add({ type: "viga", y, side, len });
      const gx = side === 0 ? WALL + len + (W - 2 * WALL - len) / 2 : WALL + (W - 2 * WALL - len) / 2;
      for (let i = 0; i < 4; i++) add({ type: "gota", x: gx + Math.sin(i) * 20, y: y - 200 + i * 60 });
      return rnd(360, 480);
    }
    if (r < 0.62 && d > 20) { add({ type: "chorro", y, side: Math.random() < 0.5 ? 0 : 1, ph: Math.random() * 2, len: 330 }); return rnd(380, 480); }
    if (r < 0.8) { add({ type: "barril", x: rnd(WALL + 50, W - WALL - 50), y, rot: rnd(0, 6), vr: rnd(-3, 3) }); return rnd(300, 420); }
    if (r < 0.88) { add({ type: "paracaidas", x: rnd(WALL + 60, W - WALL - 60), y }); return 300; }
    for (let i = 0; i < 5; i++) add({ type: "gota", x: W / 2 + Math.sin(i + y) * 140, y: y + i * 70 });
    return 380;
  }

  // ---------- acciones ----------
  function usarParacaidas() {
    if (st.over || st.chute > 0 || st.chutes <= 0) return;
    st.chutes--; st.chute = 3.2; Sfx.say("paracaidas"); Sfx.fx("pop");
  }

  // ---------- choques ----------
  function pbox() {
    if (st.baby > 0) return [st.x - 22, st.x + 22, PY - 26, PY + 26];
    return [st.x - 27, st.x + 27, PY - 95, PY + 95];
  }
  const hitR = (b, l, r, t, bt) => b[1] > l && b[0] < r && b[3] > t && b[2] < bt;
  function perder() {
    st.over = true; Sfx.stopMusic(); Sfx.say("caida"); Sfx.fx("golpe");
    for (let i = 0; i < 20; i++) st.parts.push({ x: st.x, y: PY, vx: rnd(-300, 300), vy: rnd(-300, 300), life: rnd(0.5, 1), t: 0, c: "#7dff3a", r: rnd(5, 12) });
  }

  // ---------- actualización ----------
  function update(dt) {
    st.t += dt;
    st.parts = st.parts.filter((q) => { q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; return q.t < q.life; });
    if (st.over) {
      st.overT += dt;
      if (st.overT > 1.4 && !st.sent) {
        st.sent = true; const m = depth();
        Prog.stat("partidas"); Prog.stat("gotas", st.gotas); Prog.stat("caidaMax", m, true); Prog.ev("caida", m);
        cb.onOver && cb.onOver({ metros: m, gotas: st.gotas });
      }
      return;
    }
    st.hintT -= dt;
    if (st.hintT <= 0 && !Store.get("tut_carrera", false) && st.t > 3) Store.set("tut_carrera", true);
    const target = Math.min(950, 260 + depth() * 0.9) * (st.chute > 0 ? 0.42 : 1);
    st.speed += (target - st.speed) * Math.min(1, dt * 3);
    st.cam += st.speed * dt;
    st.chute -= dt;
    if (st.baby > 0) {
      st.baby -= dt;
      if (st.baby <= 0) {
        // no vuelve a crecer si está dentro de un hueco chico
        const big = [st.x - 27, st.x + 27, PY - 95, PY + 95];
        const blocked = st.objs.some((o) => { const y = o.y - st.cam; return o.type === "par" && (hitR(big, WALL, o.gx - o.gw / 2, y - 28, y + 28) || hitR(big, o.gx + o.gw / 2, W - WALL, y - 28, y + 28)); });
        if (blocked) st.baby = 0.3; else { Sfx.fx("puf"); puff(); }
      }
    }
    // teclas
    if (st.keys) st.x += st.keys * 620 * dt;
    st.x = Math.max(WALL + 30, Math.min(W - WALL - 30, st.x));
    // generar
    while (st.next < st.cam + H + 300) st.next += spawn(st.next + H);
    const b = pbox();
    for (const o of st.objs) {
      const y = o.y - st.cam;
      if (o.type === "barril") { o.y -= 180 * dt; o.rot += o.vr * dt; if (hitR(b, o.x - 30, o.x + 30, y - 42, y + 42)) return perder(); }
      else if (o.type === "viga") {
        const l = o.side === 0 ? WALL : W - WALL - o.len, r = o.side === 0 ? WALL + o.len : W - WALL;
        if (hitR(b, l, r, y - 26, y + 26)) return perder();
      } else if (o.type === "par") {
        if (hitR(b, WALL, o.gx - o.gw / 2, y - 28, y + 28) || hitR(b, o.gx + o.gw / 2, W - WALL, y - 28, y + 28)) return perder();
      } else if (o.type === "chorro") {
        o.ph += dt; const on = (o.ph % 2.2) < 1.2;
        const l = o.side === 0 ? WALL : W - WALL - o.len, r = o.side === 0 ? WALL + o.len : W - WALL;
        if (on && hitR(b, l, r, y - 34, y + 34)) return perder();
      } else if (!o.dead && hitR(b, o.x - 30, o.x + 30, y - 30, y + 30)) {
        o.dead = true;
        if (o.type === "gota") { st.gotas++; Sfx.fx("gota"); Prog.ev("gota"); }
        if (o.type === "paracaidas") { st.chutes = Math.min(3, st.chutes + 1); Sfx.fx("pop"); }
        if (o.type === "pildora") { st.baby = 4.5; Sfx.say("me_encojo"); Sfx.fx("puf"); puff(); }
      }
    }
    st.objs = st.objs.filter((o) => o.y - st.cam > -300 && !o.dead);
  }
  function puff() { for (let i = 0; i < 14; i++) st.parts.push({ x: st.x, y: PY, vx: rnd(-200, 200), vy: rnd(-200, 200), life: 0.6, t: 0, c: "#fff", r: rnd(10, 22), cl: true }); }

  // ---------- render ----------
  function drawTube() {
    const g = ctx.createLinearGradient(0, 0, W, 0); g.addColorStop(0, "#0f1a14"); g.addColorStop(0.5, "#2c4a37"); g.addColorStop(1, "#0f1a14");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const off = st.cam % 170;
    ctx.strokeStyle = "#1a2a20"; ctx.lineWidth = 5; ctx.beginPath();
    for (let y = -off; y < H; y += 170) { ctx.moveTo(WALL, y); ctx.lineTo(W - WALL, y); } ctx.stroke();
    for (const [x, w, c] of [[170, 34, "#35503f"], [520, 46, "#304a3a"], [360, 22, "#2a4234"]]) { ctx.fillStyle = c; ctx.fillRect(x, 0, w, H); }
    const glow = ctx.createRadialGradient(W / 2, H + 100, 50, W / 2, H + 100, 600); glow.addColorStop(0, "rgba(125,255,58,.35)"); glow.addColorStop(1, "rgba(125,255,58,0)");
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 4; ctx.beginPath();
    for (let i = 0; i < 18; i++) { const x = 100 + (i * 137) % 520, y = (i * 211 - st.cam * 1.4) % H; const yy = y < 0 ? y + H : y; ctx.moveTo(x, yy); ctx.lineTo(x, yy - 40 - st.speed * 0.12); } ctx.stroke();
    for (const side of [0, 1]) {
      const x0 = side ? W - WALL : 0;
      ctx.fillStyle = "#4a5560"; ctx.fillRect(x0, 0, WALL, H);
      const o2 = st.cam % 120;
      for (let y = -o2; y < H; y += 120) { ctx.fillStyle = "#56636f"; rr(x0 + 8, y, 64, 110, 6); ctx.fill(); ctx.fillStyle = "#2b333b"; ctx.beginPath(); ctx.arc(x0 + 18, y + 12, 4, 0, 7); ctx.arc(x0 + 62, y + 12, 4, 0, 7); ctx.fill(); }
      ctx.strokeStyle = "#111"; ctx.lineWidth = 6; ctx.strokeRect(x0, -10, WALL, H + 20);
    }
    // marcas de profundidad
    const m0 = Math.floor(st.cam / 50 / 50) * 50;
    for (let m = m0; m < m0 + 100; m += 50) {
      const y = m * 50 - st.cam; if (y < -50 || y > H || m === 0) continue;
      ctx.fillStyle = "#ffd400"; rr(8, y, 64, 36, 6); ctx.fill(); ctx.strokeStyle = "#111"; ctx.lineWidth = 3; ctx.stroke();
      txt(`${m}m`, 40, y + 18, 16, "#111", "center", null);
    }
  }
  function beam(l, r, y) {
    ctx.fillStyle = "#6f7a88"; ctx.strokeStyle = "#111"; ctx.lineWidth = 6;
    ctx.fillRect(l, y - 26, r - l, 52); ctx.strokeRect(l, y - 26, r - l, 52);
    ctx.fillStyle = "#8a96a6"; ctx.fillRect(l, y - 26, r - l, 14);
  }
  function flange(x, y) {
    ctx.fillStyle = "#8a96a6"; rr(x - 16, y - 36, 32, 72, 8); ctx.fill(); ctx.strokeStyle = "#111"; ctx.lineWidth = 6; ctx.stroke();
    ctx.strokeStyle = "#ffd400"; ctx.lineWidth = 6; ctx.beginPath(); for (let i = 0; i < 3; i++) { ctx.moveTo(x - 12, y - 30 + i * 22); ctx.lineTo(x + 12, y - 18 + i * 22); } ctx.stroke();
  }
  function drawObjs() {
    for (const o of st.objs) {
      const y = o.y - st.cam; if (y < -200 || y > H + 200) continue;
      if (o.type === "viga") {
        const l = o.side === 0 ? WALL : W - WALL - o.len, r = o.side === 0 ? WALL + o.len : W - WALL;
        beam(l, r, y); flange(o.side === 0 ? r : l, y);
      } else if (o.type === "par") {
        beam(WALL, o.gx - o.gw / 2, y); beam(o.gx + o.gw / 2, W - WALL, y);
        flange(o.gx - o.gw / 2 - 4, y); flange(o.gx + o.gw / 2 + 4, y);
      } else if (o.type === "chorro") {
        const on = (o.ph % 2.2) < 1.2, warn = !on && (o.ph % 2.2) > 1.8, d = o.side === 0 ? 1 : -1, nx = o.side === 0 ? WALL : W - WALL;
        if (on) {
          ctx.fillStyle = "rgba(125,255,58,.55)"; ctx.beginPath(); ctx.moveTo(nx, y - 18); ctx.lineTo(nx + d * o.len, y - 50); ctx.lineTo(nx + d * o.len, y + 50); ctx.lineTo(nx, y + 18); ctx.fill();
          ctx.fillStyle = "#b8ff8c"; ctx.beginPath(); ctx.moveTo(nx, y - 10); ctx.lineTo(nx + d * o.len, y - 34); ctx.lineTo(nx + d * o.len, y + 34); ctx.lineTo(nx, y + 10); ctx.fill();
        } else if (warn) { ctx.fillStyle = "#7dff3a"; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(nx + d * (20 + i * 18), y + Math.sin(st.t * 20 + i) * 6, 6, 0, 7); ctx.fill(); } }
        ctx.fillStyle = "#4a4360"; rr(o.side === 0 ? nx : nx - 46, y - 26, 46, 52, 8); ctx.fill(); ctx.strokeStyle = "#111"; ctx.lineWidth = 6; ctx.stroke();
      } else if (o.type === "barril") spr("barril", o.x, y + 48, 0.9, 0.9, 1, o.rot);
      else if (o.type === "gota") spr("gota", o.x, y, 0.6);
      else if (o.type === "paracaidas") { spr("paracaidas", o.x, y + 30, 0.32); }
      else if (o.type === "pildora") {
        ctx.save(); ctx.translate(o.x, y); ctx.rotate(st.t * 2);
        ctx.fillStyle = "#ff9ec9"; ctx.strokeStyle = "#111"; ctx.lineWidth = 4; rr(-26, -13, 26, 26, 13); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#7dff3a"; rr(0, -13, 26, 26, 13); ctx.fill(); ctx.stroke(); ctx.restore();
        Gfx.star(ctx, o.x + 26, y - 26, 8, "#ffe14d");
      }
    }
  }
  function drawPlayer() {
    const x = st.x, wob = Math.sin(st.t * 6) * 4;
    if (st.over) { spr(Gfx.tmb(eq.bolsa, "caught"), x, PY + 100, 1.2, 1.2, 1, Math.sin(st.overT * 10) * 0.3); return; }
    if (st.baby > 0) {
      const g = ctx.createRadialGradient(x, PY, 5, x, PY, 80); g.addColorStop(0, "rgba(125,255,58,.6)"); g.addColorStop(1, "rgba(125,255,58,0)");
      ctx.fillStyle = g; ctx.fillRect(x - 80, PY - 80, 160, 160);
      spr("bebe", x, PY + 40 + wob, 0.62); return;
    }
    const feet = PY + 100, pose = st.chute > 0 ? "hold" : "fall";
    Gfx.estela(ctx, eq.estela, x, PY - 20, 1.2, st.t, 0);
    if (st.chute > 0) {
      spr("paracaidas", x, PY - 175, 0.95);
      ctx.strokeStyle = "#111"; ctx.lineWidth = 3; ctx.beginPath();
      for (const dx of [-140, -50, 50, 140]) { ctx.moveTo(x + dx * 0.95, PY - 190); ctx.lineTo(x + (dx < 0 ? -30 : 30), PY - 78); } ctx.stroke();
    }
    Gfx.acc(ctx, eq, x, feet + wob, 1.2, { view: "front", t: st.t, layer: "back" });
    spr(Gfx.tmb(eq.bolsa, pose), x, feet + wob, 1.2);
    Gfx.acc(ctx, eq, x, feet + wob, 1.2, { view: "front", t: st.t });
  }
  function drawHUD() {
    ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(0, 0, W, 120);
    ctx.fillStyle = "#2a6fd6"; rr(18, 18, 260, 84, 18); ctx.fill();
    txt(`${depth()} m`, 148, 62, 42, "#fff", "center", null);
    ctx.fillStyle = "#fff"; rr(294, 18, 170, 84, 18); ctx.fill(); spr("gota", 336, 60, 0.5); txt(`${st.gotas}`, 410, 62, 34, "#111", "center", null);
    ctx.fillStyle = "#fff"; rr(480, 18, 150, 84, 18); ctx.fill(); spr("paracaidas", 522, 70, 0.22); txt(`x ${st.chutes}`, 590, 62, 32, "#111", "center", null);
    ctx.fillStyle = "rgba(255,255,255,.9)"; ctx.beginPath(); ctx.arc(676, 60, 28, 0, 7); ctx.fill(); ctx.fillStyle = "#111"; ctx.fillRect(665, 46, 8, 28); ctx.fillRect(679, 46, 8, 28);
    ctx.fillStyle = "#222"; rr(18, 128, 684, 14, 7); ctx.fill(); ctx.fillStyle = "#ff9a3a"; rr(20, 130, 680 * Math.min(1, st.speed / 950), 10, 5); ctx.fill();
    if (st.baby > 0) { ctx.fillStyle = "#7dff3a"; rr(18, 150, 684 * (st.baby / 4.5), 10, 5); ctx.fill(); }
    if (st.hintT > 0) {
      const ph = (st.t * 1.1) % 1, hx = 230 + Math.abs(ph * 2 - 1) * 260;
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 8; ctx.setLineDash([14, 10]); ctx.beginPath(); ctx.moveTo(230, 1040); ctx.lineTo(490, 1040); ctx.stroke(); ctx.setLineDash([]);
      ctx.save(); ctx.translate(hx, 1080); ctx.fillStyle = "#fff"; ctx.strokeStyle = "#111"; ctx.lineWidth = 5; rr(-14, -60, 28, 80, 14); ctx.fill(); ctx.stroke();
      rr(-40, 0, 100, 90, 30); ctx.fill(); ctx.stroke(); ctx.restore();
    }
    for (const q of st.parts) {
      ctx.globalAlpha = Math.max(0, 1 - q.t / q.life); ctx.fillStyle = q.c;
      if (q.cl) { ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 7); ctx.fill(); } else ctx.fillRect(q.x, q.y, q.r, q.r);
    }
    ctx.globalAlpha = 1;
  }
  function render() { ctx.setTransform(k, 0, 0, k, 0, 0); drawTube(); drawObjs(); drawPlayer(); drawHUD(); }
  function frame(ts) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, last ? (ts - last) / 1000 : 0); last = ts;
    if (!st.paused) update(dt);
    render();
  }

  // ---------- controles ----------
  let ptr = null;
  function pos(e) { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; }
  function onDown(e) {
    if (!st || st.over) return; const p = pos(e);
    if (Math.hypot(p.x - 676, p.y - 60) < 44) { cb.onPause && cb.onPause(); return; }
    ptr = { id: e.pointerId, x0: p.x, last: p.x, moved: 0 }; e.preventDefault();
  }
  function onMove(e) {
    if (!ptr || e.pointerId !== ptr.id || !st) return; const p = pos(e);
    st.x += (p.x - ptr.last) * 1.15; ptr.moved += Math.abs(p.x - ptr.last); ptr.last = p.x;
  }
  function onUp(e) { if (!ptr || e.pointerId !== ptr.id) return; if (ptr.moved < 12) usarParacaidas(); ptr = null; }
  function onKey(e) {
    if (!st) return;
    if (e.code === "KeyP" || e.code === "Escape") { e.preventDefault(); cb.onPause && cb.onPause(); return; }
    if (["ArrowLeft", "KeyA"].includes(e.code)) { e.preventDefault(); st.keys = -1; }
    if (["ArrowRight", "KeyD"].includes(e.code)) { e.preventDefault(); st.keys = 1; }
    if (["Space", "ArrowUp", "KeyW"].includes(e.code)) { e.preventDefault(); if (!e.repeat) usarParacaidas(); }
  }
  function onKeyUp(e) {
    if (!st) return;
    if (["ArrowLeft", "KeyA"].includes(e.code) && st.keys < 0) st.keys = 0;
    if (["ArrowRight", "KeyD"].includes(e.code) && st.keys > 0) st.keys = 0;
  }

  C.start = function (opts) {
    cb = opts || {}; eq = Prog.eq(); st = nuevo(); last = 0;
    cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
    window.addEventListener("keydown", onKey); window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("pointerdown", onDown); window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp); window.addEventListener("pointercancel", onUp);
    Sfx.music("caida");
  };
  C.stop = function () {
    cancelAnimationFrame(raf); st = null; ptr = null;
    window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onKeyUp);
    canvas.removeEventListener("pointerdown", onDown); window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp); window.removeEventListener("pointercancel", onUp);
    Sfx.stopMusic(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
  C.pause = function () { if (st && !st.over) { st.paused = true; Sfx.stopMusic(); } };
  C.resume = function () { if (st) { st.paused = false; last = 0; Sfx.music("caida"); } };
  C.isRunning = () => !!st && !st.over;
  C._debug = () => st;
  window.Carrera = C;
})();
