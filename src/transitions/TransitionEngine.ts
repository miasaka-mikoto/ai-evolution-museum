import { hashSeed } from "../runtime/SeededRandom";
import {
  renderTransition,
  transitionEasing,
  TRANSITION_KINDS,
  type TransitionFrame,
  type TransitionKind,
  type TransitionLayer,
  type TransitionViewport,
} from "./strategies";

export interface TransitionRequest {
  kind?: TransitionKind;
  duration?: number;
  seed?: string | number;
  from?: TransitionLayer;
  to?: TransitionLayer;
  onComplete?: () => void;
}

export interface TransitionState extends TransitionFrame {
  active: boolean;
}

/** Coordinates deterministic visual transitions between experiment scenes. */
export class TransitionEngine {
  private active: TransitionState | null = null;
  private from?: TransitionLayer;
  private to?: TransitionLayer;
  private onComplete?: () => void;

  get isActive(): boolean {
    return Boolean(this.active?.active);
  }

  get progress(): number {
    return this.active?.progress ?? 1;
  }

  get state(): TransitionState | null {
    return this.active ? { ...this.active } : null;
  }

  start(request: TransitionRequest = {}): TransitionState {
    const requestedDuration = request.duration ?? 1.1;
    const duration = Math.max(0.05, Number.isFinite(requestedDuration) ? requestedDuration : 1.1);
    const seed = hashSeed(request.seed ?? 42);
    const kind = request.kind ?? "object-morph";
    this.active = { active: true, kind, progress: 0, eased: 0, elapsed: 0, duration, seed };
    this.from = request.from;
    this.to = request.to;
    this.onComplete = request.onComplete;
    return { ...this.active };
  }

  update(dt: number): TransitionState | null {
    if (!this.active) return null;
    const delta = Number.isFinite(dt) ? Math.max(0, dt) : 0;
    this.active.elapsed = Math.max(0, this.active.elapsed + delta);
    this.active.progress = Math.min(1, this.active.elapsed / this.active.duration);
    this.active.eased = transitionEasing(this.active.progress);
    if (this.active.progress >= 1) {
      this.active.active = false;
      const completed = { ...this.active };
      const callback = this.onComplete;
      this.onComplete = undefined;
      callback?.();
      return completed;
    }
    return { ...this.active };
  }

  render(ctx: CanvasRenderingContext2D, viewport: TransitionViewport): void {
    if (!this.active) {
      this.to?.(ctx, { kind: "object-morph", progress: 1, eased: 1, elapsed: 0, duration: 0, seed: 0 }, viewport);
      return;
    }
    renderTransition(this.active.kind, ctx, this.active, viewport, this.from, this.to);
  }

  finish(): void {
    if (!this.active) return;
    this.active.elapsed = this.active.duration;
    this.active.progress = 1;
    this.active.eased = 1;
    this.active.active = false;
    this.onComplete?.();
    this.onComplete = undefined;
  }

  cancel(): void {
    this.active = null;
    this.from = undefined;
    this.to = undefined;
    this.onComplete = undefined;
  }

  /** Select a stable transition for a pair of experiment IDs. */
  chooseKind(fromId = "", toId = "", sequence = 0): TransitionKind {
    const index = hashSeed(`${fromId}->${toId}:${sequence}`) % TRANSITION_KINDS.length;
    return TRANSITION_KINDS[index];
  }
}

export const TransitionManager = TransitionEngine;

export * from "./strategies";
