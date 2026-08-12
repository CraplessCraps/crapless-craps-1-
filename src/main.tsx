import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined' && window.screen && window.screen.orientation) {
  const orientation = window.screen.orientation as unknown as { lock?: (orient: string) => Promise<void> };
  if (typeof orientation.lock === 'function') {
    orientation.lock('portrait').catch(() => {
      // Ignore orientation lock errors on web browsers that don't support locking
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

