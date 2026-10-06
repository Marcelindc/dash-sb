import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronRight, Loader2, Share2, X } from 'lucide-react';
import ChuvaDeCedulas from '../campanha/ChuvaDeCedulas';
import Confete from './Confete';
import { FONTE } from './efeitos';

// Comemoração de meta de faturamento batida: cartão com os mascotes (o mesmo desenho
// usado pela equipe), confete enquanto o cartão estiver aberto e, a partir de 120%, a
// chuva de cédulas da campanha. O backend já entrega só o que é desta pessoa e o nome de
// quem parabenizar (/notificacoes/celebracoes).

const MOLDE = '/celebracao/molde-meta-batida.webp';
const MOLDE_LARGURA = 907;
const MOLDE_ALTURA = 512;
// Área livre do cartão verde no molde, entre os dois mascotes (em fração da imagem).
const AREA_TEXTO = { esquerda: 0.32, largura: 0.397, topo: 0.29, altura: 0.43 };


const ESTILO = `
  @keyframes celebracaoSurgir {
    from { opacity: 0; transform: translateY(0.9cqw) scale(.96); }
    to { opacity: 1; transform: none; }
  }
  .celebracao-linha { animation: celebracaoSurgir .6s cubic-bezier(.4,0,.2,1) both; }
  /* No celular essa linha ficaria pequena demais para ler (o ciclo já aparece embaixo). */
  @container (max-width: 520px) { .celebracao-sobretitulo { display: none !important; } }
  @media (prefers-reduced-motion: reduce) { .celebracao-linha { animation: none; } }
`;

const CORES_CONFETE = {
  meta: ['#048187', '#62ccd1', '#7c1f31', '#ffffff', '#f2c14e'],
  ouro: ['#f2c14e', '#e0a106', '#fff3c4', '#048187', '#ffffff'],
};


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

// Quem o cartão parabeniza. O backend manda 'pessoa'; o resto é só para respostas antigas.
function nomeComemorado(item) {
  if (item?.pessoa) return item.pessoa;
  const nome = String(item?.nome || '').trim();
  if (item?.tipo === 'CONSULTOR') {
    const partes = nome.split(/\s+/).filter(Boolean);
    if (item.propria) return partes[0] || nome;
    return partes.length > 2 ? `${partes[0]} ${partes[partes.length - 1]}` : nome;
  }
  return nome.replace(/^\s*(?:\d[\d.]*|N\d+)\s*-\s*/i, '').replace(/^EQUIPE\s+/i, '').split('—').pop().trim() || nome;
}

function frasePrincipal(item) {
  const ciclo = rotuloCiclo(item.ciclo);
  if (item.propria) {
    if (item.tipo === 'CONSULTOR') return `Você bateu a sua meta de faturamento no ${ciclo}`;
    if (item.tipo === 'PDV') return `Sua loja bateu a meta de faturamento no ${ciclo}`;
    return `Sua equipe bateu a meta de faturamento no ${ciclo}`;
  }
  return `${item.grupo || item.nome} bateu a meta de faturamento no ${ciclo}`;
}

function nivel(percentual) {
  if (percentual >= 120) return 'superacao';
  if (percentual >= 110) return 'ouro';
  return 'meta';
}

// ---------- texto que encolhe para caber numa linha só (tamanho em % da largura do cartão) ----------
function LinhaAjustada({ children, maximo, className = '', style, atraso = 0 }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const caixa = el?.parentElement;
    if (!el || !caixa) return undefined;
    const ajustar = () => {
      el.style.fontSize = `${maximo}cqw`;
      const disponivel = caixa.clientWidth * 0.94;
      const largura = el.scrollWidth;
      if (largura > disponivel && largura > 0) el.style.fontSize = `${Math.max(maximo * 0.35, (maximo * disponivel) / largura)}cqw`;
    };
    ajustar();
    const observador = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(ajustar) : null;
    observador?.observe(caixa);
    document.fonts?.addEventListener?.('loadingdone', ajustar);
    document.fonts?.ready?.then(ajustar).catch(() => {});
    return () => {
      observador?.disconnect();
      document.fonts?.removeEventListener?.('loadingdone', ajustar);
    };
  }, [children, maximo]);
  return (
    <span
      ref={ref}
      className={`celebracao-linha inline-block whitespace-nowrap ${className}`}
      style={{ fontSize: `${maximo}cqw`, animationDelay: `${atraso}s`, ...style }}
    >
      {children}
    </span>
  );
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
    ctx.font = `${peso} ${fonte}px ${FONTE}`;
    fonte -= 1;
  } while (ctx.measureText(texto).width > larguraMax && fonte > 10);
  ctx.fillText(texto, x, y);
}

async function gerarImagem(item) {
  try {
    await Promise.all(['600', '700', '800'].map((peso) => document.fonts.load(`${peso} 40px "Plus Jakarta Sans"`)));
  } catch {
    // Sem a fonte, o canvas usa a do sistema.
  }
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

  const larguraTexto = AREA_TEXTO.largura * W * 0.92;
  const cx = (AREA_TEXTO.esquerda + AREA_TEXTO.largura / 2) * W;
  const topo = AREA_TEXTO.topo * H;
  const alt = AREA_TEXTO.altura * H;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 40, 44, 0.28)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 3;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '3px';
  ctx.globalAlpha = 0.88;
  escreverAjustado(ctx, `META DE FATURAMENTO • ${rotuloCiclo(item.ciclo)} • ${emPercentual(item.percentual)}`, cx, topo + alt * 0.1, larguraTexto, Math.round(W * 0.016), 700);
  ctx.globalAlpha = 1;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  escreverAjustado(ctx, 'Parabéns,', cx, topo + alt * 0.33, larguraTexto, Math.round(W * 0.04), 700);
  escreverAjustado(ctx, nomeComemorado(item), cx, topo + alt * 0.58, larguraTexto, Math.round(W * 0.068), 800);
  escreverAjustado(ctx, 'pela meta batida!', cx, topo + alt * 0.83, larguraTexto, Math.round(W * 0.04), 700);

  ctx.shadowColor = 'transparent';
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
  const valores = `${emPercentual(item.percentual)} da meta (${emDinheiroCurto(item.realizado)} de ${emDinheiroCurto(item.meta)})`;
  if (item.tipo === 'CONSULTOR') {
    return `🎉 Parabéns, ${nomeComemorado(item)}! Meta de faturamento do ${rotuloCiclo(item.ciclo)} batida: ${valores}.`;
  }
  return `🎉 Parabéns, ${nomeComemorado(item)}! ${item.grupo || item.nome}: meta de faturamento do ${rotuloCiclo(item.ciclo)} batida com ${valores}.`;
}

// ---------- tela ----------
export default function CelebracaoMeta({ itens = [], aoFechar }) {
  const [indice, setIndice] = useState(0);
  const [compartilhando, setCompartilhando] = useState(false);
  const [aviso, setAviso] = useState('');
  const botaoFechar = useRef(null);
  const total = itens.length;
  const item = itens[Math.min(indice, total - 1)];
  const nivelAtual = nivel(Number(item?.percentual || 0));
  const ultimo = indice >= total - 1;

  // O cartão fica aberto (com o confete) até a pessoa fechar.
  const fechar = useCallback(() => aoFechar?.(itens.map((i) => i.id)), [aoFechar, itens]);
  const avancar = useCallback(() => {
    if (ultimo) return;
    setAviso('');
    setIndice((i) => i + 1);
  }, [ultimo]);

  useEffect(() => { botaoFechar.current?.focus(); }, []);

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
      style={{ fontFamily: FONTE }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) fechar(); }}
    >
      <style>{ESTILO}</style>
      {nivelAtual === 'superacao' && <ChuvaDeCedulas rodada={item.id} />}
      <Confete key={item.id} disparo={item.id} cores={nivelAtual === 'meta' ? CORES_CONFETE.meta : CORES_CONFETE.ouro} />

      <div className="relative w-full max-w-[760px]" style={{ zIndex: 2 }}>
        <div className="relative overflow-hidden rounded-[28px] bg-white shadow-[0_30px_80px_-30px_rgba(1,40,44,.6)]">
          <div className="relative" style={{ containerType: 'inline-size' }}>
            <img src={MOLDE} alt="" className="block w-full select-none" draggable={false} />
            <div
              key={item.id}
              id="celebracao-titulo"
              className="absolute flex flex-col items-center justify-center text-center leading-[1.12] text-white"
              style={{
                left: `${AREA_TEXTO.esquerda * 100}%`,
                width: `${AREA_TEXTO.largura * 100}%`,
                top: `${AREA_TEXTO.topo * 100}%`,
                height: `${AREA_TEXTO.altura * 100}%`,
                textShadow: '0 2px 12px rgba(0, 40, 44, .28)',
              }}
            >
              <LinhaAjustada maximo={1.55} atraso={0.05} className="celebracao-sobretitulo mb-[1.1cqw] font-bold uppercase tracking-[0.14em] text-white/85">
                {`Meta de faturamento • ${rotuloCiclo(item.ciclo)}`}
              </LinhaAjustada>
              {/* A vírgula desta fonte vem com folga à esquerda: puxada um pouco para perto da palavra. */}
              <LinhaAjustada maximo={4} atraso={0.14} className="font-bold tracking-[-0.01em]">Parabéns<span style={{ marginLeft: '-0.1em' }}>,</span></LinhaAjustada>
              <LinhaAjustada maximo={7} atraso={0.23} className="my-[0.5cqw] font-extrabold tracking-[-0.02em]">{nome}</LinhaAjustada>
              <LinhaAjustada maximo={4} atraso={0.32} className="font-bold tracking-[-0.01em]">pela meta batida!</LinhaAjustada>
            </div>
            {nivelAtual === 'superacao' && (
              <span className="absolute left-1/2 top-[19%] -translate-x-1/2 rounded-full bg-[#f2c14e] px-3 py-1 font-extrabold uppercase tracking-wide text-[#5b3d00] shadow" style={{ fontSize: '1.9cqw' }}>
                Superação
              </span>
            )}
          </div>

          <div className="border-t border-gray-100 px-4 pb-4 pt-3 sm:px-6">
            <p className="text-center text-sm font-semibold text-gray-700">
              {frasePrincipal(item)}:{' '}
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
