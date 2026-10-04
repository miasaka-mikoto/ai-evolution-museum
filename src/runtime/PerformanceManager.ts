export type QualityLevel = "low" | "medium" | "high" | "ultra" | "auto";

export interface PerformanceCapabilities {
  devicePixelRatio: number;
  maxPixelRatio: number;
  hardwareConcurrency: number;
  renderer: "canvas2d" | "webgl" | "webgl2" | "webgpu" | "unknown";
  reducedMotion: boolean;
  mobile: boolean;
  offscreenCanvas: boolean;
}

export interface PerformanceSnapshot {
  fps: number;
  frameTime: number;
  averageFrameTime: number;
  /** Frame-time based approximation; it is not an OS process measurement. */
  cpuLoad: number;
  quality: Exclude<QualityLevel, "auto">;
  requestedQuality: QualityLevel;
  devicePixelRatio: number;
  pixelRatio: number;
  objectCount: number;
  memoryEstimate: number;
  renderer: PerformanceCapabilities["renderer"];
  hidden: boolean;
  throttled: boolean;
}

export interface PerformanceManagerOptions {
  quality?: QualityLevel;
  targetFps?: number;
  minFps?: number;
  maxPixelRatio?: number;
  reducedMotion?: boolean;
  adaptive?: boolean;
}

type Listener = (snapshot: PerformanceSnapshot) => void;

const QUALITY_ORDER: Exclude<QualityLevel, "auto">[] = ["low", "medium", "high", "ultra"];

function detectCapabilities(maxPixelRatio = 2): PerformanceCapabilities {
  const globalWindow = typeof window === "undefined" ? undefined : window;
  const globalNavigator = typeof navigator === "undefined" ? undefined : navigator;
  const dpr = Math.max(1, Math.min(maxPixelRatio, globalWindow?.devicePixelRatio || 1));
  const reducedMotion = Boolean(globalWindow?.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  const mobile = Boolean(globalWindow && /Mobi|Android|iPhone|iPad/i.test(globalWindow.navigator.userAgent));
  let renderer: PerformanceCapabilities["renderer"] = "canvas2d";
  try {
    const canvas = typeof document !== "undefined" ? document.createElement("canvas") : null;
    const gl2 = canvas?.getContext("webgl2") as WebGLRenderingContext | null;
    const gl = gl2 || (canvas?.getContext("webgl") as WebGLRenderingContext | null);
    if (gl2) renderer = "webgl2";
    else if (gl) renderer = "webgl";
    // WebGPU presence is useful as a capability hint even though the museum
    // intentionally keeps Canvas2D as its safe fallback.
    if (globalNavigator && "gpu" in globalNavigator) renderer = "webgpu";
  } catch {
    // Some privacy-restricted browsers reject context creation.
  }
  return {
    devicePixelRatio: dpr,
    maxPixelRatio,
    hardwareConcurrency: globalNavigator?.hardwareConcurrency || 4,
    renderer,
    reducedMotion,
    mobile,
    offscreenCanvas: typeof OffscreenCanvas !== "undefined",
  };
}

/**
 * Keeps rendering quality responsive without changing an experiment's
 * simulation.  Experiments can use getBudget() to choose how many objects to
 * draw while their algorithms continue to run at full logical fidelity.
 */
export class PerformanceManager {
  readonly capabilities: PerformanceCapabilities;
  private requestedQuality: QualityLevel;
  private currentQuality: Exclude<QualityLevel, "auto">;
  private targetFps: number;
  private minFps: number;
  private adaptive: boolean;
  private pixelRatio: number;
  private hidden = false;
  private throttled = false;
  private objectCount = 0;
  private memoryEstimate = 0;
  private fps = 60;
  private frameTime = 1000 / 60;
  private averageFrameTime = 1000 / 60;
  private frameSamples: number[] = [];
  private listeners = new Set<Listener>();
  private qualityCooldown = 0;

  constructor(options: PerformanceManagerOptions = {}) {
    this.capabilities = detectCapabilities(options.maxPixelRatio ?? 2);
    this.requestedQuality = options.quality ?? "auto";
    this.targetFps = options.targetFps ?? 60;
    this.minFps = options.minFps ?? 30;
    this.adaptive = options.adaptive ?? true;
    this.currentQuality = this.resolveInitialQuality(options.quality, options.reducedMotion);
    this.pixelRatio = this.computePixelRatio();
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", this.handleVisibility, { passive: true });
      this.hidden = document.visibilityState === "hidden";
      this.throttled = this.hidden;
    }
  }

  private resolveInitialQuality(requested?: QualityLevel, reducedMotion?: boolean): Exclude<QualityLevel, "auto"> {
    if (requested && requested !== "auto") return requested;
    if (reducedMotion || this.capabilities.reducedMotion) return "low";
    if (this.capabilities.mobile || this.capabilities.hardwareConcurrency <= 2) return "medium";
    if (this.capabilities.devicePixelRatio >= 2) return "high";
    return "high";
  }

  private computePixelRatio(): number {
    const caps = this.capabilities;
    const multiplier = this.currentQuality === "low" ? 0.75 : this.currentQuality === "medium" ? 0.9 : 1;
    return Math.max(1, Math.min(caps.maxPixelRatio, caps.devicePixelRatio * multiplier));
  }

  get snapshot(): PerformanceSnapshot {
    return {
      fps: this.fps,
      frameTime: this.frameTime,
      averageFrameTime: this.averageFrameTime,
      cpuLoad: Math.max(0, Math.min(1, this.averageFrameTime / (1000 / Math.max(1, this.targetFps)))),
      quality: this.currentQuality,
      requestedQuality: this.requestedQuality,
      devicePixelRatio: this.capabilities.devicePixelRatio,
      pixelRatio: this.pixelRatio,
      objectCount: this.objectCount,
      memoryEstimate: this.memoryEstimate,
      renderer: this.capabilities.renderer,
      hidden: this.hidden,
      throttled: this.throttled,
    };
  }

  getSnapshot(): PerformanceSnapshot {
    return this.snapshot;
  }

  getCapabilities(): PerformanceCapabilities {
    return { ...this.capabilities };
  }

  get quality(): Exclude<QualityLevel, "auto"> {
    return this.currentQuality;
  }

  get recommendedPixelRatio(): number {
    return this.pixelRatio;
  }

  setQuality(quality: QualityLevel): void {
    this.requestedQuality = quality;
    this.currentQuality = quality === "auto" ? this.resolveInitialQuality("auto") : quality;
    this.pixelRatio = this.computePixelRatio();
    this.emit();
  }

  setAdaptive(enabled: boolean): void {
    this.adaptive = enabled;
  }

  setObjectCount(count: number): void {
    this.objectCount = Math.max(0, Math.round(count));
  }

  setMemoryEstimate(bytes: number): void {
    this.memoryEstimate = Math.max(0, bytes);
  }

  registerFrame(frameTimeMs: number): void {
    if (!Number.isFinite(frameTimeMs) || frameTimeMs <= 0) return;
    this.frameTime = frameTimeMs;
    this.frameSamples.push(frameTimeMs);
    if (this.frameSamples.length > 60) this.frameSamples.shift();
    this.averageFrameTime = this.frameSamples.reduce((sum, value) => sum + value, 0) / this.frameSamples.length;
    this.fps = 1000 / Math.max(0.1, this.averageFrameTime);
    this.qualityCooldown = Math.max(0, this.qualityCooldown - 1);
    if (this.adaptive && this.requestedQuality === "auto" && this.qualityCooldown === 0) {
      if (this.fps < this.minFps && this.currentQuality !== "low") {
        this.shiftQuality(-1);
        this.qualityCooldown = 120;
      } else if (this.fps > this.targetFps * 0.97 && this.currentQuality !== "ultra") {
        // Upgrade slowly so a single quiet frame cannot trigger a quality jump.
        this.shiftQuality(1);
        this.qualityCooldown = 240;
      }
    }
    this.emit();
  }

  private shiftQuality(direction: -1 | 1): void {
    const index = QUALITY_ORDER.indexOf(this.currentQuality);
    const next = QUALITY_ORDER[Math.max(0, Math.min(QUALITY_ORDER.length - 1, index + direction))];
    if (next !== this.currentQuality) {
      this.currentQuality = next;
      this.pixelRatio = this.computePixelRatio();
    }
  }

  shouldThrottle(): boolean {
    return this.throttled;
  }

  /** Suggested draw budgets; algorithms themselves should remain unchanged. */
  getBudget(baseCount: number): number {
    const multiplier = this.currentQuality === "low" ? 0.35 : this.currentQuality === "medium" ? 0.65 : this.currentQuality === "high" ? 0.9 : 1;
    return Math.max(1, Math.round(baseCount * multiplier));
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => this.listeners.delete(listener);
  }

  dispose(): void {
    if (typeof document !== "undefined") document.removeEventListener("visibilitychange", this.handleVisibility);
    this.listeners.clear();
  }

  private emit(): void {
    const snapshot = this.snapshot;
    this.listeners.forEach((listener) => listener(snapshot));
  }

  private handleVisibility = (): void => {
    this.hidden = typeof document !== "undefined" && document.visibilityState === "hidden";
    this.throttled = this.hidden;
    this.emit();
  };
}

export function detectPerformanceCapabilities(maxPixelRatio?: number): PerformanceCapabilities {
  return detectCapabilities(maxPixelRatio);
}
