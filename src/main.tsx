import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

// biome-ignore lint/style/noNonNullAssertion: #app is guaranteed present in index.html, the Vite entry point contract
ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
