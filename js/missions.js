/* ═══════════════════════════════════════════════════════
   missions.js — CONTROLLER
   Lógica de cada misión del juego.
   Red Segura — Estructura de Datos II, Universidad del Norte
════════════════════════════════════════════════════════ */

// ── Mission metadata ─────────────────────────────────
const MISSIONS_META = [
  { title: 'Misión 1 — Rastros del Acoso', badge: 'BFS / DFS',       color: '--c1', icon: '🔍' },
  { title: 'Misión 2 — Ruta Segura',       badge: 'Dijkstra',        color: '--c2', icon: '🛡️' },
  { title: 'Misión 3 — Reconstruir Red',   badge: 'Kruskal MST',     color: '--c3', icon: '🔗' },
  { title: 'Misión 4 — Control Impacto',   badge: 'Ford-Fulkerson',  color: '--c4', icon: '🌊' },
  { title: 'Misión Final — Red Segura',    badge: 'Integración',     color: '--c5', icon: '✨' },
];

const MISSION_DESCS = [
  'Recorre la red para identificar el origen del acoso. El origen se determina como el nodo con mayor número de conexiones. Usa BFS o DFS y avanza paso a paso observando los comportamientos.',
  'Encuentra la ruta de menor riesgo emocional desde un nodo de apoyo hasta la víctima. Los pesos representan el nivel de riesgo de cada interacción.',
  'Reconstruye las conexiones de confianza de la red con el menor costo total usando el algoritmo de Kruskal.',
  'Calcula el flujo máximo de contenido dañino que puede propagarse entre dos nodos de la red usando Ford-Fulkerson.',
  'Integra todos los algoritmos aprendidos para restaurar completamente la red afectada por el acoso.',
];

// ── Mission state ────────────────────────────────────
const missionState = {};

// ═══════════════════════════════════════════════════════
// MISIÓN 1 — BFS / DFS
// ═══════════════════════════════════════════════════════
function initMission1() {
  missionState[1] = { algo: null, result: null, step: 0, done: false };
  renderGraph({ showBehaviors: true });

  document.getElementById('mission-controls').innerHTML = `
    <div class="btn-row">
      <button class="btn primary" style="--btn-c:var(--c1)" onclick="m1RunAlgo('bfs')">BFS — Por niveles</button>
      <button class="btn primary" style="--btn-c:var(--c2)" onclick="m1RunAlgo('dfs')">DFS — Cadenas profundas</button>
    </div>
    <div class="log-box" id="m1-log">
      Elige un algoritmo. El acosador es el nodo con más conexiones. Observa los comportamientos durante el recorrido.
    </div>
    <div class="btn-row" id="m1-nav" style="display:none">
      <button class="btn" onclick="m1Step(-1)">◀ Anterior</button>
      <button class="btn" onclick="m1Step(1)">Siguiente ▶</button>
      <button class="btn" onclick="m1End()">⏩ Fin</button>
    </div>
    <div id="m1-guess"></div>
    <div id="m1-result"></div>
  `;
}

function m1RunAlgo(algo) {
  const s = missionState[1];
  s.algo   = algo;
  s.result = algo === 'bfs' ? bfsAlgo(0) : dfsAlgo(0);
  s.step   = 0;
  s.done   = false;
  document.getElementById('m1-nav').style.display = 'flex';
  document.getElementById('m1-guess').innerHTML   = '';
  document.getElementById('m1-result').innerHTML  = '';
  m1Render();
}

function m1Step(d) {
  const s = missionState[1];
  if (!s.result) return;
  s.step = Math.max(0, Math.min(s.result.visited.length - 1, s.step + d));
  m1Render();
}

function m1End() {
  const s = missionState[1];
  if (!s.result) return;
  s.step = s.result.visited.length - 1;
  m1Render();
}

function m1Render() {
  const s = missionState[1];
  if (!s.result) return;

  const vis = s.result.visited.slice(0, s.step + 1);
  const cur = vis[vis.length - 1];
  renderGraph({ hlNodes: new Set(vis), showBehaviors: true });

  const bhv = BEHAVIORS[cur];
  document.getElementById('m1-log').innerHTML =
    `<strong>Paso ${s.step + 1}/${s.result.visited.length}</strong> — 
     <strong style="color:var(--c1)">${USERS[cur].name}</strong> — 
     Comportamiento: <strong style="color:${BHV_COLOR[bhv]}">${BHV_LABEL[bhv]}</strong> — 
     Conexiones: <strong>${nodeDegree(cur)}</strong>`;

  // Mostrar botones de adivinanza al terminar el recorrido
  if (s.step === s.result.visited.length - 1 && !s.done) {
    const guessDiv = document.getElementById('m1-guess');
    guessDiv.innerHTML = `<p style="font-size:12px;color:var(--text1);margin:10px 0 7px">
      ¿Quién inició el acoso? (busca el de mayor grado)</p>`;

    [...USERS]
      .sort((a, b) => nodeDegree(b.id) - nodeDegree(a.id))
      .forEach(u => {
        const btn = document.createElement('button');
        btn.className   = 'guess-btn';
        btn.textContent = `${u.name} — ${nodeDegree(u.id)} conexiones`;
        btn.onclick = () => m1Guess(u.id);
        guessDiv.appendChild(btn);
      });
  }
}

function m1Guess(id) {
  const s = missionState[1];
  if (id === ORIGIN) {
    s.done = true;
    document.getElementById('m1-guess').innerHTML  = '';
    document.getElementById('m1-result').innerHTML = `
      <div class="result-box result-success">
        <p style="color:var(--success);font-weight:700;margin-bottom:6px">
          ✅ ¡Correcto! Origen: ${USERS[ORIGIN].name} (${nodeDegree(ORIGIN)} conexiones, comportamiento: Acosador)
        </p>
        <p style="color:var(--text2);font-size:11px">
          ${s.algo === 'bfs'
            ? 'BFS reveló la propagación nivel a nivel desde el inicio.'
            : 'DFS rastreó cadenas profundas de interacción hasta llegar al origen.'}
          El nodo con más conexiones tiene mayor capacidad de propagar contenido dañino.
        </p>
        <button class="btn success" style="margin-top:10px" onclick="completeMission(0)">
          Siguiente misión →
        </button>
      </div>`;
  } else {
    document.getElementById('m1-result').innerHTML =
      `<p style="color:var(--c4);font-size:12px;margin-top:8px">
        ❌ ${USERS[id].name} tiene ${nodeDegree(id)} conexiones.
        El acosador tiene ${nodeDegree(ORIGIN)}. El nodo con más conexiones está marcado en rojo 🔴.
      </p>`;
  }
}

// ═══════════════════════════════════════════════════════
// MISIÓN 2 — DIJKSTRA
// ═══════════════════════════════════════════════════════
function initMission2() {
  const suppEntry = Object.entries(BEHAVIORS).find(([, v]) => v === 'supporter');
  const defSrc    = suppEntry ? +suppEntry[0] : 0;
  missionState[2] = { src: defSrc, tgt: VICTIM, result: null };
  renderGraph({ srcNode: defSrc, snkNode: VICTIM, showBehaviors: true });

  document.getElementById('mission-controls').innerHTML = `
    <div class="btn-row" style="align-items:center;flex-wrap:wrap;gap:10px">
      <label>Nodo apoyo:
        <select id="m2-src" onchange="m2Update()">
          ${USERS.map(u => `<option value="${u.id}" ${u.id === defSrc ? 'selected' : ''}>
            ${u.name} #${u.id} — ${BHV_LABEL[BEHAVIORS[u.id]]}</option>`).join('')}
        </select>
      </label>
      <label>Destino:
        <select id="m2-tgt" onchange="m2Update()">
          ${USERS.map(u => `<option value="${u.id}" ${u.id === VICTIM ? 'selected' : ''}>
            ${u.name} #${u.id} — ${BHV_LABEL[BEHAVIORS[u.id]]}</option>`).join('')}
        </select>
      </label>
      <button class="btn primary" style="--btn-c:var(--c2)" onclick="m2Run()">▶ Ejecutar Dijkstra</button>
    </div>
    <div class="log-box" id="m2-log">
      Víctima detectada: <strong>${USERS[VICTIM].name}</strong> 
      (nodo más alejado del acosador por distancia Dijkstra). Encuentra la ruta de apoyo más segura.
    </div>
    <div id="m2-result"></div>
  `;
}

function m2Update() {
  const s = missionState[2];
  s.result = null;
  s.src = +document.getElementById('m2-src').value;
  s.tgt = +document.getElementById('m2-tgt').value;
  renderGraph({ srcNode: s.src, snkNode: s.tgt, showBehaviors: true });
  document.getElementById('m2-result').innerHTML = '';
}

function m2Run() {
  const s    = missionState[2];
  s.result   = dijkstra(s.src);
  const path = getPath(s.result.prev, s.tgt);
  const cost = s.result.dist[s.tgt];

  renderGraph({ pathNodes: path, srcNode: s.src, snkNode: s.tgt, showBehaviors: true });
  document.getElementById('m2-log').innerHTML =
    `<strong>Ruta:</strong> ${path.map(n => USERS[n].name).join(' → ')}`;

  document.getElementById('m2-result').innerHTML = `
    <div class="result-box result-info">
      <p style="color:var(--c2);font-weight:700;margin-bottom:6px">
        ✅ Ruta más segura — Riesgo acumulado: ${cost === Infinity ? 'Sin conexión' : cost}
      </p>
      <p style="color:var(--text2);font-size:11px">${path.map(n => USERS[n].name).join(' → ')}</p>
      <p style="color:var(--text2);font-size:11px;margin-top:5px">
        Dijkstra garantiza que no existe otro camino con menor riesgo total entre estos dos nodos.
      </p>
      <button class="btn success" style="margin-top:10px" onclick="completeMission(1)">
        Siguiente misión →
      </button>
    </div>`;
}

// ═══════════════════════════════════════════════════════
// MISIÓN 3 — KRUSKAL
// ═══════════════════════════════════════════════════════
function initMission3() {
  const { mst, cost, steps } = kruskal();
  missionState[3] = { mst, cost, steps, stepIdx: 0, phase: 'idle', autoTimer: null };
  renderGraph({});

  document.getElementById('mission-controls').innerHTML = `
    <div class="btn-row">
      <button class="btn primary" style="--btn-c:var(--c3)" onclick="m3Start()">▶ Iniciar Kruskal</button>
      <button class="btn" id="m3-prev" onclick="m3Step(-1)" disabled>◀</button>
      <button class="btn" id="m3-next" onclick="m3Step(1)"  disabled>▶</button>
      <button class="btn" id="m3-auto" onclick="m3Auto()"   disabled>⏩ Auto</button>
    </div>
    <div class="log-box" id="m3-log">
      Kruskal ordenará las ${steps.length} aristas por peso y construirá el MST sin ciclos.
    </div>
    <div id="m3-steps" style="max-height:110px;overflow-y:auto;margin-bottom:8px"></div>
    <div id="m3-result"></div>
  `;
}

function m3Start() {
  const s = missionState[3];
  s.stepIdx = 0;
  s.phase   = 'running';
  ['m3-prev', 'm3-next', 'm3-auto'].forEach(id => document.getElementById(id).disabled = false);
  m3Render();
}

function m3Step(d) {
  const s  = missionState[3];
  if (s.phase !== 'running') return;
  const nx = s.stepIdx + d;
  if (nx < 0 || nx >= s.steps.length) return;
  s.stepIdx = nx;
  m3Render();
}

function m3Auto() {
  const s = missionState[3];
  if (s.autoTimer) {
    clearInterval(s.autoTimer);
    s.autoTimer = null;
    document.getElementById('m3-auto').textContent = '⏩ Auto';
    return;
  }
  document.getElementById('m3-auto').textContent = '⏸ Pausar';
  s.autoTimer = setInterval(() => {
    if (s.stepIdx >= s.steps.length - 1) {
      clearInterval(s.autoTimer);
      s.autoTimer = null;
      s.phase = 'done';
      document.getElementById('m3-auto').textContent = '⏩ Auto';
      m3Render();
      return;
    }
    s.stepIdx++;
    m3Render();
  }, 500);
}

function m3Render() {
  const s      = missionState[3];
  const curMst = s.steps.slice(0, s.stepIdx + 1).filter(x => x.accepted).map(x => x.edge);
  renderGraph({ mstEdges: curMst });

  const cur = s.steps[s.stepIdx];
  document.getElementById('m3-log').innerHTML =
    `<strong>Arista ${s.stepIdx + 1}/${s.steps.length}:</strong> 
     ${USERS[cur.edge[0]].name}–${USERS[cur.edge[1]].name} (peso ${cur.edge[2]}) 
     <strong style="color:${cur.accepted ? 'var(--success)' : 'var(--c4)'}">
       ${cur.accepted ? '✅ ACEPTADA' : '❌ RECHAZADA (formaría ciclo)'}
     </strong>`;

  document.getElementById('m3-steps').innerHTML = s.steps
    .slice(0, s.stepIdx + 1)
    .map(st => `
      <div class="step-row ${st.accepted ? 'accepted' : 'rejected'}">
        <span>${st.accepted ? '✅' : '❌'}</span>
        <span style="color:var(--text1)">${USERS[st.edge[0]].name}–${USERS[st.edge[1]].name}</span>
        <span style="color:var(--text3)">w=${st.edge[2]}</span>
        <span style="color:${st.accepted ? 'var(--success)' : 'var(--c4)'}">
          ${st.accepted ? 'MST' : 'ciclo'}
        </span>
      </div>`).join('');

  if (s.phase === 'done' || s.stepIdx === s.steps.length - 1) {
    document.getElementById('m3-result').innerHTML = `
      <div class="result-box result-success">
        <p style="color:var(--c3);font-weight:700;margin-bottom:6px">
          ✅ MST completado — Costo mínimo total: ${s.cost}
        </p>
        <p style="color:var(--text2);font-size:11px">
          ${s.mst.length} aristas conectan los ${N} usuarios con el menor costo posible de reconstrucción.
        </p>
        <button class="btn success" style="margin-top:10px" onclick="completeMission(2)">
          Siguiente misión →
        </button>
      </div>`;
  }
}

// ═══════════════════════════════════════════════════════
// MISIÓN 4 — FORD-FULKERSON
// ═══════════════════════════════════════════════════════
function initMission4() {
  missionState[4] = { src: ORIGIN, snk: VICTIM, result: null, showPath: 0 };
  renderGraph({ srcNode: ORIGIN, snkNode: VICTIM });

  document.getElementById('mission-controls').innerHTML = `
    <div class="btn-row" style="align-items:center;flex-wrap:wrap;gap:10px">
      <label>Fuente:
        <select id="m4-src" onchange="m4Update()">
          ${USERS.map(u => `<option value="${u.id}" ${u.id === ORIGIN ? 'selected' : ''}>${u.name} #${u.id}</option>`).join('')}
        </select>
      </label>
      <label>Sumidero:
        <select id="m4-snk" onchange="m4Update()">
          ${USERS.map(u => `<option value="${u.id}" ${u.id === VICTIM ? 'selected' : ''}>${u.name} #${u.id}</option>`).join('')}
        </select>
      </label>
      <button class="btn primary" style="--btn-c:var(--c4)" onclick="m4Run()">▶ Ford-Fulkerson</button>
    </div>
    <div class="log-box" id="m4-log">
      Fuente: <strong>${USERS[ORIGIN].name}</strong> (acosador) → 
      Sumidero: <strong>${USERS[VICTIM].name}</strong> (víctima). 
      El flujo máximo representa la capacidad máxima de propagación del acoso.
    </div>
    <div id="m4-paths"></div>
    <div id="m4-result"></div>
  `;
}

function m4Update() {
  const s = missionState[4];
  s.result = null;
  s.src = +document.getElementById('m4-src').value;
  s.snk = +document.getElementById('m4-snk').value;
  renderGraph({ srcNode: s.src, snkNode: s.snk });
  document.getElementById('m4-paths').innerHTML  = '';
  document.getElementById('m4-result').innerHTML = '';
}

function m4Run() {
  const s = missionState[4];
  s.result   = fordFulkerson(s.src, s.snk);
  s.showPath = 0;
  document.getElementById('m4-log').innerHTML =
    `<strong>Flujo máximo: ${s.result.maxFlow}</strong> — ${s.result.paths.length} caminos aumentantes encontrados.`;
  m4RenderPaths();
  document.getElementById('m4-result').innerHTML = `
    <div class="result-box result-info">
      <p style="color:var(--c4);font-weight:700;margin-bottom:6px">
        Flujo máximo: ${s.result.maxFlow} unidades de contenido dañino
      </p>
      <p style="color:var(--text2);font-size:11px">
        Bloquear las aristas de cuello de botella en estos caminos reduciría el flujo al mínimo posible.
      </p>
      <button class="btn success" style="margin-top:10px" onclick="completeMission(3)">
        Misión Final →
      </button>
    </div>`;
}

function m4RenderPaths() {
  const s = missionState[4];
  if (!s.result) return;

  document.getElementById('m4-paths').innerHTML = `
    <div class="btn-row">
      ${s.result.paths.map((p, i) =>
        `<button class="btn ${i === s.showPath ? 'primary' : ''}" style="--btn-c:var(--c4)" onclick="m4ShowPath(${i})">
          Camino ${i + 1} (f=${p.flow})
        </button>`).join('')}
    </div>
    <div class="log-box" style="margin-top:4px">
      ${s.result.paths[s.showPath].path.map(n => USERS[n].name).join(' → ')} — flujo: ${s.result.paths[s.showPath].flow}
    </div>`;

  const fp = s.result.paths[s.showPath].path;
  const fe = [];
  for (let i = 0; i < fp.length - 1; i++) fe.push([fp[i], fp[i + 1]]);
  renderGraph({ flowEdges: fe, srcNode: s.src, snkNode: s.snk });
}

function m4ShowPath(i) {
  missionState[4].showPath = i;
  m4RenderPaths();
}

// ═══════════════════════════════════════════════════════
// MISIÓN FINAL — INTEGRACIÓN
// ═══════════════════════════════════════════════════════
const MF_PHASES = [
  { label: '1. Origen (DFS)',           color: 'var(--c1)' },
  { label: '2. Intervención (Dijkstra)',color: 'var(--c2)' },
  { label: '3. Reconstruir (Kruskal)',  color: 'var(--c3)' },
  { label: '4. Flujo (Ford-Fulkerson)', color: 'var(--c4)' },
];

function initMissionFinal() {
  missionState[5] = { phase: 0 };
  document.getElementById('mission-controls').innerHTML = `
    <div class="btn-row" id="mf-tabs" style="flex-wrap:wrap"></div>
    <div class="log-box" id="mf-log"></div>
    <div id="mf-result"></div>
  `;
  mfSetPhase(0);
}

function mfSetPhase(p) {
  missionState[5].phase = p;

  // Tabs
  document.getElementById('mf-tabs').innerHTML = MF_PHASES.map((ph, i) =>
    `<button class="btn" style="
      border-color:${p === i ? ph.color : 'var(--border)'};
      color:${p === i ? ph.color : 'var(--text3)'};
      background:${p === i ? ph.color + '1a' : 'transparent'}"
      onclick="mfSetPhase(${i})">${ph.label}
    </button>`).join('');

  // Pre-computar todos los algoritmos
  const dfsR     = dfsAlgo(ORIGIN);
  const suppEntry = Object.entries(BEHAVIORS).find(([, v]) => v === 'supporter');
  const suppNode  = suppEntry ? +suppEntry[0] : 0;
  const dijR      = dijkstra(suppNode);
  const path      = getPath(dijR.prev, VICTIM);
  const { mst, cost } = kruskal();
  const ffR       = fordFulkerson(ORIGIN, VICTIM);

  if (p === 0) {
    renderGraph({ hlNodes: new Set(dfsR.visited), showBehaviors: true });
    document.getElementById('mf-log').innerHTML =
      `<strong>DFS desde #0:</strong> ${dfsR.visited.map(n => USERS[n].name).join(' → ')} | 
       Origen: <strong style="color:var(--c4)">${USERS[ORIGIN].name}</strong>`;

  } else if (p === 1) {
    renderGraph({ pathNodes: path, srcNode: suppNode, snkNode: VICTIM, showBehaviors: true });
    document.getElementById('mf-log').innerHTML =
      `<strong>Dijkstra:</strong> ${path.map(n => USERS[n].name).join(' → ')} — riesgo total: ${dijR.dist[VICTIM]}`;

  } else if (p === 2) {
    renderGraph({ mstEdges: mst });
    document.getElementById('mf-log').innerHTML =
      `<strong>Kruskal:</strong> ${mst.length} aristas — costo mínimo total: ${cost}`;

  } else {
    const fp = ffR.paths[0]?.path || [];
    const fe = [];
    for (let i = 0; i < fp.length - 1; i++) fe.push([fp[i], fp[i + 1]]);
    renderGraph({ flowEdges: fe, srcNode: ORIGIN, snkNode: VICTIM });
    document.getElementById('mf-log').innerHTML =
      `<strong>Ford-Fulkerson:</strong> Flujo máximo = ${ffR.maxFlow} — ${ffR.paths.length} caminos aumentantes`;
  }

  // Panel de resultados finales (solo en fase 4)
  document.getElementById('mf-result').innerHTML = p === 3 ? `
    <div class="result-box" style="
      background: color-mix(in srgb, var(--c5) 8%, transparent);
      border: 1px solid color-mix(in srgb, var(--c5) 35%, transparent);
      margin-top:10px">
      <p style="color:var(--c5);font-weight:800;font-size:15px;margin-bottom:12px">
        🎉 ¡Red Segura restaurada! — Seed: ${currentSeed}
      </p>
      <div class="final-grid">
        <div class="stat-card">
          <div class="stat-label">Acosador detectado</div>
          <div class="stat-val" style="color:var(--c4);font-size:16px">${USERS[ORIGIN].name}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Víctima protegida</div>
          <div class="stat-val" style="color:var(--c2);font-size:16px">${USERS[VICTIM].name}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">MST costo mínimo</div>
          <div class="stat-val" style="color:var(--c3);font-size:16px">${cost}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Flujo máximo</div>
          <div class="stat-val" style="color:var(--c1);font-size:16px">${ffR.maxFlow}</div>
        </div>
      </div>
      <p style="font-size:11px;color:var(--text3);margin-top:10px">
        Presiona 🔀 Nueva red para generar un grafo diferente con nuevo origen, víctima y comportamientos.
      </p>
    </div>` : '';
}
