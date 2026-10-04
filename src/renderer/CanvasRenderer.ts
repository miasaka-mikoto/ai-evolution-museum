import type { RuntimeViewport } from "../runtime/types";

export interface RenderSurface extends RuntimeViewport {
  canvas: HTMLCanvasElement | OffscreenCanvas;
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
}

export interface CanvasRendererOptions {
  canvas: HTMLCanvasElement;
  pixelRatio?: number;
  alpha?: boolean;
  desynchronized?: boolean;
}

/** Canvas2D surface helper shared by experiments and the museum shell. */
export class CanvasRenderer {
  readonly canvas: HTMLCanvasElement;
  readonly context: CanvasRenderingContext2D;
  private viewport: RuntimeViewport = { width: 1, height: 1, pixelRatio: 1 };

  constructor(options: CanvasRendererOptions) {
    this.canvas = options.canvas;
    const context = this.canvas.getContext("2d", {
      alpha: options.alpha ?? true,
      desynchronized: options.desynchronized ?? true,
    });
    if (!context) throw new Error("CanvasRenderer requires a Canvas2D context");
    this.context = context;
    this.resize();
  }

  get currentViewport(): RuntimeViewport {
    return { ...this.viewport };
  }

  resize(width?: number, height?: number, pixelRatio?: number): RuntimeViewport {
    const rect = this.canvas.getBoundingClientRect?.();
    const cssWidth = Math.max(1, Math.round(width ?? rect?.width ?? this.canvas.clientWidth ?? 1));
    const cssHeight = Math.max(1, Math.round(height ?? rect?.height ?? this.canvas.clientHeight ?? 1));
    const browserDpr = typeof window !== "undefined" ? window.devicePixelRatio : 1;
    const priorRatio = this.viewport.width > 1 || this.viewport.height > 1 ? this.viewport.pixelRatio : browserDpr;
    const dpr = Math.max(1, Math.min(4, pixelRatio ?? priorRatio));
    this.canvas.width = Math.round(cssWidth * dpr);
    this.canvas.height = Math.round(cssHeight * dpr);
    this.viewport = { width: cssWidth, height: cssHeight, pixelRatio: dpr };
    this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
    return this.currentViewport;
  }

  clear(fill?: string | CanvasGradient | CanvasPattern): void {
    const ctx = this.context;
    ctx.save();
    ctx.setTransform(this.viewport.pixelRatio, 0, 0, this.viewport.pixelRatio, 0, 0);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fillRect(0, 0, this.viewport.width, this.viewport.height);
    } else {
      ctx.clearRect(0, 0, this.viewport.width, this.viewport.height);
    }
    ctx.restore();
  }

  beginFrame(fill?: string | CanvasGradient | CanvasPattern): CanvasRenderingContext2D {
    this.context.save();
    this.context.setTransform(this.viewport.pixelRatio, 0, 0, this.viewport.pixelRatio, 0, 0);
    if (fill) {
      this.context.fillStyle = fill;
      this.context.fillRect(0, 0, this.viewport.width, this.viewport.height);
    }
    return this.context;
  }

  endFrame(): void {
    this.context.restore();
  }

  render(callback: (ctx: CanvasRenderingContext2D, viewport: RuntimeViewport) => void, fill?: string): void {
    const context = this.beginFrame(fill);
    try {
      callback(context, this.currentViewport);
    } finally {
      this.endFrame();
    }
  }

  toDataURL(type = "image/png", quality?: number): string {
    return this.canvas.toDataURL(type, quality);
  }
}

/** Create a detached drawing surface for transition compositing. */
export function createRenderSurface(width: number, height: number, pixelRatio = 1): RenderSurface {
  const canvas = typeof OffscreenCanvas !== "undefined"
    ? new OffscreenCanvas(Math.max(1, Math.round(width * pixelRatio)), Math.max(1, Math.round(height * pixelRatio)))
    : (() => {
      if (typeof document === "undefined") throw new Error("No canvas factory available in this environment");
      const element = document.createElement("canvas");
      element.width = Math.max(1, Math.round(width * pixelRatio));
      element.height = Math.max(1, Math.round(height * pixelRatio));
      return element;
    })();
  const context = canvas.getContext("2d", { alpha: true }) as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  if (!context) throw new Error("Unable to create a transition render surface");
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  return { canvas, context, width, height, pixelRatio };
}
