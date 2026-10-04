import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  AlertCircle, BadgeDollarSign, Building2, Check, ChevronDown, Clock, Eye, Info, Loader2, Lock, Minus, Plane,
  RefreshCw, Save, Search, SlidersHorizontal, Store, Target, TrendingUp, UserRound, Users, X
} from 'lucide-react';

// Resultado Individual da Campanha Incentivo 2026, em dois níveis: primeiro as unidades
// (equipes/ERs da VD e lojas) e, ao abrir uma delas, os consultores que pertencem a ela.
// Quem vê o quê vem do backend: gestor vê tudo, gestor de unidade vê a sua unidade,
// consultor vê o próprio resultado e o total da sua unidade.

const emPercentual = (valor) => `${Number(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
const emReais = (valor) => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const limitar = (valor) => Math.max(0, Math.min(Number(valor || 0), 100));
const semAcento = (texto) => String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const rotuloCiclo = (numero) => `C${String(numero).padStart(2, '0')}`;

function emValor(valor, formato) {
  const n = Number(valor || 0);
  if (formato === 'percentual') return emPercentual(n);
  if (formato === 'numero') return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (Math.abs(n) >= 1e6) return `R$ ${(n / 1e6).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Mi`;
  if (Math.abs(n) >= 1e3) return `R$ ${(n / 1e3).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mil`;
  return emReais(n);
}

const STATUS_CICLO = {
  bateu: { texto: 'Bateu tudo', classe: 'bg-green-500 text-white border-green-500', Icone: Check },
  nao_bateu: { texto: 'Não bateu', classe: 'bg-[#fdecee] text-[#b42335] border-[#f6cdd2]', Icone: X },
  batendo: { texto: 'Batendo tudo até agora', classe: 'bg-[#e3f3f3] text-[#036b70] border-[#048187]/40', Icone: TrendingUp },
  em_andamento: { texto: 'Em andamento', classe: 'bg-[#fff6e8] text-[#a65f00] border-[#f8dfb8]', Icone: Clock },
  sem_dados: { texto: 'Sem resultado', classe: 'bg-gray-100 text-gray-400 border-gray-200', Icone: Minus },
  futuro: { texto: 'Ainda não começou', classe: 'bg-white text-gray-300 border-dashed border-gray-200', Icone: null },
};

const STATUS_VIAGEM = {
  classificado: { texto: 'Classificado(a)', classe: 'bg-green-50 text-green-700 border-green-200' },
  na_disputa: { texto: 'Na disputa', classe: 'bg-[#e3f3f3] text-[#036b70] border-[#cde9ea]' },
  fora: { texto: 'Fora da viagem', classe: 'bg-gray-100 text-gray-500 border-gray-200' },
};

const STATUS_UNIDADE = {
  classificado: { texto: 'Bateu os 4 ciclos', classe: 'bg-green-50 text-green-700 border-green-200' },
  na_disputa: { texto: 'Na disputa', classe: 'bg-[#e3f3f3] text-[#036b70] border-[#cde9ea]' },
  fora: { texto: 'Perdeu um ciclo', classe: 'bg-gray-100 text-gray-500 border-gray-200' },
};

const STATUS_BONUS = {
  elegivel: 'Elegível',
  nao_elegivel: 'Não elegível',
  no_caminho: 'Acima de 120%',
  abaixo: 'Abaixo de 120%',
};

const GRADE_LINHA = 'lg:grid-cols-[minmax(0,1.5fr)_auto_minmax(0,0.75fr)_minmax(0,1fr)_28px]';

function iniciais(nome) {
  const partes = String(nome || '').trim().split(/\s+/).filter(Boolean);
  return ((partes[0]?.[0] || '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase() || '?';
}

function SeloCanal({ canal }) {
  return canal === 'LOJA'
    ? <span className="inline-flex items-center gap-1 rounded-full bg-[#eef8f8] px-2 py-0.5 text-[10px] font-semibold text-[#2a9aa0]"><Store size={11} /> Loja</span>
    : <span className="inline-flex items-center gap-1 rounded-full bg-[#e3f3f3] px-2 py-0.5 text-[10px] font-semibold text-[#036b70]"><Users size={11} /> VD</span>;
}

function PilulaCiclo({ ciclo }) {
  const info = STATUS_CICLO[ciclo.status] || STATUS_CICLO.sem_dados;
  const { Icone } = info;
  const total = ciclo.criterios?.length || 0;
  const batidos = total - (ciclo.faltam || 0);
  const parcial = ciclo.status === 'em_andamento' && total > 0;
  return (
    <span title={`${rotuloCiclo(ciclo.numero)}: ${info.texto}${total ? ` (${batidos} de ${total} metas)` : ''}`} className={`inline-flex flex-col items-center justify-center w-[46px] h-[42px] rounded-xl border text-[10px] font-semibold leading-none ${info.classe}`}>
      <span className="opacity-80">{rotuloCiclo(ciclo.numero)}</span>
      <span className="mt-1 flex items-center gap-0.5">{Icone ? <Icone size={12} strokeWidth={3} /> : '—'}{parcial && <span className="tabular-nums">{batidos}/{total}</span>}</span>
    </span>
  );
}

function BarraReceita({ superacao, comBonus }) {
  const pct = Number(superacao?.percentual || 0);
  const cor = comBonus ? (superacao?.ok ? '#16a34a' : pct >= 120 ? '#b86a00' : '#7c1f31') : (pct >= 100 ? '#16a34a' : '#048187');
  return (
    <div className="mt-1.5 relative h-2 rounded-full bg-gray-100 overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${limitar((pct / 150) * 100)}%`, background: cor }} />
      <span className="absolute top-0 bottom-0 w-0.5 bg-gray-700/50" style={{ left: `${((comBonus ? 120 : 100) / 150) * 100}%` }} />
    </div>
  );
}

function CartaoResumo({ Icone, cor, titulo, valor, detalhe }) {
  return (
    <article className="rounded-[22px] bg-white border border-gray-100 shadow-sm p-4 sm:p-5">
      <div className="flex items-center gap-2.5">
        <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${cor}14`, color: cor }}><Icone size={18} /></span>
        <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.06em] text-gray-400 leading-tight">{titulo}</p>
      </div>
      <p className="mt-3 text-2xl sm:text-3xl font-bold tabular-nums text-gray-800">{valor}</p>
      <p className="mt-1 text-[11px] font-semibold text-gray-400 leading-snug">{detalhe}</p>
    </article>
  );
}

const FRASES_FALTA = {
  atividade: (n) => `${n} ${n === 1 ? 'ativação' : 'ativações'}`,
  make: (n) => `${n} revendedora${n === 1 ? '' : 's'} com MAKE`,
  cabelo: (n) => `${n} revendedora${n === 1 ? '' : 's'} com CABELO`,
  multimarcas: (n) => `${n} revendedora${n === 1 ? '' : 's'} multimarcas`,
};

function diferenca(valor, formato) {
  const n = Math.abs(Number(valor || 0));
  if (formato === 'percentual') return `${n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} p.p.`;
  return emValor(n, formato);
}

function CardIndicador({ criterio: c, encerrado = false, extra = '' }) {
  const valor = Number(c.valor || 0);
  const meta = Number(c.meta || 0);
  const progresso = meta > 0 ? limitar((valor / meta) * 100) : 0;
  const cor = c.sem_meta ? '#cbd5e1' : c.ok ? '#16a34a' : encerrado ? '#dc2626' : '#048187';
  let falta = '';
  let detalhe = extra;
  if (!c.sem_meta && !c.ok) {
    falta = diferenca(meta - valor, c.formato);
    if (!detalhe && c.formato === 'percentual' && Number(c.den) > 0 && FRASES_FALTA[c.chave]) {
      const quantos = Math.max(Math.ceil((meta / 100) * Number(c.den) - Number(c.num || 0) - 1e-9), 0);
      if (quantos > 0) detalhe = FRASES_FALTA[c.chave](quantos);
    }
  }
  return (
    <div className={`rounded-xl border bg-white p-3 flex flex-col ${c.ok ? 'border-green-100' : 'border-slate-100'}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-slate-500 truncate" title={c.rotulo}>{c.chave === 'receita_120' ? 'Receita ≥ 120%' : c.rotulo}</p>
        {!c.sem_meta && (
          <span className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center ${c.ok ? 'bg-green-50 text-green-600' : encerrado ? 'bg-red-50 text-red-600' : 'bg-[#fff6e8] text-[#b86a00]'}`}>
            {c.ok ? <Check size={12} strokeWidth={2.5} /> : encerrado ? <X size={12} strokeWidth={2.5} /> : <Clock size={11} strokeWidth={2.5} />}
          </span>
        )}
      </div>
      <p className="mt-1 text-lg font-bold tabular-nums text-slate-800 leading-tight">{emValor(valor, c.formato)}</p>
      <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${progresso}%`, background: cor }} /></div>
      <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px] leading-tight">
        <div>
          <p className="text-slate-400">Meta</p>
          <p className="mt-0.5 font-semibold tabular-nums text-slate-600">{c.sem_meta ? 'sem meta' : emValor(meta, c.formato)}</p>
        </div>
        <div className="text-right">
          <p className="text-slate-400">{c.sem_meta ? 'Situação' : c.ok ? 'Acima' : 'Falta'}</p>
          <p className={`mt-0.5 font-semibold tabular-nums ${c.sem_meta ? 'text-slate-400' : c.ok ? 'text-green-700' : 'text-slate-700'}`}>
            {c.sem_meta ? 'não conta' : c.ok ? `+${diferenca(valor - meta, c.formato)}` : falta}
          </p>
        </div>
      </div>
      {detalhe && <p className="mt-2 rounded-lg bg-slate-50 px-2 py-1.5 text-[10px] font-medium text-slate-500">Faltam {detalhe}</p>}
    </div>
  );
}

const GRADE_CARDS = 'grid gap-2 grid-cols-[repeat(auto-fill,minmax(150px,1fr))]';

function PainelIndicadores({ ciclos, titulo, cor = '#048187', Icone = Plane }) {
  const lista = ciclos || [];
  const comDados = lista.filter((c) => (c.criterios || []).length);
  const padrao = (comDados.find((c) => c.situacao_ciclo === 'em_andamento') || comDados[comDados.length - 1])?.numero;
  const [escolhido, setEscolhido] = useState(null);
  const numero = comDados.some((c) => c.numero === escolhido) ? escolhido : padrao;
  const ciclo = comDados.find((c) => c.numero === numero);
  const encerrado = ciclo?.situacao_ciclo === 'encerrado';
  const total = ciclo?.criterios?.length || 0;
  const batidas = total - (ciclo?.faltam || 0);
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] flex items-center gap-1.5" style={{ color: cor }}><Icone size={13} /> {titulo}</p>
        {lista.length > 0 && (
          <div className="inline-flex items-center gap-0.5 rounded-lg bg-white border border-slate-100 p-0.5">
            {lista.map((c) => {
              const tem = comDados.some((x) => x.numero === c.numero);
              const ativo = c.numero === numero;
              return (
                <button key={c.numero} type="button" disabled={!tem} onClick={() => setEscolhido(c.numero)}
                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium tabular-nums transition-colors ${ativo ? 'bg-[#048187] text-white' : tem ? 'text-slate-500 hover:text-[#048187]' : 'text-slate-300 cursor-not-allowed'}`}>
                  {rotuloCiclo(c.numero)}
                  {c.situacao_ciclo === 'em_andamento' && <span className={`w-1.5 h-1.5 rounded-full ${ativo ? 'bg-white/80' : 'bg-[#e8a33d]'}`} />}
                </button>
              );
            })}
          </div>
        )}
      </div>
      {ciclo ? (
        <>
          <p className="mt-1.5 text-[11px] text-slate-400">
            {encerrado
              ? (ciclo.status === 'bateu' ? 'Ciclo encerrado: bateu todas as metas.' : `Ciclo encerrado: bateu ${batidas} de ${total} metas.`)
              : `Ciclo em andamento: ${batidas} de ${total} metas batidas até agora.`}
          </p>
          <div className={`mt-2.5 ${GRADE_CARDS}`}>
            {ciclo.criterios.map((c) => <CardIndicador key={c.chave} criterio={c} encerrado={encerrado} />)}
          </div>
        </>
      ) : <p className="mt-2 text-xs font-medium text-slate-400">Ainda sem ciclo com resultado.</p>}
    </div>
  );
}

function DetalhePessoa({ pessoa }) {
  const sup = pessoa.superacao || {};
  const faltaReceita = Math.max(1.2 * Number(sup.meta || 0) - Number(sup.receita || 0), 0);
  return (
    <div className="border-t border-gray-100 bg-[#fbfcfc] px-3 sm:px-5 py-4 space-y-5">
      <PainelIndicadores ciclos={pessoa.ciclos || []} titulo="Viagem • metas do ciclo" />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#7c1f31] flex items-center gap-1.5"><BadgeDollarSign size={13} /> Bônus • somando C14 até agora</p>
        <p className="mt-1.5 text-[11px] text-slate-400">Receita do período: {emValor(sup.receita, 'moeda')} de {emValor(sup.meta, 'moeda')} ({emPercentual(sup.percentual)} da meta). Para o bônus precisa de 120%.</p>
        <div className={`mt-2.5 ${GRADE_CARDS}`}>
          {(sup.criterios || []).map((c) => (
            <CardIndicador key={c.chave} criterio={c} extra={c.chave === 'receita_120' && !c.ok && faltaReceita > 0 ? `${emValor(faltaReceita, 'moeda')} de receita` : ''} />
          ))}
        </div>
        {sup.ok && (
          <p className="mt-3 rounded-lg bg-green-50 border border-green-100 px-3 py-2 text-[11px] font-medium text-green-800">
            Parte estimada do bônus: <strong className="tabular-nums">{emReais(sup.parte_estimada)}</strong> (se a campanha terminasse hoje e o CP chegar a 109 MM)
          </p>
        )}
      </div>
    </div>
  );
}

function LinhaPessoa({ pessoa, aberta, aoAlternar, recuo = false }) {
  const viagem = STATUS_VIAGEM[pessoa.status_106] || STATUS_VIAGEM.na_disputa;
  const sup = pessoa.superacao || {};
  return (
    <li className="border-t border-gray-100 first:border-t-0">
      <button type="button" onClick={aoAlternar} aria-expanded={aberta}
        className={`w-full text-left py-3 grid grid-cols-1 ${GRADE_LINHA} gap-3 lg:gap-4 items-center hover:bg-[#f9fcfc] transition-colors ${recuo ? 'pl-4 sm:pl-10 pr-4 sm:pr-5' : 'px-4 sm:px-5'}`}>
        <div className="flex items-center gap-3 min-w-0">
          <span className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-[11px] font-semibold ${pessoa.canal === 'LOJA' ? 'bg-[#e6f6f7] text-[#2a9aa0]' : 'bg-[#048187] text-white'}`}>{iniciais(pessoa.nome)}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{pessoa.nome}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 min-w-0"><SeloCanal canal={pessoa.canal} /> <span className="truncate">{pessoa.unidade}</span></p>
          </div>
        </div>
        <div className="flex gap-1.5">{(pessoa.ciclos || []).map((c) => <PilulaCiclo key={c.numero} ciclo={c} />)}</div>
        <div><span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${viagem.classe}`}>{viagem.texto}</span></div>
        <div className="min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className={`text-sm font-semibold tabular-nums ${sup.ok ? 'text-green-700' : 'text-gray-700'}`}>{emPercentual(sup.percentual)}</span>
            <span className="text-[10px] font-semibold text-gray-400 truncate">{sup.ok && sup.parte_estimada ? `≈ ${emReais(sup.parte_estimada)}` : STATUS_BONUS[pessoa.status_109] || ''}</span>
          </div>
          <BarraReceita superacao={sup} comBonus />
        </div>
        <ChevronDown size={18} className={`hidden lg:block text-gray-400 transition-transform ${aberta ? 'rotate-180' : ''}`} />
      </button>
      {aberta && <DetalhePessoa pessoa={pessoa} />}
    </li>
  );
}

function CartaoUnidade({ unidade, pessoas, aberta, aoAlternar, pessoasAbertas, aoAlternarPessoa, mostrarPessoas = true }) {
  const status = STATUS_UNIDADE[unidade.status_106] || STATUS_UNIDADE.na_disputa;
  const sup = unidade.superacao || {};
  const equipe = unidade.consultores || {};
  const semResultado = unidade.sem_resultado_proprio;
  const IconeUnidade = unidade.canal === 'LOJA' ? Store : Building2;
  return (
    <li className={`rounded-2xl border bg-white overflow-hidden transition-shadow ${aberta ? 'border-[#bfe0e2] shadow-[0_14px_34px_-24px_rgba(4,129,135,.7)]' : 'border-gray-100'}`}>
      <button type="button" onClick={aoAlternar} aria-expanded={aberta}
        className={`w-full text-left px-4 sm:px-5 py-4 grid grid-cols-1 ${GRADE_LINHA} gap-3 lg:gap-4 items-center ${aberta ? 'bg-[#f6fbfb]' : 'hover:bg-[#fafcfc]'} transition-colors`}>
        <div className="flex items-center gap-3 min-w-0">
          <span className={`w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center ${unidade.canal === 'LOJA' ? 'bg-[#eef8f8] text-[#2a9aa0]' : 'bg-[#e3f3f3] text-[#048187]'}`}><IconeUnidade size={20} /></span>
          <div className="min-w-0">
            <p className="text-sm sm:text-[15px] font-semibold text-gray-800 truncate">{unidade.nome}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-gray-400">
              <SeloCanal canal={unidade.canal} />
              {unidade.unidade && <span>{unidade.unidade}</span>}
              {unidade.nucleo && <span>• {unidade.nucleo}</span>}
              {mostrarPessoas && <span className="inline-flex items-center gap-1">• <UserRound size={11} /> {equipe.total || 0} consultor{(equipe.total || 0) === 1 ? '' : 'es'}{equipe.total ? ` • ${equipe.na_disputa} na disputa` : ''}</span>}
            </p>
          </div>
        </div>
        <div className="flex gap-1.5">
          {semResultado ? <span className="text-[11px] font-semibold text-gray-400 lg:w-[208px]">Sem meta própria</span> : (unidade.ciclos || []).map((c) => <PilulaCiclo key={c.numero} ciclo={c} />)}
        </div>
        <div>{!semResultado && <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${status.classe}`}>{status.texto}</span>}</div>
        <div className="min-w-0">
          {!semResultado && (
            <>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold tabular-nums text-gray-700">{emPercentual(sup.percentual)}</span>
                <span className="text-[10px] font-semibold text-gray-400 truncate">da meta de receita (C14 até agora)</span>
              </div>
              <BarraReceita superacao={sup} comBonus={false} />
            </>
          )}
        </div>
        <ChevronDown size={18} className={`hidden lg:block text-gray-400 transition-transform ${aberta ? 'rotate-180' : ''}`} />
      </button>
      {aberta && (
        <div className="border-t border-gray-100">
          {!semResultado && (
            <div className="px-3 sm:px-5 py-4 bg-[#fbfcfc]">
              <PainelIndicadores ciclos={unidade.ciclos || []} titulo={`Metas da ${unidade.canal === 'LOJA' ? 'loja' : 'unidade'} no ciclo`} cor="#036b70" Icone={Target} />
            </div>
          )}
          {mostrarPessoas && (
            pessoas.length ? (
              <div>
                <p className="px-4 sm:px-5 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-gray-400">Consultores desta {unidade.canal === 'LOJA' ? 'loja' : 'unidade'}</p>
                <ul>{pessoas.map((p) => <LinhaPessoa key={p.participante} pessoa={p} recuo aberta={pessoasAbertas.has(p.participante)} aoAlternar={() => aoAlternarPessoa(p.participante)} />)}</ul>
              </div>
            ) : (
              <p className="px-5 py-4 text-xs font-semibold text-gray-400 flex items-center gap-1.5"><Info size={13} /> Nenhum consultor desta unidade está no cadastro de metas do DASH.</p>
            )
          )}
        </div>
      )}
    </li>
  );
}

function EditorRegras({ dados, apiUrl, aoSalvar, aoCancelar }) {
  const [regras, setRegras] = useState(() => ({
    vd_106: [...(dados.regras?.vd_106 || [])],
    loja_106: [...(dados.regras?.loja_106 || [])],
    vd_109: [...(dados.regras?.vd_109 || [])],
    loja_109: [...(dados.regras?.loja_109 || [])],
    divisao_bonus: dados.regras?.divisao_bonus || 'receita',
  }));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const alternar = (chave, item) => setRegras((r) => ({ ...r, [chave]: r[chave].includes(item) ? r[chave].filter((x) => x !== item) : [...r[chave], item] }));

  const salvar = async () => {
    setSalvando(true); setErro('');
    try {
      await axios.put(`${apiUrl}/campanha-incentivo-2026/regras`, regras);
      aoSalvar();
    } catch (e) {
      setErro(e?.response?.data?.detail || e?.message || 'Não foi possível salvar as regras.');
      setSalvando(false);
    }
  };

  const grupo = (titulo, chave, canal, travarReceita = false) => (
    <div>
      <p className="text-[11px] font-semibold text-gray-600">{titulo}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {(dados.indicadores_disponiveis?.[canal] || []).filter((i) => travarReceita || i.chave !== 'receita').map((i) => {
          const travado = travarReceita && i.chave === 'receita';
          const ativo = travado || regras[chave].includes(i.chave);
          return (
            <button key={i.chave} type="button" disabled={travado} onClick={() => alternar(chave, i.chave)}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${ativo ? 'bg-[#048187] border-[#048187] text-white' : 'bg-white border-gray-200 text-gray-500 hover:border-[#048187] hover:text-[#048187]'} ${travado ? 'opacity-80 cursor-not-allowed' : ''}`}>
              {travado ? <Lock size={11} /> : ativo ? <Check size={11} strokeWidth={3} /> : null} {i.rotulo}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="mt-4 rounded-2xl border border-[#cde9ea] bg-[#f6fbfb] p-4 space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#048187]">Viagem (106) • bater em todos os ciclos</p>
          {grupo('Venda Direta', 'vd_106', 'VD', true)}
          {grupo('Loja', 'loja_106', 'LOJA', true)}
        </div>
        <div className="space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#7c1f31]">Bônus (109) • além dos 120% da receita</p>
          {grupo('Venda Direta (IAF)', 'vd_109', 'VD')}
          {grupo('Loja', 'loja_109', 'LOJA')}
          <div>
            <p className="text-[11px] font-semibold text-gray-600">Divisão dos R$ 50 mil</p>
            <select value={regras.divisao_bonus} onChange={(e) => setRegras((r) => ({ ...r, divisao_bonus: e.target.value }))} className="mt-1.5 w-full sm:w-auto rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#048187]/30">
              {(dados.divisoes_bonus || []).map((d) => <option key={d.chave} value={d.chave}>{d.rotulo}</option>)}
            </select>
          </div>
        </div>
      </div>
      <p className="text-[11px] font-semibold text-gray-500">As mesmas metas valem para as unidades (equipes, ERs e lojas) e para os consultores.</p>
      {erro && <p className="text-xs font-semibold text-[#b42335] flex items-center gap-1.5"><AlertCircle size={14} /> {erro}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" onClick={aoCancelar} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700">Cancelar</button>
        <button type="button" onClick={salvar} disabled={salvando} className="inline-flex items-center gap-1.5 rounded-xl bg-[#048187] px-4 py-2 text-xs font-semibold text-white hover:bg-[#036b70] disabled:opacity-60">
          {salvando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Salvar regras
        </button>
      </div>
    </div>
  );
}

function ResumoRegras({ dados }) {
  const nomes = (canal, lista) => (lista || []).map((chave) => dados.indicadores_disponiveis?.[canal]?.find((i) => i.chave === chave)?.rotulo || chave);
  const r = dados.regras || {};
  const divisao = dados.divisoes_bonus?.find((d) => d.chave === r.divisao_bonus)?.rotulo || '';
  const linha = (titulo, itens) => (
    <p className="text-[11px] font-semibold text-gray-500"><span className="font-semibold text-gray-700">{titulo}:</span> {itens.length ? itens.join(' + ') : 'só a receita'}</p>
  );
  return (
    <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
      <div className="rounded-xl bg-[#f6fbfb] border border-[#e1f0f0] p-3 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#048187]">Viagem (106) • em C14, C15, C16 e C17</p>
        {linha('VD', nomes('VD', r.vd_106))}
        {linha('Loja', nomes('LOJA', r.loja_106))}
      </div>
      <div className="rounded-xl bg-[#fbf7f8] border border-[#f1e3e6] p-3 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#7c1f31]">Bônus (109) • somando C14 a C17</p>
        {linha('VD', ['Receita ≥ 120%', ...nomes('VD', r.vd_109)])}
        {linha('Loja', ['Receita ≥ 120%', ...nomes('LOJA', r.loja_109)])}
        <p className="text-[11px] font-semibold text-gray-500"><span className="font-semibold text-gray-700">Divisão:</span> {divisao}</p>
      </div>
    </div>
  );
}

function SeletorVerComo({ opcoes, valor, aoMudar, carregando }) {
  const grupos = ['Gestor de unidade', 'Consultor'];
  return (
    <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white pl-3 pr-1 py-1 text-xs font-semibold text-gray-500">
      {carregando ? <Loader2 size={14} className="animate-spin text-[#048187]" /> : <Eye size={14} className="text-[#048187]" />}
      <span className="whitespace-nowrap">Ver como</span>
      <select value={valor} onChange={(e) => aoMudar(e.target.value)} className="min-w-0 max-w-[220px] sm:max-w-[260px] rounded-lg bg-[#f5f9f9] px-2 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#048187]/30">
        <option value="">Visão completa (você)</option>
        {grupos.map((g) => (
          <optgroup key={g} label={g}>
            {opcoes.filter((o) => o.grupo === g).map((o) => <option key={o.valor} value={o.valor}>{o.canal === 'LOJA' ? 'Loja • ' : ''}{o.rotulo}</option>)}
          </optgroup>
        ))}
      </select>
    </label>
  );
}

export default function ResultadoIndividualCampanha2026({ apiUrl, totalCp = 0, meta109 = 109000000 }) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState('');
  const [canal, setCanal] = useState('todos');
  const [busca, setBusca] = useState('');
  const [unidadesAbertas, setUnidadesAbertas] = useState(() => new Set());
  const [pessoasAbertas, setPessoasAbertas] = useState(() => new Set());
  const [editandoRegras, setEditandoRegras] = useState(false);
  const [verComo, setVerComo] = useState('');
  const [opcoesVerComo, setOpcoesVerComo] = useState([]);

  const aplicar = useCallback((payload) => {
    setDados(payload);
    if (payload?.opcoes_ver_como?.length) setOpcoesVerComo(payload.opcoes_ver_como);
    // Quem vê poucas unidades (gestor de unidade, consultor) já recebe tudo aberto.
    const unidades = payload?.unidades || [];
    const nivel = payload?.acesso?.nivel_exibido;
    setUnidadesAbertas(new Set(nivel && nivel !== 'total' && unidades.length <= 3 ? unidades.map((u) => u.participante) : []));
    setPessoasAbertas(new Set(nivel === 'consultor' ? (payload?.participantes || []).map((p) => p.participante) : []));
  }, []);

  const carregar = useCallback(async ({ forcar = false, simular = verComo } = {}) => {
    setAtualizando(true);
    setErro('');
    try {
      const resposta = await axios.get(`${apiUrl}/campanha-incentivo-2026/individual`, {
        params: { _t: Date.now(), ...(simular ? { ver_como: simular } : {}) },
        headers: forcar ? { 'X-Force-Refresh': '1' } : {},
      });
      aplicar(resposta.data);
    } catch (e) {
      setErro(e?.response?.data?.detail || e?.message || 'Não foi possível calcular o resultado individual.');
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [apiUrl, verComo, aplicar]);

  useEffect(() => {
    let ativo = true;
    axios.get(`${apiUrl}/campanha-incentivo-2026/individual`, { params: { _t: Date.now() } })
      .then((r) => { if (ativo) aplicar(r.data); })
      .catch((e) => { if (ativo) setErro(e?.response?.data?.detail || e?.message || 'Não foi possível calcular o resultado individual.'); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [apiUrl, aplicar]);

  const mudarVerComo = (valor) => {
    setVerComo(valor);
    setBusca('');
    setCanal('todos');
    carregar({ simular: valor });
  };

  const unidades = useMemo(() => dados?.unidades || [], [dados]);
  const participantes = useMemo(() => dados?.participantes || [], [dados]);
  const pessoasPorUnidade = useMemo(() => {
    const mapa = new Map();
    for (const p of participantes) {
      if (!mapa.has(p.unidade_chave)) mapa.set(p.unidade_chave, []);
      mapa.get(p.unidade_chave).push(p);
    }
    return mapa;
  }, [participantes]);

  const termo = semAcento(busca.trim());
  const unidadesVisiveis = useMemo(() => unidades
    .filter((u) => canal === 'todos' || u.canal === canal)
    .map((u) => {
      const equipe = pessoasPorUnidade.get(u.participante) || [];
      if (!termo) return { unidade: u, pessoas: equipe };
      const casouUnidade = semAcento(u.nome).includes(termo);
      const pessoas = casouUnidade ? equipe : equipe.filter((p) => semAcento(p.nome).includes(termo));
      return (casouUnidade || pessoas.length) ? { unidade: u, pessoas, busca: true } : null;
    })
    .filter(Boolean), [unidades, canal, termo, pessoasPorUnidade]);

  const alternar = (setter) => (chave) => setter((atual) => {
    const novo = new Set(atual);
    if (novo.has(chave)) novo.delete(chave); else novo.add(chave);
    return novo;
  });
  const alternarUnidade = alternar(setUnidadesAbertas);
  const alternarPessoa = alternar(setPessoasAbertas);

  if (carregando) {
    return (
      <div className="rounded-[24px] bg-white border border-gray-100 p-10 sm:p-14 text-center shadow-sm">
        <Loader2 size={30} className="mx-auto animate-spin text-[#048187]" />
        <p className="mt-4 text-sm font-semibold text-gray-700">Calculando o resultado das unidades e dos consultores...</p>
        <p className="mt-1 text-xs font-semibold text-gray-400">Na primeira vez pode levar até 1 minuto: o DASH confere receita e indicadores ciclo a ciclo.</p>
      </div>
    );
  }

  if (!dados) {
    return (
      <div className="rounded-[24px] bg-white border border-red-100 p-8 text-center shadow-sm">
        <AlertCircle size={26} className="mx-auto text-[#b42335]" />
        <p className="mt-3 text-sm font-semibold text-gray-700">{erro || 'Não foi possível calcular o resultado individual.'}</p>
        <button type="button" onClick={() => { setCarregando(true); carregar({ forcar: true }); }} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#048187] px-4 py-2 text-xs font-semibold text-white"><RefreshCw size={14} /> Tentar de novo</button>
      </div>
    );
  }

  const acesso = dados.acesso || {};
  const nivel = acesso.nivel_exibido || acesso.nivel || 'total';
  const resumo = dados.resumo || {};
  const cicloAtual = resumo.ciclo_atual ? Number(String(resumo.ciclo_atual).split('/')[0]) : null;
  const habilitado109 = totalCp >= meta109;
  const calculadoEm = dados.calculado_em ? new Date(dados.calculado_em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : null;
  const eu = nivel === 'consultor' ? participantes[0] : null;

  return (
    <div className="space-y-5 sm:space-y-6">
      {acesso.dono && (
        <div className={`rounded-2xl border px-4 py-3 flex flex-col md:flex-row md:items-center gap-3 ${acesso.simulando ? 'border-[#f8dfb8] bg-[#fff8ee]' : 'border-gray-100 bg-white'}`}>
          <p className="flex-1 text-xs font-semibold text-gray-500 flex items-start gap-2">
            <Eye size={16} className={`shrink-0 mt-0.5 ${acesso.simulando ? 'text-[#a65f00]' : 'text-[#048187]'}`} />
            {acesso.simulando
              ? <span>Você está vendo esta aba como {acesso.simulando.tipo === 'unidade' ? <>o <strong className="text-gray-800">gestor da unidade {acesso.simulando.nome}</strong></> : <>o <strong className="text-gray-800">consultor {acesso.simulando.nome}</strong></>}.</span>
              : <span>Use o “Ver como” para conferir o que cada gestor de unidade ou consultor vai enxergar.</span>}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <SeletorVerComo opcoes={opcoesVerComo} valor={verComo} aoMudar={mudarVerComo} carregando={atualizando} />
            {acesso.simulando && <button type="button" onClick={() => mudarVerComo('')} className="rounded-xl bg-[#a65f00] px-3 py-2 text-xs font-semibold text-white hover:bg-[#8a4f00]">Voltar à visão completa</button>}
          </div>
        </div>
      )}

      {/* Resumo */}
      {nivel === 'consultor' ? (
        eu ? (
          <section className="rounded-[24px] bg-white border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-5 pt-4 sm:pt-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#048187]">Seu resultado</p>
              <h2 className="mt-1 text-lg sm:text-xl font-bold text-gray-800">Como você está na campanha</h2>
            </div>
            <ul className="mt-2"><LinhaPessoa pessoa={eu} aberta={pessoasAbertas.has(eu.participante)} aoAlternar={() => alternarPessoa(eu.participante)} /></ul>
          </section>
        ) : (
          <div className="rounded-[24px] bg-white border border-gray-100 p-8 text-center shadow-sm">
            <UserRound size={26} className="mx-auto text-gray-300" />
            <p className="mt-3 text-sm font-semibold text-gray-700">Seu resultado ainda não aparece na campanha.</p>
            <p className="mt-1 text-xs font-semibold text-gray-400">Ele aparece quando você tiver meta cadastrada ou venda no ciclo. Fale com o seu gestor se isso não acontecer.</p>
          </div>
        )
      ) : (
        <section className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <CartaoResumo Icone={Building2} cor="#036b70" titulo={cicloAtual ? `Unidades batendo tudo no ${rotuloCiclo(cicloAtual)}` : 'Unidades batendo tudo'} valor={`${resumo.unidades_batendo_ciclo_atual || 0} de ${resumo.unidades || 0}`}
            detalhe={`${resumo.unidades_vd || 0} da VD e ${resumo.unidades_loja || 0} loja(s), com o ciclo ainda aberto`} />
          <CartaoResumo Icone={Plane} cor="#048187" titulo="Consultores na disputa da viagem" valor={`${resumo.na_disputa_106 || 0} de ${resumo.participantes || 0}`}
            detalhe={resumo.classificados_106 ? `${resumo.classificados_106} já classificado(s)` : 'Precisam bater todas as metas em C14, C15, C16 e C17'} />
          <CartaoResumo Icone={Target} cor="#0b8f6a" titulo={cicloAtual ? `Consultores batendo tudo no ${rotuloCiclo(cicloAtual)}` : 'Consultores batendo tudo'} valor={resumo.batendo_ciclo_atual || 0}
            detalhe={cicloAtual ? 'Até agora, com o ciclo ainda aberto' : 'Nenhum ciclo da campanha em andamento'} />
          <CartaoResumo Icone={BadgeDollarSign} cor="#7c1f31" titulo="Acima de 120% da meta" valor={resumo.acima_superacao || 0}
            detalhe={habilitado109 ? 'Bônus habilitado: o CP passou dos R$ 109 milhões' : `CP em ${emPercentual(meta109 > 0 ? (totalCp / meta109) * 100 : 0)} do caminho até os R$ 109 milhões`} />
        </section>
      )}

      {/* Regras: só o dono vê (e some no "Ver como", para mostrar a tela como os outros veem) */}
      {acesso.pode_editar && !acesso.simulando ? (
      <section className="rounded-[24px] bg-white border border-gray-100 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-800 flex items-center gap-2"><SlidersHorizontal size={16} className="text-[#048187]" /> Regras da campanha</p>
            <p className="mt-0.5 text-[11px] font-semibold text-gray-400">Mesmos números do DASH (Metas e painel da Loja).{calculadoEm ? ` Calculado em ${calculadoEm}.` : ''}</p>
          </div>
          <div className="flex gap-2">
            {acesso.pode_editar && !editandoRegras && <button type="button" onClick={() => setEditandoRegras(true)} className="rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-semibold text-gray-600 hover:border-[#048187] hover:text-[#048187]">Editar regras</button>}
            <button type="button" onClick={() => carregar({ forcar: true })} disabled={atualizando} className="inline-flex items-center gap-1.5 rounded-xl bg-[#048187] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#036b70] disabled:opacity-60">
              <RefreshCw size={14} className={atualizando ? 'animate-spin' : ''} /> {atualizando ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>
        </div>
        {editandoRegras && acesso.pode_editar
          ? <EditorRegras dados={dados} apiUrl={apiUrl} aoCancelar={() => setEditandoRegras(false)} aoSalvar={() => { setEditandoRegras(false); carregar(); }} />
          : <ResumoRegras dados={dados} />}
        {erro && <p className="mt-3 text-xs font-semibold text-[#b42335] flex items-center gap-1.5"><AlertCircle size={14} /> {erro}</p>}
        {acesso.pode_editar && (dados.fora_da_base || []).length > 0 && (
          <p className="mt-3 text-[11px] font-semibold text-gray-400 flex items-start gap-1.5">
            <Info size={13} className="shrink-0 mt-0.5" /> {dados.fora_da_base.join(' e ')} também participam da campanha, mas ainda não têm meta individual no DASH.
          </p>
        )}
      </section>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white border border-gray-100 px-4 py-2.5">
          <p className="text-[11px] font-medium text-slate-400">{calculadoEm ? `Atualizado em ${calculadoEm}.` : 'Resultado da campanha.'}</p>
          <button type="button" onClick={() => carregar({ forcar: true })} disabled={atualizando} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-[#048187] hover:text-[#048187] disabled:opacity-60">
            <RefreshCw size={13} className={atualizando ? 'animate-spin' : ''} /> {atualizando ? 'Atualizando...' : 'Atualizar'}
          </button>
          {erro && <p className="w-full text-xs font-medium text-[#b42335] flex items-center gap-1.5"><AlertCircle size={14} /> {erro}</p>}
        </div>
      )}

      {/* Unidades e consultores */}
      {nivel === 'consultor' ? (
        unidades.length > 0 && (
          <section className="space-y-2">
            <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-gray-400">Sua unidade</p>
            <ul className="space-y-2">
              {unidades.map((u) => (
                <CartaoUnidade key={u.participante} unidade={u} pessoas={[]} mostrarPessoas={false}
                  aberta={unidadesAbertas.has(u.participante)} aoAlternar={() => alternarUnidade(u.participante)}
                  pessoasAbertas={pessoasAbertas} aoAlternarPessoa={alternarPessoa} />
              ))}
            </ul>
          </section>
        )
      ) : (
        <section className="rounded-[24px] bg-[#f7faf9] border border-gray-100 p-3 sm:p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 p-1 pb-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-800">{nivel === 'unidade' ? 'Sua unidade e os consultores dela' : 'Unidades e consultores'}</p>
              <p className="text-[11px] font-semibold text-gray-400">Clique numa unidade para ver os consultores que pertencem a ela.</p>
            </div>
            {unidades.some((u) => u.canal === 'LOJA') && unidades.some((u) => u.canal === 'VD') && (
              <div className="inline-flex rounded-xl bg-white border border-gray-100 p-1 self-start">
                {[{ id: 'todos', r: 'Todas' }, { id: 'VD', r: `VD (${resumo.unidades_vd || 0})` }, { id: 'LOJA', r: `Lojas (${resumo.unidades_loja || 0})` }].map((o) => (
                  <button key={o.id} type="button" onClick={() => setCanal(o.id)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${canal === o.id ? 'bg-[#048187] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{o.r}</button>
                ))}
              </div>
            )}
            <label className="relative lg:w-72">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar unidade ou consultor" className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm font-semibold text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#048187]/25" />
            </label>
          </div>
          <div className={`hidden lg:grid ${GRADE_LINHA} gap-4 px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-gray-400`}>
            <span>Unidade</span><span className="w-[208px]">Ciclos (metas completas)</span><span>Situação</span><span>Receita • Bônus (meta 120%)</span><span />
          </div>
          {unidadesVisiveis.length ? (
            <ul className="space-y-2">
              {unidadesVisiveis.map(({ unidade, pessoas, busca: porBusca }) => (
                <CartaoUnidade key={unidade.participante} unidade={unidade} pessoas={pessoas}
                  aberta={porBusca || unidadesAbertas.has(unidade.participante)} aoAlternar={() => alternarUnidade(unidade.participante)}
                  pessoasAbertas={pessoasAbertas} aoAlternarPessoa={alternarPessoa} />
              ))}
            </ul>
          ) : (
            <p className="p-10 text-center text-sm font-semibold text-gray-400">{unidades.length ? 'Nenhuma unidade ou consultor com essa busca.' : 'Nenhuma unidade vinculada ao seu acesso.'}</p>
          )}
        </section>
      )}
    </div>
  );
}
