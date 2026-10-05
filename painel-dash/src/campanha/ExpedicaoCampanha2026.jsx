import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  AlertCircle, ArrowLeft, BadgeDollarSign, CalendarClock, Check, Coins, Droplets, Flag, Layers, Lock, MapPin, Minus,
  Package, Palette, Receipt, RefreshCw, Rocket, Scissors, Search, ShoppingBag, Store, Target, Ticket, Trophy,
  TrendingUp, UserCheck, Users, X,
} from 'lucide-react';

// "Sua Expedição" (Campanha Incentivo 2026, fase 1 da gamificação):
// - mapa da jornada C14 → C17 → Santo Amaro, com o foguete na fase atual;
// - os indicadores do ciclo viram missões, com quanto falta e o ritmo por dia;
// - a missão bônus (120% da receita somada) e o combustível da empresa (CP rumo a 106/109 MM);
// - gestores veem a tripulação e abrem a expedição de cada um.
// Usa os mesmos dados da aba Resultado Individual (/campanha-incentivo-2026/individual), com o mesmo recorte de acesso.

const MASCOTES = '/campanha-incentivo-2026/mascotes';
const DESTINO = '/campanha-incentivo-2026/web/lencois-01.webp';

const ESTILO = `
  .expedicao .ex-pulso { animation: exPulso 2.2s ease-out infinite; }
  @keyframes exPulso { 0% { box-shadow: 0 0 0 0 rgba(4,129,135,.45); } 70% { box-shadow: 0 0 0 14px rgba(4,129,135,0); } 100% { box-shadow: 0 0 0 0 rgba(4,129,135,0); } }
  .expedicao .ex-flutuar { animation: exFlutuar 5s ease-in-out infinite; }
  @keyframes exFlutuar { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
  .expedicao .ex-carimbo { animation: exCarimbo .5s cubic-bezier(.2,1.6,.4,1) both; }
  @keyframes exCarimbo { from { opacity: 0; transform: rotate(-14deg) scale(1.6); } to { opacity: 1; transform: rotate(-10deg) scale(1); } }
  .expedicao .ex-surgir { animation: exSurgir .6s cubic-bezier(.4,0,.2,1) both; }
  @keyframes exSurgir { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
  .expedicao .ex-chama { animation: exChama .35s ease-in-out infinite alternate; transform-origin: right center; }
  @keyframes exChama { from { transform: scaleX(.75); opacity: .75; } to { transform: scaleX(1.1); opacity: 1; } }
  @media (prefers-reduced-motion: reduce) {
    .expedicao .ex-pulso, .expedicao .ex-flutuar, .expedicao .ex-carimbo, .expedicao .ex-surgir, .expedicao .ex-chama { animation: none; }
  }
`;

const ICONES_MISSAO = {
  receita: Coins,
  atividade: UserCheck,
  make: Palette,
  cabelo: Scissors,
  multimarcas: Layers,
  boleto_medio: Receipt,
  itens_boleto: ShoppingBag,
  skin: Droplets,
  rpa: TrendingUp,
  ticket: Ticket,
  upa: Package,
};

const FRASES_FALTA = {
  atividade: (n) => `${n} ${n === 1 ? 'ativação' : 'ativações'}`,
  make: (n) => `${n} revendedora${n === 1 ? '' : 's'} com MAKE`,
  cabelo: (n) => `${n} revendedora${n === 1 ? '' : 's'} com CABELO`,
  multimarcas: (n) => `${n} revendedora${n === 1 ? '' : 's'} multimarcas`,
};

const ORDEM_106 = { classificado: 0, na_disputa: 1, fora: 2 };

const limitar = (valor, max = 100) => Math.max(0, Math.min(Number(valor || 0), max));
const semAcento = (texto) => String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const rotuloCiclo = (numero) => `C${String(numero).padStart(2, '0')}`;
const emPercentual = (valor) => `${Number(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
const dataCurta = (iso) => (iso ? String(iso).slice(0, 10).split('-').reverse().slice(0, 2).join('/') : '');

function emValor(valor, formato) {
  const n = Number(valor || 0);
  if (formato === 'percentual') return emPercentual(n);
  if (formato === 'numero') return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (Math.abs(n) >= 1e6) return `R$ ${(n / 1e6).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Mi`;
  if (Math.abs(n) >= 1e3) return `R$ ${(n / 1e3).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mil`;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function diferenca(valor, formato) {
  const n = Math.abs(Number(valor || 0));
  if (formato === 'percentual') return `${n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} p.p.`;
  return emValor(n, formato);
}

function nomeBonito(nome, { curto = false } = {}) {
  const conectivos = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);
  const partes = String(nome || '').trim().split(/\s+/).filter(Boolean)
    .map((p, i) => (i && conectivos.has(p.toLowerCase()) ? p.toLowerCase() : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()));
  if (!curto) return partes.join(' ');
  const sem = partes.filter((p) => !conectivos.has(p));
  return sem.length > 1 ? `${sem[0]} ${sem[sem.length - 1]}` : sem[0] || '';
}

const primeiroNome = (nome) => nomeBonito(nome).split(' ')[0] || '';

/** Ciclo em foco: o que está em andamento; senão o último com resultado; senão o primeiro que vai começar. */
function cicloEmFoco(entidade) {
  const ciclos = entidade?.ciclos || [];
  return ciclos.find((c) => c.situacao_ciclo === 'em_andamento')
    || [...ciclos].reverse().find((c) => (c.criterios || []).length)
    || ciclos.find((c) => c.situacao_ciclo === 'futuro')
    || ciclos[ciclos.length - 1]
    || null;
}

/** Dias que faltam para o ciclo fechar, contando hoje (0 quando não está em andamento). */
function diasRestantes(calendario, numero) {
  const c = (calendario || []).find((x) => x.numero === numero);
  if (!c || c.status !== 'em_andamento') return 0;
  return Math.max(Number(c.dias_total || 0) - Number(c.dias_passados || 0) + 1, 1);
}

function fasesConcluidas(entidade) {
  return (entidade?.ciclos || []).filter((c) => c.status === 'bateu').length;
}

function missoesDoCiclo(ciclo) {
  const criterios = (ciclo?.criterios || []).filter((c) => !c.sem_meta);
  return { total: criterios.length, cumpridas: criterios.filter((c) => c.ok).length };
}

function escolherMascote(entidade, ciclo, dias) {
  if (!entidade) return 'ela-notebook';
  if (entidade.status_106 === 'classificado') return 'ela-pulando';
  if (entidade.status_106 === 'fora') return 'ele-apresentando';
  if (!ciclo) return 'ele-bracos-abertos';
  if (ciclo.status === 'batendo') return 'ele-comemorando';
  if (ciclo.status === 'bateu') return 'ele-pulando';
  if (ciclo.status === 'em_andamento') return dias > 0 && dias <= 3 ? 'ele-surpreso' : 'ela-apontando';
  if (ciclo.status === 'futuro') return 'ela-sentada';
  return 'ele-bracos-abertos';
}

/** Manchete e linha de apoio do herói, na 2ª pessoa (a própria expedição) ou com o nome de quem está sendo visto. */
function frasesHeroi(entidade, ciclo, calendario, { propria, unidade }) {
  const quem = unidade ? 'A unidade' : propria ? 'Você' : primeiroNome(entidade.nome);
  const c = ciclo ? rotuloCiclo(ciclo.numero) : '';
  const cal = (calendario || []).find((x) => x.numero === ciclo?.numero);
  const { total, cumpridas } = missoesDoCiclo(ciclo);
  const faltam = total - cumpridas;
  if (entidade.status_106 === 'classificado') {
    return { manchete: 'Vaga garantida em Santo Amaro!', apoio: `${quem} cumpriu todas as missões do C14 ao C17.` };
  }
  if (entidade.status_106 === 'fora') {
    return {
      manchete: 'A viagem ficou para trás, mas o bônus segue em jogo',
      apoio: `Com 120% da meta de receita somada do C14 ao C17, ${propria ? 'você entra' : `${unidade ? 'a unidade entra' : `${quem} entra`}`} na divisão dos R$ 50 mil.`,
    };
  }
  if (!ciclo) return { manchete: 'Expedição em preparação', apoio: 'O resultado aparece quando houver meta ou venda no ciclo.' };
  if (ciclo.status === 'batendo') {
    return { manchete: `${quem} está batendo todas as missões do ${c}!`, apoio: `Segure o ritmo até ${dataCurta(cal?.data_fim)} para concluir a fase.` };
  }
  if (ciclo.status === 'em_andamento') {
    return {
      manchete: faltam === 1 ? `Falta 1 missão para fechar o ${c}` : `Faltam ${faltam} missões para fechar o ${c}`,
      apoio: `Cumpra todas até ${dataCurta(cal?.data_fim)} e siga rumo a Santo Amaro.`,
    };
  }
  if (ciclo.status === 'bateu') {
    const proxima = (calendario || []).find((x) => x.numero > ciclo.numero);
    return { manchete: `Fase ${c} concluída!`, apoio: proxima ? `A próxima fase, ${rotuloCiclo(proxima.numero)}, começa em ${dataCurta(proxima.data_inicio)}.` : 'Todas as fases foram concluídas.' };
  }
  if (ciclo.status === 'futuro') return { manchete: `A expedição começa no ${c}`, apoio: `Largada em ${dataCurta(cal?.data_inicio)}.` };
  return { manchete: `Ainda sem resultado no ${c}`, apoio: 'O resultado aparece quando houver meta ou venda no ciclo.' };
}

/* ------------------------------------------------------------------ herói */

function Heroi({ entidade, ciclo, calendario, propria, unidade, aoVoltar }) {
  const dias = diasRestantes(calendario, ciclo?.numero);
  const { manchete, apoio } = frasesHeroi(entidade, ciclo, calendario, { propria, unidade });
  const { total, cumpridas } = missoesDoCiclo(ciclo);
  const mascote = escolherMascote(entidade, ciclo, dias);
  const titulo = unidade ? nomeBonito(entidade.nome) : propria ? `Olá, ${primeiroNome(entidade.nome)}!` : nomeBonito(entidade.nome, { curto: true });
  const status = { classificado: ['Classificação garantida', 'bg-[#f2c14e] text-[#5b3d00]'], na_disputa: ['Na disputa da viagem', 'bg-white/15 text-white'], fora: ['Fora da viagem • bônus em jogo', 'bg-[#7c1f31]/80 text-white'] }[entidade.status_106] || ['Na disputa da viagem', 'bg-white/15 text-white'];
  return (
    <section className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(120deg,#011c1e_0%,#03474a_45%,#04767b_80%,#0f9fa5_100%)] text-white shadow-[0_30px_70px_-35px_rgba(1,40,44,.8)]">
      <div className="pointer-events-none absolute -left-20 -top-24 w-72 h-72 rounded-full bg-[#0aa3a9]/20 blur-3xl" />
      <div className="pointer-events-none absolute right-10 -bottom-32 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
      <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 sm:gap-6 px-5 pt-5 sm:px-8 sm:pt-8">
        <div className="min-w-0 pb-5 sm:pb-8 ex-surgir">
          {aoVoltar && (
            <button type="button" onClick={aoVoltar} className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1.5 text-[11px] font-semibold text-white/85 hover:bg-white/20">
              <ArrowLeft size={13} /> Voltar para a tripulação
            </button>
          )}
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.08em] text-[#bff3f2]">
            {unidade ? 'Expedição da unidade' : propria ? 'Sua expedição' : 'Expedição de'} {ciclo ? `• ${rotuloCiclo(ciclo.numero)}` : ''}
          </p>
          <h2 className="mt-1.5 text-2xl sm:text-4xl font-bold tracking-tight leading-tight break-words">{titulo}</h2>
          <p className="mt-3 text-base sm:text-xl font-semibold leading-snug text-white">{manchete}</p>
          <p className="mt-1.5 text-[13px] sm:text-sm text-white/75 font-medium">{apoio}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ${status[1]}`}>
              {entidade.status_106 === 'classificado' ? <Trophy size={13} /> : <Rocket size={13} />} {status[0]}
            </span>
            {ciclo?.situacao_ciclo === 'em_andamento' && (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ${dias <= 3 ? 'bg-[#f2c14e] text-[#5b3d00]' : 'bg-white/15 text-white'}`}>
                <CalendarClock size={13} /> {dias === 1 ? `Último dia do ${rotuloCiclo(ciclo.numero)}!` : `Faltam ${dias} dias para fechar o ${rotuloCiclo(ciclo.numero)}`}
              </span>
            )}
            {total > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-bold text-white">
                <Target size={13} /> {cumpridas}/{total} missões no ciclo
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-bold text-white">
              <Flag size={13} /> {fasesConcluidas(entidade)}/4 fases
            </span>
          </div>
        </div>
        <img
          key={mascote}
          src={`${MASCOTES}/${mascote}.webp`}
          alt=""
          aria-hidden="true"
          decoding="async"
          className="ex-flutuar w-[96px] min-[400px]:w-[120px] sm:w-[190px] xl:w-[230px] max-h-[300px] object-contain object-bottom self-end drop-shadow-[0_20px_30px_rgba(0,0,0,.35)]"
        />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ mapa da jornada */

const PARADA = {
  bateu: { classe: 'bg-green-500 border-green-500 text-white', Icone: Check, texto: 'Concluída' },
  batendo: { classe: 'bg-[#048187] border-[#048187] text-white ex-pulso', Icone: Rocket, texto: 'Batendo tudo' },
  em_andamento: { classe: 'bg-[#fff6e8] border-[#e8a33d] text-[#a65f00] ex-pulso', Icone: Rocket, texto: '' },
  nao_bateu: { classe: 'bg-[#fdecee] border-[#e9b3bb] text-[#b42335]', Icone: X, texto: 'Não bateu' },
  sem_dados: { classe: 'bg-gray-100 border-gray-200 text-gray-400', Icone: Minus, texto: 'Sem resultado' },
  futuro: { classe: 'bg-white border-dashed border-gray-300 text-gray-300', Icone: Lock, texto: '' },
};

function MapaJornada({ entidade, calendario }) {
  const ciclos = entidade.ciclos || [];
  const classificado = entidade.status_106 === 'classificado';
  const fora = entidade.status_106 === 'fora';
  return (
    <section className="rounded-[24px] bg-white border border-gray-100 shadow-sm p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.08em] text-[#048187]">Mapa da jornada</p>
          <h3 className="mt-0.5 text-base sm:text-lg font-bold text-gray-800">C14 → C17 → Santo Amaro</h3>
        </div>
        <p className="text-[11px] font-medium text-gray-400">Cada fase concluída = todas as missões do ciclo cumpridas.</p>
      </div>
      <ol className="mt-5 grid grid-cols-5 gap-1 sm:gap-2">
        {ciclos.map((c) => {
          const cfg = PARADA[c.status] || PARADA.sem_dados;
          const { total, cumpridas } = missoesDoCiclo(c);
          const cal = (calendario || []).find((x) => x.numero === c.numero);
          const legenda = c.status === 'em_andamento' ? `${cumpridas}/${total} missões` : c.status === 'futuro' ? `começa ${dataCurta(cal?.data_inicio)}` : cfg.texto;
          const trilhaFeita = c.status === 'bateu';
          return (
            <li key={c.numero} className="relative flex flex-col items-center text-center">
              {/* trilho até a próxima parada */}
              <span aria-hidden="true" className={`absolute left-1/2 w-full ${trilhaFeita ? 'top-[20px] sm:top-[26px] h-1 rounded-full bg-green-400' : 'top-[21px] sm:top-[27px] h-0 border-t-[3px] border-dashed border-gray-200'}`} style={{ zIndex: 0 }} />
              <span className={`relative z-[1] w-11 h-11 sm:w-14 sm:h-14 rounded-full border-2 flex items-center justify-center ${cfg.classe}`} title={`${rotuloCiclo(c.numero)}: ${legenda}`}>
                <cfg.Icone size={18} strokeWidth={2.4} className={cfg.Icone === Rocket ? 'rotate-45' : ''} />
              </span>
              <span className="mt-2 text-xs sm:text-sm font-bold text-gray-700">{rotuloCiclo(c.numero)}</span>
              <span className={`mt-0.5 text-[9px] sm:text-[11px] font-semibold leading-tight ${c.status === 'em_andamento' ? 'text-[#a65f00]' : 'text-gray-400'}`}>{legenda}</span>
            </li>
          );
        })}
        <li className="relative flex flex-col items-center text-center">
          <span className={`relative z-[1] w-11 h-11 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 ${classificado ? 'border-[#f2c14e] ring-4 ring-[#f2c14e]/30' : fora ? 'border-gray-200 grayscale opacity-60' : 'border-[#cfe7e8]'}`}>
            <img src={DESTINO} alt="" aria-hidden="true" className="w-full h-full object-cover" />
            <span className="absolute inset-0 flex items-center justify-center bg-black/15 text-white">{classificado ? <Trophy size={18} /> : <MapPin size={18} />}</span>
          </span>
          <span className="mt-2 text-xs sm:text-sm font-bold text-[#7c1f31]">Santo Amaro</span>
          <span className="mt-0.5 text-[9px] sm:text-[11px] font-semibold leading-tight text-gray-400">{classificado ? 'Vaga garantida' : fora ? 'Fora da viagem' : 'Destino'}</span>
        </li>
      </ol>
    </section>
  );
}

/* ------------------------------------------------------------------ missões */

function Anel({ progresso, cor, children }) {
  const raio = 26;
  const circ = 2 * Math.PI * raio;
  return (
    <span className="relative w-16 h-16 shrink-0">
      <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90" aria-hidden="true">
        <circle cx="32" cy="32" r={raio} fill="none" stroke="#eef2f3" strokeWidth="7" />
        <circle cx="32" cy="32" r={raio} fill="none" stroke={cor} strokeWidth="7" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - limitar(progresso) / 100)} style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center" style={{ color: cor }}>{children}</span>
    </span>
  );
}

function textoFalta(c, dias) {
  const valor = Number(c.valor || 0);
  const meta = Number(c.meta || 0);
  if (c.formato === 'percentual' && Number(c.den) > 0 && FRASES_FALTA[c.chave]) {
    const quantos = Math.max(Math.ceil((meta / 100) * Number(c.den) - Number(c.num || 0) - 1e-9), 0);
    if (quantos > 0) return `Faltam ${FRASES_FALTA[c.chave](quantos)}`;
  }
  const falta = meta - valor;
  if (c.formato === 'moeda' && dias > 0) return `Faltam ${diferenca(falta, c.formato)} • ${emValor(falta / dias, c.formato)} por dia`;
  return `Faltam ${diferenca(falta, c.formato)}`;
}

function CartaoMissao({ criterio: c, encerrado, dias, indice }) {
  const Icone = ICONES_MISSAO[c.chave] || Target;
  const valor = Number(c.valor || 0);
  const meta = Number(c.meta || 0);
  const progresso = meta > 0 ? (valor / meta) * 100 : 0;
  const quaseLa = !c.ok && !encerrado && progresso >= 90;
  const cor = c.ok ? '#16a34a' : encerrado ? '#b42335' : quaseLa ? '#b86a00' : '#048187';
  return (
    <article className="ex-surgir relative overflow-hidden rounded-2xl border bg-white p-4 flex gap-3.5" style={{ borderColor: c.ok ? '#bbf7d0' : '#eef2f3', animationDelay: `${0.05 + indice * 0.07}s` }}>
      <Anel progresso={progresso} cor={cor}><Icone size={20} /></Anel>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-gray-400">Missão</p>
        <p className="text-sm font-bold text-gray-800 leading-tight">{c.rotulo}</p>
        <p className="mt-1 text-[12px] font-semibold text-gray-500 tabular-nums">
          <span className="text-gray-800">{emValor(valor, c.formato)}</span> de {emValor(meta, c.formato)}
        </p>
        <p className={`mt-1.5 text-[11px] font-semibold leading-snug ${c.ok ? 'text-green-700' : encerrado ? 'text-[#b42335]' : 'text-[#036b70]'}`}>
          {c.ok ? `Cumprida com +${diferenca(valor - meta, c.formato)}` : encerrado ? 'Não cumprida no ciclo' : textoFalta(c, dias)}
        </p>
        {quaseLa && <span className="mt-2 inline-flex rounded-full bg-[#fff6e8] px-2 py-0.5 text-[10px] font-bold text-[#a65f00]">Quase lá!</span>}
      </div>
      {c.ok && (
        <span className="ex-carimbo pointer-events-none absolute right-2 top-2 rounded-md border-2 border-green-600/70 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-green-700/80" style={{ transform: 'rotate(-10deg)' }}>
          Cumprida
        </span>
      )}
    </article>
  );
}

function Missoes({ ciclo, calendario, propria }) {
  const criterios = (ciclo?.criterios || []).filter((c) => !c.sem_meta);
  const encerrado = ciclo?.situacao_ciclo === 'encerrado';
  const dias = diasRestantes(calendario, ciclo?.numero);
  // Primeiro as que faltam (as mais perto de cumprir na frente), depois as cumpridas.
  const ordenados = [...criterios].sort((a, b) => {
    if (a.ok !== b.ok) return a.ok ? 1 : -1;
    const pa = Number(a.meta) > 0 ? Number(a.valor) / Number(a.meta) : 0;
    const pb = Number(b.meta) > 0 ? Number(b.valor) / Number(b.meta) : 0;
    return pb - pa;
  });
  const { total, cumpridas } = missoesDoCiclo(ciclo);
  return (
    <section className="rounded-[24px] bg-[#f7faf9] border border-gray-100 p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.08em] text-[#048187]">Missões {ciclo ? `do ${rotuloCiclo(ciclo.numero)}` : ''}</p>
          <h3 className="mt-0.5 text-base sm:text-lg font-bold text-gray-800">
            {total ? `${cumpridas} de ${total} cumpridas` : 'Sem missões neste ciclo'}
          </h3>
          <p className="mt-0.5 text-[11px] font-medium text-gray-400">
            {encerrado ? 'Ciclo encerrado.' : `Todas cumpridas até o fim do ciclo = fase concluída${propria ? ' para você' : ''}.`}
          </p>
          {total > 0 && (
            <div className="mt-3 h-2 rounded-full bg-white border border-gray-100 overflow-hidden">
              <div className="h-full rounded-full bg-[linear-gradient(90deg,#048187,#16a34a)] transition-[width] duration-1000" style={{ width: `${(cumpridas / total) * 100}%` }} />
            </div>
          )}
        </div>
      </div>
      {ordenados.length > 0 ? (
        <div className="mt-4 grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {ordenados.map((c, i) => <CartaoMissao key={c.chave} criterio={c} encerrado={encerrado} dias={dias} indice={i} />)}
        </div>
      ) : (
        <p className="mt-4 text-sm font-medium text-gray-400">{ciclo?.situacao_ciclo === 'futuro' ? 'As missões aparecem quando o ciclo começar.' : 'Ainda não há resultado neste ciclo.'}</p>
      )}
    </section>
  );
}

function MissaoBonus({ entidade }) {
  const sup = entidade.superacao || {};
  const pct = Number(sup.percentual || 0);
  const falta = Math.max(1.2 * Number(sup.meta || 0) - Number(sup.receita || 0), 0);
  const posicao = (v) => `${(limitar(v, 150) / 150) * 100}%`;
  return (
    <section className="rounded-[24px] bg-white border border-[#ecdde0] shadow-sm p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="w-11 h-11 rounded-2xl bg-[#fbf1f3] text-[#7c1f31] flex items-center justify-center shrink-0"><BadgeDollarSign size={20} /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7c1f31]">Missão bônus • R$ 50 mil</p>
          <h3 className="mt-0.5 text-base sm:text-lg font-bold text-gray-800">{emPercentual(pct)} da meta de receita desde o C14</h3>
          <p className="mt-0.5 text-[12px] font-medium text-gray-500">
            {sup.ok
              ? <>Acima de 120%! Parte estimada: <strong className="text-green-700 tabular-nums">{emValor(sup.parte_estimada, 'moeda')}</strong> (se o CP chegar a R$ 109 MM).</>
              : <>Faltam <strong className="text-[#7c1f31] tabular-nums">{emValor(falta, 'moeda')}</strong> de receita para chegar a 120%.</>}
          </p>
        </div>
      </div>
      <div className="mt-4 relative h-3 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-[width] duration-1000" style={{ width: posicao(pct), background: sup.ok ? '#16a34a' : 'linear-gradient(90deg,#b44a5c,#7c1f31)' }} />
      </div>
      <div className="relative mt-1 h-4 text-[10px] font-bold text-gray-400">
        <span className="absolute -translate-x-1/2" style={{ left: posicao(100) }}>100%</span>
        <span className="absolute -translate-x-1/2 text-[#7c1f31]" style={{ left: posicao(120) }}>120%</span>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ combustível da empresa */

function FogueteEmpresa({ total, inicio, meta106, meta109 }) {
  const base = inicio > 0 && inicio < meta106 ? inicio : 0;
  const escala = Math.max(meta109 - base, 1);
  const pos = (v) => limitar(((v - base) / escala) * 100);
  const viagem = total >= meta106;
  const bonus = total >= meta109;
  return (
    <section className="relative overflow-hidden rounded-[24px] bg-[#04161a] text-white p-5 sm:p-7">
      <div className="pointer-events-none absolute inset-0 opacity-60" style={{ backgroundImage: 'radial-gradient(1px 1px at 12% 30%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 42% 70%, #fff 50%, transparent 51%), radial-gradient(1.5px 1.5px at 78% 22%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 88% 64%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 25% 85%, #fff 50%, transparent 51%)' }} />
      <div className="relative grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-4 items-end">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7fdcdc]">Combustível da empresa • CP 2026</p>
          <h3 className="mt-1 text-xl sm:text-2xl font-bold tabular-nums">{emValor(total, 'moeda')}</h3>
          <p className="mt-1 text-[12px] sm:text-sm font-medium text-white/70">
            {bonus ? 'Viagem e bônus liberados! O foguete chegou lá.'
              : viagem ? <>Viagem liberada! Faltam <strong className="text-white">{emValor(meta109 - total, 'moeda')}</strong> para liberar o bônus.</>
                : <>Faltam <strong className="text-white">{emValor(meta106 - total, 'moeda')}</strong> para liberar a viagem e <strong className="text-white">{emValor(meta109 - total, 'moeda')}</strong> para o bônus.</>}
          </p>
          <div className="relative mt-10 mb-10 h-3 rounded-full bg-white/10">
            <div className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,#048187,#2dd4bf,#f2c14e)] transition-[width] duration-1000" style={{ width: `${pos(total)}%` }} />
            {/* foguete na ponta do combustível */}
            <span className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center" style={{ left: `${pos(total)}%` }}>
              <span className="ex-chama absolute right-[70%] w-5 h-2 rounded-full bg-gradient-to-l from-[#f2c14e] to-transparent" />
              <span className="relative w-9 h-9 rounded-full bg-white text-[#048187] shadow-lg flex items-center justify-center"><Rocket size={18} className="rotate-45" /></span>
            </span>
            {/* Viagem em cima e bônus embaixo da barra: no celular as duas marcas ficam coladas. */}
            {[{ v: meta106, r: 'Viagem • 106 MM', ok: viagem, cima: true }, { v: meta109, r: 'Bônus • 109 MM', ok: bonus, cima: false }].map((m) => (
              // Perto da ponta da barra, a etiqueta encosta para dentro (senão é cortada no celular).
              <span key={m.r} className={`absolute flex ${pos(m.v) > 85 ? 'items-end' : 'items-center'} ${m.cima ? 'bottom-1/2 flex-col' : 'top-1/2 flex-col-reverse'}`} style={{ left: `${pos(m.v)}%`, transform: pos(m.v) > 85 ? 'translateX(calc(-100% + 1px))' : 'translateX(-50%)' }}>
                <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] font-bold ${m.ok ? 'bg-green-500 text-white' : 'bg-white/15 text-white/85'}`}>{m.ok ? '✓ ' : ''}{m.r}</span>
                <span className={`w-0.5 h-5 ${m.ok ? 'bg-green-400' : 'bg-white/30'}`} />
              </span>
            ))}
          </div>
          {base > 0 && <p className="text-[10px] font-medium text-white/45">Largada do C14: {emValor(base, 'moeda')} (resultado de C01 a C13).</p>}
        </div>
        <img src={`${MASCOTES}/${bonus || viagem ? 'ele-pulando' : 'ela-notebook'}.webp`} alt="" aria-hidden="true" decoding="async" className="hidden lg:block w-[150px] ex-flutuar drop-shadow-[0_20px_30px_rgba(0,0,0,.45)]" />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ tripulação (gestores) */

function MiniTrilha({ ciclos }) {
  const cor = { bateu: 'bg-green-500', batendo: 'bg-[#048187]', em_andamento: 'bg-[#e8a33d]', nao_bateu: 'bg-[#b42335]', sem_dados: 'bg-gray-300', futuro: 'bg-gray-200' };
  return (
    <span className="flex items-center gap-1" aria-hidden="true">
      {(ciclos || []).map((c) => <span key={c.numero} className={`w-2.5 h-2.5 rounded-full ${cor[c.status] || 'bg-gray-200'}`} title={rotuloCiclo(c.numero)} />)}
      <Flag size={11} className="text-gray-300" />
    </span>
  );
}

function ordenarTripulacao(lista) {
  return [...lista].sort((a, b) => {
    const s = (ORDEM_106[a.status_106] ?? 3) - (ORDEM_106[b.status_106] ?? 3);
    if (s) return s;
    const f = fasesConcluidas(b) - fasesConcluidas(a);
    if (f) return f;
    const ma = missoesDoCiclo(cicloEmFoco(a));
    const mb = missoesDoCiclo(cicloEmFoco(b));
    const pa = ma.total ? ma.cumpridas / ma.total : 0;
    const pb = mb.total ? mb.cumpridas / mb.total : 0;
    if (pb !== pa) return pb - pa;
    return Number(b.superacao?.percentual || 0) - Number(a.superacao?.percentual || 0);
  });
}

function Tripulacao({ pessoas, unidades, aoEscolher }) {
  const [tipo, setTipo] = useState('pessoa');
  const [busca, setBusca] = useState('');
  const lista = tipo === 'pessoa' ? pessoas : unidades.filter((u) => !u.sem_resultado_proprio);
  const termo = semAcento(busca.trim());
  const visiveis = ordenarTripulacao(lista).filter((e) => !termo || semAcento(`${e.nome} ${e.unidade || ''}`).includes(termo));
  return (
    <section className="rounded-[24px] bg-white border border-gray-100 shadow-sm p-4 sm:p-6">
      <div className="flex flex-col lg:flex-row lg:items-end gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.08em] text-[#048187]">Tripulação</p>
          <h3 className="mt-0.5 text-base sm:text-lg font-bold text-gray-800">Toque em alguém para ver a expedição</h3>
        </div>
        <div className="inline-flex rounded-xl bg-[#f5f9f9] border border-gray-100 p-1 self-start">
          {[{ id: 'pessoa', r: `Consultores (${pessoas.length})` }, { id: 'unidade', r: `Unidades (${unidades.filter((u) => !u.sem_resultado_proprio).length})` }].map((o) => (
            <button key={o.id} type="button" onClick={() => setTipo(o.id)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${tipo === o.id ? 'bg-[#048187] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{o.r}</button>
          ))}
        </div>
        <label className="relative lg:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar" className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm font-semibold text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#048187]/25" />
        </label>
      </div>
      {visiveis.length ? (
        <ul className="mt-4 grid gap-2.5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {visiveis.map((e) => {
            const ciclo = cicloEmFoco(e);
            const { total, cumpridas } = missoesDoCiclo(ciclo);
            const status = { classificado: ['Classificação garantida', 'text-[#8a5a00] bg-[#fdf3d8]'], na_disputa: ['Na disputa', 'text-[#036b70] bg-[#e3f3f3]'], fora: ['Bônus em jogo', 'text-[#7c1f31] bg-[#fbf1f3]'] }[e.status_106] || ['Na disputa', 'text-[#036b70] bg-[#e3f3f3]'];
            return (
              <li key={e.participante}>
                <button type="button" onClick={() => aoEscolher(tipo, e.participante)} className="w-full text-left rounded-2xl border border-gray-100 bg-white p-3.5 hover:border-[#9fd3d5] hover:shadow-[0_10px_24px_-18px_rgba(4,129,135,.8)] transition-all">
                  <div className="flex items-center gap-3">
                    <span className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${e.canal === 'LOJA' ? 'bg-[#eef8f8] text-[#2a9aa0]' : 'bg-[#048187] text-white'}`}>
                      {tipo === 'unidade' ? (e.canal === 'LOJA' ? <Store size={17} /> : <Users size={17} />) : <span className="text-[11px] font-bold">{nomeBonito(e.nome, { curto: true }).split(' ').map((p) => p[0]).join('').slice(0, 2)}</span>}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800 truncate">{tipo === 'pessoa' ? nomeBonito(e.nome, { curto: true }) : nomeBonito(e.nome)}</p>
                      <p className="text-[11px] font-medium text-gray-400 truncate">{tipo === 'pessoa' ? nomeBonito(e.unidade) : e.canal === 'LOJA' ? 'Loja' : 'Venda Direta'}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${status[1]}`}>{status[0]}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <MiniTrilha ciclos={e.ciclos} />
                    <span className="text-[11px] font-semibold text-gray-500 tabular-nums">{total ? `${cumpridas}/${total} missões ${ciclo ? rotuloCiclo(ciclo.numero) : ''}` : 'sem missões'}</span>
                  </div>
                  {total > 0 && <div className="mt-1.5 h-1.5 rounded-full bg-gray-100 overflow-hidden"><div className="h-full rounded-full bg-[#048187]" style={{ width: `${(cumpridas / total) * 100}%` }} /></div>}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-6 text-center text-sm font-medium text-gray-400">{lista.length ? 'Ninguém com essa busca.' : 'Ninguém no seu acesso ainda.'}</p>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ tela */

export default function ExpedicaoCampanha2026({ apiUrl, totalCp = 0, inicioCp = 0, meta106 = 106000000, meta109 = 109000000 }) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState('');
  const [escolhido, setEscolhido] = useState(null); // { tipo: 'pessoa' | 'unidade', chave }
  const topo = useRef(null);

  const carregar = useCallback(async (forcar = false) => {
    setAtualizando(true);
    setErro('');
    try {
      const r = await axios.get(`${apiUrl}/campanha-incentivo-2026/individual`, { params: { _t: Date.now() }, headers: forcar ? { 'X-Force-Refresh': '1' } : {} });
      setDados(r.data || null);
    } catch (e) {
      setErro(e?.response?.data?.detail || e?.message || 'Não foi possível carregar a expedição.');
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [apiUrl]);

  // Primeira carga (o setState fica dentro da promessa, como na aba Resultado Individual).
  useEffect(() => {
    let ativo = true;
    axios.get(`${apiUrl}/campanha-incentivo-2026/individual`, { params: { _t: Date.now() } })
      .then((r) => { if (ativo) setDados(r.data || null); })
      .catch((e) => { if (ativo) setErro(e?.response?.data?.detail || e?.message || 'Não foi possível carregar a expedição.'); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [apiUrl]);

  const nivel = dados?.acesso?.nivel_exibido || dados?.acesso?.nivel || 'total';
  const pessoas = useMemo(() => dados?.participantes || [], [dados]);
  const unidades = useMemo(() => dados?.unidades || [], [dados]);
  const calendario = dados?.calendario || [];

  // Consultor: a própria expedição. Gestor de unidade: a unidade (e a tripulação embaixo). Gestão: a tripulação.
  const entidade = useMemo(() => {
    if (escolhido) {
      const lista = escolhido.tipo === 'unidade' ? unidades : pessoas;
      return lista.find((e) => e.participante === escolhido.chave) || null;
    }
    if (nivel === 'consultor') return pessoas[0] || null;
    if (nivel === 'unidade') return unidades.find((u) => !u.sem_resultado_proprio) || null;
    return null;
  }, [escolhido, nivel, pessoas, unidades]);
  const ehUnidade = escolhido ? escolhido.tipo === 'unidade' : nivel === 'unidade';
  const propria = !escolhido && nivel === 'consultor';
  const ciclo = entidade ? cicloEmFoco(entidade) : null;

  const escolher = (tipo, chave) => {
    setEscolhido({ tipo, chave });
    requestAnimationFrame(() => topo.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  if (carregando) {
    return (
      <div className="rounded-[24px] bg-white border border-gray-100 p-8 sm:p-12 text-center shadow-sm">
        <img src={`${MASCOTES}/ele-notebook.webp`} alt="" aria-hidden="true" className="mx-auto w-28 sm:w-36" />
        <p className="mt-4 text-sm font-semibold text-gray-700">Preparando a expedição...</p>
        <p className="mt-1 text-xs font-medium text-gray-400">Conferindo as missões ciclo a ciclo. Na primeira vez pode levar até 1 minuto.</p>
      </div>
    );
  }

  if (!dados) {
    return (
      <div className="rounded-[24px] bg-white border border-red-100 p-8 text-center shadow-sm">
        <AlertCircle size={26} className="mx-auto text-[#b42335]" />
        <p className="mt-3 text-sm font-semibold text-gray-700">{erro || 'Não foi possível carregar a expedição.'}</p>
        <button type="button" onClick={() => { setCarregando(true); carregar(true); }} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#048187] px-4 py-2 text-xs font-semibold text-white"><RefreshCw size={14} /> Tentar de novo</button>
      </div>
    );
  }

  const mostrarTripulacao = nivel !== 'consultor' && (pessoas.length > 0 || unidades.length > 0);

  return (
    <div ref={topo} className="expedicao space-y-5 sm:space-y-6 scroll-mt-4">
      <style>{ESTILO}</style>

      {entidade ? (
        <>
          <Heroi entidade={entidade} ciclo={ciclo} calendario={calendario} propria={propria} unidade={ehUnidade} aoVoltar={escolhido && nivel !== 'consultor' ? () => setEscolhido(null) : null} />
          <MapaJornada entidade={entidade} calendario={calendario} />
          <Missoes ciclo={ciclo} calendario={calendario} propria={propria} />
          {!ehUnidade && <MissaoBonus entidade={entidade} />}
        </>
      ) : nivel === 'consultor' ? (
        <div className="rounded-[24px] bg-white border border-gray-100 p-8 text-center shadow-sm">
          <img src={`${MASCOTES}/ele-bracos-abertos.webp`} alt="" aria-hidden="true" className="mx-auto w-28 sm:w-32" />
          <p className="mt-4 text-sm font-semibold text-gray-700">Sua expedição ainda não começou.</p>
          <p className="mt-1 text-xs font-medium text-gray-400">Ela aparece quando você tiver meta cadastrada ou venda no ciclo. Fale com o seu gestor se isso não acontecer.</p>
        </div>
      ) : (
        <section className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(120deg,#011c1e_0%,#03474a_45%,#04767b_80%,#0f9fa5_100%)] text-white">
          <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 px-5 pt-5 sm:px-8 sm:pt-8">
            <div className="pb-6 sm:pb-8">
              <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.08em] text-[#bff3f2]">Expedição Santo Amaro</p>
              <h2 className="mt-1.5 text-2xl sm:text-4xl font-bold tracking-tight">Painel da tripulação</h2>
              <p className="mt-3 text-sm sm:text-base text-white/80 font-medium">
                {(dados.resumo?.na_disputa_106 || 0)} de {(dados.resumo?.participantes || 0)} consultores seguem na disputa da viagem
                {dados.resumo?.batendo_ciclo_atual ? ` • ${dados.resumo.batendo_ciclo_atual} batendo todas as missões do ciclo` : ''}.
              </p>
            </div>
            <img src={`${MASCOTES}/ela-sentada.webp`} alt="" aria-hidden="true" className="ex-flutuar w-[96px] sm:w-[170px] self-end drop-shadow-[0_20px_30px_rgba(0,0,0,.35)]" />
          </div>
        </section>
      )}

      <FogueteEmpresa total={totalCp} inicio={inicioCp} meta106={meta106} meta109={meta109} />

      {mostrarTripulacao && <Tripulacao pessoas={pessoas} unidades={unidades} aoEscolher={escolher} />}

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white border border-gray-100 px-4 py-2.5">
        <p className="text-[11px] font-medium text-slate-400">Mesmos números da aba Resultado Individual.</p>
        <button type="button" onClick={() => carregar(true)} disabled={atualizando} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-[#048187] hover:text-[#048187] disabled:opacity-60">
          <RefreshCw size={13} className={atualizando ? 'animate-spin' : ''} /> {atualizando ? 'Atualizando...' : 'Atualizar'}
        </button>
        {erro && <p className="w-full text-xs font-medium text-[#b42335] flex items-center gap-1.5"><AlertCircle size={14} /> {erro}</p>}
      </div>
    </div>
  );
}
