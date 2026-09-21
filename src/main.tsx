// Global styles first, so component stylesheets (imported by the app) can override them.
import '@fontsource-variable/inter';
import './styles/tokens.css';
import './styles/base.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { Providers } from './app/Providers';
import { config } from './config';

async function bootstrap() {
  const container = document.getElementById('root');
  if (!container) throw new Error('Root element #root not found');

  if (config.authMode === 'mock') {
    // Demo mode: serve the API from a service worker. Never bundled into the main chunk.
    const { startMockApi } = await import('./mocks/browser');
    await startMockApi();
  }

  createRoot(container).render(
    <StrictMode>
      <Providers>
        <App />
      </Providers>
    </StrictMode>,
  );
}

void bootstrap();
