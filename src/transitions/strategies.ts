import { SeededRandom } from "../runtime/SeededRandom";

export type TransitionKind =
  | "object-morph"
  | "spatial-wipe"
  | "graph-collapse"
  | "particle-reassignment"
  | "grid-reconfiguration"
  | "matrix-fold"
  | "camera-travel"
  | "signal-propagation"
  | "node-bloom"
  | "tape-to-grid";

export interface TransitionFrame {
  kind: TransitionKind;
  progress: number;
  eased: number;
  elapsed: number;
  duration: number;
  seed: number;
}

export interface TransitionViewport {
  width: number;
  height: number;
}

export type TransitionLayer = (ctx: CanvasRenderingContext2D, frame: TransitionFrame, viewport: TransitionViewport) => void;

const easeInOut = (value: number): number => value * value * (3 - 2 * value);
const easeOut = (value: number): number => 1 - (1 - value) ** 3;

function drawLayer(ctx: CanvasRenderingContext2D, layer: TransitionLayer | undefined, frame: TransitionFrame, viewport: TransitionViewport, alpha = 1): void {
  if (!layer || alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  layer(ctx, frame, viewport);
  ctx.restore();
}

function centerTransform(ctx: CanvasRenderingContext2D, viewport: TransitionViewport, scale: number, rotation = 0, translateX = 0, translateY = 0): void {
  ctx.translate(viewport.width / 2 + translateX, viewport.height / 2 + translateY);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  ctx.translate(-viewport.width / 2, -viewport.height / 2);
}

/** Render one of the museum's object-driven transition languages. */
export function renderTransition(
  kind: TransitionKind,
  ctx: CanvasRenderingContext2D,
  frame: TransitionFrame,
  viewport: TransitionViewport,
  from: TransitionLayer | undefined,
  to: TransitionLayer | undefined,
): void {
  const p = Number.isFinite(frame.eased) ? frame.eased : transitionEasing(frame.progress);
  const { width, height } = viewport;
  const rng = new SeededRandom(frame.seed ?? 0);

  switch (kind) {
    case "spatial-wipe": {
      drawLayer(ctx, from, frame, viewport, 1);
      ctx.save();
      ctx.beginPath();
      const edge = width * (p * 1.2 - 0.1);
      ctx.moveTo(0, 0);
      ctx.lineTo(edge, 0);
      ctx.lineTo(edge - height * 0.22, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.clip();
      drawLayer(ctx, to, frame, viewport, 1);
      ctx.restore();
      return;
    }
    case "graph-collapse": {
      drawLayer(ctx, from, frame, viewport, 1 - p);
      ctx.save();
      centerTransform(ctx, viewport, 0.18 + 0.82 * p, (1 - p) * 0.04);
      drawLayer(ctx, to, frame, viewport, p);
      ctx.restore();
      return;
    }
    case "particle-reassignment": {
      drawLayer(ctx, from, frame, viewport, 1);
      // A deterministic cellular mask gives the impression that existing
      // objects are being reassigned, rather than fading as a whole.
      const cols = Math.max(8, Math.floor(width / 42));
      const rows = Math.max(5, Math.floor(height / 42));
      const revealCount = Math.floor(cols * rows * p);
      const cells = Array.from({ length: cols * rows }, (_, index) => index);
      const order = rng.shuffle(cells);
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < revealCount; i += 1) {
        const cell = order[i];
        const x = (cell % cols) * (width / cols);
        const y = Math.floor(cell / cols) * (height / rows);
        ctx.rect(x, y, width / cols + 1, height / rows + 1);
      }
      ctx.clip();
      drawLayer(ctx, to, frame, viewport, 1);
      ctx.restore();
      return;
    }
    case "grid-reconfiguration": {
      drawLayer(ctx, from, frame, viewport, 1);
      const strips = Math.max(8, Math.floor(height / 28));
      ctx.save();
      for (let i = 0; i < strips; i += 1) {
        const y = (i / strips) * height;
        const offset = (i % 2 === 0 ? -1 : 1) * width * (1 - p);
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, y, width, height / strips + 1);
        ctx.clip();
        ctx.translate(offset, 0);
        drawLayer(ctx, to, frame, viewport, p);
        ctx.restore();
      }
      ctx.restore();
      return;
    }
    case "matrix-fold": {
      drawLayer(ctx, from, frame, viewport, 1 - p * 0.8);
      ctx.save();
      centerTransform(ctx, viewport, 0.72 + 0.28 * p, 0, (1 - p) * width * 0.12);
      ctx.transform(1, 0, Math.sin((1 - p) * Math.PI) * 0.12, 1, 0, 0);
      drawLayer(ctx, to, frame, viewport, p);
      ctx.restore();
      return;
    }
    case "camera-travel": {
      drawLayer(ctx, from, frame, viewport, 1 - p * 0.65);
      ctx.save();
      centerTransform(ctx, viewport, 0.92 + p * 0.18, 0, (1 - p) * width * 0.18, (1 - p) * height * 0.06);
      drawLayer(ctx, to, frame, viewport, p);
      ctx.restore();
      return;
    }
    case "signal-propagation": {
      drawLayer(ctx, from, frame, viewport, 1);
      ctx.save();
      ctx.beginPath();
      const radius = Math.hypot(width, height) * (0.05 + p * 0.8);
      ctx.arc(width * 0.5, height * 0.5, radius, 0, Math.PI * 2);
      ctx.clip();
      drawLayer(ctx, to, frame, viewport, 1);
      ctx.restore();
      return;
    }
    case "node-bloom": {
      drawLayer(ctx, from, frame, viewport, 1 - p);
      ctx.save();
      const centerX = width / 2;
      const centerY = height / 2;
      const maxRadius = Math.hypot(width, height) * 0.75;
      const blooms = 18;
      ctx.beginPath();
      for (let i = 0; i < blooms; i += 1) {
        const angle = (i / blooms) * Math.PI * 2 + rng.float(-0.12, 0.12);
        const distance = rng.float(0.05, 0.45) * maxRadius * p;
        const radius = maxRadius * (0.04 + 0.08 * p) * (0.6 + rng.next());
        ctx.arc(centerX + Math.cos(angle) * distance, centerY + Math.sin(angle) * distance, radius, 0, Math.PI * 2);
      }
      ctx.clip();
      drawLayer(ctx, to, frame, viewport, 1);
      ctx.restore();
      return;
    }
    case "tape-to-grid": {
      drawLayer(ctx, from, frame, viewport, 1 - p);
      const rows = Math.max(6, Math.floor(height / 36));
      ctx.save();
      for (let row = 0; row < rows; row += 1) {
        const y = row * height / rows;
        const progress = Math.max(0, Math.min(1, p * 1.2 - row / rows * 0.35));
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, y, width * progress, height / rows + 1);
        ctx.clip();
        drawLayer(ctx, to, frame, viewport, 1);
        ctx.restore();
      }
      ctx.restore();
      return;
    }
    case "object-morph":
    default: {
      drawLayer(ctx, from, frame, viewport, 1 - p);
      ctx.save();
      centerTransform(ctx, viewport, 0.97 + 0.03 * p, Math.sin(p * Math.PI) * 0.012);
      drawLayer(ctx, to, frame, viewport, p);
      ctx.restore();
      return;
    }
  }
}

export const TRANSITION_KINDS: readonly TransitionKind[] = [
  "object-morph",
  "spatial-wipe",
  "graph-collapse",
  "particle-reassignment",
  "grid-reconfiguration",
  "matrix-fold",
  "camera-travel",
  "signal-propagation",
  "node-bloom",
  "tape-to-grid",
];

export function transitionEasing(progress: number): number {
  return easeInOut(Math.max(0, Math.min(1, progress)));
}

export function transitionEaseOut(progress: number): number {
  return easeOut(Math.max(0, Math.min(1, progress)));
}
