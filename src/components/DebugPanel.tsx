import React from 'react';
import type { MuseumExperiment, RuntimeSnapshot } from '../app/types';

interface Props { snapshot: RuntimeSnapshot; experiment: MuseumExperiment; seed: number; experiments: MuseumExperiment[]; onSelect: (id: string) => void; }
export function DebugPanel({ snapshot, experiment, seed, experiments, onSelect }: Props) {
  return <aside className="aem-debug-panel" aria-label="Debug panel"><div className="aem-debug-title">DEBUG / RUNTIME</div><div className="aem-debug-grid"><span>FPS</span><b>{snapshot.fps.toFixed(1)}</b><span>FRAME</span><b>{snapshot.frameTime.toFixed(2)} ms</b><span>CPU APPROX.</span><b>{snapshot.cpuLoad === undefined ? '—' : `${(snapshot.cpuLoad * 100).toFixed(0)}%`}</b><span>MEMORY</span><b>{snapshot.memoryEstimate === undefined ? '—' : `${Math.round(snapshot.memoryEstimate / 1024)} KB`}</b><span>EXPERIMENT</span><b>{experiment.id}</b><span>SEED</span><b>{seed}</b><span>TICK</span><b>{snapshot.tick}</b><span>OBJECTS</span><b>{snapshot.objectCount ?? '—'}</b><span>QUALITY</span><b>{snapshot.quality}</b><span>RENDERER</span><b>{snapshot.renderer}</b></div><label>Jump to experiment<select value={experiment.id} onChange={e => onSelect(e.target.value)}>{experiments.map(item => <option key={item.id} value={item.id}>{item.year} · {item.name}</option>)}</select></label></aside>;
}
