/** Shared contract for every museum experiment.
 *
 * The runtime deliberately keeps this interface small.  An experiment owns its
 * algorithmic state, while the runtime owns the animation clock and canvas.
 * Implementations are also useful in node tests: `step`, `reset`, and
 * `getMetrics` do not require a browser.
 */
export type ExperimentCategory =
  | 'mechanical' | 'logic' | 'search' | 'learning' | 'language'
  | 'classical' | 'symbolic' | 'neural' | 'evolution' | 'generative' | 'agent' | string;

export interface ExperimentDefinition {
  id: string;
  name: string;
  year: number;
  category: ExperimentCategory | string;
  description: string;
  historicalNote?: string;
  historicalContext?: string;
  reference?: string;
  coreIdea?: string;
  formula?: string;
  defaultDuration: number;
  supportsInteraction: boolean;
  controls?: Array<{ name: string; min?: number; max?: number; step?: number; value: number | string }>;
  references?: string[];
  significance?: string;
  tags?: string[];
  era?: string;
  /** Factory is included on registry entries; optional on plain metadata. */
  create?: (seed?: number) => Experiment;
}

export interface RenderSurface {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  pixelRatio?: number;
}

export type RenderTarget = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export type ExperimentMetrics = Record<string, number | string | boolean | null>;

export interface Experiment {
  /** Some compact educational modules expose metadata separately; optional keeps them testable. */
  readonly definition?: ExperimentDefinition;
  init?(): void;
  reset(): void;
  step(dt?: number): void;
  render(ctx: CanvasRenderingContext2D | RenderSurface | RenderTarget, width?: number, height?: number): void;
  resize?(width: number, height: number): void;
  setSeed?(seed: number): void;
  setParameter?(name: string, value: number | string | boolean): void;
  getMetrics(): ExperimentMetrics;
  /** Optional state used by the detail/debug panels. */
  getState?(): unknown;
  dispose?(): void;
}

export type ExperimentInstance = Experiment;
export type ExperimentFactory = (seed?: number) => Experiment;

/** Shared deterministic RNG helpers kept here for older experiment modules. */
export function seededRandom(seed = 1): () => number {
  let a = (seed >>> 0) || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clearSurface(surface: RenderSurface, color = '#08090b'): void {
  const { ctx, width, height } = surface;
  ctx.save(); ctx.fillStyle = color; ctx.fillRect(0, 0, width, height); ctx.restore();
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function text(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, size = 12, color = '#e8edf2'): void {
  ctx.save(); ctx.fillStyle = color; ctx.font = `${size}px ui-monospace, SFMono-Regular, Menlo, monospace`; ctx.textBaseline = 'middle'; ctx.fillText(value, x, y); ctx.restore();
}
