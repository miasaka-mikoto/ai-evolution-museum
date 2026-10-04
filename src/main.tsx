import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import { EXPERIMENT_REGISTRY } from './experiments/registry';

const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
const initialExperimentId = params.get('experiment') ?? undefined;
const showLogin = params.get('login') !== '0' && params.get('presentation') !== '1';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App experiments={EXPERIMENT_REGISTRY} initialExperimentId={initialExperimentId} showLogin={showLogin} />
  </React.StrictMode>,
);
