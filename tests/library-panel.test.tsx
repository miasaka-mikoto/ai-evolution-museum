/** @vitest-environment jsdom */
// @ts-expect-error Vitest runs in Node; this package does not depend on @types/node.
import { readFileSync } from 'node:fs';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ExperimentLibrary } from '../src/components/ExperimentLibrary';
import { EXPERIMENT_REGISTRY } from '../src/experiments/registry';

// @ts-expect-error process is provided by the Vitest Node environment.
const appCss = readFileSync(`${process.cwd()}/src/app/app.css`, 'utf8');
const experiments = EXPERIMENT_REGISTRY as any;

// React 19 only flushes act() in test renderers that opt in.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function renderLibrary(open: boolean, onClose: () => void, onSelect: (id: string) => void = () => undefined) {
  const host = document.createElement('main');
  host.className = 'aem-root';
  host.style.width = '1280px';
  host.style.height = '800px';
  const topbar = document.createElement('header');
  topbar.className = 'aem-topbar';
  topbar.textContent = 'AI EVOLUTION';
  host.appendChild(topbar);
  const mountPoint = document.createElement('div');
  host.appendChild(mountPoint);
  document.body.appendChild(host);
  const root: Root = createRoot(mountPoint);
  const render = (nextOpen: boolean) => {
    act(() => {
      root.render(<ExperimentLibrary experiments={experiments} activeId="turing-machine" open={nextOpen} onSelect={onSelect} onClose={onClose} />);
    });
  };
  render(open);
  return {
    host,
    render,
    unmount() {
      act(() => root.unmount());
      host.remove();
    },
  };
}

describe('Experiment library panel (F-02)', () => {
  const mounts: Array<{ unmount: () => void }> = [];

  beforeAll(() => {
    const style = document.createElement('style');
    style.textContent = appCss;
    document.head.appendChild(style);
  });

  afterEach(() => {
    while (mounts.length) mounts.pop()?.unmount();
  });

  it('anchors the panel above the top bar and scrolls the experiment list', () => {
    const view = renderLibrary(true, () => undefined);
    mounts.push(view);
    const panel = view.host.querySelector<HTMLElement>('.aem-library-panel');
    const list = view.host.querySelector<HTMLElement>('.aem-library-list');
    const topbar = view.host.querySelector<HTMLElement>('.aem-topbar');
    const close = view.host.querySelector<HTMLElement>('[aria-label="Close experiment library"]');
    expect(panel).not.toBeNull();
    expect(list).not.toBeNull();
    expect(close).not.toBeNull();
    const panelStyle = getComputedStyle(panel!);
    const listStyle = getComputedStyle(list!);
    expect(panelStyle.position).toBe('absolute');
    expect(panelStyle.top).toBe('20px');
    expect(panelStyle.right).toBe('20px');
    expect(panelStyle.bottom).toBe('20px');
    expect(Number(panelStyle.zIndex)).toBeGreaterThan(Number(getComputedStyle(topbar!).zIndex));
    expect(panelStyle.display).toBe('flex');
    expect(panelStyle.flexDirection).toBe('column');
    // jsdom reports the overflow shorthand but leaves overflow-x/y at visible.
    expect(panelStyle.overflow).toBe('hidden');
    expect(listStyle.overflow).toBe('auto');
    expect(list!.contains(close)).toBe(false);
    expect(list!.querySelectorAll('button')).toHaveLength(30);
    expect(experiments).toHaveLength(30);
  });

  it('closes from the header button without leaving the catalogue', () => {
    let closed = 0;
    const view = renderLibrary(true, () => { closed += 1; });
    mounts.push(view);
    const close = view.host.querySelector<HTMLButtonElement>('[aria-label="Close experiment library"]');
    act(() => { close?.click(); });
    expect(closed).toBe(1);
    expect(view.host.querySelectorAll('.aem-library-list button')).toHaveLength(30);
  });

  it('closes on Escape from outside the panel and from the search field', () => {
    let closed = 0;
    const view = renderLibrary(true, () => { closed += 1; });
    mounts.push(view);
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(closed).toBe(1);
    const search = view.host.querySelector<HTMLInputElement>('.aem-library-search input');
    act(() => {
      search?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(closed).toBe(2);
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    });
    expect(closed).toBe(2);
  });

  it('does not listen for Escape while the panel is closed', () => {
    let closed = 0;
    const view = renderLibrary(false, () => { closed += 1; });
    mounts.push(view);
    expect(view.host.querySelector('.aem-library-panel')).toBeNull();
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(closed).toBe(0);
    view.render(true);
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(closed).toBe(1);
    view.render(false);
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(closed).toBe(1);
  });

  it('selects an experiment and closes the panel', () => {
    const selected: string[] = [];
    let closed = 0;
    const view = renderLibrary(true, () => { closed += 1; }, id => { selected.push(id); });
    mounts.push(view);
    const turing = [...view.host.querySelectorAll<HTMLButtonElement>('.aem-library-list button')].find(button => button.textContent?.includes('Turing Machine'));
    act(() => { turing?.click(); });
    expect(selected).toEqual(['turing-machine']);
    expect(closed).toBe(1);
  });
});
