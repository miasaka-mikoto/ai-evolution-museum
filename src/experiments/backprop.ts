import { ExperimentDefinition, ExperimentInstance, ExperimentMetrics, RenderSurface, seededRandom, clearSurface, text } from './types';

type Vec = number[];
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
const DATA: Array<[Vec, number]> = [[[0, 0], 0], [[0, 1], 1], [[1, 0], 1], [[1, 1], 0]];

export class BackpropExperiment implements ExperimentInstance {
  get definition(): ExperimentDefinition { return backpropDefinition; }
  w1: number[][]; b1: Vec; w2: Vec; b2 = 0; epoch = 0; loss = 1; accuracy = 0; learningRate = .8; private random: () => number;
  constructor(seed = 42) { this.random = seededRandom(seed); this.w1 = [[this.rand(), this.rand()], [this.rand(), this.rand()]]; this.b1 = [0, 0]; this.w2 = [this.rand(), this.rand()]; this.reset(); }
  init(): void { this.reset(); }
  private rand(): number { return (this.random() * 2 - 1) * .9; }
  reset(): void { this.epoch = 0; this.loss = 1; this.accuracy = 0; this.w1 = [[this.rand(), this.rand()], [this.rand(), this.rand()]]; this.b1 = [0, 0]; this.w2 = [this.rand(), this.rand()]; this.b2 = 0; }
  setSeed(seed: number): void { this.random = seededRandom(seed); this.reset(); }
  setParameter(name: string, value: number | string | boolean): void { if (name === 'learningRate' && typeof value === 'number') this.learningRate = Math.max(.01, Math.min(2, value)); }
  private forward(x: Vec): { h: Vec; y: number } { const h = [sigmoid(this.w1[0][0] * x[0] + this.w1[0][1] * x[1] + this.b1[0]), sigmoid(this.w1[1][0] * x[0] + this.w1[1][1] * x[1] + this.b1[1])]; return { h, y: sigmoid(this.w2[0] * h[0] + this.w2[1] * h[1] + this.b2) }; }
  step(): void {
    let total = 0; let correct = 0;
    for (const [x, target] of DATA) {
      const { h, y } = this.forward(x); const error = y - target; total += -(target * Math.log(y + 1e-8) + (1 - target) * Math.log(1 - y + 1e-8)); if ((y >= .5 ? 1 : 0) === target) correct += 1;
      const dz2 = error; const dw2 = [dz2 * h[0], dz2 * h[1]];
      const dz1 = [this.w2[0] * dz2 * h[0] * (1 - h[0]), this.w2[1] * dz2 * h[1] * (1 - h[1])];
      this.w2[0] -= this.learningRate * dw2[0]; this.w2[1] -= this.learningRate * dw2[1]; this.b2 -= this.learningRate * dz2;
      for (let j = 0; j < 2; j += 1) { this.w1[j][0] -= this.learningRate * dz1[j] * x[0]; this.w1[j][1] -= this.learningRate * dz1[j] * x[1]; this.b1[j] -= this.learningRate * dz1[j]; }
    }
    this.epoch += 1; this.loss = total / DATA.length; this.accuracy = correct / DATA.length;
  }
  getMetrics(): ExperimentMetrics { return { epoch: this.epoch, loss: Number(this.loss.toFixed(4)), accuracy: this.accuracy, learningRate: this.learningRate }; }
  render({ ctx, width, height }: RenderSurface): void {
    clearSurface({ ctx, width, height }, '#090b10'); text(ctx, 'BACKPROPAGATION · XOR', 28, 23, 13, '#e0e6ee');
    const size = Math.min(width * .55, height - 100); const ox = 28; const oy = 54; const steps = 28;
    for (let iy = 0; iy < steps; iy += 1) for (let ix = 0; ix < steps; ix += 1) { const x = ix / (steps - 1); const y = iy / (steps - 1); const out = this.forward([x, y]).y; ctx.fillStyle = `rgba(${Math.round(220 * out + 35)},${Math.round(180 * (1 - out) + 35)},${Math.round(110 + 80 * out)},.8)`; ctx.fillRect(ox + ix * size / steps, oy + iy * size / steps, size / steps + 1, size / steps + 1); }
    DATA.forEach(([p, label]) => { const x = ox + p[0] * size; const y = oy + (1 - p[1]) * size; ctx.fillStyle = label ? '#f0d681' : '#99c5d8'; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill(); });
    const panelX = Math.min(width - 245, ox + size + 42); text(ctx, 'NETWORK', panelX, 74, 11, '#93a1af'); text(ctx, '2 → 2 → 1', panelX, 98, 18, '#d8e1ea'); text(ctx, `epoch ${this.epoch}`, panelX, 142, 13, '#b6c0c9'); text(ctx, `loss ${this.loss.toFixed(4)}`, panelX, 166, 13, '#d6ad62'); text(ctx, `accuracy ${(this.accuracy * 100).toFixed(0)}%`, panelX, 190, 13, '#8bc7a0'); text(ctx, '∂L/∂w  →  update', panelX, 232, 12, '#8996a3'); text(ctx, 'w ← w − η∇w', panelX, 256, 13, '#d9e2ec');
    text(ctx, 'Each step is one full gradient epoch over the four XOR examples.', 28, height - 17, 11, '#8996a3');
  }
}

export const backpropDefinition: ExperimentDefinition = {
  id: 'backprop', name: 'Backpropagation', year: 1986, category: 'neural', description: 'A tiny multilayer perceptron learns the non-linear XOR function by gradient descent.', historicalNote: 'Backpropagation became central to training multilayer neural networks in the 1980s; this is a minimal educational reconstruction.', historicalContext: 'Rumelhart, Hinton and Williams popularised efficient backpropagation for multilayer networks in 1986.', coreIdea: 'Propagate output error backward through differentiable layers and update each weight.', significance: 'The gradient-based training method behind modern neural networks.', reference: 'Rumelhart, Hinton & Williams, Learning representations by back-propagating errors (1986)', tags: ['gradient', 'XOR'], formula: 'w ← w − η ∂L/∂w', defaultDuration: 14, supportsInteraction: true, create: (seed = 42) => new BackpropExperiment(seed),
};

export function createBackprop(seed = 42): BackpropExperiment { return new BackpropExperiment(seed); }
export default BackpropExperiment;
