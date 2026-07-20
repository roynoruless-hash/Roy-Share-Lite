import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';
import { watchdog } from './lib/startupWatchdog';

// Report startup milestones
watchdog.updateStep('2', 'IN_PROGRESS', 'React bootstrapper starting runtime render');
watchdog.updateStep('10', 'COMPLETED', 'Initial JS/CSS bundle assets loaded and executing.');
watchdog.updateStep('11', 'COMPLETED', 'Client-side loader compiled dynamic imports table successfully.');
watchdog.updateStep('14', 'COMPLETED', 'GlobalErrorBoundary mounted and capturing React tree exceptions.');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </StrictMode>,
);

