import { DebugState } from "./DebugState";
import { PerformanceManager } from "./PerformanceManager";
import { hashSeed, SeededRandom } from "./SeededRandom";
import type {
  ExperimentRuntimeOptions,
  RuntimeCallbacks,
  RuntimeExperiment,
  RuntimeFrameInfo,
  RuntimeState,
  RuntimeViewport,
  RuntimeEvent,
} from "./types";

type EventListener = (event: RuntimeEvent) => void;

const raf = (callback: FrameRequestCallback): number => {
  if (typeof requestAnimationFrame !== "undefined") return requestAnimationFrame(callback);
  return setTimeout(() => callback(typeof performance !== "undefined" ? performance.now() : Date.now()), 16) as unknown as number;
};

const cancelRaf = (handle: number): void => {
  if (typeof cancelAnimationFrame !== "undefined") cancelAnimationFrame(handle);
  else clearTimeout(handle as unknown as ReturnType<typeof setTimeout>);
};

/**
 * Fixed-timestep simulation host. Rendering may run at any rate while an
 * experiment's state advances in deterministic fixed increments.
 */
export class ExperimentRuntime<T extends RuntimeExperiment = RuntimeExperiment> {
  readonly performance: PerformanceManager;
  readonly debug: DebugState;
  readonly fixedStep: number;
  readonly maxSubSteps: number;
  private readonly callbacks: RuntimeCallbacks<T>;
  private readonly listeners = new Set<EventListener>();
  private readonly respectReducedMotion: boolean;
  private readonly autoResize: boolean;
  private canvas: HTMLCanvasElement | null;
  private context: CanvasRenderingContext2D | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private experiment: T | null = null;
  private random: SeededRandom;
  private seed: number;
  private frameHandle: number | null = null;
  private lastTimestamp = 0;
  private accumulator = 0;
  private fpsFrameAt = 0;
  private disposed = false;
  private running = false;
  private paused = false;
  private speed: number;
  private tick = 0;
  private time = 0;
  private droppedSteps = 0;
  private viewport: RuntimeViewport = { width: 0, height: 0, pixelRatio: 1 };
  private state: RuntimeState;

  constructor(options: ExperimentRuntimeOptions<T> = {}) {
    this.canvas = options.canvas ?? null;
    this.fixedStep = Math.max(1 / 240, Math.min(0.25, options.fixedStep ?? 1 / 60));
    this.maxSubSteps = Math.max(1, Math.floor(options.maxSubSteps ?? 5));
    this.speed = Math.max(0, options.speed ?? 1);
    this.seed = hashSeed(options.seed ?? 42);
    this.random = new SeededRandom(this.seed);
    this.callbacks = options.callbacks ?? {};
    this.respectReducedMotion = options.respectReducedMotion ?? true;
    this.autoResize = options.autoResize ?? true;
    this.performance = new PerformanceManager({ reducedMotion: this.respectReducedMotion });
    this.debug = new DebugState();
    this.state = this.makeState();
    this.attachCanvas(this.canvas);
    if (options.experiment) this.setExperiment(options.experiment, { initialize: true });
    else if (options.createExperiment) this.setExperiment(options.createExperiment(this.seed, this.random), { initialize: true });
    if (options.autoStart) this.start();
  }

  get activeExperiment(): T | null {
    return this.experiment;
  }

  get currentSeed(): number {
    return this.seed;
  }

  get isRunning(): boolean {
    return this.running;
  }

  get isPaused(): boolean {
    return this.paused;
  }

  get runtimeState(): RuntimeState {
    return { ...this.state };
  }

  getState(): RuntimeState {
    return this.runtimeState;
  }

  get currentViewport(): RuntimeViewport {
    return { ...this.viewport };
  }

  attachCanvas(canvas: HTMLCanvasElement | null): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.canvas = canvas;
    this.context = canvas?.getContext("2d", { alpha: true, desynchronized: true }) ?? null;
    this.resize();
    if (this.autoResize && canvas && typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(canvas);
    }
  }

  setExperiment(experiment: T | null, options: { initialize?: boolean; seed?: string | number } = {}): void {
    const previous = this.experiment;
    if (previous === experiment) return;
    previous?.dispose?.();
    this.experiment = experiment;
    if (options.seed !== undefined) {
      this.seed = hashSeed(options.seed);
      this.random = new SeededRandom(this.seed);
    } else {
      this.random = new SeededRandom(this.seed);
    }
    this.tick = 0;
    this.time = 0;
    this.accumulator = 0;
    if (experiment && options.initialize !== false) {
      experiment.setSeed?.(this.seed, this.random);
      experiment.init?.(this.random);
      experiment.resize?.(this.viewport.width, this.viewport.height, this.viewport.pixelRatio);
    }
    this.debug.update({ experimentId: experiment?.id ?? "", seed: this.seed, tick: 0, simulationTime: 0 });
    this.callbacks.onExperimentChange?.(experiment, previous);
    this.emit({ type: "experiment", experiment });
  }

  setSeed(seed: string | number, reset = true): void {
    this.seed = hashSeed(seed);
    this.random = new SeededRandom(this.seed);
    this.experiment?.setSeed?.(this.seed, this.random);
    if (reset) this.reset();
    this.debug.update({ seed: this.seed });
  }

  setParameter(name: string, value: unknown): void {
    this.experiment?.setParameter?.(name, value);
  }

  start(): void {
    if (this.disposed || this.running) return;
    this.running = true;
    this.paused = false;
    this.lastTimestamp = 0;
    this.state = this.makeState();
    this.scheduleFrame();
    this.emitState();
  }

  run(): void {
    this.start();
  }

  play(): void {
    this.resume();
  }

  stop(): void {
    this.running = false;
    if (this.frameHandle !== null) cancelRaf(this.frameHandle);
    this.frameHandle = null;
    this.emitState();
  }

  pause(): void {
    this.paused = true;
    this.emitState();
  }

  resume(): void {
    this.paused = false;
    this.lastTimestamp = 0;
    if (!this.running) this.start();
    this.emitState();
  }

  togglePause(): void {
    if (this.paused) this.resume();
    else this.pause();
  }

  setSpeed(speed: number): void {
    this.speed = Math.max(0, Math.min(16, Number.isFinite(speed) ? speed : 1));
    this.emitState();
  }

  reset(): void {
    this.random = new SeededRandom(this.seed);
    this.tick = 0;
    this.time = 0;
    this.accumulator = 0;
    this.droppedSteps = 0;
    this.experiment?.reset?.(this.random);
    this.experiment?.setSeed?.(this.seed, this.random);
    this.debug.update({ seed: this.seed, tick: 0, simulationTime: 0 });
    this.emitState();
  }

  /** Advance one exact simulation tick even while paused. */
  stepOnce(): void {
    if (!this.experiment || this.disposed) return;
    this.advanceSimulation(this.fixedStep);
    this.render(0);
    this.emitState();
  }

  advance(dt = this.fixedStep): void {
    if (!this.experiment || this.disposed) return;
    this.advanceSimulation(Math.max(0, dt));
    this.emitState();
  }

  resize(width?: number, height?: number): void {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect?.();
    const cssWidth = Math.max(1, Math.round(width ?? rect?.width ?? this.canvas.clientWidth ?? this.canvas.width ?? 1));
    const cssHeight = Math.max(1, Math.round(height ?? rect?.height ?? this.canvas.clientHeight ?? this.canvas.height ?? 1));
    const pixelRatio = this.performance.recommendedPixelRatio;
    this.canvas.width = Math.max(1, Math.round(cssWidth * pixelRatio));
    this.canvas.height = Math.max(1, Math.round(cssHeight * pixelRatio));
    this.viewport = { width: cssWidth, height: cssHeight, pixelRatio };
    this.experiment?.resize?.(cssWidth, cssHeight, pixelRatio);
    this.debug.update({ viewport: this.viewport });
  }

  render(alpha = 0): void {
    if (!this.context || !this.experiment) return;
    const frame = this.frameInfo(alpha);
    const ctx = this.context;
    // Quality only limits display work. Algorithms continue to step over their
    // complete logical state, so replay and metrics remain invariant.
    this.experiment.setDrawBudget?.(this.performance.getBudget(1000));
    ctx.save();
    // Experiments draw in CSS pixels; canvas dimensions are physical pixels.
    ctx.setTransform(this.viewport.pixelRatio, 0, 0, this.viewport.pixelRatio, 0, 0);
    const render = this.experiment.render;
    if (render) {
      // Existing AEM experiments use render(ctx, width, height); new modules
      // can opt into render(ctx, viewport, frame). The explicit hint wins,
      // while arity keeps legacy modules working without an adapter.
      const mode = this.experiment.renderMode ?? (render.length >= 3 ? "dimensions" : "viewport");
      if (mode === "dimensions") {
        (render as unknown as (target: CanvasRenderingContext2D, width: number, height: number, frame?: RuntimeFrameInfo) => void)(ctx, this.viewport.width, this.viewport.height, frame);
      } else {
        render(ctx, this.viewport, frame);
      }
    }
    ctx.restore();
    this.callbacks.onRender?.(frame, this.experiment);
    this.emit({ type: "render", frame });
  }

  subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stop();
    this.experiment?.dispose?.();
    this.experiment = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.performance.dispose();
    this.listeners.clear();
  }

  private scheduleFrame(): void {
    if (!this.running || this.disposed || this.frameHandle !== null) return;
    this.frameHandle = raf(this.onAnimationFrame);
  }

  private onAnimationFrame = (timestamp: number): void => {
    this.frameHandle = null;
    if (!this.running || this.disposed) return;
    if (this.lastTimestamp === 0) this.lastTimestamp = timestamp;
    const elapsed = Math.min(0.25, Math.max(0, (timestamp - this.lastTimestamp) / 1000));
    this.lastTimestamp = timestamp;
    if (!this.paused && !this.performance.shouldThrottle()) {
      this.accumulator += elapsed * this.speed;
      let steps = 0;
      while (this.accumulator >= this.fixedStep && steps < this.maxSubSteps) {
        this.advanceSimulation(this.fixedStep);
        this.accumulator -= this.fixedStep;
        steps += 1;
      }
      if (this.accumulator >= this.fixedStep) {
        this.droppedSteps += Math.floor(this.accumulator / this.fixedStep);
        this.accumulator = this.accumulator % this.fixedStep;
      }
    }
    const alpha = this.fixedStep === 0 ? 0 : this.accumulator / this.fixedStep;
    this.render(alpha);
    // Register the display interval (rather than only the few milliseconds
    // spent inside render) so FPS and adaptive quality reflect what a user
    // actually sees.
    this.performance.registerFrame(Math.max(0.01, elapsed * 1000));
    this.updateDebug();
    this.scheduleFrame();
  };

  private advanceSimulation(dt: number): void {
    if (!this.experiment) return;
    const frame = this.frameInfo(0);
    this.experiment.step?.(dt, frame);
    this.tick += 1;
    this.time += dt;
    const nextFrame = this.frameInfo(0);
    this.callbacks.onTick?.(nextFrame, this.experiment);
    this.emit({ type: "tick", frame: nextFrame });
    this.state = this.makeState();
  }

  private frameInfo(alpha: number): RuntimeFrameInfo {
    return { tick: this.tick, time: this.time, dt: this.fixedStep, alpha, speed: this.speed, seed: this.seed, drawBudget: this.performance.getBudget(1000) };
  }

  private makeState(): RuntimeState {
    return {
      running: this.running,
      paused: this.paused,
      speed: this.speed,
      tick: this.tick,
      time: this.time,
      seed: this.seed,
      fps: this.performance?.snapshot.fps ?? 0,
      frameTime: this.performance?.snapshot.frameTime ?? 0,
      droppedSteps: this.droppedSteps,
    };
  }

  private emitState(): void {
    this.state = this.makeState();
    this.callbacks.onStateChange?.(this.state);
    this.emit({ type: "state", state: this.state });
  }

  private updateDebug(): void {
    const metrics = this.experiment?.getMetrics?.() ?? {};
    const performanceSnapshot = this.performance.snapshot;
    this.debug.update({
      experimentId: this.experiment?.id ?? "",
      seed: this.seed,
      tick: this.tick,
      simulationTime: this.time,
      objectCount: performanceSnapshot.objectCount,
      memoryEstimate: performanceSnapshot.memoryEstimate,
      fps: performanceSnapshot.fps,
      frameTime: performanceSnapshot.frameTime,
      cpuLoad: performanceSnapshot.cpuLoad,
      quality: performanceSnapshot.quality,
      renderer: performanceSnapshot.renderer,
      extra: metrics,
    });
    this.state = this.makeState();
  }

  private emit(event: RuntimeEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }
}

export const FixedStepRuntime = ExperimentRuntime;
