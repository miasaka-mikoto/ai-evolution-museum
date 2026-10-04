import type { ExperimentDefinition, ExperimentInstance, ExperimentFactory } from './types';

import { TuringMachineExperiment } from './turing';
import { FiniteStateMachineExperiment } from './fsm';
import { BooleanLogicNetworkExperiment } from './logic';
import { McCullochPittsExperiment } from './mcculloch';
import { ImitationGameExperiment } from './imitation';
import { MinimaxExperiment } from './minimax';
import { AlphaBetaExperiment } from './alphabeta';
import { PerceptronExperiment } from './perceptron';
import { ElizaExperiment } from './eliza';
import { AStarExperiment } from './astar';
import { DijkstraExperiment, dijkstraDefinition } from './dijkstra';
import { LifeExperiment, lifeDefinition } from './life';
import { ExpertSystemExperiment, expertSystemDefinition } from './expertSystem';
import { HopfieldExperiment, hopfieldDefinition } from './hopfield';
import { BackpropExperiment, backpropDefinition } from './backprop';
import { CellularEvolutionExperiment, cellularEvolutionDefinition } from './cellularEvolution';
import { GeneticAlgorithmExperiment, geneticAlgorithmDefinition } from './geneticAlgorithm';
import { TabularRLExperiment, qLearningDefinition, sarsaDefinition } from './tabularRL';
import { SOMExperiment, somDefinition } from './som';
import {
  KMeansExperiment, kMeansDefinition, DecisionTreeExperiment, decisionTreeDefinition,
  ChessSearchExperiment, chessSearchDefinition, MctsExperiment, mctsDefinition,
  CnnExperiment, cnnDefinition, GanExperiment, ganDefinition,
  TransformerExperiment, transformerDefinition, AutoregressiveExperiment, autoregressiveDefinition,
  DiffusionExperiment, diffusionDefinition, WorldModelExperiment, worldModelDefinition,
} from './modern';

/** The shell accepts both surface-style and context-style renderers.  This
 * adapter makes every registry instance callable through the canonical API. */
function adaptInstance(instance: any, definition: any): any {
  if (!instance.definition) instance.definition = definition;
  const originalRender = instance.render;
  if (typeof originalRender === 'function' && !instance.__aemRenderAdapted) {
    const source = Function.prototype.toString.call(originalRender);
    const objectStyle = /render\s*\(\s*\{/.test(source) || /=>\s*\{?\s*const\s*\{\s*ctx/.test(source);
    instance.render = function adaptedRender(target: any, width?: number, height?: number) {
      const surface = target && typeof target === 'object' && 'ctx' in target
        ? target
        : { ctx: target, width: width ?? target?.canvas?.width ?? 1, height: height ?? target?.canvas?.height ?? 1 };
      if (objectStyle) originalRender.call(instance, surface);
      else originalRender.call(instance, surface.ctx, surface.width, surface.height);
    };
    instance.__aemRenderAdapted = true;
  }
  return instance;
}

function make(definition: any, ctor: (seed: number) => any): any {
  const create: any = (seed = 42) => {
    const instance = ctor(seed);
    instance.setSeed?.(seed);
    instance.init?.();
    // A few compact modules initialise in their constructor; reset is still
    // idempotent and guarantees a fresh replay for every factory call.
    instance.reset?.();
    return adaptInstance(instance, definition);
  };
  return {
    ...definition,
    historicalContext: definition.historicalContext ?? definition.historicalNote ?? 'Educational reconstruction.',
    historicalNote: definition.historicalNote ?? definition.historicalContext,
    coreIdea: definition.coreIdea ?? definition.description,
    significance: definition.significance ?? 'A deterministic educational reconstruction.',
    create,
  };
}

const definitions: any[] = [
  make(new TuringMachineExperiment().definition, s => new TuringMachineExperiment(s)),
  make(new FiniteStateMachineExperiment().definition, s => new FiniteStateMachineExperiment(s)),
  make(new BooleanLogicNetworkExperiment().definition, s => new BooleanLogicNetworkExperiment(s)),
  make(new McCullochPittsExperiment().definition, s => new McCullochPittsExperiment(s)),
  make(new ImitationGameExperiment().definition, s => new ImitationGameExperiment(s)),
  make(new MinimaxExperiment().definition, s => new MinimaxExperiment(s)),
  make(new AlphaBetaExperiment().definition, s => new AlphaBetaExperiment(s)),
  make(new PerceptronExperiment().definition, s => new PerceptronExperiment(s)),
  make(new ElizaExperiment().definition, s => new ElizaExperiment(s)),
  make(new AStarExperiment().definition, s => new AStarExperiment(s)),
  make(dijkstraDefinition, s => new DijkstraExperiment(s)),
  make(lifeDefinition, s => new LifeExperiment(s)),
  make(expertSystemDefinition, s => new ExpertSystemExperiment(s)),
  make(hopfieldDefinition, s => new HopfieldExperiment(s)),
  make(backpropDefinition, s => new BackpropExperiment(s)),
  make(cellularEvolutionDefinition, s => new CellularEvolutionExperiment(s)),
  make(geneticAlgorithmDefinition, s => new GeneticAlgorithmExperiment(s)),
  make(qLearningDefinition, s => new TabularRLExperiment('q-learning', s)),
  make(sarsaDefinition, s => new TabularRLExperiment('sarsa', s)),
  make(somDefinition, s => new SOMExperiment(s)),
  make(kMeansDefinition, () => new KMeansExperiment()),
  make(decisionTreeDefinition, () => new DecisionTreeExperiment()),
  make(chessSearchDefinition, () => new ChessSearchExperiment()),
  make(mctsDefinition, () => new MctsExperiment()),
  make(cnnDefinition, () => new CnnExperiment()),
  make(ganDefinition, () => new GanExperiment()),
  make(transformerDefinition, () => new TransformerExperiment()),
  make(autoregressiveDefinition, () => new AutoregressiveExperiment()),
  make(diffusionDefinition, () => new DiffusionExperiment()),
  make(worldModelDefinition, () => new WorldModelExperiment()),
];

/** Chronological, complete catalogue (exactly the required 30 experiments). */
export const EXPERIMENT_REGISTRY = definitions;
export const experimentRegistry = EXPERIMENT_REGISTRY;
export const experiments = EXPERIMENT_REGISTRY;

export function getExperimentDefinition(id: string): ExperimentDefinition | undefined {
  return EXPERIMENT_REGISTRY.find(e => e.id === id);
}

export function createExperiment(id: string, seed = 42): ExperimentInstance | null {
  const definition = getExperimentDefinition(id);
  return definition?.create ? definition.create(seed) : null;
}

export const getExperiment = createExperiment;
export default EXPERIMENT_REGISTRY;
