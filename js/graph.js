/* ═══════════════════════════════════════════════════════
   graph.js — MODEL + VIEW
   Generación aleatoria del grafo y renderizado SVG.
   Red Segura — Estructura de Datos II, Universidad del Norte
════════════════════════════════════════════════════════ */

// ── Constants ────────────────────────────────────────
const ALL_NAMES = ["Alex","Bianca","Carlos","Diana","Elena","Felipe","Gabi","Hector","Iris","Joel","Karen","Luis"];
const N = 10; // Número de nodos

// ── Behavior metadata ────────────────────────────────
const BHV_LABEL = {
  aggressor: 'Acosador',
  victim:    'Víctima',
  bystander: 'Espectador',
  supporter: 'Apoyo',
  neutral:   'Neutral',
};

const BHV_COLOR = {
  aggressor: '#ef4444',
  victim:    '#f97316',
  bystander: '#a78bfa',
  supporter: '#22c55e',
  neutral:   '#64748b',
};

// ── Global graph state ───────────────────────────────
let USERS = [];
let EDGES = [];
let BEHAVIORS = {};
let ORIGIN = -1;
let VICTIM = -1;
let rng;
let currentSeed;

// ── Graph Generation ─────────────────────────────────
/**
 * Calcula posiciones en círculo para N nodos.
 */
function getPositions() {
  const cx = 310, cy = 255, r = 195, pos = [];
  for (let i = 0; i < N; i++) {
    const angle = (2 * Math.PI * i / N) - Math.PI / 2;
    pos.push({
      x: Math.round(cx + r * Math.cos(angle)),
      y: Math.round(cy + r * Math.sin(angle)),
    });
  }
  return pos;
}

/**
 * Genera un grafo aleatorio reproducible usando una semilla.
 * Garantiza conexidad mediante un spanning tree aleatorio,
 * luego añade aristas extra para mayor densidad.
 * @param {number} seed
 */
function generateGraph(seed) {
  currentSeed = seed;
  rng = mulberry32(seed);
  document.getElementById('seed-badge').textContent = 'Seed: ' + seed;

  // Asignar nombres aleatorios a los nodos
  const names = [...ALL_NAMES].sort(() => rng() - .5).slice(0, N);
  const pos = getPositions();
  USERS = names.map((name, i) => ({ id: i, name, ...pos[i] }));

  // Fase 1: Spanning tree aleatorio (garantiza que el grafo sea conexo)
  const edgeSet = new Set();
  EDGES = [];
  const inTree = new Set([0]);
  const notInTree = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  while (notInTree.length) {
    const vi = Math.floor(rng() * notInTree.length);
    const v = notInTree[vi];
    const u = Array.from(inTree)[Math.floor(rng() * inTree.size)];
    const w = Math.floor(rng() * 8) + 1;
    const key = `${Math.min(u, v)}-${Math.max(u, v)}`;
    edgeSet.add(key);
    EDGES.push([u, v, w]);
    inTree.add(v);
    notInTree.splice(vi, 1);
  }

  // Fase 2: Aristas adicionales (entre 5 y 7 extras)
  const extra = 5 + Math.floor(rng() * 3);
  let attempts = 0;
  while (EDGES.length < N - 1 + extra && attempts++ < 300) {
    const u = Math.floor(rng() * N);
    const v = Math.floor(rng() * N);
    if (u === v) continue;
    const key = `${Math.min(u, v)}-${Math.max(u, v)}`;
    if (edgeSet.has(key)) continue;
    edgeSet.add(key);
    EDGES.push([u, v, Math.floor(rng() * 8) + 1]);
  }

  // Asignar comportamientos basados en la topología del grafo
  assignBehaviors();
}

/**
 * Asigna comportamientos a los nodos usando lógica basada en el grafo:
 * - Acosador:   nodo con mayor grado (más conexiones)
 * - Víctima:    nodo más alejado del acosador (Dijkstra)
 * - Apoyo:      vecinos directos de la víctima
 * - Espectador: vecinos directos del acosador
 * - Neutral:    resto de nodos
 */
function assignBehaviors() {
  // Acosador: nodo con mayor grado
  const degrees = USERS.map(u => ({ id: u.id, d: nodeDegree(u.id) }));
  const maxD = Math.max(...degrees.map(x => x.d));
  const topCandidates = degrees.filter(x => x.d >= maxD - 1).map(x => x.id);
  ORIGIN = topCandidates[Math.floor(rng() * topCandidates.length)];

  // Víctima: nodo más alejado del acosador por distancia Dijkstra
  const { dist } = dijkstra(ORIGIN);
  let maxDist = -1;
  VICTIM = -1;
  dist.forEach((d, i) => {
    if (i !== ORIGIN && d > maxDist && d !== Infinity) {
      maxDist = d;
      VICTIM = i;
    }
  });
  // Fallback si el grafo tiene nodos inalcanzables
  if (VICTIM === -1) VICTIM = (ORIGIN + Math.floor(N / 2)) % N;

  // Vecinos directos del acosador y de la víctima
  const adj = buildAdj();
  const origNeighbors = new Set(adj[ORIGIN].map(x => x.n));
  const victNeighbors = new Set(adj[VICTIM].map(x => x.n));

  BEHAVIORS = {};
  for (let i = 0; i < N; i++) {
    if (i === ORIGIN)             BEHAVIORS[i] = 'aggressor';
    else if (i === VICTIM)        BEHAVIORS[i] = 'victim';
    else if (victNeighbors.has(i)) BEHAVIORS[i] = 'supporter';
    else if (origNeighbors.has(i)) BEHAVIORS[i] = 'bystander';
    else                           BEHAVIORS[i] = 'neutral';
  }
}

/**
 * Regenera el grafo con una nueva semilla aleatoria y reinicia el juego.
 */
function regenerateGraph() {
  generateGraph(Math.floor(Math.random() * 99999) + 1);
  completedMissions.clear();
  Object.keys(missionState).forEach(k => delete missionState[k]);
  updateNav();
  updateStatCards();
  buildSidebar();
  setMission(currentMission);
}

// ── SVG Renderer ─────────────────────────────────────
const svgEl = document.getElementById('graph-svg');
const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Crea un elemento SVG con atributos.
 */
function mkEl(tag, attrs) {
  const e = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, v);
  return e;
}

/**
 * Renderiza el grafo en el SVG con los resaltados indicados.
 * @param {object} opts
 * @param {Set}    opts.hlNodes      - Nodos resaltados (BFS/DFS)
 * @param {Array}  opts.pathNodes    - Camino Dijkstra
 * @param {Array}  opts.mstEdges     - Aristas del MST
 * @param {Array}  opts.flowEdges    - Aristas de flujo activo
 * @param {boolean}opts.showBehaviors- Mostrar indicadores de comportamiento
 * @param {number} opts.srcNode      - Nodo fuente (verde)
 * @param {number} opts.snkNode      - Nodo sumidero (rojo)
 */
function renderGraph(opts) {
  const {
    hlNodes       = new Set(),
    pathNodes     = [],
    mstEdges      = [],
    flowEdges     = [],
    showBehaviors = false,
    srcNode       = null,
    snkNode       = null,
  } = opts || {};

  svgEl.innerHTML = '';

  // Defs: marcador de flecha (no usado actualmente, disponible para extensión)
  const defs = mkEl('defs');
  const marker = mkEl('marker', { id: 'arr', viewBox: '0 0 10 10', refX: '8', refY: '5', markerWidth: '5', markerHeight: '5', orient: 'auto-start-reverse' });
  marker.appendChild(mkEl('path', { d: 'M2 1L8 5L2 9', fill: 'none', stroke: 'context-stroke', 'stroke-width': '1.5', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
  defs.appendChild(marker);
  svgEl.appendChild(defs);

  // Construir sets de aristas resaltadas para lookup O(1)
  const pathSet = new Set();
  for (let i = 0; i < pathNodes.length - 1; i++) {
    const a = Math.min(pathNodes[i], pathNodes[i + 1]);
    const b = Math.max(pathNodes[i], pathNodes[i + 1]);
    pathSet.add(a + '-' + b);
  }
  const mstSet  = new Set(mstEdges.map(([u, v])  => Math.min(u, v) + '-' + Math.max(u, v)));
  const flowSet = new Set(flowEdges.map(([u, v]) => Math.min(u, v) + '-' + Math.max(u, v)));

  // ── Dibujar aristas ──
  EDGES.forEach(([u, v, w]) => {
    const key = Math.min(u, v) + '-' + Math.max(u, v);
    let stroke = '#2a3d5a', sw = 1, op = 0.7;

    if      (pathSet.has(key))  { stroke = '#f59e0b'; sw = 3;   op = 1;   }
    else if (mstSet.has(key))   { stroke = '#10b981'; sw = 2.5; op = 0.9; }
    else if (flowSet.has(key))  { stroke = '#ef4444'; sw = 2.5; op = 0.9; }

    const ux = USERS[u].x, uy = USERS[u].y;
    const vx = USERS[v].x, vy = USERS[v].y;

    svgEl.appendChild(mkEl('line', {
      x1: ux, y1: uy, x2: vx, y2: vy,
      stroke, opacity: op, 'stroke-width': sw, 'stroke-linecap': 'round',
    }));

    // Etiqueta del peso
    const wLabel = mkEl('text', {
      x: (ux + vx) / 2, y: (uy + vy) / 2 - 5,
      'text-anchor': 'middle', 'font-size': '10', 'fill': '#4a607a', 'font-weight': '600',
    });
    wLabel.textContent = w;
    svgEl.appendChild(wLabel);
  });

  // ── Dibujar nodos ──
  USERS.forEach(u => {
    const isHL   = hlNodes.has(u.id);
    const isPath = pathNodes.includes(u.id);
    const isSrc  = srcNode === u.id;
    const isSnk  = snkNode === u.id;
    const bc     = BHV_COLOR[BEHAVIORS[u.id]] || '#64748b';

    let fill    = '#0f1c2e';
    let stroke2 = '#2a3d5a';

    if (showBehaviors) fill = bc + '22';
    if (isHL)   { fill = '#6366f122'; stroke2 = '#6366f1'; }
    if (isPath) { fill = '#f59e0b22'; stroke2 = '#f59e0b'; }
    if (isSrc)  { fill = '#10b98122'; stroke2 = '#10b981'; }
    if (isSnk)  { fill = '#ef444422'; stroke2 = '#ef4444'; }

    const g = mkEl('g', { class: 'g-node' });

    // Círculo principal
    g.appendChild(mkEl('circle', {
      cx: u.x, cy: u.y, r: '24',
      fill,
      stroke: showBehaviors ? bc : stroke2,
      'stroke-width': '1.5',
    }));

    // Indicador de comportamiento (círculo pequeño)
    if (showBehaviors) {
      g.appendChild(mkEl('circle', { cx: u.x + 16, cy: u.y - 14, r: '6', fill: bc }));
    }

    // Nombre del nodo
    const nameText = mkEl('text', {
      x: u.x, y: u.y - 4,
      'text-anchor': 'middle', 'font-size': '11', 'fill': '#e8edf5', 'font-weight': '700',
    });
    nameText.textContent = u.name;
    g.appendChild(nameText);

    // ID del nodo
    const idText = mkEl('text', {
      x: u.x, y: u.y + 10,
      'text-anchor': 'middle', 'font-size': '9', 'fill': '#4a607a',
    });
    idText.textContent = '#' + u.id;
    g.appendChild(idText);

    svgEl.appendChild(g);
  });
}
