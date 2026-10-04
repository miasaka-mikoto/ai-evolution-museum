import { ExperimentBase, clearCanvas, circle, line, text } from '../common';
import type { ExperimentDefinition, RenderTarget, ExperimentInstance } from '../../types/experiment';

/** Threshold neuron from the early connectionist models. */
export class McCullochPittsExperiment extends ExperimentBase implements ExperimentInstance {
  readonly definition: ExperimentDefinition = {
    id: 'mcculloch-pitts', name: 'McCulloch–Pitts Neuron', year: 1943,
    category: 'learning', era: 'connectionist',
    description: 'A weighted threshold unit computes a Boolean output from its inputs.',
    historicalContext: 'McCulloch and Pitts showed how idealised neurons can implement logic.',
    coreIdea: 'Fire when the weighted sum reaches a threshold.',
    significance: 'The threshold abstraction seeded decades of neural-network research.',
    reference: 'McCulloch & Pitts, A Logical Calculus of Ideas Immanent in Nervous Activity (1943)',
    formula: 'y = 1[Σ wᵢxᵢ ≥ θ]', defaultDuration: 9, supportsInteraction: true,
    tags: ['neuron', 'threshold', 'connectionism']
  };
  private inputs = [1, 0, 1, 1]; private weights = [0.9, -0.6, 0.7, 0.5]; private threshold = 1.2; private tick = 0; private output = 0;
  constructor(seed = 42) { super(); this.seed = seed | 0; this.rng.setSeed(this.seed); }
  init() { this.reset(); this.initialized = true; }
  reset() { this.inputs = [1, 0, 1, 1]; this.weights = [0.9, -0.6, 0.7, 0.5]; this.threshold = 1.2; this.tick = 0; this.compute(); }
  private compute() { const sum = this.inputs.reduce((acc, x, i) => acc + x * this.weights[i], 0); this.output = sum >= this.threshold ? 1 : 0; }
  step() { this.ensureInit(); this.tick++; const i = this.tick % this.inputs.length; this.inputs[i] = this.inputs[i] ? 0 : 1; this.compute(); }
  setParameter(name: string, value: number | string | boolean) {
    if (name === 'threshold' && typeof value === 'number') { this.threshold = value; this.compute(); }
    const m = /^x([0-9]+)$/i.exec(name); if (m && typeof value === 'number') { const raw = Number(m[1]); const i = raw === 0 ? 0 : raw - 1; if (i >= 0 && i < this.inputs.length) { this.inputs[i] = value ? 1 : 0; this.compute(); } }
  }
  getMetrics() { const sum = this.inputs.reduce((a, x, i) => a + x * this.weights[i], 0); return { tick: this.tick, weightedSum: Number(sum.toFixed(3)), threshold: this.threshold, output: this.output }; }
  getState() { return { inputs: [...this.inputs], weights: [...this.weights], threshold: this.threshold, output: this.output }; }
  render(ctx: RenderTarget, width = this.width, height = this.height) {
    const c = ctx as CanvasRenderingContext2D; clearCanvas(c, '#101115'); text(c, 'THRESHOLD UNIT · McCULLOCH–PITTS', 28, 34, 12, '#aab2bd');
    const cx = width * .68, cy = height * .5; circle(c, cx, cy, 68, this.output ? '#dbc792' : '#20252c', '#d0d8e0'); text(c, this.output ? '1' : '0', cx, cy, 30, this.output ? '#151619' : '#edf0f3', 'center'); text(c, `Σ ≥ ${this.threshold.toFixed(2)}`, cx, cy + 96, 12, '#9ca9b5', 'center');
    this.inputs.forEach((v, i) => { const y = height * .23 + i * height * .16; const x = width * .18; line(c, x + 32, y, cx - 70, cy, v ? '#d9c693' : '#4d5864', v ? 3 : 1); circle(c, x, y, 23, v ? '#d9c693' : '#1d2329', '#b8c2cd'); text(c, `x${i + 1}`, x, y - 2, 12, v ? '#131518' : '#e8edf1', 'center'); text(c, `${v} × ${this.weights[i].toFixed(1)}`, x + 52, y, 13, '#c9d1d8'); });
    const sum = this.inputs.reduce((a, x, i) => a + x * this.weights[i], 0); text(c, `weighted sum  ${sum.toFixed(2)}`, 28, height - 55, 14, '#e5e8eb'); text(c, `output  ${this.output}`, width - 28, height - 55, 14, this.output ? '#dbc792' : '#a7b1bc', 'right');
  }
}
export function createMcCullochPitts(seed = 42): ExperimentInstance { const e = new McCullochPittsExperiment(seed); e.init(); return e; }
export default McCullochPittsExperiment;
