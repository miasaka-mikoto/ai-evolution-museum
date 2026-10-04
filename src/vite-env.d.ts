/// <reference types="vite/client" />

declare module '*.css';

interface Window {
  /** Optional runtime-injected catalogue used by embedders and tests. */
  __AEM_EXPERIMENTS__?: unknown;
}

