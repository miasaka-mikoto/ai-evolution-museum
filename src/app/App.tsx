import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SeededRandom, type ExperimentRuntime } from '../runtime';
import { fallbackCatalog, getInjectedCatalog, normalizeCatalog } from './catalog';
import type { MuseumExperiment, PlaybackMode, RuntimeSnapshot } from './types';
import { ExperimentCanvas } from '../components/ExperimentCanvas';
import { ExperimentControls } from '../components/ExperimentControls';
import { ExperimentInfo, type ExperimentParameterSpec } from '../components/ExperimentInfo';
import { LoginOverlay } from '../components/LoginOverlay';
import { Timeline } from '../components/Timeline';
import { DebugPanel } from '../components/DebugPanel';
import { SettingsPanel } from '../components/SettingsPanel';
import { TransitionOverlay } from '../components/TransitionOverlay';
import { ExperimentLibrary } from '../components/ExperimentLibrary';
import { themeCssVariables, themeForYear } from '../themes';
import { EvolutionDirector } from '../timeline/director';
import type { ExperimentEntry } from '../types/experiment';
import './app.css';

export interface AppProps { experiments?: MuseumExperiment[]; initialExperimentId?: string; showLogin?: boolean; }

function chooseInitial(experiments: MuseumExperiment[], id?: string) {
  return experiments.find(item => item.id === id) ?? [...experiments].sort((a, b) => a.year - b.year)[0] ?? fallbackCatalog[0];
}

export function App({ experiments, initialExperimentId, showLogin = true }: AppProps) {
  const catalog = useMemo(() => normalizeCatalog(experiments ?? getInjectedCatalog()), [experiments]);
  const [activeId, setActiveId] = useState(() => chooseInitial(catalog, initialExperimentId).id);
  const active = catalog.find(item => item.id === activeId) ?? catalog[0];
  const [seed, setSeed] = useState(42);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [timelinePeek, setTimelinePeek] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [debug, setDebug] = useState(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === '1');
  const [presentation, setPresentation] = useState(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('presentation') === '1');
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>('chronological');
  const [transitionPair, setTransitionPair] = useState<{ fromId: string; toId: string; seed: number } | null>(null);
  const [authenticated, setAuthenticated] = useState(!showLogin);
  const [quality, setQuality] = useState<'auto' | 'low' | 'medium' | 'high' | 'ultra'>('auto');
  const [reducedMotion, setReducedMotion] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const [highContrast, setHighContrast] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-contrast: more)').matches);
  const [sound, setSound] = useState(false);
  const [captureMetadata, setCaptureMetadata] = useState(false);
  const [snapshot, setSnapshot] = useState<RuntimeSnapshot>({ fps: 0, frameTime: 0, tick: 0, renderer: 'Canvas 2D', quality: 'auto', metrics: {} });
  const [runtime, setRuntime] = useState<ExperimentRuntime | null>(null);
  const directorRef = useRef<EvolutionDirector | null>(null);
  const parameterDefaults = useMemo<ExperimentParameterSpec[]>(() => {
    const byId: Record<string, ExperimentParameterSpec[]> = {
      perceptron: [{ name: 'learningRate', label: 'Learning rate', min: .01, max: 1, step: .01, value: .2 }, { name: 'noise', label: 'Dataset noise', min: 0, max: .4, step: .01, value: .08 }, { name: 'datasetSize', label: 'Dataset size', min: 20, max: 180, step: 10, value: 80 }],
      'q-learning': [{ name: 'alpha', label: 'α · learning', min: .01, max: 1, step: .01, value: .25 }, { name: 'gamma', label: 'γ · discount', min: 0, max: 1, step: .01, value: .92 }, { name: 'epsilon', label: 'ε · exploration', min: 0, max: 1, step: .01, value: .2 }],
      sarsa: [{ name: 'alpha', label: 'α · learning', min: .01, max: 1, step: .01, value: .25 }, { name: 'gamma', label: 'γ · discount', min: 0, max: 1, step: .01, value: .92 }, { name: 'epsilon', label: 'ε · exploration', min: 0, max: 1, step: .01, value: .2 }],
      'game-of-life': [{ name: 'patternIndex', label: 'Pattern (0–4)', min: 0, max: 4, step: 1, value: 1 }, { name: 'speed', label: 'Steps / second', min: 1, max: 30, step: 1, value: 8 }],
      'genetic-algorithm': [{ name: 'mutationRate', label: 'Mutation rate', min: 0, max: .4, step: .01, value: .055 }, { name: 'population', label: 'Population', min: 12, max: 120, step: 4, value: 52 }, { name: 'selectionPressure', label: 'Selection pressure', min: 2, max: 6, step: 1, value: 2 }],
      transformer: [{ name: 'head', label: 'Attention head', min: 0, max: 1, step: 1, value: 0 }, { name: 'layer', label: 'Attention layer', min: 0, max: 1, step: 1, value: 0 }, { name: 'temperature', label: 'Temperature', min: .2, max: 3, step: .1, value: 1 }],
      autoregressive: [{ name: 'temperature', label: 'Temperature', min: .1, max: 2, step: .1, value: .8 }],
      diffusion: [{ name: 'beta', label: 'Noise schedule β', min: .01, max: .2, step: .01, value: .08 }],
      'world-model': [{ name: 'observationRadius', label: 'Observation radius', min: 1, max: 3, step: 1, value: 2 }],
      backprop: [{ name: 'learningRate', label: 'Learning rate', min: .01, max: 2, step: .01, value: .3 }],
      hopfield: [{ name: 'noise', label: 'Input noise', min: 0, max: .48, step: .01, value: .2 }],
      som: [{ name: 'learningRate', label: 'Learning rate', min: .01, max: 1, step: .01, value: .35 }],
      astar: [{ name: 'wallRate', label: 'Wall density', min: 0, max: .45, step: .01, value: .2 }],
      dijkstra: [{ name: 'wallRate', label: 'Wall density', min: 0, max: .42, step: .01, value: .2 }],
    };
    return byId[active.id] ?? [];
  }, [active.id]);
  const [parameterValues, setParameterValues] = useState<Record<string, number>>({});
  const [elapsed, setElapsed] = useState(0);
  const activeRef = useRef(active);
  const captureRef = useRef<() => void>(() => undefined);
  const audioContextRef = useRef<AudioContext | null>(null);
  activeRef.current = active;
  const orderedCatalog = useMemo(() => {
    const sorted = [...catalog].sort((a, b) => a.year - b.year);
    if (playbackMode === 'classic') return sorted.filter(item => item.year < 2010);
    if (playbackMode === 'modern') return sorted.filter(item => item.year >= 2010);
    if (playbackMode === 'random') return new SeededRandom(seed).shuffle(sorted);
    return sorted;
  }, [catalog, playbackMode, seed]);

  // Keep the shared Evolution Director in the live shell. The interval below
  // owns React repaint cadence, while the director owns the active museum order.
  useEffect(() => {
    const orderRandom = new SeededRandom(seed);
    const director = new EvolutionDirector(catalog as unknown as ExperimentEntry[], () => orderRandom.next());
    director.setMode(playbackMode);
    directorRef.current = director;
    return () => { if (directorRef.current === director) directorRef.current = null; };
  }, [catalog, playbackMode, seed]);

  const playSound = useCallback((kind: 'step' | 'transition' | 'reset') => {
    if (!sound || typeof window === 'undefined') return;
    const AudioContextCtor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    let context = audioContextRef.current;
    if (!context) {
      try { context = audioContextRef.current = new AudioContextCtor(); } catch { return; }
    }
    if (context.state === 'suspended') void context.resume();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const frequency = kind === 'transition' ? 260 : kind === 'reset' ? 150 : 560;
    oscillator.type = kind === 'transition' ? 'triangle' : 'sine';
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * (kind === 'transition' ? 1.45 : .8), context.currentTime + .06);
    gain.gain.setValueAtTime(.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.018, context.currentTime + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + .07);
    oscillator.connect(gain); gain.connect(context.destination);
    oscillator.start(); oscillator.stop(context.currentTime + .08);
  }, [sound]);

  const changeExperiment = useCallback((id: string) => {
    if (!catalog.some(item => item.id === id)) return;
    const fromId = activeRef.current?.id;
    if (fromId && fromId !== id) {
      setTransitionPair({ fromId, toId: id, seed });
      playSound('transition');
    }
    setActiveId(id); setElapsed(0); setRunning(true); setDetailsOpen(false);
  }, [catalog, playSound, seed]);

  useEffect(() => () => {
    void audioContextRef.current?.close();
  }, []);

  // Evolution Director-lite: durations come from each experiment definition,
  // so the visual rhythm is not a fixed slideshow.
  useEffect(() => {
    if (!running || presentation === false && detailsOpen) return undefined;
    const handle = window.setInterval(() => setElapsed(value => {
      const next = value + 0.1 * speed;
      if (next >= (activeRef.current?.defaultDuration ?? 12)) {
        const ordered = orderedCatalog;
        const nextItem = directorRef.current?.nextAfter(activeRef.current?.id ?? '') ?? (() => {
          const index = ordered.findIndex(item => item.id === activeRef.current?.id);
          return ordered[(index >= 0 ? index + 1 : 0) % Math.max(1, ordered.length)];
        })();
        if (nextItem) window.setTimeout(() => changeExperiment(nextItem.id), 0);
        return 0;
      }
      return next;
    }), 100);
    return () => window.clearInterval(handle);
  }, [running, speed, orderedCatalog, detailsOpen, presentation, changeExperiment]);

  // Global keyboard affordances for presentation/exhibition use.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'SELECT' || target?.tagName === 'TEXTAREA') return;
      if (event.code === 'Space') { event.preventDefault(); setRunning(value => !value); }
      if (event.key === 'ArrowRight') { event.preventDefault(); const ordered = orderedCatalog; const i = ordered.findIndex(x => x.id === activeRef.current?.id); if (ordered.length) changeExperiment(ordered[(i >= 0 ? i + 1 : 0) % ordered.length].id); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); const ordered = orderedCatalog; const i = ordered.findIndex(x => x.id === activeRef.current?.id); if (ordered.length) changeExperiment(ordered[(i >= 0 ? i - 1 + ordered.length : ordered.length - 1) % ordered.length].id); }
      // Ctrl/Cmd/Alt belong to the browser and OS (find, save, bookmark, reload).
      // Shift stays a plain shortcut so Shift+R still resets.
      if (!event.ctrlKey && !event.metaKey && !event.altKey) {
        if (event.key.toLowerCase() === 'r') { event.preventDefault(); runtime?.reset(); setElapsed(0); }
        if (event.key.toLowerCase() === 'f') { event.preventDefault(); toggleFullscreen(); }
        if (event.key.toLowerCase() === 's') { event.preventDefault(); captureRef.current(); }
        if (event.key.toLowerCase() === 'd') { event.preventDefault(); setDebug(value => !value); }
      }
      if (event.key === 'Escape' && presentation) setPresentation(false);
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [orderedCatalog, changeExperiment, runtime, presentation]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      setPresentation(true);
      const request = document.documentElement.requestFullscreen?.();
      request?.catch(() => undefined);
    } else {
      document.exitFullscreen?.();
      setPresentation(false);
    }
  }, []);
  const enterPresentation = () => {
    setPresentation(true);
    const request = document.documentElement.requestFullscreen?.();
    request?.catch(() => undefined);
  };
  const randomSeed = () => setSeed(Math.floor(Math.random() * 0xffffffff));
  const scrubTimeline = (index: number) => {
    const sorted = [...catalog].sort((a, b) => a.year - b.year);
    const item = sorted[index];
    if (item) changeExperiment(item.id);
  };
  const navigate = (delta: number) => {
    const ordered = orderedCatalog.length ? orderedCatalog : catalog;
    const index = ordered.findIndex(item => item.id === active.id);
    const next = ordered[(index >= 0 ? index + delta + ordered.length : delta > 0 ? 0 : ordered.length - 1) % ordered.length];
    if (next) changeExperiment(next.id);
  };
  const step = () => { runtime?.stepOnce(); setSnapshot(current => ({ ...current, tick: current.tick + 1 })); playSound('step'); };
  const reset = () => { runtime?.reset(); setElapsed(0); setRunning(true); playSound('reset'); };
  const setParameter = (name: string, value: number) => { setParameterValues(current => ({ ...current, [`${active.id}:${name}`]: value })); runtime?.setParameter(name, value); };
  useEffect(() => {
    if (!runtime) return;
    parameterDefaults.forEach(parameter => {
      // Apply the displayed defaults on mount as well as later user changes,
      // so the detail panel always describes the live algorithm state.
      const value = parameterValues[`${active.id}:${parameter.name}`] ?? parameter.value;
      runtime.setParameter(parameter.name, value);
    });
  }, [runtime, active.id, parameterDefaults, parameterValues]);
  const capture = useCallback(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('.aem-experiment-canvas');
    if (!canvas) return;
    const base = `aem-${active.id}-${seed}`;
    const link = document.createElement('a'); link.download = `${base}.png`; link.href = canvas.toDataURL('image/png'); link.click();
    if (captureMetadata) {
      const metadata = { product: 'AI Evolution Museum', experiment: active.name, id: active.id, year: active.year, seed, capturedAt: new Date().toISOString(), metrics: snapshot.metrics, note: 'Canvas frame exported from deterministic local runtime.' };
      const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
      const metadataLink = document.createElement('a'); metadataLink.download = `${base}.json`; metadataLink.href = URL.createObjectURL(blob); metadataLink.click(); window.setTimeout(() => URL.revokeObjectURL(metadataLink.href), 1000);
    }
  }, [active, captureMetadata, seed, snapshot.metrics]);
  captureRef.current = capture;
  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (presentation) return;
    const nearBottom = event.clientY > window.innerHeight - 28;
    setTimelinePeek(current => current === nearBottom ? current : nearBottom);
  };

  if (!active) return null;
  const theme = themeForYear(active.year);
  return <main className={`aem-root ${presentation ? 'is-presentation' : ''} ${detailsOpen ? 'has-details' : ''} ${highContrast ? 'is-high-contrast' : ''}`} data-era={theme.era} style={themeCssVariables(theme) as React.CSSProperties} onPointerMove={handlePointerMove}>
    <ExperimentCanvas experiment={active} seed={seed} running={running} speed={speed} reducedMotion={reducedMotion} quality={quality} onSnapshot={setSnapshot} onRuntimeReady={setRuntime} />
    <div className="aem-vignette" aria-hidden="true" />
    {transitionPair && <TransitionOverlay fromId={transitionPair.fromId} toId={transitionPair.toId} seed={transitionPair.seed} reducedMotion={reducedMotion} onComplete={() => setTransitionPair(null)} />}
    {!presentation && <header className="aem-topbar"><div className="aem-brand"><span className="aem-brand-mark"><i /><i /><i /></span><span><b>AI EVOLUTION</b><small>MUSEUM / AEM</small></span></div><div className="aem-top-actions"><span className="aem-live"><i /> LIVE LOCAL RUNTIME</span><button type="button" onClick={() => setLibraryOpen(true)}>Library</button><button type="button" onClick={() => setDebug(value => !value)} aria-pressed={debug}>Debug</button><button type="button" onClick={() => setSettingsOpen(true)}>Settings</button><button type="button" onClick={enterPresentation}>Presentation</button></div></header>}
    {!presentation && <section className="aem-caption" aria-live="polite"><div className="aem-caption-year">{active.year}</div><div><div className="aem-caption-name">{active.name}</div><p>{active.description}</p></div><button type="button" onClick={() => setDetailsOpen(true)} aria-label={`Open details for ${active.name}`}>↗</button></section>}
    {!presentation && <ExperimentControls running={running} speed={speed} seed={seed} onToggle={() => setRunning(value => !value)} onStep={step} onReset={reset} onRandomSeed={randomSeed} onSeedChange={setSeed} onSpeedChange={setSpeed} onOpenDetails={() => setDetailsOpen(true)} onCapture={capture} />}
    {!presentation && <div className="aem-bottom-tools"><button type="button" onClick={() => navigate(-1)} aria-label="Previous experiment">←</button><button type="button" onClick={() => setTimelineOpen(value => !value)} aria-expanded={timelineOpen}>Timeline</button><span>{Math.round((elapsed / Math.max(1, active.defaultDuration)) * 100)}%</span><button type="button" onClick={() => setRunning(value => !value)}>{running ? 'Pause' : 'Play'}</button><button type="button" onClick={() => navigate(1)} aria-label="Next experiment">→</button></div>}
    {!presentation && <Timeline experiments={catalog} activeId={active.id} open={timelineOpen || timelinePeek} mode={playbackMode} onMode={setPlaybackMode} onScrub={scrubTimeline} onSelect={changeExperiment} onClose={() => { setTimelineOpen(false); setTimelinePeek(false); }} />}
    {!presentation && <ExperimentLibrary experiments={catalog} activeId={active.id} open={libraryOpen} onSelect={changeExperiment} onClose={() => setLibraryOpen(false)} />}
    {detailsOpen && !presentation && <ExperimentInfo experiment={active} metrics={{ ...snapshot.metrics, seed }} running={running} seed={seed} parameters={parameterDefaults.map(parameter => ({ ...parameter, value: parameterValues[`${active.id}:${parameter.name}`] ?? parameter.value }))} onToggleRun={() => setRunning(value => !value)} onStep={step} onReset={reset} onRandomSeed={randomSeed} onSeedChange={setSeed} onParameterChange={setParameter} onClose={() => setDetailsOpen(false)} />}
    {settingsOpen && !presentation && <SettingsPanel open={settingsOpen} quality={quality} reducedMotion={reducedMotion} highContrast={highContrast} sound={sound} captureMetadata={captureMetadata} onQuality={setQuality} onReducedMotion={setReducedMotion} onHighContrast={setHighContrast} onSound={setSound} onCaptureMetadata={setCaptureMetadata} onClose={() => setSettingsOpen(false)} />}
    {debug && !presentation && <DebugPanel snapshot={snapshot} experiment={active} seed={seed} experiments={catalog} onSelect={changeExperiment} />}
    <div className="aem-sr-status" role="status">{active.name}, {active.year}. {running ? 'Running' : 'Paused'}.</div>
    {!authenticated && !presentation && <LoginOverlay onDemoLogin={() => setAuthenticated(true)} onDismiss={() => setAuthenticated(true)} />}
  </main>;
}

export default App;
