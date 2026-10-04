/** Shared contracts for every AI Evolution Museum experiment.
 *
 * The runtime deliberately only depends on this small surface.  Experiments
 * keep their algorithmic state private, while the shell can inspect metrics,
 * change a seed/parameter, and render into the same canvas.
 */

export type ExperimentCategory =
  | "foundations"
  | "symbolic"
  | "search"
  | "learning"
  | "neural"
  | "evolution"
  | "generative"
  | "agent"
  | "modern"
  | string;

export interface ExperimentDefinition {
  id: string;
  name: string;
  year: number;
  category: ExperimentCategory;
  description: string;
  historicalContext?: string;
  /** Backwards-compatible short field used by the first shell prototype. */
  historicalNote?: string;
  coreIdea?: string;
  significance?: string;
  /** A concise provenance note; may contain links or book/paper names. */
  reference?: string;
  references?: string[];
  /** Educational formula(s), rendered as plain text/KaTeX by the shell. */
  formula?: string;
  defaultDuration: number;
  supportsInteraction: boolean;
  era?: "mechanical" | "symbolic" | "connectionist" | "statistical" | "deep" | "agentic";
  tags?: string[];
  controls?: Array<{ name: string; min?: number; max?: number; step?: number; value: number | string | boolean }>;
  create?: ExperimentFactory;
}

export type RenderTarget = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
export interface RenderSurface { ctx: CanvasRenderingContext2D; width: number; height: number; pixelRatio?: number; }

export interface ExperimentSnapshot {
  tick: number;
  time: number;
  seed: number;
  /** JSON-safe algorithm state when an experiment chooses to expose it. */
  state?: unknown;
  metrics: Record<string, number | string | boolean | null>;
}

export type ExperimentMetrics = Record<string, number | string | boolean | null>;

export interface ExperimentInstance {
  readonly definition?: ExperimentDefinition;
  /** Initialise state. Called once by the runtime and after a reset. */
  init?(): void;
  reset(): void;
  /** Advance the actual algorithm by a bounded simulation step. */
  step(dt?: number): void;
  /** Draw the current state. Implementations should tolerate small canvases. */
  render(ctx: RenderTarget | RenderSurface, width?: number, height?: number): void;
  resize?(width: number, height: number): void;
  setSeed?(seed: number): void;
  setParameter?(name: string, value: number | string | boolean): void;
  getParameters?(): Record<string, number | string | boolean>;
  getMetrics(): Record<string, number | string | boolean | null>;
  getSnapshot?(): ExperimentSnapshot;
  /** Optional keyboard/pointer hook used by Interactive Experiment Mode. */
  handleInput?(input: unknown): void;
  dispose?(): void;
}

/** Name retained for the shell and older experiment modules. */
export type Experiment = ExperimentInstance;

export type ExperimentFactory = (seed?: number) => ExperimentInstance;

/** Registry entry allows lazy construction and keeps the initial page cheap. */
export interface ExperimentRegistryEntry extends ExperimentDefinition {
  create: ExperimentFactory;
}

/** Compatibility alias used by the timeline director. */
export type ExperimentEntry = ExperimentRegistryEntry;

/** Coerce a compact experiment module into a registry-friendly entry. */
export function normalizeExperiment(value: any, fallbackId = "experiment"): ExperimentRegistryEntry | null {
  if (!value) return null;
  const definition: ExperimentDefinition = value.definition ?? value;
  const create = typeof value.create === "function"
    ? value.create
    : typeof definition.create === "function"
      ? definition.create
      : typeof value.default === "function"
        ? (seed = 42) => new value.default(seed)
        : null;
  if (!create || !definition.name) return null;
  const id = definition.id || fallbackId;
  return { ...definition, id, historicalContext: definition.historicalContext ?? definition.historicalNote ?? "Educational reconstruction.", create } as ExperimentRegistryEntry;
}
