import { ExperimentDefinition, ExperimentInstance, ExperimentMetrics, RenderSurface, seededRandom, clearSurface, text } from './types';

export interface GridPoint { x: number; y: number }
export interface DijkstraState {
  cols: number;
  rows: number;
  walls: Set<string>;
  start: GridPoint;
  goal: GridPoint;
  distances: number[];
  previous: number[];
  open: number[];
  closed: Set<number>;
  path: number[];
  done: boolean;
  found: boolean;
  expanded: number;
  ticks: number;
}

const key = (x: number, y: number) => `${x},${y}`;
const idx = (x: number, y: number, cols: number) => y * cols + x;

export class DijkstraExperiment implements ExperimentInstance {
  get definition(): ExperimentDefinition { return dijkstraDefinition; }
  state: DijkstraState;
  private random: () => number;
  private seed: number;
  private wallRate = 0.19;
  constructor(seed = 42) { this.seed = seed; this.random = seededRandom(seed); this.state = this.makeState(); }
  init(): void { this.reset(); }

  private makeState(): DijkstraState {
    const cols = 24; const rows = 14; const walls = new Set<string>();
    for (let y = 0; y < rows; y += 1) for (let x = 0; x < cols; x += 1) {
      if ((x < 3 && y < 3) || (x > cols - 4 && y > rows - 4)) continue;
      if (this.random() < this.wallRate) walls.add(key(x, y));
    }
    const start = { x: 1, y: 1 }; const goal = { x: cols - 2, y: rows - 2 };
    walls.delete(key(start.x, start.y)); walls.delete(key(goal.x, goal.y));
    return { cols, rows, walls, start, goal, distances: Array(cols * rows).fill(Infinity), previous: Array(cols * rows).fill(-1), open: [idx(start.x, start.y, cols)], closed: new Set(), path: [], done: false, found: false, expanded: 0, ticks: 0 };
  }

  reset(): void { this.state = this.makeState(); }
  setSeed(seed: number): void { this.seed = seed; this.random = seededRandom(seed); this.reset(); }
  setParameter(name: string, value: number | string | boolean): void { if (name === 'wallRate' && typeof value === 'number') { this.wallRate = Math.max(0, Math.min(.42, value)); this.reset(); } }

  step(_dt = 1): void {
    const s = this.state; if (s.done) return; s.ticks += 1;
    const startI = idx(s.start.x, s.start.y, s.cols); if (!Number.isFinite(s.distances[startI])) s.distances[startI] = 0;
    // Select the lowest distance in the open set (the defining Dijkstra operation).
    let bestPos = -1; let bestDistance = Infinity;
    for (let i = 0; i < s.open.length; i += 1) { const node = s.open[i]; if (s.distances[node] < bestDistance) { bestDistance = s.distances[node]; bestPos = i; } }
    if (bestPos < 0) { s.done = true; s.found = false; return; }
    const current = s.open.splice(bestPos, 1)[0];
    if (s.closed.has(current)) return;
    s.closed.add(current); s.expanded += 1;
    const cx = current % s.cols; const cy = Math.floor(current / s.cols);
    if (cx === s.goal.x && cy === s.goal.y) { s.done = true; s.found = true; this.reconstruct(); return; }
    const neighbors = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const [dx, dy] of neighbors) {
      const nx = cx + dx; const ny = cy + dy; if (nx < 0 || ny < 0 || nx >= s.cols || ny >= s.rows || s.walls.has(key(nx, ny))) continue;
      const ni = idx(nx, ny, s.cols); if (s.closed.has(ni)) continue;
      const alt = s.distances[current] + 1;
      if (alt < s.distances[ni]) { s.distances[ni] = alt; s.previous[ni] = current; if (!s.open.includes(ni)) s.open.push(ni); }
    }
  }

  private reconstruct(): void {
    const s = this.state; const goalI = idx(s.goal.x, s.goal.y, s.cols); const path: number[] = []; let at = goalI;
    while (at >= 0) { path.push(at); if (at === idx(s.start.x, s.start.y, s.cols)) break; at = s.previous[at]; }
    s.path = path.reverse();
  }

  getMetrics(): ExperimentMetrics { const s = this.state; return { expanded: s.expanded, frontier: s.open.length, pathLength: s.path.length, found: s.found, ticks: s.ticks }; }

  render({ ctx, width, height }: RenderSurface): void {
    const s = this.state; clearSurface({ ctx, width, height }, '#080b10');
    const margin = Math.min(36, width * .04); const top = 48; const cell = Math.min((width - margin * 2) / s.cols, (height - top - 30) / s.rows); const ox = (width - cell * s.cols) / 2; const oy = top;
    const pathSet = new Set(s.path);
    for (let y = 0; y < s.rows; y += 1) for (let x = 0; x < s.cols; x += 1) {
      const i = idx(x, y, s.cols); const px = ox + x * cell; const py = oy + y * cell; const wall = s.walls.has(key(x, y));
      ctx.fillStyle = wall ? '#29303a' : '#0f151d'; ctx.fillRect(px + .5, py + .5, cell - 1, cell - 1);
      if (s.closed.has(i) && !wall) { ctx.fillStyle = 'rgba(91,145,178,.36)'; ctx.fillRect(px + 2, py + 2, cell - 4, cell - 4); }
      if (s.open.includes(i) && !wall) { ctx.fillStyle = 'rgba(224,174,94,.42)'; ctx.fillRect(px + cell * .25, py + cell * .25, cell * .5, cell * .5); }
      if (pathSet.has(i)) { ctx.strokeStyle = '#e9c46a'; ctx.lineWidth = Math.max(2, cell * .12); ctx.strokeRect(px + cell * .25, py + cell * .25, cell * .5, cell * .5); }
    }
    const drawDot = (p: GridPoint, color: string) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(ox + (p.x + .5) * cell, oy + (p.y + .5) * cell, Math.max(3, cell * .25), 0, Math.PI * 2); ctx.fill(); };
    drawDot(s.start, '#8dd17e'); drawDot(s.goal, '#df6c7e');
    text(ctx, 'DIJKSTRA SEARCH', margin, 20, 13, '#d9e2ec'); text(ctx, `expanded ${s.expanded}  frontier ${s.open.length}  ${s.done ? (s.found ? `distance ${s.path.length - 1}` : 'no path') : 'running'}`, margin, height - 15, 12, '#8a98a8');
  }
}

export const dijkstraDefinition: ExperimentDefinition = {
  id: 'dijkstra', name: 'Dijkstra Search', year: 1959, category: 'classical',
  description: 'Uniform-cost graph search expands the least expensive frontier node.',
  historicalNote: 'Edsger W. Dijkstra described the shortest-path algorithm in 1959; this is a grid reconstruction.',
  historicalContext: 'Dijkstra introduced a systematic shortest-path procedure for non-negative edge weights in 1959.', coreIdea: 'Expand the unsettled node with the smallest known distance and relax its neighbours.', significance: 'Uniform-cost search is the basis of routing and many planning systems.', reference: 'E. W. Dijkstra, A Note on Two Problems in Connexion with Graphs (1959)', tags: ['graph', 'shortest path'],
  formula: 'd(v) = min(d(v), d(u) + w(u,v))', defaultDuration: 12, supportsInteraction: true,
  create: (seed = 42) => new DijkstraExperiment(seed),
};

export function createDijkstra(seed = 42): DijkstraExperiment { return new DijkstraExperiment(seed); }
export default DijkstraExperiment;
