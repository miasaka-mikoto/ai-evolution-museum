import React, { useEffect, useRef } from 'react';
import { hashSeed, SeededRandom } from '../runtime';
import { TransitionEngine, type TransitionFrame, type TransitionLayer } from '../transitions';

interface Props {
  fromId: string;
  toId: string;
  seed: number;
  reducedMotion?: boolean;
  onComplete?: () => void;
}

interface Viewport { width: number; height: number }

/**
 * A small compositing surface for scene changes.  The actual experiments stay
 * on their own runtime canvas; this layer lets the shared TransitionEngine
 * morph deterministic visual signatures between them without a black flash.
 */
function drawSignature(ctx: CanvasRenderingContext2D, id: string, frame: TransitionFrame, viewport: Viewport, phase: 'from' | 'to') {
  const progress = phase === 'from' ? 1 - frame.eased : frame.eased;
  const rng = new SeededRandom(hashSeed(`${id}:${frame.seed}:${phase}`));
  const family = hashSeed(id) % 4;
  const { width, height } = viewport;
  ctx.save();
  ctx.globalAlpha = 0.12 + progress * 0.34;
  ctx.strokeStyle = phase === 'from' ? 'rgba(170,185,188,.85)' : 'rgba(216,189,129,.95)';
  ctx.fillStyle = phase === 'from' ? 'rgba(170,185,188,.35)' : 'rgba(216,189,129,.42)';
  ctx.lineWidth = Math.max(1, Math.min(2.5, width / 900));

  if (family === 0) {
    // Tape / state-machine signature.
    const cells = 14;
    const cell = Math.min(width / 22, 34);
    const x0 = (width - cells * cell) / 2;
    const y = height * (0.45 + (1 - progress) * 0.08);
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + cells * cell, y); ctx.stroke();
    for (let i = 0; i < cells; i += 1) {
      const x = x0 + i * cell;
      ctx.strokeRect(x, y - cell * 0.48, cell, cell * 0.96);
      if (rng.next() > 0.45) ctx.fillRect(x + cell * 0.42, y - 2, cell * 0.16, cell * 0.16);
    }
  } else if (family === 1) {
    // Graph / search signature.
    const nodes = 12;
    const points = Array.from({ length: nodes }, (_, i) => ({
      x: width * (0.25 + 0.5 * ((i % 4) / 3)) + (rng.next() - 0.5) * width * 0.06,
      y: height * (0.26 + 0.48 * (Math.floor(i / 4) / 2)) + (rng.next() - 0.5) * height * 0.06,
    }));
    ctx.beginPath();
    for (let i = 1; i < points.length; i += 1) { ctx.moveTo(points[i - 1].x, points[i - 1].y); ctx.lineTo(points[i].x, points[i].y); }
    ctx.stroke();
    points.forEach((p, i) => { ctx.beginPath(); ctx.arc(p.x, p.y, 3 + (i % 3) * 1.5, 0, Math.PI * 2); ctx.fill(); });
  } else if (family === 2) {
    // Grid / cell signature.
    const cols = 12, rows = 7, size = Math.min(width / 18, height / 11);
    const x0 = (width - cols * size) / 2, y0 = (height - rows * size) / 2;
    for (let y = 0; y < rows; y += 1) for (let x = 0; x < cols; x += 1) {
      if (rng.next() < 0.42) ctx.fillRect(x0 + x * size, y0 + y * size, size * (0.28 + progress * 0.6), size * (0.28 + progress * 0.6));
    }
  } else {
    // Token / attention signature.
    const tokens = 9;
    const gap = Math.min(72, width / 14);
    const start = (width - (tokens - 1) * gap) / 2;
    const y = height * 0.5;
    ctx.beginPath();
    for (let i = 0; i < tokens - 1; i += 1) { ctx.moveTo(start + i * gap, y); ctx.lineTo(start + (i + 1) * gap, y); }
    ctx.stroke();
    for (let i = 0; i < tokens; i += 1) { ctx.beginPath(); ctx.arc(start + i * gap, y, 4 + progress * 5, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.restore();
}

export function TransitionOverlay({ fromId, toId, seed, reducedMotion = false, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    if (reducedMotion) {
      completeRef.current?.();
      return undefined;
    }
    const context = canvas.getContext('2d');
    if (!context) { completeRef.current?.(); return undefined; }
    const engine = new TransitionEngine();
    const kind = engine.chooseKind(fromId, toId, seed);
    const transitionSeed = hashSeed(`${seed}:${fromId}:${toId}`);
    const from: TransitionLayer = (ctx, frame, viewport) => drawSignature(ctx, fromId, frame, viewport, 'from');
    const to: TransitionLayer = (ctx, frame, viewport) => drawSignature(ctx, toId, frame, viewport, 'to');
    engine.start({ kind, duration: 0.72, seed: transitionSeed, from, to });
    let raf = 0;
    let previous = typeof performance !== 'undefined' ? performance.now() : Date.now();
    let finished = false;
    const finish = () => { if (finished) return; finished = true; completeRef.current?.(); };
    const resize = () => {
      const width = Math.max(1, Math.round(canvas.clientWidth || window.innerWidth));
      const height = Math.max(1, Math.round(canvas.clientHeight || window.innerHeight));
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      return { width, height, dpr };
    };
    let dimensions = resize();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => { dimensions = resize(); }) : undefined;
    observer?.observe(canvas);
    const frame = (now: number) => {
      const dt = Math.max(0, Math.min(0.1, (now - previous) / 1000)); previous = now;
      const state = engine.update(dt);
      const { width, height, dpr } = dimensions;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      engine.render(context, { width, height });
      if (state && !state.active) { finish(); return; }
      raf = window.requestAnimationFrame(frame);
    };
    raf = window.requestAnimationFrame(frame);
    return () => { observer?.disconnect(); window.cancelAnimationFrame(raf); engine.cancel(); };
  }, [fromId, toId, seed, reducedMotion]);

  return <canvas ref={canvasRef} className="aem-transition-canvas" aria-hidden="true" />;
}

