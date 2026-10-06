// Efeitos das comemorações na tela (card de meta batida e avisos da campanha):
// a fonte dos cartões e a preferência por menos movimento. O confete fica em Confete.jsx.

export const FONTE = '"Plus Jakarta Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const FONTE_URL = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&display=swap';

// A fonte só é baixada quando há comemoração (este arquivo já é carregado sob demanda).
if (typeof document !== 'undefined' && !document.getElementById('fonte-celebracao')) {
  const link = document.createElement('link');
  link.id = 'fonte-celebracao';
  link.rel = 'stylesheet';
  link.href = FONTE_URL;
  document.head.appendChild(link);
}

export function prefereMenosMovimento() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}
