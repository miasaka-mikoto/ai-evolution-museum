// @ts-nocheck
import { ExperimentBase, clearCanvas, text, line, circle, roundRect } from './common';
import type { ExperimentDefinition, ExperimentInstance, RenderTarget } from '../types/experiment';

type Tile = '#' | '.' | 'D' | 'K' | 'G' | 'H' | 'F' | 'T' | 'O';
type Pos = { x: number; y: number };
const ACTIONS: Array<[number, number, string]> = [[1, 0, '→'], [0, 1, '↓'], [-1, 0, '←'], [0, -1, '↑']];
const keyOf = (p: Pos) => `${p.x},${p.y}`;
const eq = (a: Pos, b: Pos) => a.x === b.x && a.y === b.y;

/**
 * A small model-based agent in a partially observed world.  Every tick runs
 * observe → remember → predict → plan → act → update; no prerecorded motion
 * is used.  Unknown cells are explicitly represented in the belief map.
 */
export class WorldModelExperiment extends ExperimentBase implements ExperimentInstance {
  readonly definition: ExperimentDefinition = {
    id: 'world-model', name: 'Agent + World Model', year: 2020, category: 'agent', era: 'agentic',
    description: 'A partially observed agent builds a belief map, predicts actions, plans, and updates its world model.',
    historicalContext: 'Modern agents combine perception, learned or symbolic dynamics, memory and planning; this is an educational grid reconstruction.',
    coreIdea: 'Act from an internal belief, compare prediction with observation, and revise the plan.',
    significance: 'Makes the observe–remember–predict–plan–act loop visible without claiming a full world model.',
    reference: 'Educational reconstruction of partially observable planning',
    formula: 'bₜ₊₁ = Update(bₜ, oₜ₊₁, aₜ); aₜ = Plan(bₜ, goal)', defaultDuration: 25,
    supportsInteraction: true, tags: ['agent', 'memory', 'planning', 'partial-observation']
  };
  readonly cols = 20; readonly rows = 12; readonly vision = 2;
  world: Tile[][] = []; belief: Int8Array = new Int8Array(); agent: Pos = { x: 1, y: 1 }; goal: Pos = { x: 18, y: 10 };
  key = false; tick = 0; reward = 0; predictionError = 0; action = '—'; phase = 'observe'; memory: Pos[] = []; plan: Pos[] = [];
  private hasObject = true; private door: Pos = { x: 10, y: 5 }; private teleport: Pos = { x: 3, y: 9 }; private targetTeleport: Pos = { x: 16, y: 2 };

  init() { this.initialized = true; this.reset(); }
  reset() {
    this.tick = 0; this.reward = 0; this.predictionError = 0; this.action = '—'; this.phase = 'observe'; this.key = false; this.hasObject = true; this.memory = []; this.plan = [];
    const rows = [
      '####################', '#....#.............#', '#....#..F..........#', '#....#........#...T#', '#....###.######....#', '#........D.........#', '#..H.....#.........#', '#........#....###..#', '#........#.........#', '#..T.....#.....K...#', '#........#.......G.#', '####################'
    ];
    this.world = rows.map(r => [...r] as Tile[]); this.agent = { x: 1, y: 1 }; this.goal = { x: 17, y: 10 }; this.door = { x: 9, y: 5 }; this.teleport = { x: 3, y: 9 }; this.targetTeleport = { x: 17, y: 3 };
    this.belief = new Int8Array(this.cols * this.rows); this.belief.fill(-1); this.observe();
  }

  private index(p: Pos) { return p.y * this.cols + p.x; }
  private inBounds(p: Pos) { return p.x >= 0 && p.y >= 0 && p.x < this.cols && p.y < this.rows; }
  private tile(p: Pos): Tile { return this.inBounds(p) ? this.world[p.y][p.x] : '#'; }
  private passable(p: Pos): boolean { const t = this.tile(p); return t !== '#' && (t !== 'D' || this.key); }
  private observe() {
    let visible = 0;
    for (let dy = -this.vision; dy <= this.vision; dy++) for (let dx = -this.vision; dx <= this.vision; dx++) {
      const p = { x: this.agent.x + dx, y: this.agent.y + dy }; if (!this.inBounds(p)) continue;
      this.belief[this.index(p)] = this.tile(p) === '#' ? 1 : 0; visible++;
      if (this.tile(p) === 'K') this.key = true;
    }
    this.memory.push({ ...this.agent }); if (this.memory.length > 80) this.memory.shift();
    this.metrics.visible = visible; this.phase = 'remember';
  }
  private predict(next: Pos) {
    // A tiny deterministic transition model: blocked moves stay put.
    const predicted = this.passable(next) ? next : this.agent; this.predictionError = predicted.x === next.x && predicted.y === next.y ? 0 : 1; this.phase = 'predict'; return predicted;
  }
  private planPath(): Pos[] {
    const queue: Pos[] = [{ ...this.agent }], prev = new Map<string, Pos>(); const seen = new Set<string>([keyOf(this.agent)]);
    while (queue.length) {
      const p = queue.shift()!; if (eq(p, this.goal)) break;
      for (const [dx, dy] of ACTIONS) { const n = { x: p.x + dx, y: p.y + dy }; if (!this.inBounds(n)) continue; const b = this.belief[this.index(n)]; if (b === 1 || seen.has(keyOf(n))) continue; seen.add(keyOf(n)); prev.set(keyOf(n), p); queue.push(n); }
    }
    const out: Pos[] = []; let at = { ...this.goal }; while (!eq(at, this.agent) && prev.has(keyOf(at))) { out.push(at); at = prev.get(keyOf(at))!; }
    return out.reverse();
  }
  private chooseAction() {
    this.plan = this.planPath(); this.phase = 'plan'; if (!this.plan.length) { this.action = 'wait'; return { ...this.agent }; }
    const next = this.plan[0]; const dx = next.x - this.agent.x, dy = next.y - this.agent.y; this.action = ACTIONS.find(a => a[0] === dx && a[1] === dy)?.[2] ?? 'wait'; return next;
  }
  step() {
    this.ensureInit(); if (eq(this.agent, this.goal)) { this.reward += 1; this.reset(); return; }
    this.observe(); const next = this.chooseAction(); const predicted = this.predict(next); this.phase = 'act';
    const before = { ...this.agent }; this.agent = predicted;
    const t = this.tile(this.agent); if (t === 'K') { this.key = true; this.world[this.agent.y][this.agent.x] = '.'; this.reward += .3; }
    if (t === 'F') { this.reward += .1; this.world[this.agent.y][this.agent.x] = '.'; }
    if (t === 'H') { this.reward -= .5; this.agent = { ...before }; }
    if (t === 'T') this.agent = { ...this.targetTeleport };
    if (eq(this.agent, this.goal)) this.reward += 1;
    this.tick++; this.phase = 'update'; this.metrics.tick = this.tick; this.metrics.agentX = this.agent.x; this.metrics.agentY = this.agent.y; this.metrics.key = this.key; this.metrics.planLength = this.plan.length; this.metrics.reward = Number(this.reward.toFixed(2)); this.metrics.predictionError = this.predictionError;
  }
  setParameter(name: string, value: number | string | boolean) { if (name === 'vision' && typeof value === 'number') (this as any).vision = Math.max(1, Math.min(3, Math.round(value))); }
  getMetrics() { return { tick: this.tick, phase: this.phase, agentX: this.agent.x, agentY: this.agent.y, key: this.key, planLength: this.plan.length, reward: Number(this.reward.toFixed(2)), predictionError: this.predictionError, knownCells: [...this.belief].filter(v => v >= 0).length }; }
  getState() { return { agent: { ...this.agent }, goal: { ...this.goal }, key: this.key, belief: [...this.belief], plan: this.plan.map(p => ({ ...p })), memory: this.memory.map(p => ({ ...p })), action: this.action, phase: this.phase }; }
  render(ctx: RenderTarget, width = this.width, height = this.height) {
    const c = ctx as CanvasRenderingContext2D; clearCanvas(c, '#080b10'); text(c, 'AGENT + WORLD MODEL', 24, 24, 14, '#e3e8ec'); text(c, 'observe  remember  predict  plan  act  update', width - 24, 24, 11, '#8b99a8', 'right');
    const top = 56, gap = 24, panelW = (width - gap * 3) / 2, cell = Math.min((panelW - 18) / this.cols, (height - top - 54) / this.rows), panelH = cell * this.rows; const x1 = gap, x2 = gap * 2 + panelW;
    const drawGrid = (ox: number, useBelief: boolean) => { roundRect(c, ox - 8, top - 8, panelW + 16, panelH + 16, 5, '#101720', '#26333e'); for (let y = 0; y < this.rows; y++) for (let x = 0; x < this.cols; x++) { const p = { x, y }; const b = this.belief[this.index(p)]; const t = this.tile(p); let fill = useBelief ? (b < 0 ? '#0d1319' : b === 1 ? '#303943' : '#17242b') : (t === '#' ? '#303943' : '#17242b'); if (!useBelief && t === 'D' && !this.key) fill = '#8c6f45'; if (!useBelief && t === 'H') fill = '#713f45'; if (!useBelief && t === 'F') fill = '#536b51'; if (!useBelief && t === 'K') fill = '#b79850'; if (!useBelief && t === 'T') fill = '#596e83'; c.fillStyle = fill; c.fillRect(ox + x * cell, top + y * cell, cell - 1, cell - 1); if (useBelief && b < 0) { c.fillStyle = '#182129'; c.fillRect(ox + x * cell + cell * .4, top + y * cell + cell * .4, Math.max(1, cell * .2), Math.max(1, cell * .2)); } }
      if (useBelief) { c.strokeStyle = '#d4b46b'; c.lineWidth = 2; this.plan.forEach(p => c.strokeRect(ox + p.x * cell + 2, top + p.y * cell + 2, cell - 5, cell - 5)); }
      const p = this.agent; c.fillStyle = '#e6edf1'; c.beginPath(); c.arc(ox + (p.x + .5) * cell, top + (p.y + .5) * cell, Math.max(3, cell * .22), 0, Math.PI * 2); c.fill();
      if (!useBelief) { c.fillStyle = '#9bd0a6'; c.fillRect(ox + this.goal.x * cell + cell * .25, top + this.goal.y * cell + cell * .25, cell * .5, cell * .5); }
    };
    drawGrid(x1, false); drawGrid(x2, true); text(c, 'GROUND TRUTH', x1, top + panelH + 23, 11, '#96a4b0'); text(c, 'AGENT BELIEF + PLAN', x2, top + panelH + 23, 11, '#d4b46b');
    text(c, `phase ${this.phase}   action ${this.action}   memory ${this.memory.length}   known ${this.getMetrics().knownCells}/${this.cols * this.rows}`, 24, height - 23, 12, '#aeb9c4');
  }
}

export const worldModelDefinition: ExperimentDefinition = {
  id: 'world-model', name: 'Agent + World Model', year: 2020, category: 'agent', description: 'A partially observed agent remembers, predicts, plans and acts in a changing grid world.', historicalNote: 'Educational reconstruction; it does not claim to reproduce a particular deployed world model.', formula: 'Observe → Remember → Predict → Plan → Act → Update', defaultDuration: 25, supportsInteraction: true,
  create: (seed = 42) => new WorldModelExperiment(seed),
};

export function createWorldModel(seed = 42): WorldModelExperiment { const e = new WorldModelExperiment(seed); e.init(); return e; }
export default WorldModelExperiment;
