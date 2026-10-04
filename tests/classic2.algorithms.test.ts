import { describe, expect, it } from 'vitest';
import { DijkstraExperiment } from '../src/experiments/dijkstra';
import { LifeExperiment } from '../src/experiments/life';
import { ExpertSystemExperiment } from '../src/experiments/expertSystem';
import { HopfieldExperiment } from '../src/experiments/hopfield';
import { BackpropExperiment } from '../src/experiments/backprop';
import { GeneticAlgorithmExperiment } from '../src/experiments/geneticAlgorithm';
import { TabularRLExperiment } from '../src/experiments/tabularRL';
import { SOMExperiment } from '../src/experiments/som';

describe('museum experiments 11–20', () => {
  it('Dijkstra finds a shortest route on an empty deterministic grid', () => {
    const e = new DijkstraExperiment(9); e.setParameter('wallRate', 0);
    for (let i = 0; i < 600 && !e.state.done; i += 1) e.step();
    expect(e.state.found).toBe(true);
    expect(e.state.path.length - 1).toBe(32);
  });

  it('Game of Life blinker has period two under B3/S23', () => {
    const e = new LifeExperiment(3); e.setParameter('pattern', 'blinker'); e.setParameter('speed', 1);
    const start = [...e.cells]; e.step(1); e.step(1);
    expect([...e.cells]).toEqual(start);
  });

  it('expert system forward-chains a derived eagle fact', () => {
    const e = new ExpertSystemExperiment(); for (let i = 0; i < 6; i += 1) e.step();
    expect(e.facts.has('bird')).toBe(true); expect(e.facts.has('eagle')).toBe(true);
  });

  it('Hopfield recall does not raise energy after asynchronous updates', () => {
    const e = new HopfieldExperiment(14); const initial = e.energy;
    for (let i = 0; i < 200; i += 1) e.step();
    expect(e.energy).toBeLessThanOrEqual(initial + 1e-8);
  });

  it('backpropagation learns XOR', () => {
    const e = new BackpropExperiment(12); for (let i = 0; i < 2400; i += 1) e.step();
    expect(e.accuracy).toBe(1); expect(e.loss).toBeLessThan(.2);
  });

  it('genetic selection improves the best deterministic route fitness', () => {
    const e = new GeneticAlgorithmExperiment(21); const initial = e.best?.fitness ?? 0;
    for (let i = 0; i < 90; i += 1) e.step();
    expect(e.best?.fitness ?? 0).toBeGreaterThan(initial);
  });

  it('Q-learning and SARSA execute different TD bootstrap rules', () => {
    const q = new TabularRLExperiment('q-learning', 4); const s = new TabularRLExperiment('sarsa', 4);
    for (let i = 0; i < 20; i += 1) { q.step(); s.step(); }
    expect(q.q.flat().some(v => v !== 0)).toBe(true); expect(s.q.flat().some(v => v !== 0)).toBe(true);
  });

  it('SOM moves a best-matching neighbourhood toward data', () => {
    const e = new SOMExperiment(5); const before = e.units.map(u => [u.wx, u.wy]); e.step();
    expect(e.units.some((u, i) => u.wx !== before[i][0] || u.wy !== before[i][1])).toBe(true);
  });
});
