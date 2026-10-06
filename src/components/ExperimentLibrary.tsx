import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { MuseumExperiment } from '../app/types';

interface Props {
  experiments: MuseumExperiment[];
  activeId: string;
  open: boolean;
  onSelect: (id: string) => void;
  onClose: () => void;
}

/** Searchable catalogue view kept separate from the chronological timeline. */
export function ExperimentLibrary({ experiments, activeId, open, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onCloseRef.current();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return [...experiments].sort((a, b) => a.year - b.year).filter(item => !term || [
      item.name,
      item.id,
      item.category,
      item.description,
      item.historicalEra,
      item.origin,
      ...(item.tags ?? []),
      ...(item.references ?? []),
    ].filter(Boolean).join(' ').toLowerCase().includes(term));
  }, [experiments, query]);
  if (!open) return null;
  return <aside className="aem-library-panel" aria-label="Experiment library">
    <div className="aem-panel-head"><div><span className="aem-kicker">AEM / INDEX</span><h2>Experiment Library</h2></div><button type="button" onClick={onClose} aria-label="Close experiment library">×</button></div>
    <label className="aem-library-search">Search experiments<input value={query} onChange={event => setQuery(event.target.value)} placeholder="name, era, algorithm…" /></label>
    <div className="aem-library-count">{filtered.length} / {experiments.length} executable scenes</div>
    <div className="aem-library-list">{filtered.map(item => <button type="button" key={item.id} className={item.id === activeId ? 'is-active' : ''} onClick={() => { onSelect(item.id); onClose(); }}>
      <span className="aem-library-year">{item.year}</span><span className="aem-library-copy"><strong>{item.name}</strong><small>{item.category} · {item.description}</small></span><span className="aem-library-arrow">↗</span>
    </button>)}</div>
  </aside>;
}
