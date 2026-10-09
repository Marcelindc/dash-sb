import { useEffect, useMemo, useState } from 'react';
import { Check, Crown, Flame, Gem, Lock, Medal, Plane, Sparkles, Star, Target, Timer, Trophy } from 'lucide-react';
import { FONTE, prefereMenosMovimento } from '../celebracao/efeitos';
import { NIVEIS, criteriosValidos, dataCurta, meta, montarSelos, percentualCriterio, rotuloCiclo, textoMissao } from './jornadaComum';

// "Minha jornada" da Campanha Incentivo 2026, no estilo de app gamificado (referências do usuário em 07/10/2026:
// Duolingo / FitOn). Placar no topo, trilha C14 → C17 → Santo Amaro, missões do ciclo (os indicadores) e selos.
// Selo: um por indicador; sobe de nível a cada ciclo ENCERRADO com o indicador batido (Bronze → Prata → Ouro →
// Diamante). No ciclo em andamento o selo aparece "em jogo": só vale se continuar batido no fechamento.

const MASCOTES = '/campanha-incentivo-2026/mascotes';

const ESTILO = `
  .jornada-camp { font-family: ${FONTE}; }
  .jornada-camp .jc-surgir { animation: jcSurgir .5s cubic-bezier(.2,1.1,.4,1) both; }
  @keyframes jcSurgir { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
  .jornada-camp .jc-quicar { animation: jcQuicar 1.6s ease-in-out infinite; }
  @keyframes jcQuicar { 0%, 100% { transform: translate(-50%, 0); } 50% { transform: translate(-50%, -6px); } }
  .jornada-camp .jc-flutuar { animation: jcFlutuar 4.5s ease-in-out infinite; }
  @keyframes jcFlutuar { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
  .jornada-camp .jc-pulso { animation: jcPulso 2s ease-out infinite; }
  @keyframes jcPulso { 0% { transform: scale(.85); opacity: .7; } 100% { transform: scale(1.35); opacity: 0; } }
  .jornada-camp .jc-brilho { position: relative; overflow: hidden; }
  .jornada-camp .jc-brilho::after { content: ''; position: absolute; inset: -40% auto -40% -60%; width: 40%; transform: rotate(20deg);
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.65), transparent); animation: jcBrilho 3.2s ease-in-out infinite; }
  @keyframes jcBrilho { 0%, 55% { left: -60%; } 100% { left: 130%; } }
  .jornada-camp .jc-em-jogo { animation: jcEmJogo 1.8s ease-in-out infinite; }
  @keyframes jcEmJogo { 0%, 100% { filter: drop-shadow(0 0 0 rgba(45,212,191,0)); } 50% { filter: drop-shadow(0 0 10px rgba(45,212,191,.8)); } }
  .jornada-camp .jc-hex { clip-path: polygon(50% 0, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%); }
  @media (prefers-reduced-motion: reduce) {
    .jornada-camp .jc-surgir, .jornada-camp .jc-quicar, .jornada-camp .jc-flutuar, .jornada-camp .jc-pulso,
    .jornada-camp .jc-em-jogo, .jornada-camp .jc-brilho::after { animation: none; }
    .jornada-camp .jc-quicar { transform: translate(-50%, 0); }
  }
`;

/** Selo hexagonal: moldura na cor do nível, miolo na cor do indicador. */
export function Selo({ selo, tamanho = 76 }) {
  const info = selo.especial ? { cor: selo.cor, escura: selo.escura, icone: selo.especial } : meta(selo.chave);
  const Icone = info.icone;
  const conquistado = selo.nivel > 0;
  const nivel = NIVEIS[selo.nivel];
  const ativo = conquistado || selo.emJogo;
  return (
    <div className="flex flex-col items-center text-center" title={selo.dica}>
      <div className={`relative ${selo.emJogo && !conquistado ? 'jc-em-jogo' : ''}`} style={{ width: tamanho, height: tamanho * 1.08 }}>
        <div className={`jc-hex absolute inset-0 ${conquistado ? 'jc-brilho' : ''}`}
          style={{ background: conquistado ? nivel.borda : selo.emJogo ? 'linear-gradient(145deg,#99f6e4,#14b8a6)' : '#e2e8f0' }} />
        <div className="jc-hex absolute flex items-center justify-center"
          style={{ inset: tamanho * 0.09, background: ativo ? `linear-gradient(160deg, ${info.cor}, ${info.escura})` : '#f1f5f9' }}>
          {ativo ? <Icone size={tamanho * 0.36} color="#fff" strokeWidth={2.3} /> : <Lock size={tamanho * 0.3} color="#94a3b8" strokeWidth={2.2} />}
        </div>
        {conquistado && selo.nivel > 1 && (
          <span className="absolute -right-1 bottom-1 min-w-[24px] h-6 px-1 rounded-full bg-white border-2 text-[11px] font-extrabold flex items-center justify-center shadow-sm"
            style={{ borderColor: info.cor, color: info.escura }}>×{selo.nivel}</span>
        )}
        {selo.emJogo && !conquistado && (
          <span className="absolute left-1/2 -translate-x-1/2 -bottom-2 whitespace-nowrap rounded-full bg-teal-500 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white shadow">em jogo</span>
        )}
      </div>
      <p className={`mt-2.5 text-[12px] font-extrabold leading-tight ${ativo ? 'text-slate-800' : 'text-slate-400'}`}>{selo.nome}</p>
      <p className={`text-[10px] font-bold leading-tight mt-0.5 ${conquistado ? '' : 'text-slate-400'}`} style={conquistado ? { color: info.escura } : undefined}>
        {conquistado ? nivel.nome : selo.emJogo ? 'Vale no fechamento' : 'Bloqueado'}
      </p>
    </div>
  );
}

/** Anel de progresso em volta do nó da trilha. */
function Anel({ percentual, cor, tamanho, espessura = 7 }) {
  const raio = tamanho / 2 - espessura / 2 - 1;
  const circ = 2 * Math.PI * raio;
  const [p, setP] = useState(() => (prefereMenosMovimento() ? percentual : 0));
  useEffect(() => {
    const t = requestAnimationFrame(() => setP(percentual));
    return () => cancelAnimationFrame(t);
  }, [percentual]);
  return (
    <svg width={tamanho} height={tamanho} className="absolute inset-0 -rotate-90" aria-hidden="true">
      <circle cx={tamanho / 2} cy={tamanho / 2} r={raio} fill="none" stroke="#e2e8f0" strokeWidth={espessura} />
      <circle cx={tamanho / 2} cy={tamanho / 2} r={raio} fill="none" stroke={cor} strokeWidth={espessura} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - Math.min(Math.max(p, 0), 100) / 100)}
        style={{ transition: 'stroke-dashoffset 1.3s cubic-bezier(.2,.8,.2,1)' }} />
    </svg>
  );
}

const ESTADO_NO = {
  bateu: { fundo: '#f2c14e', sombra: '#b8860b', icone: Crown, cor: '#fff', texto: 'Batido!' },
  nao_bateu: { fundo: '#cbd5e1', sombra: '#94a3b8', icone: Target, cor: '#64748b', texto: 'Não bateu' },
  sem_dados: { fundo: '#cbd5e1', sombra: '#94a3b8', icone: Target, cor: '#64748b', texto: 'Sem dados' },
  batendo: { fundo: '#22c55e', sombra: '#15803d', icone: Check, cor: '#fff', texto: 'Segura até o fim!' },
  em_andamento: { fundo: '#0f9aa1', sombra: '#036b70', icone: Star, cor: '#fff', texto: 'Agora' },
  futuro: { fundo: '#e2e8f0', sombra: '#cbd5e1', icone: Lock, cor: '#94a3b8', texto: 'Em breve' },
};

/** Trilha estilo Duolingo: C14 → C17 em zigue-zague e o prêmio (Santo Amaro) no fim. */
function Trilha({ ciclos, selecionado, aoSelecionar, classificado, fora }) {
  const deslocamentos = [0, 56, 0, -56];
  // A mascote acompanha o ciclo em andamento (sem ciclo aberto: o último que já começou).
  const indiceAtual = ciclos.findIndex((c) => c.situacao_ciclo === 'em_andamento');
  const indiceMascote = indiceAtual >= 0 ? indiceAtual : Math.max(0, ciclos.map((c) => c.status !== 'futuro').lastIndexOf(true));
  return (
    <div className="relative flex flex-col items-center pt-5 pb-4">
      {ciclos.map((c, i) => {
        const estado = ESTADO_NO[c.status] || ESTADO_NO.futuro;
        const Icone = estado.icone;
        const total = criteriosValidos(c).length;
        const batidos = criteriosValidos(c).filter((cr) => cr.ok).length;
        const atual = c.situacao_ciclo === 'em_andamento';
        const ativo = c.status !== 'futuro';
        const marcado = selecionado === c.numero;
        return (
          <div key={c.numero} className="relative flex flex-col items-center" style={{ transform: `translateX(${deslocamentos[i % 4]}px)`, marginBottom: 42, marginTop: atual ? 40 : 0 }}>
            {atual && (
              <span className="jc-quicar absolute left-1/2 -top-10 z-[2] whitespace-nowrap rounded-xl border-2 border-slate-200 bg-white px-3 py-1 text-[12px] font-extrabold uppercase tracking-wide shadow-sm"
                style={{ color: estado.sombra }}>
                {estado.texto}
                <span className="absolute left-1/2 -bottom-[7px] -translate-x-1/2 w-3 h-3 rotate-45 bg-white border-b-2 border-r-2 border-slate-200" />
              </span>
            )}
            {i === indiceMascote && (
              // Do lado com espaço: na curva para a esquerda (C17) ela fica à direita, apontando para o nó.
              <div aria-hidden="true" className={`pointer-events-none absolute top-[40px] z-[1] ${deslocamentos[i % 4] < 0 ? '' : '-scale-x-100'}`}
                style={deslocamentos[i % 4] < 0 ? { left: 'calc(100% + 26px)' } : { right: 'calc(100% + 26px)' }}>
                <img src={`${MASCOTES}/ela-apontando.webp`} alt="" className="jc-flutuar w-[66px] sm:w-[78px] max-w-none" />
              </div>
            )}
            <button type="button" onClick={() => ativo && aoSelecionar(c.numero)} disabled={!ativo}
              aria-label={`${rotuloCiclo(c.numero)}: ${estado.texto}`} aria-pressed={marcado}
              className="relative w-[104px] h-[104px] rounded-full disabled:cursor-default">
              {(atual || marcado) && ativo && <Anel percentual={total ? (batidos / total) * 100 : 0} cor={c.status === 'batendo' ? '#22c55e' : '#2dd4bf'} tamanho={104} espessura={7} />}
              {/* Botão 70px com a base 3D de 5px: o conjunto (botão + base) fica no centro do anel. */}
              <span className={`absolute rounded-full flex items-center justify-center transition-transform active:translate-y-[3px] ${ativo ? 'hover:brightness-105' : ''}`}
                style={{ top: 14.5, bottom: 19.5, left: 17, right: 17, background: estado.fundo, boxShadow: `0 5px 0 ${estado.sombra}` }}>
                <Icone size={30} color={estado.cor} strokeWidth={2.6} fill={c.status === 'bateu' || c.status === 'em_andamento' ? estado.cor : 'none'} />
              </span>
            </button>
            <p className={`mt-2 text-[13px] font-extrabold ${ativo ? 'text-slate-800' : 'text-slate-400'}`}>{rotuloCiclo(c.numero)}</p>
            <p className="text-[11px] font-bold text-slate-400">{ativo && total ? `${batidos}/${total} metas` : dataCurta(c.data_inicio) ? `começa ${dataCurta(c.data_inicio)}` : 'em breve'}</p>
          </div>
        );
      })}
      {/* Prêmio no fim da trilha */}
      <div className="relative flex flex-col items-center mt-1">
        <span className={`relative w-[104px] h-[104px] rounded-[28px] flex items-center justify-center ${classificado ? 'jc-brilho' : ''}`}
          style={{ background: classificado ? 'linear-gradient(160deg,#fde68a,#f59e0b)' : fora ? '#f1f5f9' : 'linear-gradient(160deg,#ccfbf1,#5eead4)', boxShadow: `0 7px 0 ${classificado ? '#b45309' : fora ? '#cbd5e1' : '#0f9aa1'}` }}>
          <Plane size={40} color={classificado ? '#fff' : fora ? '#94a3b8' : '#036b70'} strokeWidth={2.4} />
          {!classificado && <span className="absolute -right-2 -top-2 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center"><Lock size={15} className="text-slate-400" /></span>}
        </span>
        <p className="mt-3 text-[13px] font-extrabold text-slate-800">Santo Amaro</p>
        <p className="text-[11px] font-bold text-slate-400">{classificado ? 'Viagem garantida!' : fora ? 'Fora da viagem' : 'Bata tudo do C14 ao C17'}</p>
      </div>
    </div>
  );
}

function Placar({ pessoa, sequencia, selosConquistados, selosEmJogo }) {
  const sup = pessoa?.superacao || {};
  const viagem = pessoa?.status_106 === 'classificado' ? 'Garantida' : pessoa?.status_106 === 'fora' ? 'Fora' : 'Na disputa';
  const itens = [
    { icone: Flame, cor: '#f97316', valor: sequencia, rotulo: sequencia === 1 ? 'ciclo batido' : 'ciclos batidos' },
    { icone: Medal, cor: '#d4a017', valor: selosConquistados, rotulo: selosEmJogo ? `selos • ${selosEmJogo} em jogo` : 'selos' },
    { icone: Plane, cor: '#0f9aa1', valor: viagem, rotulo: 'viagem 106' },
    { icone: Gem, cor: '#a855f7', valor: `${Math.floor(Number(sup.percentual || 0))}%`, rotulo: 'rumo aos 120%' },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
      {itens.map(({ icone: Icone, cor, valor, rotulo }) => (
        <div key={rotulo} className="flex items-center gap-2.5 rounded-2xl bg-white/95 px-3 py-2.5 shadow-[0_4px_0_rgba(0,0,0,.08)]">
          <span className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center" style={{ background: `${cor}1f` }}>
            <Icone size={20} color={cor} strokeWidth={2.5} fill={Icone === Flame && Number(valor) > 0 ? cor : 'none'} />
          </span>
          <span className="min-w-0">
            <span className="block text-[17px] font-extrabold leading-none text-slate-800 truncate">{valor}</span>
            <span className="block mt-1 text-[10px] font-bold uppercase tracking-wide leading-tight text-slate-400">{rotulo}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function Missoes({ ciclo, calendario }) {
  const cal = (calendario || []).find((c) => c.numero === ciclo?.numero) || {};
  const aberto = ciclo?.situacao_ciclo === 'em_andamento';
  const dias = Math.max(Number(cal.dias_total || 0) - Number(cal.dias_passados || 0), 0);
  const criterios = criteriosValidos(ciclo);
  const semMeta = (ciclo?.criterios || []).filter((c) => c.sem_meta);
  const batidas = criterios.filter((c) => c.ok).length;
  return (
    <section className="rounded-[26px] border-2 border-slate-100 bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-800">Missões do {rotuloCiclo(ciclo?.numero)}</h3>
          {aberto ? (
            <p className="mt-0.5 inline-flex items-center gap-1 text-[12px] font-extrabold text-orange-500"><Timer size={14} /> {dias <= 1 ? 'Último dia!' : `${dias} dias restantes`}</p>
          ) : (
            <p className="mt-0.5 text-[12px] font-bold text-slate-400">Ciclo encerrado em {dataCurta(cal.data_fim)}</p>
          )}
        </div>
        <span className="shrink-0 rounded-2xl bg-slate-50 border border-slate-100 px-3 py-1.5 text-center">
          <span className="block text-lg font-extrabold leading-none text-slate-800">{batidas}/{criterios.length}</span>
          <span className="block text-[9px] font-bold uppercase tracking-wide text-slate-400 mt-0.5">cumpridas</span>
        </span>
      </div>
      <div className="mt-4 divide-y divide-slate-100">
        {criterios.map((c) => {
          const info = meta(c.chave);
          const Icone = info.icone;
          const pct = Math.min(Math.max(percentualCriterio(c), 0), 100);
          const txt = textoMissao(c);
          return (
            <div key={c.chave} className="flex items-center gap-3 py-3">
              <span className="w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(160deg, ${info.cor}, ${info.escura})`, boxShadow: `0 4px 0 ${info.escura}55` }}>
                <Icone size={22} color="#fff" strokeWidth={2.4} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[14px] font-extrabold text-slate-800 truncate">{c.rotulo || info.nome}</p>
                  <p className="shrink-0 text-[12px] font-extrabold tabular-nums text-slate-600">{txt.progresso}</p>
                </div>
                <div className="mt-1.5 h-3.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full transition-[width] duration-1000" style={{ width: `${c.ok ? 100 : pct}%`, background: c.ok ? 'linear-gradient(90deg,#22c55e,#16a34a)' : `linear-gradient(90deg, ${info.cor}, ${info.escura})` }} />
                </div>
                <p className={`mt-1 text-[11px] font-bold ${c.ok ? 'text-green-600' : 'text-slate-500'}`}>{txt.falta}</p>
              </div>
              <span className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center border-2 ${c.ok ? 'bg-green-50 border-green-200 text-green-600' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                {c.ok ? <Check size={18} strokeWidth={3} /> : <Medal size={18} />}
              </span>
            </div>
          );
        })}
        {semMeta.map((c) => {
          const Icone = meta(c.chave).icone;
          return (
            <div key={c.chave} className="flex items-center gap-3 py-3 opacity-70">
              <span className="w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center bg-slate-100"><Icone size={22} className="text-slate-400" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-extrabold text-slate-500 truncate">{c.rotulo || meta(c.chave).nome}</p>
                <p className="text-[11px] font-bold text-slate-400">Sem meta cadastrada neste ciclo: não conta como missão.</p>
              </div>
            </div>
          );
        })}
        {!criterios.length && !semMeta.length && <p className="py-6 text-center text-sm font-bold text-slate-400">As missões deste ciclo aparecem quando ele começar.</p>}
      </div>
      {aberto && criterios.length > 0 && (
        <p className="mt-3 rounded-2xl bg-[#e6f6f7] px-3.5 py-2.5 text-[12px] font-bold text-[#036b70]">
          Missão cumprida só vale se continuar batida no fechamento do ciclo ({dataCurta(cal.data_fim)}).
        </p>
      )}
    </section>
  );
}

// visitante: um gestor olhando a jornada de outra pessoa/unidade (sem o "Bora, fulano!").
export default function JornadaCampanha2026({ pessoa, calendario = [], visitante = false }) {
  const ciclos = useMemo(() => (pessoa?.ciclos || []).map((c) => ({ ...c, ...((calendario || []).find((k) => k.numero === c.numero) || {}), status: c.status, situacao_ciclo: c.situacao_ciclo })), [pessoa, calendario]);
  const padrao = (ciclos.find((c) => c.situacao_ciclo === 'em_andamento') || [...ciclos].reverse().find((c) => c.status !== 'futuro') || ciclos[0])?.numero;
  const [selecionado, setSelecionado] = useState(padrao);
  const cicloSelecionado = ciclos.find((c) => c.numero === selecionado) || ciclos.find((c) => c.numero === padrao);
  const selos = useMemo(() => montarSelos(pessoa), [pessoa]);
  const todosSelos = [...selos.porIndicador, ...selos.especiais];
  const conquistados = todosSelos.filter((s) => s.nivel > 0).length;
  const emJogo = todosSelos.filter((s) => s.nivel === 0 && s.emJogo).length;
  let sequencia = 0;
  ciclos.filter((c) => c.situacao_ciclo === 'encerrado').forEach((c) => { sequencia = c.status === 'bateu' ? sequencia + 1 : 0; });
  const cicloAtual = ciclos.find((c) => c.situacao_ciclo === 'em_andamento');
  const capitalizar = (t) => String(t || '').toLowerCase().replace(/(^|\s)\S/g, (l) => l.toUpperCase());
  const partesNome = String(pessoa?.nome || '').trim().split(/\s+/);
  const nomeExibido = pessoa?.tipo === 'unidade' ? capitalizar(pessoa?.nome) : capitalizar(partesNome[0]);
  const nomeCurto = pessoa?.tipo === 'unidade' ? nomeExibido : capitalizar([partesNome[0], partesNome.length > 1 ? partesNome[partesNome.length - 1] : ''].join(' '));

  if (!pessoa) return null;
  return (
    <div className="jornada-camp space-y-4 sm:space-y-5">
      <style>{ESTILO}</style>

      {/* Placar */}
      <header className="jc-surgir relative overflow-hidden rounded-[28px] px-4 pt-5 pb-4 sm:px-6 sm:pt-6 sm:pb-5 text-white"
        style={{ background: 'linear-gradient(135deg,#02393c 0%,#048187 55%,#22c55e 130%)' }}>
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 w-64 h-64 rounded-full bg-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute right-24 -bottom-24 w-56 h-56 rounded-full bg-white/5" />
        <div className="relative flex items-end justify-between gap-3">
          <div className="min-w-0 pb-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">
              {pessoa?.tipo === 'unidade' ? 'Jornada da unidade' : visitante ? 'Jornada' : 'Minha jornada'}{cicloAtual ? ` • ${rotuloCiclo(cicloAtual.numero)}` : ''}
            </p>
            <h2 className="mt-1.5 text-[26px] sm:text-[34px] font-extrabold leading-[1.05] tracking-[-0.02em]">
              {pessoa?.tipo === 'unidade' || visitante ? nomeCurto : `Bora, ${nomeExibido}!`}
            </h2>
            <p className="mt-1.5 text-[13px] font-semibold text-white/80">
              {visitante && pessoa?.tipo !== 'unidade' && pessoa?.unidade ? `${capitalizar(pessoa.unidade)} • ` : ''}
              {pessoa?.status_106 === 'fora'
                ? 'A viagem ficou para a próxima, mas o bônus de 120% ainda está em jogo.'
                : pessoa?.tipo === 'unidade' ? 'Resultado da unidade: missões de cada ciclo, selos e a trilha até Santo Amaro.'
                : 'Cumpra as missões de cada ciclo, junte selos e garanta a viagem para Santo Amaro.'}
            </p>
          </div>
          <img src={`${MASCOTES}/ele-pulando.webp`} alt="" aria-hidden="true" className="jc-flutuar shrink-0 w-[84px] sm:w-[120px] -mb-4 drop-shadow-[0_14px_20px_rgba(0,0,0,.35)]" />
        </div>
        <div className="relative mt-1"><Placar pessoa={pessoa} sequencia={sequencia} selosConquistados={conquistados} selosEmJogo={emJogo} /></div>
      </header>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)] items-start">
        {/* Trilha */}
        <section className="jc-surgir rounded-[26px] border-2 border-slate-100 bg-[linear-gradient(180deg,#f8fdfd,#ffffff)] px-3 pb-3 lg:sticky lg:top-4" style={{ animationDelay: '.08s' }}>
          <div className="flex items-center justify-between px-2 pt-4">
            <h3 className="text-lg font-extrabold text-slate-800">Trilha da viagem</h3>
            <span className="text-[11px] font-bold text-slate-400">toque no ciclo</span>
          </div>
          <div className="relative">
            <Trilha ciclos={ciclos} selecionado={cicloSelecionado?.numero} aoSelecionar={setSelecionado}
              classificado={pessoa?.status_106 === 'classificado'} fora={pessoa?.status_106 === 'fora'} />
          </div>
        </section>

        <div className="space-y-4 sm:space-y-5 min-w-0">
          <div className="jc-surgir" style={{ animationDelay: '.14s' }}><Missoes ciclo={cicloSelecionado} calendario={calendario} /></div>

          {/* Selos */}
          <section className="jc-surgir rounded-[26px] border-2 border-slate-100 bg-white p-4 sm:p-5" style={{ animationDelay: '.2s' }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 inline-flex items-center gap-2"><Trophy size={20} className="text-[#d4a017]" /> Meus selos</h3>
                <p className="mt-0.5 text-[12px] font-semibold text-slate-400">Cada ciclo batido sobe o selo de nível: Bronze, Prata, Ouro e Diamante.</p>
              </div>
              <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-[12px] font-extrabold text-amber-700"><Sparkles size={14} /> {conquistados}/{todosSelos.length}</span>
            </div>
            <div className="mt-5 grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-5 gap-x-3 gap-y-6">
              {todosSelos.map((selo) => <Selo key={selo.id} selo={selo} />)}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
