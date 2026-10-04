import { ExperimentBase, clearCanvas, circle, line, text } from '../common';
import type { ExperimentDefinition, RenderTarget, ExperimentInstance } from '../../types/experiment';

type FSMState = { id: string; accepting?: boolean; x: number; y: number };

/** Deterministic finite automaton recognising binary strings divisible by 3. */
export class FiniteStateMachineExperiment extends ExperimentBase implements ExperimentInstance {
  readonly definition: ExperimentDefinition = {
    id: 'finite-state-machine', name: 'Finite State Machine', year: 1943,
    category: 'foundations', era: 'mechanical',
    description: 'A character stream drives a three-state DFA for binary divisibility by three.',
    historicalContext: 'Finite automata formalise computation with a bounded amount of state.',
    coreIdea: 'The next state is a function of the current state and one input symbol.',
    significance: 'Automata remain the foundation of parsers, protocols, and regular languages.',
    reference: 'DFA educational reconstruction', formula: 'δ(q, a) = q′', defaultDuration: 10,
    supportsInteraction: true, tags: ['automaton', 'stream', 'regular-language']
  };
  private states: FSMState[] = [
    { id: 'q0', accepting: true, x: 0.28, y: 0.5 },
    { id: 'q1', x: 0.5, y: 0.22 }, { id: 'q2', x: 0.72, y: 0.5 }
  ];
  private transition: Record<string, string> = {
    'q0,0': 'q0', 'q0,1': 'q1', 'q1,0': 'q2', 'q1,1': 'q0', 'q2,0': 'q1', 'q2,1': 'q2'
  };
  private stream = '110100110'; private cursor = 0; private current = 'q0'; private accepted = true; private ticks = 0;
  constructor(seed = 42) { super(); this.seed = seed | 0; this.rng.setSeed(this.seed); }
  init() { this.reset(); this.initialized = true; }
  reset() { this.cursor = 0; this.current = 'q0'; this.accepted = true; this.ticks = 0; }
  step() {
    this.ensureInit(); if (this.cursor >= this.stream.length) { this.accepted = this.current === 'q0'; return; }
    const bit = this.stream[this.cursor++]; this.current = this.transition[`${this.current},${bit}`]; this.accepted = this.current === 'q0'; this.ticks++;
  }
  setParameter(name: string, value: number | string | boolean) {
    if (name === 'stream' && typeof value === 'string' && /^[01]{1,32}$/.test(value)) { this.stream = value; this.reset(); }
  }
  handleInput(input: unknown) {
    if (typeof input === 'string' && /^[01]$/.test(input)) { this.stream += input; }
  }
  getMetrics() { return { state: this.current, cursor: this.cursor, inputLength: this.stream.length, accepted: this.accepted, tick: this.ticks }; }
  getState() { return { state: this.current, stream: this.stream, cursor: this.cursor, transition: this.transition }; }
  render(ctx: RenderTarget, width = this.width, height = this.height) {
    const c = ctx as CanvasRenderingContext2D; clearCanvas(c, '#0d0f12');
    text(c, 'DFA · BINARY DIVISIBILITY BY 3', 28, 34, 12, '#a8b1bb');
    const ox = width * 0.08, oy = height * 0.18, uw = width * 0.78, uh = height * 0.58;
    this.states.forEach(s => {
      const x = ox + s.x * uw, y = oy + s.y * uh;
      if (s.id === this.current) circle(c, x, y, 38, '#dccb9b');
      circle(c, x, y, 32, s.id === this.current ? '#dccb9b' : '#1b2026', '#aeb8c4');
      if (s.accepting) circle(c, x, y, 25, '', s.id === this.current ? '#111' : '#8c9ba9');
      text(c, s.id, x, y, 16, s.id === this.current ? '#101214' : '#edf1f4', 'center');
    });
    // Curved-ish transition arrows represented by segmented lines and labels.
    const p = (id: string) => { const s = this.states.find(v => v.id === id)!; return [ox + s.x * uw, oy + s.y * uh]; };
    const edges: Array<[string, string, string, number]> = [
      ['q0', 'q0', '0', -42], ['q0', 'q1', '1', 0], ['q1', 'q2', '0', 0], ['q1', 'q0', '1', -28], ['q2', 'q1', '0', 28], ['q2', 'q2', '1', 42]
    ];
    edges.forEach(([a, b, label, bend]) => {
      const [x1, y1] = p(a), [x2, y2] = p(b); const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + bend;
      c.save(); c.strokeStyle = '#5e6a77'; c.lineWidth = 1; c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo(mx, my, x2, y2); c.stroke(); c.restore();
      text(c, label, mx, my - 7, 12, '#c4d0dc', 'center');
    });
    const shown = this.stream.split('').map((b, i) => i < this.cursor ? b : '·').join(' ');
    text(c, `input  ${shown}`, 28, height - 84, 16, '#e5e9ed');
    text(c, `state ${this.current}   ${this.cursor >= this.stream.length ? (this.accepted ? 'ACCEPT' : 'REJECT') : 'reading…'}`, 28, height - 46, 13, this.accepted ? '#d9c58d' : '#9ca9b7');
  }
}
export function createFiniteStateMachine(seed = 42): ExperimentInstance { const e = new FiniteStateMachineExperiment(seed); e.init(); return e; }
export default FiniteStateMachineExperiment;
