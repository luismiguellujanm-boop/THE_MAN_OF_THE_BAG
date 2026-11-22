// ===== ESCAPE DE LAS CABRAS v2 =====
// Modos: "nivel" (mundo/nivel/dificultad con meta y estrellas), "infinito" (por mundo) y "vivo" (carrera en línea).
// Teclado: Espacio/↑/W saltar (dos veces = doble salto) · ↓/S agacharse · →/D/Enter poder adelante · ←/A bomba atrás · P/Esc pausa
// Celular: tocar saltar · deslizar abajo agacharse · deslizar adelante poder · deslizar atrás bomba
(function () {
  const W = 1280, H = 720, G = 585, PX = 300;
  const BAGS = ["rosa", "azul", "verde", "lila", "naranja"];
  const HERD = ["blanca", "rosa", "azul", "amarilla", "lila", "naranja", "verde", "blanca"];
  const E = {};
  let canvas, ctx, k = 1, st = null, raf = 0, last = 0, cb = {}, eq = null, L = null, WD = null;
  let inputMode = matchMedia("(pointer: coarse)").matches ? "touch" : "keys";
  const spr = (...a) => Gfx.spr(ctx, ...a), rr = (...a) => Gfx.rr(ctx, ...a), txt = (...a) => Gfx.txt(ctx, ...a);
  let rand = Math.random;
  const rnd = (a, b) => a + rand() * (b - a);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const fxr = (a, b) => a + Math.random() * (b - a);   // efectos visuales (no afectan la partida)

  E.setup = function (cv) { canvas = cv; ctx = cv.getContext("2d"); };
  E.resize = function (scale) { k = Math.min(2, Math.max(1, scale * (window.devicePixelRatio || 1))); canvas.width = Math.round(W * k); canvas.height = Math.round(H * k); };

  // ---------- estado ----------
  function nuevo() {
    return {
      t: 0, px: 0, dist: 0, speed: L.speed, slow: 0, bar: 0, gotas: 0, hits: 0, paused: false, freeze: false,
      p: { y: 0, vy: 0, jumps: 0, ground: true, duck: 0, hold: false, inv: 0, throwT: 0, rayo: 0, coyote: 0, buffer: 0, front: 0, shield: 0 },
      gang: [], goatGap: L.boss ? 190 : 220, stun: 0, objs: [], shots: [], bombs: [], parts: [], icons: [],
      next: 600, nextStamp: L.stampEvery ? Math.max(120, L.stampEvery * 0.45) : 1e9, stamp: null, loca: null,
      over: false, overT: 0, sent: false, beeeT: 0, shake: 0, win: false, cloud: 0, hintT: 0,
      clouds: [[150, 140, 1], [560, 100, 0.8], [900, 190, 0.9], [1220, 130, 0.7]],
      tut: cb.tutorial ? { step: 0, at: 1.2, spawned: false, need: null, obj: null } : null,
      sendT: 0,
    };
  }

  // ---------- voz: TMB voltea a la pantalla cuando habla ----------
  function say(key) { Sfx.say(key); if (st) st.p.front = Math.max(st.p.front, 0.9); }

  // ---------- acciones ----------
  function jump() {
    const p = st.p;
    if (p.ground || p.coyote > 0) { p.vy = 1150; p.ground = false; p.jumps = 1; p.coyote = 0; Sfx.fx("salto"); }
    else if (p.jumps < 2) { p.vy = 950; p.jumps = 2; Sfx.fx("salto2"); puff(PX, G - p.y, "#fff", 6); }
    else p.buffer = 0.12;
  }
  function duck(t) { const p = st.p; if (!p.ground) p.vy = -1700; p.duck = Math.max(p.duck, t); }
  function power() {
    const p = st.p; if (p.rayo > 0) return;
    if (st.bar >= 1) {
      p.rayo = 3.6; st.bar = 0; p.throwT = 0.4; st.shake = 0.4;
      Sfx.play("rayo_mutante_completo", 0.9); say("rayo"); Prog.stat("rayos"); Prog.ev("rayo");
      setTimeout(() => Sfx.fx("beee"), 900);
    } else if (st.bar >= 0.5) {
      st.bar -= 0.5; p.throwT = 0.35;
      st.shots.push({ x: PX + 70, y: G - p.y - 118, vx: st.speed + 850, t: 0 });
      Sfx.play("eructo_toxico"); say("eructo"); Prog.stat("eructos"); Prog.ev("eructo");
    } else { Sfx.fx("falta"); icon("gota", PX + 60, G - p.y - 220, "?"); }
  }
  function bomb() {
    const p = st.p;
    if (st.bar < 1) { Sfx.fx("falta"); icon("gota", PX - 60, G - p.y - 220, "?"); return; }
    st.bar = 0; p.throwT = 0.35;
    st.bombs.push({ x: PX - 20, y: G - p.y - 120, vx: -560, vy: 480, t: 0 });
    Sfx.fx("salto2"); say("bomba"); Prog.stat("bombas"); Prog.ev("bomba");
  }
  function act(a) {
    if (!st || st.over || st.paused || st.win) return;
    const tu = st.tut;
    if (tu && tu.need) {
      const want = { jump: "jump", duckKey: "duck", duckSwipe: "duck", power: "power", bomb: "x" }[a];
      if (want !== tu.need) return;
      tu.need = null; tu.done = true; st.freeze = false;
      if (want === "duck") { duck(1.05); return; }
    }
    if (a === "jump") jump();
    else if (a === "duckKey") { st.p.hold = true; duck(0.3); }
    else if (a === "duckSwipe") duck(0.75);
    else if (a === "power") power();
    else if (a === "bomb") bomb();
  }

  // ---------- efectos ----------
  function icon(n, x, y, label) { st.icons.push({ n, x, y, label, t: 0 }); }
  function puff(x, y, color, n = 10, sp = 260) {
    for (let i = 0; i < n; i++) st.parts.push({ x, y, vx: fxr(-sp, sp), vy: fxr(-sp, sp * 0.3), life: fxr(0.4, 0.8), t: 0, c: color, r: fxr(4, 10) });
  }
  function boom(o) {
    o.dead = true; Sfx.fx("boom"); st.shake = 0.25;
    const y = DATA.OBST[o.type] && DATA.OBST[o.type].hang ? G - 170 : G - 50;
    puff(o.x, y, "#7dff3a", 16, 380); puff(o.x, y, "#8a8f99", 12, 340);
  }

  // ---------- creación de obstáculos ----------
  function add(type, x, extra) { const o = Object.assign({ type, x }, extra || {}); st.objs.push(o); return o; }
  function gotasArco(x) { [[-110, 150], [0, 215], [110, 150]].forEach(([dx, h]) => add("gota", x + dx, { h })); }
  function spawn() {
    const x = W + 120, d = st.dist, J = WD.jump, D = WD.duck;
    if (L.vivo && rand() < 0.14) return add("sorpresa", x, { h: 120 });
    if (rand() < (st.gang.length < 2 ? 0.15 : 0.07)) return add("bolsita", x, { color: pick(BAGS) });
    const pats = ["salto", "salto_gotas", "agacha", "agacha_gotas", "gotas", "gotas"];
    if (d > 100 || L.w > 1) pats.push("doble", "combo", "salto_gotas");
    if (L.w >= 3 || d > 500) pats.push("combo", "doble");
    switch (pick(pats)) {
      case "salto": add(pick(J), x); break;
      case "salto_gotas": add(pick(J), x); gotasArco(x); break;
      case "doble": { const a = pick(J); add(a, x); add(a, x + (DATA.OBST[a].w * 2 + 10)); gotasArco(x + 40); break; }
      case "agacha": add(pick(D), x); break;
      case "agacha_gotas": add(pick(D), x); [-70, 0, 70].forEach((dx) => add("gota", x + dx, { h: 45 })); break;
      case "gotas": { const wave = rand() < 0.5; for (let i = 0; i < 6; i++) add("gota", x + i * 70, { h: wave ? 60 + Math.sin(i / 5 * Math.PI) * 120 : 45 }); break; }
      case "combo": add(pick(J), x); add(pick(D), x + targetSpeed() * 1.0); break;
    }
  }
  const targetSpeed = () => Math.min(980, L.speed + st.dist * L.speedUp);

  // ---------- estampida de frente y cabra loca ----------
  function startStampede() {
    const n = 5 + L.d + (L.boss ? 2 : 0);
    st.stamp = { phase: "warn", t: 0, goats: Array.from({ length: n }, () => pick(HERD.slice(1))), x: W + 80, hit: false };
    say("se_acercan");
    if (!Store.get("hint_doble", false)) { st.hintT = 2.6; setTimeout(() => say("doble_salto"), 1300); Store.set("hint_doble", true); }
  }
  function updStampede(dt) {
    const s = st.stamp;
    if (!s) { if (st.dist >= st.nextStamp && !st.tut && !st.win) startStampede(); return; }
    s.t += dt;
    if (s.phase === "warn") { if (s.t > 1.8) { s.phase = "run"; Sfx.fx("beee"); } return; }
    s.x -= (st.speed + 260) * dt;
    const p = st.p;
    s.goats.forEach((c, i) => {
      const gx = s.x + i * 78;
      if (!s.hit && p.inv <= 0 && p.rayo <= 0 && p.shield <= 0 && Math.abs(gx - PX) < 52 && p.y < 100) { s.hit = true; hit(); }
    });
    if (s.x + s.goats.length * 78 < -120) {
      if (!s.hit) { Prog.stat("estampidas"); Prog.stat("cabras", s.goats.length); Prog.ev("estampida"); }
      st.stamp = null;
      st.nextStamp = L.stampEvery ? st.dist + L.stampEvery * rnd(0.85, 1.2) * (L.endless ? Math.max(0.6, 1 - st.dist / 6000) : 1) : 1e9;
      if (L.loca && rand() < 0.75) st.loca = { x: W + 140 + 300, ph: 0, t: 0, warned: false, hit: false };
    }
  }
  function updLoca(dt) {
    const c = st.loca; if (!c) return;
    c.t += dt; c.ph += dt * 3.3;
    if (!c.warned && c.x < W + 200) { c.warned = true; say("cabra_loca"); }
    c.x -= (st.speed + 170) * dt;
    c.h = Math.abs(Math.sin(c.ph)) * 200;
    const p = st.p, ptop = p.y + (p.ground && (p.duck > 0 || p.hold) ? 95 : 185);
    if (!c.hit && p.inv <= 0 && p.rayo <= 0 && p.shield <= 0 && Math.abs(c.x - PX) < 55 && c.h + 90 > p.y && c.h < ptop) { c.hit = true; hit(); }
    if (c.x < -200) { if (!c.hit) Prog.stat("cabras"); st.loca = null; }
  }

  // ---------- tutorial (primera partida): solo íconos y voz ----------
  const TUT = [{ obj: "barril", need: "jump", voz: () => (inputMode === "touch" ? "saltar" : "saltar_teclado") },
    { obj: "tubo", need: "duck", voz: () => "agacharse" }, { obj: "caja", need: "power", voz: () => "poder" }];
  function tutUpdate() {
    const tu = st.tut;
    if (tu.step >= TUT.length) { say("a_correr"); Store.set("tut_escape", true); st.tut = null; st.next = 500; return; }
    const step = TUT[tu.step];
    if (!tu.spawned && st.t > tu.at) {
      if (step.need === "power") st.bar = Math.max(st.bar, 0.5);
      tu.obj = add(step.obj, W + 120); tu.spawned = true; tu.done = false;
    }
    if (tu.spawned && !tu.done && !tu.need && tu.obj.x < PX + 270) { tu.need = step.need; st.freeze = true; say(step.voz()); }
    if (tu.spawned && tu.done && (tu.obj.dead || tu.obj.x < PX - 160)) { tu.step++; tu.spawned = false; tu.at = st.t + 0.7; }
  }

  // ---------- golpes, cajas sorpresa y final ----------
  function hit(o) {
    if (o) o.hit = true;
    st.shake = 0.3; Sfx.fx("golpe"); st.hits++;
    const p = st.p;
    if (st.gang.length > 0) {
      const c = st.gang.pop(); p.inv = 1.0; st.goatGap -= 15;
      st.parts.push({ x: PX - 60, y: G - 40, vx: -420, vy: 420, life: 0.9, t: 0, spr: `bolsa_${c}0`, rot: 0 });
      say("casi");
    } else {
      st.goatGap -= 105; p.inv = 1.3; st.slow = 0.9; say("las_cabras"); Sfx.fx("beee");
    }
  }
  function sorpresa() {
    // en vivo: el que va más atrás recibe mejores poderes
    const lugar = E.vivoLugar ? E.vivoLugar() : 1, total = E.vivoTotal ? E.vivoTotal() : 1;
    const atras = total > 1 ? (lugar - 1) / (total - 1) : 0;
    const r = Math.random();
    let fx;
    if (atras > 0.5) fx = r < 0.45 ? "cabra" : r < 0.75 ? "nube" : r < 0.9 ? "escudo" : "platano";
    else fx = r < 0.35 ? "escudo" : r < 0.65 ? "platano" : r < 0.85 ? "nube" : "cabra";
    Sfx.fx("caja");
    if (fx === "escudo") { st.p.shield = 5; icon("caja_sorpresa", PX, G - 260, "🛡️"); }
    else { cb.vivo && cb.vivo.lanzar(fx); icon("caja_sorpresa", PX, G - 260, { cabra: "🐐", nube: "☁️", platano: "🍌" }[fx]); }
  }
  // efectos que te mandan los rivales
  E.recibir = function (fx) {
    if (!st || st.over) return;
    if (st.p.shield > 0) { icon("caja_sorpresa", PX, G - 260, "🛡️"); return; }
    if (fx === "cabra") { st.goatGap -= 90; Sfx.fx("beee"); say("las_cabras"); }
    if (fx === "nube") { st.cloud = 3.2; Sfx.fx("puf"); }
    if (fx === "platano") add("platano", W + 60);
  };
  function gameOver() {
    st.over = true; st.p.rayo = 0; Sfx.stopMusic(); say("atrapado"); Sfx.fx("beee"); st.shake = 0.5;
    if (cb.vivo) cb.vivo.fuera(Math.floor(st.dist));
  }
  function ganar() {
    st.win = true; st.winT = 0; Sfx.stopMusic(); Sfx.fx("tada"); say("nivel");
    puff(PX + 60, G - 200, "#ffd400", 30, 500);
  }
  E.vivoGanar = function () { if (st && !st.over && !st.win) { st.win = true; st.winT = 0; Sfx.stopMusic(); Sfx.fx("tada"); } };

  // ---------- choques ----------
  function box(o) {
    const O = DATA.OBST[o.type];
    if (O && O.hang) return [o.x - O.w, o.x + O.w, 0, G - 135];
    if (O) return [o.x - O.w, o.x + O.w, G - O.h, G];
    if (o.type === "bolsita") return [o.x - 28, o.x + 28, G - 70, G];
    if (o.type === "sorpresa") return [o.x - 34, o.x + 34, G - o.h - 34, G - o.h + 34];
    return null;
  }
  function overlap(o) {
    const p = st.p, ducking = p.ground && (p.duck > 0 || p.hold);
    const top = G - p.y - (ducking ? 95 : 185), bot = G - p.y, l = PX - 26, r = PX + 26, b = box(o);
    return b && r > b[0] && l < b[1] && bot > b[2] && top < b[3];
  }

  // ---------- actualización ----------
  function update(dt) {
    st.t += dt;
    const p = st.p;
    if (st.shake > 0) st.shake -= dt;
    st.icons = st.icons.filter((q) => (q.t += dt) < 1.1);
    st.parts = st.parts.filter((q) => { q.t += dt; q.vy -= 900 * dt; q.x += q.vx * dt; q.y -= q.vy * dt; if (q.rot !== undefined) q.rot += dt * 8; return q.t < q.life; });
    if (cb.vivo) { st.sendT -= dt; if (st.sendT <= 0) { st.sendT = 0.2; cb.vivo.pos(Math.floor(st.dist), st.over); } }
    if (st.over) {
      st.overT += dt; st.goatGap = Math.max(-40, st.goatGap - 260 * dt);
      if (st.overT > 1.7 && !st.sent) { st.sent = true; fin(false); }
      return;
    }
    if (st.win) {
      st.winT += dt; st.px += 300 * dt; st.goatGap += 200 * dt;
      if (st.winT > 1.8 && !st.sent) { st.sent = true; fin(true); }
      return;
    }
    if (st.tut) tutUpdate();
    const tdt = st.freeze ? 0 : dt;
    st.hintT -= dt; st.cloud -= dt;

    st.slow -= tdt;
    st.speed = targetSpeed() * (st.slow > 0 ? 0.65 : 1);
    const mv = st.speed * tdt;
    st.px += mv; st.dist = st.px / 60;
    if (L.meta && st.dist >= L.meta) return ganar();

    // física
    p.vy -= 3300 * tdt; p.y += p.vy * tdt;
    if (p.y <= 0) {
      if (!p.ground) puff(PX, G, "#e8d3a8", 5, 120);
      p.y = 0; p.vy = 0; p.ground = true; p.jumps = 0;
      if (p.buffer > 0) { p.buffer = 0; jump(); }
    } else if (p.ground) { p.ground = false; p.coyote = 0.08; }
    for (const kk of ["coyote", "buffer", "duck", "inv", "throwT", "front", "shield"]) p[kk] -= tdt;

    // cabras de atrás
    const recover = L.boss ? 4 : 7;
    if (st.stun > 0) { st.stun -= tdt; st.goatGap = Math.min(430, st.goatGap + 140 * tdt); }
    else if (p.rayo > 0) { p.rayo -= tdt; st.goatGap = Math.min(340, st.goatGap + 220 * tdt); }
    else if (st.goatGap < 230) st.goatGap += recover * tdt;
    if (p.rayo > 0 && st.stun > 0) p.rayo -= tdt;
    if (p.rayo > 0) for (const o of st.objs) if (!o.dead && DATA.OBST[o.type] && o.x > PX + 40 && o.x < W + 40) boom(o);
    st.beeeT -= tdt;
    if (st.goatGap < 150 && st.beeeT <= 0) { Sfx.fx("beee"); st.beeeT = 2.5; }
    if (st.goatGap <= 55 && !st.tut) return gameOver();

    if (!st.tut) { st.next -= mv; if (st.next <= 0) { spawn(); st.next = targetSpeed() * rnd(1.15, 1.75) * L.gap; } }
    updStampede(tdt); updLoca(tdt);
    for (const c of st.clouds) { c[0] -= mv * 0.05 + 8 * tdt; if (c[0] < -200) c[0] = W + 200; }

    // eructos
    for (const s of st.shots) {
      s.x += s.vx * tdt; s.t += tdt;
      for (const o of st.objs) if (!o.dead && !s.dead && DATA.OBST[o.type] && Math.abs(o.x - s.x) < 45) { boom(o); s.dead = true; }
      if (s.x > W + 60) s.dead = true;
    }
    st.shots = st.shots.filter((s) => !s.dead);
    // bombas apestosas hacia atrás
    for (const b of st.bombs) {
      b.t += tdt; b.vy -= 1500 * tdt; b.x += b.vx * tdt; b.y -= b.vy * tdt;
      if (b.y > G - 30 || b.x < PX - st.goatGap + 60) {
        b.dead = true; st.stun = 3.6; Sfx.fx("bomba"); setTimeout(() => Sfx.fx("beee"), 300); st.shake = 0.35;
        for (let i = 0; i < 26; i++) st.parts.push({ x: b.x + fxr(-60, 60), y: G - fxr(20, 140), vx: fxr(-120, 120), vy: fxr(20, 160), life: fxr(1, 1.8), t: 0, c: i % 3 ? "#9dff5a" : "#5ccf22", r: fxr(18, 40), cloud: true });
      }
    }
    st.bombs = st.bombs.filter((b) => !b.dead);

    // objetos
    for (const o of st.objs) {
      o.x -= mv;
      if (o.dead) continue;
      if (o.type === "gota") {
        const dx = o.x - PX, dy = (G - o.h) - (G - p.y - 90);
        if (dx * dx + dy * dy < 75 * 75) {
          o.dead = true; st.gotas++; Sfx.fx("gota"); puff(o.x, G - o.h, "#7dff3a", 6, 150); Prog.ev("gota");
          const prev = st.bar; st.bar = Math.min(1, st.bar + 0.06);
          if (prev < 0.5 && st.bar >= 0.5) say("toxico");
          if (prev < 1 && st.bar >= 1) say("ya_poder");
        }
      } else if (o.type === "bolsita") {
        if (overlap(o)) {
          o.dead = true; if (st.gang.length < 10) st.gang.push(o.color);
          p.front = 0.8; say("unete"); Prog.ev("bolsita"); Prog.stat("maxPandilla", st.gang.length, true);
          icon(`bolsa_${o.color}0`, PX, G - 230, "+1");
        }
      } else if (o.type === "sorpresa") {
        if (overlap(o)) { o.dead = true; sorpresa(); }
      } else if (!o.hit && !st.tut && p.inv <= 0 && p.rayo <= 0 && p.shield <= 0 && overlap(o)) hit(o);
      else if (!o.passed && !o.hit && o.x < PX - 40 && DATA.OBST[o.type]) { o.passed = true; Prog.ev("obst"); }
    }
    st.objs = st.objs.filter((o) => o.x > -250 && !o.dead);
  }

  function fin(win) {
    const metros = Math.floor(st.dist);
    const stars = L.meta ? [win, st.gotas >= L.gotasMeta, win && st.hits === 0].filter(Boolean).length : 0;
    Prog.stat("partidas"); Prog.stat("gotas", st.gotas);
    cb.onOver && cb.onOver({ win, metros, gotas: st.gotas, stars, hits: st.hits, score: DATA.score(L, metros, st.gotas, stars, win), L });
  }

  // ---------- render ----------
  let skyGrad = null, skyKey = "";
  function drawWorld() {
    const key = WD.id + ":" + k;
    if (skyKey !== key) { skyGrad = ctx.createLinearGradient(0, 0, 0, G); skyGrad.addColorStop(0, WD.sky[0]); skyGrad.addColorStop(1, WD.sky[1]); skyKey = key; }
    ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, W, G);
    ctx.globalAlpha = 0.85; ctx.fillStyle = WD.sun; ctx.beginPath(); ctx.arc(1080, 170, 60, 0, 7); ctx.fill();
    ctx.fillStyle = "#fff";
    for (const [x, y, s] of st.clouds) { ctx.beginPath(); ctx.ellipse(x, y, 100 * s, 32 * s, 0, 0, 7); ctx.ellipse(x + 45 * s, y - 15 * s, 60 * s, 32 * s, 0, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
    layer(`m${WD.id}_far`, 0.08); layer(`m${WD.id}_mid`, 0.22); layer(`m${WD.id}_near`, 0.5);
    ctx.fillStyle = WD.ground; ctx.fillRect(0, G, W, H - G);
    ctx.fillStyle = WD.grass; ctx.fillRect(0, G - 12, W, 26);
    ctx.fillStyle = "rgba(0,0,0,.18)";
    const off = st.px % 60; for (let x = -off; x < W + 60; x += 60) { rr(x, G + 32, 30, 12, 6); ctx.fill(); }
    const off2 = st.px % 130; ctx.strokeStyle = "rgba(255,255,255,.15)"; ctx.lineWidth = 8; ctx.lineCap = "round"; ctx.beginPath();
    for (let x = -off2; x < W + 130; x += 130) { ctx.moveTo(x, G + 85); ctx.lineTo(x + 60, G + 85); } ctx.stroke();
    // meta del nivel
    if (L.meta) {
      const fx = PX + (L.meta - st.dist) * 60;
      if (fx < W + 100) {
        ctx.fillStyle = "#fff"; ctx.fillRect(fx, G - 260, 8, 260);
        for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { ctx.fillStyle = (i + j) % 2 ? "#111" : "#fff"; ctx.fillRect(fx + 8 + i * 20, G - 260 + j * 20, 20, 20); }
      }
    }
  }
  function layer(n, f) {
    const s = Gfx.S[n]; if (!s) return;
    const off = (st.px * f) % W; ctx.drawImage(s.img, s.x, s.y, s.w, s.h, -off, 0, W, H); ctx.drawImage(s.img, s.x, s.y, s.w, s.h, W - off, 0, W, H);
  }
  function drawObjs() {
    for (const o of st.objs) {
      if (o.dead) continue;
      const O = DATA.OBST[o.type];
      if (O && O.hang) {
        ctx.fillStyle = O.col; ctx.strokeStyle = "#111"; ctx.lineWidth = 3;
        const w = O.pole[1] - O.pole[0]; ctx.fillRect(o.x + O.pole[0], -10, w, G - 325); ctx.strokeRect(o.x + O.pole[0], -10, w, G - 325);
        spr(o.type, o.x, G - 125);
      } else if (O) spr(o.type, o.x, G, O.sc);
      else if (o.type === "gota") spr("gota", o.x, G - o.h + Math.sin(st.t * 6 + o.x * 0.02) * 4, 0.55);
      else if (o.type === "bolsita") spr(`bolsa_${o.color}${Math.floor(st.t * 6) % 2}`, o.x, G + Math.sin(st.t * 10) * 3);
      else if (o.type === "sorpresa") spr("caja_sorpresa", o.x, G - o.h + Math.sin(st.t * 4) * 8, 0.6, 0.6, 1, Math.sin(st.t * 3) * 0.2);
    }
  }
  function drawHerd() {
    const gx = PX - st.goatGap, fr = Math.floor(st.t * 10) % 2;
    const n = HERD.length;
    for (let i = n - 1; i >= 0; i--) {
      const x = gx - i * 64 - (i % 2) * 10, y = G + 2 - (i % 3) * 4;
      if (x < -120) continue;
      spr(`cabra_${HERD[i]}${(fr + i) % 2}`, x, y, 0.85 - (i % 2) * 0.06);
      if (st.stun > 0) for (let j = 0; j < 2; j++) { const a = st.t * 6 + j * 3 + i; Gfx.star(ctx, x + 40 + Math.cos(a) * 26, y - 125 + Math.sin(a) * 8, 9); }
    }
    if (L.boss) {
      spr(`cabra_jefa${fr}`, gx - 110, G + 4, 1.3);
      if (st.stun > 0) Gfx.star(ctx, gx - 40, G - 210, 14);
    }
    if (st.goatGap < 150 && !st.over) txt("¡BEEE!", gx + 80, G - 190 + Math.sin(st.t * 20) * 3, 30, "#fff");
  }
  function drawStampede() {
    const s = st.stamp;
    if (s) {
      if (s.phase === "warn") {
        const a = 0.6 + Math.sin(st.t * 18) * 0.4;
        ctx.fillStyle = `rgba(255,40,60,${0.12 * a})`; ctx.fillRect(W - 230, 92, 230, H - 92);
        ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = "#ffd400"; ctx.strokeStyle = "#111"; ctx.lineWidth = 8; ctx.lineJoin = "round";
        ctx.beginPath(); ctx.moveTo(1150, 250); ctx.lineTo(1240, 400); ctx.lineTo(1060, 400); ctx.closePath(); ctx.fill(); ctx.stroke();
        txt("!", 1150, 360, 90, "#111", "center", null);
        ctx.fillStyle = "#ff3b4f"; ctx.beginPath(); ctx.moveTo(1040, 470); ctx.lineTo(980, 500); ctx.lineTo(1040, 530); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
        for (let i = 0; i < 6; i++) { ctx.fillStyle = "rgba(232,211,168,.6)"; ctx.beginPath(); ctx.arc(W - 20 + i * 30 - (s.t * 30) % 30, G - 10 - (i % 2) * 10, 22, 0, 7); ctx.fill(); }
      } else {
        const fr = Math.floor(st.t * 10) % 2;
        s.goats.forEach((c, i) => {
          const gx = s.x + i * 78;
          ctx.save(); ctx.translate(gx, 0); ctx.scale(-1, 1); spr(`cabra_${c}${(fr + i) % 2}`, 0, G + 2, 0.78); ctx.restore();
          ctx.fillStyle = "rgba(232,211,168,.55)"; ctx.beginPath(); ctx.arc(gx + 40, G - 8, 20, 0, 7); ctx.fill();
        });
      }
    }
    const c = st.loca;
    if (c) { ctx.save(); ctx.translate(c.x, 0); ctx.scale(-1, 1); spr(`cabra_loca${Math.floor(st.t * 10) % 2}`, 0, G - c.h, 0.85, 0.85, 1, -0.25 + Math.sin(c.ph * 2) * 0.2); ctx.restore(); }
    // ayuda del doble salto (solo la primera vez): ícono, sin texto
    if (st.hintT > 0) {
      const ph = (st.t * 2.2) % 1;
      if (inputMode === "touch") {
        drawHand(760, 230 + (ph < 0.5 ? 0 : 10));
        for (const dx of [-30, 30]) { ctx.fillStyle = `rgba(255,255,255,${0.6 - ph * 0.5})`; ctx.beginPath(); ctx.arc(760 + dx, 220, 24 + ph * 20, 0, 7); ctx.fill(); }
      } else keyCap("ESPACIO ×2", 760, 150, ph < 0.3);
    }
  }
  function drawPlayer() {
    const p = st.p, gx = PX - st.goatGap, tox = p.rayo > 0;
    st.gang.forEach((c, i) => {
      const x = PX - 60 - i * 34; if (x < gx + 95) return;
      spr(`bolsa_${tox ? "toxica" : c}${(Math.floor(st.t * 10) + i) % 2}`, x, G - (i % 2 ? 6 : 0) - (p.ground ? 0 : Math.min(40, p.y * 0.3)), 0.95);
    });
    // fantasmas de los rivales (en vivo)
    if (cb.vivo) for (const g of cb.vivo.rivales()) {
      const x = PX + (g.d - st.dist) * 60; if (x < -100 || x > W + 100) continue;
      ctx.save(); ctx.globalAlpha = g.out ? 0.2 : 0.42; spr(Gfx.tmb(g.skin, `run${Math.floor(st.t * 11) % 2}`), x, G, 0.95); ctx.restore();
      txt(g.apodo, x, G - 215, 20, g.out ? "#999" : "#fff");
    }
    if (tox) {
      const g = ctx.createRadialGradient(PX, G - p.y - 100, 10, PX, G - p.y - 100, 170);
      g.addColorStop(0, "rgba(125,255,58,.55)"); g.addColorStop(1, "rgba(125,255,58,0)"); ctx.fillStyle = g; ctx.fillRect(PX - 180, G - p.y - 280, 360, 360);
    }
    if (p.shield > 0) { ctx.strokeStyle = `rgba(127,211,255,${0.5 + Math.sin(st.t * 10) * 0.3})`; ctx.lineWidth = 8; ctx.beginPath(); ctx.ellipse(PX, G - p.y - 95, 80, 115, 0, 0, 7); ctx.stroke(); }
    const veh = eq.vehiculo, ducking = p.ground && (p.duck > 0 || p.hold) && !st.over;
    let pose, view = "side";
    if (st.over) { pose = "caught"; view = "front"; }
    else if (st.win) { pose = "flail"; view = "front"; }
    else if (p.throwT > 0 || tox) pose = "throw";
    else if (p.front > 0 && p.ground && !veh) { pose = "frun"; view = "front"; }
    else if (veh) pose = veh === "scooter" ? "scoot" : "ride";
    else if (!p.ground) pose = "jump";
    else pose = `run${Math.floor(st.t * 11) % 2}`;
    const blink = p.inv > 0 && !st.tut && Math.floor(st.t * 12) % 2 ? 0.35 : 1;
    const bob = p.ground && !ducking && !veh ? Math.abs(Math.sin(st.t * 11)) * -4 : 0;
    const lift = veh && !st.over ? 12 : 0, feet = G - p.y + bob - lift;
    const sx = ducking ? 1.12 : 1, sy = ducking ? 0.52 : 1;
    ctx.save(); ctx.globalAlpha = blink;
    Gfx.estela(ctx, eq.estela, PX - 30, feet - 90 * sy, 1, st.t);
    Gfx.acc(ctx, eq, PX, feet, 1, { view, sy, t: st.t, layer: "back" });
    spr(Gfx.tmb(eq.bolsa, pose, tox), PX, feet, sx, sy);
    Gfx.acc(ctx, eq, PX, feet, 1, { view, sy, t: st.t });
    if (veh && !st.over) Gfx.vehiculo(ctx, veh, PX + 4, G - p.y + bob, 1, p.ground ? 0 : -0.25);
    ctx.restore();
    if (tox) {
      const y = G - p.y - 121, fl = 1 + Math.sin(st.t * 40) * 0.08;
      ctx.fillStyle = "rgba(125,255,58,.45)"; ctx.fillRect(PX + 70, y - 34 * fl, W, 68 * fl);
      ctx.fillStyle = "#c8ff8a"; rr(PX + 70, y - 20, W, 40, 20); ctx.fill();
      ctx.fillStyle = "#fff"; rr(PX + 70, y - 7, W, 14, 7); ctx.fill();
    }
  }
  function drawShots() {
    for (const s of st.shots) {
      ctx.strokeStyle = "rgba(125,255,58,.55)"; ctx.lineWidth = 14; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(s.x - 90, s.y + 6); ctx.lineTo(s.x - 10, s.y); ctx.stroke();
      ctx.fillStyle = "#7dff3a"; ctx.strokeStyle = "#111"; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(s.x, s.y, 24 + Math.sin(s.t * 30) * 3, 0, 7); ctx.fill(); ctx.stroke();
    }
    for (const b of st.bombs) {
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.t * 10);
      ctx.fillStyle = "#9dff5a"; ctx.strokeStyle = "#111"; ctx.lineWidth = 4; rr(-18, -20, 36, 40, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#111"; ctx.fillRect(-4, -28, 8, 10); ctx.restore();
    }
  }
  function drawParts() {
    for (const q of st.parts) {
      const a = 1 - q.t / q.life;
      if (q.spr) { ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.rot); spr(q.spr, 0, 0, 0.9, 0.9, a); ctx.restore(); continue; }
      ctx.globalAlpha = Math.max(0, a * (q.cloud ? 0.75 : 1)); ctx.fillStyle = q.c;
      if (q.cloud) { ctx.beginPath(); ctx.arc(q.x, q.y, q.r * (1 + q.t), 0, 7); ctx.fill(); }
      else ctx.fillRect(q.x - q.r / 2, q.y - q.r / 2, q.r, q.r);
    }
    ctx.globalAlpha = 1;
    for (const q of st.icons) {
      const a = 1 - q.t / 1.1, y = q.y - q.t * 60;
      ctx.save(); ctx.globalAlpha = a;
      if (Gfx.S[q.n]) spr(q.n, q.x - 26, y, 0.5);
      if (q.label) txt(q.label, q.x + 22, y - 20, 34, "#ffe14d");
      ctx.restore();
    }
  }
  function drawHUD() {
    ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fillRect(0, 0, W, 92);
    ctx.fillStyle = "#2a6fd6"; rr(20, 20, 200, 52, 14); ctx.fill();
    txt(L.meta ? `${Math.floor(st.dist)}/${L.meta}` : `${Math.floor(st.dist)} m`, 120, 47, L.meta ? 24 : 28, "#fff", "center", null);
    if (L.meta) { ctx.fillStyle = "#ffd400"; rr(20, 76, 200 * Math.min(1, st.dist / L.meta), 8, 4); ctx.fill(); }
    // barra tóxica (solo íconos)
    const x0 = 330, w = 620, full = st.bar >= 1;
    if (full) { ctx.fillStyle = `rgba(125,255,58,${0.35 + Math.sin(st.t * 8) * 0.2})`; rr(x0 - 6, 26, w + 12, 48, 22); ctx.fill(); }
    ctx.fillStyle = "#222"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 4; rr(x0, 32, w, 36, 16); ctx.fill(); ctx.stroke();
    if (st.bar > 0.01) { ctx.fillStyle = "#7dff3a"; rr(x0 + 5, 37, (w - 10) * st.bar, 26, 12); ctx.fill(); }
    ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.moveTo(x0 + w / 2, 32); ctx.lineTo(x0 + w / 2, 68); ctx.stroke(); ctx.setLineDash([]);
    txt("🤢", x0 + w / 2 - 26, 51, 22, "#fff", "center", null);
    txt("⚡", x0 + w - 56, 51, 22, "#fff", "center", null); txt("💣", x0 + w - 24, 51, 22, "#fff", "center", null);
    ctx.fillStyle = "#fff"; rr(1080, 20, 180, 52, 14); ctx.fill();
    spr(`cabeza_${eq.bolsa || "clasica"}`, 1120, 46, 0.32);
    txt(`x ${st.gang.length}`, 1195, 47, 28, "#111", "center", null);
    txt(`💧 ${st.gotas}`, 30, 114, 24, "#b8ff8c", "left");
    if (L.meta) txt(`${WD.emoji} ${L.n}`, 30, 148, 22, "#fff", "left");
    ctx.fillStyle = "rgba(255,255,255,.9)"; ctx.beginPath(); ctx.arc(1232, 128, 28, 0, 7); ctx.fill();
    ctx.fillStyle = "#111"; ctx.fillRect(1221, 114, 8, 28); ctx.fillRect(1235, 114, 8, 28);
    if (st.goatGap < 150 && !st.over) {
      const a = (150 - st.goatGap) / 150 * (0.35 + Math.sin(st.t * 10) * 0.1);
      const g = ctx.createLinearGradient(0, 0, 260, 0); g.addColorStop(0, `rgba(255,40,60,${a})`); g.addColorStop(1, "rgba(255,40,60,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 92, 260, H - 92);
    }
    // carrera en vivo: barra con las caritas
    if (cb.vivo) {
      const all = cb.vivo.rivales().concat([{ d: st.dist, skin: eq.bolsa, out: st.over, yo: true }]);
      const maxd = Math.max(50, ...all.map((g) => g.d)) * 1.1;
      ctx.fillStyle = "rgba(255,255,255,.35)"; rr(330, 78, 620, 8, 4); ctx.fill();
      for (const g of all) { ctx.save(); if (g.out) ctx.globalAlpha = 0.35; spr(`cabeza_${g.skin || "clasica"}`, 330 + 620 * Math.min(1, g.d / maxd), 82, g.yo ? 0.2 : 0.16); ctx.restore(); }
    }
    if (st.cloud > 0) {
      ctx.save(); ctx.globalAlpha = Math.min(1, st.cloud) * 0.9;
      for (let i = 0; i < 9; i++) { ctx.fillStyle = i % 2 ? "#9dff5a" : "#7ad64a"; ctx.beginPath(); ctx.arc(420 + (i % 3) * 230 + Math.sin(st.t * 2 + i) * 20, 220 + Math.floor(i / 3) * 140, 150, 0, 7); ctx.fill(); }
      ctx.restore();
    }
  }
  function keyCap(key, x, y, press) {
    const kw = key.length > 2 ? 30 + key.length * 18 : 110, pr = press ? 6 : 0;
    ctx.fillStyle = "#111"; rr(x - kw / 2, y + 8, kw, 100, 18); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.strokeStyle = "#111"; ctx.lineWidth = 6; rr(x - kw / 2, y + pr, kw, 92, 18); ctx.fill(); ctx.stroke();
    txt(key, x, y + 46 + pr, key.length > 2 ? 30 : 56, "#111", "center", null);
  }
  function drawTutorial() {
    const tu = st.tut; if (!tu || !tu.need) return;
    ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.fillRect(0, 92, W, H - 92);
    const ph = (st.t * 1.2) % 1, need = tu.need;
    if (inputMode === "touch") {
      let hx = 1080, hy = 430;
      if (need === "duck") hy += ph * 120;
      if (need === "power") hx += ph * 150 - 60;
      if (need === "jump") { ctx.fillStyle = `rgba(255,255,255,${0.5 - ph * 0.5})`; ctx.beginPath(); ctx.arc(1080, 420, 30 + ph * 50, 0, 7); ctx.fill(); }
      drawHand(hx, hy);
      if (need !== "jump") { ctx.strokeStyle = "#fff"; ctx.lineWidth = 8; ctx.setLineDash([14, 10]); ctx.beginPath();
        if (need === "duck") { ctx.moveTo(1080, 330); ctx.lineTo(1080, 470); } else { ctx.moveTo(980, 330); ctx.lineTo(1180, 330); }
        ctx.stroke(); ctx.setLineDash([]); }
    } else keyCap({ jump: "ESPACIO", duck: "↓", power: "→" }[need], 1080, 380, ph < 0.3);
  }
  function drawHand(x, y) {
    ctx.save(); ctx.translate(x, y); ctx.scale(0.9, 0.9);
    ctx.fillStyle = "#fff"; ctx.strokeStyle = "#111"; ctx.lineWidth = 5; ctx.lineJoin = "round";
    rr(-14, -70, 28, 80, 14); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-14, -5); ctx.quadraticCurveTo(-50, -10, -45, 30); ctx.lineTo(-35, 80); ctx.quadraticCurveTo(-20, 110, 25, 110);
    ctx.quadraticCurveTo(60, 105, 62, 60); ctx.lineTo(62, 0); ctx.quadraticCurveTo(62, -18, 46, -18); ctx.quadraticCurveTo(32, -18, 32, 0);
    ctx.quadraticCurveTo(32, -25, 16, -25); ctx.quadraticCurveTo(2, -25, 2, -5); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  function render() {
    ctx.setTransform(k, 0, 0, k, 0, 0);
    if (st.shake > 0) ctx.translate(fxr(-8, 8) * st.shake * 2, fxr(-6, 6) * st.shake * 2);
    drawWorld(); drawObjs(); drawHerd(); drawStampede(); drawPlayer(); drawShots(); drawParts(); drawHUD(); drawTutorial();
  }

  function frame(ts) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, last ? (ts - last) / 1000 : 0); last = ts;
    if (!st.paused) update(dt);
    render();
  }

  // ---------- controles ----------
  const KEYS = { Space: "jump", ArrowUp: "jump", KeyW: "jump", ArrowDown: "duckKey", KeyS: "duckKey", ArrowRight: "power", KeyD: "power", Enter: "power", ArrowLeft: "bomb", KeyA: "bomb" };
  function onKey(e) {
    if (!st) return;
    if (e.code === "KeyP" || e.code === "Escape") { e.preventDefault(); if (!st.over && !cb.vivo) cb.onPause && cb.onPause(); return; }
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
    if (Math.hypot(p.x - 1232, p.y - 128) < 44) { if (!st.over && !cb.vivo) cb.onPause && cb.onPause(); return; }
    ptr = { id: e.pointerId, x: p.x, y: p.y, fired: false }; e.preventDefault();
  }
  function onMove(e) {
    if (!ptr || ptr.fired || e.pointerId !== ptr.id) return;
    const p = stagePos(e), dx = p.x - ptr.x, dy = p.y - ptr.y;
    if (dy > 45 && dy > Math.abs(dx)) { ptr.fired = true; act("duckSwipe"); }
    else if (dx > 55 && dx > Math.abs(dy)) { ptr.fired = true; act("power"); }
    else if (dx < -55 && -dx > Math.abs(dy)) { ptr.fired = true; act("bomb"); }
    else if (dy < -60 && -dy > Math.abs(dx)) { ptr.fired = true; act("jump"); }
  }
  function onUp(e) { if (!ptr || e.pointerId !== ptr.id) return; if (!ptr.fired) act("jump"); ptr = null; }

  // ---------- API ----------
  // opts: { L (config del nivel), tutorial, vivo, onOver, onPause, seed }
  E.start = function (opts) {
    cb = opts || {}; L = cb.L; WD = DATA.WORLDS[L.w - 1]; eq = Prog.eq();
    if (cb.seed) { let s = cb.seed >>> 0; rand = () => { s += 0x6D2B79F5; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
    else rand = Math.random;
    st = nuevo();
    last = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
    window.addEventListener("keydown", onKey); window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("pointerdown", onDown); window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp); window.addEventListener("pointercancel", onUp);
    Sfx.music("cabras");
    if (!cb.tutorial) say("a_correr");
  };
  E.stop = function () {
    cancelAnimationFrame(raf); st = null; ptr = null;
    window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onKeyUp);
    canvas.removeEventListener("pointerdown", onDown); window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp); window.removeEventListener("pointercancel", onUp);
    Sfx.stopMusic(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
  E.pause = function () { if (st && !st.over && !st.win) { st.paused = true; Sfx.stopMusic(); } };
  E.resume = function () { if (st) { st.paused = false; last = 0; Sfx.music("cabras"); } };
  E.isRunning = () => !!st && !st.over && !st.win;
  E.dist = () => (st ? st.dist : 0);
  E._debug = () => st;
  window.Escape = E;
})();
