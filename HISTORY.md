# AI Evolution Museum — historical scope

AI Evolution Museum is an executable educational reconstruction. Each scene runs a small, inspectable algorithm in the browser; it is not a claim that the original researchers used this exact code, data, visual style, or hardware. A date below is a publication or widely documented milestone for the idea, not a claim that the complete modern scene existed then.

| ID / scene | Anchor | Origin / historical source | Classification | What runs in AEM |
|---|---:|---|---|---|
| Turing Machine | 1936 | Alan Turing | historical algorithm | Binary-increment tape, head and transition table |
| Finite State Machine | 1943 | Formal automata tradition | educational reconstruction | Deterministic binary stream and state transitions |
| Boolean Logic Network | 1938 | Claude Shannon, switching circuits | historical algorithm | AND / OR / NOT / XOR signal propagation |
| McCulloch–Pitts Neuron | 1943 | Warren McCulloch and Walter Pitts | historical algorithm | Weighted threshold unit and spike output |
| Imitation Game | 1950 | Alan Turing | educational reconstruction | Offline judge, rule participant and human simulator |
| Minimax | 1928 | John von Neumann's minimax theorem | historical algorithm | Tic-tac-toe game tree and backed-up values |
| Alpha–Beta Pruning | 1958 / 1975 | Early game-search work; Knuth & Moore analysis | educational reconstruction | Minimax bounds, expanded nodes and pruned branches |
| Perceptron | 1958 | Frank Rosenblatt | historical algorithm | Online linear classifier on synthetic points |
| ELIZA Style Rules | 1966 | Joseph Weizenbaum | educational reconstruction | Wildcards, reflections and response templates |
| A* Pathfinding | 1968 | Hart, Nilsson and Raphael | historical algorithm | Open/closed sets with `g + h` priority |
| Dijkstra Search | 1959 | Edsger Dijkstra | historical algorithm | Uniform-cost shortest-path frontier |
| Conway's Game of Life | 1970 | John Conway / Martin Gardner | historical algorithm | Toroidal B3/S23 cellular automaton and patterns |
| Expert System | 1970s / 1984 | Knowledge-engineering production systems | educational reconstruction | Facts, rules and forward chaining |
| Hopfield Network | 1982 | John Hopfield | historical algorithm | Hebbian associative memory and energy descent |
| Backpropagation | 1986 | Rumelhart, Hinton and Williams | historical algorithm | Gradient updates solving XOR |
| Cellular Evolution | 1980s | Artificial-life research | modern simplification | Energy, movement, mutation and replication |
| Genetic Algorithm | 1975 | John Holland | historical algorithm | Fitness, tournament selection, crossover and mutation |
| Q-Learning | 1989 | Chris Watkins | historical algorithm | Off-policy tabular TD updates in a grid |
| SARSA | 1994 | Rummery and Niranjan | educational reconstruction | On-policy state-action-reward-state-action updates |
| Self-Organizing Map | 1982 | Teuvo Kohonen | historical algorithm | BMU and neighbourhood prototype learning |
| K-Means | 1960s / 1982 | Lloyd's iterative clustering formulation | educational reconstruction | Assignment and centroid-update phases |
| Decision Tree | 1986 | Quinlan and statistical learning | educational reconstruction | Greedy Gini split and growing leaves |
| Chess Search | 1950 | Claude Shannon's chess-program analysis | modern simplification | Legal mini-board moves, evaluation and alpha-beta |
| Monte Carlo Tree Search | 2006 | Coulom; Kocsis and Szepesvári | historical algorithm | Selection, expansion, rollout and backup |
| CNN Feature Extraction | 1989 | LeCun and collaborators | educational reconstruction | Convolution, ReLU, pooling and SGD head |
| 2D GAN | 2014 | Goodfellow and collaborators | modern simplification | Logistic discriminator and 2D generator updates |
| Transformer Attention | 2017 | Vaswani and collaborators | educational reconstruction | Tiny Q/K/V, positional embeddings, softmax heads |
| Autoregressive Language Model | 2003 / 2010s | Neural language-model lineage | modern simplification | Character bigram probabilities and sampling |
| Diffusion | 2015 | Sohl-Dickstein and collaborators | modern simplification | Synthetic forward noise and analytic reverse score steps |
| Agent + World Model | 2018 / 2020s | World Models and model-based RL | modern simplification | Partial observation, belief memory, planning and action |

## Per-scene context and provenance

| Scene | Short context / core idea | Significance | Reference anchor |
|---|---|---|---|
| Turing Machine | Formal symbolic computation on a tape; state + symbol writes the next symbol. | Makes computation mechanically precise. | Turing 1936 |
| Finite State Machine | A finite transition function consumes a binary stream. | Connects automata to sequential control. | Automata texts |
| Boolean Logic Network | Relay-style Boolean gates compose signals. | Bridges algebra and digital circuits. | Shannon 1938 |
| McCulloch–Pitts Neuron | Weighted binary inputs cross a threshold. | Early formal abstraction of a neuron. | McCulloch & Pitts 1943 |
| Imitation Game | A judge compares rule-based text participants. | Defines intelligence through observable dialogue. | Turing 1950 |
| Minimax | Recursive max/min backups evaluate adversarial choices. | Foundational game-search reasoning. | von Neumann 1928 |
| Alpha–Beta Pruning | Bounds skip branches that cannot change minimax. | Preserves an answer while reducing search. | Knuth & Moore 1975 |
| Perceptron | A linear boundary updates after classification error. | Early trainable neural classifier. | Rosenblatt 1958 |
| ELIZA Style Rules | Wildcards and reflections map text to templates. | Shows both power and limits of surface rules. | Weizenbaum 1966 |
| A* | `g + h` orders a shortest-path frontier. | Practical informed search. | Hart et al. 1968 |
| Dijkstra Search | The least-cost unsettled node is finalized next. | General shortest-path foundation. | Dijkstra 1959 |
| Game of Life | Local B3/S23 births and deaths create patterns. | Emergence from simple rules. | Gardner 1970 |
| Expert System | Facts trigger production rules by forward chaining. | Makes domain knowledge inspectable. | Buchanan & Shortliffe 1984 |
| Hopfield Network | Hebbian weights create low-energy attractors. | Links neural memory and energy. | Hopfield 1982 |
| Backpropagation | Chain-rule gradients update a multilayer XOR model. | Enables practical multilayer learning. | Rumelhart et al. 1986 |
| Cellular Evolution | Agents spend energy, mutate and replicate. | A transparent artificial-life simplification. | Langton 1989 |
| Genetic Algorithm | Fitness drives selection, crossover and mutation. | Population search over rugged spaces. | Holland 1975 |
| Q-Learning | The target uses the best next action value. | Canonical off-policy TD control. | Watkins 1989 |
| SARSA | The target uses the next action actually selected. | Clarifies on-policy learning. | Rummery & Niranjan 1994 |
| Self-Organizing Map | A BMU and neighbourhood prototypes move together. | Preserves topology while organizing data. | Kohonen 1982 |
| K-Means | Assign points, then replace centroids by means. | Compact unsupervised learning loop. | Lloyd 1982 |
| Decision Tree | Greedy Gini reduction grows interpretable leaves. | Makes a learned model inspectable. | Quinlan 1986 |
| Chess Search | Legal mini-chess moves feed bounded alpha-beta. | Transparent game-program reconstruction. | Shannon 1950 |
| Monte Carlo Tree Search | UCT selection, expansion, rollout and backup repeat. | Connects sampling with planning. | Kocsis & Szepesvári 2006 |
| CNN Feature Extraction | Convolution, ReLU, pooling and a small head classify strokes. | Exposes spatial inductive bias. | LeCun et al. 1989 |
| 2D GAN | A discriminator and Gaussian generator train adversarially. | Makes generative games visible without images. | Goodfellow et al. 2014 |
| Transformer Attention | Q/K/V projections produce normalized token weights. | Reframes sequence mixing around attention. | Vaswani et al. 2017 |
| Autoregressive LM | A learned character distribution samples one token at a time. | Makes generation a chain of predictions. | Bengio et al. 2003 |
| Diffusion | Synthetic noise is reversed with a mixture score. | Shows a probabilistic denoising trajectory. | Sohl-Dickstein et al. 2015 |
| Agent + World Model | Observe, remember, predict, plan and act under a mask. | Unifies representation, memory and control. | Ha & Schmidhuber 2018 |

The detail panel exposes the origin, significance, formula, references and implementation classification for every registry entry. Where a scene year is a museum grouping (for example a modernized CNN or world-model scene), its historical anchor is shown separately rather than silently rewriting history. No scene claims to reproduce AlphaGo, a production language model, or original hardware; those are explicitly labelled reconstructions.
