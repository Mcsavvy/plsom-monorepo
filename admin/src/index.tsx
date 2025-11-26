import React from 'react';
import { createRoot } from 'react-dom/client';
import './sentry.client.config';
import * as Sentry from '@sentry/react';

import App from './App';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container, {
  // Callback called when React automatically recovers from errors.
  onRecoverableError: Sentry.reactErrorHandler(),
});

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
