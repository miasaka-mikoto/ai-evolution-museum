import { ExperimentBase, clearCanvas, roundRect, text } from '../common';
import type { ExperimentDefinition, RenderTarget, ExperimentInstance } from '../../types/experiment';

type Speaker = 'JUDGE' | 'A' | 'B';
type Message = { speaker: Speaker; body: string };

/** Offline reconstruction of the structure of the imitation game.  Participant
 * A uses deterministic pattern templates; participant B is a transparent
 * human-simulator with a different style.  No language model or network call is
 * involved. */
export class ImitationGameExperiment extends ExperimentBase implements ExperimentInstance {
  readonly definition: ExperimentDefinition = {
    id: 'imitation-game', name: 'Imitation Game', year: 1950,
    category: 'symbolic', era: 'symbolic',
    description: 'A rule-based judge compares two offline text participants.',
    historicalContext: 'Turing proposed the imitation game as a question about observable machine behaviour.',
    coreIdea: 'The judge sees responses, not implementation details, and updates a belief.',
    significance: 'It framed machine intelligence as an operational, behavioural test.',
    reference: 'A. M. Turing, Computing Machinery and Intelligence (1950)',
    formula: 'belief ← belief + evidence(response)', defaultDuration: 12,
    supportsInteraction: true, tags: ['dialogue', 'evaluation', 'rules']
  };
  private prompts = ['What is your favourite colour?', 'Can a machine be creative?', 'Complete: the quick brown…', 'What is 2 + 2?', 'Tell me one thing you remember.'];
  private messages: Message[] = []; private turn = 0; private judgeScore = 0.5; private complete = false; private customPrompt = '';
  constructor(seed = 42) { super(); this.seed = seed | 0; this.rng.setSeed(this.seed); }
  init() { this.reset(); this.initialized = true; }
  reset() { this.messages = []; this.turn = 0; this.judgeScore = 0.5; this.complete = false; this.customPrompt = ''; this.messages.push({ speaker: 'JUDGE', body: this.prompts[0] }); }
  private participantA(prompt: string): string {
    const p = prompt.toLowerCase();
    if (p.includes('colour') || p.includes('color')) return 'I tend toward blue: a compact wavelength with a long history.';
    if (p.includes('creative')) return 'I can recombine patterns, but whether that is creativity is a question for the judge.';
    if (p.includes('quick brown')) return 'fox — though “quick” is a property of the sentence, not the animal.';
    if (p.includes('2 + 2') || p.includes('2+2')) return 'Four. Arithmetic is refreshingly unambiguous.';
    return 'I retain the structure of this conversation and can refer to it.';
  }
  private participantB(prompt: string): string {
    const p = prompt.toLowerCase();
    if (p.includes('colour') || p.includes('color')) return 'Probably green. It feels calm, especially in summer.';
    if (p.includes('creative')) return 'Maybe. People make surprising combinations too, so I am not sure where the line is.';
    if (p.includes('quick brown')) return 'fox jumps over the lazy dog.';
    if (p.includes('2 + 2') || p.includes('2+2')) return '4';
    return 'I would have to think about that; my memory is not perfect.';
  }
  step() {
    this.ensureInit(); if (this.complete) return;
    const prompt = this.customPrompt || this.prompts[this.turn % this.prompts.length]; this.customPrompt = '';
    const a = this.participantA(prompt), b = this.participantB(prompt);
    this.messages.push({ speaker: 'A', body: a }, { speaker: 'B', body: b });
    // The deterministic judge treats concise colloquial answers as human-like.
    const machineEvidence = /structure|wavelength|unambiguous|recombine/.test(a) ? 0.08 : -0.03;
    this.judgeScore = Math.max(0, Math.min(1, this.judgeScore + machineEvidence));
    this.turn++; if (this.turn >= this.prompts.length) this.complete = true;
    if (!this.complete) this.messages.push({ speaker: 'JUDGE', body: this.prompts[this.turn] });
  }
  handleInput(input: unknown) { if (typeof input !== 'string') return; if (input === 'Backspace') this.customPrompt = this.customPrompt.slice(0, -1); else if (input.length === 1) this.customPrompt = `${this.customPrompt}${input}`.slice(-120); else if (input.trim()) this.customPrompt = input.trim().slice(0, 120); }
  getMetrics() { return { turn: this.turn, rounds: this.prompts.length, machineBelief: Number(this.judgeScore.toFixed(3)), complete: this.complete }; }
  getState() { return { messages: [...this.messages], turn: this.turn, machineBelief: this.judgeScore }; }
  render(ctx: RenderTarget, width = this.width, height = this.height) {
    const c = ctx as CanvasRenderingContext2D; clearCanvas(c, '#0d1014'); text(c, 'IMITATION GAME · OFFLINE PARTICIPANTS', 28, 34, 12, '#a9b2bc');
    const visible = this.messages.slice(-7); let y = 76;
    visible.forEach(m => { const color = m.speaker === 'JUDGE' ? '#d4c394' : m.speaker === 'A' ? '#9eb8cf' : '#b7c0c8'; const x = m.speaker === 'B' ? width * .51 : 34; const w = width * .43; roundRect(c, x, y, w, 48, 5, '#171c22', color); text(c, m.speaker, x + 12, y + 14, 10, color); text(c, m.body.slice(0, 70), x + 12, y + 33, 12, '#ebeff2'); y += 58; });
    text(c, `judge belief: ${(this.judgeScore * 100).toFixed(0)}% machine-like`, 28, height - 52, 13, '#d4c394');
    text(c, this.complete ? 'round complete · reset to replay' : 'step to ask the next question', width - 28, height - 52, 12, '#8995a2', 'right');
  }
}
export function createImitationGame(seed = 42): ExperimentInstance { const e = new ImitationGameExperiment(seed); e.init(); return e; }
export default ImitationGameExperiment;
