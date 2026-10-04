import { ExperimentDefinition, ExperimentInstance, ExperimentMetrics, RenderSurface, seededRandom, clearSurface, text, clamp } from './types';

export interface Organism { id: number; x: number; y: number; energy: number; speed: number; appetite: number; hue: number; age: number; }

export class CellularEvolutionExperiment implements ExperimentInstance {
  get definition(): ExperimentDefinition { return cellularEvolutionDefinition; }
  cols = 34; rows = 20; organisms: Organism[] = []; food = new Set<string>(); generation = 0; births = 0; deaths = 0; mutationRate = .08;
  private random: () => number; private seed: number; private nextId = 1;
  constructor(seed = 42) { this.seed = seed; this.random = seededRandom(seed); this.reset(); }
  init(): void { this.reset(); }
  reset(): void { this.organisms = []; this.food.clear(); this.generation = 0; this.births = 0; this.deaths = 0; this.nextId = 1; for (let i = 0; i < 22; i += 1) this.spawn(); for (let i = 0; i < 100; i += 1) this.food.add(`${Math.floor(this.random() * this.cols)},${Math.floor(this.random() * this.rows)}`); }
  setSeed(seed: number): void { this.seed = seed; this.random = seededRandom(seed); this.reset(); }
  setParameter(name: string, value: number | string | boolean): void { if (name === 'mutationRate' && typeof value === 'number') this.mutationRate = clamp(value, 0, .5); }
  private spawn(parent?: Organism): void { const x = parent ? Math.max(0, Math.min(this.cols - 1, parent.x + Math.floor(this.random() * 3) - 1)) : Math.floor(this.random() * this.cols); const y = parent ? Math.max(0, Math.min(this.rows - 1, parent.y + Math.floor(this.random() * 3) - 1)) : Math.floor(this.random() * this.rows); this.organisms.push({ id: this.nextId++, x, y, energy: parent ? 34 : 50, speed: parent ? clamp(parent.speed + (this.random() * 2 - 1) * this.mutationRate, .2, 2) : .7 + this.random() * 1.1, appetite: parent ? clamp(parent.appetite + (this.random() * 2 - 1) * this.mutationRate, .2, 1.5) : .7 + this.random() * .6, hue: parent ? (parent.hue + (this.random() * 2 - 1) * 25) : 170 + this.random() * 80, age: 0 }); }
  step(): void {
    this.generation += 1;
    // Regenerate a small amount of environment food every tick.
    for (let i = 0; i < 4; i += 1) this.food.add(`${Math.floor(this.random() * this.cols)},${Math.floor(this.random() * this.rows)}`);
    const survivors: Organism[] = []; const newborns: Organism[] = [];
    // Iterate over a snapshot: newborns are evaluated on the next tick, which
    // keeps one simulation tick bounded and prevents accidental birth cascades.
    const current = [...this.organisms];
    for (const o of current) {
      const angle = this.random() * Math.PI * 2; o.x = Math.max(0, Math.min(this.cols - 1, Math.round(o.x + Math.cos(angle) * o.speed))); o.y = Math.max(0, Math.min(this.rows - 1, Math.round(o.y + Math.sin(angle) * o.speed))); o.age += 1; o.energy -= .8 + o.speed * .25;
      const fk = `${o.x},${o.y}`; if (this.food.delete(fk)) o.energy += 8 * o.appetite;
      if (o.energy > 74) { o.energy *= .48; const before = this.organisms.length; this.spawn(o); const child = this.organisms[this.organisms.length - 1]; if (this.organisms.length > before) newborns.push(child); this.births += 1; }
      if (o.energy > 0 && o.age < 380) survivors.push(o); else this.deaths += 1;
    }
    this.organisms = survivors.concat(newborns);
    while (this.organisms.length < 6) this.spawn();
  }
  getMetrics(): ExperimentMetrics { const meanSpeed = this.organisms.reduce((a, o) => a + o.speed, 0) / Math.max(1, this.organisms.length); return { generation: this.generation, population: this.organisms.length, births: this.births, deaths: this.deaths, meanSpeed: Number(meanSpeed.toFixed(2)), mutationRate: this.mutationRate }; }
  render({ ctx, width, height }: RenderSurface): void {
    clearSurface({ ctx, width, height }, '#090c10'); const pad = 28; const cell = Math.min((width - pad * 2) / this.cols, (height - 74) / this.rows); const ox = (width - cell * this.cols) / 2; const oy = 46;
    ctx.strokeStyle = 'rgba(111,133,148,.13)'; for (let x = 0; x <= this.cols; x += 1) { ctx.beginPath(); ctx.moveTo(ox + x * cell, oy); ctx.lineTo(ox + x * cell, oy + this.rows * cell); ctx.stroke(); } for (let y = 0; y <= this.rows; y += 1) { ctx.beginPath(); ctx.moveTo(ox, oy + y * cell); ctx.lineTo(ox + this.cols * cell, oy + y * cell); ctx.stroke(); }
    ctx.fillStyle = '#b7d39d'; this.food.forEach(k => { const [x, y] = k.split(',').map(Number); ctx.fillRect(ox + x * cell + cell * .35, oy + y * cell + cell * .35, Math.max(1, cell * .3), Math.max(1, cell * .3)); });
    this.organisms.forEach(o => { const r = Math.max(3, cell * (.2 + .08 * o.speed)); ctx.fillStyle = `hsl(${o.hue},48%,66%)`; ctx.beginPath(); ctx.arc(ox + (o.x + .5) * cell, oy + (o.y + .5) * cell, r, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.stroke(); });
    text(ctx, 'CELLULAR EVOLUTION', pad, 21, 13, '#e0e6ee'); text(ctx, `generation ${this.generation}  population ${this.organisms.length}  births ${this.births}  deaths ${this.deaths}`, pad, height - 28, 12, '#8996a3'); text(ctx, `mutation ${(this.mutationRate * 100).toFixed(1)}%  trait = speed / appetite`, pad, height - 12, 11, '#9cb0bf');
  }
}

export const cellularEvolutionDefinition: ExperimentDefinition = {
  id: 'cellular-evolution', name: 'Cellular Evolution', year: 1990, category: 'evolution', description: 'A tiny artificial-life ecology where energy, movement, mutation and replication shape a population.', historicalNote: 'Educational reconstruction inspired by artificial-life and evolutionary computation research; it is not a biological model.', historicalContext: 'Artificial-life researchers used simple local rules to explore emergence and adaptation.', coreIdea: 'Energy costs, food, mutation and reproduction create selection pressure.', significance: 'A deliberately small synthetic ecology, not a claim about biological evolution.', tags: ['artificial life', 'mutation'], formula: 'energy ← energy + food − movement cost; traits mutate at reproduction', defaultDuration: 16, supportsInteraction: true, create: (seed = 42) => new CellularEvolutionExperiment(seed),
};

export function createCellularEvolution(seed = 42): CellularEvolutionExperiment { return new CellularEvolutionExperiment(seed); }
export default CellularEvolutionExperiment;
