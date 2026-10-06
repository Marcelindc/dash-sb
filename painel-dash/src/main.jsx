import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
);

// PWA: o service worker (public/sw.js) permite instalar o DASH no celular. Só no site publicado.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((erro) => console.warn('Service Worker não registrado:', erro));
  });
}
