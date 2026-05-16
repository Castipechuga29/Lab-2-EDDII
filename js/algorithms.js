/* ═══════════════════════════════════════════════════════
   algorithms.js — MODEL
   Contiene todos los algoritmos de grafos del proyecto.
   Red Segura — Estructura de Datos II, Universidad del Norte
════════════════════════════════════════════════════════ */

// ── Seeded Random ────────────────────────────────────
/**
 * Generador de números pseudoaleatorios reproducible (Mulberry32).
 * @param {number} seed - Semilla inicial
 * @returns {function} Función que retorna floats en [0, 1)
 */
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Graph helpers ────────────────────────────────────
/**
 * Construye lista de adyacencia no dirigida desde EDGES global.
 * @returns {Array} adj[u] = [{n, w}, ...]
 */
function buildAdj() {
  const adj = Array.from({ length: N }, () => []);
  EDGES.forEach(([u, v, w]) => {
    adj[u].push({ n: v, w });
    adj[v].push({ n: u, w });
  });
  return adj;
}

/**
 * Retorna el grado (número de aristas) de un nodo.
 * @param {number} id - ID del nodo
 */
function nodeDegree(id) {
  return EDGES.filter(([u, v]) => u === id || v === id).length;
}

// ── BFS ─────────────────────────────────────────────
/**
 * Breadth-First Search desde un nodo inicial.
 * Complejidad: O(V + E)
 * @param {number} start - Nodo de inicio
 * @returns {{ visited: number[], parent: number[] }}
 */
function bfsAlgo(start) {
  const adj = buildAdj();
  const visited = [];
  const queue = [start];
  const seen = new Set([start]);
  const parent = Array(N).fill(-1);

  while (queue.length) {
    const cur = queue.shift();
    visited.push(cur);
    for (const { n } of adj[cur]) {
      if (!seen.has(n)) {
        seen.add(n);
        parent[n] = cur;
        queue.push(n);
      }
    }
  }
  return { visited, parent };
}

// ── DFS ─────────────────────────────────────────────
/**
 * Depth-First Search (recursivo) desde un nodo inicial.
 * Complejidad: O(V + E)
 * @param {number} start - Nodo de inicio
 * @returns {{ visited: number[], parent: number[] }}
 */
function dfsAlgo(start) {
  const adj = buildAdj();
  const visited = [];
  const seen = new Set();
  const parent = Array(N).fill(-1);

  function rec(v) {
    seen.add(v);
    visited.push(v);
    for (const { n } of adj[v]) {
      if (!seen.has(n)) {
        parent[n] = v;
        rec(n);
      }
    }
  }

  rec(start);
  return { visited, parent };
}

// ── Dijkstra ─────────────────────────────────────────
/**
 * Algoritmo de Dijkstra para caminos mínimos desde un nodo fuente.
 * Complejidad: O((V + E) log V)
 * @param {number} start - Nodo fuente
 * @returns {{ dist: number[], prev: number[] }}
 */
function dijkstra(start) {
  const adj = buildAdj();
  const dist = Array(N).fill(Infinity);
  const prev = Array(N).fill(-1);
  const vis = new Set();
  dist[start] = 0;

  while (true) {
    // Seleccionar el nodo no visitado con menor distancia
    let u = -1;
    for (let i = 0; i < N; i++) {
      if (!vis.has(i) && dist[i] < Infinity && (u === -1 || dist[i] < dist[u])) {
        u = i;
      }
    }
    if (u === -1) break;

    vis.add(u);
    for (const { n, w } of adj[u]) {
      if (dist[u] + w < dist[n]) {
        dist[n] = dist[u] + w;
        prev[n] = u;
      }
    }
  }
  return { dist, prev };
}

/**
 * Reconstruye el camino desde prev[] hasta el nodo target.
 * @param {number[]} prev
 * @param {number} t - Nodo destino
 * @returns {number[]} Lista de nodos del camino
 */
function getPath(prev, t) {
  const p = [];
  let c = t;
  while (c !== -1) { p.unshift(c); c = prev[c]; }
  return p.length > 1 ? p : [t];
}

// ── Kruskal (MST) ─────────────────────────────────────
/**
 * Algoritmo de Kruskal para el Árbol de Expansión Mínima.
 * Usa Union-Find con compresión de caminos y ranking.
 * Complejidad: O(E log E)
 * @returns {{ mst: Array, cost: number, steps: Array }}
 */
function kruskal() {
  const edges = [...EDGES].sort((a, b) => a[2] - b[2]);
  const par = Array.from({ length: N }, (_, i) => i);
  const rank = Array(N).fill(0);

  // Union-Find con compresión de caminos
  function find(x) {
    return par[x] === x ? x : (par[x] = find(par[x]));
  }

  function union(a, b) {
    const ra = find(a), rb = find(b);
    if (ra === rb) return false; // Formaría ciclo
    if (rank[ra] < rank[rb]) par[ra] = rb;
    else if (rank[ra] > rank[rb]) par[rb] = ra;
    else { par[rb] = ra; rank[ra]++; }
    return true;
  }

  const mst = [], steps = [];
  let cost = 0;

  for (const [u, v, w] of edges) {
    const ok = union(u, v);
    steps.push({ edge: [u, v, w], accepted: ok });
    if (ok) { mst.push([u, v, w]); cost += w; }
    if (mst.length === N - 1) break; // MST completo
  }
  return { mst, cost, steps };
}

// ── Ford-Fulkerson (Edmonds-Karp) ─────────────────────
/**
 * Algoritmo de Ford-Fulkerson con BFS (Edmonds-Karp) para Flujo Máximo.
 * Complejidad: O(V * E²)
 * @param {number} src  - Nodo fuente
 * @param {number} snk  - Nodo sumidero
 * @returns {{ maxFlow: number, paths: Array }}
 */
function fordFulkerson(src, snk) {
  // Matriz de capacidades y flujos
  const cap  = Array.from({ length: N }, () => Array(N).fill(0));
  const flow = Array.from({ length: N }, () => Array(N).fill(0));

  // Grafo no dirigido: capacidad en ambas direcciones
  EDGES.forEach(([u, v, w]) => {
    cap[u][v] += w;
    cap[v][u] += w;
  });

  let maxFlow = 0;
  const paths = [];

  for (let iter = 0; iter < 30; iter++) {
    // BFS para encontrar camino aumentante
    const par = Array(N).fill(-1);
    const vis = new Set([src]);
    const q = [src];
    let found = false;

    while (q.length && !found) {
      const u = q.shift();
      for (let v = 0; v < N; v++) {
        if (!vis.has(v) && cap[u][v] - flow[u][v] > 0) {
          vis.add(v);
          par[v] = u;
          q.push(v);
          if (v === snk) { found = true; break; }
        }
      }
    }
    if (!found) break;

    // Encontrar flujo mínimo en el camino (cuello de botella)
    let pf = Infinity;
    let v = snk;
    const path = [];
    while (v !== src) {
      const u = par[v];
      path.unshift(v);
      pf = Math.min(pf, cap[u][v] - flow[u][v]);
      v = u;
    }
    path.unshift(src);

    // Actualizar flujos
    v = snk;
    while (v !== src) {
      const u = par[v];
      flow[u][v] += pf;
      flow[v][u] -= pf;
      v = u;
    }

    maxFlow += pf;
    paths.push({ path, flow: pf });
  }

  return { maxFlow, paths };
}
