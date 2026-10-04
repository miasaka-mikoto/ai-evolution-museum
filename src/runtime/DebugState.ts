import type { PerformanceSnapshot } from "./PerformanceManager";

export interface DebugSnapshot {
  enabled: boolean;
  experimentId: string;
  seed: number;
  tick: number;
  simulationTime: number;
  objectCount: number;
  memoryEstimate: number;
  fps: number;
  frameTime: number;
  cpuLoad: number;
  quality: string;
  renderer: string;
  viewport: { width: number; height: number; pixelRatio: number };
  extra: Record<string, unknown>;
}

type DebugListener = (snapshot: DebugSnapshot) => void;

function readDebugQuery(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const value = new URLSearchParams(window.location.search).get("debug");
    return value === "1" || value === "true" || value === "yes";
  } catch {
    return false;
  }
}

/** Shared state for the optional ?debug=1 overlay and automated smoke tests. */
export class DebugState {
  private state: DebugSnapshot = {
    enabled: readDebugQuery(),
    experimentId: "",
    seed: 0,
    tick: 0,
    simulationTime: 0,
    objectCount: 0,
    memoryEstimate: 0,
    fps: 0,
    frameTime: 0,
    cpuLoad: 0,
    quality: "high",
    renderer: "canvas2d",
    viewport: { width: 0, height: 0, pixelRatio: 1 },
    extra: {},
  };
  private listeners = new Set<DebugListener>();

  get snapshot(): DebugSnapshot {
    return {
      ...this.state,
      viewport: { ...this.state.viewport },
      extra: { ...this.state.extra },
    };
  }

  getSnapshot(): DebugSnapshot {
    return this.snapshot;
  }

  get enabled(): boolean {
    return this.state.enabled;
  }

  setEnabled(enabled: boolean): void {
    if (this.state.enabled === enabled) return;
    this.state.enabled = enabled;
    this.emit();
  }

  toggle(): void {
    this.setEnabled(!this.state.enabled);
  }

  update(partial: Partial<Omit<DebugSnapshot, "viewport" | "extra">> & {
    viewport?: Partial<DebugSnapshot["viewport"]>;
    extra?: Record<string, unknown>;
  }): void {
    this.state = {
      ...this.state,
      ...partial,
      viewport: { ...this.state.viewport, ...(partial.viewport ?? {}) },
      extra: { ...this.state.extra, ...(partial.extra ?? {}) },
    };
    this.emit();
  }

  updatePerformance(snapshot: PerformanceSnapshot): void {
    this.update({
      fps: snapshot.fps,
      frameTime: snapshot.frameTime,
      cpuLoad: snapshot.cpuLoad,
      quality: snapshot.quality,
      renderer: snapshot.renderer,
    });
  }

  subscribe(listener: DebugListener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => this.listeners.delete(listener);
  }

  /** Text form is useful for a tiny debug HUD and screenshot metadata. */
  toText(): string {
    const s = this.state;
    return [
      `FPS ${s.fps.toFixed(1)}`,
      `FRAME ${s.frameTime.toFixed(2)}ms`,
      `CPU ${(s.cpuLoad * 100).toFixed(0)}%*`,
      `EXPERIMENT ${s.experimentId || "—"}`,
      `SEED ${s.seed}`,
      `TICK ${s.tick}`,
      `OBJECTS ${s.objectCount}`,
      `MEMORY ${formatBytes(s.memoryEstimate)}`,
      `QUALITY ${s.quality}`,
      `RENDERER ${s.renderer}`,
    ].join("  ");
  }

  private emit(): void {
    const snapshot = this.snapshot;
    this.listeners.forEach((listener) => listener(snapshot));
  }
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 1024) return `${Math.max(0, bytes | 0)} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes;
  let index = -1;
  do {
    value /= 1024;
    index += 1;
  } while (value >= 1024 && index < units.length - 1);
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[index]}`;
}
