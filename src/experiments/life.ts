import { ExperimentDefinition, ExperimentInstance, ExperimentMetrics, RenderSurface, seededRandom, clearSurface, text } from './types';

export type LifePattern = 'random' | 'glider' | 'blinker' | 'pulsar' | 'gun';

const PATTERNS: Record<Exclude<LifePattern, 'random'>, string[]> = {
  glider: ['010', '001', '111'],
  blinker: ['111'],
  pulsar: [
    '..111...111..',
    '.............',
    '1....1.1....1',
    '1....1.1....1',
    '1....1.1....1',
    '..111...111..',
    '.............',
    '..111...111..',
    '1....1.1....1',
    '1....1.1....1',
    '1....1.1....1',
    '.............',
    '..111...111..',
  ],
  gun: [
    '........................1...........',
    '......................1.1...........',
    '............11......11............11',
    '...........1...1....11............11',
    '..11......1.....1...11..............',
    '..11......1...1.11....1.1...........',
    '..........1.....1.......1...........',
    '...........1...1....................',
    '............11......................',
  ],
};

export class LifeExperiment implements ExperimentInstance {
  get definition(): ExperimentDefinition { return lifeDefinition; }
  cols = 96; rows = 48; cells: Uint8Array; generation = 0; population = 0; pattern: LifePattern = 'glider'; speed = 8;
  private random: () => number; private seed: number; private accumulator = 0;
  constructor(seed = 42) { this.seed = seed; this.random = seededRandom(seed); this.cells = new Uint8Array(this.cols * this.rows); this.reset(); }
  init(): void { this.reset(); }

  reset(): void {
    this.cells.fill(0); this.generation = 0; this.accumulator = 0;
    if (this.pattern === 'random') { for (let i = 0; i < this.cells.length; i += 1) this.cells[i] = this.random() < .22 ? 1 : 0; }
    else this.putPattern(this.pattern);
    this.population = this.cells.reduce((a, b) => a + b, 0);
  }
  setSeed(seed: number): void { this.seed = seed; this.random = seededRandom(seed); this.reset(); }
  setParameter(name: string, value: number | string | boolean): void {
    if (name === 'pattern' && typeof value === 'string' && value in PATTERNS || name === 'pattern' && value === 'random') { this.pattern = value as LifePattern; this.reset(); }
    if (name === 'patternIndex' && typeof value === 'number') { this.pattern = (['random', 'glider', 'blinker', 'pulsar', 'gun'] as LifePattern[])[Math.max(0, Math.min(4, Math.round(value)))]; this.reset(); }
    if (name === 'speed' && typeof value === 'number') this.speed = Math.max(0, Math.min(30, value));
  }
  private putPattern(name: LifePattern): void {
    if (name === 'random') return;
    const map = PATTERNS[name]; const sy = Math.floor(this.rows / 2 - map.length / 2); const sx = Math.floor(this.cols / 2 - map[0].length / 2);
    map.forEach((row, y) => [...row].forEach((v, x) => { if (v === '1') this.cells[((sy + y + this.rows) % this.rows) * this.cols + ((sx + x + this.cols) % this.cols)] = 1; }));
  }
  private count(x: number, y: number): number { let n = 0; for (let dy = -1; dy <= 1; dy += 1) for (let dx = -1; dx <= 1; dx += 1) if (dx || dy) n += this.cells[((y + dy + this.rows) % this.rows) * this.cols + ((x + dx + this.cols) % this.cols)]; return n; }
  step(dt = 1): void {
    if (!this.speed) return;
    this.accumulator += Math.max(0, dt) * this.speed;
    const ticks = Math.floor(this.accumulator);
    if (ticks <= 0) return;
    this.accumulator -= ticks;
    for (let t = 0; t < ticks; t += 1) { const next = new Uint8Array(this.cells.length); for (let y = 0; y < this.rows; y += 1) for (let x = 0; x < this.cols; x += 1) { const n = this.count(x, y); const alive = this.cells[y * this.cols + x] === 1; next[y * this.cols + x] = alive ? (n === 2 || n === 3 ? 1 : 0) : (n === 3 ? 1 : 0); } this.cells = next; this.generation += 1; }
    this.population = this.cells.reduce((a, b) => a + b, 0);
  }
  getMetrics(): ExperimentMetrics { return { generation: this.generation, population: this.population, pattern: this.pattern, rule: 'B3/S23' }; }
  render({ ctx, width, height }: RenderSurface): void {
    clearSurface({ ctx, width, height }, '#080b0f'); const pad = 26; const cell = Math.max(3, Math.min((width - pad * 2) / this.cols, (height - 72) / this.rows)); const ox = (width - cell * this.cols) / 2; const oy = 44;
    ctx.strokeStyle = 'rgba(124,145,164,.12)'; ctx.lineWidth = 1; for (let x = 0; x <= this.cols; x += 8) { ctx.beginPath(); ctx.moveTo(ox + x * cell, oy); ctx.lineTo(ox + x * cell, oy + this.rows * cell); ctx.stroke(); } for (let y = 0; y <= this.rows; y += 8) { ctx.beginPath(); ctx.moveTo(ox, oy + y * cell); ctx.lineTo(ox + this.cols * cell, oy + y * cell); ctx.stroke(); }
    ctx.fillStyle = '#d4e6da'; for (let y = 0; y < this.rows; y += 1) for (let x = 0; x < this.cols; x += 1) if (this.cells[y * this.cols + x]) ctx.fillRect(ox + x * cell + .5, oy + y * cell + .5, Math.max(1, cell - 1), Math.max(1, cell - 1));
    text(ctx, "CONWAY'S GAME OF LIFE", pad, 19, 13, '#d9e2ec'); text(ctx, `generation ${this.generation}  population ${this.population}  ${this.pattern}  B3/S23`, pad, height - 17, 12, '#8996a3');
  }
}

export const lifeDefinition: ExperimentDefinition = {
  id: 'game-of-life', name: "Conway's Game of Life", year: 1970, category: 'classical', description: 'A cellular automaton where local rules create moving and self-replicating structures.',
  historicalNote: 'John Conway popularised the Game of Life in 1970; this implementation uses the canonical B3/S23 rule.', historicalContext: 'Conway introduced this cellular automaton in 1970, showing how local rules can produce open-ended structure.', coreIdea: 'Each cell updates from the count of its eight neighbours.', significance: 'A compact demonstration of emergent computation.', reference: 'M. Gardner, Mathematical Games: The Fantastic Combinations of John Conway’s New Solitaire Game of Life (1970)', tags: ['cellular automaton', 'emergence'], formula: 'Birth: 3 neighbours; Survival: 2 or 3 neighbours', defaultDuration: 20, supportsInteraction: true, create: (seed = 42) => new LifeExperiment(seed),
};

export function createLife(seed = 42): LifeExperiment { return new LifeExperiment(seed); }
export { LifeExperiment as GameOfLifeExperiment };
export default LifeExperiment;
