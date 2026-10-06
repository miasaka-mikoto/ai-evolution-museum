import { describe, expect, it } from "vitest";
import { createExperiment } from "../src/experiments/registry";
import { ExperimentRuntime } from "../src/runtime/ExperimentRuntime";
import { CLASSIC_PLAYBACK_INTERVALS, playbackIntervalFor } from "../src/runtime/playbackPace";
import type { ExperimentInstance } from "../src/types/experiment";

function simulate(runtime: ExperimentRuntime, seconds: number): void {
  const frames = Math.round(seconds * 60);
  for (let i = 0; i < frames; i += 1) runtime.advance(1 / 60);
}

function mount(id: string) {
  const experiment = createExperiment(id, 42);
  if (!experiment) throw new Error(`missing experiment ${id}`);
  const runtime = new ExperimentRuntime({
    experiment: experiment as never,
    seed: 42,
    autoResize: false,
    autoStart: false,
  });
  return { experiment, runtime, metrics: () => experiment.getMetrics() };
}

describe("classic scene playback pace", () => {
  it("schedules the scenes that used to finish in the first second", () => {
    expect(CLASSIC_PLAYBACK_INTERVALS["turing-machine"]).toBe(3.5);
    expect(CLASSIC_PLAYBACK_INTERVALS["finite-state-machine"]).toBe(1);
    expect(CLASSIC_PLAYBACK_INTERVALS["imitation-game"]).toBe(2);
    expect(CLASSIC_PLAYBACK_INTERVALS.minimax).toBe(1.2);
    expect(CLASSIC_PLAYBACK_INTERVALS["alpha-beta"]).toBe(1.2);
    expect(CLASSIC_PLAYBACK_INTERVALS.astar).toBe(0.3);
    expect(CLASSIC_PLAYBACK_INTERVALS.eliza).toBe(1.5);
    const created = createExperiment("turing-machine", 42) as ExperimentInstance & { definition?: { id?: string } };
    expect(playbackIntervalFor(created)).toBe(3.5);
    expect(playbackIntervalFor({ id: "perceptron" })).toBe(0);
    expect(playbackIntervalFor({ id: "turing-machine", playbackInterval: 0 })).toBe(0);
  });

  it("holds the Turing machine on its start state, then halts inside the scene", () => {
    const early = mount("turing-machine");
    simulate(early.runtime, 0.4);
    expect(early.metrics()).toMatchObject({ tick: 0, halted: false, state: "q0" });
    expect(early.runtime.runtimeState.tick).toBe(24);
    early.runtime.dispose();

    const boundary = mount("turing-machine");
    simulate(boundary.runtime, 3.5 - 1 / 60);
    expect(boundary.metrics().tick).toBe(0);
    boundary.runtime.advance(1 / 60);
    expect(boundary.metrics()).toMatchObject({ tick: 1, halted: false });
    boundary.runtime.dispose();

    const done = mount("turing-machine");
    simulate(done.runtime, 10.5);
    expect(done.metrics().halted).toBe(true);
    expect(String(done.metrics().tape)).toContain("1100");
    expect(done.runtime.runtimeState.time).toBeCloseTo(10.5, 5);
    done.runtime.dispose();
  });

  it("reads the finite-state machine one symbol per second", () => {
    const early = mount("finite-state-machine");
    simulate(early.runtime, 0.4);
    expect(early.metrics()).toMatchObject({ cursor: 0, tick: 0 });
    early.runtime.dispose();

    const mid = mount("finite-state-machine");
    simulate(mid.runtime, 4);
    expect(mid.metrics()).toMatchObject({ cursor: 4, tick: 4 });
    mid.runtime.dispose();

    const done = mount("finite-state-machine");
    simulate(done.runtime, 9);
    expect(done.metrics()).toMatchObject({ cursor: 9, inputLength: 9, tick: 9 });
    done.runtime.dispose();
  });

  it("spreads the imitation game, minimax, and alpha-beta across their scenes", () => {
    const imitation = mount("imitation-game");
    simulate(imitation.runtime, 0.4);
    expect(imitation.metrics()).toMatchObject({ turn: 0, complete: false });
    imitation.runtime.dispose();
    const imitationDone = mount("imitation-game");
    simulate(imitationDone.runtime, 10);
    expect(imitationDone.metrics()).toMatchObject({ turn: 5, complete: true });
    imitationDone.runtime.dispose();

    const minimax = mount("minimax");
    simulate(minimax.runtime, 0.4);
    expect(minimax.metrics()).toMatchObject({ tick: 0, winner: "playing" });
    minimax.runtime.dispose();
    const minimaxMid = mount("minimax");
    simulate(minimaxMid.runtime, 1.2);
    expect(minimaxMid.metrics().tick).toBe(1);
    expect(Number(minimaxMid.metrics().nodesExpanded)).toBeGreaterThan(1);
    expect(minimaxMid.metrics().winner).toBe("playing");
    minimaxMid.runtime.dispose();
    const minimaxDone = mount("minimax");
    simulate(minimaxDone.runtime, 10.8);
    expect(minimaxDone.metrics()).toMatchObject({ tick: 9, winner: "draw" });
    minimaxDone.runtime.dispose();

    const alpha = mount("alpha-beta");
    simulate(alpha.runtime, 0.4);
    expect(alpha.metrics()).toMatchObject({ tick: 0, winner: "playing" });
    alpha.runtime.dispose();
    const alphaMid = mount("alpha-beta");
    simulate(alphaMid.runtime, 1.2);
    expect(alphaMid.metrics().tick).toBe(1);
    expect(Number(alphaMid.metrics().expanded)).toBeGreaterThan(0);
    alphaMid.runtime.dispose();
    const alphaDone = mount("alpha-beta");
    simulate(alphaDone.runtime, 10.8);
    expect(alphaDone.metrics()).toMatchObject({ tick: 9, winner: "draw" });
    alphaDone.runtime.dispose();
  });

  it("walks A* across the grid instead of finishing in the first second", () => {
    const early = mount("astar");
    simulate(early.runtime, 1);
    expect(early.metrics().complete).toBe(false);
    expect(early.metrics().tick).toBe(3);
    expect(early.metrics().pathLength).toBe(0);
    early.runtime.dispose();

    const done = mount("astar");
    simulate(done.runtime, 12.6);
    expect(done.metrics()).toMatchObject({ complete: true, pathLength: 42, tick: 42 });
    done.runtime.dispose();
  });

  it("lets ELIZA speak a few readable turns in five seconds", () => {
    const early = mount("eliza");
    simulate(early.runtime, 0.4);
    expect(early.metrics()).toMatchObject({ tick: 0, turns: 0 });
    early.runtime.dispose();

    const later = mount("eliza");
    simulate(later.runtime, 5);
    expect(later.metrics()).toMatchObject({ tick: 3, turns: 3 });
    later.runtime.dispose();
  });

  it("still advances continuous scenes on every fixed tick", () => {
    const perceptron = mount("perceptron");
    simulate(perceptron.runtime, 0.5);
    expect(perceptron.metrics().sample).toBe(30);
    perceptron.runtime.dispose();

    const logic = mount("boolean-logic-network");
    simulate(logic.runtime, 0.5);
    expect(logic.metrics().tick).toBe(30);
    logic.runtime.dispose();

    const neuron = mount("mcculloch-pitts");
    simulate(neuron.runtime, 0.5);
    expect(neuron.metrics().tick).toBe(30);
    neuron.runtime.dispose();
  });

  it("makes Step one algorithm action and leaves the autoplay clock alone", () => {
    const machine = mount("turing-machine");
    machine.runtime.stepOnce();
    expect(machine.metrics()).toMatchObject({ tick: 1, halted: false });
    machine.runtime.stepOnce();
    machine.runtime.stepOnce();
    expect(machine.metrics()).toMatchObject({ tick: 3, halted: true });
    machine.runtime.stepOnce();
    expect(machine.metrics().tick).toBe(3);
    machine.runtime.dispose();

    const fsm = mount("finite-state-machine");
    simulate(fsm.runtime, 0.5);
    fsm.runtime.stepOnce();
    expect(fsm.metrics().cursor).toBe(1);
    simulate(fsm.runtime, 0.49);
    expect(fsm.metrics().cursor).toBe(1);
    simulate(fsm.runtime, 0.02);
    expect(fsm.metrics().cursor).toBe(2);
    fsm.runtime.dispose();

    const search = mount("astar");
    search.runtime.stepOnce();
    expect(search.metrics()).toMatchObject({ tick: 1, complete: false });
    search.runtime.dispose();

    const dialogue = mount("eliza");
    dialogue.runtime.stepOnce();
    expect(dialogue.metrics()).toMatchObject({ tick: 1, turns: 1 });
    for (let i = 0; i < 40; i += 1) dialogue.experiment.step();
    expect(dialogue.metrics().turns).toBe(41);
    expect((dialogue.experiment.getState() as { lines: unknown[] }).lines.length).toBeLessThanOrEqual(24);
    dialogue.runtime.dispose();
  });

  it("restarts the pace clock on reset and honours an explicit interval", () => {
    const fsm = mount("finite-state-machine");
    simulate(fsm.runtime, 0.8);
    fsm.runtime.reset();
    expect(fsm.metrics().cursor).toBe(0);
    simulate(fsm.runtime, 0.8);
    expect(fsm.metrics().cursor).toBe(0);
    simulate(fsm.runtime, 0.2);
    expect(fsm.metrics().cursor).toBe(1);
    fsm.runtime.dispose();

    let steps = 0;
    const runtime = new ExperimentRuntime({
      autoResize: false,
      autoStart: false,
      experiment: {
        id: "custom",
        playbackInterval: 0.5,
        step: () => { steps += 1; },
        reset: () => { steps = 0; },
      },
    });
    runtime.advance(0.49);
    expect(steps).toBe(0);
    runtime.advance(0.02);
    expect(steps).toBe(1);
    runtime.stepOnce();
    expect(steps).toBe(2);
    runtime.reset();
    expect(steps).toBe(0);
    runtime.advance(0.5);
    expect(steps).toBe(1);
    runtime.dispose();
  });
});
