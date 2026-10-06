import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle, ArrowRight, CalendarClock, Check, Coins, Droplets, Layers, Package, Palette, Receipt, Scissors,
  ShoppingBag, Sparkles, Target, Ticket, TrendingDown, TrendingUp, Trophy, UserCheck, X,
} from 'lucide-react';
import Confete from '../celebracao/Confete';
import { FONTE, prefereMenosMovimento } from '../celebracao/efeitos';

// Avisos da Campanha Incentivo 2026 num card na tela (vêm de /campanha-incentivo-2026/avisos):
// - atingiu: "Parabéns! Você atingiu X" + confete, lembrando de manter até o fim do ciclo;
// - todas: todos os indicadores do ciclo batidos (comemoração dourada);
// - quase: "Falta apenas X para você atingir Y";
// - caiu: o indicador que estava batido voltou para baixo da meta.

const MASCOTES = '/campanha-incentivo-2026/mascotes';

const ICONES = {
  receita: Coins, atividade: UserCheck, make: Palette, cabelo: Scissors, multimarcas: Layers,
  boleto_medio: Receipt, itens_boleto: ShoppingBag, skin: Droplets, rpa: TrendingUp, ticket: Ticket, upa: Package,
};

const QUANTIDADES = {
  atividade: (n) => `${n} ${n === 1 ? 'ativação' : 'ativações'}`,
  make: (n) => `${n} ${n === 1 ? 'revendedora' : 'revendedoras'} com MAKE`,
  cabelo: (n) => `${n} ${n === 1 ? 'revendedora' : 'revendedoras'} com CABELO`,
  multimarcas: (n) => `${n} ${n === 1 ? 'revendedora' : 'revendedoras'} multimarcas`,
};

const TEMAS = {
  atingiu: {
    fundo: 'linear-gradient(135deg,#02393c 0%,#048187 55%,#16a34a 100%)', titulo: 'Parabéns!', selo: 'Indicador atingido',
    mascote: 'ela-pulando', botao: 'Bora manter!', confete: ['#048187', '#62ccd1', '#16a34a', '#ffffff', '#f2c14e'], raios: true,
  },
  todas: {
    fundo: 'linear-gradient(135deg,#5b3d00 0%,#b8860b 45%,#f2c14e 100%)', titulo: 'Você está batendo tudo!', selo: 'Todos os indicadores',
    mascote: 'ele-pulando', mascote2: 'ela-pulando', botao: 'Vou segurar até o fim!', confete: ['#f2c14e', '#e0a106', '#fff3c4', '#048187', '#ffffff'], raios: true,
  },
  quase: {
    fundo: 'linear-gradient(135deg,#011c1e 0%,#03474a 50%,#048187 100%)', titulo: 'Quase lá!', selo: 'Falta pouco',
    mascote: 'ela-apontando', botao: 'Vou buscar!',
  },
  caiu: {
    fundo: 'linear-gradient(135deg,#3b0a14 0%,#7c1f31 55%,#c2410c 100%)', titulo: 'Atenção!', selo: 'Ficou abaixo da meta',
    mascote: 'ele-surpreso', botao: 'Vou recuperar!',
  },
};

const ESTILO = `
  .aviso-camp .ac-surgir { animation: acSurgir .55s cubic-bezier(.2,1.2,.4,1) both; }
  @keyframes acSurgir { from { opacity: 0; transform: translateY(18px) scale(.96); } to { opacity: 1; transform: none; } }
  .aviso-camp .ac-pop { animation: acPop .6s cubic-bezier(.2,1.8,.4,1) .15s both; }
  @keyframes acPop { from { opacity: 0; transform: scale(.3) rotate(-25deg); } to { opacity: 1; transform: none; } }
  .aviso-camp .ac-raios { animation: acGirar 18s linear infinite; }
  @keyframes acGirar { to { transform: rotate(360deg); } }
  .aviso-camp .ac-flutuar { animation: acFlutuar 4.5s ease-in-out infinite; }
  @keyframes acFlutuar { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
  .aviso-camp .ac-tremer { animation: acTremer .6s ease-in-out .3s 2; }
  @keyframes acTremer { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
  @media (prefers-reduced-motion: reduce) {
    .aviso-camp .ac-surgir, .aviso-camp .ac-pop, .aviso-camp .ac-raios, .aviso-camp .ac-flutuar, .aviso-camp .ac-tremer { animation: none; }
  }
`;

const rotuloCiclo = (n) => `C${String(n).padStart(2, '0')}`;
const dataCurta = (iso) => (iso ? String(iso).slice(0, 10).split('-').reverse().slice(0, 2).join('/') : '');

function emValor(valor, formato) {
  const n = Number(valor || 0);
  if (formato === 'percentual') return `${n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
  if (formato === 'numero') return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (Math.abs(n) >= 1e6) return `R$ ${(n / 1e6).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Mi`;
  if (Math.abs(n) >= 1e3) return `R$ ${(n / 1e3).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mil`;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

/** Quanto falta, na unidade que faz sentido: revendedoras/ativações, reais ou pontos percentuais. */
function quantoFalta(a) {
  const meta = Number(a.meta || 0);
  const valor = Number(a.valor || 0);
  if (a.formato === 'percentual' && Number(a.den) > 0 && QUANTIDADES[a.indicador]) {
    const n = Math.max(Math.ceil((meta / 100) * Number(a.den) - Number(a.num || 0) - 1e-9), 1);
    return { texto: QUANTIDADES[a.indicador](n), plural: n > 1 };
  }
  const falta = Math.max(meta - valor, 0);
  if (a.formato === 'percentual') {
    return { texto: `${falta.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ponto${falta >= 2 ? 's' : ''} percentua${falta >= 2 ? 'is' : 'l'}`, plural: falta >= 2 };
  }
  return { texto: emValor(falta, a.formato), plural: true };
}

function Anel({ percentual, cor }) {
  const raio = 30;
  const circ = 2 * Math.PI * raio;
  const [p, setP] = useState(() => (prefereMenosMovimento() ? percentual : 0));
  useEffect(() => {
    const t = requestAnimationFrame(() => setP(percentual));
    return () => cancelAnimationFrame(t);
  }, [percentual]);
  return (
    <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90" aria-hidden="true">
      <circle cx="36" cy="36" r={raio} fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="7" />
      <circle cx="36" cy="36" r={raio} fill="none" stroke={cor} strokeWidth="7" strokeLinecap="round" strokeDasharray={circ}
        strokeDashoffset={circ * (1 - Math.min(Math.max(p, 0), 100) / 100)} style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(.2,.8,.2,1)' }} />
    </svg>
  );
}

/** Selo redondo do indicador no topo do card (ícone + anel de progresso ou check). */
function Selo({ aviso }) {
  const Icone = aviso.tipo === 'todas' ? Trophy : (ICONES[aviso.indicador] || Target);
  const pct = Number(aviso.percentual || 0);
  if (aviso.tipo === 'quase' || aviso.tipo === 'caiu') {
    return (
      <span className={`relative w-[86px] h-[86px] shrink-0 ${aviso.tipo === 'caiu' ? 'ac-tremer' : 'ac-pop'}`}>
        <Anel percentual={pct} cor={aviso.tipo === 'caiu' ? '#fdba74' : '#5eead4'} />
        <span className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <Icone size={22} />
          <span className="mt-0.5 text-[11px] font-extrabold tabular-nums">{Math.floor(pct)}%</span>
        </span>
      </span>
    );
  }
  return (
    <span className="ac-pop relative w-[86px] h-[86px] shrink-0 rounded-full bg-white shadow-[0_12px_30px_-10px_rgba(0,0,0,.5)] flex items-center justify-center" style={{ color: aviso.tipo === 'todas' ? '#b8860b' : '#048187' }}>
      <Icone size={34} strokeWidth={2.2} />
      <span className="absolute -right-1 -bottom-1 w-8 h-8 rounded-full bg-green-500 text-white border-[3px] border-white flex items-center justify-center"><Check size={16} strokeWidth={3.2} /></span>
    </span>
  );
}

function textos(a) {
  const quem = a.unidade ? 'Sua unidade' : 'Você';
  const c = rotuloCiclo(a.ciclo);
  const fim = dataCurta(a.data_fim);
  const dias = Number(a.dias_restantes || 0);
  const prazo = dias <= 1 ? `hoje é o último dia do ${c}` : `faltam ${dias} dias para o fim do ${c}`;
  if (a.tipo === 'todas') {
    return {
      frase: `${quem} está batendo todos os indicadores do ${c}!`,
      lista: a.indicadores || [],
      aviso: `Segure firme até ${fim} para validar o ciclo inteiro: ${prazo}.`,
    };
  }
  if (a.tipo === 'atingiu') {
    return {
      frase: `${quem} atingiu o indicador ${a.rotulo}!`,
      aviso: `Mas mantenha o ritmo para não cair: ele só vale se continuar batido no fechamento do ${c} (${fim}). ${prazo.charAt(0).toUpperCase()}${prazo.slice(1)}.`,
    };
  }
  const falta = quantoFalta(a);
  if (a.tipo === 'quase') {
    const ritmo = a.formato === 'moeda' && dias > 0 ? ` São ${emValor(Math.max(Number(a.meta) - Number(a.valor), 0) / dias, 'moeda')} por dia.` : '';
    return {
      frase: `${falta.plural ? 'Faltam' : 'Falta'} apenas ${falta.texto} para ${a.unidade ? 'sua unidade' : 'você'} atingir ${a.rotulo}!`,
      aviso: `${prazo.charAt(0).toUpperCase()}${prazo.slice(1)}: dá tempo!${ritmo}`,
    };
  }
  return {
    frase: `${a.rotulo} ficou abaixo da meta.`,
    aviso: `${falta.plural ? 'Faltam' : 'Falta'} ${falta.texto} para voltar a bater. Ainda dá tempo: ${prazo}.`,
  };
}

export default function AvisosCampanha2026({ itens = [], aoFechar, aoAbrirCampanha, simulacao = false }) {
  const [indice, setIndice] = useState(0);
  const botao = useRef(null);
  const total = itens.length;
  const aviso = itens[Math.min(indice, total - 1)];
  const ultimo = indice >= total - 1;

  const fechar = useCallback(() => aoFechar?.(itens), [aoFechar, itens]);
  const avancar = useCallback(() => { if (ultimo) fechar(); else setIndice((i) => i + 1); }, [ultimo, fechar]);

  useEffect(() => { botao.current?.focus(); }, [indice]);
  useEffect(() => {
    const aoTecla = (e) => { if (e.key === 'Escape') fechar(); };
    window.addEventListener('keydown', aoTecla);
    return () => window.removeEventListener('keydown', aoTecla);
  }, [fechar]);

  if (!aviso) return null;
  const tema = TEMAS[aviso.tipo] || TEMAS.quase;
  const { frase, aviso: lembrete, lista } = textos(aviso);
  const valorMeta = aviso.tipo !== 'todas' && aviso.meta != null;
  const pct = Math.min(Math.max(Number(aviso.percentual || 0), 0), 100);

  return (
    <div className="aviso-camp fixed inset-0 z-[160] flex items-center justify-center overflow-y-auto bg-slate-950/65 px-3 py-6 backdrop-blur-[3px]" style={{ fontFamily: FONTE }}
      role="dialog" aria-modal="true" aria-labelledby="aviso-camp-titulo" onMouseDown={(e) => { if (e.target === e.currentTarget) fechar(); }}>
      <style>{ESTILO}</style>
      {/* Chaves diferentes para o confete e o card: com a mesma chave o React deixava o confete antigo na tela. */}
      {tema.confete && <Confete key={`confete-${aviso.id}`} disparo={aviso.id} cores={tema.confete} />}

      <article key={`card-${aviso.id}`} className="ac-surgir relative w-full max-w-[520px] overflow-hidden rounded-[30px] bg-white shadow-[0_40px_90px_-30px_rgba(0,0,0,.65)]" style={{ zIndex: 2 }}>
        {/* Topo colorido: selo do indicador, título e mascote */}
        <div className="relative overflow-hidden px-5 pt-5 pb-0 sm:px-7 sm:pt-6 text-white" style={{ background: tema.fundo }}>
          {tema.raios && (
            <div aria-hidden="true" className="ac-raios pointer-events-none absolute -left-24 -top-24 w-[340px] h-[340px] opacity-25"
              style={{ background: 'repeating-conic-gradient(from 0deg, rgba(255,255,255,.9) 0deg 8deg, transparent 8deg 22deg)', maskImage: 'radial-gradient(circle, #000 25%, transparent 70%)', WebkitMaskImage: 'radial-gradient(circle, #000 25%, transparent 70%)' }} />
          )}
          <button type="button" onClick={fechar} aria-label="Fechar" className="absolute right-3 top-3 z-[3] w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"><X size={18} /></button>
          <div className="relative z-[2] grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
            <div className="pb-5 sm:pb-6 min-w-0">
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.12em] text-white/75">Campanha Incentivo 2026 • {rotuloCiclo(aviso.ciclo)}</p>
              <div className="mt-3 flex items-center gap-3.5">
                <Selo aviso={aviso} />
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-white/15 px-2.5 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wide">
                    {aviso.tipo === 'caiu' ? <TrendingDown size={12} /> : aviso.tipo === 'quase' ? <Target size={12} /> : <Sparkles size={12} />} {tema.selo}
                  </span>
                  <h2 id="aviso-camp-titulo" className="mt-1.5 text-[26px] sm:text-[32px] leading-[1.05] font-extrabold tracking-[-0.02em]">{tema.titulo}</h2>
                </div>
              </div>
            </div>
            <div className="flex items-end self-end -mb-1">
              {tema.mascote2 && <img src={`${MASCOTES}/${tema.mascote2}.webp`} alt="" aria-hidden="true" className="ac-flutuar -mr-6 w-[64px] sm:w-[92px] drop-shadow-[0_14px_20px_rgba(0,0,0,.35)]" style={{ animationDelay: '.6s' }} />}
              <img src={`${MASCOTES}/${tema.mascote}.webp`} alt="" aria-hidden="true" className="ac-flutuar w-[78px] sm:w-[108px] drop-shadow-[0_14px_20px_rgba(0,0,0,.35)]" />
            </div>
          </div>
        </div>

        {/* Corpo: a mensagem, o número e o lembrete */}
        <div className="px-5 pt-5 pb-5 sm:px-7 sm:pt-6 sm:pb-6">
          <p className="text-[17px] sm:text-lg font-bold leading-snug text-slate-800">{frase}</p>
          {aviso.unidade && aviso.nome && <p className="mt-0.5 text-xs font-semibold text-slate-400">{aviso.nome}</p>}

          {lista?.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {lista.map((r) => <li key={r} className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-100 px-2.5 py-1 text-[11px] font-bold text-green-700"><Check size={12} strokeWidth={3} /> {r}</li>)}
            </ul>
          )}

          {valorMeta && (
            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-extrabold tabular-nums text-slate-800">{emValor(aviso.valor, aviso.formato)}</span>
                <span className="text-xs font-semibold text-slate-400">meta {emValor(aviso.meta, aviso.formato)}</span>
              </div>
              <div className="mt-2 h-2.5 rounded-full bg-slate-200/80 overflow-hidden">
                <div className="h-full rounded-full transition-[width] duration-1000"
                  style={{ width: `${aviso.tipo === 'atingiu' ? 100 : pct}%`, background: aviso.tipo === 'atingiu' ? 'linear-gradient(90deg,#048187,#16a34a)' : aviso.tipo === 'caiu' ? 'linear-gradient(90deg,#c2410c,#7c1f31)' : 'linear-gradient(90deg,#048187,#2dd4bf)' }} />
              </div>
            </div>
          )}

          <p className={`mt-4 flex items-start gap-2 rounded-2xl px-3.5 py-3 text-[13px] font-semibold leading-snug ${aviso.tipo === 'caiu' ? 'bg-[#fff1ec] text-[#9a3412]' : aviso.tipo === 'quase' ? 'bg-[#e6f6f7] text-[#036b70]' : 'bg-[#fff8e6] text-[#7a5200]'}`}>
            {aviso.tipo === 'caiu' ? <AlertTriangle size={16} className="shrink-0 mt-0.5" /> : <CalendarClock size={16} className="shrink-0 mt-0.5" />}
            <span>{lembrete}</span>
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button ref={botao} type="button" onClick={avancar}
              className="inline-flex flex-1 sm:flex-none items-center justify-center gap-2 whitespace-nowrap rounded-2xl px-5 py-3 text-sm font-extrabold text-white shadow-[0_10px_24px_-12px_rgba(4,129,135,.9)] hover:brightness-110"
              style={{ background: aviso.tipo === 'caiu' ? '#7c1f31' : aviso.tipo === 'todas' ? '#b8860b' : '#048187' }}>
              {tema.botao} {!ultimo && <ArrowRight size={16} />}
            </button>
            {aoAbrirCampanha && !simulacao && (
              <button type="button" onClick={() => { fechar(); aoAbrirCampanha(); }} className="whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-bold text-[#048187] hover:bg-[#e6f6f7]">
                Ver minha campanha
              </button>
            )}
            {total > 1 && (
              <span className="ml-auto flex items-center gap-1.5" aria-label={`Aviso ${indice + 1} de ${total}`}>
                {itens.map((i, n) => <span key={i.id} className={`h-1.5 rounded-full transition-all ${n === indice ? 'w-5 bg-[#048187]' : 'w-1.5 bg-slate-200'}`} />)}
              </span>
            )}
          </div>
          {simulacao && <p className="mt-3 text-[11px] font-semibold text-amber-700">Prévia: ao fechar, nada é marcado como visto.</p>}
        </div>
      </article>
    </div>
  );
}
