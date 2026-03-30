
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

window.addEventListener('error', (event) => {
  const errorDiv = document.createElement('div');
  errorDiv.style.color = 'red';
  errorDiv.style.padding = '20px';
  errorDiv.style.whiteSpace = 'pre-wrap';
  errorDiv.style.zIndex = '9999';
  errorDiv.style.position = 'absolute';
  errorDiv.style.background = 'white';
  errorDiv.innerText = `Global Error: ${event.error?.message}\n${event.error?.stack}`;
  document.body.appendChild(errorDiv);
});

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
} else {
  console.error('Failed to find the root element.');
  // Fallback UI in case root is missing (unlikely but safe)
  document.body.innerHTML = '<div style="color: red; padding: 20px;">Critical Error: Root element not found.</div>';
}
