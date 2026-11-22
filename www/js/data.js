// ===== Datos de la suite: mundos, niveles, tienda, medallas y misiones =====
(function () {
  // ---------- MUNDOS (los siguientes los votan los seguidores) ----------
  const WORLDS = [
    { id: 1, name: "La granja", emoji: "🌾", sky: ["#2a6fd6", "#bfe6ff"], ground: "#8b5a2b", grass: "#4caf2a", sun: "#fff3b0",
      jump: ["barril", "caja"], duck: ["tubo"] },
    { id: 2, name: "El pueblo", emoji: "🏘️", sky: ["#ff9a5a", "#ffe0b0"], ground: "#8a8a94", grass: "#b8b8c4", sun: "#fff0c0",
      jump: ["tacho", "banca", "caja"], duck: ["letrero"] },
    { id: 3, name: "El basurero", emoji: "🗑️", sky: ["#9a9a6a", "#e8e0b0"], ground: "#5a4632", grass: "#7a6a4a", sun: "#fff6c8",
      jump: ["bolsa_basura", "llantas", "barril"], duck: ["gancho"] },
    { id: 4, name: "La fábrica tóxica", emoji: "🏭", sky: ["#160c30", "#4a2a6a"], ground: "#3a3f4a", grass: "#5c6672", sun: "#c8ff8a",
      jump: ["barril_tox", "caja_metal", "barril"], duck: ["tubo"] },
    { id: 5, name: "El balde tóxico", emoji: "🧪", sky: ["#0f3a1a", "#5aff7a"], ground: "#2a5a1a", grass: "#46c22a", sun: "#d8ffb0",
      jump: ["barril_tox", "bolsa_basura", "llantas", "caja_metal"], duck: ["tubo", "gancho"] },
  ];

  // Obstáculos: medio ancho (w) y alto (h) de choque, sprite y escala
  const OBST = {
    barril: { w: 30, h: 92, sc: 1 }, barril_tox: { w: 30, h: 92, sc: 1 },
    caja: { w: 28, h: 55, sc: 0.8 }, caja_metal: { w: 28, h: 55, sc: 0.8 },
    tacho: { w: 26, h: 70, sc: 0.9 }, banca: { w: 46, h: 62, sc: 0.85 },
    bolsa_basura: { w: 30, h: 72, sc: 0.9 }, llantas: { w: 34, h: 66, sc: 0.9 },
    platano: { w: 22, h: 22, sc: 0.8 },
    tubo: { hang: true, w: 42, pole: [5, 40], col: "#6f7a88" },
    letrero: { hang: true, w: 44, pole: [-4, 4], col: "#555" },
    gancho: { hang: true, w: 40, pole: [-3, 3], col: "#333" },
  };

  const DIFS = [null, { name: "Normal", sp: 1, gap: 1, mult: 1 }, { name: "Difícil", sp: 1.12, gap: 0.88, mult: 1.5 },
    { name: "Tóxico", sp: 1.25, gap: 0.78, mult: 2 }];

  // Configuración de un nivel (mundo w, nivel n de 1 a 10, dificultad d de 1 a 3)
  function level(w, n, d) {
    const g = (w - 1) * 10 + n, D = DIFS[d];
    return {
      w, n, d, id: `m${w}n${String(n).padStart(2, "0")}d${d}`,
      meta: 300 + w * 60 + n * 35,
      speed: (420 + (w - 1) * 28 + n * 7) * D.sp,
      speedUp: 0.25 + w * 0.03,
      gap: D.gap,
      stampEvery: g >= 4 ? Math.max(260, 620 - g * 7) * (d === 3 ? 0.75 : 1) : 0,
      loca: g >= 8,
      boss: n === 10,
      gotasMeta: Math.round((300 + w * 60 + n * 35) / 16),
      mult: D.mult,
    };
  }
  function endless(w) {
    const L = level(w, 10, 1);
    L.boss = false; L.meta = 0; L.id = `inf_${w}`; L.endless = true; L.stampEvery = Math.max(300, L.stampEvery);
    return L;
  }
  function vivoCfg() { const L = endless(1); L.id = "vivo"; L.vivo = true; L.stampEvery = 420; L.loca = true; return L; }
  function score(L, metros, gotas, stars, win) {
    return Math.round((metros + gotas * 5 + (win ? 250 : 0) + stars * 100) * L.mult);
  }

  // ---------- TIENDA / VESTIDOR (accesorios compartidos en toda la suite) ----------
  // precio: {g: gotas} o {d: diamantes}; o "premio" (se gana, no se compra)
  const ITEMS = [
    { id: "clasica", slot: "bolsa", name: "Clásica", emoji: "🟫", free: true },
    { id: "chicle", slot: "bolsa", name: "Chicle", emoji: "🩷", price: { g: 300 } },
    { id: "noche", slot: "bolsa", name: "Noche", emoji: "🌙", price: { g: 500 } },
    { id: "dorada", slot: "bolsa", name: "Dorada", emoji: "✨", price: { d: 5 }, legend: true },
    { id: "gorra", slot: "cabeza", name: "Gorra", emoji: "🧢", price: { g: 200 } },
    { id: "audifonos", slot: "cabeza", name: "Audífonos", emoji: "🎧", price: { g: 350 } },
    { id: "casco", slot: "cabeza", name: "Casco", emoji: "⛑️", price: { g: 450 } },
    { id: "corona", slot: "cabeza", name: "Corona de cabra", emoji: "👑", premio: "Ganar un trofeo del top 3 mundial", legend: true },
    { id: "mochila", slot: "espalda", name: "Mochila", emoji: "🎒", price: { g: 300 } },
    { id: "capa", slot: "espalda", name: "Capa", emoji: "🦸", price: { g: 600 } },
    { id: "tanque", slot: "espalda", name: "Tanque tóxico", emoji: "🧪", price: { d: 3 }, legend: true },
    { id: "patineta", slot: "vehiculo", name: "Patineta", emoji: "🛹", premio: "Pasar el mundo 1 (o comprarla)", price: { g: 900 } },
    { id: "scooter", slot: "vehiculo", name: "Scooter", emoji: "🛴", price: { g: 1500 } },
    { id: "gotas", slot: "estela", name: "Estela de gotas", emoji: "💧", price: { g: 250 } },
    { id: "chispas", slot: "estela", name: "Chispas", emoji: "✨", price: { g: 500 } },
    { id: "arcoiris", slot: "estela", name: "Arcoíris", emoji: "🌈", price: { d: 4 }, legend: true },
  ];
  const SLOTS = [["bolsa", "Bolsa"], ["cabeza", "Cabeza"], ["espalda", "Espalda"], ["vehiculo", "Vehículo"], ["estela", "Estela"]];

  // ---------- MEDALLAS ----------
  const MEDALS = [
    { id: "primera", name: "Primera carrera", emoji: "👟", test: (s) => s.partidas >= 1, r: { g: 20 } },
    { id: "cabras100", name: "Sobreviví a 100 cabras", emoji: "🐐", test: (s) => s.cabras >= 100, r: { d: 1 } },
    { id: "estampidas10", name: "10 estampidas esquivadas", emoji: "💨", test: (s) => s.estampidas >= 10, r: { g: 150 } },
    { id: "eructos50", name: "50 eructos tóxicos", emoji: "🤢", test: (s) => s.eructos >= 50, r: { g: 150 } },
    { id: "rayos10", name: "10 rayos mutantes", emoji: "⚡", test: (s) => s.rayos >= 10, r: { g: 200 } },
    { id: "bombas10", name: "10 bombas apestosas", emoji: "💣", test: (s) => s.bombas >= 10, r: { g: 200 } },
    { id: "pandilla10", name: "Pandilla de 10", emoji: "🛍️", test: (s) => s.maxPandilla >= 10, r: { d: 1 } },
    { id: "gotas1000", name: "1000 gotas juntadas", emoji: "💧", test: (s) => s.gotas >= 1000, r: { d: 1 } },
    { id: "estrellas30", name: "30 estrellas", emoji: "⭐", test: (s) => s.estrellas >= 30, r: { d: 1 } },
    { id: "mundo1", name: "Pasé la granja", emoji: "🌾", test: (s) => s.mundos >= 1, r: { g: 200 } },
    { id: "mundo2", name: "Pasé el pueblo", emoji: "🏘️", test: (s) => s.mundos >= 2, r: { g: 300 } },
    { id: "mundo3", name: "Pasé el basurero", emoji: "🗑️", test: (s) => s.mundos >= 3, r: { d: 1 } },
    { id: "mundo4", name: "Pasé la fábrica", emoji: "🏭", test: (s) => s.mundos >= 4, r: { d: 2 } },
    { id: "mundo5", name: "Vencí a la cabra jefa final", emoji: "🧪", test: (s) => s.mundos >= 5, r: { d: 3 } },
    { id: "caida500", name: "500 m en la Carrera tóxica", emoji: "🪂", test: (s) => s.caidaMax >= 500, r: { g: 200 } },
    { id: "racha7", name: "7 días seguidos", emoji: "📅", test: (s) => s.rachaMax >= 7, r: { d: 1 } },
    { id: "vivo1", name: "Gané una carrera en vivo", emoji: "🏁", test: (s) => s.vivoGanadas >= 1, r: { g: 200 } },
    { id: "top3", name: "Top 3 mundial", emoji: "🏆", test: (s) => s.trofeos >= 1, r: { d: 2 } },
  ];

  // ---------- MISIONES DEL DÍA (se eligen 3 según la fecha) ----------
  const MISSIONS = [
    { id: "obst", name: "Salta {n} obstáculos", emoji: "🛢️", n: [20, 30, 40], ev: "obst", r: 50 },
    { id: "eructo", name: "Lanza {n} eructos", emoji: "🤢", n: [3, 5], ev: "eructo", r: 50 },
    { id: "rayo", name: "Usa {n} rayo mutante", emoji: "⚡", n: [1, 2], ev: "rayo", r: 60 },
    { id: "bomba", name: "Lanza {n} bomba apestosa", emoji: "💣", n: [1, 2], ev: "bomba", r: 60 },
    { id: "gotas", name: "Junta {n} gotas", emoji: "💧", n: [40, 80, 120], ev: "gota", r: 50 },
    { id: "estrellas", name: "Gana {n} estrellas", emoji: "⭐", n: [2, 3, 5], ev: "estrella", r: 70 },
    { id: "estampida", name: "Esquiva {n} estampidas", emoji: "💨", n: [1, 2, 3], ev: "estampida", r: 70 },
    { id: "pandilla", name: "Suma {n} bolsitas a la pandilla", emoji: "🛍️", n: [3, 6], ev: "bolsita", r: 50 },
    { id: "caida", name: "Cae {n} m en la Carrera tóxica", emoji: "🪂", n: [150, 300], ev: "caida", r: 60, max: true },
  ];

  window.DATA = { WORLDS, OBST, DIFS, level, endless, vivoCfg, score, ITEMS, SLOTS, MEDALS, MISSIONS };
})();
