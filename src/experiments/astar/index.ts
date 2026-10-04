import { ExperimentBase, clearCanvas, roundRect, text } from '../common';
import type { ExperimentDefinition, RenderTarget, ExperimentInstance } from '../../types/experiment';

export interface GridPoint { x: number; y: number; }
export interface AStarResult { path: GridPoint[]; expanded: number; }
const key = (p: GridPoint) => `${p.x},${p.y}`;
const manhattan = (a: GridPoint, b: GridPoint) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

export function astarSearch(grid: boolean[][], start: GridPoint, goal: GridPoint): AStarResult {
  const open: Array<{ p: GridPoint; g: number; f: number }> = [{ p: { ...start }, g: 0, f: manhattan(start, goal) }];
  const gScore = new Map([[key(start), 0]]); const came = new Map<string, GridPoint>(); const closed = new Set<string>(); let expanded = 0;
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (open.length) {
    open.sort((a, b) => a.f - b.f || a.g - b.g); const current = open.shift()!; const ck = key(current.p); if (closed.has(ck)) continue; closed.add(ck); expanded++;
    if (ck === key(goal)) { const path: GridPoint[] = [current.p]; let q = ck; while (came.has(q)) { const p = came.get(q)!; path.push(p); q = key(p); } return { path: path.reverse(), expanded }; }
    for (const [dx, dy] of dirs) { const n = { x: current.p.x + dx, y: current.p.y + dy }; if (n.y < 0 || n.y >= grid.length || n.x < 0 || n.x >= (grid[0]?.length ?? 0) || grid[n.y][n.x]) continue; const nk = key(n); const tentative = current.g + 1; if (tentative < (gScore.get(nk) ?? Infinity)) { came.set(nk, current.p); gScore.set(nk, tentative); open.push({ p: n, g: tentative, f: tentative + manhattan(n, goal) }); } }
  }
  return { path: [], expanded };
}

type OpenNode = { x: number; y: number; g: number; h: number; f: number };
export class AStarExperiment extends ExperimentBase implements ExperimentInstance {
  readonly definition: ExperimentDefinition = {
    id: 'astar', name: 'A* Pathfinding', year: 1968, category: 'search', era: 'symbolic',
    description: 'A heuristic search balances distance travelled and estimated distance to the goal.',
    historicalContext: 'A* combined uniform-cost search with an admissible heuristic for efficient planning.',
    coreIdea: 'Expand the open cell with minimum f(n)=g(n)+h(n).',
    significance: 'A* is used in navigation, games, robotics, and route planning.',
    reference: 'Hart, Nilsson & Raphael, A Formal Basis for the Heuristic Determination of Minimum Cost Paths (1968)',
    formula: 'f(n) = g(n) + h(n)', defaultDuration: 14, supportsInteraction: true, tags: ['pathfinding', 'heuristic', 'grid']
  };
  private cols = 30; private rows = 17; private walls: boolean[][] = []; private start: GridPoint = { x: 1, y: 1 }; private goal: GridPoint = { x: 28, y: 15 }; private open: OpenNode[] = []; private closed = new Set<string>(); private gScore = new Map<string, number>(); private came = new Map<string, GridPoint>(); private path: GridPoint[] = []; private done = false; private tick = 0; private wallRate = .22;
  constructor(seed = 42) { super(); this.seed = seed | 0; this.rng.setSeed(this.seed); }
  init() { this.reset(); this.initialized = true; }
  reset() {
    this.rng.setSeed(this.seed); this.walls = Array.from({ length: this.rows }, () => Array.from({ length: this.cols }, () => this.rng.next() < this.wallRate));
    // Border and an always-open Manhattan corridor make the demo robust for any seed.
    for (let y = 0; y < this.rows; y++) for (let x = 0; x < this.cols; x++) if (x === 0 || y === 0 || x === this.cols - 1 || y === this.rows - 1) this.walls[y][x] = true;
    for (let x = this.start.x; x <= this.goal.x; x++) this.walls[this.start.y][x] = false; for (let y = this.start.y; y <= this.goal.y; y++) this.walls[y][this.goal.x] = false;
    this.open = [{ ...this.start, g: 0, h: manhattan(this.start, this.goal), f: manhattan(this.start, this.goal) }]; this.closed = new Set(); this.gScore = new Map([[key(this.start), 0]]); this.came = new Map(); this.path = []; this.done = false; this.tick = 0;
  }
  step() {
    this.ensureInit(); if (this.done) return; this.open.sort((a, b) => a.f - b.f || a.h - b.h); const current = this.open.shift(); if (!current) { this.done = true; return; }
    const ck = key(current); if (this.closed.has(ck)) return; this.closed.add(ck); this.tick++;
    if (ck === key(this.goal)) { this.done = true; const out: GridPoint[] = [this.goal]; let q = ck; while (this.came.has(q)) { const p = this.came.get(q)!; out.push(p); q = key(p); } this.path = out.reverse(); return; }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = { x: current.x + dx, y: current.y + dy }; if (n.x < 0 || n.x >= this.cols || n.y < 0 || n.y >= this.rows || this.walls[n.y][n.x]) continue; const nk = key(n); const g = current.g + 1; if (g < (this.gScore.get(nk) ?? Infinity)) { this.gScore.set(nk, g); this.came.set(nk, current); const h = manhattan(n, this.goal); this.open.push({ ...n, g, h, f: g + h }); } }
  }
  setParameter(name: string, value: number | string | boolean) { if (name === 'wallRate' && typeof value === 'number') { this.wallRate = Math.max(0, Math.min(.45, value)); this.reset(); } }
  getMetrics() { return { tick: this.tick, open: this.open.length, closed: this.closed.size, pathLength: this.path.length, complete: this.done }; }
  getState() { return { start: this.start, goal: this.goal, walls: this.walls, open: this.open, closed: [...this.closed], path: this.path }; }
  render(ctx: RenderTarget, width = this.width, height = this.height) {
    const c = ctx as CanvasRenderingContext2D; clearCanvas(c, '#0b0e12'); text(c, 'A* · OPEN / CLOSED / f = g + h', 28, 34, 12, '#aab3bd'); const pad = 30, top = 65; const cell = Math.min((width - pad * 2) / this.cols, (height - top - 35) / this.rows); const ox = (width - cell * this.cols) / 2;
    for (let y = 0; y < this.rows; y++) for (let x = 0; x < this.cols; x++) { const k = `${x},${y}`; let fill = this.walls[y][x] ? '#252c33' : '#10161b'; if (this.closed.has(k)) fill = '#263942'; if (this.open.some(n => n.x === x && n.y === y)) fill = '#584f39'; if (this.path.some(p => p.x === x && p.y === y)) fill = '#d7c390'; if (x === this.start.x && y === this.start.y) fill = '#8faac0'; if (x === this.goal.x && y === this.goal.y) fill = '#d7c390'; roundRect(c, ox + x * cell + .5, top + y * cell + .5, cell - 1, cell - 1, 1, fill); }
    const best = this.open.slice().sort((a, b) => a.f - b.f)[0];
    text(c, `open ${this.open.length}   closed ${this.closed.size}   path ${this.path.length || '…'}`, 28, height - 24, 12, '#b5c0ca');
    if (best) text(c, `next  (${best.x},${best.y})   g ${best.g}   h ${best.h}   f ${best.f}`, width - 28, height - 24, 12, '#d7c390', 'right');
  }
}
export function createAStar(seed = 42): ExperimentInstance { const e = new AStarExperiment(seed); e.init(); return e; }
export default AStarExperiment;
