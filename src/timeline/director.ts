import type { ExperimentEntry } from '../types/experiment';

export type PlaybackMode = 'auto' | 'chronological' | 'random' | 'modern' | 'classic';

export interface DirectorState {
  mode: PlaybackMode;
  index: number;
  elapsed: number;
  playing: boolean;
  loop: boolean;
}

export class EvolutionDirector {
  entries: ExperimentEntry[];
  state: DirectorState = { mode: 'chronological', index: 0, elapsed: 0, playing: true, loop: true };
  private order: ExperimentEntry[];
  private rng: () => number;

  constructor(entries: ExperimentEntry[] = [], rng: () => number = Math.random) {
    this.entries = entries;
    this.order = [...entries];
    this.rng = rng;
  }

  setEntries(entries: ExperimentEntry[]) { this.entries = entries; this.order = [...entries]; this.state.index = Math.min(this.state.index, Math.max(0, entries.length - 1)); }
  setMode(mode: PlaybackMode) {
    this.state.mode = mode;
    if (mode === 'auto' || mode === 'chronological') this.order = [...this.entries].sort((a,b) => a.year - b.year);
    if (mode === 'classic') this.order = [...this.entries].filter((e) => e.year < 2010).sort((a,b) => a.year - b.year);
    if (mode === 'modern') this.order = [...this.entries].filter((e) => e.year >= 2010).sort((a,b) => a.year - b.year);
    if (mode === 'random') this.order = [...this.entries].sort(() => this.rng() - 0.5);
    this.state.index = 0; this.state.elapsed = 0;
  }
  current() { return this.order[this.state.index] ?? this.entries[0]; }
  /** Resolve the next scene in the active museum order without mutating playback state. */
  nextAfter(id: string) {
    if (!this.order.length) return undefined;
    const index = this.order.findIndex(entry => entry.id === id);
    return this.order[(index >= 0 ? index + 1 : 0) % this.order.length];
  }
  progress() { const duration = this.current()?.defaultDuration ?? 12; return Math.min(1, this.state.elapsed / duration); }
  tick(dt: number) {
    if (!this.state.playing || !this.current()) return null;
    this.state.elapsed += dt;
    if (this.state.elapsed >= (this.current().defaultDuration || 12)) {
      this.state.elapsed = 0;
      if (this.state.index + 1 < this.order.length) this.state.index += 1;
      else if (this.state.loop) this.state.index = 0;
      else this.state.playing = false;
      return this.current();
    }
    return null;
  }
  setIndex(index: number) { this.state.index = Math.max(0, Math.min(index, this.order.length - 1)); this.state.elapsed = 0; }
  next() { this.setIndex((this.state.index + 1) % Math.max(1, this.order.length)); return this.current(); }
  previous() { this.setIndex((this.state.index - 1 + this.order.length) % Math.max(1, this.order.length)); return this.current(); }
  toggle() { this.state.playing = !this.state.playing; }
  reset() { this.state.elapsed = 0; this.state.index = 0; this.state.playing = true; }
}
