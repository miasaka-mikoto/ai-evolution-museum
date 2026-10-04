import { describe, expect, it } from "vitest";
import { DebugState } from "../src/runtime/DebugState";
import { ExperimentRuntime } from "../src/runtime/ExperimentRuntime";
import { PerformanceManager } from "../src/runtime/PerformanceManager";
import { SeededRandom } from "../src/runtime/SeededRandom";
import { TransitionEngine } from "../src/transitions/TransitionEngine";
import { themeForYear } from "../src/themes";

describe("AEM runtime infrastructure", () => {
  it("replays a seeded random stream exactly", () => {
    const left = new SeededRandom(42);
    const right = new SeededRandom(42);
    expect(Array.from({ length: 8 }, () => left.next())).toEqual(Array.from({ length: 8 }, () => right.next()));
    expect(new SeededRandom(42).shuffle([1, 2, 3, 4])).toEqual(new SeededRandom(42).shuffle([1, 2, 3, 4]));
  });

  it("advances an experiment only in fixed steps", () => {
    let steps = 0;
    const runtime = new ExperimentRuntime({
      seed: 9,
      autoResize: false,
      experiment: {
        id: "test",
        step: () => { steps += 1; },
        reset: () => { steps = 0; },
      },
    });
    runtime.stepOnce();
    runtime.stepOnce();
    expect(steps).toBe(2);
    expect(runtime.runtimeState.tick).toBe(2);
    runtime.dispose();
  });

  it("selects deterministic transition languages", () => {
    const engine = new TransitionEngine();
    expect(engine.chooseKind("turing", "perceptron")).toBe(engine.chooseKind("turing", "perceptron"));
    engine.start({ duration: 0.5, seed: 1 });
    engine.update(0.25);
    expect(engine.state?.progress).toBeCloseTo(0.5);
    engine.update(0.25);
    expect(engine.isActive).toBe(false);
  });

  it("exposes stable debug text and historical palettes", () => {
    const debug = new DebugState();
    debug.update({ experimentId: "perceptron", seed: 42, fps: 60, frameTime: 16.7 });
    expect(debug.toText()).toContain("EXPERIMENT perceptron");
    expect(themeForYear(1936).era).toBe("mechanical");
    expect(themeForYear(2026).era).toBe("agent");
  });

  it("reports performance snapshots without a browser", () => {
    const manager = new PerformanceManager({ quality: "low" });
    manager.registerFrame(16.7);
    expect(manager.snapshot.quality).toBe("low");
    expect(manager.snapshot.fps).toBeGreaterThan(0);
    manager.dispose();
  });

  it("switches experiments, resizes the surface, and disposes each lifecycle once", () => {
    const context = { save() {}, restore() {}, setTransform() {}, fillRect() {} } as unknown as CanvasRenderingContext2D;
    const canvas = {
      width: 1, height: 1, clientWidth: 320, clientHeight: 180,
      getBoundingClientRect: () => ({ width: 320, height: 180 }),
      getContext: () => context,
    } as unknown as HTMLCanvasElement;
    let firstDisposed = 0, secondDisposed = 0;
    const first = { id: 'first', dispose: () => { firstDisposed += 1; }, reset() {}, step() {} };
    const second = { id: 'second', dispose: () => { secondDisposed += 1; }, reset() {}, step() {} };
    const runtime = new ExperimentRuntime({ canvas, autoResize: false, experiment: first });
    runtime.resize(640, 360);
    expect(canvas.width).toBeGreaterThanOrEqual(640);
    runtime.setExperiment(second);
    expect(firstDisposed).toBe(1);
    runtime.dispose();
    runtime.dispose();
    expect(secondDisposed).toBe(1);
  });
});
