export { TabularRLExperiment as QLearningExperiment, qLearningDefinition } from './tabularRL';
export { TabularRLExperiment as default } from './tabularRL';
export function createQLearning(seed = 42) { return new (requirelessQLearning())('q-learning', seed); }
// Keep the factory tree-shakeable without relying on Node's require in browser builds.
import { TabularRLExperiment } from './tabularRL';
function requirelessQLearning() { return TabularRLExperiment; }
