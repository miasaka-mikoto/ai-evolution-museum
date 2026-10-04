import React from 'react';

interface Props {
  running: boolean;
  speed: number;
  seed: number;
  onToggle: () => void;
  onStep: () => void;
  onReset: () => void;
  onRandomSeed: () => void;
  onSeedChange: (seed: number) => void;
  onSpeedChange: (speed: number) => void;
  onOpenDetails: () => void;
  onCapture: () => void;
}

export function ExperimentControls({ running, speed, seed, onToggle, onStep, onReset, onRandomSeed, onSeedChange, onSpeedChange, onOpenDetails, onCapture }: Props) {
  return <div className="aem-controls" role="toolbar" aria-label="Experiment controls">
    <button type="button" className="aem-control-primary" onClick={onToggle} aria-label={running ? 'Pause experiment' : 'Run experiment'}>{running ? 'Ⅱ Pause' : '▶ Run'}</button>
    <button type="button" onClick={onStep} aria-label="Advance one simulation step">Step</button>
    <button type="button" onClick={onReset}>Reset</button>
    <label className="aem-range-label">Speed <input type="range" min="0.1" max="3" step="0.1" value={speed} onChange={e => onSpeedChange(Number(e.target.value))} aria-label="Simulation speed" /><output>{speed.toFixed(1)}×</output></label>
    <label className="aem-seed-label">Seed <input type="number" min="0" max="4294967295" value={seed} onChange={e => onSeedChange(Number(e.target.value) || 0)} aria-label="Experiment seed" /></label>
    <button type="button" onClick={onRandomSeed}>Random seed</button>
    <span className="aem-control-spacer" />
    <button type="button" onClick={onCapture}>Capture</button>
    <button type="button" onClick={onOpenDetails}>Details</button>
  </div>;
}

