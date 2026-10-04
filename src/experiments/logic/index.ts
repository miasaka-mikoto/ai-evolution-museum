import { ExperimentBase, clearCanvas, circle, line, text } from '../common';
import type { ExperimentDefinition, RenderTarget, ExperimentInstance } from '../../types/experiment';

type Op = 'INPUT' | 'AND' | 'OR' | 'NOT' | 'XOR';
type Node = { id: string; op: Op; inputs: string[]; value: boolean; x: number; y: number };

/** A small combinational network.  It evaluates a real XOR/AND expression,
 * allowing the changing input signal to propagate through gate levels. */
export class BooleanLogicNetworkExperiment extends ExperimentBase implements ExperimentInstance {
  readonly definition: ExperimentDefinition = {
    id: 'boolean-logic-network', name: 'Boolean Logic Network', year: 1938,
    category: 'logic', era: 'mechanical',
    description: 'AND, OR, NOT and XOR gates propagate binary signals through a circuit.',
    historicalContext: 'Boolean algebra supplied the symbolic language for digital switching circuits.',
    coreIdea: 'Gate outputs are deterministic functions of upstream Boolean values.',
    significance: 'Combinational logic is the substrate from which every digital processor is built.',
    reference: 'C. E. Shannon, A Symbolic Analysis of Relay and Switching Circuits (1937)',
    formula: 'XOR(a,b) = (a ∨ b) ∧ ¬(a ∧ b)', defaultDuration: 10,
    supportsInteraction: true, tags: ['logic', 'gates', 'signals']
  };
  private nodes: Node[] = []; private tick = 0; private pulse = 0; private inputA = false; private inputB = true;
  constructor(seed = 42) { super(); this.seed = seed | 0; this.rng.setSeed(this.seed); }
  init() { this.reset(); this.initialized = true; }
  reset() {
    this.tick = 0; this.pulse = 0; this.inputA = false; this.inputB = true;
    this.nodes = [
      { id: 'A', op: 'INPUT', inputs: [], value: this.inputA, x: .12, y: .35 },
      { id: 'B', op: 'INPUT', inputs: [], value: this.inputB, x: .12, y: .65 },
      { id: 'xor', op: 'XOR', inputs: ['A', 'B'], value: false, x: .36, y: .5 },
      { id: 'not', op: 'NOT', inputs: ['B'], value: false, x: .36, y: .78 },
      { id: 'and', op: 'AND', inputs: ['xor', 'not'], value: false, x: .62, y: .5 },
      { id: 'or', op: 'OR', inputs: ['and', 'A'], value: false, x: .86, y: .5 }
    ];
    this.evaluate();
  }
  private evaluate() {
    const map = new Map(this.nodes.map(n => [n.id, n]));
    this.nodes.filter(n => n.op !== 'INPUT').forEach(n => {
      const v = n.inputs.map(i => map.get(i)?.value ?? false);
      n.value = n.op === 'AND' ? v.every(Boolean) : n.op === 'OR' ? v.some(Boolean) : n.op === 'NOT' ? !v[0] : !!(v[0] !== v[1]);
    });
  }
  step() {
    this.ensureInit(); this.tick++; this.pulse = (this.pulse + 0.14) % 1;
    // Drive two input wires as a repeatable four-state truth table.
    const phase = Math.floor(this.tick / 22) % 4; this.inputA = phase === 1 || phase === 3; this.inputB = phase === 0 || phase === 3;
    this.nodes[0].value = this.inputA; this.nodes[1].value = this.inputB; this.evaluate();
  }
  setParameter(name: string, value: number | string | boolean) {
    if ((name === 'A' || name === 'inputA') && typeof value === 'boolean') { this.inputA = value; this.nodes[0].value = value; this.evaluate(); }
    if ((name === 'B' || name === 'inputB') && typeof value === 'boolean') { this.inputB = value; this.nodes[1].value = value; this.evaluate(); }
  }
  getMetrics() { const out = this.nodes.find(n => n.id === 'or')?.value ?? false; return { tick: this.tick, inputA: this.inputA, inputB: this.inputB, output: out }; }
  getState() { return { nodes: this.nodes.map(n => ({ id: n.id, op: n.op, inputs: n.inputs, value: n.value })) }; }
  render(ctx: RenderTarget, width = this.width, height = this.height) {
    const c = ctx as CanvasRenderingContext2D; clearCanvas(c, '#0e1115'); text(c, 'BOOLEAN NETWORK · SIGNAL PROPAGATION', 28, 34, 12, '#a8b1bb');
    const ox = width * .06, oy = height * .14, uw = width * .88, uh = height * .66;
    const p = (n: Node) => [ox + n.x * uw, oy + n.y * uh]; const map = new Map(this.nodes.map(n => [n.id, n]));
    this.nodes.forEach(n => n.inputs.forEach(input => { const from = map.get(input)!; const [x1, y1] = p(from), [x2, y2] = p(n); line(c, x1, y1, x2, y2, from.value ? '#dfca92' : '#4f5964', from.value ? 3 : 1, .9); }));
    this.nodes.forEach(n => { const [x, y] = p(n); const fill = n.value ? '#dfca92' : '#1b2127'; circle(c, x, y, n.op === 'INPUT' ? 25 : 30, fill, '#aab5c0'); text(c, n.op === 'INPUT' ? n.id : n.op, x, y, n.op === 'INPUT' ? 16 : 11, n.value ? '#131416' : '#e8edf1', 'center'); });
    const out = this.nodes.find(n => n.id === 'or')!; const [x, y] = p(out); text(c, `OUTPUT  ${out.value ? '1' : '0'}`, x, y + 54, 13, out.value ? '#dfca92' : '#9ca7b2', 'center');
    text(c, `A ${this.inputA ? 1 : 0}    B ${this.inputB ? 1 : 0}`, 28, height - 50, 14, '#e4e8eb');
  }
}
export function createBooleanLogicNetwork(seed = 42): ExperimentInstance { const e = new BooleanLogicNetworkExperiment(seed); e.init(); return e; }
export default BooleanLogicNetworkExperiment;
