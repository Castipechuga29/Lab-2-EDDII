/* ═══════════════════════════════════════════════════════
   app.js — CONTROLLER principal
   Maneja navegación, estado global y sidebar.
   Red Segura — Estructura de Datos II, Universidad del Norte
════════════════════════════════════════════════════════ */

// ── Global state ─────────────────────────────────────
let currentMission = 0;
const completedMissions = new Set();
const MISSION_COLORS = ['--c1', '--c2', '--c3', '--c4', '--c5'];
const MISSION_RENDERERS = [
  initMission1,
  initMission2,
  initMission3,
  initMission4,
  initMissionFinal,
];

// ── Navigation ───────────────────────────────────────
/**
 * Cambia la misión activa y renderiza sus controles.
 * @param {number} idx - Índice de la misión (0-4)
 */
function setMission(idx) {
  currentMission = idx;
  updateNav();
  updateStatCards();

  const m    = MISSIONS_META[idx];
  const cvar = `var(${m.color})`;

  document.getElementById('mission-title').textContent  = m.icon + ' ' + m.title;
  document.getElementById('mission-title').style.color  = cvar;
  document.getElementById('mission-badge').textContent  = m.badge;
  document.getElementById('mission-desc').textContent   = MISSION_DESCS[idx];

  MISSION_RENDERERS[idx]();
}

/**
 * Marca una misión como completada y avanza a la siguiente.
 * @param {number} idx - Índice de la misión completada (0-4)
 */
function completeMission(idx) {
  completedMissions.add(idx);
  updateNav();
  updateStatCards();
  if (idx < 4) setMission(idx + 1);
}

// ── UI updates ───────────────────────────────────────
/**
 * Actualiza las pestañas de navegación de misiones.
 */
function updateNav() {
  document.getElementById('mission-nav').innerHTML = MISSIONS_META.map((m, i) => {
    const cvar = `var(${MISSION_COLORS[i]})`;
    const cls  = ['m-tab'];
    if (i === currentMission)    cls.push('active');
    else if (completedMissions.has(i)) cls.push('done');

    const label = m.title.split('—')[1]?.trim() || m.title;
    return `<button class="${cls.join(' ')}" style="--active-c:${cvar}" onclick="setMission(${i})">
      ${completedMissions.has(i) ? '✅' : m.icon} ${label}
    </button>`;
  }).join('');
}

/**
 * Actualiza las tarjetas de estadísticas del panel derecho.
 */
function updateStatCards() {
  document.getElementById('stat-nodes').textContent = N;
  document.getElementById('stat-edges').textContent = EDGES.length;
  document.getElementById('stat-done').textContent  = completedMissions.size + ' / 5';
  document.getElementById('stat-cur').textContent   = currentMission + 1;
}

// ── Sidebar ──────────────────────────────────────────
/**
 * Construye la lista de usuarios, aristas y reglas de comportamiento
 * en el panel derecho. Se llama cada vez que cambia el grafo.
 */
function buildSidebar() {
  // Lista de usuarios con comportamiento y grado
  document.getElementById('user-list').innerHTML = USERS.map(u => `
    <div class="user-row">
      <div class="behavior-dot" style="background:${BHV_COLOR[BEHAVIORS[u.id]]}"></div>
      <span class="user-name">${u.name}</span>
      <span style="font-size:10px;color:var(--text3);margin-right:4px">${nodeDegree(u.id)} conex.</span>
      <span class="behavior-tag" style="color:${BHV_COLOR[BEHAVIORS[u.id]]}">${BHV_LABEL[BEHAVIORS[u.id]]}</span>
    </div>`).join('');

  // Lista de aristas con pesos
  document.getElementById('edge-list').innerHTML = EDGES.map(([u, v, w]) =>
    `<span class="edge-pill">${USERS[u].name}–${USERS[v].name}: <strong>${w}</strong></span>`
  ).join('');

  // Explicación de comportamientos con valores reales
  document.getElementById('behavior-rules').innerHTML = `
    <p style="font-size:10px;color:var(--text3);margin-bottom:5px;font-weight:700">CÓMO SE CALCULAN LOS ROLES</p>
    🔴 <strong style="color:#ef4444">${USERS[ORIGIN].name}</strong> es el acosador — mayor grado: ${nodeDegree(ORIGIN)} conexiones<br>
    🟠 <strong style="color:#f97316">${USERS[VICTIM].name}</strong> es la víctima — más alejada del acosador (Dijkstra)<br>
    🟢 Apoyos = vecinos directos de la víctima &nbsp;|&nbsp; 🔵 Espectadores = vecinos del acosador
  `;
}

// ── Help Modal ───────────────────────────────────────
function openHelp() {
  document.getElementById('help-overlay').classList.add('open');
}

function closeHelp(e) {
  const overlay = document.getElementById('help-overlay');
  if (!e || e.target === overlay || e.currentTarget !== overlay) {
    overlay.classList.remove('open');
  }
}

// ── Initialization ───────────────────────────────────
/**
 * Punto de entrada principal. Genera el grafo inicial y arranca el juego.
 */
(function init() {
  const seed = Math.floor(Math.random() * 99999) + 1;
  generateGraph(seed);
  buildSidebar();
  updateStatCards();
  setMission(0);
})();
