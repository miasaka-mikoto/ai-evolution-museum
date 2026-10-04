import { ExperimentBase, clearCanvas, line, text, roundRect } from '../common';
import type { ExperimentDefinition, RenderTarget, ExperimentInstance } from '../../types/experiment';

type Symbol = '0' | '1' | '□';
type Transition = { write: Symbol; move: -1 | 1; next: string };

/** A small, genuine deterministic Turing machine.  The default program
 * increments a binary number on the tape (least significant bit at the
 * right), then halts. */
export class TuringMachineExperiment extends ExperimentBase implements ExperimentInstance {
  readonly definition: ExperimentDefinition = {
    id: 'turing-machine', name: 'Turing Machine', year: 1936,
    category: 'foundations', era: 'mechanical',
    description: 'A tape, head, and transition table execute a binary increment.',
    historicalContext: 'Alan Turing described the abstract machine in 1936 as a model of effective computation.',
    coreIdea: 'Read a symbol, write a symbol, move the head, change state.',
    significance: 'The machine gives a precise account of algorithmic computation.',
    reference: 'A. M. Turing, On Computable Numbers (1936)',
    formula: 'δ(state, symbol) → (write, move, next state)',
    defaultDuration: 12, supportsInteraction: true, tags: ['tape', 'automaton', 'binary']
  };
  private tape: Symbol[] = [];
  private head = 0;
  private state = 'q0';
  private ticks = 0;
  private halted = false;
  private transitions: Record<string, Transition> = {};
  private input = '1011';
  constructor(seed = 42) { super(); this.seed = seed | 0; this.rng.setSeed(this.seed); }

  init() { this.reset(); this.initialized = true; }
  reset() {
    this.tape = [...this.input.split('') as Symbol[], '□', '□', '□'];
    this.head = this.input.length - 1; this.state = 'q0'; this.ticks = 0; this.halted = false;
    // Binary increment while scanning from the least-significant bit.
    this.transitions = {
      'q0,0': { write: '1', move: 1, next: 'halt' },
      'q0,1': { write: '0', move: -1, next: 'q0' },
      'q0,□': { write: '1', move: 1, next: 'halt' },
    };
  }
  step() {
    this.ensureInit(); if (this.halted) return;
    const sym = this.tape[this.head] ?? '□';
    const tr = this.transitions[`${this.state},${sym}`];
    if (!tr) { this.halted = true; this.state = 'halt'; return; }
    this.tape[this.head] = tr.write;
    this.head += tr.move;
    if (this.head < 0) { this.tape.unshift('□'); this.head = 0; }
    if (this.head >= this.tape.length) this.tape.push('□');
    this.state = tr.next; this.ticks++;
    if (this.state === 'halt') this.halted = true;
  }
  setParameter(name: string, value: number | string | boolean) {
    if (name === 'input' && typeof value === 'string' && /^[01]{1,12}$/.test(value)) { this.input = value; this.reset(); }
  }
  getMetrics() { return { tick: this.ticks, head: this.head, state: this.state, halted: this.halted, tape: this.tape.join('') }; }
  getState() { return { tape: [...this.tape], head: this.head, state: this.state, transitions: { ...this.transitions } }; }
  render(ctx: RenderTarget, width = this.width, height = this.height) {
    clearCanvas(ctx as CanvasRenderingContext2D, '#0d0e10');
    const c = ctx as CanvasRenderingContext2D; const cell = Math.min(82, width / Math.max(8, this.tape.length));
    const start = Math.max(0, Math.min(this.head - 5, this.tape.length - Math.floor(width / cell) + 1));
    const visible = Math.min(this.tape.length - start, Math.floor(width / cell));
    const x0 = (width - visible * cell) / 2; const y = height * 0.43;
    text(c, 'TAPE / HEAD / TRANSITION TABLE', 28, 34, 12, '#9ca3af');
    for (let i = 0; i < visible; i++) {
      const idx = start + i; const x = x0 + i * cell;
      roundRect(c, x + 2, y, cell - 4, 66, 5, idx === this.head ? '#d8c7a0' : '#181b20', idx === this.head ? '#f1e8d5' : '#47505a');
      text(c, this.tape[idx] ?? '□', x + cell / 2, y + 30, 24, idx === this.head ? '#111' : '#f2f3f5', 'center');
      text(c, String(idx - this.input.length + 1), x + cell / 2, y + 58, 10, idx === this.head ? '#333' : '#76808d', 'center');
    }
    line(c, x0 + (this.head - start) * cell + cell / 2, y - 30, x0 + (this.head - start) * cell + cell / 2, y, '#d8c7a0', 2);
    text(c, `state ${this.state}   head ${this.head}   step ${this.ticks}`, 28, height - 72, 14, '#e8e8e8');
    text(c, this.halted ? 'HALT' : `δ(${this.state}, ${this.tape[this.head] ?? '□'})`, width - 28, height - 72, 14, this.halted ? '#e4b27d' : '#9fb9d2', 'right');
    const rows = Object.entries(this.transitions); const tx = width * .66, ty = height * .68;
    text(c, 'TRANSITION TABLE', tx, ty, 10, '#8895a2');
    rows.forEach(([k, tr], i) => text(c, `${k.padEnd(6)} → ${tr.write}  ${tr.move > 0 ? 'R' : 'L'}  ${tr.next}`, tx, ty + 19 + i * 16, 11, k === `${this.state},${this.tape[this.head] ?? '□'}` ? '#d8c7a0' : '#9ca8b4'));
    text(c, '0 → 1 and halt  ·  1 → 0, carry left', 28, height - 40, 11, '#747e89');
  }
}
export function createTuringMachine(seed = 42): ExperimentInstance { const e = new TuringMachineExperiment(seed); e.init(); return e; }
export default TuringMachineExperiment;
