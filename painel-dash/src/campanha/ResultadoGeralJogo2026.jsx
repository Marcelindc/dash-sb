import { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { AlertTriangle, Coins, Flame, Lock, Plane, Rocket, Star, Store, Timer, TrendingUp, Trophy, Users } from 'lucide-react';
import { FONTE } from '../celebracao/efeitos';
import { COR_LOJA, COR_VD, dataCurtaBR, emMilhoes, emPercentual, limitar, montarPainel, rotuloCicloRG } from './resultadoGeralCalculo';

// Resultado Geral da Campanha Incentivo 2026, gamificado (pedido de 07/10/2026): a "corrida" do CP inteiro
// (VD + LOJA) até os R$ 106 Mi (viagem) e R$ 109 Mi (bônus), as duas missões coletivas, as fases C14 → C17
// e o time VD x time LOJA. As contas são as mesmas da tela anterior (resultadoGeralCalculo.js).

const ESTILO = `
  .rg-jogo { font-family: ${FONTE}; }
  .rg-jogo .rg-surgir { animation: rgSurgir .5s cubic-bezier(.2,1.1,.4,1) both; }
  @keyframes rgSurgir { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
  .rg-jogo .rg-foguete { animation: rgFoguete 1.3s ease-in-out infinite; }
  @keyframes rgFoguete { 0%, 100% { transform: translate(-50%, -50%) rotate(45deg); } 50% { transform: translate(-50%, -62%) rotate(45deg); } }
  .rg-jogo .rg-pulso { animation: rgPulso 1.8s ease-out infinite; }
  @keyframes rgPulso { 0% { transform: scale(.7); opacity: .8; } 100% { transform: scale(1.9); opacity: 0; } }
  .rg-jogo .rg-listras { background-image: repeating-linear-gradient(45deg, rgba(255,255,255,.35) 0 6px, transparent 6px 12px); }
  @media (prefers-reduced-motion: reduce) { .rg-jogo .rg-surgir, .rg-jogo .rg-foguete, .rg-jogo .rg-pulso { animation: none; } }
`;

/** A pista do CP: 0 → 106 (viagem) → 109 (bônus), com o foguete onde estamos e a projeção tracejada. */
function Pista({ total, projecao, meta106, meta109 }) {
  // Zoom na reta final: a pista começa perto do resultado atual para os marcos de 106 e 109 não ficarem espremidos.
  const min = total > 0 ? Math.min(meta106 * 0.85, total * 0.95) : 0;
  const max = meta109 * 1.02;
  const pos = (v) => limitar(((Number(v || 0) - min) / Math.max(max - min, 1)) * 100);
  const marcos = [
    { valor: meta106, rotulo: 'Viagem', sub: emMilhoes(meta106, 0), icone: Plane, cor: '#2dd4bf', ok: total >= meta106 },
    { valor: meta109, rotulo: 'Bônus', sub: emMilhoes(meta109, 0), icone: Coins, cor: '#f2c14e', ok: total >= meta109 },
  ];
  return (
    <div className="relative pt-12 pb-14">
      <div className="relative h-5 rounded-full bg-white/15 overflow-visible">
        {projecao > total && (
          <div className="absolute inset-y-0 left-0 rounded-full rg-listras bg-white/20" style={{ width: `${pos(projecao)}%` }} title={`No ritmo atual: ${emMilhoes(projecao)}`} />
        )}
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pos(total)}%`, background: 'linear-gradient(90deg,#2dd4bf,#a7f3d0)', boxShadow: '0 0 18px rgba(45,212,191,.6)', transition: 'width 1.6s cubic-bezier(.2,.8,.2,1)' }} />
        {/* Foguete: onde o CP está hoje */}
        <span className="absolute top-1/2 z-[2]" style={{ left: `${pos(total)}%` }}>
          <span className="rg-pulso absolute -left-5 -top-5 w-10 h-10 rounded-full bg-teal-300/50" />
          <span className="rg-foguete absolute left-0 top-0 w-11 h-11 rounded-full bg-white shadow-lg flex items-center justify-center text-[#048187]" style={{ transform: 'translate(-50%,-50%) rotate(45deg)' }}>
            <Rocket size={22} strokeWidth={2.4} />
          </span>
          <span className="absolute left-1/2 -translate-x-1/2 -top-[54px] whitespace-nowrap rounded-xl bg-white px-2.5 py-1 text-[12px] font-extrabold text-[#036b70] shadow">
            {emMilhoes(total)}
            <span className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 rotate-45 bg-white" />
          </span>
        </span>
        {min > 0 && <span className="absolute left-0 top-7 text-[10px] font-bold text-white/50">{emMilhoes(min, 0)}</span>}
        {/* Marcos */}
        {marcos.map(({ valor, rotulo, sub, icone: Icone, cor, ok }) => (
          <span key={rotulo} className="absolute top-1/2" style={{ left: `${pos(valor)}%` }}>
            <span className="absolute left-0 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full border-[3px] border-white flex items-center justify-center shadow-md"
              style={{ background: ok ? cor : '#0b3a3d' }}>
              {ok ? <Icone size={16} color="#063" strokeWidth={2.6} /> : <Lock size={15} color={cor} strokeWidth={2.6} />}
            </span>
            {/* Viagem: texto à esquerda do marco; Bônus: à direita (assim os dois nunca se sobrepõem). */}
            <span className={`absolute top-6 whitespace-nowrap ${rotulo === 'Viagem' ? 'right-0 pr-1 text-right' : 'left-0 pl-1 text-left'}`}>
              <span className="block text-[12px] font-extrabold" style={{ color: cor }}>{rotulo}</span>
              <span className="block text-[11px] font-bold text-white/70">{sub}</span>
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Medidor meia-lua: ritmo atual x ritmo necessário. */
function Medidor({ fracao, cor }) {
  const f = Math.max(0, Math.min(fracao, 1.5)) / 1.5;
  const angulo = -90 + f * 180;
  return (
    <svg viewBox="0 0 120 70" className="w-[120px] h-[70px]" aria-hidden="true">
      <path d="M10 62 A50 50 0 0 1 110 62" fill="none" stroke="#e2e8f0" strokeWidth="12" strokeLinecap="round" />
      <path d="M10 62 A50 50 0 0 1 110 62" fill="none" stroke={cor} strokeWidth="12" strokeLinecap="round" strokeDasharray="157" strokeDashoffset={157 * (1 - f)} style={{ transition: 'stroke-dashoffset 1.3s ease' }} />
      <line x1="60" y1="17" x2="60" y2="8" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" transform="rotate(0 60 62)" opacity=".25" />
      <g transform={`rotate(${angulo} 60 62)`} style={{ transition: 'transform 1.3s ease' }}>
        <line x1="60" y1="62" x2="60" y2="22" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
      </g>
      <circle cx="60" cy="62" r="6" fill="#0f172a" />
    </svg>
  );
}

function MissaoColetiva({ titulo, icone: Icone, cor, escura, alvo, media, restantes }) {
  const fracao = alvo.porCiclo > 0 ? media / alvo.porCiclo : alvo.batida ? 1.5 : 0;
  const noRitmo = alvo.batida || fracao >= 1;
  return (
    <article className="rg-surgir rounded-[26px] border-2 border-slate-100 bg-white p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(160deg, ${cor}, ${escura})`, boxShadow: `0 4px 0 ${escura}66` }}>
          <Icone size={24} color="#fff" strokeWidth={2.4} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-extrabold uppercase tracking-wide" style={{ color: escura }}>Missão coletiva</p>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 leading-tight">{titulo}</h3>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-extrabold ${alvo.batida ? 'bg-green-500 text-white' : noRitmo ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-600'}`}>
          {alvo.batida ? 'Cumprida!' : noRitmo ? 'No ritmo' : 'Acelerar'}
        </span>
      </div>
      {alvo.batida ? (
        <p className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm font-extrabold text-green-700">Meta alcançada! Agora é segurar até o C17.</p>
      ) : (
        <div className="mt-4 flex items-center gap-4">
          <Medidor fracao={fracao} cor={noRitmo ? '#22c55e' : '#f97316'} />
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="text-[13px] font-bold text-slate-500">Faltam <strong className="text-slate-800 text-[15px]">{emMilhoes(alvo.falta)}</strong></p>
            <p className="text-[13px] font-bold text-slate-500">Precisa <strong className="text-slate-800">{emMilhoes(alvo.porCiclo)}</strong> por ciclo ({restantes.length} {restantes.length === 1 ? 'ciclo' : 'ciclos'})</p>
            <p className="text-[13px] font-bold text-slate-500">Ritmo atual <strong style={{ color: noRitmo ? '#16a34a' : '#ea580c' }}>{emMilhoes(media)}</strong> por ciclo</p>
          </div>
        </div>
      )}
    </article>
  );
}

function Estrelas({ n }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${n} de 3 estrelas`}>
      {[1, 2, 3].map((i) => <Star key={i} size={18} strokeWidth={2.2} color={i <= n ? '#f2c14e' : '#cbd5e1'} fill={i <= n ? '#f2c14e' : 'none'} />)}
    </span>
  );
}

/** C14 → C17 como fases: realizado, a parte de cada canal e estrelas pelo ritmo (3 = acima do necessário). */
function Fases({ p, cal, porCiclo106 }) {
  const fases = [14, 15, 16, 17].map((n) => {
    const c = p.ciclos.find((x) => x.numero === n) || { numero: n, vd: 0, loja: 0, total: 0 };
    const k = (cal || []).find((x) => x.numero === n) || {};
    const status = k.status || (n < p.numeroAtual ? 'encerrado' : n === p.numeroAtual ? 'em_andamento' : 'futuro');
    const base = status === 'em_andamento' && p.tendenciaAtual != null ? p.tendenciaAtual : c.total;
    const ritmo = porCiclo106 > 0 ? base / porCiclo106 : 0;
    const estrelas = status === 'futuro' ? 0 : ritmo >= 1 ? 3 : ritmo >= 0.9 ? 2 : ritmo >= 0.75 ? 1 : 0;
    return { ...c, status, k, estrelas };
  });
  return (
    <section className="rg-surgir rounded-[26px] border-2 border-slate-100 bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 inline-flex items-center gap-2"><Trophy size={20} className="text-[#d4a017]" /> Fases da campanha</h3>
          <p className="mt-0.5 text-[12px] font-semibold text-slate-400">3 estrelas: o ciclo vendeu o necessário para a viagem ({emMilhoes(porCiclo106)} por ciclo).</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {fases.map((f) => {
          const atual = f.status === 'em_andamento';
          const futuro = f.status === 'futuro';
          const partVd = f.total > 0 ? (f.vd / f.total) * 100 : 50;
          return (
            <article key={f.numero} className={`relative rounded-[22px] border-2 p-3.5 sm:p-4 ${atual ? 'border-teal-300 bg-teal-50/60' : futuro ? 'border-slate-100 bg-slate-50' : 'border-amber-200 bg-amber-50/50'}`}>
              {atual && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#048187] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white shadow">Agora</span>}
              <div className="flex items-center justify-between gap-2">
                <span className={`w-11 h-11 rounded-2xl flex items-center justify-center text-[15px] font-extrabold ${futuro ? 'bg-slate-200 text-slate-400' : atual ? 'bg-[#048187] text-white' : 'bg-[#f2c14e] text-white'}`}
                  style={{ boxShadow: futuro ? 'none' : `0 4px 0 ${atual ? '#036b70' : '#b8860b'}` }}>
                  {futuro ? <Lock size={18} /> : rotuloCicloRG(f.numero)}
                </span>
                {!futuro && <Estrelas n={f.estrelas} />}
              </div>
              <p className={`mt-3 text-[11px] font-extrabold uppercase tracking-wide ${futuro ? 'text-slate-400' : 'text-slate-500'}`}>{futuro ? `${rotuloCicloRG(f.numero)} • começa ${dataCurtaBR(f.k.data_inicio)}` : atual ? 'Até agora' : 'Fechou com'}</p>
              <p className={`text-[20px] sm:text-[22px] font-extrabold tabular-nums ${futuro ? 'text-slate-300' : 'text-slate-800'}`}>{futuro ? '—' : emMilhoes(f.total)}</p>
              {futuro && porCiclo106 > 0 && <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-extrabold text-slate-500"><Plane size={12} /> Alvo {emMilhoes(porCiclo106)}</p>}
              {!futuro && (
                <>
                  <div className="mt-2 flex h-2 rounded-full overflow-hidden bg-slate-200">
                    <span style={{ width: `${partVd}%`, background: COR_VD }} />
                    <span style={{ width: `${100 - partVd}%`, background: COR_LOJA }} />
                  </div>
                  <p className="mt-1 flex justify-between text-[10px] font-bold text-slate-400"><span>VD {emMilhoes(f.vd, 1)}</span><span>Loja {emMilhoes(f.loja, 1)}</span></p>
                  {atual && p.emAndamento && (
                    <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-extrabold text-orange-500"><Timer size={13} /> {Math.max(Number(p.emAndamento.dias_total || 0) - Number(p.emAndamento.dias_passados || 0), 0)} dias restantes</p>
                  )}
                </>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

/** Time VD x time LOJA: quem está puxando o CP na campanha (C14 em diante). */
function Duelo({ campanha, ano }) {
  const total = campanha.vd + campanha.loja;
  const pVd = total > 0 ? (campanha.vd / total) * 100 : 50;
  const lado = (nome, Icone, valor, valorAno, cor, pct, direita) => (
    <div className={`min-w-0 flex-1 ${direita ? 'text-right' : ''}`}>
      <span className={`inline-flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-wide ${direita ? 'flex-row-reverse' : ''}`} style={{ color: cor }}><Icone size={16} /> {nome}</span>
      <p className="mt-1 text-[22px] sm:text-[28px] font-extrabold tabular-nums text-slate-800">{emMilhoes(valor)}</p>
      <p className="text-[12px] font-bold text-slate-400">{emPercentual(pct)} da campanha • {emMilhoes(valorAno, 1)} no ano</p>
    </div>
  );
  return (
    <section className="rg-surgir rounded-[26px] border-2 border-slate-100 bg-white p-4 sm:p-5">
      <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 inline-flex items-center gap-2"><Flame size={20} className="text-orange-500" /> Time VD x Time LOJA</h3>
      <p className="mt-0.5 text-[12px] font-semibold text-slate-400">Os dois times juntos rumo aos 106. Quanto cada um já colocou na campanha (C14 em diante).</p>
      <div className="mt-4 flex items-start gap-3">
        {lado('Venda Direta', Users, campanha.vd, ano.vd, COR_VD, pVd, false)}
        <span className="mt-6 shrink-0 w-11 h-11 rounded-full bg-slate-800 text-white text-[13px] font-extrabold flex items-center justify-center shadow-[0_4px_0_#0f172a55]">VS</span>
        {lado('Loja', Store, campanha.loja, ano.loja, '#2a9aa0', 100 - pVd, true)}
      </div>
      <div className="mt-4 flex h-4 rounded-full overflow-hidden">
        <span className="h-full" style={{ width: `${pVd}%`, background: `linear-gradient(90deg, ${COR_VD}, #0f9aa1)` }} />
        <span className="h-full" style={{ width: `${100 - pVd}%`, background: `linear-gradient(90deg, #9ee0e2, ${COR_LOJA})` }} />
      </div>
      <p className="mt-2 text-center text-[12px] font-extrabold text-slate-500">Juntos: {emMilhoes(total)} na campanha</p>
    </section>
  );
}

function DicaBarras({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const ponto = payload[0]?.payload || {};
  return (
    <div className="rounded-xl border border-slate-100 bg-white/95 px-3 py-2 shadow-lg text-xs font-bold">
      <p className="text-slate-800">{label}{ponto.parcial ? ' • em andamento' : ''}</p>
      <p className="mt-1 flex justify-between gap-4"><span className="text-slate-400">VD</span><span style={{ color: COR_VD }}>{emMilhoes(ponto.vd)}</span></p>
      <p className="flex justify-between gap-4"><span className="text-slate-400">Loja</span><span className="text-[#2a9aa0]">{emMilhoes(ponto.loja)}</span></p>
      <p className="mt-1 border-t border-slate-100 pt-1 flex justify-between gap-4"><span className="text-slate-500">Total</span><span className="text-slate-800">{emMilhoes(ponto.total)}</span></p>
    </div>
  );
}

export default function ResultadoGeralJogo2026({ ciclosAno = [], calendario = [], metas = {}, carregando = false, aoLancar = null }) {
  const meta106 = Number(metas?.meta_principal || 106000000);
  const meta109 = Number(metas?.meta_superacao || 109000000);
  const p = useMemo(() => montarPainel(ciclosAno, calendario, meta106, meta109), [ciclosAno, calendario, meta106, meta109]);

  if (carregando && !p.ciclos.length) {
    return <div className="rounded-[24px] bg-white border border-gray-100 p-12 text-center text-sm font-semibold text-gray-400 shadow-sm">Carregando o resultado do CP...</div>;
  }
  const campanha = p.ciclos.filter((c) => c.numero >= 14).reduce((s, c) => ({ vd: s.vd + c.vd, loja: s.loja + c.loja }), { vd: 0, loja: 0 });
  const ano = p.ciclos.reduce((s, c) => ({ vd: s.vd + c.vd, loja: s.loja + c.loja }), { vd: 0, loja: 0 });
  const pct106 = meta106 > 0 ? (p.total / meta106) * 100 : 0;
  const graficoAno = p.grafico.filter((g) => !g.futuro);

  return (
    <div className="rg-jogo space-y-4 sm:space-y-5">
      <style>{ESTILO}</style>

      {/* A corrida */}
      <header className="rg-surgir relative overflow-hidden rounded-[28px] px-4 pt-5 sm:px-7 sm:pt-6 text-white" style={{ background: 'linear-gradient(135deg,#011c1e 0%,#03474a 45%,#048187 100%)' }}>
        <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-20 w-72 h-72 rounded-full bg-white/10" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">Missão coletiva • VD + LOJA</p>
            <h2 className="mt-1.5 text-[24px] sm:text-[34px] font-extrabold leading-[1.05] tracking-[-0.02em]">A corrida do CP rumo aos R$ 106 Mi</h2>
            <p className="mt-2 flex flex-wrap items-baseline gap-x-2 text-white/85 font-bold">
              <span className="text-[30px] sm:text-[40px] font-extrabold tabular-nums text-white">{emMilhoes(p.total)}</span>
              <span className="text-[13px]">{emPercentual(pct106)} da meta da viagem</span>
            </p>
          </div>
          <img src="/campanha-incentivo-2026/mascotes/ele-pulando.webp" alt="" aria-hidden="true" className="hidden sm:block shrink-0 w-[110px] drop-shadow-[0_14px_20px_rgba(0,0,0,.35)]" />
        </div>
        <div className="relative pl-1 pr-12 sm:px-3"><Pista total={p.total} projecao={p.projecao} meta106={meta106} meta109={meta109} /></div>
        <div className="relative -mt-4 mb-5 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 border border-white/15 px-3 py-1.5 text-[12px] font-bold">
            <TrendingUp size={14} /> No ritmo atual chegamos a <strong className="text-white">{emMilhoes(p.projecao)}</strong> no C17
          </span>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-extrabold ${p.a106.projetaBater ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}>
            {p.a106.projetaBater ? <><Plane size={14} /> Viagem no caminho</> : <><Flame size={14} /> Precisa acelerar para a viagem</>}
          </span>
        </div>
      </header>

      {p.pendencias.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-bold text-amber-800 flex flex-wrap items-center gap-2">
          <AlertTriangle size={16} /> Sem resultado lançado em: {p.pendencias.map((c) => `${rotuloCicloRG(c.numero)} (${c.canais.join(' e ')})`).join(', ')}. O total está menor que o real.
          {aoLancar && <button type="button" onClick={aoLancar} className="ml-auto rounded-full bg-amber-600 px-3 py-1 text-white">Lançar</button>}
        </div>
      )}

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <MissaoColetiva titulo={`Destravar a viagem • ${emMilhoes(meta106, 0)}`} icone={Plane} cor="#0f9aa1" escura="#036b70" alvo={p.a106} media={p.media} restantes={p.restantes} />
        <MissaoColetiva titulo={`Destravar o bônus • ${emMilhoes(meta109, 0)}`} icone={Coins} cor="#d4a017" escura="#7c1f31" alvo={p.a109} media={p.media} restantes={p.restantes} />
      </div>

      <Fases p={p} cal={calendario} porCiclo106={p.a106.porCiclo} />

      <div className="grid gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] items-start">
        <Duelo campanha={campanha} ano={ano} />
        <section className="rg-surgir rounded-[26px] border-2 border-slate-100 bg-white p-4 sm:p-5">
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-800">Ciclo a ciclo de 2026</h3>
          <p className="mt-0.5 text-[12px] font-semibold text-slate-400">Quanto o CP vendeu em cada ciclo. Média dos últimos fechados: {emMilhoes(p.media)}.</p>
          <div className="mt-3 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graficoAno} margin={{ top: 6, right: 4, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="#eef2f6" vertical={false} />
                <XAxis dataKey="rotulo" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={0} />
                <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1e6)}`} />
                <Tooltip content={<DicaBarras />} cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="vd" stackId="a" fill={COR_VD} radius={[0, 0, 4, 4]} isAnimationActive={false}>
                  {graficoAno.map((g) => <Cell key={g.numero} fillOpacity={g.parcial ? 0.55 : 1} />)}
                </Bar>
                <Bar dataKey="loja" stackId="a" fill={COR_LOJA} radius={[6, 6, 0, 0]} isAnimationActive={false}>
                  {graficoAno.map((g) => <Cell key={g.numero} fillOpacity={g.parcial ? 0.55 : 1} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}
