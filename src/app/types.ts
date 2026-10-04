import type { ExperimentDefinition, ExperimentInstance } from '../types/experiment';

export type ExperimentMetrics = Record<string, number | string | boolean | null>;

/** Optional metadata used by the shell without coupling experiments to UI code. */
export interface MuseumExperiment extends ExperimentDefinition {
  tags?: string[];
  origin?: string;
  historicalEra?: string;
  historicalYear?: number;
  references?: string[];
  significance?: string;
  implementation?: string;
  renderer?: 'canvas2d' | 'webgl' | 'auto';
  /** Registry factories are normally zero-argument; seed-aware factories are also supported. */
  create: (seed?: number) => ExperimentInstance;
}

export interface RuntimeSnapshot {
  fps: number;
  frameTime: number;
  cpuLoad?: number;
  tick: number;
  objectCount?: number;
  memoryEstimate?: number;
  renderer: string;
  quality: string;
  metrics: ExperimentMetrics;
}

export interface ExperimentMount {
  definition: MuseumExperiment;
  instance: ExperimentInstance;
  seed: number;
}

export type PlaybackMode = 'auto' | 'chronological' | 'random' | 'modern' | 'classic';
