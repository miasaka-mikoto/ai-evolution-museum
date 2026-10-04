import { describe, expect, it } from 'vitest';
import {
  KMeansExperiment, DecisionTreeExperiment, ChessSearchExperiment, MctsExperiment,
  CnnExperiment, GanExperiment, TransformerExperiment, AutoregressiveExperiment,
  DiffusionExperiment, WorldModelExperiment,
} from '../src/experiments/modern';

describe('museum experiments 21–30', () => {
  it('K-means performs assignments and centroid updates', () => {
    const e = new KMeansExperiment(); e.init(); const before = e.centroids.map(c => [...c]); e.step(); e.step();
    expect(e.iteration).toBe(1); expect(e.points.some(p => p.cluster >= 0)).toBe(true);
    expect(e.centroids.some((c, i) => c[0] !== before[i][0] || c[1] !== before[i][1])).toBe(true);
  });
  it('decision tree grows a real impurity-selected tree', () => {
    const e = new DecisionTreeExperiment(); e.init(); for (let i = 0; i < 20; i++) e.step();
    expect(e.nodes.length).toBeGreaterThan(1); expect(e.accuracy).toBeGreaterThan(.55);
  });
  it('chess search expands legal continuations and chooses a move', () => {
    const e = new ChessSearchExperiment(); e.init(); e.step();
    expect(e.nodes).toBeGreaterThan(0); expect(e.bestMove).not.toBeNull(); expect(e.history.length).toBe(1);
  });
  it('MCTS grows visits through simulation and expansion', () => {
    const e = new MctsExperiment(); e.init(); e.step();
    expect(e.simulations).toBeGreaterThan(0); expect(e.root.visits).toBeGreaterThan(0); expect(e.root.children.length).toBeGreaterThan(0);
  });
  it('CNN executes convolution, pooling and SGD updates', () => {
    const e = new CnnExperiment(); e.init(); const before = e.sample; e.step();
    expect(e.feature.length).toBe(10); expect(e.pooled.length).toBe(5); expect(e.sample).toBeGreaterThan(before); expect(Number.isFinite(e.loss)).toBe(true);
  });
  it('GAN updates both discriminator and generator state', () => {
    const e = new GanExperiment(); e.init(); const before = [...e.mu]; e.step();
    expect(e.iteration).toBe(1); expect(e.fake.length).toBeGreaterThan(0); expect(e.mu[0] !== before[0] || e.mu[1] !== before[1]).toBe(true);
  });
  it('Transformer computes normalized attention rows', () => {
    const e = new TransformerExperiment(); e.init(); e.step();
    for (const row of e.attention[e.activeHead]) expect(row.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 6);
  });
  it('autoregressive model samples one token at a time', () => {
    const e = new AutoregressiveExperiment(); e.init(); const before = e.generated.length; e.step();
    expect(e.generated.length).toBe(before + 1); expect(e.probabilities.length).toBeGreaterThan(5);
  });
  it('diffusion reverse process decreases timestep and moves samples', () => {
    const e = new DiffusionExperiment(); e.init(); const before = e.samples.map(p => ({ ...p })); e.step();
    expect(e.timestep).toBe(19); expect(e.samples.some((p, i) => p.x !== before[i].x || p.y !== before[i].y)).toBe(true);
  });
  it('world model observes, plans and acts in a partially known grid', () => {
    const e = new WorldModelExperiment(); e.init(); const before = { ...e.agent }; for (let i = 0; i < 12; i++) e.step();
    expect(e.getMetrics().beliefKnown).toBeGreaterThan(0); expect(e.tick).toBeGreaterThan(0); expect(e.agent.x !== before.x || e.agent.y !== before.y).toBe(true);
  });
});
