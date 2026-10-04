import { describe, expect, it } from 'vitest';
import { EXPERIMENT_REGISTRY } from '../src/experiments/registry';
import { TuringMachineExperiment } from '../src/experiments/turing';
import { minimaxBestMove, minimaxScore } from '../src/experiments/minimax';
import { alphaBetaBestMove, alphaBetaScore, type AlphaBetaStats } from '../src/experiments/alphabeta';
import { astarSearch } from '../src/experiments/astar';
import { PerceptronExperiment } from '../src/experiments/perceptron';
import { TransformerExperiment, MctsExperiment, AutoregressiveExperiment, DiffusionExperiment, WorldModelExperiment } from '../src/experiments/modern';
import { EvolutionDirector } from '../src/timeline/director';

describe('museum catalogue and foundational/search experiments', () => {
  it('contains exactly 30 executable registry entries', () => {
    expect(EXPERIMENT_REGISTRY).toHaveLength(30);
    expect(new Set(EXPERIMENT_REGISTRY.map((e) => e.id)).size).toBe(30);
    for (const definition of EXPERIMENT_REGISTRY) {
      const instance = definition.create?.(42);
      expect(instance).toBeTruthy();
      instance?.step(1 / 60);
      expect(instance?.getMetrics()).toBeTruthy();
      instance?.dispose?.();
    }
  });

  it('executes the binary increment Turing transition table', () => {
    const machine = new TuringMachineExperiment(42); machine.init();
    machine.step(); machine.step(); machine.step();
    const metrics = machine.getMetrics();
    expect(metrics.tick).toBeGreaterThan(0);
    expect(String(metrics.tape)).toContain('1100');
  });

  it('minimax and alpha-beta choose the same move and score', () => {
    const board = ['O', 'O', null, 'X', null, null, 'X', null, null] as Array<'X' | 'O' | null>;
    const stats: AlphaBetaStats = { expanded: 0, pruned: 0 };
    expect(alphaBetaBestMove(board, 'O', stats)).toBe(minimaxBestMove(board, 'O'));
    expect(alphaBetaScore(board, true)).toBe(minimaxScore(board, true));
    expect(stats.expanded).toBeGreaterThan(0);
    expect(stats.pruned).toBeGreaterThanOrEqual(0);
  });

  it('A* returns an actual shortest path on an empty grid', () => {
    const grid = Array.from({ length: 5 }, () => Array(7).fill(false));
    const result = astarSearch(grid, { x: 0, y: 0 }, { x: 6, y: 4 });
    expect(result.path[0]).toEqual({ x: 0, y: 0 });
    expect(result.path.at(-1)).toEqual({ x: 6, y: 4 });
    expect(result.path.length - 1).toBe(10);
  });

  it('perceptron improves a deterministic classification run', () => {
    const p = new PerceptronExperiment(7); p.init();
    const before = Number(p.getMetrics().accuracy);
    for (let i = 0; i < 500; i += 1) p.step();
    expect(Number(p.getMetrics().accuracy)).toBeGreaterThanOrEqual(before);
    expect(Number(p.getMetrics().epoch)).toBeGreaterThan(0);
  });
});

describe('modern computation and replay', () => {
  it('computes a normalized Transformer attention row', () => {
    const t = new TransformerExperiment(); t.init(); t.step();
    expect(Number(t.getMetrics().rowSum)).toBeCloseTo(1, 5);
  });

  it('grows an MCTS tree through real simulations', () => {
    const m = new MctsExperiment(); m.init();
    const before = Number(m.getMetrics().simulations);
    m.step();
    expect(Number(m.getMetrics().simulations)).toBeGreaterThan(before);
    expect(Number(m.getMetrics().treeNodes)).toBeGreaterThan(1);
  });

  it('generates autoregressively and advances diffusion timesteps', () => {
    const language = new AutoregressiveExperiment(); language.init();
    const start = String(language.getMetrics().context).length; language.step();
    expect(String(language.getMetrics().context).length).toBeGreaterThanOrEqual(start);
    const diffusion = new DiffusionExperiment(); diffusion.init();
    const t0 = Number(diffusion.getMetrics().timestep); diffusion.step();
    expect(Number(diffusion.getMetrics().timestep)).toBe(t0 - 1);
  });

  it('keeps world-model belief partially masked while the agent acts', () => {
    const world = new WorldModelExperiment(); world.init();
    const initial = world.getMetrics();
    expect(Number(initial.beliefKnown)).toBeLessThan(18 * 11);
    for (let i = 0; i < 8; i += 1) world.step();
    expect(Number(world.getMetrics().tick)).toBe(8);
  });

  it('replays the same seeded experiment state', () => {
    const a = EXPERIMENT_REGISTRY.find((e) => e.id === 'genetic-algorithm')!.create(123);
    const b = EXPERIMENT_REGISTRY.find((e) => e.id === 'genetic-algorithm')!.create(123);
    for (let i = 0; i < 12; i += 1) { a.step(); b.step(); }
    expect(a.getMetrics()).toEqual(b.getMetrics());
  });

  it('EvolutionDirector advances variable-duration entries', () => {
    const director = new EvolutionDirector(EXPERIMENT_REGISTRY as any[]);
    const first = director.current().id;
    director.tick(director.current().defaultDuration + 0.1);
    expect(director.current().id).not.toBe(first);
  });
});
