import type { ExperimentCategory } from '../types/experiment';

export interface HistoricalRecord {
  id: string;
  year: number;
  era: string;
  origin: string;
  context: string;
  implementation: 'historical algorithm' | 'educational reconstruction' | 'modern simplification';
  significance: string;
  references: string[];
  category: ExperimentCategory | string;
}

// Dates describe the publication or first widely documented form, not a claim that
// the modern implementation below existed in that exact year.
export const HISTORY: HistoricalRecord[] = [
  ['turing-machine',1936,'Foundations','Alan Turing','A mathematical model of symbolic computation on an unbounded tape.','historical algorithm','Made computation a precise mechanical process.',['Turing 1936'], 'foundations'],
  ['finite-state-machine',1943,'Foundations','Warren McCulloch / Walter Pitts','Finite state transitions provide a compact model of sequential behavior.','educational reconstruction','Connects formal machines to control systems.',['Hopcroft et al.'], 'foundations'],
  ['boolean-logic-network',1938,'Foundations','Claude Shannon','Boolean algebra can be implemented by switching circuits.','historical algorithm','Established the bridge from logic to electronic computation.',['Shannon 1938'], 'foundations'],
  ['mcculloch-pitts',1943,'Neural beginnings','Warren McCulloch / Walter Pitts','A threshold unit abstracts a neuron with weighted binary inputs.','historical algorithm','A direct ancestor of artificial neural networks.',['McCulloch & Pitts 1943'], 'neural'],
  ['imitation-game',1950,'Foundations','Alan Turing','A dialogue-based test asks whether a judge can distinguish participants.','educational reconstruction','Framed machine intelligence as observable behavior.',['Turing 1950'], 'symbolic'],
  ['minimax',1928,'Search','John von Neumann','Adversarial decision making chooses a move against an optimal opponent.','historical algorithm','A core idea in game-playing programs.',['von Neumann 1928'], 'search'],
  ['alpha-beta',1958,'Search','John McCarthy and collaborators','Bounds allow minimax branches that cannot affect the result to be skipped.','educational reconstruction','Shows how reasoning can be accelerated without changing the answer.',['Knuth & Moore 1975'], 'search'],
  ['perceptron',1958,'Learning','Frank Rosenblatt','A linear threshold classifier updates weights after errors.','historical algorithm','One of the first trainable neural models.',['Rosenblatt 1958'], 'learning'],
  ['eliza',1966,'Symbolic AI','Joseph Weizenbaum','Pattern matching and templates produce an apparently conversational exchange.','educational reconstruction','Demonstrates the power and limits of surface language rules.',['Weizenbaum 1966'], 'symbolic'],
  ['astar',1968,'Search','Hart, Nilsson, Raphael','Best-first search combines path cost and a heuristic estimate.','historical algorithm','A practical bridge between exhaustive and informed search.',['Hart et al. 1968'], 'search'],
  ['dijkstra',1959,'Search','Edsger Dijkstra','Repeatedly finalizing the least-cost frontier node finds shortest paths.','historical algorithm','A foundational graph algorithm used throughout computing.',['Dijkstra 1959'], 'search'],
  ['game-of-life',1970,'Emergence','John Conway','Local birth and survival rules create complex cellular patterns.','historical algorithm','A vivid example of computation emerging from simple rules.',['Gardner 1970'], 'foundations'],
  ['expert-system',1970,'Symbolic AI','Early knowledge-engineering research','Facts and production rules infer new conclusions by forward chaining.','educational reconstruction','Made domain knowledge explicit and inspectable.',['Buchanan & Shortliffe 1984'], 'symbolic'],
  ['hopfield',1982,'Neural memory','John Hopfield','A recurrent binary network settles toward low-energy attractor states.','historical algorithm','Connected neural computation with associative memory and energy.',['Hopfield 1982'], 'neural'],
  ['backprop',1986,'Neural learning','Rumelhart, Hinton, Williams','Gradients propagate through layers to reduce a differentiable loss.','historical algorithm','Enabled practical multi-layer neural networks.',['Rumelhart et al. 1986'], 'neural'],
  ['cellular-evolution',1960,'Artificial life','Artificial-life research','Simple agents consume energy, move, mutate, and reproduce in an environment.','modern simplification','Makes selection pressure visible without claiming a historical single algorithm.',['Langton 1989'], 'evolution'],
  ['genetic-algorithm',1975,'Evolutionary computation','John Holland','Populations improve through selection, crossover, and mutation.','historical algorithm','A general strategy for searching rugged spaces.',['Holland 1975'], 'evolution'],
  ['q-learning',1989,'Reinforcement learning','Chris Watkins','An off-policy temporal-difference update learns action values.','historical algorithm','Allows an agent to learn from reward without a model.',['Watkins 1989'], 'learning'],
  ['sarsa',1994,'Reinforcement learning','Rummery & Niranjan','An on-policy temporal-difference update follows the behavior policy.','educational reconstruction','Highlights the difference between learning about and following a policy.',['Rummery & Niranjan 1994'], 'learning'],
  ['som',1982,'Unsupervised learning','Teuvo Kohonen','A neighborhood of prototype vectors moves toward each input.','historical algorithm','Preserves topology while organizing high-dimensional observations.',['Kohonen 1982'], 'learning'],
  ['k-means',1957,'Unsupervised learning','Stuart Lloyd / Hugo Steinhaus','Alternating assignment and centroid updates minimize within-cluster variance.','educational reconstruction','A compact example of iterative unsupervised learning.',['Lloyd 1982'], 'learning'],
  ['decision-tree',1986,'Machine learning','Quinlan and statistical learning research','Recursive impurity reduction grows a tree of decision rules.','educational reconstruction','Makes a learned model directly inspectable.',['Quinlan 1986'], 'learning'],
  ['chess-search',1950,'Search','Early computer chess research','A small legal-move generator evaluates positions with bounded minimax.','modern simplification','A transparent teaching model, not a competitive chess engine.',['Shannon 1950'], 'search'],
  ['mcts',2006,'Search','Coulom / Kocsis & Szepesvári','Selection, expansion, simulation, and backup estimate action value.','historical algorithm','Turns sampled experience into a search policy.',['Kocsis & Szepesvári 2006'], 'search'],
  ['cnn',1989,'Deep learning','Yann LeCun and collaborators','Shared convolution filters detect local patterns before pooling.','educational reconstruction','Shows how spatial inductive bias supports vision.',['LeCun et al. 1989'], 'neural'],
  ['gan',2014,'Generative models','Ian Goodfellow and collaborators','A generator and discriminator improve through an adversarial game.','modern simplification','Introduced a powerful way to learn sample distributions.',['Goodfellow et al. 2014'], 'generative'],
  ['transformer',2017,'Deep learning','Vaswani and collaborators','Self-attention mixes token representations using query, key, and value projections.','educational reconstruction','Reframed sequence modeling around parallel attention.',['Vaswani et al. 2017'], 'neural'],
  ['autoregressive',2010,'Language modeling','Neural language-model research','A token distribution is conditioned on the preceding context.','modern simplification','Makes generation an explicit sequence of probability choices.',['Bengio et al. 2003'], 'generative'],
  ['diffusion',2015,'Generative models','Sohl-Dickstein and collaborators','A learned reverse process removes noise added by a forward diffusion chain.','modern simplification','Provides a stable probabilistic path from noise to structure.',['Sohl-Dickstein et al. 2015'], 'generative'],
  ['world-model',2018,'Agents','World-model and model-based RL research','A partially observed agent remembers, predicts, plans, and acts.','modern simplification','Unifies perception, memory, prediction, and control in one loop.',['Ha & Schmidhuber 2018'], 'agent']
].map(([id,year,era,origin,context,implementation,significance,references,category]) => ({id,year,era,origin,context,implementation,significance,references,category} as HistoricalRecord));

export const historyById = (id: string) => HISTORY.find((record) => record.id === (id === 'backpropagation' ? 'backprop' : id));
