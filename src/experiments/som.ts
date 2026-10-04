import { ExperimentDefinition, ExperimentInstance, ExperimentMetrics, RenderSurface, seededRandom, clearSurface, text, clamp } from './types';

interface Point { x: number; y: number }
interface Unit { x: number; y: number; wx: number; wy: number }

export class SOMExperiment implements ExperimentInstance {
  get definition(): ExperimentDefinition { return somDefinition; }
  mapW = 9; mapH = 6; units: Unit[] = []; points: Point[] = []; iteration = 0; learningRate = .42; radius = 4.2; private random: () => number;
  constructor(seed = 42) { this.random = seededRandom(seed); this.generatePoints(); this.reset(); }
  init(): void { this.reset(); }
  private generatePoints(): void { this.points = []; const centers = [[.25, .28], [.72, .32], [.48, .76]]; for (let i = 0; i < 100; i += 1) { const c = centers[i % centers.length]; this.points.push({ x: clamp(c[0] + (this.random() * 2 - 1) * .14, .03, .97), y: clamp(c[1] + (this.random() * 2 - 1) * .14, .03, .97) }); } }
  reset(): void { this.iteration = 0; this.learningRate = .42; this.radius = 4.2; this.units = []; for (let y = 0; y < this.mapH; y += 1) for (let x = 0; x < this.mapW; x += 1) this.units.push({ x, y, wx: this.random(), wy: this.random() }); }
  setSeed(seed: number): void { this.random = seededRandom(seed); this.generatePoints(); this.reset(); }
  setParameter(name: string, value: number | string | boolean): void { if (name === 'learningRate' && typeof value === 'number') this.learningRate = clamp(value, .01, 1); }
  step(): void { if (!this.points.length) return; const p = this.points[this.iteration % this.points.length]; let best = this.units[0]; let bestD = Infinity; this.units.forEach(u => { const d = (u.wx - p.x) ** 2 + (u.wy - p.y) ** 2; if (d < bestD) { best = u; bestD = d; } }); this.units.forEach(u => { const gridD = Math.hypot(u.x - best.x, u.y - best.y); const influence = Math.exp(-(gridD * gridD) / (2 * this.radius * this.radius)); u.wx += this.learningRate * influence * (p.x - u.wx); u.wy += this.learningRate * influence * (p.y - u.wy); }); this.iteration += 1; this.learningRate = Math.max(.035, this.learningRate * .9985); this.radius = Math.max(.65, this.radius * .9992); }
  getMetrics(): ExperimentMetrics { return { iteration: this.iteration, learningRate: Number(this.learningRate.toFixed(3)), radius: Number(this.radius.toFixed(2)), units: this.units.length }; }
  render({ ctx, width, height }: RenderSurface): void {
    clearSurface({ ctx, width, height }, '#090b10'); text(ctx, 'SELF-ORGANIZING MAP', 28, 23, 13, '#e0e6ee'); const side = Math.min(width * .58, height - 90); const ox = 36; const oy = 52; const scale = side;
    ctx.strokeStyle = 'rgba(139,173,184,.25)'; ctx.lineWidth = 1; for (let y = 0; y < this.mapH; y += 1) for (let x = 0; x < this.mapW; x += 1) { const u = this.units[y * this.mapW + x]; if (x < this.mapW - 1) { const v = this.units[y * this.mapW + x + 1]; ctx.beginPath(); ctx.moveTo(ox + u.wx * scale, oy + u.wy * scale); ctx.lineTo(ox + v.wx * scale, oy + v.wy * scale); ctx.stroke(); } if (y < this.mapH - 1) { const v = this.units[(y + 1) * this.mapW + x]; ctx.beginPath(); ctx.moveTo(ox + u.wx * scale, oy + u.wy * scale); ctx.lineTo(ox + v.wx * scale, oy + v.wy * scale); ctx.stroke(); } }
    this.points.forEach(p => { ctx.fillStyle = 'rgba(218,180,111,.35)'; ctx.beginPath(); ctx.arc(ox + p.x * scale, oy + p.y * scale, 2.5, 0, Math.PI * 2); ctx.fill(); }); this.units.forEach(u => { ctx.fillStyle = '#9fc9c5'; ctx.beginPath(); ctx.arc(ox + u.wx * scale, oy + u.wy * scale, 4, 0, Math.PI * 2); ctx.fill(); });
    const px = width * .68; text(ctx, 'TOPOLOGICAL LEARNING', px, 76, 11, '#91a1af'); text(ctx, `iteration ${this.iteration}`, px, 110, 14, '#d5dee6'); text(ctx, `η ${this.learningRate.toFixed(3)}`, px, 140, 13, '#d6ad62'); text(ctx, `neighbourhood σ ${this.radius.toFixed(2)}`, px, 166, 13, '#8bb8a8'); text(ctx, 'winner + neighbours move toward sample', px, 212, 11, '#a6b2bd'); text(ctx, 'nearby units preserve topology', px, 235, 11, '#8996a3');
  }
}

export const somDefinition: ExperimentDefinition = { id: 'som', name: 'Self-Organizing Map', year: 1982, category: 'unsupervised', description: 'A two-dimensional lattice learns to preserve the topology of a point distribution.', historicalNote: 'Teuvo Kohonen introduced self-organizing maps in the early 1980s; this is a small online-learning reconstruction.', historicalContext: 'Kohonen’s self-organizing maps use competitive learning and neighbourhood cooperation.', coreIdea: 'The best-matching unit and its neighbours move toward each sample.', significance: 'Unsupervised learning can preserve neighbourhood structure in a low-dimensional map.', reference: 'T. Kohonen, Self-Organized Formation of Topologically Correct Feature Maps (1982)', tags: ['topology', 'competitive learning'], formula: 'wᵢ ← wᵢ + η hᵢ(x − wᵢ)', defaultDuration: 15, supportsInteraction: true, create: (seed = 42) => new SOMExperiment(seed) };

export function createSOM(seed = 42): SOMExperiment { return new SOMExperiment(seed); }
export default SOMExperiment;
