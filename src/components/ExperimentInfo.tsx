import React from 'react';
import type { MuseumExperiment } from '../app/types';

export interface ExperimentParameterSpec { name: string; label?: string; min: number; max: number; step: number; value: number; }
interface Props { experiment: MuseumExperiment; metrics?: Record<string, unknown>; parameters?: ExperimentParameterSpec[]; running?: boolean; seed?: number; onToggleRun?: () => void; onStep?: () => void; onReset?: () => void; onRandomSeed?: () => void; onSeedChange?: (seed: number) => void; onParameterChange?: (name: string, value: number) => void; onClose: () => void; }

export function ExperimentInfo({ experiment, metrics = {}, parameters = [], running = true, seed = 42, onToggleRun, onStep, onReset, onRandomSeed, onSeedChange, onParameterChange, onClose }: Props) {
  return <aside className="aem-detail-panel" aria-label="Experiment details">
    <div className="aem-panel-head"><div><span className="aem-kicker">EXPERIMENT RECORD</span><h2>{experiment.name}</h2></div><button type="button" onClick={onClose} aria-label="Close details">×</button></div>
    <dl className="aem-meta-grid"><div><dt>Scene year</dt><dd>{experiment.year}</dd></div><div><dt>Category</dt><dd>{experiment.category}</dd></div><div><dt>Duration</dt><dd>{experiment.defaultDuration}s</dd></div><div><dt>Seed</dt><dd>{String(metrics.seed ?? '—')}</dd></div></dl>
    <p className="aem-detail-description">{experiment.description}</p>
    {experiment.formula && <div className="aem-formula"><span>FORMULA</span><code>{experiment.formula}</code></div>}
    {parameters.length > 0 && <section className="aem-parameter-section"><h3>Live parameters</h3>{parameters.map(parameter => <label className="aem-parameter" key={parameter.name}><span>{parameter.label ?? parameter.name}</span><input type="range" min={parameter.min} max={parameter.max} step={parameter.step} value={parameter.value} onChange={event => onParameterChange?.(parameter.name, Number(event.target.value))} /><output>{parameter.value}</output></label>)}</section>}
    {experiment.coreIdea && <section><h3>Core idea</h3><p>{experiment.coreIdea}</p></section>}
    <section><h3>Historical context</h3><p>{experiment.historicalNote ?? experiment.historicalContext}</p>{experiment.origin && <p className="aem-origin"><strong>Origin</strong> {experiment.origin}{experiment.historicalEra ? ` · ${experiment.historicalEra}` : ''}{experiment.historicalYear && experiment.historicalYear !== experiment.year ? ` · historical anchor ${experiment.historicalYear}` : ''}</p>}</section>
    {experiment.significance && <section><h3>Significance</h3><p>{experiment.significance}</p></section>}
    {(experiment.reference || experiment.references?.length) && <section><h3>References</h3><p>{experiment.references?.join(' · ') ?? experiment.reference}</p></section>}
    <section><h3>Current state</h3><div className="aem-metrics-list">{Object.entries(metrics).slice(0, 10).map(([key, value]) => <div key={key}><span>{key}</span><strong>{typeof value === 'number' ? value.toFixed(3).replace(/\.000$/, '') : String(value)}</strong></div>)}</div></section>
    <section><h3>Visualization controls</h3><div className="aem-detail-actions"><button type="button" onClick={onToggleRun}>{running ? 'Pause' : 'Run'}</button><button type="button" onClick={onStep}>Step</button><button type="button" onClick={onReset}>Reset</button><button type="button" onClick={onRandomSeed}>Randomize</button></div><label className="aem-detail-seed">Seed<input type="number" min="0" max="4294967295" value={seed} onChange={event => onSeedChange?.(Number(event.target.value) || 0)} /></label><p>All controls operate on the live local instance; the same seed replays the same initial state.</p></section>
    <p className="aem-scope-note">{experiment.implementation ?? 'Educational reconstruction'} · deterministic local runtime.</p>
  </aside>;
}
