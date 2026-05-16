# 🌐 Red Segura

**Juego educativo de algoritmos de grafos**  
Estructura de Datos II — Universidad del Norte

---

## 📋 Descripción

Red Segura es un juego interactivo basado en una narrativa de ciberacoso en redes sociales,
diseñado para demostrar el funcionamiento de los principales algoritmos de grafos.
El grafo se genera aleatoriamente en cada sesión, haciendo cada partida única.

---

## 🎮 Misiones

| Misión | Tema | Algoritmo |
|--------|------|-----------|
| 🔍 Misión 1 — Rastros del Acoso | Recorridos en grafos | BFS / DFS |
| 🛡️ Misión 2 — Ruta Segura | Caminos mínimos | Dijkstra |
| 🔗 Misión 3 — Reconstruir la Red | Árbol de expansión mínima | Kruskal |
| 🌊 Misión 4 — Control del Impacto | Flujo máximo | Ford-Fulkerson (Edmonds-Karp) |
| ✨ Misión Final — Red Segura | Integración de algoritmos | Todos |

---

## 🏗️ Arquitectura MVC

```
red-segura/
├── index.html          # Vista principal (HTML)
├── css/
│   └── styles.css      # Estilos globales
└── js/
    ├── algorithms.js   # MODEL — Algoritmos de grafos
    ├── graph.js        # MODEL + VIEW — Generación y renderizado SVG
    ├── missions.js     # CONTROLLER — Lógica de cada misión
    └── app.js          # CONTROLLER — Navegación y estado global
```

### Separación de responsabilidades

- **`algorithms.js`** (Model): Implementaciones puras de BFS, DFS, Dijkstra, Kruskal y Ford-Fulkerson. Sin dependencias de DOM.
- **`graph.js`** (Model + View): Generación aleatoria del grafo con semilla reproducible. Renderizado SVG del grafo.
- **`missions.js`** (Controller): Lógica interactiva de cada misión. Conecta algoritmos con la interfaz.
- **`app.js`** (Controller): Navegación entre misiones, actualización de estadísticas y sidebar.

---

## 🧮 Algoritmos implementados

### BFS — Breadth-First Search `O(V + E)`
Recorre el grafo nivel por nivel usando una cola (FIFO).
Revela la propagación del acoso capa a capa desde el nodo origen.

### DFS — Depth-First Search `O(V + E)`
Recorre el grafo por cadenas profundas usando recursión.
Rastrea interacciones en profundidad para identificar el origen.

### Dijkstra — Caminos Mínimos `O((V+E) log V)`
Encuentra la ruta de menor riesgo emocional desde un nodo de apoyo hasta la víctima.
Implementado con selección greedy del nodo de menor distancia.

### Kruskal — Árbol de Expansión Mínima `O(E log E)`
Reconstruye la red de confianza con el menor costo total.
Usa Union-Find con compresión de caminos y ranking.

### Ford-Fulkerson — Flujo Máximo `O(VE²)`
Calcula la capacidad máxima de propagación del acoso entre dos nodos.
Variante Edmonds-Karp con BFS para encontrar caminos aumentantes.

---

## 🎲 Generación dinámica del grafo

Cada sesión genera una red diferente:

1. **Semilla reproducible**: Usa el algoritmo Mulberry32 para números pseudoaleatorios. El Seed se muestra en el header.
2. **Conexidad garantizada**: Se construye primero un spanning tree aleatorio.
3. **Aristas adicionales**: Se añaden 5-7 aristas extra para mayor densidad.
4. **Comportamientos calculados**:
   - 🔴 **Acosador**: nodo con mayor grado (más conexiones)
   - 🟠 **Víctima**: nodo más alejado del acosador (Dijkstra)
   - 🟢 **Apoyo**: vecinos directos de la víctima
   - 🔵 **Espectador**: vecinos directos del acosador
   - ⚫ **Neutral**: resto de nodos

---

## 🚀 Cómo ejecutar

No requiere instalación. Solo abre `index.html` en cualquier navegador moderno.

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/red-segura.git

# Abrir en el navegador
cd red-segura
open index.html   # macOS
start index.html  # Windows
```

O simplemente haz doble clic en `index.html`.

---

## 🛠️ Tecnologías

- **HTML5** — Estructura y semántica
- **CSS3** — Estilos con custom properties (variables CSS)
- **JavaScript ES6+** — Vanilla JS, sin frameworks ni dependencias
- **SVG** — Renderizado del grafo

---

## 👥 Equipo

Universidad del Norte — Departamento de Ingeniería de Sistemas y Computación  
Estructura de Datos II — Laboratorio 2 — 2026
