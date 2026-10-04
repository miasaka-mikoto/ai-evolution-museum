/**
 * Small deterministic pseudo-random number generator used by every museum
 * experiment.  It deliberately does not replace Math.random globally; each
 * experiment owns a stream and can therefore be replayed in isolation.
 */

export type RandomState = number;

/** Convert a string/number seed into a stable unsigned 32-bit integer. */
export function hashSeed(seed: string | number): number {
  if (typeof seed === "number" && Number.isFinite(seed)) {
    return Math.trunc(seed) >>> 0;
  }

  const text = String(seed);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A Mulberry32 stream with a convenient, experiment-oriented API. */
export class SeededRandom {
  private state: number;
  readonly seed: number;

  constructor(seed: string | number = Date.now()) {
    this.seed = hashSeed(seed);
    this.state = this.seed;
  }

  /** Return the next value in [0, 1). */
  next(): number {
    // Mulberry32. Math.imul keeps the operation deterministic across engines.
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  random(): number {
    return this.next();
  }

  float(min = 0, max = 1): number {
    return min + (max - min) * this.next();
  }

  int(min: number, max: number): number {
    const lo = Math.ceil(Math.min(min, max));
    const hi = Math.floor(Math.max(min, max));
    if (hi <= lo) return lo;
    return lo + Math.floor(this.next() * (hi - lo + 1));
  }

  integer(min: number, max: number): number {
    return this.int(min, max);
  }

  bool(probability = 0.5): boolean {
    return this.next() < Math.max(0, Math.min(1, probability));
  }

  sign(): -1 | 1 {
    return this.bool() ? 1 : -1;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error("Cannot pick from an empty array");
    return items[this.int(0, items.length - 1)];
  }

  /** Fisher-Yates shuffle. The input array is never mutated. */
  shuffle<T>(items: readonly T[]): T[] {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = this.int(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /** Box-Muller normal distribution (mean 0, standard deviation 1). */
  normal(mean = 0, standardDeviation = 1): number {
    let u = 0;
    let v = 0;
    while (u === 0) u = this.next();
    while (v === 0) v = this.next();
    return mean + standardDeviation * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /** Save/restore lets a replay capture a precise point in an experiment. */
  getState(): RandomState {
    return this.state >>> 0;
  }

  setState(state: RandomState): this {
    this.state = state >>> 0;
    return this;
  }

  clone(): SeededRandom {
    return new SeededRandom(this.seed).setState(this.state);
  }

  /** Create an independent stream derived from the current stream. */
  fork(label = "fork"): SeededRandom {
    return new SeededRandom(hashSeed(`${this.seed}:${this.getState()}:${label}`));
  }
}

export function createSeededRandom(seed?: string | number): SeededRandom {
  return new SeededRandom(seed);
}

/** Naming alias used by a few experiment modules. */
export const SeededRNG = SeededRandom;

export interface ReplayEvent {
  tick: number;
  type: string;
  payload?: unknown;
}

/** Minimal deterministic input/event recorder for replay and debugging. */
export class ReplayRecorder {
  readonly seed: number;
  private events: ReplayEvent[] = [];

  constructor(seed: string | number) {
    this.seed = hashSeed(seed);
  }

  record(tick: number, type: string, payload?: unknown): void {
    this.events.push({ tick, type, payload });
  }

  getEvents(): ReplayEvent[] {
    return this.events.map((event) => ({ ...event }));
  }

  clear(): void {
    this.events.length = 0;
  }

  toJSON(): string {
    return JSON.stringify({ seed: this.seed, events: this.events });
  }

  static fromJSON(serialized: string): ReplayRecorder {
    const value = JSON.parse(serialized) as { seed?: number; events?: ReplayEvent[] };
    const recorder = new ReplayRecorder(value.seed ?? 0);
    recorder.events = Array.isArray(value.events) ? value.events.slice() : [];
    return recorder;
  }
}

export class ReplayPlayer {
  private index = 0;
  private readonly events: ReplayEvent[];

  constructor(events: readonly ReplayEvent[]) {
    this.events = events.slice().sort((a, b) => a.tick - b.tick);
  }

  reset(): void {
    this.index = 0;
  }

  /** Consume all events scheduled up to and including this simulation tick. */
  consume(tick: number): ReplayEvent[] {
    const result: ReplayEvent[] = [];
    while (this.index < this.events.length && this.events[this.index].tick <= tick) {
      result.push(this.events[this.index]);
      this.index += 1;
    }
    return result;
  }

  get done(): boolean {
    return this.index >= this.events.length;
  }
}
