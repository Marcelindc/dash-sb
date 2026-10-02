import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  AlertCircle, BadgeDollarSign, Check, ChevronDown, Clock, Info, Loader2, Lock, Minus, Plane,
  RefreshCw, Save, Search, SlidersHorizontal, Store, Target, TrendingUp, Users, X
} from 'lucide-react';

// Resultado Individual da Campanha Incentivo 2026: cada consultor VD e consultora de Loja,
// ciclo a ciclo (C14 a C17), na Viagem (106: metas completas em todos os ciclos) e no
// Bônus (109: 120% da meta do C14 ao C17 + indicadores IAF). Os números são os do DASH.

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

const STATUS_BONUS = {
  elegivel: 'Elegível',
  nao_elegivel: 'Não elegível',
  no_caminho: 'Acima de 120%',
  abaixo: 'Abaixo de 120%',
};

function iniciais(nome) {
  const partes = String(nome || '').trim().split(/\s+/).filter(Boolean);
  return ((partes[0]?.[0] || '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase() || '?';
}

function SeloCanal({ canal }) {
  return canal === 'LOJA'
    ? <span className="inline-flex items-center gap-1 rounded-full bg-[#eef8f8] px-2 py-0.5 text-[10px] font-black text-[#2a9aa0]"><Store size={11} /> Loja</span>
    : <span className="inline-flex items-center gap-1 rounded-full bg-[#e3f3f3] px-2 py-0.5 text-[10px] font-black text-[#036b70]"><Users size={11} /> VD</span>;
}

function PilulaCiclo({ ciclo }) {
  const info = STATUS_CICLO[ciclo.status] || STATUS_CICLO.sem_dados;
  const { Icone } = info;
  const total = ciclo.criterios?.length || 0;
  const batidos = total - (ciclo.faltam || 0);
  const parcial = ciclo.status === 'em_andamento' && total > 0;
  return (
    <span title={`${rotuloCiclo(ciclo.numero)}: ${info.texto}${total ? ` (${batidos} de ${total} metas)` : ''}`} className={`inline-flex flex-col items-center justify-center w-[46px] h-[42px] rounded-xl border text-[10px] font-black leading-none ${info.classe}`}>
      <span className="opacity-80">{rotuloCiclo(ciclo.numero)}</span>
      <span className="mt-1 flex items-center gap-0.5">{Icone ? <Icone size={12} strokeWidth={3} /> : '—'}{parcial && <span className="tabular-nums">{batidos}/{total}</span>}</span>
    </span>
  );
}

function CartaoResumo({ Icone, cor, titulo, valor, detalhe }) {
  return (
    <article className="rounded-[22px] bg-white border border-gray-100 shadow-sm p-4 sm:p-5">
      <div className="flex items-center gap-2.5">
        <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${cor}14`, color: cor }}><Icone size={18} /></span>
        <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.12em] text-gray-400 leading-tight">{titulo}</p>
      </div>
      <p className="mt-3 text-2xl sm:text-3xl font-black tabular-nums text-gray-800">{valor}</p>
      <p className="mt-1 text-[11px] font-semibold text-gray-400 leading-snug">{detalhe}</p>
    </article>
  );
}

function Detalhe({ pessoa }) {
  const ciclos = pessoa.ciclos || [];
  const chaves = [];
  for (const ciclo of ciclos) for (const criterio of ciclo.criterios || []) if (!chaves.find((c) => c.chave === criterio.chave)) chaves.push({ chave: criterio.chave, rotulo: criterio.rotulo });
  const sup = pessoa.superacao || {};
  return (
    <div className="border-t border-gray-100 bg-[#fbfcfc] px-3 sm:px-5 py-4 grid grid-cols-1 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4">
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#048187] flex items-center gap-1.5"><Plane size={13} /> Viagem • metas de cada ciclo</p>
        {chaves.length ? (
          <div className="mt-2 overflow-x-auto rounded-xl border border-gray-100 bg-white">
            <table className="w-full min-w-[460px] text-[11px]">
              <thead>
                <tr className="bg-[#f5f9f9] text-gray-500">
                  <th className="px-3 py-2 text-left font-black">Meta</th>
                  {ciclos.map((c) => <th key={c.numero} className="px-2 py-2 text-center font-black">{rotuloCiclo(c.numero)}</th>)}
                </tr>
              </thead>
              <tbody>
                {chaves.map(({ chave, rotulo }) => (
                  <tr key={chave} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-black text-gray-700 whitespace-nowrap">{rotulo}</td>
                    {ciclos.map((c) => {
                      const criterio = (c.criterios || []).find((x) => x.chave === chave);
                      if (!criterio) return <td key={c.numero} className="px-2 py-2 text-center text-gray-300">—</td>;
                      const fechado = c.situacao_ciclo === 'encerrado';
                      return (
                        <td key={c.numero} className="px-2 py-2 text-center">
                          <span className={`inline-flex items-center gap-1 font-black tabular-nums ${criterio.ok ? 'text-green-700' : fechado ? 'text-[#b42335]' : 'text-[#a65f00]'}`}>
                            {criterio.ok ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
                            {emValor(criterio.valor, criterio.formato)}
                          </span>
                          <span className="block text-[10px] font-bold text-gray-400">{criterio.sem_meta ? 'sem meta' : `meta ${emValor(criterio.meta, criterio.formato)}`}</span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="mt-2 text-xs font-bold text-gray-400">Ainda sem ciclo com resultado.</p>}
        <p className="mt-2 text-[10px] font-semibold text-gray-400">Verde: meta batida. Laranja: ainda não bateu, ciclo em andamento. Vermelho: ciclo fechado sem bater.</p>
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#7c1f31] flex items-center gap-1.5"><BadgeDollarSign size={13} /> Bônus • C14 até agora</p>
        <div className="mt-2 rounded-xl border border-gray-100 bg-white p-3.5">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xs font-bold text-gray-500">Receita do período</p>
            <p className="text-sm font-black tabular-nums text-gray-800">{emValor(sup.receita, 'moeda')} <span className="text-gray-400 font-bold">de {emValor(sup.meta, 'moeda')}</span></p>
          </div>
          <div className="mt-2 relative h-2.5 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${limitar((Number(sup.percentual || 0) / 150) * 100)}%`, background: Number(sup.percentual || 0) >= 120 ? '#16a34a' : '#7c1f31' }} />
            <span className="absolute top-0 bottom-0 w-0.5 bg-gray-800/60" style={{ left: `${(120 / 150) * 100}%` }} />
          </div>
          <p className="mt-1.5 text-[10px] font-bold text-gray-400">{emPercentual(sup.percentual)} da meta • precisa de 120% (marca na barra)</p>
          <ul className="mt-3 space-y-1.5">
            {(sup.criterios || []).map((c) => (
              <li key={c.chave} className="flex items-center justify-between gap-2 text-[11px]">
                <span className={`inline-flex items-center gap-1.5 font-black ${c.ok ? 'text-green-700' : 'text-gray-500'}`}>
                  {c.ok ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />} {c.rotulo}
                </span>
                <span className="font-bold tabular-nums text-gray-500">{c.chave === 'receita_120' ? emPercentual(c.valor) : `${emValor(c.valor, c.formato)} / ${c.sem_meta ? 'sem meta' : emValor(c.meta, c.formato)}`}</span>
              </li>
            ))}
          </ul>
          {sup.ok && (
            <p className="mt-3 rounded-lg bg-green-50 border border-green-100 px-2.5 py-2 text-[11px] font-bold text-green-800">
              Parte estimada do bônus: <strong className="tabular-nums">{emReais(sup.parte_estimada)}</strong> (se a campanha terminasse hoje e o CP chegar a 109 MM)
            </p>
          )}
        </div>
      </div>
    </div>
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
      <p className="text-[11px] font-black text-gray-600">{titulo}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {(dados.indicadores_disponiveis?.[canal] || []).filter((i) => travarReceita || i.chave !== 'receita').map((i) => {
          const travado = travarReceita && i.chave === 'receita';
          const ativo = travado || regras[chave].includes(i.chave);
          return (
            <button key={i.chave} type="button" disabled={travado} onClick={() => alternar(chave, i.chave)}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-black transition-colors ${ativo ? 'bg-[#048187] border-[#048187] text-white' : 'bg-white border-gray-200 text-gray-500 hover:border-[#048187] hover:text-[#048187]'} ${travado ? 'opacity-80 cursor-not-allowed' : ''}`}>
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
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#048187]">Viagem (106) • bater em todos os ciclos</p>
          {grupo('Venda Direta', 'vd_106', 'VD', true)}
          {grupo('Loja', 'loja_106', 'LOJA', true)}
        </div>
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#7c1f31]">Bônus (109) • além dos 120% da receita</p>
          {grupo('Venda Direta (IAF)', 'vd_109', 'VD')}
          {grupo('Loja', 'loja_109', 'LOJA')}
          <div>
            <p className="text-[11px] font-black text-gray-600">Divisão dos R$ 50 mil</p>
            <select value={regras.divisao_bonus} onChange={(e) => setRegras((r) => ({ ...r, divisao_bonus: e.target.value }))} className="mt-1.5 w-full sm:w-auto rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#048187]/30">
              {(dados.divisoes_bonus || []).map((d) => <option key={d.chave} value={d.chave}>{d.rotulo}</option>)}
            </select>
          </div>
        </div>
      </div>
      {erro && <p className="text-xs font-bold text-[#b42335] flex items-center gap-1.5"><AlertCircle size={14} /> {erro}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" onClick={aoCancelar} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-black text-gray-500 hover:text-gray-700">Cancelar</button>
        <button type="button" onClick={salvar} disabled={salvando} className="inline-flex items-center gap-1.5 rounded-xl bg-[#048187] px-4 py-2 text-xs font-black text-white hover:bg-[#036b70] disabled:opacity-60">
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
    <p className="text-[11px] font-semibold text-gray-500"><span className="font-black text-gray-700">{titulo}:</span> {itens.length ? itens.join(' + ') : 'só a receita'}</p>
  );
  return (
    <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
      <div className="rounded-xl bg-[#f6fbfb] border border-[#e1f0f0] p-3 space-y-1">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#048187]">Viagem (106) • em C14, C15, C16 e C17</p>
        {linha('VD', nomes('VD', r.vd_106))}
        {linha('Loja', nomes('LOJA', r.loja_106))}
      </div>
      <div className="rounded-xl bg-[#fbf7f8] border border-[#f1e3e6] p-3 space-y-1">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#7c1f31]">Bônus (109) • somando C14 a C17</p>
        {linha('VD', ['Receita ≥ 120%', ...nomes('VD', r.vd_109)])}
        {linha('Loja', ['Receita ≥ 120%', ...nomes('LOJA', r.loja_109)])}
        <p className="text-[11px] font-semibold text-gray-500"><span className="font-black text-gray-700">Divisão:</span> {divisao}</p>
      </div>
    </div>
  );
}

export default function ResultadoIndividualCampanha2026({ apiUrl, totalCp = 0, meta109 = 109000000 }) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState('');
  const [canal, setCanal] = useState('todos');
  const [filtro, setFiltro] = useState('todos');
  const [busca, setBusca] = useState('');
  const [aberto, setAberto] = useState(null);
  const [editandoRegras, setEditandoRegras] = useState(false);

  const carregar = useCallback(async (forcar = false) => {
    if (forcar) setAtualizando(true);
    setErro('');
    try {
      const resposta = await axios.get(`${apiUrl}/campanha-incentivo-2026/individual`, {
        params: { _t: Date.now() },
        headers: forcar ? { 'X-Force-Refresh': '1' } : {},
      });
      setDados(resposta.data);
    } catch (e) {
      setErro(e?.response?.data?.detail || e?.message || 'Não foi possível calcular o resultado individual.');
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    let ativo = true;
    axios.get(`${apiUrl}/campanha-incentivo-2026/individual`, { params: { _t: Date.now() } })
      .then((r) => { if (ativo) setDados(r.data); })
      .catch((e) => { if (ativo) setErro(e?.response?.data?.detail || e?.message || 'Não foi possível calcular o resultado individual.'); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [apiUrl]);

  const participantes = useMemo(() => dados?.participantes || [], [dados]);
  const visiveis = useMemo(() => {
    const termo = semAcento(busca.trim());
    return participantes.filter((p) => {
      if (canal !== 'todos' && p.canal !== canal) return false;
      if (filtro === 'disputa' && !['na_disputa', 'classificado'].includes(p.status_106)) return false;
      if (filtro === 'fora' && p.status_106 !== 'fora') return false;
      if (filtro === 'bonus' && !p.superacao?.ok) return false;
      if (termo && !semAcento(`${p.nome} ${p.unidade}`).includes(termo)) return false;
      return true;
    });
  }, [participantes, canal, filtro, busca]);

  if (carregando) {
    return (
      <div className="rounded-[24px] bg-white border border-gray-100 p-10 sm:p-14 text-center shadow-sm">
        <Loader2 size={30} className="mx-auto animate-spin text-[#048187]" />
        <p className="mt-4 text-sm font-black text-gray-700">Calculando o resultado de cada consultor...</p>
        <p className="mt-1 text-xs font-semibold text-gray-400">Na primeira vez pode levar até 1 minuto: o DASH confere receita e indicadores de cada pessoa, ciclo a ciclo.</p>
      </div>
    );
  }

  if (!dados) {
    return (
      <div className="rounded-[24px] bg-white border border-red-100 p-8 text-center shadow-sm">
        <AlertCircle size={26} className="mx-auto text-[#b42335]" />
        <p className="mt-3 text-sm font-black text-gray-700">{erro || 'Não foi possível calcular o resultado individual.'}</p>
        <button type="button" onClick={() => { setCarregando(true); carregar(true); }} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#048187] px-4 py-2 text-xs font-black text-white"><RefreshCw size={14} /> Tentar de novo</button>
      </div>
    );
  }

  const resumo = dados.resumo || {};
  const cicloAtual = resumo.ciclo_atual ? Number(String(resumo.ciclo_atual).split('/')[0]) : null;
  const habilitado109 = totalCp >= meta109;
  const calculadoEm = dados.calculado_em ? new Date(dados.calculado_em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : null;
  const filtros = [
    { id: 'todos', rotulo: 'Todos' },
    { id: 'disputa', rotulo: 'Na disputa da viagem' },
    { id: 'fora', rotulo: 'Fora da viagem' },
    { id: 'bonus', rotulo: 'Acima de 120%' },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Resumo */}
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <CartaoResumo Icone={Plane} cor="#048187" titulo="Na disputa da viagem" valor={`${resumo.na_disputa_106 || 0} de ${resumo.participantes || 0}`}
          detalhe={resumo.classificados_106 ? `${resumo.classificados_106} já classificado(s)` : 'Precisam bater todas as metas em C14, C15, C16 e C17'} />
        <CartaoResumo Icone={Target} cor="#0b8f6a" titulo={cicloAtual ? `Batendo tudo no ${rotuloCiclo(cicloAtual)}` : 'Batendo tudo no ciclo'} valor={resumo.batendo_ciclo_atual || 0}
          detalhe={cicloAtual ? 'Até agora, com o ciclo ainda aberto' : 'Nenhum ciclo da campanha em andamento'} />
        <CartaoResumo Icone={TrendingUp} cor="#7c1f31" titulo="Acima de 120% da meta" valor={resumo.acima_superacao || 0}
          detalhe="Somando C14 até agora, com os indicadores do bônus" />
        <CartaoResumo Icone={BadgeDollarSign} cor="#b86a00" titulo="Bônus de R$ 50 mil" valor={habilitado109 ? 'Habilitado' : emPercentual(meta109 > 0 ? (totalCp / meta109) * 100 : 0)}
          detalhe={habilitado109 ? 'O CP já passou dos R$ 109 milhões' : 'do caminho até os R$ 109 milhões do CP'} />
      </section>

      {/* Regras */}
      <section className="rounded-[24px] bg-white border border-gray-100 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-gray-800 flex items-center gap-2"><SlidersHorizontal size={16} className="text-[#048187]" /> Regras usadas no cálculo</p>
            <p className="mt-0.5 text-[11px] font-semibold text-gray-400">Mesmos números do Ranking individual (VD) e do painel da Loja.{calculadoEm ? ` Calculado em ${calculadoEm}.` : ''}</p>
          </div>
          <div className="flex gap-2">
            {!editandoRegras && <button type="button" onClick={() => setEditandoRegras(true)} className="rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-black text-gray-600 hover:border-[#048187] hover:text-[#048187]">Editar regras</button>}
            <button type="button" onClick={() => carregar(true)} disabled={atualizando} className="inline-flex items-center gap-1.5 rounded-xl bg-[#048187] px-3.5 py-2 text-xs font-black text-white hover:bg-[#036b70] disabled:opacity-60">
              <RefreshCw size={14} className={atualizando ? 'animate-spin' : ''} /> {atualizando ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>
        </div>
        {editandoRegras
          ? <EditorRegras dados={dados} apiUrl={apiUrl} aoCancelar={() => setEditandoRegras(false)} aoSalvar={() => { setEditandoRegras(false); carregar(false); }} />
          : <ResumoRegras dados={dados} />}
        {erro && <p className="mt-3 text-xs font-bold text-[#b42335] flex items-center gap-1.5"><AlertCircle size={14} /> {erro}</p>}
        {(dados.fora_da_base || []).length > 0 && (
          <p className="mt-3 text-[11px] font-semibold text-gray-400 flex items-start gap-1.5">
            <Info size={13} className="shrink-0 mt-0.5" /> {dados.fora_da_base.join(' e ')} também participam da campanha, mas ainda não têm meta individual no DASH.
          </p>
        )}
      </section>

      {/* Lista */}
      <section className="rounded-[24px] bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="inline-flex rounded-xl bg-gray-100 p-1 self-start">
              {[{ id: 'todos', r: 'Todos' }, { id: 'VD', r: `VD (${resumo.vd || 0})` }, { id: 'LOJA', r: `Loja (${resumo.loja || 0})` }].map((o) => (
                <button key={o.id} type="button" onClick={() => setCanal(o.id)} className={`rounded-lg px-3 py-1.5 text-xs font-black transition-colors ${canal === o.id ? 'bg-white text-[#048187] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{o.r}</button>
              ))}
            </div>
            <label className="relative flex-1 lg:max-w-xs">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar nome ou equipe" className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm font-semibold text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#048187]/25" />
            </label>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1">
            {filtros.map((f) => (
              <button key={f.id} type="button" onClick={() => setFiltro(f.id)} className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-black transition-colors ${filtro === f.id ? 'bg-[#048187] border-[#048187] text-white' : 'bg-white border-gray-200 text-gray-500 hover:text-[#048187]'}`}>{f.rotulo}</button>
            ))}
          </div>
        </div>

        <div className="hidden lg:grid grid-cols-[minmax(0,1.5fr)_auto_minmax(0,0.75fr)_minmax(0,1fr)_28px] gap-4 px-5 py-2.5 bg-[#f7faf9] text-[10px] font-black uppercase tracking-[0.1em] text-gray-400">
          <span>Pessoa</span><span className="w-[208px]">Ciclos (metas completas)</span><span>Viagem</span><span>Bônus (meta 120%)</span><span />
        </div>

        {visiveis.length ? (
          <ul>
            {visiveis.map((p) => {
              const viagem = STATUS_VIAGEM[p.status_106] || STATUS_VIAGEM.na_disputa;
              const sup = p.superacao || {};
              const expandido = aberto === p.participante;
              return (
                <li key={p.participante} className="border-t border-gray-100 first:border-t-0">
                  <button type="button" onClick={() => setAberto(expandido ? null : p.participante)} aria-expanded={expandido}
                    className="w-full text-left px-4 sm:px-5 py-3.5 grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_auto_minmax(0,0.75fr)_minmax(0,1fr)_28px] gap-3 lg:gap-4 items-center hover:bg-[#f9fcfc] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-xs font-black ${p.canal === 'LOJA' ? 'bg-[#e6f6f7] text-[#2a9aa0]' : 'bg-[#048187] text-white'}`}>{iniciais(p.nome)}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-gray-800 truncate">{p.nome}</p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 min-w-0"><SeloCanal canal={p.canal} /> <span className="truncate">{p.unidade}</span></p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">{(p.ciclos || []).map((c) => <PilulaCiclo key={c.numero} ciclo={c} />)}</div>
                    <div><span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black ${viagem.classe}`}>{viagem.texto}</span></div>
                    <div className="min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className={`text-sm font-black tabular-nums ${sup.ok ? 'text-green-700' : 'text-gray-700'}`}>{emPercentual(sup.percentual)}</span>
                        <span className="text-[10px] font-bold text-gray-400 truncate">{sup.ok && sup.parte_estimada ? `≈ ${emReais(sup.parte_estimada)}` : STATUS_BONUS[p.status_109] || ''}</span>
                      </div>
                      <div className="mt-1.5 relative h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${limitar((Number(sup.percentual || 0) / 150) * 100)}%`, background: sup.ok ? '#16a34a' : Number(sup.percentual || 0) >= 120 ? '#b86a00' : '#7c1f31' }} />
                        <span className="absolute top-0 bottom-0 w-0.5 bg-gray-700/50" style={{ left: '80%' }} />
                      </div>
                    </div>
                    <ChevronDown size={18} className={`hidden lg:block text-gray-400 transition-transform ${expandido ? 'rotate-180' : ''}`} />
                  </button>
                  {expandido && <Detalhe pessoa={p} />}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="p-10 text-center text-sm font-bold text-gray-400">Ninguém encontrado com esses filtros.</p>
        )}
      </section>
    </div>
  );
}
