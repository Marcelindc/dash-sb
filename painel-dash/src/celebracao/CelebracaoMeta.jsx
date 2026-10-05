import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronRight, Loader2, Share2, X } from 'lucide-react';
import ChuvaDeCedulas from '../campanha/ChuvaDeCedulas';

// Comemoração de meta de faturamento batida: cartão com os mascotes (o mesmo desenho
// usado pela equipe), confete e, a partir de 120%, a chuva de cédulas da campanha.
// O backend já entrega só o que é desta pessoa (/notificacoes/celebracoes).

const MOLDE = '/celebracao/molde-meta-batida.webp';
const MOLDE_LARGURA = 907;
const MOLDE_ALTURA = 512;
// Área livre do cartão verde no molde, entre os dois mascotes (em fração da imagem).
const AREA_TEXTO = { esquerda: 0.32, largura: 0.397, topo: 0.29, altura: 0.43 };
const TEMPO_POR_META_MS = 10000;

const CORES_CONFETE = {
  meta: ['#048187', '#62ccd1', '#7c1f31', '#ffffff', '#f2c14e'],
  ouro: ['#f2c14e', '#e0a106', '#fff3c4', '#048187', '#ffffff'],
};

function prefereMenosMovimento() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}

const emPercentual = (valor) => `${Number(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

function emDinheiroCurto(valor) {
  const n = Number(valor || 0);
  if (Math.abs(n) >= 1e6) return `R$ ${(n / 1e6).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Mi`;
  if (Math.abs(n) >= 1e3) return `R$ ${(n / 1e3).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mil`;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function rotuloCiclo(ciclo) {
  const numero = String(ciclo || '').split('/')[0];
  return numero ? `C${numero.padStart(2, '0')}` : 'ciclo';
}

// Quem está sendo parabenizado, curto o bastante para caber no cartão.
function nomeComemorado(item) {
  const nome = String(item?.nome || '').trim();
  if (item?.tipo === 'CONSULTOR') {
    const partes = nome.split(/\s+/).filter(Boolean);
    if (item.propria) return partes[0] || nome;
    return partes.length > 2 ? `${partes[0]} ${partes[partes.length - 1]}` : nome;
  }
  if (item?.tipo === 'PDV') {
    const loja = nome.split('—').pop().trim();
    return loja && loja !== nome ? `Loja ${loja}` : nome;
  }
  return nome;
}

function tamanhoNome(nome) {
  const n = nome.length;
  if (n <= 10) return 5.2;
  if (n <= 16) return 4.4;
  if (n <= 22) return 3.6;
  return 3;
}

function nivel(percentual) {
  if (percentual >= 120) return 'superacao';
  if (percentual >= 110) return 'ouro';
  return 'meta';
}

// ---------- confete (canvas, sem biblioteca) ----------
function Confete({ disparo, cores }) {
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

    const pedacos = [];
    const novo = (x, y, vx, vy) => pedacos.push({
      x, y, vx, vy,
      tamanho: 6 + Math.random() * 7,
      giro: Math.random() * Math.PI,
      vgiro: (Math.random() - 0.5) * 0.3,
      balanco: Math.random() * Math.PI * 2,
      cor: cores[Math.floor(Math.random() * cores.length)],
      redondo: Math.random() < 0.3,
    });
    const quantidade = largura < 640 ? 70 : 120;
    // Dois canhões, um de cada lado, e uma chuva leve vinda do topo.
    for (let i = 0; i < quantidade; i += 1) {
      const angulo = (55 + Math.random() * 30) * (Math.PI / 180);
      const forca = 11 + Math.random() * 9;
      novo(-10, altura * 0.8, Math.cos(angulo) * forca, -Math.sin(angulo) * forca);
      novo(largura + 10, altura * 0.8, -Math.cos(angulo) * forca, -Math.sin(angulo) * forca);
    }
    for (let i = 0; i < quantidade * 0.6; i += 1) novo(Math.random() * largura, -20 - Math.random() * altura * 0.6, (Math.random() - 0.5) * 2, 2 + Math.random() * 3);

    let quadro = 0;
    const inicio = performance.now();
    const passo = (agora) => {
      ctx.clearRect(0, 0, largura, altura);
      let vivos = 0;
      for (const p of pedacos) {
        p.vy = Math.min(p.vy + 0.22, 7);
        p.vx *= 0.985;
        p.balanco += 0.08;
        p.x += p.vx + Math.sin(p.balanco) * 0.6;
        p.y += p.vy;
        p.giro += p.vgiro;
        if (p.y > altura + 30) continue;
        vivos += 1;
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
      if (vivos && agora - inicio < 8000) quadro = requestAnimationFrame(passo);
      else ctx.clearRect(0, 0, largura, altura);
    };
    quadro = requestAnimationFrame(passo);
    return () => {
      cancelAnimationFrame(quadro);
      window.removeEventListener('resize', redimensionar);
    };
  }, [disparo, cores]);
  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 h-full w-full" style={{ zIndex: 3 }} />;
}

// ---------- imagem para compartilhar (o mesmo cartão, desenhado num canvas) ----------
function carregarImagem(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function escreverAjustado(ctx, texto, x, y, larguraMax, tamanho, peso = 800) {
  let fonte = tamanho;
  do {
    ctx.font = `${peso} ${fonte}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`;
    fonte -= 1;
  } while (ctx.measureText(texto).width > larguraMax && fonte > 10);
  ctx.fillText(texto, x, y);
}

async function gerarImagem(item) {
  const molde = await carregarImagem(MOLDE);
  const escala = 1.5;
  const W = MOLDE_LARGURA * escala;
  const H = MOLDE_ALTURA * escala;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(molde, 0, 0, W, H);

  const larguraTexto = AREA_TEXTO.largura * W * 0.94;
  const cx = (AREA_TEXTO.esquerda + AREA_TEXTO.largura / 2) * W;
  const topo = AREA_TEXTO.topo * H;
  const alt = AREA_TEXTO.altura * H;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  escreverAjustado(ctx, 'PARABÉNS', cx, topo + alt * 0.2, larguraTexto, Math.round(W * 0.046));
  escreverAjustado(ctx, `${nomeComemorado(item).toUpperCase()},`, cx, topo + alt * 0.45, larguraTexto, Math.round(W * 0.05));
  escreverAjustado(ctx, 'PELA META BATIDA!', cx, topo + alt * 0.7, larguraTexto, Math.round(W * 0.046));
  escreverAjustado(ctx, `Faturamento ${rotuloCiclo(item.ciclo)} • ${emPercentual(item.percentual)} da meta`, cx, topo + alt * 0.9, larguraTexto, Math.round(W * 0.02), 600);

  ctx.fillStyle = '#048187';
  escreverAjustado(ctx, 'Grupo SB Monteiro • DASH Comercial', W / 2, H - H * 0.07, W * 0.6, Math.round(W * 0.017), 700);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

// Celular/tablet: menu de compartilhar do aparelho (WhatsApp já com a imagem). No computador
// o Windows também tem esse menu, mas ele não leva ao WhatsApp Web: lá usamos o wa.me.
function podeCompartilharArquivoNoCelular() {
  try {
    const toque = window.matchMedia('(pointer: coarse)').matches;
    return toque && Boolean(navigator.canShare?.({ files: [new File([''], 'teste.png', { type: 'image/png' })] }));
  } catch {
    return false;
  }
}

function mensagemWhatsApp(item) {
  return `🎉 Parabéns, ${nomeComemorado(item)}! Meta de faturamento do ${rotuloCiclo(item.ciclo)} batida: ${emPercentual(item.percentual)} da meta (${emDinheiroCurto(item.realizado)} de ${emDinheiroCurto(item.meta)}).`;
}

// ---------- tela ----------
export default function CelebracaoMeta({ itens = [], aoFechar }) {
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [compartilhando, setCompartilhando] = useState(false);
  const [aviso, setAviso] = useState('');
  const botaoFechar = useRef(null);
  const total = itens.length;
  const item = itens[Math.min(indice, total - 1)];
  const nivelAtual = nivel(Number(item?.percentual || 0));
  const ultimo = indice >= total - 1;

  const fechar = useCallback(() => aoFechar?.(itens.map((i) => i.id)), [aoFechar, itens]);
  const avancar = useCallback(() => {
    setAviso('');
    if (ultimo) fechar();
    else setIndice((i) => i + 1);
  }, [ultimo, fechar]);

  useEffect(() => { botaoFechar.current?.focus(); }, []);

  useEffect(() => {
    if (pausado || prefereMenosMovimento()) return undefined;
    const timer = setTimeout(avancar, TEMPO_POR_META_MS);
    return () => clearTimeout(timer);
  }, [indice, pausado, avancar]);

  useEffect(() => {
    const aoTecla = (evento) => {
      if (evento.key === 'Escape') fechar();
      if (evento.key === 'ArrowRight') avancar();
    };
    window.addEventListener('keydown', aoTecla);
    return () => window.removeEventListener('keydown', aoTecla);
  }, [fechar, avancar]);

  const compartilhar = async () => {
    if (!item) return;
    setPausado(true);
    setAviso('');
    const texto = mensagemWhatsApp(item);
    const compartilhaArquivo = podeCompartilharArquivoNoCelular();
    // Computador: a aba do WhatsApp abre já no clique (senão o navegador a bloqueia) e a
    // imagem é gerada e baixada logo em seguida.
    if (!compartilhaArquivo) window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
    setCompartilhando(true);
    try {
      const blob = await gerarImagem(item);
      if (compartilhaArquivo) {
        // Celular: abre o menu de compartilhar do aparelho já com a imagem.
        await navigator.share({ files: [new File([blob], 'meta-batida.png', { type: 'image/png' })], text: texto });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'meta-batida.png';
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 3000);
        setAviso('A imagem foi baixada: anexe-a na conversa do WhatsApp.');
      }
    } catch (erro) {
      if (erro?.name !== 'AbortError') setAviso('Não foi possível gerar a imagem. Tente de novo.');
    } finally {
      setCompartilhando(false);
    }
  };

  if (!item) return null;
  const nome = nomeComemorado(item);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebracao-titulo"
      className="fixed inset-0 z-[150] flex items-center justify-center overflow-y-auto bg-slate-950/60 px-3 py-6 backdrop-blur-[2px]"
      onMouseDown={(e) => { if (e.target === e.currentTarget) fechar(); }}
    >
      {nivelAtual === 'superacao' && <ChuvaDeCedulas rodada={item.id} />}
      <Confete key={item.id} disparo={item.id} cores={nivelAtual === 'meta' ? CORES_CONFETE.meta : CORES_CONFETE.ouro} />

      <div
        className="relative w-full max-w-[760px]"
        style={{ zIndex: 2 }}
        onMouseEnter={() => setPausado(true)}
        onMouseLeave={() => setPausado(false)}
        onTouchStart={() => setPausado(true)}
      >
        <div className="relative overflow-hidden rounded-[28px] bg-white shadow-[0_30px_80px_-30px_rgba(1,40,44,.6)]">
          <div className="relative" style={{ containerType: 'inline-size' }}>
            <img src={MOLDE} alt="" className="block w-full select-none" draggable={false} />
            <div
              className="absolute flex flex-col items-center justify-center text-center font-extrabold uppercase leading-[1.08] text-white"
              style={{
                left: `${AREA_TEXTO.esquerda * 100}%`,
                width: `${AREA_TEXTO.largura * 100}%`,
                top: `${AREA_TEXTO.topo * 100}%`,
                height: `${AREA_TEXTO.altura * 100}%`,
              }}
            >
              <p id="celebracao-titulo" style={{ fontSize: '4.6cqw' }}>Parabéns</p>
              <p className="my-[0.6cqw] line-clamp-2 break-words" style={{ fontSize: `${tamanhoNome(nome)}cqw` }}>{nome},</p>
              <p style={{ fontSize: '4.6cqw' }}>pela meta batida!</p>
            </div>
            {nivelAtual === 'superacao' && (
              <span className="absolute left-1/2 top-[19%] -translate-x-1/2 rounded-full bg-[#f2c14e] px-3 py-1 font-extrabold uppercase tracking-wide text-[#5b3d00] shadow" style={{ fontSize: '1.9cqw' }}>
                Superação
              </span>
            )}
          </div>

          <div className="border-t border-gray-100 px-4 pb-4 pt-3 sm:px-6">
            <p className="text-center text-sm font-semibold text-gray-700">
              {item.propria ? 'Você bateu a sua meta de faturamento' : 'Meta de faturamento batida'} no {rotuloCiclo(item.ciclo)}:{' '}
              <span className="whitespace-nowrap text-[#048187]">{emPercentual(item.percentual)} da meta</span>
            </p>
            <p className="mt-0.5 text-center text-xs font-medium text-gray-400">
              <span className="whitespace-nowrap">{emDinheiroCurto(item.realizado)}</span> de <span className="whitespace-nowrap">{emDinheiroCurto(item.meta)}</span>
            </p>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={compartilhar}
                disabled={compartilhando}
                className="inline-flex items-center gap-2 rounded-xl bg-[#25d366] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1fb956] disabled:opacity-60"
              >
                {compartilhando ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />} Compartilhar no WhatsApp
              </button>
              {!ultimo && (
                <button type="button" onClick={avancar} className="inline-flex items-center gap-1.5 rounded-xl bg-[#e6f6f7] px-4 py-2.5 text-sm font-semibold text-[#048187] hover:bg-[#d7f0f1]">
                  Próxima <ChevronRight size={16} />
                </button>
              )}
              <button
                ref={botaoFechar}
                type="button"
                onClick={fechar}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#fff3f5] px-4 py-2.5 text-sm font-semibold text-[#7c1f31] hover:bg-[#fde8ec]"
              >
                <X size={16} /> {total > 1 && !ultimo ? 'Fechar todas' : 'Fechar'}
              </button>
            </div>
            {aviso && <p className="mt-2 text-center text-xs font-medium text-gray-500">{aviso}</p>}

            {total > 1 && (
              <div className="mt-3 flex items-center justify-center gap-1.5" aria-label={`Meta ${indice + 1} de ${total}`}>
                {itens.map((outro, i) => (
                  <span key={outro.id} className={`h-1.5 rounded-full transition-all ${i === indice ? 'w-6 bg-[#048187]' : 'w-1.5 bg-gray-200'}`} />
                ))}
                <span className="ml-2 text-[11px] font-semibold text-gray-400">{indice + 1} de {total}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
