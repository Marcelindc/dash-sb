import { useMemo, useState } from 'react';

// Chuva de cédulas da campanha (bônus de R$ 50 mil): ~10 s de notas caindo do alto, entrando
// pelos lados em arco e descendo dos cantos, cada uma balançando como papel.
// As posições saem de um gerador com semente: a mesma rodada sempre desenha a mesma chuva.

const DURACAO_CHUVA_MS = 10000;
const CEDULA = '/campanha-incentivo-2026/web/cedula-100-gm.webp';

const ESTILO = `
  .chuva-cedulas { position: fixed; inset: 0; z-index: 70; pointer-events: none; overflow: hidden; perspective: 900px; }
  .chuva-cedulas .cc-trajeto {
    position: absolute; left: 0; top: 0; opacity: 0; will-change: transform, opacity;
    animation-name: ccTrajeto; animation-timing-function: linear; animation-fill-mode: both;
  }
  @keyframes ccTrajeto {
    0% { opacity: 0; transform: translate3d(var(--x0), var(--y0), 0) rotate(var(--r0)); }
    7% { opacity: 1; }
    50% { transform: translate3d(var(--xm), var(--ym), 0) rotate(var(--rm)); }
    88% { opacity: 1; }
    100% { opacity: 0; transform: translate3d(var(--x1), var(--y1), 0) rotate(var(--r1)); }
  }
  .chuva-cedulas .cc-balanco { animation: ccBalanco var(--balanco) ease-in-out infinite alternate; transform-style: preserve-3d; }
  @keyframes ccBalanco {
    0% { transform: rotateX(0deg) rotateY(0deg); }
    35% { transform: rotateX(50deg) rotateY(-24deg); }
    70% { transform: rotateX(-20deg) rotateY(40deg); }
    100% { transform: rotateX(32deg) rotateY(-32deg); }
  }
  .chuva-cedulas img {
    display: block; height: auto; border-radius: 3px; user-select: none;
    box-shadow: 0 10px 22px -10px rgba(2, 40, 44, .55);
  }
`;

// Gerador pseudoaleatório com semente (mulberry32).
function gerador(semente) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function montarCedulas(semente, total) {
  const sorte = gerador(semente);
  const entre = (min, max) => min + (max - min) * sorte();
  const segundos = DURACAO_CHUVA_MS / 1000;
  const lista = [];
  for (let i = 0; i < total; i += 1) {
    const tipo = sorte();
    const duracao = entre(3.2, 5.2);
    // Abertura com uma rajada; depois as notas continuam caindo até perto dos 10 s.
    const atraso = i < total * 0.18 ? entre(0, 0.9) : entre(0.4, segundos - duracao - 0.3);
    let x0; let y0; let xm; let ym; let x1; let y1;
    if (tipo < 0.55) { // do alto
      x0 = entre(-5, 100); y0 = entre(-32, -14);
      xm = x0 + entre(-14, 14); ym = entre(35, 55);
      x1 = xm + entre(-16, 16); y1 = entre(108, 122);
    } else if (tipo < 0.72) { // da esquerda, em arco
      x0 = entre(-24, -12); y0 = entre(5, 60);
      xm = entre(15, 50); ym = y0 - entre(8, 28);
      x1 = entre(40, 98); y1 = entre(108, 122);
    } else if (tipo < 0.89) { // da direita, em arco
      x0 = entre(102, 114); y0 = entre(5, 60);
      xm = entre(50, 85); ym = y0 - entre(8, 28);
      x1 = entre(2, 60); y1 = entre(108, 122);
    } else { // dos cantos de cima, na diagonal
      const daEsquerda = sorte() < 0.5;
      x0 = daEsquerda ? entre(-22, -8) : entre(100, 112); y0 = entre(-26, -10);
      xm = daEsquerda ? entre(15, 45) : entre(55, 85); ym = entre(25, 45);
      x1 = daEsquerda ? entre(50, 102) : entre(-2, 50); y1 = entre(108, 122);
    }
    const r0 = entre(-180, 180);
    lista.push({
      id: i, duracao, atraso, x0, y0, xm, ym, x1, y1,
      r0, rm: r0 + entre(-200, 200), r1: r0 + entre(-420, 420),
      escala: entre(0.55, 1.15),
      balanco: entre(0.7, 1.6),
      faseBalanco: entre(0, 1.6),
    });
  }
  return lista;
}

export default function ChuvaDeCedulas({ rodada = 1 }) {
  const [total] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 640 ? 70 : 120));
  const cedulas = useMemo(() => montarCedulas(rodada * 7919 + 13, total), [rodada, total]);
  return (
    <div className="chuva-cedulas" aria-hidden="true">
      <style>{ESTILO}</style>
      {cedulas.map((c) => (
        <div
          key={`${rodada}-${c.id}`}
          className="cc-trajeto"
          style={{
            '--x0': `${c.x0}vw`, '--y0': `${c.y0}vh`, '--xm': `${c.xm}vw`, '--ym': `${c.ym}vh`, '--x1': `${c.x1}vw`, '--y1': `${c.y1}vh`,
            '--r0': `${c.r0}deg`, '--rm': `${c.rm}deg`, '--r1': `${c.r1}deg`,
            animationDuration: `${c.duracao}s`,
            animationDelay: `${c.atraso}s`,
          }}
        >
          <div className="cc-balanco" style={{ '--balanco': `${c.balanco}s`, animationDelay: `-${c.faseBalanco}s` }}>
            <img src={CEDULA} alt="" draggable={false} decoding="async" style={{ width: `calc(clamp(64px, 9vw, 150px) * ${c.escala.toFixed(2)})`, opacity: c.escala < 0.7 ? 0.85 : 1 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
