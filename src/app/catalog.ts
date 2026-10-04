import type { ExperimentDefinition } from '../types/experiment';
import type { MuseumExperiment } from './types';
import { historyById } from '../history/catalog';
import { EXPERIMENT_REGISTRY } from '../experiments/registry';

/**
 * The shell fallback is the same executable registry used by the production
 * entry point. An injection/SSR failure must never degrade into a decorative
 * particle background.
 */
export const fallbackCatalog: MuseumExperiment[] = EXPERIMENT_REGISTRY as unknown as MuseumExperiment[];

/** Accept the common registry shapes used by experiment contributors. */
export function normalizeCatalog(value: unknown): MuseumExperiment[] {
  if (!value) return fallbackCatalog;
  const candidate = value as { experiments?: unknown; registry?: unknown; default?: unknown };
  const raw = Array.isArray(value) ? value : candidate.experiments ?? candidate.registry ?? candidate.default;
  if (!Array.isArray(raw)) return fallbackCatalog;
  const valid = raw.filter((item): item is MuseumExperiment => {
    const e = item as Partial<ExperimentDefinition>;
    return Boolean(e && e.id && e.name && typeof e.year === 'number' && typeof e.create === 'function');
  });
  if (!valid.length) return fallbackCatalog;
  return valid.map(item => {
    const historical = historyById(item.id);
    if (!historical) return item;
    return {
      ...item,
      historicalNote: item.historicalNote ?? historical.context,
      historicalContext: item.historicalContext ?? historical.context,
      origin: item.origin ?? historical.origin,
      historicalEra: item.historicalEra ?? historical.era,
      historicalYear: item.historicalYear ?? historical.year,
      significance: item.significance ?? historical.significance,
      references: item.references ?? historical.references,
      implementation: item.implementation ?? historical.implementation,
    } as MuseumExperiment;
  });
}

/** Read an injected catalogue (useful for static builds and integration tests). */
export function getInjectedCatalog(): MuseumExperiment[] {
  if (typeof window === 'undefined') return fallbackCatalog;
  return normalizeCatalog((window as Window & { __AEM_EXPERIMENTS__?: unknown }).__AEM_EXPERIMENTS__);
}
