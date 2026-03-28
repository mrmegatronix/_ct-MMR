import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const rootElement = document.getElementById('root')!;

// Redirect logic for HashRouter: if pathname exists but no hash, redirect to hash
if (window.location.pathname !== '/' && window.location.pathname !== '/index.html' && !window.location.hash) {
  const targetHash = `#${window.location.pathname}${window.location.search}`;
  window.history.replaceState(null, '', `/${targetHash}`);
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
