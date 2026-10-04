import React, { useEffect, useRef, useState } from 'react';
import type { ExperimentInstance } from '../types/experiment';
import { ExperimentRuntime, type RuntimeExperiment } from '../runtime';
import type { MuseumExperiment, RuntimeSnapshot } from '../app/types';

export interface ExperimentCanvasProps {
  experiment: MuseumExperiment;
  seed: number;
  running: boolean;
  speed: number;
  reducedMotion?: boolean;
  quality?: 'low' | 'medium' | 'high' | 'ultra' | 'auto';
  onSnapshot?: (snapshot: RuntimeSnapshot) => void;
  onReady?: (instance: ExperimentInstance | null) => void;
  onRuntimeReady?: (runtime: ExperimentRuntime | null) => void;
}

/**
 * One canvas, one ExperimentRuntime, one mounted algorithm. The runtime owns
 * fixed steps, DPR, throttling, visibility handling and cleanup; React only
 * supplies the surrounding controls. Canonical museum experiments declare
 * render(ctx,width,height), so the compatibility marker avoids ambiguity from
 * JavaScript default parameters when ExperimentRuntime inspects arity.
 */
export function ExperimentCanvas({
  experiment, seed, running, speed, reducedMotion = false, quality = 'auto', onSnapshot, onReady, onRuntimeReady,
}: ExperimentCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runtimeRef = useRef<ExperimentRuntime | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const instance = experiment.create(seed);
    const adaptable = instance as ExperimentInstance & RuntimeExperiment & { id?: string; renderMode?: 'dimensions' };
    adaptable.id = experiment.id;
    adaptable.renderMode = 'dimensions';
    const runtime = new ExperimentRuntime({
      canvas,
      experiment: adaptable,
      seed,
      autoStart: true,
      respectReducedMotion: reducedMotion,
      callbacks: {
        onTick: frame => {
          // HUD/debug state does not need a React commit on every 60 Hz frame;
          // keep the algorithm and canvas at full rate while sampling telemetry
          // at a readable 15 Hz.
          if (frame.tick % 4 !== 0) return;
          const performance = runtime.performance.snapshot;
          const metrics = instance.getMetrics?.() ?? {};
          const countMetric = ['objects', 'nodes', 'points', 'cells', 'population', 'visits'].map(key => metrics[key]).find(value => typeof value === 'number');
          runtime.performance.setObjectCount(typeof countMetric === 'number' ? countMetric : 0);
          runtime.performance.setMemoryEstimate(typeof countMetric === 'number' ? Math.max(0, countMetric) * 64 : 0);
          onSnapshot?.({
            fps: performance.fps,
            frameTime: performance.frameTime,
            cpuLoad: performance.cpuLoad,
            tick: frame.tick,
            objectCount: typeof countMetric === 'number' ? countMetric : undefined,
            memoryEstimate: performance.memoryEstimate,
            renderer: performance.renderer,
            quality: performance.quality,
            metrics,
          });
        },
      },
    });
    runtime.performance.setQuality(quality);
    runtime.resize();
    runtime.setSpeed(speed);
    if (!running) runtime.pause();
    runtimeRef.current = runtime;
    onReady?.(instance);
    onRuntimeReady?.(runtime);
    setReady(true);
    const resize = () => runtime.resize();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : undefined;
    observer?.observe(canvas);
    const inputHandler = (event: Event) => {
      const target = event.currentTarget as HTMLCanvasElement;
      const rect = target.getBoundingClientRect();
      const pointer = event as PointerEvent;
      let payload: unknown;
      if (event.type === 'keydown') {
        // Text-oriented experiments consume a literal key; a focused canvas
        // therefore works as a tiny offline input surface without a server.
        payload = (event as KeyboardEvent).key;
      } else {
        const x = pointer.clientX - rect.left;
        const y = pointer.clientY - rect.top;
        if ((experiment.id === 'minimax' || experiment.id === 'alpha-beta') && rect.width > 0 && rect.height > 0) {
          // Both compact game boards occupy the same normalised region.
          const boardX = (x / rect.width - .13) / .38;
          const boardY = (y / rect.height - .24) / .55;
          const col = Math.floor(boardX * 3), row = Math.floor(boardY * 3);
          payload = col >= 0 && col < 3 && row >= 0 && row < 3 ? row * 3 + col : -1;
        } else {
          payload = { type: event.type, x, y, button: pointer.button, shiftKey: pointer.shiftKey, altKey: pointer.altKey };
        }
      }
      (instance as ExperimentInstance & { handleInput?: (input: unknown) => void }).handleInput?.(payload);
    };
    canvas.addEventListener('pointerdown', inputHandler);
    canvas.addEventListener('pointermove', inputHandler);
    canvas.addEventListener('keydown', inputHandler);
    return () => {
      observer?.disconnect();
      canvas.removeEventListener('pointerdown', inputHandler);
      canvas.removeEventListener('pointermove', inputHandler);
      canvas.removeEventListener('keydown', inputHandler);
      runtime.dispose();
      if (runtimeRef.current === runtime) runtimeRef.current = null;
      onReady?.(null);
      onRuntimeReady?.(null);
      setReady(false);
    };
  }, [experiment, seed, reducedMotion, onSnapshot, onReady, onRuntimeReady]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    runtime?.performance.setQuality(quality);
    runtime?.resize();
  }, [quality]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    runtime.setSpeed(speed);
    if (running) runtime.resume(); else runtime.pause();
  }, [running, speed]);

  return <canvas ref={canvasRef} tabIndex={0} className="aem-experiment-canvas" aria-label={`${experiment.name} live experiment`} data-ready={ready ? 'true' : 'false'} />;
}
