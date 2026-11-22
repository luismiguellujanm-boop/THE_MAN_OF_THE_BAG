// ===== ESCAPE DE LAS CABRAS =====
// TMB corre solo; las cabras lo persiguen.
// Teclado: Espacio/↑/W saltar · ↓/S agacharse · →/D/Enter poder · P/Esc pausa
// Celular: tocar saltar · deslizar abajo agacharse · deslizar adelante poder
(function () {
  const W = 1280, H = 720, G = 585, PX = 300;
  const FONT = '"Arial Rounded MT Bold","Trebuchet MS","Segoe UI",sans-serif';
  const BAG_COLORS = ["rosa", "azul", "verde", "lila", "naranja"];
  const E = {};
  let canvas, ctx, k = 1, S = {}, st = null, raf = 0, last = 0, cb = {};
  let inputMode = matchMedia("(pointer: coarse)").matches ? "touch" : "keys";
  let skyGrad = null;

  // ---------- carga ----------
  E.load = async function () {
    const atlas = await (await fetch("img/sprites.json")).json();
    await Promise.all(Object.entries(atlas).map(([n, a]) => new Promise((ok) => {
      const im = new Image();
      im.onload = () => { S[n] = Object.assign({ img: im }, a); ok(); };
      im.onerror = ok; im.src = `img/${n}.png`;
    })));
  };
  E.setup = function (cv) { canvas = cv; ctx = cv.getContext("2d"); };
  E.resize = function (scale) {
    k = Math.min(2, Math.max(1, scale * (window.devicePixelRatio || 1)));
    canvas.width = Math.round(W * k); canvas.height = Math.round(H * k);
    skyGrad = null;
  };

  // ---------- dibujo básico ----------
  function spr(n, x, y, sx = 1, sy = sx, a = 1) {
    const s = S[n]; if (!s) return;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(sx, sy);
    ctx.drawImage(s.img, -s.ax / 2, -s.ay / 2, s.w / 2, s.h / 2); ctx.restore();
  }
  function rr(x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }
  function txt(s, x, y, size, fill = "#fff", align = "center", stroke = "#111") {
    ctx.font = `900 ${size}px ${FONT}`; ctx.textAlign = align; ctx.textBaseline = "middle";
    ctx.lineJoin = "round"; ctx.lineWidth = Math.max(3, size * 0.16); ctx.strokeStyle = stroke;
    if (stroke) ctx.strokeText(s, x, y);
    ctx.fillStyle = fill; ctx.fillText(s, x, y);
  }
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // ---------- estado ----------
  function nuevo(tutorial) {
    return {
      t: 0, px: 0, dist: 0, speed: 430, slow: 0, bar: 0, gotas: 0, paused: false,
      p: { y: 0, vy: 0, jumps: 0, ground: true, duck: 0, hold: false, inv: 0, throwT: 0, rayo: 0, coyote: 0, buffer: 0 },
      gang: [], goatGap: 250, objs: [], shots: [], parts: [], texts: [],
      next: 650, over: false, overT: 0, sent: false, beeeT: 0, shake: 0,
      clouds: [[150, 140, 1], [560, 100, 0.8], [900, 190, 0.9], [1220, 130, 0.7]],
      tut: tutorial ? { step: 0, at: 1.2, spawned: false, need: null, obj: null } : null,
    };
  }

  // ---------- acciones ----------
  function jump() {
    const p = st.p;
    if (p.ground || p.coyote > 0) { p.vy = 1150; p.ground = false; p.jumps = 1; p.coyote = 0; Sfx.fx("salto"); }
    else if (p.jumps < 2) { p.vy = 950; p.jumps = 2; Sfx.fx("salto2"); puff(PX, G - p.y, "#fff", 6); }
    else p.buffer = 0.12;
  }
  function duck(t) {
    const p = st.p;
    if (!p.ground) p.vy = -1700;
    p.duck = Math.max(p.duck, t);
  }
  function power() {
    const p = st.p;
    if (p.rayo > 0) return;
    if (st.bar >= 1) {
      p.rayo = 3.6; st.bar = 0; p.throwT = 0.4;
      Sfx.play("rayo_mutante_completo", 0.9); Sfx.say("rayo");
      popText("¡RAYO MUTANTE!", "#ffe14d", 84); st.shake = 0.4;
      setTimeout(() => Sfx.fx("beee"), 900);
    } else if (st.bar >= 0.5) {
      st.bar -= 0.5; p.throwT = 0.35;
      st.shots.push({ x: PX + 70, y: G - p.y - 118, vx: st.speed + 850, t: 0 });
      Sfx.play("eructo_toxico"); Sfx.say("eructo");
      popText("¡ERUCTO TÓXICO!", "#9dff5a", 70);
    } else {
      Sfx.fx("falta"); popText("¡Junta gotas verdes!", "#fff", 40, 0.9);
    }
  }
  function act(a) {
    if (!st || st.over || st.paused) return;
    const tu = st.tut;
    if (tu && tu.need) {
      const want = { jump: "jump", duckKey: "duck", duckSwipe: "duck", power: "power" }[a];
      if (want !== tu.need) return;
      tu.need = null; tu.done = true; st.freeze = false;
      if (want === "duck") { duck(1.05); return; }
    }
    if (a === "jump") jump();
    else if (a === "duckKey") { st.p.hold = true; duck(0.3); }
    else if (a === "duckSwipe") duck(0.75);
    else if (a === "power") power();
  }

  // ---------- efectos ----------
  function popText(s, color, size, dur = 1.3) { st.texts.push({ s, color, size, t: 0, dur }); }
  function puff(x, y, color, n = 10, sp = 260) {
    for (let i = 0; i < n; i++) st.parts.push({ x, y, vx: rnd(-sp, sp), vy: rnd(-sp, sp * 0.3), life: rnd(0.4, 0.8), t: 0, c: color, r: rnd(4, 10) });
  }
  function boom(o) {
    o.dead = true; Sfx.fx("boom"); st.shake = 0.25;
    const y = o.type === "tubo" ? G - 170 : G - 50;
    puff(o.x, y, "#7dff3a", 16, 380); puff(o.x, y, o.type === "barril" ? "#8a8f99" : "#c0874a", 12, 340);
  }

  // ---------- creación de obstáculos ----------
  function add(type, x, extra) { const o = Object.assign({ type, x }, extra || {}); st.objs.push(o); return o; }
  function gotasArco(x) { [[-110, 150], [0, 215], [110, 150]].forEach(([dx, h]) => add("gota", x + dx, { h })); }
  function spawn() {
    const x = W + 120, d = st.dist;
    if (Math.random() < (st.gang.length < 2 ? 0.17 : 0.08)) return add("bolsita", x, { color: pick(BAG_COLORS) });
    const pats = ["barril", "barril_gotas", "caja", "tubo", "tubo_gotas", "gotas", "gotas"];
    if (d > 120) pats.push("doble", "combo", "caja_gotas");
    if (d > 400) pats.push("combo", "doble", "tubo");
    switch (pick(pats)) {
      case "barril": add("barril", x); break;
      case "barril_gotas": add("barril", x); gotasArco(x); break;
      case "caja": add("caja", x); break;
      case "caja_gotas": add("caja", x); gotasArco(x); break;
      case "doble": add("barril", x); add("barril", x + 72); gotasArco(x + 36); break;
      case "tubo": add("tubo", x); break;
      case "tubo_gotas": add("tubo", x); [-70, 0, 70].forEach((dx) => add("gota", x + dx, { h: 45 })); break;
      case "gotas": { const wave = Math.random() < 0.5; for (let i = 0; i < 6; i++) add("gota", x + i * 70, { h: wave ? 60 + Math.sin(i / 5 * Math.PI) * 120 : 45 }); break; }
      case "combo": add("barril", x); add("tubo", x + st.speed * 1.0); break;
    }
  }

  // ---------- tutorial (solo la primera partida) ----------
  const TUT = [
    { obj: "barril", need: "jump", voz: () => (inputMode === "touch" ? "saltar" : "saltar_teclado"),
      tx: () => (inputMode === "touch" ? ["¡TOCA PARA", "SALTAR!"] : ["¡ESPACIO PARA", "SALTAR!"]) },
    { obj: "tubo", need: "duck", voz: () => "agacharse",
      tx: () => (inputMode === "touch" ? ["¡DESLIZA ABAJO", "PARA AGACHARTE!"] : ["¡FLECHA ↓ PARA", "AGACHARTE!"]) },
    { obj: "caja", need: "power", voz: () => "poder",
      tx: () => (inputMode === "touch" ? ["¡DESLIZA ADELANTE", "PARA LANZAR TU PODER!"] : ["¡FLECHA → PARA", "LANZAR TU PODER!"]) },
  ];
  function tutUpdate() {
    const tu = st.tut;
    if (tu.step >= TUT.length) {
      popText("¡A CORRER!", "#ffe14d", 90, 1.6); Sfx.say("a_correr");
      Store.set("tut_escape", true); st.tut = null; st.next = 500; return;
    }
    const step = TUT[tu.step];
    if (!tu.spawned && st.t > tu.at) {
      if (step.need === "power") { st.bar = Math.max(st.bar, 0.5); popText("¡Media barra tóxica!", "#9dff5a", 44); }
      tu.obj = add(step.obj, W + 120); tu.spawned = true; tu.done = false;
    }
    if (tu.spawned && !tu.done && !tu.need && tu.obj.x < PX + 270) {
      tu.need = step.need; st.freeze = true; Sfx.say(step.voz());
    }
    if (tu.spawned && tu.done && (tu.obj.dead || tu.obj.x < PX - 160)) {
      tu.step++; tu.spawned = false; tu.at = st.t + 0.7;
    }
  }

  // ---------- golpes y final ----------
  function hit(o) {
    o.hit = true; st.shake = 0.3; Sfx.fx("golpe");
    const p = st.p;
    if (st.gang.length > 0) {
      const c = st.gang.pop(); p.inv = 1.0; st.goatGap -= 15;
      st.parts.push({ x: PX - 60, y: G - 40, vx: -420, vy: 420, life: 0.9, t: 0, spr: `bolsa_${c}0`, rot: 0 });
      popText("¡Perdiste una bolsita!", "#ffd84d", 38, 1); Sfx.say("casi");
    } else {
      st.goatGap -= 110; p.inv = 1.3; st.slow = 0.9;
      popText("¡AY!", "#ff5d73", 64, 0.8); Sfx.say("las_cabras"); Sfx.fx("beee");
    }
  }
  function gameOver() {
    st.over = true; st.p.rayo = 0; Sfx.stopMusic(); Sfx.say("atrapado"); Sfx.fx("beee");
    st.shake = 0.5;
  }

  // ---------- actualización ----------
  function overlap(o) {
    const p = st.p, ducking = p.ground && (p.duck > 0 || p.hold);
    const top = G - p.y - (ducking ? 95 : 185), bot = G - p.y, L = PX - 28, R = PX + 28;
    let ol, or, ot, ob;
    if (o.type === "barril") { ol = o.x - 30; or = o.x + 30; ot = G - 92; ob = G; }
    else if (o.type === "caja") { ol = o.x - 33; or = o.x + 33; ot = G - 70; ob = G; }
    else if (o.type === "tubo") { ol = o.x - 42; or = o.x + 42; ot = 0; ob = G - 135; }
    else if (o.type === "bolsita") { ol = o.x - 28; or = o.x + 28; ot = G - 70; ob = G; }
    else return false;
    return R > ol && L < or && bot > ot && top < ob;
  }
  function update(dt) {
    st.t += dt;
    const p = st.p;
    if (st.shake > 0) st.shake -= dt;
    st.texts = st.texts.filter((t) => (t.t += dt) < t.dur);
    st.parts = st.parts.filter((q) => {
      q.t += dt; q.vy -= 900 * dt; q.x += q.vx * dt; q.y -= q.vy * dt; if (q.rot !== undefined) q.rot += dt * 8;
      return q.t < q.life;
    });
    if (st.over) {
      st.overT += dt; st.goatGap = Math.max(-40, st.goatGap - 260 * dt);
      if (st.overT > 1.7 && !st.sent) { st.sent = true; cb.onOver && cb.onOver({ metros: Math.floor(st.dist), gotas: st.gotas }); }
      return;
    }
    if (st.tut) tutUpdate();
    const tdt = st.freeze ? 0 : dt;

    // velocidad y distancia
    const target = Math.min(950, 430 + st.dist * 0.32);
    st.slow -= tdt;
    st.speed = target * (st.slow > 0 ? 0.65 : 1);
    const mv = st.speed * tdt;
    st.px += mv; st.dist = st.px / 60;

    // física de TMB
    p.vy -= 3300 * tdt; p.y += p.vy * tdt;
    if (p.y <= 0) {
      if (!p.ground) { puff(PX, G, "#e8d3a8", 5, 120); }
      p.y = 0; p.vy = 0; p.ground = true; p.jumps = 0;
      if (p.buffer > 0) { p.buffer = 0; jump(); }
    } else if (p.ground) { p.ground = false; p.coyote = 0.08; }
    p.coyote -= tdt; p.buffer -= tdt; p.duck -= tdt; p.inv -= tdt; p.throwT -= tdt;
    if (p.rayo > 0) {
      p.rayo -= tdt;
      st.goatGap = Math.min(340, st.goatGap + 220 * tdt);
      for (const o of st.objs) if (!o.dead && (o.type === "barril" || o.type === "caja" || o.type === "tubo") && o.x > PX + 40 && o.x < W + 40) boom(o);
    } else if (st.goatGap < 250) st.goatGap += 7 * tdt;

    // cabras
    st.beeeT -= tdt;
    if (st.goatGap < 150 && st.beeeT <= 0) { Sfx.fx("beee"); st.beeeT = 2.5; }
    if (st.goatGap <= 55 && !st.tut) return gameOver();

    // aparición de obstáculos
    if (!st.tut) { st.next -= mv; if (st.next <= 0) { spawn(); st.next = st.speed * rnd(1.15, 1.75); } }

    // nubes
    for (const c of st.clouds) { c[0] -= mv * 0.05 + 8 * tdt; if (c[0] < -200) c[0] = W + 200; }

    // eructos
    for (const s of st.shots) {
      s.x += s.vx * tdt; s.t += tdt;
      for (const o of st.objs) {
        if (o.dead || s.dead || !(o.type === "barril" || o.type === "caja" || o.type === "tubo")) continue;
        if (Math.abs(o.x - s.x) < 45) { boom(o); s.dead = true; }
      }
      if (s.x > W + 60) s.dead = true;
    }
    st.shots = st.shots.filter((s) => !s.dead);

    // objetos
    for (const o of st.objs) {
      o.x -= mv;
      if (o.dead) continue;
      if (o.type === "gota") {
        const dx = o.x - PX, dy = (G - o.h) - (G - p.y - 90);
        if (dx * dx + dy * dy < 75 * 75) {
          o.dead = true; st.gotas++; Sfx.fx("gota"); puff(o.x, G - o.h, "#7dff3a", 6, 150);
          const prev = st.bar; st.bar = Math.min(1, st.bar + 0.06);
          if (prev < 0.5 && st.bar >= 0.5) { Sfx.say("toxico"); popText("¡ERUCTO LISTO!", "#9dff5a", 46, 1); }
          if (prev < 1 && st.bar >= 1) { Sfx.say("ya_poder"); popText("¡RAYO LISTO!", "#ffe14d", 52, 1.1); }
        }
      } else if (o.type === "bolsita") {
        if (overlap(o)) {
          o.dead = true; if (st.gang.length < 10) st.gang.push(o.color);
          Sfx.say("unete"); popText("¡+1 A LA PANDILLA!", "#ffe14d", 44, 1);
        }
      } else if (!o.hit && !st.tut && p.inv <= 0 && p.rayo <= 0 && overlap(o)) hit(o);
    }
    st.objs = st.objs.filter((o) => o.x > -250 && !(o.dead && o.type !== "barril" && o.type !== "caja" && o.type !== "tubo") && !(o.dead));
  }

  // ---------- render ----------
  function drawWorld() {
    if (!skyGrad) { skyGrad = ctx.createLinearGradient(0, 0, 0, G); skyGrad.addColorStop(0, "#2a6fd6"); skyGrad.addColorStop(1, "#bfe6ff"); }
    ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, W, G);
    ctx.fillStyle = "rgba(255,243,176,.85)"; ctx.beginPath(); ctx.arc(1080, 170, 60, 0, 7); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.85)";
    for (const [x, y, s] of st.clouds) {
      ctx.beginPath(); ctx.ellipse(x, y, 100 * s, 32 * s, 0, 0, 7); ctx.ellipse(x + 45 * s, y - 15 * s, 60 * s, 32 * s, 0, 0, 7); ctx.fill();
    }
    layer("fondo_montes", 0.08); layer("fondo_fabrica", 0.22); layer("fondo_arboles", 0.5);
    ctx.fillStyle = "#8b5a2b"; ctx.fillRect(0, G, W, H - G);
    ctx.fillStyle = "#4caf2a"; ctx.fillRect(0, G - 12, W, 26);
    const off = st.px % 60;
    ctx.fillStyle = "#6e4520";
    for (let x = -off; x < W + 60; x += 60) { rr(x, G + 32, 30, 12, 6); ctx.fill(); }
    const off2 = st.px % 130;
    ctx.strokeStyle = "#a87442"; ctx.lineWidth = 8; ctx.lineCap = "round"; ctx.beginPath();
    for (let x = -off2; x < W + 130; x += 130) { ctx.moveTo(x, G + 85); ctx.lineTo(x + 60, G + 85); }
    ctx.stroke();
  }
  function layer(n, f) {
    const s = S[n]; if (!s) return;
    const off = (st.px * f) % W;
    ctx.drawImage(s.img, -off, 0, W, H); ctx.drawImage(s.img, W - off, 0, W, H);
  }
  function drawObjs() {
    for (const o of st.objs) {
      if (o.dead) continue;
      if (o.type === "barril") spr("barril", o.x, G);
      else if (o.type === "caja") spr("caja", o.x, G, 0.75);
      else if (o.type === "tubo") {
        ctx.fillStyle = "#6f7a88"; ctx.strokeStyle = "#111"; ctx.lineWidth = 4;
        ctx.fillRect(o.x + 5, 0, 35, G - 330); ctx.strokeRect(o.x + 5, -10, 35, G - 320);
        spr("tubo", o.x, G - 125);
      } else if (o.type === "gota") spr("gota", o.x, G - o.h + Math.sin(st.t * 6 + o.x * 0.02) * 4, 0.55);
      else if (o.type === "bolsita") {
        spr(`bolsa_${o.color}${Math.floor(st.t * 6) % 2}`, o.x, G + Math.sin(st.t * 10) * 3);
        txt("¡ÚNETE!", o.x, G - 95 + Math.sin(st.t * 5) * 5, 22, "#ffe14d");
      }
    }
  }
  function drawGoats() {
    const gx = PX - st.goatGap, fr = Math.floor(st.t * 10) % 2;
    spr(`cabra${fr ? 1 : 0}`, gx - 250, G + 2, 0.72, 0.72, 0.95);
    spr(`cabrar${fr ? 0 : 1}`, gx - 135, G + 2, 0.85);
    spr(`cabra${fr}`, gx, G + 2, 1);
    if (st.goatGap < 150 && !st.over) txt("¡BEEE!", gx + 80, G - 250 + Math.sin(st.t * 20) * 3, 32, "#fff");
  }
  function drawPlayer() {
    const p = st.p;
    // pandilla detrás de TMB
    const gx = PX - st.goatGap;
    st.gang.forEach((c, i) => {
      const x = PX - 60 - i * 34; if (x < gx + 95) return;
      const tox = p.rayo > 0 ? "toxica" : c;
      spr(`bolsa_${tox}${(Math.floor(st.t * 10) + i) % 2}`, x, G - (i % 2 ? 6 : 0) - (p.ground ? 0 : Math.min(40, p.y * 0.3)), 0.95);
    });
    const tox = p.rayo > 0;
    if (tox) {
      const g = ctx.createRadialGradient(PX, G - p.y - 100, 10, PX, G - p.y - 100, 170);
      g.addColorStop(0, "rgba(125,255,58,.55)"); g.addColorStop(1, "rgba(125,255,58,0)");
      ctx.fillStyle = g; ctx.fillRect(PX - 180, G - p.y - 280, 360, 360);
    }
    let n;
    if (st.over) n = "tmb_caught";
    else if (p.throwT > 0 || (tox && p.rayo > 0)) n = tox ? "tox_throw" : "tmb_throw";
    else if (!p.ground) n = tox ? "tox_jump" : "tmb_jump";
    else n = (tox ? "tox_run" : "tmb_run") + (Math.floor(st.t * 11) % 2);
    const ducking = p.ground && (p.duck > 0 || p.hold) && !st.over;
    const blink = p.inv > 0 && !st.tut && Math.floor(st.t * 12) % 2 ? 0.35 : 1;
    const bob = p.ground && !ducking ? Math.abs(Math.sin(st.t * 11)) * -4 : 0;
    spr(n, PX, G - p.y + bob, ducking ? 1.12 : 1, ducking ? 0.52 : 1, blink);
    if (tox) {
      const y = G - p.y - 121, flick = 1 + Math.sin(st.t * 40) * 0.08;
      ctx.fillStyle = "rgba(125,255,58,.45)"; ctx.fillRect(PX + 70, y - 34 * flick, W, 68 * flick);
      ctx.fillStyle = "#c8ff8a"; rr(PX + 70, y - 20, W, 40, 20); ctx.fill();
      ctx.fillStyle = "#fff"; rr(PX + 70, y - 7, W, 14, 7); ctx.fill();
    }
  }
  function drawShots() {
    for (const s of st.shots) {
      ctx.strokeStyle = "rgba(125,255,58,.55)"; ctx.lineWidth = 14; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(s.x - 90, s.y + 6); ctx.lineTo(s.x - 10, s.y); ctx.stroke();
      ctx.fillStyle = "#7dff3a"; ctx.strokeStyle = "#111"; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(s.x, s.y, 24 + Math.sin(s.t * 30) * 3, 0, 7); ctx.fill(); ctx.stroke();
    }
  }
  function drawParts() {
    for (const q of st.parts) {
      const a = 1 - q.t / q.life;
      if (q.spr) { ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.rot); spr(q.spr, 0, 0, 0.9, 0.9, a); ctx.restore(); continue; }
      ctx.globalAlpha = Math.max(0, a); ctx.fillStyle = q.c; ctx.fillRect(q.x - q.r / 2, q.y - q.r / 2, q.r, q.r);
    }
    ctx.globalAlpha = 1;
  }
  function drawHUD() {
    ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fillRect(0, 0, W, 92);
    ctx.fillStyle = "#2a6fd6"; rr(20, 20, 180, 52, 14); ctx.fill();
    txt(`${Math.floor(st.dist)} m`, 110, 47, 28, "#fff", "center", null);
    // barra tóxica
    const x0 = 330, w = 620, full = st.bar >= 1;
    txt("BARRA TÓXICA", 640, 22, 17, "#9dff5a", "center", null);
    if (full) { ctx.fillStyle = `rgba(125,255,58,${0.35 + Math.sin(st.t * 8) * 0.2})`; rr(x0 - 6, 32, w + 12, 48, 22); ctx.fill(); }
    ctx.fillStyle = "#222"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 4; rr(x0, 38, w, 36, 16); ctx.fill(); ctx.stroke();
    if (st.bar > 0.01) { ctx.fillStyle = "#7dff3a"; rr(x0 + 5, 43, (w - 10) * st.bar, 26, 12); ctx.fill(); }
    ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.moveTo(x0 + w / 2, 38); ctx.lineTo(x0 + w / 2, 74); ctx.stroke(); ctx.setLineDash([]);
    spr("gota", x0 + w / 2 - 110, 57, 0.3);
    txt("ERUCTO", x0 + w / 2 - 50, 58, 18, "#fff");
    txt("⚡ RAYO", x0 + w - 60, 58, 18, full ? "#ffe14d" : "#fff");
    // pandilla
    ctx.fillStyle = "#fff"; rr(1080, 20, 180, 52, 14); ctx.fill();
    spr("cabeza", 1120, 46, 0.32);
    txt(`x ${st.gang.length}`, 1195, 47, 28, "#111", "center", null);
    // gotas de la partida
    txt(`💧 ${st.gotas}`, 30, 112, 24, "#b8ff8c", "left");
    // botón de pausa
    ctx.fillStyle = "rgba(255,255,255,.9)"; ctx.beginPath(); ctx.arc(1232, 128, 28, 0, 7); ctx.fill();
    ctx.fillStyle = "#111"; ctx.fillRect(1221, 114, 8, 28); ctx.fillRect(1235, 114, 8, 28);
    // peligro
    if (st.goatGap < 150 && !st.over) {
      const a = (150 - st.goatGap) / 150 * (0.35 + Math.sin(st.t * 10) * 0.1);
      const g = ctx.createLinearGradient(0, 0, 260, 0); g.addColorStop(0, `rgba(255,40,60,${a})`); g.addColorStop(1, "rgba(255,40,60,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 92, 260, H - 92);
    }
  }
  function drawTexts() {
    let y = 200;
    for (const t of st.texts) {
      const sc = Math.min(1, t.t / 0.15), a = t.t > t.dur - 0.3 ? (t.dur - t.t) / 0.3 : 1;
      ctx.save(); ctx.globalAlpha = Math.max(0, a); ctx.translate(640, y); ctx.scale(sc, sc);
      txt(t.s, 0, 0, t.size, t.color); ctx.restore(); y += t.size + 10;
    }
  }
  function drawTutorial() {
    const tu = st.tut; if (!tu || !tu.need) return;
    const step = TUT[tu.step], [l1, l2] = step.tx();
    ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(0, 92, W, H - 92);
    ctx.fillStyle = "#fff"; ctx.strokeStyle = "#111"; ctx.lineWidth = 6; rr(340, 130, 600, 140, 30); ctx.fill(); ctx.stroke();
    txt(l1, 640, 175, 40, "#111", "center", null); txt(l2, 640, 228, 44, "#2a9d1a", "center", null);
    txt(`Primera partida · ${tu.step + 1} de 3`, 640, 690, 24, "#fff");
    const ph = (st.t * 1.2) % 1;
    if (inputMode === "touch") {
      let hx = 1080, hy = 430;
      if (step.need === "duck") hy += ph * 120;
      if (step.need === "power") hx += ph * 150 - 60;
      if (step.need === "jump") { ctx.fillStyle = `rgba(255,255,255,${0.5 - ph * 0.5})`; ctx.beginPath(); ctx.arc(1080, 420, 30 + ph * 50, 0, 7); ctx.fill(); }
      drawHand(hx, hy);
    } else {
      const key = { jump: "ESPACIO", duck: "↓", power: "→" }[step.need];
      const kw = key.length > 2 ? 230 : 110, press = ph < 0.3 ? 6 : 0;
      ctx.fillStyle = "#111"; rr(1080 - kw / 2, 380 + 8, kw, 100, 18); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.strokeStyle = "#111"; ctx.lineWidth = 6; rr(1080 - kw / 2, 380 + press, kw, 92, 18); ctx.fill(); ctx.stroke();
      txt(key, 1080, 426 + press, key.length > 2 ? 34 : 56, "#111", "center", null);
    }
  }
  function drawHand(x, y) {
    ctx.save(); ctx.translate(x, y); ctx.scale(0.9, 0.9);
    ctx.fillStyle = "#fff"; ctx.strokeStyle = "#111"; ctx.lineWidth = 5; ctx.lineJoin = "round";
    rr(-14, -70, 28, 80, 14); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-14, -5); ctx.quadraticCurveTo(-50, -10, -45, 30); ctx.lineTo(-35, 80);
    ctx.quadraticCurveTo(-20, 110, 25, 110); ctx.quadraticCurveTo(60, 105, 62, 60); ctx.lineTo(62, 0);
    ctx.quadraticCurveTo(62, -18, 46, -18); ctx.quadraticCurveTo(32, -18, 32, 0); ctx.quadraticCurveTo(32, -25, 16, -25);
    ctx.quadraticCurveTo(2, -25, 2, -5); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  function render() {
    ctx.setTransform(k, 0, 0, k, 0, 0);
    if (st.shake > 0) ctx.translate(rnd(-8, 8) * st.shake * 2, rnd(-6, 6) * st.shake * 2);
    drawWorld(); drawObjs(); drawGoats(); drawPlayer(); drawShots(); drawParts(); drawHUD(); drawTexts(); drawTutorial();
  }

  // ---------- bucle ----------
  function frame(ts) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, last ? (ts - last) / 1000 : 0); last = ts;
    if (!st.paused) update(dt);
    render();
  }

  // ---------- controles ----------
  const KEYS = { Space: "jump", ArrowUp: "jump", KeyW: "jump", ArrowDown: "duckKey", KeyS: "duckKey", ArrowRight: "power", KeyD: "power", Enter: "power" };
  function onKey(e) {
    if (!st) return;
    if (e.code === "KeyP" || e.code === "Escape") { e.preventDefault(); if (!st.over) cb.onPause && cb.onPause(); return; }
    const a = KEYS[e.code]; if (!a) return;
    e.preventDefault(); if (e.repeat) return;
    inputMode = "keys"; act(a);
  }
  function onKeyUp(e) { if (st && (e.code === "ArrowDown" || e.code === "KeyS")) st.p.hold = false; }
  let ptr = null;
  function stagePos(e) { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; }
  function onDown(e) {
    if (!st) return;
    if (e.pointerType === "touch") inputMode = "touch";
    const p = stagePos(e);
    if (Math.hypot(p.x - 1232, p.y - 128) < 44) { if (!st.over) cb.onPause && cb.onPause(); return; }
    ptr = { id: e.pointerId, x: p.x, y: p.y, fired: false };
    e.preventDefault();
  }
  function onMove(e) {
    if (!ptr || ptr.fired || e.pointerId !== ptr.id) return;
    const p = stagePos(e), dx = p.x - ptr.x, dy = p.y - ptr.y;
    if (dy > 45 && dy > Math.abs(dx)) { ptr.fired = true; act("duckSwipe"); }
    else if (dx > 55 && dx > Math.abs(dy)) { ptr.fired = true; act("power"); }
    else if (dy < -60 && -dy > Math.abs(dx)) { ptr.fired = true; act("jump"); }
  }
  function onUp(e) {
    if (!ptr || e.pointerId !== ptr.id) return;
    if (!ptr.fired) act("jump");
    ptr = null;
  }

  // ---------- API ----------
  E.start = function (opts) {
    cb = opts || {};
    st = nuevo(!!cb.tutorial);
    last = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
    window.addEventListener("keydown", onKey); window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("pointerdown", onDown); window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp); window.addEventListener("pointercancel", onUp);
    Sfx.music("cabras");
    if (!cb.tutorial) { Sfx.say("a_correr"); popText("¡A CORRER!", "#ffe14d", 90, 1.4); }
  };
  E.stop = function () {
    cancelAnimationFrame(raf); st = null; ptr = null;
    window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onKeyUp);
    canvas.removeEventListener("pointerdown", onDown); window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp); window.removeEventListener("pointercancel", onUp);
    Sfx.stopMusic();
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
  E.pause = function () { if (st && !st.over) { st.paused = true; Sfx.stopMusic(); } };
  E.resume = function () { if (st) { st.paused = false; last = 0; Sfx.music("cabras"); } };
  E.isRunning = () => !!st && !st.over;
  E._debug = () => st;  // para pruebas
  window.Escape = E;
})();
