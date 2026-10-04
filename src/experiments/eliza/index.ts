import { ExperimentBase, clearCanvas, roundRect, text } from '../common';
import type { ExperimentDefinition, RenderTarget, ExperimentInstance } from '../../types/experiment';

type Rule = { pattern: RegExp; replies: string[] };
type ChatLine = { who: 'YOU' | 'ELIZA'; body: string };

/** Classic pattern/wildcard/reflection dialogue, intentionally transparent and
 * deterministic.  It is an educational reconstruction rather than a claim of
 * natural-language understanding. */
export class ElizaExperiment extends ExperimentBase implements ExperimentInstance {
  readonly definition: ExperimentDefinition = {
    id: 'eliza', name: 'ELIZA Style Rule System', year: 1966, category: 'symbolic', era: 'symbolic',
    description: 'Patterns, wildcard captures and reflection rules produce a tiny therapist dialogue.',
    historicalContext: 'Weizenbaum’s ELIZA demonstrated how surface language patterns can feel conversational.',
    coreIdea: 'Match a template, reflect pronouns, and choose a response without a learned model.',
    significance: 'The programme became a landmark in discussions about language, simulation, and attribution.',
    reference: 'J. Weizenbaum, ELIZA (1966)', formula: 'pattern + capture → response template', defaultDuration: 11,
    supportsInteraction: true, tags: ['language', 'rules', 'reflection']
  };
  private rules: Rule[] = []; private lines: ChatLine[] = []; private pending = ''; private tick = 0;
  private fallback = ['Please tell me more.', 'How does that make you feel?', 'Let us examine that thought.'];
  constructor(seed = 42) { super(); this.seed = seed | 0; this.rng.setSeed(this.seed); }
  init() { this.reset(); this.initialized = true; }
  reset() {
    this.rules = [
      { pattern: /\b(?:i am|i'm) (.+)/i, replies: ['How long have you been $1?', 'Why do you say you are $1?'] },
      { pattern: /\bmy (.+)/i, replies: ['Tell me more about your $1.', 'How does your $1 affect you?'] },
      { pattern: /\b(?:i|we) feel (.+)/i, replies: ['Do you often feel $1?', 'What makes you feel $1?'] },
      { pattern: /\b(?:hello|hi|hey)\b/i, replies: ['Hello. How are you feeling today?'] },
      { pattern: /\b(?:because|why)\b(.+)/i, replies: ['Is that the real reason?', 'What other reasons might there be?'] },
      { pattern: /\b(?:remember|memory)\b(.+)/i, replies: ['What does that memory mean to you?'] }
    ];
    this.lines = [{ who: 'ELIZA', body: 'Tell me what brings you here.' }]; this.pending = ''; this.tick = 0;
  }
  private reflect(value: string) { return value.replace(/\bI\b/gi, 'you').replace(/\bme\b/gi, 'you').replace(/\bmy\b/gi, 'your').replace(/\byou\b/gi, 'I'); }
  private answer(input: string) {
    for (const rule of this.rules) { const match = rule.pattern.exec(input); if (match) { const template = rule.replies[this.tick % rule.replies.length]; return template.replace(/\$(\d+)/g, (_, n) => this.reflect(match[Number(n)] || 'that')); } }
    return this.fallback[this.tick % this.fallback.length];
  }
  step() { this.ensureInit(); const input = this.pending || ['I am learning', 'my work is difficult', 'I feel curious'][this.tick % 3]; this.pending = ''; this.lines.push({ who: 'YOU', body: input }, { who: 'ELIZA', body: this.answer(input) }); this.tick++; }
  handleInput(input: unknown) { if (typeof input !== 'string') return; if (input === 'Backspace') this.pending = this.pending.slice(0, -1); else if (input.length === 1) this.pending = `${this.pending}${input}`.slice(-160); else if (input.trim()) this.pending = input.trim().slice(0, 160); }
  getMetrics() { return { tick: this.tick, rules: this.rules.length, turns: Math.floor(this.lines.length / 2) }; }
  getState() { return { lines: [...this.lines], rules: this.rules.map(r => r.pattern.source) }; }
  render(ctx: RenderTarget, width = this.width, height = this.height) {
    const c = ctx as CanvasRenderingContext2D; clearCanvas(c, '#101216'); text(c, 'ELIZA · PATTERN / WILDCARD / REFLECTION', 28, 34, 12, '#aab3bd');
    let y = 76; this.lines.slice(-7).forEach(lineItem => { const you = lineItem.who === 'YOU'; const x = you ? width * .42 : 28; const w = width * .52; const accent = you ? '#8fa9be' : '#d6c18f'; roundRect(c, x, y, w, 46, 5, '#181e24', accent); text(c, lineItem.who, x + 12, y + 14, 10, accent); text(c, lineItem.body.slice(0, 80), x + 12, y + 32, 12, '#e8edf1'); y += 55; });
    text(c, `${this.rules.length} transparent rules · no model call`, 28, height - 48, 12, '#8794a1');
  }
}
export function createEliza(seed = 42): ExperimentInstance { const e = new ElizaExperiment(seed); e.init(); return e; }
export default ElizaExperiment;
