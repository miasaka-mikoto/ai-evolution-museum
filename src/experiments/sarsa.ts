export { TabularRLExperiment as SARSAExperiment, sarsaDefinition } from './tabularRL';
export { TabularRLExperiment as default } from './tabularRL';
export function createSARSA(seed = 42) { return new (requirelessSARSA())('sarsa', seed); }
import { TabularRLExperiment } from './tabularRL';
function requirelessSARSA() { return TabularRLExperiment; }
