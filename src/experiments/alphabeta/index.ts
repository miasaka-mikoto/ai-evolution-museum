import { ExperimentBase, clearCanvas, line, roundRect, text } from '../common';
import type { ExperimentDefinition, RenderTarget, ExperimentInstance } from '../../types/experiment';
import { winner } from '../minimax';
import type { Board } from '../minimax';

export interface AlphaBetaStats { expanded: number; pruned: number; }
export function alphaBetaScore(board: Board, maximizing: boolean, alpha = -Infinity, beta = Infinity, depth = 0, stats?: AlphaBetaStats): number {
  const result = winner(board); if (result === 'O') return 10 - depth; if (result === 'X') return depth - 10; if (result === 'draw') return 0;
  stats && stats.expanded++;
  const moves = board.map((v, i) => v ? -1 : i).filter(i => i >= 0) as number[];
  if (maximizing) {
    let value = -Infinity; for (const i of moves) { const b = [...board]; b[i] = 'O'; value = Math.max(value, alphaBetaScore(b, false, alpha, beta, depth + 1, stats)); alpha = Math.max(alpha, value); if (alpha >= beta) { stats && stats.pruned++; break; } } return value;
  }
  let value = Infinity; for (const i of moves) { const b = [...board]; b[i] = 'X'; value = Math.min(value, alphaBetaScore(b, true, alpha, beta, depth + 1, stats)); beta = Math.min(beta, value); if (alpha >= beta) { stats && stats.pruned++; break; } } return value;
}
export function alphaBetaBestMove(board: Board, player: 'X' | 'O' = 'O', stats?: AlphaBetaStats): number {
  const maximizing = player === 'O'; let best = maximizing ? -Infinity : Infinity; let move = board.findIndex(v => !v);
  board.forEach((v, i) => { if (v) return; const b = [...board]; b[i] = player; const score = alphaBetaScore(b, !maximizing, -Infinity, Infinity, 1, stats); if (maximizing ? score > best : score < best) { best = score; move = i; } });
  return move;
}

export class AlphaBetaExperiment extends ExperimentBase implements ExperimentInstance {
  readonly definition: ExperimentDefinition = {
    id: 'alpha-beta', name: 'Alpha–Beta Pruning', year: 1958,
    category: 'search', era: 'symbolic', description: 'Minimax with bounds that cut branches which cannot improve the decision.',
    historicalContext: 'Alpha–beta pruning made adversarial search dramatically more tractable without changing its answer.',
    coreIdea: 'α is the best maximizer value so far; β is the best minimizer value so far.',
    significance: 'The technique still underpins practical game-tree engines.', reference: 'Alpha–beta pruning educational reconstruction',
    formula: 'prune when α ≥ β', defaultDuration: 13, supportsInteraction: true, tags: ['game', 'pruning', 'tree-search']
  };
  private board: Board = Array(9).fill(null); private current: 'X' | 'O' = 'X'; private over = false; private tick = 0; private stats: AlphaBetaStats = { expanded: 0, pruned: 0 }; private trace: Array<{ depth: number; alpha: number; beta: number; pruned: boolean }> = []; private lastMove = -1;
  constructor(seed = 42) { super(); this.seed = seed | 0; this.rng.setSeed(this.seed); }
  init() { this.reset(); this.initialized = true; }
  reset() { this.board = Array(9).fill(null); this.current = 'X'; this.over = false; this.tick = 0; this.stats = { expanded: 0, pruned: 0 }; this.trace = []; this.lastMove = -1; }
  step() {
    this.ensureInit(); if (this.over) return;
    this.stats = { expanded: 0, pruned: 0 }; this.trace = [];
    const move = alphaBetaBestMove(this.board, this.current, this.stats); this.lastMove = move; if (move >= 0) this.board[move] = this.current;
    const result = winner(this.board); if (result) this.over = true; else this.current = this.current === 'X' ? 'O' : 'X'; this.tick++;
    // Keep a compact explanatory trace. The counters are from the actual search.
    this.trace.push({ depth: 0, alpha: -Infinity, beta: Infinity, pruned: this.stats.pruned > 0 });
  }
  handleInput(input: unknown) { if (typeof input === 'number' && input >= 0 && input < 9 && !this.board[input] && !this.over) { this.board[input] = this.current; this.current = this.current === 'X' ? 'O' : 'X'; } }
  getMetrics() { return { tick: this.tick, expanded: this.stats.expanded, pruned: this.stats.pruned, bestMove: this.lastMove, board: this.board.map(v => v ?? '-').join(''), winner: winner(this.board) ?? 'playing' }; }
  getState() { return { board: [...this.board], current: this.current, lastMove: this.lastMove, stats: { ...this.stats }, trace: [...this.trace] }; }
  render(ctx: RenderTarget, width = this.width, height = this.height) {
    const c = ctx as CanvasRenderingContext2D; clearCanvas(c, '#0e1115'); text(c, 'ALPHA–BETA · BOUNDS CUT THE TREE', 28, 34, 12, '#aab3bd');
    const size = Math.min(height * .55, width * .38), x0 = width * .13, y0 = height * .24, cell = size / 3;
    for (let i = 1; i < 3; i++) { line(c, x0 + i * cell, y0, x0 + i * cell, y0 + size, '#596570', 2); line(c, x0, y0 + i * cell, x0 + size, y0 + i * cell, '#596570', 2); }
    this.board.forEach((v, i) => { if (v) text(c, v, x0 + (i % 3 + .5) * cell, y0 + (Math.floor(i / 3) + .5) * cell, 38, v === 'O' ? '#d9c590' : '#b7c5d2', 'center'); });
    const sx = width * .56; text(c, `expanded  ${this.stats.expanded}`, sx, height * .2, 14, '#d9e0e6'); text(c, `pruned  ${this.stats.pruned}`, sx, height * .2 + 28, 14, '#d9c590');
    const n = Math.max(1, this.stats.expanded + this.stats.pruned); for (let i = 0; i < Math.min(48, n); i++) { const x = sx + (i % 12) * 27, y = height * .3 + Math.floor(i / 12) * 27; roundRect(c, x, y, 18, 15, 2, i >= this.stats.expanded ? '#5f4f3b' : '#25303a', i >= this.stats.expanded ? '#d9c590' : '#748493'); }
    text(c, this.over ? `result  ${winner(this.board)}` : `turn  ${this.current}  ·  best ${this.lastMove >= 0 ? this.lastMove + 1 : '—'}  ·  α ≥ β branches stop`, 28, height - 50, 14, this.over ? '#d9c590' : '#aebbc7');
  }
}
export function createAlphaBeta(seed = 42): ExperimentInstance { const e = new AlphaBetaExperiment(seed); e.init(); return e; }
export default AlphaBetaExperiment;
