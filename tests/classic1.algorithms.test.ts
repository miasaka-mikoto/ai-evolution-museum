import { describe, expect, it } from 'vitest';
import { TuringMachineExperiment } from '../src/experiments/turing';
import { FiniteStateMachineExperiment } from '../src/experiments/fsm';
import { BooleanLogicNetworkExperiment } from '../src/experiments/logic';
import { McCullochPittsExperiment } from '../src/experiments/mcculloch';
import { MinimaxExperiment, minimaxScore } from '../src/experiments/minimax';
import { AlphaBetaExperiment, alphaBetaScore } from '../src/experiments/alphabeta';
import { PerceptronExperiment } from '../src/experiments/perceptron';
import { astarSearch } from '../src/experiments/astar';

describe('museum experiments 1–10', () => {
  it('Turing Machine executes binary increment transitions', () => {
    const e = new TuringMachineExperiment(4); e.init();
    for (let i = 0; i < 8; i += 1) e.step();
    const metrics = e.getMetrics();
    expect(metrics.halted).toBe(true);
    expect(String(metrics.tape).startsWith('1100')).toBe(true); // 1011 + 1
  });

  it('finite-state machine accepts binary values divisible by three', () => {
    const e = new FiniteStateMachineExperiment(); e.setParameter('stream', '110'); // 6
    for (let i = 0; i < 4; i += 1) e.step();
    expect(e.getMetrics().accepted).toBe(true);
  });

  it('Boolean network evaluates real gate outputs', () => {
    const e = new BooleanLogicNetworkExperiment(); e.init(); e.setParameter('A', true); e.setParameter('B', false);
    expect(e.getMetrics().output).toBe(true);
  });

  it('McCulloch–Pitts neuron changes output around its threshold', () => {
    const e = new McCullochPittsExperiment(); e.init();
    e.setParameter('threshold', 99); expect(e.getMetrics().output).toBe(0);
    e.setParameter('threshold', -99); expect(e.getMetrics().output).toBe(1);
  });

  it('alpha-beta returns the same minimax value while executing pruning', () => {
    const board = ['X', 'O', null, null, 'X', null, null, null, 'O'] as const;
    const plain = minimaxScore([...board], true);
    const bounded = alphaBetaScore([...board], true);
    expect(bounded).toBe(plain);
    const mini = new MinimaxExperiment(); mini.init(); mini.step();
    const alpha = new AlphaBetaExperiment(); alpha.init(); alpha.step();
    expect(Number(mini.getMetrics().nodesExpanded)).toBeGreaterThan(0);
    expect(Number(alpha.getMetrics().expanded)).toBeGreaterThan(0);
  });

  it('perceptron learns a deterministic separable dataset', () => {
    const e = new PerceptronExperiment(7); e.init(); e.setParameter('noise', 0); e.setParameter('datasetSize', 48);
    for (let i = 0; i < 5000; i += 1) e.step();
    expect(Number(e.getMetrics().accuracy)).toBeGreaterThan(.98);
  });

  it('A* returns a shortest path on an open grid', () => {
    const grid = Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => false));
    const result = astarSearch(grid, { x: 0, y: 0 }, { x: 4, y: 4 });
    expect(result.path).toHaveLength(9); expect(result.expanded).toBeGreaterThan(0);
  });
});

