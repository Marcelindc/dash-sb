import { useEffect, useRef } from 'react';
import { prefereMenosMovimento } from './efeitos';

// ---------- confete (canvas, sem biblioteca): rajada inicial e depois chuva até fechar ----------
export default function Confete({ disparo, cores }) {
  const ref = useRef(null);
  useEffect(() => {
    if (prefereMenosMovimento()) return undefined;
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return undefined;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let largura = 0;
    let altura = 0;
    const redimensionar = () => {
      largura = window.innerWidth;
      altura = window.innerHeight;
      canvas.width = largura * dpr;
      canvas.height = altura * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    redimensionar();
    window.addEventListener('resize', redimensionar);

    let pedacos = [];
    const novo = (x, y, vx, vy, limite = 7) => pedacos.push({
      x, y, vx, vy, limite,
      tamanho: 6 + Math.random() * 7,
      giro: Math.random() * Math.PI,
      vgiro: (Math.random() - 0.5) * 0.3,
      balanco: Math.random() * Math.PI * 2,
      cor: cores[Math.floor(Math.random() * cores.length)],
      redondo: Math.random() < 0.3,
    });
    const celular = largura < 640;
    const quantidade = celular ? 70 : 120;
    // Depois da rajada, a chuva fica com no máximo esta quantidade de pedaços na tela.
    const chuva = celular ? 40 : 70;
    // Dois canhões, um de cada lado, e uma chuva leve vinda do topo.
    for (let i = 0; i < quantidade; i += 1) {
      const angulo = (55 + Math.random() * 30) * (Math.PI / 180);
      const forca = 11 + Math.random() * 9;
      novo(-10, altura * 0.8, Math.cos(angulo) * forca, -Math.sin(angulo) * forca);
      novo(largura + 10, altura * 0.8, -Math.cos(angulo) * forca, -Math.sin(angulo) * forca);
    }
    for (let i = 0; i < quantidade * 0.6; i += 1) novo(Math.random() * largura, -20 - Math.random() * altura * 0.6, (Math.random() - 0.5) * 2, 2 + Math.random() * 3);

    let quadro = 0;
    const passo = () => {
      ctx.clearRect(0, 0, largura, altura);
      pedacos = pedacos.filter((p) => p.y <= altura + 30);
      for (const p of pedacos) {
        p.vy = Math.min(p.vy + 0.22, p.limite);
        p.vx *= 0.985;
        p.balanco += 0.08;
        p.x += p.vx + Math.sin(p.balanco) * 0.6;
        p.y += p.vy;
        p.giro += p.vgiro;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.giro);
        ctx.fillStyle = p.cor;
        if (p.redondo) {
          ctx.beginPath();
          ctx.arc(0, 0, p.tamanho / 2.4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.tamanho / 2, -p.tamanho / 4, p.tamanho, (p.tamanho / 2) * Math.abs(Math.cos(p.balanco)));
        }
        ctx.restore();
      }
      // Repõe aos poucos o que saiu por baixo, para a chuva nunca parar.
      if (pedacos.length < chuva && Math.random() < 0.5) novo(Math.random() * largura, -20, (Math.random() - 0.5) * 2, 1.5, 2.2 + Math.random() * 1.6);
      quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => {
      cancelAnimationFrame(quadro);
      window.removeEventListener('resize', redimensionar);
    };
  }, [disparo, cores]);
  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 h-full w-full" style={{ zIndex: 3 }} />;
}
