import { ExperimentBase, clearCanvas, line, roundRect, text } from '../common';
import type { ExperimentDefinition, RenderTarget, ExperimentInstance } from '../../types/experiment';

export type Board = Array<'X' | 'O' | null>;
export interface SearchNode { board: Board; score: number; depth: number; maximizing: boolean; expanded: boolean; }

export const WIN_LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
export function winner(board: Board): 'X' | 'O' | 'draw' | null {
  for (const [a, b, c] of WIN_LINES) if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  return board.every(Boolean) ? 'draw' : null;
}
export function minimaxScore(board: Board, maximizing: boolean, depth = 0): number {
  const result = winner(board); if (result === 'O') return 10 - depth; if (result === 'X') return depth - 10; if (result === 'draw') return 0;
  const moves = board.map((v, i) => v ? -1 : i).filter(i => i >= 0) as number[];
  const scores = moves.map(i => { const b = [...board]; b[i] = maximizing ? 'O' : 'X'; return minimaxScore(b, !maximizing, depth + 1); });
  return maximizing ? Math.max(...scores) : Math.min(...scores);
}
export function minimaxBestMove(board: Board, player: 'X' | 'O' = 'O'): number {
  const maximizing = player === 'O'; let best = maximizing ? -Infinity : Infinity; let move = board.findIndex(v => !v);
  board.forEach((v, i) => { if (v) return; const b = [...board]; b[i] = player; const score = minimaxScore(b, !maximizing, 1); if (maximizing ? score > best : score < best) { best = score; move = i; } });
  return move;
}

/** Full-depth minimax over a tic-tac-toe board, with a compact search tree for
 * the visualiser.  The exported functions are intentionally pure for tests. */
export class MinimaxExperiment extends ExperimentBase implements ExperimentInstance {
  readonly definition: ExperimentDefinition = {
    id: 'minimax', name: 'Minimax Search', year: 1956,
    category: 'search', era: 'symbolic',
    description: 'A perfect-play tic-tac-toe search evaluates terminal positions recursively.',
    historicalContext: 'Minimax formalises adversarial decision-making under alternating turns.',
    coreIdea: 'Choose the move whose worst continuation is best for the current player.',
    significance: 'It remains the baseline for two-player zero-sum game search.',
    reference: 'Game-theoretic minimax reconstruction', formula: 'V(s)=maxₐ minᵦ V(s′)', defaultDuration: 13,
    supportsInteraction: true, tags: ['game', 'tree-search', 'adversarial']
  };
  private board: Board = Array(9).fill(null); private current: 'X' | 'O' = 'X'; private over = false; private tick = 0; private nodes: SearchNode[] = []; private lastMove = -1;
  constructor(seed = 42) { super(); this.seed = seed | 0; this.rng.setSeed(this.seed); }
  init() { this.reset(); this.initialized = true; }
  reset() { this.board = Array(9).fill(null); this.current = 'X'; this.over = false; this.tick = 0; this.nodes = []; this.lastMove = -1; }
  private buildTree(board: Board, maximizing: boolean, depth: number, limit: number) {
    if (this.nodes.length >= limit) return 0;
    const result = winner(board); if (result) return result === 'O' ? 10 - depth : result === 'X' ? depth - 10 : 0;
    const node: SearchNode = { board: [...board], score: 0, depth, maximizing, expanded: false }; this.nodes.push(node);
    const moves = board.map((v, i) => v ? -1 : i).filter(i => i >= 0) as number[]; const scores: number[] = [];
    moves.forEach(i => { const b = [...board]; b[i] = maximizing ? 'O' : 'X'; scores.push(this.buildTree(b, !maximizing, depth + 1, limit)); });
    node.score = maximizing ? Math.max(...scores) : Math.min(...scores); node.expanded = true; return node.score;
  }
  step() {
    this.ensureInit(); if (this.over) return;
    this.nodes = []; this.buildTree(this.board, this.current === 'O', 0, 180);
    const move = minimaxBestMove(this.board, this.current); this.lastMove = move; if (move >= 0) this.board[move] = this.current;
    const result = winner(this.board); if (result) this.over = true; else this.current = this.current === 'X' ? 'O' : 'X'; this.tick++;
  }
  handleInput(input: unknown) { if (typeof input === 'number' && input >= 0 && input < 9 && !this.board[input] && !this.over) { this.board[input] = this.current; this.current = this.current === 'X' ? 'O' : 'X'; } }
  getMetrics() { return { tick: this.tick, nodesExpanded: this.nodes.length, bestMove: this.lastMove, board: this.board.map(v => v ?? '-').join(''), winner: winner(this.board) ?? 'playing' }; }
  getState() { return { board: [...this.board], current: this.current, lastMove: this.lastMove, nodes: this.nodes.slice(0, 80) }; }
  render(ctx: RenderTarget, width = this.width, height = this.height) {
    const c = ctx as CanvasRenderingContext2D; clearCanvas(c, '#0e1115'); text(c, 'MINIMAX · TIC-TAC-TOE SEARCH', 28, 34, 12, '#aab3bd');
    const size = Math.min(height * .55, width * .38), x0 = width * .13, y0 = height * .24, cell = size / 3;
    c.save(); c.strokeStyle = '#596570'; c.lineWidth = 2; for (let i = 1; i < 3; i++) { line(c, x0 + i * cell, y0, x0 + i * cell, y0 + size, '#596570', 2); line(c, x0, y0 + i * cell, x0 + size, y0 + i * cell, '#596570', 2); } c.restore();
    this.board.forEach((v, i) => { if (!v) return; const x = x0 + (i % 3 + .5) * cell, y = y0 + (Math.floor(i / 3) + .5) * cell; text(c, v, x, y, 38, v === 'O' ? '#d9c590' : '#b7c5d2', 'center'); });
    const sx = width * .56, sy = height * .2; text(c, `expanded nodes  ${this.nodes.length}`, sx, sy, 14, '#d9e0e6');
    this.nodes.slice(0, 36).forEach((n, i) => { const col = i % 9, row = Math.floor(i / 9); const x = sx + col * 38, y = sy + 34 + row * 30; roundRect(c, x, y, 26, 20, 3, n.expanded ? '#24303a' : '#171d22', n.maximizing ? '#d9c590' : '#728392'); text(c, `${n.score}`, x + 13, y + 10, 9, '#e9edf0', 'center'); });
    text(c, this.over ? `result  ${winner(this.board)}` : `turn  ${this.current}  ·  best move ${this.lastMove >= 0 ? this.lastMove + 1 : '—'}`, 28, height - 50, 14, this.over ? '#d9c590' : '#aebbc7');
  }
}
export function createMinimax(seed = 42): ExperimentInstance { const e = new MinimaxExperiment(seed); e.init(); return e; }
export default MinimaxExperiment;
