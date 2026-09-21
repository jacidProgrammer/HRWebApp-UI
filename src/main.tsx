// Global styles first, so component stylesheets (imported by the app) can override them.
import '@fontsource-variable/inter';
import './styles/tokens.css';
import './styles/base.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { holdRequestsUntil } from './api/http';
import { App } from './app/App';
import { Providers } from './app/Providers';
import { config } from './config';

function bootstrap() {
  const container = document.getElementById('root');
  if (!container) throw new Error('Root element #root not found');

  if (config.authMode === 'mock') {
    // Demo mode: serve the API from a service worker (never bundled into the main chunk). The app renders
    // straight away; API requests wait until the mock API is ready.
    holdRequestsUntil(import('./mocks/browser').then(({ startMockApi }) => startMockApi()));
  }

  createRoot(container).render(
    <StrictMode>
      <Providers>
        <App />
      </Providers>
    </StrictMode>,
  );
}

bootstrap();
