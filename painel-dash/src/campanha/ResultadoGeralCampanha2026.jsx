import { useMemo } from 'react';
import { ResponsiveContainer, ComposedChart, Bar, Cell, Line, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { AlertTriangle, CalendarDays, CheckCircle, Flag, TrendingUp, Store, Users } from 'lucide-react';

// Resultado Geral da Campanha Incentivo 2026: o CP inteiro (VD + Loja) rumo aos 106 e 109 MM.
// Mostra quanto falta, quanto precisa vender por ciclo, o ciclo a ciclo e a projeção até o C17.

const ULTIMO_CICLO = 17;
const COR_VD = '#048187';
const COR_LOJA = '#7fd0d3';
const COR_106 = '#048187';
const COR_109 = '#7c1f31';

const emMilhoes = (valor, casas = 2) => `R$ ${(Number(valor || 0) / 1e6).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })} Mi`;
const emPercentual = (valor) => `${Number(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
const limitar = (valor) => Math.max(0, Math.min(Number(valor || 0), 100));
const dataCurta = (iso) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '');
const rotuloCiclo = (numero) => `C${String(numero).padStart(2, '0')}`;

function montarPainel(ciclosAno, calendario, meta106, meta109) {
  const ciclos = [...(ciclosAno || [])]
    .map((c) => ({ ...c, numero: Number(c.numero), vd: Number(c.vd || 0), loja: Number(c.loja || 0), total: Number(c.total || 0) }))
    .filter((c) => c.numero >= 1 && c.numero <= ULTIMO_CICLO)
    .sort((a, b) => a.numero - b.numero);
  const cal = calendario || [];
  const emAndamento = cal.find((i) => i.status === 'em_andamento');
  const todosEncerrados = cal.length > 0 && cal.every((i) => i.status === 'encerrado');
  const numeroAtual = emAndamento ? emAndamento.numero : todosEncerrados ? ULTIMO_CICLO + 1 : (cal.find((i) => i.status === 'futuro')?.numero ?? 14);

  const total = ciclos.reduce((s, c) => s + c.total, 0);
  const fechados = ciclos.filter((c) => c.numero < numeroAtual);
  const restantes = ciclos.filter((c) => c.numero >= numeroAtual);
  const totalFechados = fechados.reduce((s, c) => s + c.total, 0);
  const ultimos = fechados.filter((c) => c.total > 0).slice(-3);
  const media = ultimos.length ? ultimos.reduce((s, c) => s + c.total, 0) / ultimos.length : 0;
  const tendenciaAtual = emAndamento && emAndamento.dias_passados >= 3
    ? (ciclos.find((c) => c.numero === emAndamento.numero)?.total || 0) / emAndamento.dias_passados * emAndamento.dias_total
    : null;
  const esperado = (c) => Math.max(c.total, c.numero === numeroAtual && tendenciaAtual !== null ? tendenciaAtual : media);
  const projecao = totalFechados + restantes.reduce((s, c) => s + esperado(c), 0);
  const semResultado = fechados.filter((c) => c.fonte_vd === 'sem_dados' && c.fonte_loja === 'sem_dados').map((c) => c.numero);
  // Ciclos fechados sem o resultado de algum canal (VD ou Loja): o acumulado fica menor que o real.
  const pendencias = fechados
    .map((c) => ({ numero: c.numero, canais: [c.fonte_vd === 'sem_dados' && 'VD', c.fonte_loja === 'sem_dados' && 'Loja'].filter(Boolean) }))
    .filter((c) => c.canais.length);

  const alvo = (meta) => {
    const falta = Math.max(meta - total, 0);
    return { meta, falta, porCiclo: restantes.length ? falta / restantes.length : 0, batida: total >= meta, projetaBater: projecao >= meta };
  };

  let acumulado = 0;
  const grafico = ciclos.map((c) => {
    acumulado += c.numero <= numeroAtual ? c.total : 0;
    return {
      rotulo: rotuloCiclo(c.numero),
      numero: c.numero,
      vd: c.vd,
      loja: c.loja,
      total: c.total,
      parcial: c.numero === numeroAtual,
      futuro: c.numero > numeroAtual,
      semResultado: semResultado.includes(c.numero),
      acumulado: c.numero <= numeroAtual ? acumulado : null,
    };
  });
  // Projeção: parte do último ciclo fechado e soma o esperado de cada ciclo que falta.
  let acumuladoProjecao = totalFechados;
  for (const ponto of grafico) {
    if (ponto.numero === numeroAtual - 1) ponto.projecao = totalFechados;
    if (ponto.numero >= numeroAtual) {
      acumuladoProjecao += esperado(ciclos.find((c) => c.numero === ponto.numero));
      ponto.projecao = acumuladoProjecao;
    }
  }

  return {
    ciclos, numeroAtual, emAndamento, total, media, mediaCiclos: ultimos.map((c) => c.numero), projecao, restantes,
    semResultado, pendencias, grafico, tendenciaAtual, a106: alvo(meta106), a109: alvo(meta109),
  };
}

function DicaGrafico({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const ponto = payload[0]?.payload || {};
  return (
    <div className="rounded-xl border border-gray-100 bg-white/95 backdrop-blur px-3.5 py-2.5 shadow-lg text-xs">
      <p className="font-semibold text-gray-800">{label}{ponto.parcial ? ' • em andamento' : ponto.futuro ? ' • ainda não começou' : ''}</p>
      {ponto.semResultado ? <p className="mt-1 font-semibold text-[#b42335]">Sem resultado lançado</p> : (
        <div className="mt-1.5 space-y-0.5 font-semibold">
          <p className="flex justify-between gap-4"><span className="text-gray-400">Venda Direta</span><span style={{ color: COR_VD }}>{emMilhoes(ponto.vd)}</span></p>
          <p className="flex justify-between gap-4"><span className="text-gray-400">Loja</span><span className="text-[#2a9aa0]">{emMilhoes(ponto.loja)}</span></p>
          <p className="flex justify-between gap-4 border-t border-gray-100 pt-1 mt-1"><span className="text-gray-500">Total</span><span className="text-gray-800">{emMilhoes(ponto.total)}</span></p>
        </div>
      )}
    </div>
  );
}

function DicaAcumulado({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const ponto = payload[0]?.payload || {};
  return (
    <div className="rounded-xl border border-gray-100 bg-white/95 backdrop-blur px-3.5 py-2.5 shadow-lg text-xs font-semibold">
      <p className="font-semibold text-gray-800">Até o {label}</p>
      {ponto.acumulado !== null && ponto.acumulado !== undefined && <p className="mt-1 flex justify-between gap-4"><span className="text-gray-400">Realizado</span><span style={{ color: COR_VD }}>{emMilhoes(ponto.acumulado)}</span></p>}
      {ponto.projecao != null && (ponto.parcial || ponto.futuro) && (
        <p className="mt-0.5 flex justify-between gap-4"><span className="text-gray-400">No ritmo atual</span><span className="text-[#b86a00]">{emMilhoes(ponto.projecao)}</span></p>
      )}
    </div>
  );
}

function CartaoMeta({ titulo, cor, alvo, restantes, media, numeroAtual }) {
  const folga = media > 0 ? (media / (alvo.porCiclo || 1)) * 100 : 0;
  return (
    <article className="rounded-[24px] bg-white border border-gray-100 shadow-sm p-5 sm:p-6 flex flex-col">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: cor }}>{titulo}</p>
        {alvo.batida ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2.5 py-1 text-[10px] font-semibold text-green-700"><CheckCircle size={12} /> Batida</span>
        ) : alvo.projetaBater ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#e3f3f3] px-2.5 py-1 text-[10px] font-semibold text-[#036b70]"><TrendingUp size={12} /> No ritmo</span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#fff4e5] px-2.5 py-1 text-[10px] font-semibold text-[#b86a00]"><AlertTriangle size={12} /> Precisa acelerar</span>
        )}
      </div>
      {alvo.batida ? (
        <p className="mt-3 text-2xl sm:text-3xl font-bold text-gray-800">Meta alcançada 🎉</p>
      ) : (
        <>
          <p className="mt-3 text-[11px] font-semibold text-gray-400">Faltam</p>
          <p className="text-2xl sm:text-3xl font-bold tabular-nums text-gray-800">{emMilhoes(alvo.falta)}</p>
          {restantes.length > 0 && (
            <div className="mt-4 rounded-2xl bg-[#f7faf9] border border-[#e7efee] p-3.5">
              <p className="text-[11px] font-semibold text-gray-500">
                Precisa vender, em média, <strong className="text-gray-800 tabular-nums">{emMilhoes(alvo.porCiclo)}</strong> por ciclo
                {' '}nos {restantes.length === 1 ? 'ciclo que falta' : `${restantes.length} ciclos que faltam`} ({rotuloCiclo(numeroAtual)} a {rotuloCiclo(ULTIMO_CICLO)}).
              </p>
              {media > 0 && (
                <>
                  <div className="mt-2.5 h-2 rounded-full bg-gray-200/70 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${limitar(folga)}%`, background: cor }} /></div>
                  <p className="mt-1.5 text-[10px] font-semibold text-gray-400">Média dos últimos ciclos: <span className="text-gray-600 tabular-nums">{emMilhoes(media)}</span> ({emPercentual(folga)} do necessário)</p>
                </>
              )}
            </div>
          )}
        </>
      )}
    </article>
  );
}

export default function ResultadoGeralCampanha2026({ ciclosAno = [], calendario = [], metas = {}, carregando = false, aoLancar = null }) {
  const meta106 = Number(metas?.meta_principal || 106000000);
  const meta109 = Number(metas?.meta_superacao || 109000000);
  const p = useMemo(() => montarPainel(ciclosAno, calendario, meta106, meta109), [ciclosAno, calendario, meta106, meta109]);
  const pct106 = meta106 > 0 ? (p.total / meta106) * 100 : 0;
  const escalaMax = meta109 * 1.04;

  if (carregando && !p.ciclos.length) {
    return <div className="rounded-[24px] bg-white border border-gray-100 p-12 text-center text-sm font-semibold text-gray-400 shadow-sm">Carregando o resultado do CP...</div>;
  }

  const campanha = p.ciclos.filter((c) => c.numero >= 14);
  const somaCampanha = campanha.reduce((s, c) => ({ vd: s.vd + c.vd, loja: s.loja + c.loja, total: s.total + c.total }), { vd: 0, loja: 0, total: 0 });
  const somaAno = p.ciclos.reduce((s, c) => ({ vd: s.vd + c.vd, loja: s.loja + c.loja }), { vd: 0, loja: 0 });

  return (
    <div className="space-y-5 sm:space-y-6">
      {p.pendencias.length > 0 && (
        <div className="rounded-2xl border border-[#ffd9a8] bg-[#fff8ee] px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <p className="flex-1 text-xs sm:text-sm font-semibold text-[#8a5300] flex items-start gap-2">
            <AlertTriangle size={17} className="shrink-0 mt-0.5" />
            <span>Ainda falta resultado em {p.pendencias.map((c) => `${rotuloCiclo(c.numero)} (${c.canais.join(' e ')})`).join(', ')}. Enquanto isso, o acumulado fica menor e o “quanto falta” fica maior do que o real.</span>
          </p>
          {aoLancar && <button type="button" onClick={aoLancar} className="shrink-0 rounded-xl bg-[#b86a00] px-4 py-2 text-xs font-semibold text-white hover:bg-[#9a5800]">Lançar agora</button>}
        </div>
      )}

      {/* Acumulado + quanto falta */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <article className="relative overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#022f32_0%,#046b70_60%,#0b9ba1_100%)] text-white p-5 sm:p-6 shadow-[0_24px_50px_-30px_rgba(2,47,50,.8)]">
          <div className="pointer-events-none absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
          <p className="relative text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.06em] text-[#bff3f2]">Acumulado 2026 • VD + Loja</p>
          <p className="relative mt-2 text-3xl sm:text-4xl font-bold tabular-nums">{emMilhoes(p.total)}</p>
          <p className="relative mt-1 text-xs font-semibold text-white/70">{emPercentual(pct106)} da meta de 106 MM</p>
          <div className="relative mt-8">
            <div className="h-3 rounded-full bg-white/15 overflow-hidden">
              <div className="h-full rounded-full bg-white transition-[width] duration-1000 ease-out" style={{ width: `${limitar((p.total / escalaMax) * 100)}%` }} />
            </div>
            {/* 106 e 109 ficam muito perto: o rótulo do 106 vai acima da barra e o do 109 abaixo. */}
            {[{ v: meta106, r: '106', acima: true }, { v: meta109, r: '109', acima: false }].map(({ v, r, acima }) => (
              <div key={r} className="absolute top-0 -translate-x-1/2" style={{ left: `${(v / escalaMax) * 100}%` }}>
                <span className="absolute left-1/2 -translate-x-1/2 -top-1 w-0.5 h-5 bg-[#ffd9a8]" />
                <span className={`absolute whitespace-nowrap text-[10px] font-semibold text-[#ffe7c7] ${acima ? '-top-5 right-0' : 'top-5 right-0'}`}>{r} MM</span>
              </div>
            ))}
          </div>
          <div className="relative mt-9 rounded-2xl bg-white/10 border border-white/15 p-3.5">
            <p className="text-[11px] font-semibold text-white/75 flex items-center gap-1.5"><TrendingUp size={14} /> No ritmo atual, o ano fecha em</p>
            <p className="mt-1 text-xl font-bold tabular-nums">{emMilhoes(p.projecao)}</p>
            <p className="mt-1 text-[10px] font-semibold text-white/60">
              {p.mediaCiclos.length ? `Usa a média de ${p.mediaCiclos.map(rotuloCiclo).join(', ')} nos ciclos que faltam` : 'Sem ciclos anteriores para calcular o ritmo'}
              {p.tendenciaAtual !== null ? ` e a tendência do ${rotuloCiclo(p.numeroAtual)}.` : '.'}
            </p>
          </div>
        </article>
        <CartaoMeta titulo="Para chegar a 106 MM • Viagem" cor={COR_106} alvo={p.a106} restantes={p.restantes} media={p.media} numeroAtual={p.numeroAtual} />
        <CartaoMeta titulo="Para chegar a 109 MM • Bônus" cor={COR_109} alvo={p.a109} restantes={p.restantes} media={p.media} numeroAtual={p.numeroAtual} />
      </section>

      {/* Ciclo a ciclo */}
      <section className="rounded-[24px] bg-white border border-gray-100 shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#048187]">Ciclo a ciclo</p>
            <h2 className="mt-1 text-lg sm:text-xl font-bold text-gray-800">Quanto o CP vendeu em cada ciclo de 2026</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-gray-500">
            <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: COR_VD }} /> Venda Direta</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: COR_LOJA }} /> Loja</span>
            {!p.a106.batida && p.restantes.length > 0 && <span className="inline-flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed" style={{ borderColor: COR_106 }} /> Necessário p/ 106</span>}
          </div>
        </div>
        <div className="h-[260px] sm:h-[320px] -mx-2 sm:mx-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={p.grafico} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f2" />
              <XAxis dataKey="rotulo" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={0} tickFormatter={(r) => r.replace('C', '')} />
              <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={44} tickFormatter={(v) => `${(v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}Mi`} />
              <Tooltip content={<DicaGrafico />} cursor={{ fill: 'rgba(4,129,135,.06)' }} />
              <Bar dataKey="vd" stackId="t" fill={COR_VD} maxBarSize={34}>
                {p.grafico.map((ponto) => <Cell key={ponto.numero} fillOpacity={ponto.parcial ? 0.55 : 1} />)}
              </Bar>
              <Bar dataKey="loja" stackId="t" fill={COR_LOJA} radius={[6, 6, 0, 0]} maxBarSize={34}>
                {p.grafico.map((ponto) => <Cell key={ponto.numero} fillOpacity={ponto.parcial ? 0.55 : 1} />)}
              </Bar>
              {!p.a106.batida && p.restantes.length > 0 && (
                <ReferenceLine y={p.a106.porCiclo} stroke={COR_106} strokeDasharray="6 4" strokeWidth={1.5} ifOverflow="extendDomain" label={{ value: emMilhoes(p.a106.porCiclo, 1), position: 'insideTopLeft', fontSize: 10, fontWeight: 800, fill: COR_106 }} />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-[11px] font-semibold text-gray-400">
          Barra mais clara = ciclo em andamento.{p.semResultado.length > 0 ? ` Sem barra = ciclo sem resultado lançado (${p.semResultado.map(rotuloCiclo).join(', ')}).` : ''}
        </p>
      </section>

      {/* Acumulado e projeção + VD x Loja */}
      <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-4 sm:gap-5">
        <article className="rounded-[24px] bg-white border border-gray-100 shadow-sm p-4 sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#048187]">Rumo aos 106 e 109 MM</p>
          <h2 className="mt-1 text-lg sm:text-xl font-bold text-gray-800">Acumulado do ano e projeção até o C17</h2>
          <div className="mt-4 h-[240px] sm:h-[280px] -mx-2 sm:mx-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={p.grafico} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="cg26-acumulado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COR_VD} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={COR_VD} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f2" />
                <XAxis dataKey="rotulo" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={0} tickFormatter={(r) => r.replace('C', '')} />
                <YAxis domain={[0, (max) => Math.max(max, meta109) * 1.06]} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={44} tickFormatter={(v) => `${Math.round(v / 1e6)}Mi`} />
                <Tooltip content={<DicaAcumulado />} />
                <ReferenceLine y={meta106} stroke={COR_106} strokeDasharray="5 4" label={{ value: '106 MM', position: 'insideTopLeft', fontSize: 10, fontWeight: 800, fill: COR_106 }} />
                <ReferenceLine y={meta109} stroke={COR_109} strokeDasharray="5 4" label={{ value: '109 MM', position: 'insideBottomLeft', fontSize: 10, fontWeight: 800, fill: COR_109 }} />
                <Area type="monotone" dataKey="acumulado" stroke={COR_VD} strokeWidth={2.5} fill="url(#cg26-acumulado)" connectNulls={false} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="projecao" stroke="#d98a1c" strokeWidth={2} strokeDasharray="6 5" dot={{ r: 2.5, fill: '#d98a1c' }} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] font-semibold text-gray-500">
            <span className="inline-flex items-center gap-1.5"><span className="w-4 h-0.5 rounded" style={{ background: COR_VD }} /> Realizado</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-[#d98a1c]" /> No ritmo atual</span>
          </div>
        </article>

        <article className="rounded-[24px] bg-white border border-gray-100 shadow-sm p-5 sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#048187]">Quem está puxando</p>
          <h2 className="mt-1 text-lg sm:text-xl font-bold text-gray-800">Venda Direta x Loja</h2>
          {[
            { rotulo: 'Ano de 2026', vd: somaAno.vd, loja: somaAno.loja },
            { rotulo: 'Campanha (C14 a C17)', vd: somaCampanha.vd, loja: somaCampanha.loja },
          ].map((linha) => {
            const soma = linha.vd + linha.loja;
            const pVd = soma > 0 ? (linha.vd / soma) * 100 : 0;
            return (
              <div key={linha.rotulo} className="mt-5">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-xs font-semibold text-gray-600">{linha.rotulo}</p>
                  <p className="text-xs font-semibold text-gray-800 tabular-nums">{emMilhoes(soma)}</p>
                </div>
                <div className="mt-2 flex h-3 rounded-full overflow-hidden bg-gray-100">
                  <div style={{ width: `${pVd}%`, background: COR_VD }} />
                  <div style={{ width: `${soma > 0 ? 100 - pVd : 0}%`, background: COR_LOJA }} />
                </div>
                {/* No celular, uma linha por canal; lado a lado só quando há espaço para os valores inteiros. */}
                <div className="mt-2 grid grid-cols-1 min-[420px]:grid-cols-2 gap-1.5 min-[420px]:gap-2 text-[11px] font-semibold">
                  <p className="flex items-center gap-1.5 text-gray-500 whitespace-nowrap"><Users size={13} className="shrink-0 text-[#048187]" /> VD <span className="text-gray-800 tabular-nums">{emMilhoes(linha.vd)}</span> <span className="text-gray-400">({emPercentual(pVd)})</span></p>
                  <p className="flex items-center gap-1.5 text-gray-500 whitespace-nowrap min-[420px]:justify-end"><Store size={13} className="shrink-0 text-[#2a9aa0]" /> Loja <span className="text-gray-800 tabular-nums">{emMilhoes(linha.loja)}</span> <span className="text-gray-400">({emPercentual(soma > 0 ? 100 - pVd : 0)})</span></p>
                </div>
              </div>
            );
          })}
        </article>
      </section>

      {/* Rota C14 a C17 */}
      <section className="rounded-[24px] bg-white border border-gray-100 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#048187]">Rota da campanha</p>
            <h2 className="mt-1 text-lg sm:text-xl font-bold text-gray-800">C14 a C17, ciclo por ciclo</h2>
          </div>
          {!p.a106.batida && p.restantes.length > 0 && (
            <p className="text-[11px] font-semibold text-gray-400">Barra: quanto do necessário por ciclo para os 106 MM ({emMilhoes(p.a106.porCiclo)})</p>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {(calendario.length ? calendario : [14, 15, 16, 17].map((n) => ({ numero: n, ciclo: `${n}/2026`, status: 'futuro' }))).map((item) => {
            const ciclo = p.ciclos.find((c) => c.numero === item.numero) || { vd: 0, loja: 0, total: 0 };
            const andamento = item.status === 'em_andamento';
            const encerrado = item.status === 'encerrado';
            const base = andamento && p.tendenciaAtual !== null ? p.tendenciaAtual : ciclo.total;
            const pctNecessario = p.a106.porCiclo > 0 ? (base / p.a106.porCiclo) * 100 : 0;
            return (
              <div key={item.numero} className={`rounded-2xl border p-4 ${andamento ? 'border-[#048187] bg-[#f3fafa] shadow-[0_10px_30px_-20px_rgba(4,129,135,.8)]' : encerrado ? 'border-[#dcecec] bg-white' : 'border-gray-100 bg-[#fbfbfa]'}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${andamento || encerrado ? 'bg-[#048187] text-white' : 'bg-gray-100 text-gray-400'}`}>{item.numero}</span>
                    <div>
                      <p className="text-xs font-semibold text-gray-700">Ciclo {item.numero}</p>
                      {item.data_inicio && <p className="text-[10px] font-semibold text-gray-400 flex items-center gap-1"><CalendarDays size={11} /> {dataCurta(item.data_inicio)} a {dataCurta(item.data_fim)}</p>}
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${andamento ? 'bg-[#048187] text-white' : encerrado ? 'bg-[#e3f3f3] text-[#036b70]' : 'bg-gray-100 text-gray-400'}`}>
                    {andamento ? `Dia ${item.dias_passados} de ${item.dias_total}` : encerrado ? 'Encerrado' : 'Em breve'}
                  </span>
                </div>
                <p className="mt-4 text-[10px] font-semibold uppercase tracking-wide text-gray-400">{andamento ? 'Vendido até agora' : 'Resultado'}</p>
                <p className={`text-xl font-bold tabular-nums ${item.status === 'futuro' ? 'text-gray-300' : 'text-gray-800'}`}>{emMilhoes(ciclo.total)}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] font-semibold">
                  <div className="rounded-xl bg-white border border-gray-100 px-2.5 py-1.5"><span className="block text-gray-400">VD</span><span className="text-[#048187] tabular-nums">{emMilhoes(ciclo.vd)}</span></div>
                  <div className="rounded-xl bg-white border border-gray-100 px-2.5 py-1.5"><span className="block text-gray-400">Loja</span><span className="text-[#2a9aa0] tabular-nums">{emMilhoes(ciclo.loja)}</span></div>
                </div>
                {item.status !== 'futuro' && p.a106.porCiclo > 0 && (
                  <div className="mt-3">
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${limitar(pctNecessario)}%`, background: pctNecessario >= 100 ? '#16a34a' : COR_106 }} /></div>
                    <p className="mt-1.5 text-[10px] font-semibold text-gray-500">
                      {andamento && p.tendenciaAtual !== null ? <>Tendência {emMilhoes(p.tendenciaAtual)} • </> : null}
                      <span className="tabular-nums">{emPercentual(pctNecessario)}</span> do necessário
                    </p>
                  </div>
                )}
                {item.status === 'futuro' && <p className="mt-3 text-[10px] font-semibold text-gray-400 flex items-center gap-1"><Flag size={11} /> Começa em {dataCurta(item.data_inicio)}</p>}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
