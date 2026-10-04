import React from 'react';
import type { MuseumExperiment } from '../app/types';
import type { PlaybackMode } from '../app/types';

interface Props { experiments: MuseumExperiment[]; activeId: string; open: boolean; mode?: PlaybackMode; onMode?: (mode: PlaybackMode) => void; onScrub?: (index: number) => void; onSelect: (id: string) => void; onClose: () => void; }

const ERA_YEARS = [1936, 1943, 1950, 1958, 1966, 1970, 1982, 1986, 1990, 2000, 2012, 2014, 2016, 2017, 2020, 2026];

export function Timeline({ experiments, activeId, open, mode = 'chronological', onMode, onScrub, onSelect, onClose }: Props) {
  const sorted = [...experiments].sort((a, b) => a.year - b.year);
  const activeIndex = Math.max(0, sorted.findIndex(item => item.id === activeId));
  const chooseNearest = (year: number) => {
    const nearest = sorted.reduce<MuseumExperiment | undefined>((best, item) => !best || Math.abs(item.year - year) < Math.abs(best.year - year) ? item : best, undefined);
    if (nearest) onSelect(nearest.id);
  };
  return <div className={`aem-timeline ${open ? 'is-open' : ''}`} aria-label="Evolution timeline">
    <div className="aem-timeline-head"><span>EVOLUTION / 1936—2026</span><div className="aem-timeline-actions"><select aria-label="Playback order" value={mode} onChange={event => onMode?.(event.target.value as PlaybackMode)}><option value="auto">Auto loop</option><option value="chronological">Chronological</option><option value="classic">Classic only</option><option value="modern">Modern only</option><option value="random">Random museum</option></select><button type="button" onClick={onClose} aria-label="Close timeline">×</button></div></div>
    <div className="aem-era-track" aria-label="Historical era anchors">{ERA_YEARS.map(year => <button type="button" key={year} onClick={() => chooseNearest(year)} title={`Jump near ${year}`}>{year}</button>)}</div>
    <label className="aem-timeline-scrub">Scrub history <input type="range" min="0" max={Math.max(0, sorted.length - 1)} step="1" value={activeIndex} onChange={event => onScrub?.(Number(event.target.value))} aria-label="Scrub evolution history" /></label><div className="aem-timeline-track" role="list">
      {sorted.map(item => <button type="button" role="listitem" key={item.id} className={item.id === activeId ? 'is-active' : ''} style={{ '--year-position': `${((item.year - 1936) / Math.max(1, (sorted.at(-1)?.year ?? 2026) - 1936)) * 100}%` } as React.CSSProperties} onClick={() => onSelect(item.id)} title={`${item.year} · ${item.name}`}><span className="aem-timeline-dot" /><span className="aem-timeline-year">{item.year}</span><span className="aem-timeline-label">{item.name}</span></button>)}
    </div>
  </div>;
}
