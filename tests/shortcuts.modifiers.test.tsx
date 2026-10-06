/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../src/app/App';
import type { MuseumExperiment } from '../src/app/types';

function stubExperiment(id: string, year: number, reset: (...args: unknown[]) => void): MuseumExperiment {
  return {
    id,
    name: id,
    year,
    category: 'foundations',
    description: 'Shortcut fixture',
    defaultDuration: 12,
    supportsInteraction: false,
    create: () => ({
      reset,
      step() {},
      render() {},
      getMetrics: () => ({}),
    }),
  };
}

function press(key: string, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  let prevented = false;
  act(() => {
    prevented = !document.body.dispatchEvent(event);
  });
  return prevented;
}

describe('single-letter shortcuts leave modifier chords to the browser', () => {
  let root: Root;
  let host: HTMLDivElement;
  let resets: number;
  let downloads: string[];
  let fullscreenRequests: number;
  const originalAnchorClick = HTMLAnchorElement.prototype.click;
  const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
  const originalRequestFullscreen = document.documentElement.requestFullscreen;

  beforeEach(async () => {
    resets = 0;
    downloads = [];
    fullscreenRequests = 0;
    HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,AAAA';
    HTMLAnchorElement.prototype.click = function click(this: HTMLAnchorElement) {
      if (this.download) downloads.push(this.download);
    };
    document.documentElement.requestFullscreen = () => {
      fullscreenRequests += 1;
      return Promise.resolve();
    };
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    const onReset = () => { resets += 1; };
    await act(async () => {
      root.render(<App experiments={[stubExperiment('alpha', 1950, onReset), stubExperiment('beta', 1960, onReset)]} showLogin={false} />);
    });
    resets = 0;
    downloads.length = 0;
    fullscreenRequests = 0;
  });

  afterEach(async () => {
    HTMLAnchorElement.prototype.click = originalAnchorClick;
    HTMLCanvasElement.prototype.toDataURL = originalToDataURL;
    document.documentElement.requestFullscreen = originalRequestFullscreen;
    await act(async () => { root.unmount(); });
    host.remove();
  });

  function view() {
    const rootEl = document.querySelector('.aem-root');
    return {
      presentation: rootEl?.classList.contains('is-presentation') ?? false,
      debug: document.querySelector('[aria-label="Debug panel"]') !== null,
      scene: document.querySelector('.aem-caption-name')?.textContent ?? '',
      running: document.querySelector('.aem-sr-status')?.textContent ?? '',
      downloads: [...downloads],
      fullscreenRequests,
      resets,
    };
  }

  it('does not preventDefault or run F/S/D/R while Ctrl, Meta, or Alt is held', () => {
    const before = view();
    const chords: KeyboardEventInit[] = [
      { ctrlKey: true },
      { metaKey: true },
      { altKey: true },
      { ctrlKey: true, shiftKey: true },
      { metaKey: true, altKey: true },
      { ctrlKey: true, altKey: true },
    ];
    for (const chord of chords) {
      for (const key of ['f', 'F', 's', 'S', 'd', 'D', 'r', 'R']) {
        expect(press(key, chord), `${key} ${JSON.stringify(chord)}`).toBe(false);
        expect(view()).toEqual(before);
      }
    }
  });

  it('still runs the plain single-letter shortcuts, including Shift', () => {
    expect(press('d')).toBe(true);
    expect(view().debug).toBe(true);
    expect(press('D', { shiftKey: true })).toBe(true);
    expect(view().debug).toBe(false);

    expect(press('f')).toBe(true);
    expect(view().presentation).toBe(true);
    expect(view().fullscreenRequests).toBe(1);
    expect(press('F', { shiftKey: true })).toBe(true);
    expect(view().fullscreenRequests).toBe(2);

    expect(press('s')).toBe(true);
    expect(press('S', { shiftKey: true })).toBe(true);
    expect(view().downloads).toEqual(['aem-alpha-42.png', 'aem-alpha-42.png']);

    expect(press('r')).toBe(true);
    expect(press('R', { shiftKey: true })).toBe(true);
    expect(view().resets).toBe(2);
  });

  it('keeps unmodified Space and arrow shortcuts working', () => {
    expect(view().scene).toBe('alpha');
    expect(view().running).toContain('Running');
    expect(press('ArrowRight')).toBe(true);
    expect(view().scene).toBe('beta');
    expect(press(' ', { code: 'Space' })).toBe(true);
    expect(view().running).toContain('Paused');
  });
});
