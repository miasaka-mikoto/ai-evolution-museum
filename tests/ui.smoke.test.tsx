/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import App from '../src/app/App';
import { EXPERIMENT_REGISTRY } from '../src/experiments/registry';
import { Timeline } from '../src/components/Timeline';
import { ExperimentLibrary } from '../src/components/ExperimentLibrary';
import { LoginOverlay } from '../src/components/LoginOverlay';

describe('AEM UI smoke', () => {
  it('renders the login experience with the live experiment canvas', () => {
    const html = renderToString(<App experiments={EXPERIMENT_REGISTRY as any} showLogin />);
    expect(html).toContain('AI Evolution');
    expect(html).toContain('Sign in');
    expect(html).toContain('live experiment');
    expect(html).toContain('Timeline');
  });

  it('exposes the era anchors, searchable library and local account affordance', () => {
    const experiments = EXPERIMENT_REGISTRY as any;
    const timeline = renderToString(<Timeline experiments={experiments} activeId="turing-machine" open onSelect={() => undefined} onClose={() => undefined} />);
    const library = renderToString(<ExperimentLibrary experiments={experiments} activeId="turing-machine" open onSelect={() => undefined} onClose={() => undefined} />);
    const login = renderToString(<LoginOverlay onDemoLogin={() => undefined} onDismiss={() => undefined} />);
    expect(timeline).toContain('2026');
    expect(timeline).toContain('Auto loop');
    expect(library).toContain('Experiment Library');
    expect(library).toContain('executable scenes');
    expect(login).toContain('Create account');
  });
});
