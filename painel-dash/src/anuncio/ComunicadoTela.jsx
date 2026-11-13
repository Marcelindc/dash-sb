import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { IconeIndicador } from '../cards/CardsTopo';

// Comunicado no meio da tela (texto), uma vez por pessoa. Quem decide quem vê e quando é o backend
// (/comunicados/pendente); fechar por "Entendi", X ou Esc conta como visto (o App avisa o backend).
// comunicado: { id, titulo, paragrafos: [texto], exemplo?: { nome, icone, indicador, meta } }

const formatarPercentual = (valor) => `${Number(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

const ESTILO = `
  @keyframes comunicadoSurgir {
    from { opacity: 0; transform: translateY(14px) scale(.97); }
    to { opacity: 1; transform: none; }
  }
  @keyframes comunicadoFundo { from { opacity: 0; } to { opacity: 1; } }
  @keyframes comunicadoAnel { from { stroke-dashoffset: var(--comunicado-anel-total); } }
  .comunicado-fundo { animation: comunicadoFundo .3s ease-out both; }
  .comunicado-quadro { animation: comunicadoSurgir .5s cubic-bezier(.4,0,.2,1) both; }
  .comunicado-anel { animation: comunicadoAnel 1.1s .35s cubic-bezier(.4,0,.2,1) both; }
  @media (prefers-reduced-motion: reduce) {
    .comunicado-fundo, .comunicado-quadro, .comunicado-anel { animation: none; }
  }
`;

// O mesmo desenho do anel do card Indicadores (CardsTopo), maior.
function AnelExemplo({ percentual, icone, cor = '#048187' }) {
  const tamanho = 46;
  const espessura = 4.2;
  const raio = (tamanho - espessura) / 2;
  const circunferencia = 2 * Math.PI * raio;
  const limitado = Math.min(Math.max(Number(percentual) || 0, 0), 100);
  return (
    <span className="relative inline-flex items-center justify-center shrink-0 w-[76px] h-[76px]">
      <svg viewBox={`0 0 ${tamanho} ${tamanho}`} className="absolute inset-0 w-full h-full -rotate-90" aria-hidden="true">
        <circle cx={tamanho / 2} cy={tamanho / 2} r={raio} fill="none" stroke="#e3ecee" strokeWidth={espessura} />
        <circle
          className="comunicado-anel"
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={raio}
          fill="none"
          stroke={cor}
          strokeWidth={espessura}
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          strokeDashoffset={circunferencia * (1 - limitado / 100)}
          style={{ '--comunicado-anel-total': circunferencia }}
        />
      </svg>
      <IconeIndicador nome={icone} tamanho={30} />
    </span>
  );
}

function Exemplo({ exemplo }) {
  const meta = Number(exemplo?.meta || 0);
  const indicador = Number(exemplo?.indicador || 0);
  if (!(meta > 0)) return null;
  const daMeta = (indicador / meta) * 100;
  return (
    <div className="rounded-2xl bg-[#f3f8f8] border border-[#e3ecee] p-4 flex items-center gap-4">
      <AnelExemplo percentual={daMeta} icone={exemplo.icone || 'atividade'} />
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[.08em] text-[#64748b]">
          Exemplo · {exemplo.nome} · meta {formatarPercentual(meta)}
        </p>
        <p className="mt-1.5 text-[12.5px] font-bold text-[#94a3b8]">
          Antes: <span className="line-through">{formatarPercentual(indicador)}</span>
        </p>
        <p className="mt-0.5 flex items-baseline gap-1.5 flex-wrap">
          <span className="text-[12.5px] font-bold text-[#475569]">Agora:</span>
          <span className="text-2xl leading-none font-black text-[#048187]">{formatarPercentual(daMeta)}</span>
          <span className="text-[12px] font-bold text-[#048187]">da meta</span>
        </p>
      </div>
    </div>
  );
}

export default function ComunicadoTela({ comunicado, aoFechar }) {
  const botaoRef = useRef(null);
  // O App redesenha muito: guardar o aoFechar num ref evita religar o Esc a cada redesenho.
  const aoFecharRef = useRef(aoFechar);
  useEffect(() => { aoFecharRef.current = aoFechar; });

  useEffect(() => {
    botaoRef.current?.focus({ preventScroll: true });
    const aoTeclar = (evento) => { if (evento.key === 'Escape') aoFecharRef.current?.(); };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, []);

  if (!comunicado) return null;
  const paragrafos = Array.isArray(comunicado.paragrafos) ? comunicado.paragrafos : [];

  return (
    <div
      className="comunicado-fundo fixed inset-0 z-[10050] bg-black/45 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="comunicado-titulo"
    >
      <style>{ESTILO}</style>
      <div className="comunicado-quadro bg-white w-full max-w-[460px] max-h-[92dvh] overflow-y-auto rounded-2xl shadow-2xl">
        <div className="relative px-6 pt-5 pb-5 bg-gradient-to-br from-[#048187] to-[#036e73] text-white rounded-t-2xl">
          <p className="text-[10px] font-black uppercase tracking-[.14em] text-white/75">Comunicado DASH</p>
          <h2 id="comunicado-titulo" className="mt-1.5 pr-9 text-lg sm:text-xl font-black leading-snug">{comunicado.titulo}</h2>
          <button
            type="button"
            onClick={() => aoFecharRef.current?.()}
            aria-label="Fechar comunicado"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white inline-flex items-center justify-center cursor-pointer transition-colors"
          >
            <X size={17} />
          </button>
        </div>
        <div className="px-6 pt-5 pb-2 space-y-4">
          {comunicado.exemplo ? <Exemplo exemplo={comunicado.exemplo} /> : null}
          {paragrafos.map((texto) => (
            <p key={texto} className="text-[13.5px] leading-relaxed text-[#475569]">{texto}</p>
          ))}
        </div>
        <div className="px-6 pt-3 pb-6">
          <button
            ref={botaoRef}
            type="button"
            onClick={() => aoFecharRef.current?.()}
            className="w-full rounded-xl bg-[#048187] hover:bg-[#036e73] text-white text-sm font-black py-3 cursor-pointer transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-[#048187]/25"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}
