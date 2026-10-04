import type { ExperimentInstance as Experiment } from '../types/experiment';
export type { ExperimentInstance as Experiment, ExperimentDefinition, RenderTarget } from '../types/experiment';

/** Small deterministic PRNG.  Using integer arithmetic makes replay stable
 * across browsers and node test runners. */
export class SeededRng {
  private state: number;
  constructor(seed = 42) { this.state = (seed >>> 0) || 0x6d2b79f5; }
  setSeed(seed: number) { this.state = (seed >>> 0) || 0x6d2b79f5; }
  next(): number {
    let t = this.state += 0x6d2b79f5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  int(max: number): number { return Math.floor(this.next() * max); }
  range(min: number, max: number): number { return min + this.next() * (max - min); }
  bool(p = 0.5): boolean { return this.next() < p; }
  pick<T>(xs: readonly T[]): T { return xs[this.int(xs.length)]; }
}

export abstract class ExperimentBase implements Experiment {
  abstract readonly definition: Experiment['definition'];
  protected seed = 42;
  protected rng = new SeededRng(this.seed);
  protected width = 1280;
  protected height = 720;
  protected initialized = false;
  /** Display-only cap; the algorithmic arrays and updates stay complete. */
  protected drawBudget = 1000;
  abstract init(): void;
  abstract reset(): void;
  abstract step(dt?: number): void;
  abstract render(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, width?: number, height?: number): void;
  resize(width: number, height: number) { this.width = width; this.height = height; }
  setSeed(seed: number) { this.seed = seed | 0; this.rng.setSeed(this.seed); this.reset(); }
  setParameter(_name: string, _value: number | string | boolean) { /* optional */ }
  setDrawBudget(value: number) { this.drawBudget = Math.max(1, Math.floor(Number.isFinite(value) ? value : 1000)); }
  getMetrics(): Record<string, number | string | boolean> { return {}; }
  getState(): unknown { return undefined; }
  dispose() { this.initialized = false; }
  protected ensureInit() { if (!this.initialized) this.init(); }
}

export function clearCanvas(ctx: CanvasRenderingContext2D, color = '#080a0d') {
  ctx.save(); ctx.fillStyle = color; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); ctx.restore();
}
export function fitCanvas(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const sx = w / Math.max(1, ctx.canvas.width), sy = h / Math.max(1, ctx.canvas.height);
  ctx.setTransform(sx, 0, 0, sy, 0, 0);
}
export function text(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, size = 14, color = '#e8e8e8', align: CanvasTextAlign = 'left') {
  ctx.save(); ctx.font = `${size}px ui-monospace, SFMono-Regular, Menlo, monospace`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(value, x, y); ctx.restore();
}
export function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color = '#65717f', width = 1, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
}
export function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, stroke?: string) {
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); } ctx.restore();
}
export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string) {
  ctx.save(); ctx.beginPath();
  // Older Safari/jsdom canvases do not expose roundRect; a plain rectangle is
  // a graceful rendering fallback and does not affect the algorithm state.
  if (typeof (ctx as CanvasRenderingContext2D & { roundRect?: Function }).roundRect === 'function') ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); } ctx.restore();
}
export function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }

/**
 * Bridge the two harmless render conventions used by early experiments:
 * `render(ctx, width, height)` and `render({ctx, width, height})`.  Keeping
 * this at the boundary lets the runtime and tests use one stable call shape.
 */
export function renderExperiment(instance: any, target: CanvasRenderingContext2D | { ctx: CanvasRenderingContext2D; width: number; height: number }, width?: number, height?: number): void {
  const surface = (target && typeof target === 'object' && 'ctx' in target)
    ? target as { ctx: CanvasRenderingContext2D; width: number; height: number }
    : { ctx: target as CanvasRenderingContext2D, width: width ?? ((target as CanvasRenderingContext2D).canvas?.width ?? 1), height: height ?? ((target as CanvasRenderingContext2D).canvas?.height ?? 1) };
  const fn = instance?.render;
  if (typeof fn !== 'function') return;
  const source = Function.prototype.toString.call(fn);
  const objectStyle = /render\s*\(\s*\{/.test(source) || /=>\s*\{?\s*const\s*\{\s*ctx/.test(source);
  if (objectStyle) fn.call(instance, surface);
  else fn.call(instance, surface.ctx, surface.width, surface.height);
}

/** Attach metadata and a consistent renderer to compact algorithm classes. */
export function adaptExperiment<T extends object>(instance: T, definition: any): any {
  if (!(instance as any).definition) (instance as any).definition = definition;
  const original = (instance as any).render;
  if (typeof original === 'function') {
    (instance as any).render = function render(target: any, width?: number, height?: number) {
      const surface = (target && typeof target === 'object' && 'ctx' in target)
        ? target
        : { ctx: target, width: width ?? target?.canvas?.width ?? 1, height: height ?? target?.canvas?.height ?? 1 };
      const source = Function.prototype.toString.call(original);
      const objectStyle = /render\s*\(\s*\{/.test(source) || /=>\s*\{?\s*const\s*\{\s*ctx/.test(source);
      if (objectStyle) original.call(instance, surface);
      else original.call(instance, surface.ctx, surface.width, surface.height);
    };
  }
  return instance;
}
