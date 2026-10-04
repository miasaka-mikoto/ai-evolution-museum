import { ExperimentDefinition, ExperimentInstance, ExperimentMetrics, RenderSurface, seededRandom, clearSurface, text } from './types';

type Pattern = number[];
const N = 9;
const toPattern = (rows: string[]): Pattern => rows.flatMap(r => [...r].map(c => c === '#' ? 1 : -1));
const PATTERNS: Pattern[] = [toPattern(['#.......#', '.#.....#.', '..#...#..', '...#.#...', '....#....', '...#.#...', '..#...#..', '.#.....#.', '#.......#']), toPattern(['....#....', '....#....', '....#....', '#########', '....#....', '....#....', '....#....', '....#....', '....#....'])];

export class HopfieldExperiment implements ExperimentInstance {
  get definition(): ExperimentDefinition { return hopfieldDefinition; }
  size = N; weights: number[][] = []; target: Pattern = PATTERNS[0]; noisy: Pattern = []; state: Pattern = []; iteration = 0; updates = 0; energy = 0; noise = .18;
  private random: () => number;
  constructor(seed = 42) { this.random = seededRandom(seed); this.train(); this.reset(); }
  init(): void { this.reset(); }
  private train(): void { const len = this.size * this.size; this.weights = Array.from({ length: len }, () => Array(len).fill(0)); PATTERNS.forEach(p => { for (let i = 0; i < len; i += 1) for (let j = 0; j < len; j += 1) if (i !== j) this.weights[i][j] += p[i] * p[j] / len; }); }
  reset(): void { this.noisy = this.target.map(v => this.random() < this.noise ? -v : v); this.state = [...this.noisy]; this.iteration = 0; this.updates = 0; this.energy = this.computeEnergy(); }
  setSeed(seed: number): void { this.random = seededRandom(seed); this.reset(); }
  setParameter(name: string, value: number | string | boolean): void { if (name === 'noise' && typeof value === 'number') { this.noise = Math.max(0, Math.min(.48, value)); this.reset(); } if (name === 'pattern' && typeof value === 'number') { this.target = PATTERNS[Math.abs(Math.floor(value)) % PATTERNS.length]; this.reset(); } }
  private computeEnergy(): number { let e = 0; for (let i = 0; i < this.state.length; i += 1) for (let j = 0; j < this.state.length; j += 1) e -= .5 * this.weights[i][j] * this.state[i] * this.state[j]; return e; }
  step(): void { if (!this.state.length) return; const i = this.updates % this.state.length; let activation = 0; for (let j = 0; j < this.state.length; j += 1) activation += this.weights[i][j] * this.state[j]; this.state[i] = activation >= 0 ? 1 : -1; this.updates += 1; this.iteration = Math.floor(this.updates / this.state.length); this.energy = this.computeEnergy(); }
  getMetrics(): ExperimentMetrics { const matches = this.state.reduce((n, v, i) => n + (v === this.target[i] ? 1 : 0), 0) / this.state.length; return { iteration: this.iteration, energy: Number(this.energy.toFixed(2)), recovery: Number(matches.toFixed(3)), noise: this.noise }; }
  render({ ctx, width, height }: RenderSurface): void {
    clearSurface({ ctx, width, height }, '#090b10'); text(ctx, 'HOPFIELD NETWORK · ASSOCIATIVE MEMORY', 28, 24, 13, '#e0e6ee');
    const cell = Math.min(25, (width - 150) / (N * 3)); const block = N * cell; const top = 62; const labels = ['stored', 'corrupted', 'recalled']; const arrays = [this.target, this.noisy, this.state];
    arrays.forEach((arr, k) => { const ox = (width - block * 3) / 2 + k * (block + 24); text(ctx, labels[k], ox + block / 2, top - 14, 11, '#8e9baa'); for (let y = 0; y < N; y += 1) for (let x = 0; x < N; x += 1) { ctx.fillStyle = arr[y * N + x] > 0 ? '#e3c979' : '#1b2530'; ctx.fillRect(ox + x * cell, top + y * cell, cell - 2, cell - 2); } });
    text(ctx, `iteration ${this.iteration}  energy ${this.energy.toFixed(2)}  recovery ${(this.getMetrics().recovery as number * 100).toFixed(0)}%`, 28, height - 20, 12, '#8996a3');
  }
}

export const hopfieldDefinition: ExperimentDefinition = {
  id: 'hopfield', name: 'Hopfield Network', year: 1982, category: 'neural', description: 'A recurrent network settles noisy binary patterns into an attractor memory.', historicalNote: 'John Hopfield introduced energy-based recurrent neural networks in 1982; this demo uses Hebbian weights on 9×9 patterns.', historicalContext: 'Hopfield’s 1982 model linked recurrent neural computation to an explicit energy function.', coreIdea: 'Asynchronous threshold updates descend an energy landscape toward a stored attractor.', significance: 'Introduced a powerful link between neural memory and dynamical systems.', reference: 'J. J. Hopfield, Neural networks and physical systems with emergent collective computational abilities (1982)', tags: ['memory', 'energy'], formula: 'E = −½ Σᵢⱼ wᵢⱼ sᵢsⱼ', defaultDuration: 12, supportsInteraction: true, create: (seed = 42) => new HopfieldExperiment(seed),
};

export function createHopfield(seed = 42): HopfieldExperiment { return new HopfieldExperiment(seed); }
export default HopfieldExperiment;
