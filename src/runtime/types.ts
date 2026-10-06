import type { SeededRandom } from "./SeededRandom";

export interface RuntimeViewport {
  width: number;
  height: number;
  pixelRatio: number;
}

export interface RuntimeFrameInfo {
  /** Fixed simulation tick, starting at zero after reset. */
  tick: number;
  /** Total simulated seconds, independent of render frame rate. */
  time: number;
  /** Fixed simulation delta in seconds. */
  dt: number;
  /** Render interpolation factor between the previous and current tick. */
  alpha: number;
  /** Current runtime speed multiplier. */
  speed: number;
  /** Deterministic seed for the active experiment. */
  seed: number;
  /** Suggested display budget; simulation state remains full fidelity. */
  drawBudget: number;
}

export interface RuntimeMetrics {
  [key: string]: number | string | boolean | null | undefined;
}

/**
 * The deliberately small contract consumed by ExperimentRuntime. Experiment
 * implementations may add any fields they need; only these methods are
 * called by the runtime.
 */
export interface RuntimeExperiment {
  id?: string;
  /** Optional compatibility hint for existing experiments. */
  renderMode?: "viewport" | "dimensions";
  init?: (random: SeededRandom) => void;
  reset?: (random?: SeededRandom) => void;
  step?: (dt: number, frame?: RuntimeFrameInfo) => void;
  /**
   * Simulated seconds between algorithm steps while playing.
   * `0` opts out of id-based pacing. `stepOnce` ignores this and always
   * performs one algorithm step. Omit to use the classic-scene schedule.
   */
  playbackInterval?: number;
  render?: (
    ctx: CanvasRenderingContext2D,
    viewport?: RuntimeViewport,
    frame?: RuntimeFrameInfo,
  ) => void;
  /** Optional display-only budget hook used by dense renderers. */
  setDrawBudget?: (budget: number) => void;
  resize?: (width: number, height: number, pixelRatio?: number) => void;
  setSeed?: (seed: number, random?: SeededRandom) => void;
  setParameter?: (name: string, value: unknown) => void;
  getMetrics?: () => RuntimeMetrics;
  dispose?: () => void;
}

export interface RuntimeExperimentFactory<T extends RuntimeExperiment = RuntimeExperiment> {
  (seed: number, random: SeededRandom): T;
}

export interface RuntimeCallbacks<T extends RuntimeExperiment = RuntimeExperiment> {
  onTick?: (frame: RuntimeFrameInfo, experiment: T) => void;
  onRender?: (frame: RuntimeFrameInfo, experiment: T) => void;
  onExperimentChange?: (experiment: T | null, previous: T | null) => void;
  onStateChange?: (state: RuntimeState) => void;
  onError?: (error: unknown) => void;
}

export interface RuntimeState {
  running: boolean;
  paused: boolean;
  speed: number;
  tick: number;
  time: number;
  seed: number;
  fps: number;
  frameTime: number;
  droppedSteps: number;
}

export interface ExperimentRuntimeOptions<T extends RuntimeExperiment = RuntimeExperiment> {
  canvas?: HTMLCanvasElement | null;
  experiment?: T;
  createExperiment?: RuntimeExperimentFactory<T>;
  seed?: string | number;
  fixedStep?: number;
  maxSubSteps?: number;
  speed?: number;
  autoStart?: boolean;
  autoResize?: boolean;
  respectReducedMotion?: boolean;
  callbacks?: RuntimeCallbacks<T>;
}

export type RuntimeEvent =
  | { type: "tick"; frame: RuntimeFrameInfo }
  | { type: "render"; frame: RuntimeFrameInfo }
  | { type: "state"; state: RuntimeState }
  | { type: "experiment"; experiment: RuntimeExperiment | null };
