/**
 * Autoplay spacing for classic scenes whose `step()` is one discrete
 * algorithm action (a tape transition, a symbol, a ply, a dialogue turn).
 *
 * The fixed 1/60 s host tick is a render clock. Calling `step()` on every
 * tick runs these scenes to completion in well under a second, so Pause and
 * Step have nothing left to show. Intervals below are simulated seconds
 * between actions, chosen so the default demonstration finishes shortly
 * before the scene's `defaultDuration` and each action stays readable.
 *
 * `ExperimentRuntime.stepOnce()` does not consult this table: one Step click
 * is always one algorithm action.
 */
export const CLASSIC_PLAYBACK_INTERVALS: Record<string, number> = {
  /** 3 transitions across the 12 s scene. */
  "turing-machine": 3.5,
  /** 9 input symbols across the 10 s scene. */
  "finite-state-machine": 1,
  /** 5 judge questions across the 12 s scene. */
  "imitation-game": 2,
  /** 9 plies across the 13 s scene. */
  minimax: 1.2,
  /** 9 plies across the 13 s scene. */
  "alpha-beta": 1.2,
  /** 42 expansions across the 14 s scene. */
  astar: 0.3,
  /** One readable exchange; the 11 s scene keeps the dialogue moving. */
  eliza: 1.5,
};

export interface PlaybackSubject {
  id?: string;
  playbackInterval?: number;
  definition?: { id?: string };
}

/** Seconds between autoplay algorithm steps. `0` means every host tick. */
export function playbackIntervalFor(experiment: PlaybackSubject | null | undefined): number {
  if (!experiment) return 0;
  const explicit = experiment.playbackInterval;
  if (typeof explicit === "number") return explicit > 0 && Number.isFinite(explicit) ? explicit : 0;
  const id = experiment.id || experiment.definition?.id || "";
  const interval = CLASSIC_PLAYBACK_INTERVALS[id] ?? 0;
  return interval > 0 && Number.isFinite(interval) ? interval : 0;
}
