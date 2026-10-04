import { ExperimentDefinition, ExperimentInstance, ExperimentMetrics, RenderSurface, clearSurface, text } from './types';

export interface Fact { id: string; label: string }
export interface Rule { id: string; when: string[]; then: string; explanation: string }

const FACTS: Fact[] = [
  { id: 'warm-blooded', label: 'warm-blooded' }, { id: 'has-feathers', label: 'has feathers' }, { id: 'lays-eggs', label: 'lays eggs' },
  { id: 'has-fur', label: 'has fur' }, { id: 'gives-milk', label: 'gives milk' }, { id: 'has-wings', label: 'has wings' },
  { id: 'flies', label: 'can fly' }, { id: 'bird', label: 'bird' }, { id: 'mammal', label: 'mammal' }, { id: 'eagle', label: 'eagle' }, { id: 'cat', label: 'cat' },
];
const RULES: Rule[] = [
  { id: 'r1', when: ['warm-blooded', 'has-feathers'], then: 'bird', explanation: 'Warm-blooded + feathers imply a bird.' },
  { id: 'r2', when: ['warm-blooded', 'has-fur'], then: 'mammal', explanation: 'Warm-blooded + fur imply a mammal.' },
  { id: 'r3', when: ['bird', 'has-wings', 'flies'], then: 'eagle', explanation: 'A bird with wings that flies is an eagle (toy ontology).' },
  { id: 'r4', when: ['mammal', 'gives-milk'], then: 'cat', explanation: 'A mammal that gives milk is a cat (toy ontology).' },
];

export class ExpertSystemExperiment implements ExperimentInstance {
  get definition(): ExperimentDefinition { return expertSystemDefinition; }
  facts = new Set<string>(); fired: Rule[] = []; cursor = 0; halted = false; query = 'eagle';
  reset(): void { this.facts = new Set(['warm-blooded', 'has-feathers', 'has-wings', 'flies']); this.fired = []; this.cursor = 0; this.halted = false; }
  constructor(_seed = 42) { this.reset(); }
  init(): void { this.reset(); }
  setParameter(name: string, value: number | string | boolean): void { if (name === 'query' && typeof value === 'string') this.query = value; }
  step(): void {
    if (this.halted) return;
    // Forward chaining: scan rules in order, fire one newly satisfied rule per tick.
    for (let i = 0; i < RULES.length; i += 1) { const rule = RULES[i]; if (this.fired.includes(rule)) continue; if (rule.when.every(f => this.facts.has(f))) { this.facts.add(rule.then); this.fired.push(rule); this.cursor = i; return; } }
    this.halted = true;
  }
  getMetrics(): ExperimentMetrics { return { knownFacts: this.facts.size, firedRules: this.fired.length, query: this.query, entailed: this.facts.has(this.query), halted: this.halted }; }
  render({ ctx, width, height }: RenderSurface): void {
    clearSurface({ ctx, width, height }, '#0a0c10'); const left = 28; text(ctx, 'EXPERT SYSTEM · FORWARD CHAINING', left, 24, 13, '#e0e6ee');
    const mid = width * .5; text(ctx, 'FACTS', left, 57, 11, '#92a4b5'); let y = 82; [...this.facts].forEach((id, n) => { const f = FACTS.find(v => v.id === id); ctx.fillStyle = n >= this.facts.size - this.fired.length ? '#d6ad62' : '#8bb8a8'; ctx.beginPath(); ctx.arc(left + 8, y - 3, 4, 0, Math.PI * 2); ctx.fill(); text(ctx, f?.label ?? id, left + 22, y - 3, 13, '#d4dbe4'); y += 24; });
    text(ctx, 'RULE AGENDA', mid, 57, 11, '#92a4b5'); RULES.forEach((r, i) => { const active = this.fired.includes(r); const yy = 84 + i * 42; ctx.strokeStyle = active ? '#d6ad62' : '#33404d'; ctx.lineWidth = active ? 2 : 1; ctx.beginPath(); ctx.moveTo(mid, yy); ctx.lineTo(mid + width * .37, yy); ctx.stroke(); text(ctx, `${r.id}  ${r.when.join(' ∧ ')}  →  ${r.then}`, mid, yy - 9, 12, active ? '#f0cf87' : '#a4afbb'); text(ctx, active ? 'fired' : 'waiting', mid, yy + 10, 10, active ? '#d6ad62' : '#637181'); });
    text(ctx, `query: ${this.query}   ${this.facts.has(this.query) ? 'ENTAILED' : 'not yet entailed'}   ${this.halted ? 'closed world reached' : 'reasoning…'}`, left, height - 20, 12, '#8996a3');
  }
}

export const expertSystemDefinition: ExperimentDefinition = {
  id: 'expert-system', name: 'Expert System', year: 1971, category: 'symbolic', description: 'Facts and production rules derive new knowledge through forward chaining.', historicalNote: 'Rule-based expert systems became a major AI research direction in the 1970s; this is an educational toy ontology.', historicalContext: 'Production-rule systems were a practical expression of symbolic AI in the 1970s.', coreIdea: 'Repeatedly fire a rule whose premises are all known facts.', significance: 'Makes explicit, inspectable inference visible instead of hiding it in a black box.', tags: ['symbolic', 'rules'], formula: 'if all premises ∈ Facts then add conclusion', defaultDuration: 10, supportsInteraction: true, create: (seed = 42) => new ExpertSystemExperiment(seed),
};

export { FACTS as expertFacts, RULES as expertRules };
export function createExpertSystem(seed = 42): ExpertSystemExperiment { return new ExpertSystemExperiment(seed); }
export default ExpertSystemExperiment;
