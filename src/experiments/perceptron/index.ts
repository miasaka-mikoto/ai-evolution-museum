import { ExperimentBase, SeededRng, clearCanvas, circle, line, text } from '../common';
import type { ExperimentDefinition, RenderTarget, ExperimentInstance } from '../../types/experiment';

export interface PerceptronPoint { x: number; y: number; label: -1 | 1; }

/** Online Rosenblatt perceptron over a deterministic, noisy 2-D dataset. */
export class PerceptronExperiment extends ExperimentBase implements ExperimentInstance {
  readonly definition: ExperimentDefinition = {
    id: 'perceptron', name: 'Perceptron', year: 1958, category: 'learning', era: 'connectionist',
    description: 'A linear threshold classifier adjusts its boundary from mistakes.',
    historicalContext: 'Rosenblatt introduced the perceptron as a trainable model of a visual neuron.',
    coreIdea: 'Update weights in the direction of the labelled error.',
    significance: 'The rule is simple, inspectable, and a direct ancestor of modern gradient methods.',
    reference: 'F. Rosenblatt, The Perceptron (1958)', formula: 'w ← w + η(y − ŷ)x', defaultDuration: 15,
    supportsInteraction: true, tags: ['classification', 'online-learning', 'boundary']
  };
  private points: PerceptronPoint[] = []; private weights = [0, 0, 0]; private learningRate = .08; private noise = .08; private datasetSize = 80; private cursor = 0; private epoch = 0; private updates = 0; private accuracy = 0;
  constructor(seed = 42) { super(); this.seed = seed | 0; this.rng.setSeed(this.seed); }
  init() { this.reset(); this.initialized = true; }
  reset() { this.rng.setSeed(this.seed); this.cursor = 0; this.epoch = 0; this.updates = 0; this.weights = [this.rng.range(-.4, .4), this.rng.range(-.4, .4), this.rng.range(-.4, .4)]; this.generate(); this.evaluate(); }
  private generate() { const r = new SeededRng(this.seed + 17); this.points = []; for (let i = 0; i < this.datasetSize; i++) { const x = r.range(-1, 1), y = r.range(-1, 1); const boundary = .55 * x + .08 + r.range(-this.noise, this.noise); this.points.push({ x, y, label: y > boundary ? 1 : -1 }); } }
  private predict(x: number, y: number) { return this.weights[0] + this.weights[1] * x + this.weights[2] * y >= 0 ? 1 : -1; }
  private evaluate() { if (!this.points.length) return; this.accuracy = this.points.reduce((n, p) => n + (this.predict(p.x, p.y) === p.label ? 1 : 0), 0) / this.points.length; }
  step() { this.ensureInit(); if (!this.points.length) return; const p = this.points[this.cursor]; const yhat = this.predict(p.x, p.y); if (yhat !== p.label) { const err = p.label - yhat; this.weights[0] += this.learningRate * err; this.weights[1] += this.learningRate * err * p.x; this.weights[2] += this.learningRate * err * p.y; this.updates++; } this.cursor++; if (this.cursor >= this.points.length) { this.cursor = 0; this.epoch++; } this.evaluate(); }
  setParameter(name: string, value: number | string | boolean) { if (name === 'learningRate' && typeof value === 'number') this.learningRate = Math.max(.001, Math.min(1, value)); if (name === 'noise' && typeof value === 'number') { this.noise = Math.max(0, Math.min(.4, value)); this.reset(); } if (name === 'datasetSize' && typeof value === 'number') { this.datasetSize = Math.max(20, Math.min(300, Math.round(value))); this.reset(); } }
  getMetrics() { return { epoch: this.epoch, sample: this.cursor, updates: this.updates, accuracy: Number(this.accuracy.toFixed(3)), w0: Number(this.weights[0].toFixed(3)), w1: Number(this.weights[1].toFixed(3)), w2: Number(this.weights[2].toFixed(3)) }; }
  getState() { return { points: this.points, weights: [...this.weights], learningRate: this.learningRate, epoch: this.epoch }; }
  render(ctx: RenderTarget, width = this.width, height = this.height) {
    const c = ctx as CanvasRenderingContext2D; clearCanvas(c, '#0e1115'); text(c, 'PERCEPTRON · ONLINE DECISION BOUNDARY', 28, 34, 12, '#aab3bd');
    const x0 = width * .08, y0 = height * .15, w = width * .58, h = height * .67; const sx = (x: number) => x0 + (x + 1) * .5 * w; const sy = (y: number) => y0 + (1 - (y + 1) * .5) * h;
    this.points.forEach((p, i) => circle(c, sx(p.x), sy(p.y), i === this.cursor ? 6 : 3.5, p.label > 0 ? '#dbc792' : '#91abc1'));
    // w0 + w1*x + w2*y = 0; derive two x endpoints.
    if (Math.abs(this.weights[2]) > 1e-6) { const yA = -(this.weights[0] + this.weights[1] * -1) / this.weights[2]; const yB = -(this.weights[0] + this.weights[1] * 1) / this.weights[2]; line(c, sx(-1), sy(yA), sx(1), sy(yB), '#f0e2b6', 2); }
    text(c, `epoch ${this.epoch}   accuracy ${(this.accuracy * 100).toFixed(1)}%`, 28, height - 58, 14, '#e2e7eb'); text(c, `η ${this.learningRate.toFixed(3)}   updates ${this.updates}`, width - 28, height - 58, 13, '#dbc792', 'right');
    text(c, `w = [${this.weights.map(v => v.toFixed(2)).join(', ')}]`, width * .73, height * .38, 13, '#b7c3ce'); text(c, 'mistakes move the line', width * .73, height * .45, 12, '#8794a1');
  }
}
export function createPerceptron(seed = 42): ExperimentInstance { const e = new PerceptronExperiment(seed); e.init(); return e; }
export default PerceptronExperiment;
