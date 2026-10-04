import { ExperimentDefinition, ExperimentInstance, ExperimentMetrics, RenderSurface, seededRandom, clearSurface, text, clamp } from './types';

type Gene = 0 | 1 | 2 | 3; // right, down, left, up
interface Candidate { genome: Gene[]; fitness: number; x: number; y: number; }

export class GeneticAlgorithmExperiment implements ExperimentInstance {
  get definition(): ExperimentDefinition { return geneticAlgorithmDefinition; }
  cols = 24; rows = 14; length = 42; populationSize = 52; mutationRate = .055; selectionPressure = 2; population: Candidate[] = []; generation = 0; best: Candidate | null = null; target = { x: 21, y: 11 }; walls = new Set<string>();
  private random: () => number; private seed: number;
  constructor(seed = 42) { this.seed = seed; this.random = seededRandom(seed); this.makeWalls(); this.reset(); }
  init(): void { this.reset(); }
  private makeWalls(): void { this.walls.clear(); for (let y = 2; y < this.rows - 1; y += 1) { if (y === 7) continue; this.walls.add(`${8},${y}`); } for (let x = 10; x < 20; x += 1) { if (x === 15) continue; this.walls.add(`${x},${5}`); } }
  private randomCandidate(): Candidate { const genome = Array.from({ length: this.length }, () => Math.floor(this.random() * 4) as Gene); return { genome, fitness: 0, x: 2, y: 2 }; }
  reset(): void { this.generation = 0; this.population = Array.from({ length: this.populationSize }, () => this.randomCandidate()); this.best = null; this.evaluate(); }
  setSeed(seed: number): void { this.seed = seed; this.random = seededRandom(seed); this.makeWalls(); this.reset(); }
  setParameter(name: string, value: number | string | boolean): void { if (name === 'mutationRate' && typeof value === 'number') this.mutationRate = clamp(value, 0, .4); if (name === 'selectionPressure' && typeof value === 'number') this.selectionPressure = Math.max(2, Math.min(6, Math.round(value))); if (name === 'population' && typeof value === 'number') { this.populationSize = Math.max(8, Math.min(150, Math.round(value))); this.reset(); } }
  private evaluate(): void { this.population.forEach(c => { let x = 2; let y = 2; let penalties = 0; for (const g of c.genome) { const nx = x + (g === 0 ? 1 : g === 2 ? -1 : 0); const ny = y + (g === 1 ? 1 : g === 3 ? -1 : 0); if (nx < 0 || ny < 0 || nx >= this.cols || ny >= this.rows || this.walls.has(`${nx},${ny}`)) penalties += 1; else { x = nx; y = ny; } } c.x = x; c.y = y; const d = Math.abs(this.target.x - x) + Math.abs(this.target.y - y); c.fitness = 1 / (1 + d + penalties * .65) + (x === this.target.x && y === this.target.y ? 2 : 0); }); this.population.sort((a, b) => b.fitness - a.fitness); this.best = this.population[0]; }
  private tournament(): Candidate { let best = this.population[Math.floor(this.random() * this.population.length)]; for (let i = 1; i < this.selectionPressure; i += 1) { const candidate = this.population[Math.floor(this.random() * this.population.length)]; if (candidate.fitness > best.fitness) best = candidate; } return best; }
  step(): void { this.evaluate(); const next: Candidate[] = [this.clone(this.population[0]), this.clone(this.population[1])]; while (next.length < this.populationSize) { const a = this.tournament(); const b = this.tournament(); const cut = Math.floor(this.random() * this.length); const genome = a.genome.map((g, i) => (i < cut ? g : b.genome[i])) as Gene[]; for (let i = 0; i < genome.length; i += 1) if (this.random() < this.mutationRate) genome[i] = Math.floor(this.random() * 4) as Gene; next.push({ genome, fitness: 0, x: 2, y: 2 }); } this.population = next; this.generation += 1; this.evaluate(); }
  private clone(c: Candidate): Candidate { return { genome: [...c.genome], fitness: c.fitness, x: c.x, y: c.y }; }
  getMetrics(): ExperimentMetrics { const avg = this.population.reduce((a, c) => a + c.fitness, 0) / this.population.length; return { generation: this.generation, bestFitness: Number((this.best?.fitness ?? 0).toFixed(4)), averageFitness: Number(avg.toFixed(4)), bestX: this.best?.x ?? 0, bestY: this.best?.y ?? 0, mutationRate: this.mutationRate, selectionPressure: this.selectionPressure }; }
  render({ ctx, width, height }: RenderSurface): void {
    clearSurface({ ctx, width, height }, '#090b10'); const pad = 28; const cell = Math.min((width * .62 - pad * 2) / this.cols, (height - 78) / this.rows); const ox = pad; const oy = 49;
    for (let y = 0; y < this.rows; y += 1) for (let x = 0; x < this.cols; x += 1) { ctx.fillStyle = this.walls.has(`${x},${y}`) ? '#303842' : '#111820'; ctx.fillRect(ox + x * cell, oy + y * cell, cell - 1, cell - 1); }
    ctx.fillStyle = '#d8b962'; ctx.beginPath(); ctx.arc(ox + (2.5) * cell, oy + (2.5) * cell, Math.max(3, cell * .22), 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#98d0a5'; ctx.fillRect(ox + this.target.x * cell + cell * .24, oy + this.target.y * cell + cell * .24, cell * .52, cell * .52);
    this.population.slice(0, Math.min(25, this.population.length)).forEach((c, i) => { ctx.globalAlpha = .12 + .55 * (1 - i / Math.min(25, this.population.length)); ctx.fillStyle = '#79aabd'; ctx.beginPath(); ctx.arc(ox + (c.x + .5) * cell, oy + (c.y + .5) * cell, Math.max(2, cell * .1), 0, Math.PI * 2); ctx.fill(); }); ctx.globalAlpha = 1;
    const px = width * .68; text(ctx, 'GENETIC ALGORITHM', px, 70, 13, '#e0e6ee'); text(ctx, `generation ${this.generation}`, px, 104, 13, '#b9c3ce'); text(ctx, `best fitness ${(this.best?.fitness ?? 0).toFixed(4)}`, px, 132, 13, '#e1c978'); text(ctx, `mean fitness ${((this.getMetrics().averageFitness as number) || 0).toFixed(4)}`, px, 158, 13, '#8bb8a8'); text(ctx, 'selection → crossover → mutation', px, 205, 12, '#9aa9b8'); text(ctx, 'Genome:  R D L U …', px, 230, 12, '#d3dbe3'); text(ctx, `mutation ${(this.mutationRate * 100).toFixed(1)}%`, px, 255, 12, '#8996a3'); text(ctx, 'goal', ox + (this.target.x + .5) * cell, oy + (this.target.y - .25) * cell, 10, '#98d0a5');
    text(ctx, 'Each generation is evaluated on the same obstacle course.', 28, height - 17, 11, '#8996a3');
  }
}

export const geneticAlgorithmDefinition: ExperimentDefinition = {
  id: 'genetic-algorithm', name: 'Genetic Algorithm', year: 1975, category: 'evolution', description: 'Populations of action genomes improve by selection, crossover and mutation.', historicalNote: 'Genetic algorithms were developed by John Holland and colleagues in the 1970s; this maze is an educational reconstruction.', historicalContext: 'John Holland’s work framed adaptation as search over populations of encoded candidates.', coreIdea: 'Selection, crossover and mutation alter a population toward higher fitness.', significance: 'Shows an optimisation process without hand-coding a route.', reference: 'J. H. Holland, Adaptation in Natural and Artificial Systems (1975)', tags: ['population', 'optimization'], formula: 'fitness → select → crossover → mutate', defaultDuration: 20, supportsInteraction: true, create: (seed = 42) => new GeneticAlgorithmExperiment(seed),
};

export function createGeneticAlgorithm(seed = 42): GeneticAlgorithmExperiment { return new GeneticAlgorithmExperiment(seed); }
export default GeneticAlgorithmExperiment;
