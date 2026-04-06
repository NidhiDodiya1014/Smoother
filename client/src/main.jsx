import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

import App from './App.jsx';

import { AudioProvider } from './contexts/AudioContext';
import { QueueProvider } from './contexts/QueueContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { registerServiceWorker } from './utils/offlineCache';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <QueueProvider>
        <AudioProvider>
          <App />
        </AudioProvider>
      </QueueProvider>
    </ThemeProvider>
  </StrictMode>
);

// Register service worker for offline caching
registerServiceWorker();
