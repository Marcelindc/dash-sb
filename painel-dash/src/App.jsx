import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, PieChart, Pie, Cell, BarChart, Bar, Tooltip, CartesianGrid, LabelList, Legend } from 'recharts';
import { Eye, EyeOff, UserCircle, LayoutDashboard, SlidersHorizontal, ChevronLeft, ChevronRight, X, BarChart2, Users, Database, Settings, LogOut, User, Save, Plus, ShieldCheck, KeyRound, Trash2, Pencil, TrendingUp, TrendingDown, Target, RefreshCcw, BadgeDollarSign, Sparkles, Scissors, AlertCircle, CheckCircle, Upload, Search, CalendarDays, FileSpreadsheet, Scale, Trophy, ArrowUpRight, ArrowDownRight, Medal } from 'lucide-react';
import logoEmpresa from './assets/LOGO VERDE SB.png';
import logoBrancaLogin from './assets/logo-branca.png';
import TelaGestaoNucleo from './telas/TelaGestaoNucleo';

const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8001' : 'https://xc3lin-dash-sb-api.hf.space')).replace(/\/$/, '');
const TOKEN_STORAGE_KEY = 'dashSbAccessToken';
const TELA_ATUAL_STORAGE_KEY = 'dashSbTelaAtual';
const VISAO_METAS_STORAGE_KEY = 'dashSbVisaoMetas';
const ESTRUTURA_META_STORAGE_KEY = 'dashSbEstruturaMeta';
const CANAL_ATUAL_STORAGE_KEY = 'dashSbCanalAtual';
const APP_NAME = 'DASH COMERCIAL SB';

const aplicarTokenAxios = (token) => {
  if (token) axios.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete axios.defaults.headers.common.Authorization;
};

const tokenInicial = localStorage.getItem(TOKEN_STORAGE_KEY);
aplicarTokenAxios(tokenInicial);
const CORES_GRAFICO = ['#048187', '#712231', '#F97316', '#FACC15', '#A3E635', '#257B9C'];
const CORES_ESTRUTURA = ['#048187', '#15956B', '#5BB2B4', '#257B9C', '#56549E', '#712231', '#F97316'];

const IconeCanalVD = ({ size = 22, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path d="M32 8L49 17.5V36.5L32 46L15 36.5V17.5L32 8Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
    <path d="M15.5 18L32 27.5L48.5 18" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M32 27.5V46" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <path d="M32 46V52" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <path d="M32 52C26 52 22 55 22 60H42C42 55 38 52 32 52Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
    <path d="M18 42L10 50" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <path d="M10 50C5 50 2 53 2 60H18C18 53 15 50 10 50Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
    <path d="M46 42L54 50" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <path d="M54 50C49 50 46 53 46 60H62C62 53 59 50 54 50Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
  </svg>
);

const IconeCanalLoja = ({ size = 22, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path d="M10 26H54L50 14H14L10 26Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
    <path d="M12 26V56H42" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M52 26V40" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <path d="M18 56V36H34V56" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
    <path d="M10 26C10 31 14 34 18 34C22 34 26 31 26 26C26 31 30 34 34 34C38 34 42 31 42 26C42 31 46 34 50 34C54 34 56 31 56 26" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="42" y="42" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="4" />
    <path d="M46 49H56" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
  </svg>
);


const obterNomeExibicaoConsultor = (item) => item?.nome_exibicao || item?.nome_social || item?.nome || '-';

const permissoesPadrao = {
  admin: ['Dashboard', 'Metas', 'N1', 'N2', 'Ranking', 'Comparativo', 'Histórico', 'Revendedores', 'Cadastro', 'Base', 'Loja', 'LojaVisaoGeral', 'Configurações', 'Perfil'],
  gestor: ['Dashboard', 'Metas', 'N1', 'N2', 'Ranking', 'Comparativo', 'Histórico', 'Revendedores', 'Cadastro', 'Loja', 'LojaVisaoGeral', 'Perfil'],
  visualizador: ['Dashboard', 'Metas', 'N1', 'N2', 'Ranking', 'Comparativo', 'Histórico', 'Revendedores', 'Loja', 'LojaVisaoGeral', 'Perfil']
};

const obterNomeAba = (nome) => ({
  Dashboard: 'Visão Geral',
  Metas: 'Metas Estruturas',
  N1: 'N1',
  N2: 'N2',
  Loja: 'LOJA',
  LojaVisaoGeral: 'Visão Geral',
}[nome] || nome);


const ABAS_SISTEMA = ['Dashboard', 'Metas', 'N1', 'N2', 'Ranking', 'Comparativo', 'Histórico', 'Revendedores', 'Cadastro', 'Base', 'Loja', 'LojaVisaoGeral', 'Configurações', 'Perfil'];
const PERFIS_SISTEMA = ['admin', 'gestor', 'visualizador'];

const normalizarPermissoesSistema = (permissoes = {}) => {
  const existeConfiguracaoSalva = permissoes && typeof permissoes === 'object' &&
    PERFIS_SISTEMA.some((perfil) => Array.isArray(permissoes?.[perfil]));

  if (!existeConfiguracaoSalva) {
    return {
      admin: [...permissoesPadrao.admin],
      gestor: [...permissoesPadrao.gestor],
      visualizador: [...permissoesPadrao.visualizador]
    };
  }

  const normalizadas = {};

  PERFIS_SISTEMA.forEach((perfil) => {
    const listaSalva = Array.isArray(permissoes?.[perfil]) ? permissoes[perfil] : [];
    const listaMigrada = listaSalva.map((aba) => aba === 'Consultores' ? 'Cadastro' : aba);
    normalizadas[perfil] = Array.from(new Set(listaMigrada.filter((aba) => ABAS_SISTEMA.includes(aba))));
  });

  // Garante que a nova aba Histórico apareça mesmo quando as permissões antigas já estavam salvas no banco.
  PERFIS_SISTEMA.forEach((perfil) => {
    if (!normalizadas[perfil].includes('Histórico')) normalizadas[perfil].push('Histórico');
  });

  // O admin nunca pode perder acesso à própria tela de configuração/perfil.
  ['Configurações', 'Perfil'].forEach((abaObrigatoria) => {
    if (!normalizadas.admin.includes(abaObrigatoria)) {
      normalizadas.admin.push(abaObrigatoria);
    }
  });

  return normalizadas;
};

const filtroVazio = { nucleos: [], unidades: [], estruturas: [], consultores: [], situacoes: [], data_inicio: '', data_fim: '' };
const buscaFiltrosVazia = { nucleos: '', unidades: '', estruturas: '', consultores: '', situacoes: '' };
const cicloFormVazio = { ciclo: '', data_inicio: '', data_fim: '', meta_ciclo: '', status_ciclo: 'ativo' };
const consultorVazio = { id_colaborador: '', nome: '', nome_social: '', estrutura: '', canal: 'ESPAÇO DO REVENDEDOR', status_consultor: 'ativo', peso_meta: 0 };

const formatarMoeda = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(Number(v || 0));
const formatarNumeroBR = (v, casas = 0) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
const calcularUpa = (totalItens, atividadeRealizada) => {
  const itens = Number(totalItens || 0);
  const atividade = Number(atividadeRealizada || 0);
  return atividade > 0 ? itens / atividade : 0;
};
const formatarAbrev = (v) => {
  const a = Math.abs(Number(v || 0)); const s = Number(v || 0) < 0 ? '-' : '';
  if (a >= 1000000) return `${s}R$${(a / 1000000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} Mi`;
  if (a >= 1000) return `${s}R$${(a / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} Mil`;
  return `${s}R$${a.toLocaleString('pt-BR')}`;
};
const formatarTickMoeda = (v) => {
  const n = Number(v || 0);
  if (n >= 1000000) return `R$${(n / 1000000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} Mi`;
  if (n >= 1000) return `R$${(n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}k`;
  return `R$${n.toLocaleString('pt-BR')}`;
};
const formatarDataBR = (d) => { if (!d) return '-'; const p = String(d).split('-'); return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d; };
const calcPerc = (r, m) => {
  const meta = Number(m || 0);
  if (!meta || meta <= 0) return 0;
  return (Number(r || 0) / meta) * 100;
};
const corPorFaixaMeta = (percentual) => {
  const valor = Number(percentual || 0);
  if (valor < 70) return '#7c1f31';
  if (valor < 91) return '#ff6f03';
  return '#048187';
};
const calcularQtdMetaAtividade = (baseAtiva, metaPercentual) => {
  const base = Number(baseAtiva || 0);
  const meta = Number(metaPercentual || 0);
  if (!base || base <= 0 || !meta || meta <= 0) return 0;
  return Math.ceil((base * meta) / 100);
};
const calcularFaltamAtivar = (atividadeRealizada, baseAtiva, metaPercentual) => {
  const metaQtd = calcularQtdMetaAtividade(baseAtiva, metaPercentual);
  return Math.max(metaQtd - Number(atividadeRealizada || 0), 0);
};
const formatarFaltamAtivar = (faltam) => Number(faltam || 0) > 0 ? formatarNumeroBR(faltam, 0) : 'Meta batida';

const obterTendenciaVisual = (idStr) => {
  const hash = idStr ? String(idStr).split('').reduce((a,b)=>a+b.charCodeAt(0), 0) : 0;
  if (hash % 3 === 0) return { up: true, val: (hash % 5) + 1 };
  if (hash % 5 === 0) return { up: false, val: (hash % 3) + 1 };
  return { up: true, val: 0 };
};

const SkeletonCard = () => (
  <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-full min-w-0 animate-pulse">
    <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div><div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div><div className="h-2 bg-gray-200 rounded w-full mb-2"></div><div className="h-2 bg-gray-200 rounded w-5/6"></div>
  </div>
);

const DashboardSkeletons = () => (
  <div className="space-y-6">
    <div className="flex justify-end"><div className="h-3 bg-gray-200 rounded w-48 animate-pulse"></div></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 xl:gap-5">{[...Array(6)].map((_, i) => <div key={i} className="h-32"><SkeletonCard /></div>)}</div>
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 xl:gap-6 mt-6"><div className="lg:col-span-2 h-72"><SkeletonCard /></div><div className="lg:col-span-1 h-72"><SkeletonCard /></div><div className="lg:col-span-1 h-72"><SkeletonCard /></div></div>
  </div>
);

const TooltipEstrutura = ({ active, payload }) => {
  if (active && payload && payload.length) return (<div className="bg-white rounded-lg shadow-lg border border-gray-100 p-3"><p className="text-sm font-bold text-gray-700 mb-1">{payload[0].payload.Estrutura}</p><p className="text-xs text-gray-500">Realizado: <strong>{formatarMoeda(payload[0].payload.ValorPraticado || 0)}</strong></p></div>);
  return null;
};

const TooltipGrafico = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload; const label = data.Estrutura || data.Consultor || data.name || ''; const val = data.ValorPraticado || data.value || 0;
    return (<div className="bg-white rounded-lg shadow-lg border border-gray-100 p-3"><p className="text-sm font-bold text-gray-700 mb-1">{label}</p><p className="text-xs text-gray-500">Realizado: <strong>{formatarMoeda(val)}</strong></p></div>);
  }
  return null;
};

const CardMetaNova = ({ titulo, valor, percentual, labelMeta, valorMeta, onClickExpandir }) => {
  const percentualNumero = Number(percentual || 0);
  const percFix = Math.min(percentualNumero, 100);
  const corDesempenho = percentual !== undefined ? corPorFaixaMeta(percentualNumero) : '#048187';
  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-full min-w-0 transition-all hover:shadow-md">
      <div className="min-w-0">
        <div className="flex items-center justify-between mb-1 min-w-0"><h3 className="text-[10px] sm:text-[11px] font-bold uppercase text-gray-400 truncate pr-1 tracking-wide">{titulo}</h3>{onClickExpandir && (<button type="button" onClick={onClickExpandir} className="text-[#048187] hover:text-[#036b70] bg-[#e6f6f7] p-1.5 rounded-full shrink-0 transition-colors"><Eye size={14} /></button>)}</div>
        <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tighter truncate leading-tight mt-1" style={{ color: corDesempenho }}>{valor}</p>
        {percentual !== undefined && (<div className="mt-2"><p className="text-[10px] sm:text-[11px] font-bold truncate mb-1.5" style={{ color: corDesempenho }}>{percentualNumero.toFixed(1)}% <span className="text-gray-400 font-medium">da meta</span></p><div className="w-full bg-gray-100 h-1.5 rounded-full"><div className="h-1.5 rounded-full" style={{ width: `${percFix}%`, backgroundColor: corDesempenho }} /></div></div>)}
      </div>
      <div className="mt-4 flex items-center justify-between min-w-0 gap-2 border-t border-gray-50 pt-3"><p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase truncate">{labelMeta}</p><p className="text-xs sm:text-sm font-bold text-gray-700 truncate">{valorMeta}</p></div>
    </div>
  );
};

const CardMini = ({ titulo, valor, percentual, labelMeta, valorMeta, onClickExpandir, isTendencia, tendenciaIcon: TIcon, tendenciaStatus }) => {
  const percentualNumero = Number(percentual || 0);
  const percFix = Math.min(percentualNumero, 100);
  const corDesempenho = isTendencia
    ? (percentualNumero >= 100 ? '#16a34a' : '#ef4444')
    : (percentual !== undefined ? corPorFaixaMeta(percentualNumero) : '#048187');

  return (
    <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-full min-w-0 transition-all hover:shadow-md">
      <div className="min-w-0">
        <div className="flex items-center justify-between mb-0.5 min-w-0"><h3 className="text-[10px] font-bold uppercase text-gray-500 truncate pr-1">{titulo}</h3>{onClickExpandir && <button type="button" onClick={onClickExpandir} className="text-[#048187] hover:text-[#036b70] shrink-0"><Eye size={14} /></button>}</div>
        <div className="flex items-center gap-1 min-w-0"><p className="text-lg sm:text-xl lg:text-2xl font-extrabold tracking-tighter truncate leading-tight" style={{ color: corDesempenho }}>{valor}</p>{isTendencia && TIcon && <TIcon size={16} className="shrink-0" style={{ color: corDesempenho }} />}</div>
        {percentual !== undefined && (<div className="mt-1">{isTendencia ? (<p className="text-[9px] font-bold truncate mb-1" style={{ color: corDesempenho }}>{tendenciaStatus}</p>) : (<p className="text-[9px] font-bold truncate mb-1" style={{ color: corDesempenho }}>{percentualNumero.toFixed(1)}% <span className="text-gray-400 font-medium">da meta</span></p>)}<div className="w-full bg-gray-100 h-1 rounded-full"><div className="h-1 rounded-full" style={{ width: `${percFix}%`, backgroundColor: corDesempenho }} /></div></div>)}
      </div>
      <div className="mt-3 flex items-center justify-between min-w-0 gap-2 border-t border-gray-50 pt-2"><p className="text-[9px] font-bold text-gray-400 uppercase truncate">{labelMeta}</p><p className="text-[10px] sm:text-[11px] font-bold text-gray-700 truncate">{valorMeta}</p></div>
    </div>
  );
};

const CardVersus = ({ titulo, val1, val2, desc1, desc2, formataVal, isPerc }) => {
  const v1 = Number(val1 || 0); const v2 = Number(val2 || 0); const total = v1 + v2; const p1 = total > 0 ? (v1 / total) * 100 : 50; const p2 = total > 0 ? (v2 / total) * 100 : 50; const diff = v1 - v2;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 flex flex-col justify-between min-h-[140px] min-w-0 transition-all hover:shadow-md">
      <h3 className="text-center font-bold text-gray-500 uppercase text-[10px] sm:text-xs mb-4 truncate">{titulo}</h3>
      <div className="flex justify-between items-end mb-3 min-w-0 gap-2 relative">
        <div className="flex flex-col text-[#048187] min-w-0"><div className="flex items-center gap-1">{diff > 0 && <Trophy size={14} className="text-[#048187] shrink-0" />}<span className="text-lg sm:text-xl xl:text-2xl font-black truncate">{isPerc ? `${v1.toFixed(1)}%` : formataVal(v1)}</span></div>{desc1 && <span className="text-[9px] sm:text-[10px] font-bold mt-1 truncate">{desc1}</span>}</div>
        <div className="flex flex-col text-right text-[#F97316] min-w-0"><div className="flex items-center justify-end gap-1"><span className="text-lg sm:text-xl xl:text-2xl font-black truncate">{isPerc ? `${v2.toFixed(1)}%` : formataVal(v2)}</span>{diff < 0 && <Trophy size={14} className="text-[#F97316] shrink-0" />}</div>{desc2 && <span className="text-[9px] sm:text-[10px] font-bold mt-1 truncate">{desc2}</span>}</div>
      </div>
      <div className="w-full flex h-2.5 rounded-full overflow-hidden shrink-0"><div style={{ width: `${p1}%` }} className="bg-[#048187] border-r-2 border-white transition-all duration-500"></div><div style={{ width: `${p2}%` }} className="bg-[#F97316] transition-all duration-500"></div></div>
    </div>
  );
};

const CardTop5 = ({ titulo, dados, propValor, formatter, corValor, propSubValor, subFormatter, subLabel }) => {
  const sorted = [...(dados || [])].sort((a, b) => Number(b[propValor]) - Number(a[propValor])).slice(0, 5);
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full min-w-0 transition-transform hover:shadow-md">
      <h3 className="text-xs font-bold text-gray-500 uppercase mb-4 border-b border-gray-100 pb-2 truncate">{titulo}</h3>
      <div className="space-y-3.5 flex-1">
        {sorted.map((c, i) => {
          const trend = obterTendenciaVisual(c.id_colaborador);
          const subtituloBase = c.estrutura || '';
          const subtituloExtra = propSubValor ? `${subLabel || ''}${subFormatter ? subFormatter(c[propSubValor]) : c[propSubValor]}` : '';
          const subtitulo = subtituloExtra ? `${subtituloBase} • ${subtituloExtra}` : subtituloBase;
          return (
            <div key={i} className="flex justify-between items-center min-w-0 gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1"><span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0">{i + 1}</span><div className="flex flex-col min-w-0"><span className="text-xs font-bold text-gray-700 truncate">{obterNomeExibicaoConsultor(c)}</span><span className="text-[9px] text-gray-400 truncate">{subtitulo}</span></div></div>
              <div className="flex items-center gap-2 shrink-0"><span className={`font-black text-sm truncate`} style={{ color: corValor }}>{formatter(c[propValor])}</span>{trend.val > 0 ? (trend.up ? <ArrowUpRight size={14} className="text-green-500" /> : <ArrowDownRight size={14} className="text-red-500" />) : (<span className="w-3.5"></span>)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CompUpload = ({ titulo, desc, arq, arqs, setArq, setArqs, onEnv, icone: Icone, mult, load, acaoExtraLabel, onAcaoExtra, acaoExtraLoad }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 min-w-0">
    <div className="flex items-center gap-3 mb-4 min-w-0"><div className="w-11 h-11 rounded-full bg-[#e6f6f7] text-[#048187] flex items-center justify-center shrink-0"><Icone size={22} /></div><div className="min-w-0"><h3 className="font-bold text-gray-700 truncate">{titulo}</h3><p className="text-xs text-gray-400 truncate">{desc}</p></div></div>
    <input type="file" accept=".xlsx,.xls,.csv" multiple={mult} onChange={(e) => { if (mult) setArqs(Array.from(e.target.files || [])); else setArq(e.target.files[0]); }} className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-600 mb-4" />
    {!mult && arq && <p className="text-xs text-gray-500 mb-3 truncate">Arquivo: <strong>{arq.name}</strong></p>}{mult && arqs?.length > 0 && <p className="text-xs text-gray-500 mb-3 truncate"><strong>{arqs.length}</strong> arquivos selecionados</p>}
    <button onClick={onEnv} disabled={load || acaoExtraLoad} className="w-full bg-[#048187] text-white font-bold py-3 rounded-lg hover:bg-[#036b70] disabled:opacity-60 flex items-center justify-center gap-2"><Upload size={18} />{load ? 'Enviando...' : 'Enviar arquivo'}</button>
    {acaoExtraLabel && onAcaoExtra && (
      <button type="button" onClick={onAcaoExtra} disabled={load || acaoExtraLoad} className="w-full mt-3 bg-[#e6f6f7] text-[#048187] font-bold py-3 rounded-lg hover:bg-[#d8f0f1] disabled:opacity-60 flex items-center justify-center gap-2">
        <RefreshCcw size={18} />{acaoExtraLoad ? 'Atualizando via SGI...' : acaoExtraLabel}
      </button>
    )}
  </div>
);

const FormCiclo = ({ form, setForm, onSub, txtBtn }) => (
  <form onSubmit={onSub} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
    <input type="text" placeholder="Ciclo. Ex: 08/2026" value={form.ciclo} onChange={(e) => setForm({ ...form, ciclo: e.target.value })} className="border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187]" required />
    <input type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} className="border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187]" required />
    <input type="date" value={form.data_fim} onChange={(e) => setForm({ ...form, data_fim: e.target.value })} className="border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187]" required />
    <input type="number" placeholder="Meta do ciclo" value={form.meta_ciclo} onChange={(e) => setForm({ ...form, meta_ciclo: e.target.value })} className="border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187]" required />
    <select value={form.status_ciclo} onChange={(e) => setForm({ ...form, status_ciclo: e.target.value })} className="border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187]"><option value="ativo">Ativo</option><option value="inativo">Inativo</option></select>
    <button type="submit" className="bg-[#048187] text-white font-bold rounded-lg py-3 hover:bg-[#036b70] flex items-center justify-center gap-2"><Save size={18} />{txtBtn}</button>
  </form>
);

const GrupoFiltro = ({ cat, tit, busca, setBusca, opc, ativos, toggle }) => {
  const t = busca[cat] || ''; const oFilt = (opc[cat] || []).filter(i => String(i || '').toLowerCase().includes(String(t || '').toLowerCase())); const sel = ativos[cat] || [];
  return (
    <div>
      <div className="flex items-center justify-between mb-2"><h4 className="font-bold text-gray-600 text-sm uppercase">{tit}</h4>{sel.length > 0 && <span className="text-[11px] font-bold text-[#048187] bg-[#e6f6f7] px-2 py-1 rounded-full">{sel.length}</span>}</div>
      <div className="relative mb-2"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder={`Buscar ${tit.toLowerCase()}...`} value={t} onChange={(e) => setBusca({ ...busca, [cat]: e.target.value })} className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:border-[#048187]" /></div>
      <div className="max-h-44 sm:max-h-52 overflow-y-auto bg-gray-50 border border-gray-100 rounded-lg p-2 space-y-1">
        {oFilt.map(i => (<label key={i} className="flex items-start gap-2 text-xs sm:text-sm text-gray-600 cursor-pointer hover:bg-gray-100 p-2 rounded leading-relaxed"><input type="checkbox" checked={sel.includes(i)} onChange={() => toggle(cat, i)} className="accent-[#048187] mt-0.5 shrink-0" /><span className="break-words">{i}</span></label>))}
        {oFilt.length === 0 && <div className="py-6 text-center text-xs text-gray-400">Nenhuma opção encontrada.</div>}
      </div>
    </div>
  );
};

const FiltroRapidoNucleos = ({ filtrosAtivos, onSelecionar }) => {
  const nucleosSelecionados = filtrosAtivos?.nucleos || [];
  const filtroSelecionado = nucleosSelecionados.length === 1 ? nucleosSelecionados[0] : 'TODOS';
  const botoes = [
    { label: 'TODOS', valor: 'TODOS' },
    { label: 'N1', valor: 'NUCLEO 1' },
    { label: 'N2', valor: 'NUCLEO 2' }
  ];

  return (
    <div className="flex bg-gray-100 p-1 rounded-lg shrink-0">
      {botoes.map((botao) => (
        <button
          key={botao.valor}
          type="button"
          onClick={() => onSelecionar(botao.valor)}
          className={`px-4 sm:px-5 py-2 rounded-md text-xs font-black transition-colors ${filtroSelecionado === botao.valor ? 'bg-[#048187] text-white shadow' : 'text-[#048187] hover:bg-white hover:text-[#036b70]'}`}
        >
          {botao.label}
        </button>
      ))}
    </div>
  );
};


const metaRealVazia = {
  ciclo: '',
  nome_meta: '',
  tipo_meta: 'grupo_estruturas',
  meta_real: '',
  meta_atividade: '',
  meta_make: '',
  meta_cabelo: '',
  meta_rpa: '',
  meta_tkt_medio: '',
  meta_upa: '',
  regra_calculo: 'somar_estruturas',
  status: 'ativo',
  observacao: '',
  estruturas: []
};

const converterMetaRealParaNumero = (valor) => {
  const textoOriginal = String(valor ?? '').trim();
  if (!textoOriginal) return 0;
  let texto = textoOriginal.replace(/R\$/gi, '').replace(/\s/g, '');
  texto = texto.replace(/[^0-9,.-]/g, '');

  if (texto.includes(',')) {
    texto = texto.replace(/\./g, '').replace(',', '.');
  }

  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : 0;
};

const formatarMetaRealInput = (valor) => {
  const numero = converterMetaRealParaNumero(valor);
  if (!numero) return '';
  return numero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatarMetaIndicadorInput = (valor, casas = 2) => {
  const numero = converterMetaRealParaNumero(valor);
  if (!numero) return '';
  return numero.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
};

const CampoMetaIndicador = ({ label, value, onChange, placeholder = '0,00', casas = 2 }) => (
  <div>
    <label className="text-xs font-black text-gray-400 uppercase block mb-1">{label}</label>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={(e) => onChange(formatarMetaIndicadorInput(e.target.value, casas))}
      placeholder={placeholder}
      className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187]"
    />
  </div>
);

function ModalMetasReais({ aberto, onClose, apiUrl, cicloPadrao = '', onAtualizacao }) {
  const [metas, setMetas] = useState([]);
  const [estruturas, setEstruturas] = useState([]);
  const [busca, setBusca] = useState('');
  const [form, setForm] = useState({ ...metaRealVazia, ciclo: cicloPadrao || '' });
  const [editandoId, setEditandoId] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  const cicloConsulta = form.ciclo || cicloPadrao || '';

  const carregarMetas = async (cicloForcado = null) => {
    setCarregando(true);
    setErro('');
    try {
      const cicloUsado = cicloForcado ?? cicloConsulta;
      const { data } = await axios.get(`${apiUrl}/metas-reais`, { params: cicloUsado ? { ciclo: cicloUsado } : {} });
      setMetas(data.metas || []);
    } catch (e) {
      setErro(e.response?.data?.detail || 'Erro ao carregar metas reais.');
    } finally {
      setCarregando(false);
    }
  };

  const carregarEstruturas = async () => {
    try {
      const { data } = await axios.get(`${apiUrl}/metas-reais/estruturas-opcoes`, { params: cicloConsulta ? { ciclo: cicloConsulta } : {} });
      setEstruturas(data.estruturas || []);
    } catch (e) {
      setEstruturas([]);
    }
  };

  useEffect(() => {
    if (!aberto) return;
    setForm((atual) => ({ ...atual, ciclo: atual.ciclo || cicloPadrao || '' }));
    carregarMetas();
    carregarEstruturas();
  }, [aberto]);

  const limparForm = (cicloManter = null) => {
    setEditandoId(null);
    setForm({ ...metaRealVazia, ciclo: cicloManter || cicloPadrao || form.ciclo || '' });
    setBusca('');
  };

  const estruturaJaSelecionada = (estrutura) => form.estruturas.some((e) => String(e.estrutura).trim() === String(estrutura).trim());

  const adicionarEstrutura = (item) => {
    const estrutura = String(item.estrutura || '').trim();
    if (!estrutura || estruturaJaSelecionada(estrutura)) return;
    const cod = String(item.cod_estrutura || estrutura.split('-')[0] || '').trim();
    setForm((atual) => ({
      ...atual,
      estruturas: [...atual.estruturas, { cod_estrutura: cod, estrutura }]
    }));
    setBusca('');
  };

  const removerEstrutura = (estrutura) => {
    setForm((atual) => ({ ...atual, estruturas: atual.estruturas.filter((e) => e.estrutura !== estrutura) }));
  };

  const salvarMeta = async (e) => {
    e.preventDefault();
    setErro('');
    setMensagem('');
    if (!form.ciclo.trim()) return setErro('Informe o ciclo.');
    if (!form.nome_meta.trim()) return setErro('Informe o nome da meta.');
    if (!form.estruturas.length) return setErro('Vincule pelo menos uma estrutura.');
    const metaRealNumero = converterMetaRealParaNumero(form.meta_real);
    if (metaRealNumero <= 0) return setErro('Informe uma meta real maior que zero.');
    setSalvando(true);
    const payload = {
      ...form,
      ciclo: String(form.ciclo || '').trim(),
      nome_meta: String(form.nome_meta || '').trim(),
      meta_real: metaRealNumero,
      meta_atividade: converterMetaRealParaNumero(form.meta_atividade),
      meta_make: converterMetaRealParaNumero(form.meta_make),
      meta_cabelo: converterMetaRealParaNumero(form.meta_cabelo),
      meta_rpa: converterMetaRealParaNumero(form.meta_rpa),
      meta_tkt_medio: converterMetaRealParaNumero(form.meta_tkt_medio),
      meta_upa: converterMetaRealParaNumero(form.meta_upa),
      estruturas: form.estruturas.map((e) => ({ cod_estrutura: e.cod_estrutura || '', estrutura: e.estrutura }))
    };
    try {
      if (editandoId) await axios.put(`${apiUrl}/metas-reais/${editandoId}`, payload);
      else await axios.post(`${apiUrl}/metas-reais`, payload);
      setMensagem(editandoId ? 'Meta real atualizada.' : 'Meta real cadastrada.');
      limparForm(payload.ciclo);
      await carregarMetas(payload.ciclo);
      if (onAtualizacao) onAtualizacao();
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao salvar meta real.');
    } finally {
      setSalvando(false);
    }
  };

  const editarMeta = (meta) => {
    setEditandoId(meta.id);
    setForm({
      ciclo: meta.ciclo || '',
      nome_meta: meta.nome_meta || '',
      tipo_meta: meta.tipo_meta || 'grupo_estruturas',
      meta_real: formatarMetaRealInput(meta.meta_real),
      meta_atividade: formatarMetaIndicadorInput(meta.meta_atividade, 1),
      meta_make: formatarMetaIndicadorInput(meta.meta_make, 1),
      meta_cabelo: formatarMetaIndicadorInput(meta.meta_cabelo, 1),
      meta_rpa: formatarMetaIndicadorInput(meta.meta_rpa, 2),
      meta_tkt_medio: formatarMetaIndicadorInput(meta.meta_tkt_medio, 2),
      meta_upa: formatarMetaIndicadorInput(meta.meta_upa, 1),
      regra_calculo: meta.regra_calculo || 'somar_estruturas',
      status: meta.status || 'ativo',
      observacao: meta.observacao || '',
      estruturas: meta.estruturas || []
    });
    setBusca('');
  };

  const excluirMeta = async (meta) => {
    const ok = window.confirm(`Excluir a meta real "${meta.nome_meta}"?`);
    if (!ok) return;
    setErro('');
    try {
      await axios.delete(`${apiUrl}/metas-reais/${meta.id}`);
      setMensagem('Meta real excluída.');
      await carregarMetas();
      if (onAtualizacao) onAtualizacao();
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao excluir meta real.');
    }
  };

  const salvarPesoConsultorMeta = async (consultor, valorPeso) => {
    const idConsultor = consultor?.id;
    if (!idConsultor) {
      setErro('Não foi possível identificar o cadastro do consultor para atualizar o peso.');
      return;
    }
    const pesoNumero = Number(String(valorPeso ?? '0').replace(',', '.')) || 0;
    try {
      await axios.put(`${apiUrl}/consultores/${idConsultor}`, {
        id_colaborador: consultor.id_colaborador || '',
        nome: consultor.nome || consultor.nome_cadastral || consultor.nome_exibicao || '',
        nome_social: consultor.nome_social || '',
        estrutura: consultor.estrutura || '',
        canal: consultor.canal || 'ESPAÇO DO REVENDEDOR',
        status_consultor: consultor.status_consultor || 'ativo',
        peso_meta: pesoNumero
      });
      setMensagem('Peso Meta do consultor atualizado.');
      await carregarMetas(cicloConsulta);
      if (onAtualizacao) onAtualizacao();
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao atualizar peso do consultor.');
    }
  };

  const estruturasFiltradas = estruturas
    .filter((e) => {
      const termo = busca.toLowerCase().trim();
      if (!termo) return false;
      return String(e.estrutura || '').toLowerCase().includes(termo) || String(e.cod_estrutura || '').toLowerCase().includes(termo);
    })
    .slice(0, 8);

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center px-4 py-6">
      <div className="bg-white w-full max-w-6xl max-h-[92vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-black text-gray-700">Cadastro de Metas Reais</h2>
            <p className="text-sm text-gray-400 font-semibold mt-1">Meta oficial por estrutura, ER ou grupo de estruturas. A divisão por consultor usa o Peso Meta da aba Cadastro.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:bg-gray-50 rounded-full p-2"><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
          <form onSubmit={salvarMeta} className="border border-gray-100 rounded-2xl p-5 space-y-4 h-fit">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-black text-gray-700">{editandoId ? 'Editar meta' : 'Nova meta'}</h3>
              {editandoId && <button type="button" onClick={limparForm} className="text-xs font-black text-[#048187] hover:underline">Limpar edição</button>}
            </div>

            {erro && <div className="bg-red-50 text-red-600 border border-red-100 rounded-xl p-3 text-sm font-bold">{erro}</div>}
            {mensagem && <div className="bg-green-50 text-green-700 border border-green-100 rounded-xl p-3 text-sm font-bold">{mensagem}</div>}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-black text-gray-400 uppercase block mb-1">Ciclo</label>
                <input value={form.ciclo} onChange={(e) => setForm({ ...form, ciclo: e.target.value })} placeholder="09/2026" className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187]" required />
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase block mb-1">Meta Real</label>
                <input value={form.meta_real} onChange={(e) => { setMensagem(''); setForm({ ...form, meta_real: e.target.value }); }} onBlur={(e) => setForm((atual) => ({ ...atual, meta_real: formatarMetaRealInput(e.target.value) }))} placeholder="383337,00" className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187]" required />
              </div>
            </div>

            <div className="border border-gray-100 bg-[#f7fafb] rounded-2xl p-4 space-y-3">
              <div>
                <h4 className="text-xs font-black text-gray-600 uppercase">Metas dos indicadores da estrutura</h4>
                <p className="text-[11px] text-gray-400 font-semibold mt-1">Esses valores alimentam os cards de Atividade, MAKE, CABELO, RPA, Ticket Médio e UPA na aba Metas Estruturas.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <CampoMetaIndicador label="Meta Atividade (%)" value={form.meta_atividade} casas={1} placeholder="46,0" onChange={(valor) => setForm({ ...form, meta_atividade: valor })} />
                <CampoMetaIndicador label="Meta MAKE (%)" value={form.meta_make} casas={1} placeholder="40,0" onChange={(valor) => setForm({ ...form, meta_make: valor })} />
                <CampoMetaIndicador label="Meta CABELO (%)" value={form.meta_cabelo} casas={1} placeholder="40,0" onChange={(valor) => setForm({ ...form, meta_cabelo: valor })} />
                <CampoMetaIndicador label="Meta RPA (R$)" value={form.meta_rpa} casas={2} placeholder="1.500,00" onChange={(valor) => setForm({ ...form, meta_rpa: valor })} />
                <CampoMetaIndicador label="Meta Tkt Médio (R$)" value={form.meta_tkt_medio} casas={2} placeholder="800,00" onChange={(valor) => setForm({ ...form, meta_tkt_medio: valor })} />
                <CampoMetaIndicador label="Meta UPA" value={form.meta_upa} casas={1} placeholder="15,0" onChange={(valor) => setForm({ ...form, meta_upa: valor })} />
              </div>
            </div>

            <div>
              <label className="text-xs font-black text-gray-400 uppercase block mb-1">Nome da meta</label>
              <input value={form.nome_meta} onChange={(e) => setForm({ ...form, nome_meta: e.target.value })} placeholder="EQUIPE GRAZIELLE" className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187]" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-black text-gray-400 uppercase block mb-1">Tipo</label>
                <select value={form.tipo_meta} onChange={(e) => setForm({ ...form, tipo_meta: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187]">
                  <option value="estrutura">Estrutura</option>
                  <option value="er">ER</option>
                  <option value="grupo_estruturas">Grupo de estruturas</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase block mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187]">
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-black text-gray-400 uppercase block mb-1">Estruturas vinculadas</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-3.5 text-gray-400" />
                <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por código ou nome da estrutura" className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-3 text-sm outline-none focus:border-[#048187]" />
                {busca && estruturasFiltradas.length > 0 && (
                  <div className="absolute z-10 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden max-h-64 overflow-y-auto">
                    {estruturasFiltradas.map((e) => (
                      <button key={`${e.cod_estrutura}-${e.estrutura}`} type="button" onClick={() => adicionarEstrutura(e)} className="w-full text-left px-4 py-3 text-sm hover:bg-[#e6f6f7] text-gray-600 font-bold">
                        {e.estrutura}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {form.estruturas.map((e) => (
                  <span key={e.estrutura} className="inline-flex items-center gap-2 bg-[#e6f6f7] text-[#048187] rounded-full px-3 py-1.5 text-xs font-black">
                    {e.estrutura}
                    <button type="button" onClick={() => removerEstrutura(e.estrutura)} className="text-[#048187] hover:text-red-500"><X size={13} /></button>
                  </span>
                ))}
                {!form.estruturas.length && <span className="text-xs text-gray-400 font-semibold">Nenhuma estrutura vinculada.</span>}
              </div>
            </div>

            <div>
              <label className="text-xs font-black text-gray-400 uppercase block mb-1">Observação</label>
              <textarea value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} rows={3} placeholder="Ex.: soma as estruturas 13476 e 17325" className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187] resize-none" />
            </div>

            <button type="submit" disabled={salvando || !form.estruturas.length} className="w-full bg-[#048187] hover:bg-[#036b70] text-white font-black rounded-xl px-4 py-3 disabled:opacity-60 inline-flex items-center justify-center gap-2">
              <Save size={16} /> {salvando ? 'Salvando...' : editandoId ? 'Salvar alterações' : 'Cadastrar meta real'}
            </button>
          </form>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-gray-700">Metas cadastradas</h3>
                <p className="text-xs text-gray-400 font-semibold">Realizado calculado pela soma das estruturas vinculadas.</p>
              </div>
              <button type="button" onClick={() => carregarMetas()} className="bg-[#e6f6f7] text-[#048187] font-black px-4 py-2 rounded-lg hover:bg-[#d0f0f1] inline-flex items-center gap-2 text-sm"><RefreshCcw size={15} /> Atualizar</button>
            </div>

            {carregando ? <p className="text-[#048187] font-bold">Carregando metas reais...</p> : (
              <div className="space-y-3">
                {metas.map((m) => (
                  <div key={m.id} className="border border-gray-100 rounded-2xl p-4 bg-white hover:shadow-sm transition-shadow">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-black text-gray-700 uppercase">{m.nome_meta}</h4>
                          <span className={`px-2 py-1 rounded-full text-[10px] font-black ${m.status === 'ativo' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{m.status}</span>
                          <span className="px-2 py-1 rounded-full text-[10px] font-black bg-gray-50 text-gray-500">{m.ciclo}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(m.estruturas || []).map((e) => <span key={e.id || e.estrutura} className="bg-[#f7fafb] border border-gray-100 text-gray-500 px-2 py-1 rounded-lg text-[11px] font-bold">{e.estrutura}</span>)}
                        </div>
                        {m.observacao && <p className="text-xs text-gray-400 font-semibold mt-2">{m.observacao}</p>}
                      </div>
                      <div className="grid grid-cols-3 gap-2 min-w-[360px]">
                        <div className="bg-[#f7fafb] rounded-xl p-3"><p className="text-[10px] uppercase font-black text-gray-400">Meta</p><p className="text-sm font-black text-[#048187]">{formatarMoeda(m.meta_real)}</p></div>
                        <div className="bg-[#f7fafb] rounded-xl p-3"><p className="text-[10px] uppercase font-black text-gray-400">Realizado</p><p className="text-sm font-black text-[#048187]">{formatarMoeda(m.realizado)}</p></div>
                        <div className="bg-[#f7fafb] rounded-xl p-3"><p className="text-[10px] uppercase font-black text-gray-400">% Ating.</p><p className="text-sm font-black text-[#048187]">{Number(m.percentual || 0).toFixed(1)}%</p></div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
                      <div className="bg-gray-50 rounded-xl p-2"><p className="text-[9px] uppercase font-black text-gray-400">Atividade</p><p className="text-xs font-black text-gray-700">{Number(m.meta_atividade || 0).toFixed(1)}%</p></div>
                      <div className="bg-gray-50 rounded-xl p-2"><p className="text-[9px] uppercase font-black text-gray-400">MAKE</p><p className="text-xs font-black text-gray-700">{Number(m.meta_make || 0).toFixed(1)}%</p></div>
                      <div className="bg-gray-50 rounded-xl p-2"><p className="text-[9px] uppercase font-black text-gray-400">CABELO</p><p className="text-xs font-black text-gray-700">{Number(m.meta_cabelo || 0).toFixed(1)}%</p></div>
                      <div className="bg-gray-50 rounded-xl p-2"><p className="text-[9px] uppercase font-black text-gray-400">RPA</p><p className="text-xs font-black text-gray-700">{formatarMoeda(m.meta_rpa)}</p></div>
                      <div className="bg-gray-50 rounded-xl p-2"><p className="text-[9px] uppercase font-black text-gray-400">Tkt Médio</p><p className="text-xs font-black text-gray-700">{formatarMoeda(m.meta_tkt_medio)}</p></div>
                      <div className="bg-gray-50 rounded-xl p-2"><p className="text-[9px] uppercase font-black text-gray-400">UPA</p><p className="text-xs font-black text-gray-700">{Number(m.meta_upa || 0).toFixed(1)}</p></div>
                    </div>

                    {Array.isArray(m.consultores) && m.consultores.length > 0 && (
                      <div className="mt-4 border-t border-gray-50 pt-3 overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead><tr className="text-left text-gray-400 uppercase"><th className="py-2">Consultor</th><th>Peso editável</th><th>Meta Individual</th><th>Realizado</th><th>%</th></tr></thead>
                          <tbody>
                            {m.consultores.map((c) => (
                              <tr key={`${m.id}-${c.id_colaborador}`} className="border-t border-gray-50">
                                <td className="py-2 font-bold text-gray-700">{c.nome_exibicao || c.nome}</td>
                                <td className="font-bold text-[#048187]"><input type="number" step="0.01" defaultValue={Number(c.peso_meta || 0).toFixed(2)} onBlur={(e) => salvarPesoConsultorMeta(c, e.target.value)} className="w-24 border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-[#048187] outline-none focus:border-[#048187]" />%</td>
                                <td>{formatarMoeda(c.meta_individual)}</td>
                                <td>{formatarMoeda(c.realizado)}</td>
                                <td className="font-black text-[#048187]">{Number(c.percentual || 0).toFixed(1)}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 mt-3">
                      <button onClick={() => editarMeta(m)} className="text-[#048187] hover:bg-[#e6f6f7] rounded-lg px-3 py-2 inline-flex items-center gap-1 text-xs font-black"><Pencil size={14} /> Editar</button>
                      <button onClick={() => excluirMeta(m)} className="text-red-500 hover:bg-red-50 rounded-lg px-3 py-2 inline-flex items-center gap-1 text-xs font-black"><Trash2 size={14} /> Excluir</button>
                    </div>
                  </div>
                ))}
                {!metas.length && <div className="border border-dashed border-gray-200 rounded-2xl p-8 text-center text-gray-400 font-bold">Nenhuma meta real cadastrada para este ciclo.</div>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [usuarioLogado, setUsuarioLogado] = useState(() => { const s = localStorage.getItem('usuarioLogado'); return s ? JSON.parse(s) : null; });
  const [tokenAuth, setTokenAuth] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) || '');
  const [emailLogin, setEmailLogin] = useState(''); const [senhaLogin, setSenhaLogin] = useState(''); const [mostrarSenha, setMostrarSenha] = useState(false); const [erroLogin, setErroLogin] = useState(''); const [carregandoLogin, setCarregandoLogin] = useState(false);
  
  const [telaAtual, setTelaAtual] = useState(() => {
    const telaSalva = localStorage.getItem(TELA_ATUAL_STORAGE_KEY);
    return telaSalva && ABAS_SISTEMA.includes(telaSalva) ? telaSalva : 'Dashboard';
  });
  const [canalAtual, setCanalAtual] = useState(() => {
    const canalSalvo = localStorage.getItem(CANAL_ATUAL_STORAGE_KEY);
    return ['VD', 'LOJA'].includes(canalSalvo) ? canalSalvo : 'VD';
  });
  const [menuVDExpandido, setMenuVDExpandido] = useState(() => {
    const canalSalvo = localStorage.getItem(CANAL_ATUAL_STORAGE_KEY);
    return canalSalvo !== 'LOJA';
  });
  const [menuLojaExpandido, setMenuLojaExpandido] = useState(() => {
    const canalSalvo = localStorage.getItem(CANAL_ATUAL_STORAGE_KEY);
    return canalSalvo === 'LOJA';
  }); const [sidebarExpandida, setSidebarExpandida] = useState(true); const [painelFiltrosAberto, setPainelFiltrosAberto] = useState(false);
  const [dados, setDados] = useState(null); const [dadosMetas, setDadosMetas] = useState(null); const [detalheMeta, setDetalheMeta] = useState(null); const [estruturaSelecionada, setEstruturaSelecionada] = useState(() => localStorage.getItem(ESTRUTURA_META_STORAGE_KEY) || ''); const [metaFaturamentoDashboard, setMetaFaturamentoDashboard] = useState(0);
  
  const [visaoRanking, setVisaoRanking] = useState('consultores');
  const [visaoMetas, setVisaoMetas] = useState(() => {
    const visaoSalva = localStorage.getItem(VISAO_METAS_STORAGE_KEY);
    return ['estruturas', 'consultores'].includes(visaoSalva) ? visaoSalva : 'estruturas';
  });
  const [buscaEstruturaMeta, setBuscaEstruturaMeta] = useState(''); const [mostrarListaEstruturaMeta, setMostrarListaEstruturaMeta] = useState(false); 
  const [dadosComp, setDadosComp] = useState(null); const [loadComp, setLoadComp] = useState(false);

  const [permissoesAtivas, setPermissoesAtivas] = useState(permissoesPadrao);
  const [modalPermissoesAberto, setModalPermissoesAberto] = useState(false);
  const [perfilEditando, setPerfilEditando] = useState('admin');
  const [permissoesTemporarias, setPermissoesTemporarias] = useState(permissoesPadrao);

  const [cacheDashboard, setCacheDashboard] = useState({}); const [cacheDetalheMetas, setCacheDetalheMetas] = useState({}); const [cacheMetas, setCacheMetas] = useState(null); const [opcoesFiltrosCarregadas, setOpcoesFiltrosCarregadas] = useState(false);
  const [carregandoDashboard, setCarregandoDashboard] = useState(false); const [carregandoMetas, setCarregandoMetas] = useState(false); const [carregandoDetalheMeta, setCarregandoDetalheMeta] = useState(false); const [erroMetas, setErroMetas] = useState('');
  
  const [modalDetalhes, setModalDetalhes] = useState(null); 
  const [modalValorExpandido, setModalValorExpandido] = useState({ aberto: false, titulo: '', valorTexto: '', descricao: '', detalhes: [], formula: '' });

  useEffect(() => {
    document.title = APP_NAME;

    let favicon = document.querySelector("link[rel~='icon']");
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.type = 'image/png';
    favicon.href = logoEmpresa;

    let appleIcon = document.querySelector("link[rel='apple-touch-icon']");
    if (!appleIcon) {
      appleIcon = document.createElement('link');
      appleIcon.rel = 'apple-touch-icon';
      document.head.appendChild(appleIcon);
    }
    appleIcon.href = logoEmpresa;
  }, []);

  useEffect(() => {
    if (!usuarioLogado) return;
    if (ABAS_SISTEMA.includes(telaAtual)) {
      localStorage.setItem(TELA_ATUAL_STORAGE_KEY, telaAtual);
    }
  }, [usuarioLogado, telaAtual]);

  useEffect(() => {
    if (!usuarioLogado) return;
    localStorage.setItem(CANAL_ATUAL_STORAGE_KEY, canalAtual);
  }, [usuarioLogado, canalAtual]);

  useEffect(() => {
    if (!usuarioLogado) return;
    localStorage.setItem(VISAO_METAS_STORAGE_KEY, visaoMetas);
  }, [usuarioLogado, visaoMetas]);

  useEffect(() => {
    if (!usuarioLogado) return;
    if (estruturaSelecionada) {
      localStorage.setItem(ESTRUTURA_META_STORAGE_KEY, estruturaSelecionada);
    } else {
      localStorage.removeItem(ESTRUTURA_META_STORAGE_KEY);
    }
  }, [usuarioLogado, estruturaSelecionada]);


  const [usuariosSistema, setUsuariosSistema] = useState([]); const [carregandoUsuarios, setCarregandoUsuarios] = useState(false); const [mensagemUsuarios, setMensagemUsuarios] = useState(''); const [erroUsuarios, setErroUsuarios] = useState(''); const [usuarioEditando, setUsuarioEditando] = useState(null); const [modalEditarUsuarioAberto, setModalEditarUsuarioAberto] = useState(false); const [modalExcluirUsuarioAberto, setModalExcluirUsuarioAberto] = useState(false); const [usuarioParaExcluir, setUsuarioParaExcluir] = useState(null); const [novoUsuario, setNovoUsuario] = useState({ nome: '', email: '', senha: '', perfil: 'visualizador', status_usuario: 'ativo' }); const [senhaPerfil, setSenhaPerfil] = useState({ senha_atual: '', nova_senha: '', confirmar_senha: '' }); const [mostrarSenhasPerfil, setMostrarSenhasPerfil] = useState(false); const [mensagemSenha, setMensagemSenha] = useState(''); const [erroSenha, setErroSenha] = useState('');

  const [arquivoPedidos, setArquivoPedidos] = useState(null); const [arquivoMetas, setArquivoMetas] = useState(null); const [arquivoConsultores, setArquivoConsultores] = useState(null); const [arquivoBaseAtiva, setArquivoBaseAtiva] = useState(null); const [arquivoRevendedores, setArquivoRevendedores] = useState(null); const [arquivoSkusIaf, setArquivoSkusIaf] = useState(null); const [arquivosVendasMake, setArquivosVendasMake] = useState([]); const [arquivosVendasCabelo, setArquivosVendasCabelo] = useState([]); const [mensagemUpload, setMensagemUpload] = useState(''); const [erroUpload, setErroUpload] = useState(''); const [carregandoUpload, setCarregandoUpload] = useState(false); const [carregandoAutomacaoPedidos, setCarregandoAutomacaoPedidos] = useState(false); const [carregandoAutomacaoMake, setCarregandoAutomacaoMake] = useState(false); const [carregandoAutomacaoCabelo, setCarregandoAutomacaoCabelo] = useState(false); const [modalMetasReaisAberto, setModalMetasReaisAberto] = useState(false);

  const [ciclos, setCiclos] = useState([]); const [cicloForm, setCicloForm] = useState(cicloFormVazio); const [cicloEditando, setCicloEditando] = useState(null); const [mensagemCiclo, setMensagemCiclo] = useState(''); const [erroCiclo, setErroCiclo] = useState(''); const [carregandoCiclos, setCarregandoCiclos] = useState(false); const [modalEditarCicloAberto, setModalEditarCicloAberto] = useState(false); const [modalExcluirCicloAberto, setModalExcluirCicloAberto] = useState(false); const [cicloParaExcluir, setCicloParaExcluir] = useState(null);

  const [listaConsultores, setListaConsultores] = useState([]); const [carregandoListaConsultores, setCarregandoListaConsultores] = useState(false); const [buscaConsultor, setBuscaConsultor] = useState(''); const [novoConsultor, setNovoConsultor] = useState(consultorVazio); const [modalCriarConsultorAberto, setModalCriarConsultorAberto] = useState(false); const [consultorEditando, setConsultorEditando] = useState(null); const [modalEditarConsultorAberto, setModalEditarConsultorAberto] = useState(false); const [consultorParaExcluir, setConsultorParaExcluir] = useState(null); const [modalExcluirConsultorAberto, setModalExcluirConsultorAberto] = useState(false); const [mensagemConsultor, setMensagemConsultor] = useState(''); const [erroGestaoConsultor, setErroGestaoConsultor] = useState('');

  const [dadosRevendedores, setDadosRevendedores] = useState(null); const [carregandoRevendedores, setCarregandoRevendedores] = useState(false); const [erroRevendedores, setErroRevendedores] = useState(''); const [buscaRevendedores, setBuscaRevendedores] = useState('');
  const [filtrosRevendedores, setFiltrosRevendedores] = useState({ estruturas: [], cidades: [], atividades: [], papeis: [], inadimplentes: [] }); const [buscaFiltrosRevendedores, setBuscaFiltrosRevendedores] = useState({ estruturas: '', cidades: '', atividades: '', papeis: '', inadimplentes: '' });

  const [opcoesFiltros, setOpcFiltros] = useState({ nucleos: ['NUCLEO 1', 'NUCLEO 2'], unidades: [], estruturas: [], consultores: [], situacoes: [] });
  const [filtrosAtivos, setFiltrosAtivos] = useState(filtroVazio);
  const [buscaFiltros, setBuscaFiltros] = useState(buscaFiltrosVazia);

  const [historicoCiclos, setHistoricoCiclos] = useState([]);
  const [cicloHistoricoSelecionado, setCicloHistoricoSelecionado] = useState('');
  const [dadosHistorico, setDadosHistorico] = useState({ resumo: null, estruturas: [], consultores: [], consultoresAtivos: [], metas: [] });
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [erroHistorico, setErroHistorico] = useState('');
  const [mensagemHistorico, setMensagemHistorico] = useState('');
  const [visaoHistorico, setVisaoHistorico] = useState('estruturas');
  const [fechamentoHistorico, setFechamentoHistorico] = useState({ ciclo: '', observacao: '' });

  const promessasEmAndamentoRef = useRef({});
  const ultimoCarregamentoTelaRef = useRef('');
  const debounceFiltroRapidoRef = useRef(null);

  const itensMenuTopo = [
    { nome: 'Dashboard', icone: LayoutDashboard }, { nome: 'Metas', icone: BarChart2 }, { nome: 'N1', icone: Target }, { nome: 'N2', icone: Target }, { nome: 'Ranking', icone: Medal }, { nome: 'Comparativo', icone: Scale }, { nome: 'Histórico', icone: CalendarDays }, { nome: 'Revendedores', icone: UserCircle }, { nome: 'Cadastro', icone: Users }, { nome: 'Base', icone: Database }
  ];

  const itensMenuVD = itensMenuTopo;
  const itensMenuLoja = [
    { nome: 'LojaVisaoGeral', icone: LayoutDashboard }
  ];

  const navegarParaTelaVD = (nomeTela) => {
    setCanalAtual('VD');
    setMenuVDExpandido(true);
    setMenuLojaExpandido(false);
    setTelaAtual(nomeTela);
  };

  const navegarParaLoja = () => {
    setCanalAtual('LOJA');
    setMenuLojaExpandido(true);
    setMenuVDExpandido(false);
    setTelaAtual('LojaVisaoGeral');
  };

  const alternarCanalVD = () => {
    setCanalAtual('VD');
    setMenuVDExpandido((atual) => !atual);
    setMenuLojaExpandido(false);
    if (telaAtual === 'Loja') setTelaAtual('Dashboard');
  };

  const alternarCanalLoja = () => {
    setCanalAtual('LOJA');
    setMenuLojaExpandido((atual) => !atual);
    setMenuVDExpandido(false);
    setTelaAtual('LojaVisaoGeral');
  };

  const abrirCanalVD = () => {
    setCanalAtual('VD');
    setMenuVDExpandido(true);
    setMenuLojaExpandido(false);
    if (telaAtual === 'Loja') setTelaAtual('Dashboard');
  };

  const carregarPermissoesDoBanco = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/permissoes`);
      const permissoesNormalizadas = normalizarPermissoesSistema(res.data?.permissoes || {});
      setPermissoesAtivas(permissoesNormalizadas);
      setPermissoesTemporarias(permissoesNormalizadas);
    } catch (erro) {
      console.error('Erro ao carregar permissões:', erro);
      const permissoesNormalizadas = normalizarPermissoesSistema(permissoesPadrao);
      setPermissoesAtivas(permissoesNormalizadas);
      setPermissoesTemporarias(permissoesNormalizadas);
    }
  };

  const usuarioPodeAcessar = (tela) => {
    if (!usuarioLogado) return false;
    const perfilUsuario = usuarioLogado.perfil || 'visualizador';
    return permissoesAtivas[perfilUsuario]?.includes(tela);
  };

  const abrirModalPermissoes = (perfil = 'admin') => { setPermissoesTemporarias({ ...permissoesAtivas }); setPerfilEditando(perfil || 'admin'); setModalPermissoesAberto(true); };

  const togglePermissaoTemporaria = (perfil, aba) => {
    if (perfil === 'admin' && (aba === 'Configurações' || aba === 'Perfil')) return;
    const listaAtual = permissoesTemporarias[perfil] || [];
    const novaLista = listaAtual.includes(aba) ? listaAtual.filter(i => i !== aba) : [...listaAtual, aba];
    setPermissoesTemporarias({ ...permissoesTemporarias, [perfil]: novaLista });
  };

  const salvarPermissoes = async () => {
    try {
      const permissoesNormalizadas = normalizarPermissoesSistema(permissoesTemporarias);
      await axios.post(`${API_URL}/auth/permissoes`, { permissoes: permissoesNormalizadas });
      setPermissoesAtivas(permissoesNormalizadas);
      setPermissoesTemporarias(permissoesNormalizadas);
      setModalPermissoesAberto(false);
      setMensagemUsuarios('Permissões atualizadas!');
    } catch (erro) {
      setErroUsuarios('Falha ao salvar permissões.');
    }
  };

  const gerarChaveFiltros = (filtros) => JSON.stringify({ nu: [...(filtros?.nucleos || [])].sort(), un: [...(filtros?.unidades || [])].sort(), es: [...(filtros?.estruturas || [])].sort(), co: [...(filtros?.consultores || [])].sort(), si: [...(filtros?.situacoes || [])].sort(), di: filtros?.data_inicio || '', df: filtros?.data_fim || '' });

  const limparCachesDados = () => { setCacheDashboard({}); setCacheMetas(null); setCacheDetalheMetas({}); setOpcoesFiltrosCarregadas(false); };

  const carregarOpcoesFiltros = async (forcarAtualizacao = false) => {
    if (opcoesFiltrosCarregadas && !forcarAtualizacao) return;

    const chave = 'opcoes_filtros';
    if (!forcarAtualizacao && promessasEmAndamentoRef.current[chave]) {
      return promessasEmAndamentoRef.current[chave];
    }

    const promessa = axios.get(`${API_URL}/dashboard/opcoes-filtros`)
      .then((resposta) => {
        setOpcFiltros(prev => ({
          ...prev,
          unidades: resposta.data.unidades || [],
          estruturas: resposta.data.estruturas || [],
          consultores: resposta.data.consultores || [],
          situacoes: resposta.data.situacoes || []
        }));
        setOpcoesFiltrosCarregadas(true);
      })
      .catch((erro) => {
        console.error('Erro filtros:', erro);
      })
      .finally(() => {
        delete promessasEmAndamentoRef.current[chave];
      });

    promessasEmAndamentoRef.current[chave] = promessa;
    return promessa;
  };

  const calcularMetaDashboardPelosFiltros = (dadosMetasApi, filtros) => {
    const estruturasMetas = dadosMetasApi?.estruturas || [];
    if (!estruturasMetas.length) return 0;
    if (filtros?.estruturas?.length > 0) return estruturasMetas.filter((item) => filtros.estruturas.includes(item.estrutura)).reduce((acc, item) => acc + Number(item.receita || 0), 0);
    if (filtros?.unidades?.length > 0) return estruturasMetas.filter((item) => { const unidadeEstrutura = String(item.estrutura || '').split('-')[0].trim(); return filtros.unidades.includes(unidadeEstrutura); }).reduce((acc, item) => acc + Number(item.receita || 0), 0);
    return Number(dadosMetasApi?.meta_total_geral || 0);
  };

  const carregarDashboard = async (filtros, forcarAtualizacao = false) => {
    if (!usuarioLogado) return;
    const chaveCache = gerarChaveFiltros(filtros);
    const chavePromessa = `dashboard_${chaveCache}_${forcarAtualizacao ? 'force' : 'cache'}`;

    if (!forcarAtualizacao && cacheDashboard[chaveCache]) {
      const c = cacheDashboard[chaveCache];
      setDados(c.dados);
      setMetaFaturamentoDashboard(c.metaFaturamentoDashboard || 0);
      await carregarOpcoesFiltros(false);
      return c.dados;
    }

    if (promessasEmAndamentoRef.current[chavePromessa]) {
      return promessasEmAndamentoRef.current[chavePromessa];
    }

    setCarregandoDashboard(true);
    const promessa = (async () => {
      try {
        await carregarOpcoesFiltros(false);
        const [resMetas, resDados] = await Promise.allSettled([
          axios.post(`${API_URL}/metas/resumo`, filtros),
          axios.post(`${API_URL}/dashboard/dados`, filtros)
        ]);

        const resumoMetas = resMetas.status === 'fulfilled'
          ? { ...resMetas.value.data, estruturas: [...(resMetas.value.data.estruturas || [])].sort((a, b) => Number(b.realizado || 0) - Number(a.realizado || 0)) }
          : cacheMetas;

        if (resMetas.status === 'fulfilled') {
          setCacheMetas(resumoMetas);
          setDadosMetas(resumoMetas);
        }
        if (resDados.status !== 'fulfilled') throw resDados.reason;

        const metaCalculada = calcularMetaDashboardPelosFiltros(resumoMetas, filtros);
        setDados(resDados.value.data);
        setMetaFaturamentoDashboard(metaCalculada);
        setCacheDashboard((prev) => ({ ...prev, [chaveCache]: { dados: resDados.value.data, metaFaturamentoDashboard: metaCalculada } }));
        return resDados.value.data;
      } catch (erro) {
        console.error('Erro dashboard:', erro);
      } finally {
        setCarregandoDashboard(false);
        delete promessasEmAndamentoRef.current[chavePromessa];
      }
    })();

    promessasEmAndamentoRef.current[chavePromessa] = promessa;
    return promessa;
  };

  const carregarMetas = async (filtros, forcarAtualizacao = false) => {
    setErroMetas('');
    const chaveCache = 'metas_' + gerarChaveFiltros(filtros);
    const chavePromessa = `${chaveCache}_${forcarAtualizacao ? 'force' : 'cache'}`;

    if (!forcarAtualizacao && cacheDashboard[chaveCache]) {
      const c = cacheDashboard[chaveCache];
      setDadosMetas(c.dados);
      const estruturas = c.dados.estruturas || [];
      const existeSelecionada = estruturas.some((item) => item.estrutura === estruturaSelecionada);
      const estruturaDetalhe = existeSelecionada ? estruturaSelecionada : estruturas[0]?.estrutura;
      if (estruturaDetalhe) await carregarDetalheMeta(estruturaDetalhe, filtros, false);
      return c.dados;
    }

    if (promessasEmAndamentoRef.current[chavePromessa]) {
      return promessasEmAndamentoRef.current[chavePromessa];
    }

    setCarregandoMetas(true);
    const promessa = (async () => {
      try {
        const resposta = await axios.post(`${API_URL}/metas/resumo`, filtros);
        const estruturasOrdenadas = [...(resposta.data.estruturas || [])].sort((a, b) => Number(b.realizado || 0) - Number(a.realizado || 0));
        const dadosOrdenados = { ...resposta.data, estruturas: estruturasOrdenadas };
        setDadosMetas(dadosOrdenados);
        setCacheMetas(dadosOrdenados);
        setCacheDashboard((prev) => ({ ...prev, [chaveCache]: { dados: dadosOrdenados } }));

        const existeSelecionada = estruturasOrdenadas.some((item) => item.estrutura === estruturaSelecionada);
        const estruturaDetalhe = existeSelecionada ? estruturaSelecionada : estruturasOrdenadas[0]?.estrutura;
        if (estruturaDetalhe) await carregarDetalheMeta(estruturaDetalhe, filtros, forcarAtualizacao);
        else setDetalheMeta(null);

        return dadosOrdenados;
      } catch (erro) {
        console.error('Erro metas:', erro);
        setErroMetas('Erro ao carregar metas.');
      } finally {
        setCarregandoMetas(false);
        delete promessasEmAndamentoRef.current[chavePromessa];
      }
    })();

    promessasEmAndamentoRef.current[chavePromessa] = promessa;
    return promessa;
  };

  const carregarDashboardEMetas = async (filtros, forcarAtualizacao = false) => {
    if (!usuarioLogado) return;
    setErroMetas('');

    const chaveFiltro = gerarChaveFiltros(filtros);
    const chaveDashboard = chaveFiltro;
    const chaveMetas = 'metas_' + chaveFiltro;
    const chavePromessa = `dashboard_metas_${chaveFiltro}_${forcarAtualizacao ? 'force' : 'cache'}`;

    const cacheDash = cacheDashboard[chaveDashboard];
    const cacheMeta = cacheDashboard[chaveMetas];
    if (!forcarAtualizacao && cacheDash && cacheMeta) {
      setDados(cacheDash.dados);
      setMetaFaturamentoDashboard(cacheDash.metaFaturamentoDashboard || 0);
      setDadosMetas(cacheMeta.dados);
      const estruturas = cacheMeta.dados.estruturas || [];
      const existeSelecionada = estruturas.some((item) => item.estrutura === estruturaSelecionada);
      const estruturaDetalhe = existeSelecionada ? estruturaSelecionada : estruturas[0]?.estrutura;
      if (estruturaDetalhe) await carregarDetalheMeta(estruturaDetalhe, filtros, false);
      return;
    }

    if (promessasEmAndamentoRef.current[chavePromessa]) {
      return promessasEmAndamentoRef.current[chavePromessa];
    }

    setCarregandoDashboard(true);
    setCarregandoMetas(true);

    const promessa = (async () => {
      try {
        await carregarOpcoesFiltros(false);
        const [resMetas, resDados] = await Promise.allSettled([
          axios.post(`${API_URL}/metas/resumo`, filtros),
          axios.post(`${API_URL}/dashboard/dados`, filtros)
        ]);

        let dadosMetasAtualizados = null;
        if (resMetas.status === 'fulfilled') {
          const estruturasOrdenadas = [...(resMetas.value.data.estruturas || [])].sort((a, b) => Number(b.realizado || 0) - Number(a.realizado || 0));
          dadosMetasAtualizados = { ...resMetas.value.data, estruturas: estruturasOrdenadas };
          setDadosMetas(dadosMetasAtualizados);
          setCacheMetas(dadosMetasAtualizados);
          setCacheDashboard((prev) => ({ ...prev, [chaveMetas]: { dados: dadosMetasAtualizados } }));
        } else {
          console.error('Erro metas:', resMetas.reason);
          setErroMetas('Erro ao carregar metas.');
        }

        if (resDados.status === 'fulfilled') {
          const metaCalculada = calcularMetaDashboardPelosFiltros(dadosMetasAtualizados || cacheMetas, filtros);
          setDados(resDados.value.data);
          setMetaFaturamentoDashboard(metaCalculada);
          setCacheDashboard((prev) => ({ ...prev, [chaveDashboard]: { dados: resDados.value.data, metaFaturamentoDashboard: metaCalculada } }));
        } else {
          console.error('Erro dashboard:', resDados.reason);
        }

        const estruturas = dadosMetasAtualizados?.estruturas || [];
        const existeSelecionada = estruturas.some((item) => item.estrutura === estruturaSelecionada);
        const estruturaDetalhe = existeSelecionada ? estruturaSelecionada : estruturas[0]?.estrutura;
        if (estruturaDetalhe) await carregarDetalheMeta(estruturaDetalhe, filtros, forcarAtualizacao);
        else setDetalheMeta(null);
      } finally {
        setCarregandoDashboard(false);
        setCarregandoMetas(false);
        delete promessasEmAndamentoRef.current[chavePromessa];
      }
    })();

    promessasEmAndamentoRef.current[chavePromessa] = promessa;
    return promessa;
  };

  const carregarDetalheMeta = async (estrutura, filtros, forcarAtualizacao = false) => {
    if (!estrutura) return;
    const chaveCache = String(estrutura) + '_' + gerarChaveFiltros(filtros);
    if (!forcarAtualizacao && cacheDetalheMetas[chaveCache]) { setDetalheMeta(cacheDetalheMetas[chaveCache]); setEstruturaSelecionada(estrutura); return; }
    setCarregandoDetalheMeta(true); setErroMetas('');
    try {
      const resposta = await axios.post(`${API_URL}/metas/estrutura/${encodeURIComponent(estrutura)}`, filtros);
      setDetalheMeta(resposta.data); setEstruturaSelecionada(estrutura); setCacheDetalheMetas((prev) => ({ ...prev, [chaveCache]: resposta.data }));
    } catch (erro) { console.error('Erro detalhe estrutura:', erro); setErroMetas('Erro detalhe estrutura.'); } finally { setCarregandoDetalheMeta(false); }
  };

  const voltarParaListaMetas = () => {
    setVisaoMetas('estruturas');
    localStorage.setItem(VISAO_METAS_STORAGE_KEY, 'estruturas');
    localStorage.removeItem(ESTRUTURA_META_STORAGE_KEY);
    setDetalheMeta(null);
    setEstruturaSelecionada('');
    setBuscaEstruturaMeta('');
    setMostrarListaEstruturaMeta(false);
  };

  const carregarComparativo = async (filtros) => {
    setLoadComp(true);
    try {
      const f1 = { ...filtros, nucleos: ['NUCLEO 1'] }; const f2 = { ...filtros, nucleos: ['NUCLEO 2'] };
      const [rm1, rd1, rm2, rd2] = await Promise.all([ axios.post(`${API_URL}/metas/resumo`, f1), axios.post(`${API_URL}/dashboard/dados`, f1), axios.post(`${API_URL}/metas/resumo`, f2), axios.post(`${API_URL}/dashboard/dados`, f2) ]);
      setDadosComp({ n1: { metas: rm1.data, dash: rd1.data }, n2: { metas: rm2.data, dash: rd2.data } });
    } catch (e) { console.error("Erro Comparativo:", e); } finally { setLoadComp(false); }
  };

  const carregarUsuarios = async () => {
    if (!usuarioPodeAcessar('Configurações')) return;
    setCarregandoUsuarios(true); setErroUsuarios('');
    try { const resposta = await axios.get(`${API_URL}/auth/usuarios`); setUsuariosSistema(resposta.data.usuarios || []); } catch (erro) { setErroUsuarios('Erro usuários.'); } finally { setCarregandoUsuarios(false); }
  };

  const carregarCiclos = async () => {
    setCarregandoCiclos(true); setErroCiclo('');
    try { const resposta = await axios.get(`${API_URL}/ciclos`); setCiclos(resposta.data.ciclos || []); } catch (erro) { setErroCiclo('Erro ciclos.'); } finally { setCarregandoCiclos(false); }
  };

  const carregarListaConsultores = async () => {
    setCarregandoListaConsultores(true); setErroGestaoConsultor('');
    try { const resposta = await axios.get(`${API_URL}/consultores/listar`); setListaConsultores(resposta.data.consultores || []); } catch (erro) { setErroGestaoConsultor('Erro consultores.'); } finally { setCarregandoListaConsultores(false); }
  };

const carregarRevendedores = async () => {
  setCarregandoRevendedores(true);
  setErroRevendedores('');
  try {
    const resposta = await axios.get(`${API_URL}/revendedores/resumo`);
    setDadosRevendedores(resposta.data || null);
  } catch (erro) {
    console.error('Erro revendedores:', erro);
    setErroRevendedores(erro.response?.data?.detail || 'Erro ao carregar revendedores.');
  } finally {
    setCarregandoRevendedores(false);
  }
};


  useEffect(() => {
    if (!usuarioLogado || !tokenAuth) return;
    aplicarTokenAxios(tokenAuth);
    carregarPermissoesDoBanco();
  }, [usuarioLogado, tokenAuth]);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (erro) => {
        if (erro?.response?.status === 401) {
          localStorage.removeItem('usuarioLogado');
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          localStorage.removeItem(TELA_ATUAL_STORAGE_KEY);
          localStorage.removeItem(VISAO_METAS_STORAGE_KEY);
          localStorage.removeItem(ESTRUTURA_META_STORAGE_KEY);
          localStorage.removeItem(CANAL_ATUAL_STORAGE_KEY);
          aplicarTokenAxios(null);
          setUsuarioLogado(null);
          setTokenAuth('');
          setTelaAtual('Dashboard');
        }
        return Promise.reject(erro);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);
  useEffect(() => {
    const receberMensagemAutomacao = async (event) => {
      if (event.source !== window) return;
      const data = event.data || {};
      if (data.source !== 'BOT_VENDAS_EXTENSAO') return;

      if (data.acao === 'AUTOMACAO_PEDIDOS_INICIADA') {
        setCarregandoAutomacaoPedidos(true);
        setErroUpload('');
        setMensagemUpload(data.mensagem || 'Automação iniciada. Aguarde a exportação no SGI.');
      }

      if (data.acao === 'UPLOAD_PEDIDOS_SUCESSO') {
        setCarregandoAutomacaoPedidos(false);
        setErroUpload('');
        setMensagemUpload(data.mensagem || 'Pedidos atualizados automaticamente com sucesso.');
        await atualizarTelasAposMudancaBanco();
      }

      if (data.acao === 'UPLOAD_PEDIDOS_ERRO') {
        setCarregandoAutomacaoPedidos(false);
        setMensagemUpload('');
        setErroUpload(data.mensagem || 'Falha na atualização automática de pedidos.');
      }

      if (data.acao === 'AUTOMACAO_MAKE_INICIADA') {
        setCarregandoAutomacaoMake(true);
        setErroUpload('');
        setMensagemUpload(data.mensagem || 'Automação MAKE iniciada. Aguarde o download dos 3 relatórios no SGI.');
      }

      if (data.acao === 'UPLOAD_MAKE_SUCESSO') {
        setCarregandoAutomacaoMake(false);
        setErroUpload('');
        setMensagemUpload(data.mensagem || 'Vendas MAKE atualizadas automaticamente com sucesso.');
        await atualizarTelasAposMudancaBanco();
      }

      if (data.acao === 'UPLOAD_MAKE_ERRO') {
        setCarregandoAutomacaoMake(false);
        setMensagemUpload('');
        setErroUpload(data.mensagem || 'Falha na atualização automática de Vendas MAKE.');
      }


      if (data.acao === 'AUTOMACAO_CABELO_INICIADA') {
        setCarregandoAutomacaoCabelo(true);
        setErroUpload('');
        setMensagemUpload(data.mensagem || 'Automação CABELO iniciada. Aguarde o download dos 2 relatórios no SGI.');
      }

      if (data.acao === 'UPLOAD_CABELO_SUCESSO') {
        setCarregandoAutomacaoCabelo(false);
        setErroUpload('');
        setMensagemUpload(data.mensagem || 'Vendas CABELO atualizadas automaticamente com sucesso.');
        await atualizarTelasAposMudancaBanco();
      }

      if (data.acao === 'UPLOAD_CABELO_ERRO') {
        setCarregandoAutomacaoCabelo(false);
        setMensagemUpload('');
        setErroUpload(data.mensagem || 'Falha na atualização automática de Vendas CABELO.');
      }
    };

    window.addEventListener('message', receberMensagemAutomacao);
    return () => window.removeEventListener('message', receberMensagemAutomacao);
  }, [filtrosAtivos, telaAtual]);

  const carregarTelaAtual = async (filtros = filtrosAtivos, forcarAtualizacao = false) => {
    if (!usuarioLogado) return;

    if (telaAtual === 'Dashboard') return carregarDashboard(filtros, forcarAtualizacao);
    if (telaAtual === 'Metas' || telaAtual === 'Ranking') return carregarDashboardEMetas(filtros, forcarAtualizacao);
    if (telaAtual === 'Comparativo') return carregarComparativo(filtros);
    if (telaAtual === 'Histórico') return carregarHistoricoCiclos();
    if (telaAtual === 'Revendedores') return carregarRevendedores();
    if (telaAtual === 'Base') return carregarCiclos();
    if (telaAtual === 'Cadastro') return carregarListaConsultores();
    if (telaAtual === 'Loja' || telaAtual === 'LojaVisaoGeral') return carregarDashboard(filtros, forcarAtualizacao);
    if (telaAtual === 'Configurações') return carregarUsuarios();
  };

  const carregarHistoricoCiclo = async (cicloParam = cicloHistoricoSelecionado) => {
    const ciclo = String(cicloParam || '').trim();
    if (!ciclo) {
      setDadosHistorico({ resumo: null, estruturas: [], consultores: [], consultoresAtivos: [], metas: [] });
      return;
    }

    setCarregandoHistorico(true);
    setErroHistorico('');
    setMensagemHistorico('');

    try {
      const [resumoResp, estruturasResp, consultoresResp, ativosResp, metasResp] = await Promise.allSettled([
        axios.get(`${API_URL}/historico/resumo`, { params: { ciclo } }),
        axios.get(`${API_URL}/historico/estruturas`, { params: { ciclo } }),
        axios.get(`${API_URL}/historico/consultores`, { params: { ciclo } }),
        axios.get(`${API_URL}/historico/consultores-ativos`, { params: { ciclo } }),
        axios.get(`${API_URL}/historico/metas`, { params: { ciclo } })
      ]);

      const ler = (resp, campo, padrao) => resp.status === 'fulfilled' ? (resp.value?.data?.[campo] ?? padrao) : padrao;

      setDadosHistorico({
        resumo: ler(resumoResp, 'resumo', null),
        estruturas: ler(estruturasResp, 'estruturas', []),
        consultores: ler(consultoresResp, 'consultores', []),
        consultoresAtivos: ler(ativosResp, 'consultores', []),
        metas: ler(metasResp, 'metas', [])
      });
    } catch (erro) {
      setErroHistorico(erro.response?.data?.detail || 'Erro ao carregar histórico do ciclo.');
    } finally {
      setCarregandoHistorico(false);
    }
  };

  const carregarHistoricoCiclos = async () => {
    if (!usuarioLogado) return;
    setCarregandoHistorico(true);
    setErroHistorico('');

    try {
      const { data } = await axios.get(`${API_URL}/historico/ciclos`);
      const ciclosLista = data?.ciclos || [];
      setHistoricoCiclos(ciclosLista);

      const cicloParaAbrir = cicloHistoricoSelecionado || ciclosLista?.[0]?.ciclo || '';
      if (cicloParaAbrir) {
        setCicloHistoricoSelecionado(cicloParaAbrir);
        await carregarHistoricoCiclo(cicloParaAbrir);
      } else {
        setDadosHistorico({ resumo: null, estruturas: [], consultores: [], consultoresAtivos: [], metas: [] });
      }
    } catch (erro) {
      setErroHistorico(erro.response?.data?.detail || 'Erro ao carregar lista de ciclos históricos.');
    } finally {
      setCarregandoHistorico(false);
    }
  };

  const fecharCicloHistorico = async () => {
    const ciclo = String(fechamentoHistorico.ciclo || '').trim();
    if (!ciclo) {
      setErroHistorico('Informe o ciclo que deseja fechar. Ex.: 08/2026.');
      return;
    }

    const confirmar = window.confirm(`Fechar e congelar o ciclo ${ciclo}? Isso salvará uma fotografia oficial do ciclo.`);
    if (!confirmar) return;

    setCarregandoHistorico(true);
    setErroHistorico('');
    setMensagemHistorico('');

    try {
      const { data } = await axios.post(`${API_URL}/historico/fechar-ciclo`, {
        ciclo,
        fechado_por: usuarioLogado?.nome || usuarioLogado?.email || 'Sistema',
        observacao: fechamentoHistorico.observacao || `Fechamento histórico do ciclo ${ciclo}`,
        substituir: true
      });
      setMensagemHistorico(data?.mensagem || `Ciclo ${ciclo} salvo no histórico.`);
      setFechamentoHistorico({ ciclo: '', observacao: '' });
      setCicloHistoricoSelecionado(ciclo);
      await carregarHistoricoCiclos();
      await carregarHistoricoCiclo(ciclo);
    } catch (erro) {
      setErroHistorico(erro.response?.data?.detail || 'Erro ao fechar ciclo.');
    } finally {
      setCarregandoHistorico(false);
    }
  };

  const reprocessarCicloHistorico = async () => {
    const ciclo = String(cicloHistoricoSelecionado || '').trim();
    if (!ciclo) {
      setErroHistorico('Selecione um ciclo para reprocessar.');
      return;
    }

    const confirmar = window.confirm(`Reprocessar o histórico do ciclo ${ciclo}? O snapshot atual será substituído.`);
    if (!confirmar) return;

    setCarregandoHistorico(true);
    setErroHistorico('');
    setMensagemHistorico('');

    try {
      const { data } = await axios.post(`${API_URL}/historico/reprocessar`, {
        ciclo,
        fechado_por: usuarioLogado?.nome || usuarioLogado?.email || 'Sistema',
        observacao: `Reprocessamento manual do ciclo ${ciclo}`,
        substituir: true
      });
      setMensagemHistorico(data?.mensagem || `Histórico do ciclo ${ciclo} reprocessado.`);
      await carregarHistoricoCiclos();
      await carregarHistoricoCiclo(ciclo);
    } catch (erro) {
      setErroHistorico(erro.response?.data?.detail || 'Erro ao reprocessar ciclo.');
    } finally {
      setCarregandoHistorico(false);
    }
  };

  useEffect(() => {
    if (!usuarioLogado) return;
    const chave = `${telaAtual}_${gerarChaveFiltros(filtrosAtivos)}`;
    if (ultimoCarregamentoTelaRef.current === chave) return;
    ultimoCarregamentoTelaRef.current = chave;
    carregarTelaAtual(filtrosAtivos, false);
  }, [usuarioLogado, telaAtual]);

  useEffect(() => {
    if (!usuarioLogado || telaAtual !== 'Metas' || visaoMetas !== 'consultores' || detalheMeta) return;
    const estruturaSalva = localStorage.getItem(ESTRUTURA_META_STORAGE_KEY);
    if (!estruturaSalva) {
      setVisaoMetas('estruturas');
      return;
    }
    carregarDetalheMeta(estruturaSalva, filtrosAtivos, false);
  }, [usuarioLogado, telaAtual, visaoMetas, detalheMeta]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErroLogin('');
    setCarregandoLogin(true);
    try {
      const resposta = await axios.post(`${API_URL}/auth/login`, { email: emailLogin, senha: senhaLogin });
      const usuario = resposta.data.usuario;
      const token = resposta.data.access_token;
      if (!token) throw new Error('Token não retornado pelo backend.');
      aplicarTokenAxios(token);
      setTokenAuth(token);
      setUsuarioLogado(usuario);
      localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.setItem(TELA_ATUAL_STORAGE_KEY, 'Dashboard');
      localStorage.setItem(CANAL_ATUAL_STORAGE_KEY, 'VD');
      localStorage.setItem(VISAO_METAS_STORAGE_KEY, 'estruturas');
      localStorage.removeItem(ESTRUTURA_META_STORAGE_KEY);
      await carregarPermissoesDoBanco();
      setCanalAtual('VD');
      setTelaAtual('Dashboard');
      setVisaoMetas('estruturas');
      setEstruturaSelecionada('');
    } catch (erro) {
      setErroLogin(erro.response?.data?.detail || 'Erro ao realizar login.');
    } finally {
      setCarregandoLogin(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('usuarioLogado');
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TELA_ATUAL_STORAGE_KEY);
    localStorage.removeItem(VISAO_METAS_STORAGE_KEY);
    localStorage.removeItem(ESTRUTURA_META_STORAGE_KEY);
    localStorage.removeItem(CANAL_ATUAL_STORAGE_KEY);
    aplicarTokenAxios(null);
    setTokenAuth('');
    setUsuarioLogado(null);
    setCanalAtual('VD');
    setTelaAtual('Dashboard');
    setVisaoMetas('estruturas');
    setEstruturaSelecionada('');
    limparCachesDados();
  };

  const toggleFiltroArray = (categoria, valor) => {
    const listaAtual = filtrosAtivos[categoria] || []; const novaLista = listaAtual.includes(valor) ? listaAtual.filter((item) => item !== valor) : [...listaAtual, valor];
    setFiltrosAtivos({ ...filtrosAtivos, [categoria]: novaLista });
  };
  

  const toggleFiltroRevendedoresArray = (categoria, valor) => {
    const listaAtual = filtrosRevendedores[categoria] || [];
    const novaLista = listaAtual.includes(valor) ? listaAtual.filter((item) => item !== valor) : [...listaAtual, valor];
    setFiltrosRevendedores({ ...filtrosRevendedores, [categoria]: novaLista });
  };

  const limparFiltrosRevendedores = () => {
    setFiltrosRevendedores({ estruturas: [], cidades: [], atividades: [], papeis: [], inadimplentes: [] });
    setBuscaFiltrosRevendedores({ estruturas: '', cidades: '', atividades: '', papeis: '', inadimplentes: '' });
    setBuscaRevendedores('');
  };

  const obterOpcoesRevendedores = (lista) => {
    const unicos = (campo) => [...new Set((lista || []).map((item) => String(item?.[campo] || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    return {
      estruturas: unicos('nome_estrutura'),
      cidades: unicos('cidade'),
      atividades: unicos('atividade'),
      papeis: unicos('papel'),
      inadimplentes: unicos('inadimplente')
    };
  };

  const handleAplicarFiltros = () => { 
    setPainelFiltrosAberto(false);
    ultimoCarregamentoTelaRef.current = '';

    setTimeout(() => {
      carregarTelaAtual(filtrosAtivos, false);
    }, 0);
  };
  
  const handleRemoverFiltros = () => { 
    setPainelFiltrosAberto(false);
    setFiltrosAtivos(filtroVazio);
    setBuscaFiltros(buscaFiltrosVazia); 
    ultimoCarregamentoTelaRef.current = '';

    setTimeout(() => {
      carregarTelaAtual(filtroVazio, false);
    }, 0);
  };


  const handleFiltroRapidoNucleo = (opcao) => {
    const novosFiltros = {
      ...filtrosAtivos,
      nucleos: opcao === 'TODOS' ? [] : [opcao]
    };

    if (gerarChaveFiltros(novosFiltros) === gerarChaveFiltros(filtrosAtivos)) return;

    setFiltrosAtivos(novosFiltros);
    ultimoCarregamentoTelaRef.current = '';

    if (debounceFiltroRapidoRef.current) clearTimeout(debounceFiltroRapidoRef.current);
    debounceFiltroRapidoRef.current = setTimeout(() => {
      carregarTelaAtual(novosFiltros, false);
    }, 250);
  };

  const iniciarAtualizacaoAutomaticaPedidos = () => {
    setErroUpload('');
    setMensagemUpload('Solicitando atualização automática de pedidos pela extensão...');
    setCarregandoAutomacaoPedidos(true);

    window.postMessage({
      source: 'DASH_SB',
      acao: 'INICIAR_EXTRACAO_PEDIDOS'
    }, '*');

    setTimeout(() => {
      setCarregandoAutomacaoPedidos((atual) => {
        if (atual) {
          setMensagemUpload('Se a aba do SGI não abriu, verifique se a extensão Bot de Vendas está instalada e recarregada no Chrome.');
        }
        return atual;
      });
    }, 12000);
  };


  const iniciarAtualizacaoAutomaticaMake = () => {
    setErroUpload('');
    setMensagemUpload('Solicitando atualização automática dos 3 relatórios de Vendas MAKE pela extensão...');
    setCarregandoAutomacaoMake(true);

    window.postMessage({
      source: 'DASH_SB',
      acao: 'INICIAR_EXTRACAO_MAKE'
    }, '*');

    setTimeout(() => {
      setCarregandoAutomacaoMake((atual) => {
        if (atual) {
          setMensagemUpload('Se a aba do SGI não abriu, verifique se a extensão Bot Vendas MAKE está instalada e recarregada no Chrome.');
        }
        return atual;
      });
    }, 12000);
  };


  const iniciarAtualizacaoAutomaticaCabelo = () => {
    setErroUpload('');
    setMensagemUpload('Solicitando atualização automática dos 2 relatórios de Vendas CABELO pela extensão...');
    setCarregandoAutomacaoCabelo(true);

    window.postMessage({
      source: 'DASH_SB',
      acao: 'INICIAR_EXTRACAO_CABELO'
    }, '*');

    setTimeout(() => {
      setCarregandoAutomacaoCabelo((atual) => {
        if (atual) {
          setMensagemUpload('Se a aba do SGI não abriu, verifique se a extensão Bot Vendas CABELO está instalada e recarregada no Chrome.');
        }
        return atual;
      });
    }, 12000);
  };

  const atualizarTelasAposMudancaBanco = async () => {
    limparCachesDados();
    ultimoCarregamentoTelaRef.current = '';
    await carregarOpcoesFiltros(true);

    const tarefas = [];
    if (telaAtual === 'Dashboard') tarefas.push(carregarDashboard(filtrosAtivos, true));
    else if (telaAtual === 'Metas' || telaAtual === 'Ranking') tarefas.push(carregarDashboardEMetas(filtrosAtivos, true));
    else if (telaAtual === 'Comparativo') tarefas.push(carregarComparativo(filtrosAtivos));
    else tarefas.push(carregarDashboard(filtrosAtivos, true));

    if (telaAtual === 'Cadastro') tarefas.push(carregarListaConsultores());
    if (telaAtual === 'Histórico') tarefas.push(carregarHistoricoCiclos());
    if (telaAtual === 'Base') tarefas.push(carregarCiclos());
    if (telaAtual === 'Configurações') tarefas.push(carregarUsuarios());

    await Promise.allSettled(tarefas);
  };

  
const enviarArquivo = async (tipo) => {
    let endpoint = ''; let arquivo = null; let arquivos = null;
    if (tipo === 'pedidos') { endpoint = '/upload/pedidos'; arquivo = arquivoPedidos; } if (tipo === 'metas') { endpoint = '/upload/metas'; arquivo = arquivoMetas; } if (tipo === 'consultores') { endpoint = '/upload/consultores'; arquivo = arquivoConsultores; } if (tipo === 'baseAtiva') { endpoint = '/upload/base-ativa'; arquivo = arquivoBaseAtiva; } if (tipo === 'revendedores') { endpoint = '/upload/revendedores'; arquivo = arquivoRevendedores; } if (tipo === 'skusIaf') { endpoint = '/upload/skus-iaf'; arquivo = arquivoSkusIaf; } if (tipo === 'vendasMake') { endpoint = '/upload/vendas-make'; arquivos = arquivosVendasMake; } if (tipo === 'vendasCabelo') { endpoint = '/upload/vendas-cabelo'; arquivos = arquivosVendasCabelo; }
    if (!arquivo && (!arquivos || arquivos.length === 0)) { setErroUpload('Selecione um arquivo antes de enviar.'); setMensagemUpload(''); return; }
    const formData = new FormData(); if (arquivos?.length > 0) arquivos.forEach((item) => formData.append('arquivos', item)); else formData.append('arquivo', arquivo);
    setCarregandoUpload(true); setErroUpload(''); setMensagemUpload('');
    try { 
      const resposta = await axios.post(`${API_URL}${endpoint}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }); 
      setMensagemUpload(resposta.data.mensagem || 'Sucesso.'); await atualizarTelasAposMudancaBanco(); 
    } catch (erro) { setErroUpload(erro.response?.data?.detail || 'Erro.'); } finally { setCarregandoUpload(false); }
  };

  const criarUsuario = async (e) => { e.preventDefault(); setMensagemUsuarios(''); setErroUsuarios(''); try { await axios.post(`${API_URL}/auth/criar-usuario`, novoUsuario); setMensagemUsuarios('Criado com sucesso.'); setNovoUsuario({ nome: '', email: '', senha: '', perfil: 'visualizador', status_usuario: 'ativo' }); await carregarUsuarios(); } catch (erro) { setErroUsuarios(erro.response?.data?.detail || 'Erro.'); } };
  const abrirEditarUsuario = (usuario) => { setUsuarioEditando({ ...usuario }); setModalEditarUsuarioAberto(true); };
  const salvarEdicaoUsuario = async (e) => { e.preventDefault(); try { await axios.put(`${API_URL}/auth/atualizar-usuario`, { id: usuarioEditando.id, nome: usuarioEditando.nome, perfil: usuarioEditando.perfil, status_usuario: usuarioEditando.status_usuario }); setModalEditarUsuarioAberto(false); setMensagemUsuarios('Atualizado com sucesso.'); await carregarUsuarios(); } catch (erro) { setErroUsuarios(erro.response?.data?.detail || 'Erro.'); } };
  const abrirExcluirUsuario = (usuario) => { setUsuarioParaExcluir(usuario); setModalExcluirUsuarioAberto(true); };
  const confirmarExclusaoUsuario = async () => { if (!usuarioParaExcluir) return; try { await axios.delete(`${API_URL}/auth/deletar-usuario/${usuarioParaExcluir.id}`); setModalExcluirUsuarioAberto(false); setUsuarioParaExcluir(null); setMensagemUsuarios('Excluído com sucesso.'); await carregarUsuarios(); } catch (erro) { setErroUsuarios(erro.response?.data?.detail || 'Erro.'); } };
  const alterarSenha = async (e) => { e.preventDefault(); setMensagemSenha(''); setErroSenha(''); if (senhaPerfil.nova_senha !== senhaPerfil.confirmar_senha) { setErroSenha('Senhas não conferem.'); return; } if (senhaPerfil.nova_senha.length < 6) { setErroSenha('Mínimo 6 caracteres.'); return; } try { await axios.post(`${API_URL}/auth/alterar-senha`, { email: usuarioLogado.email, senha_atual: senhaPerfil.senha_atual, nova_senha: senhaPerfil.nova_senha }); setMensagemSenha('Senha alterada.'); setSenhaPerfil({ senha_atual: '', nova_senha: '', confirmar_senha: '' }); } catch (erro) { setErroSenha(erro.response?.data?.detail || 'Erro ao alterar senha.'); } };
  
  const criarCiclo = async (e) => { e.preventDefault(); setMensagemCiclo(''); setErroCiclo(''); try { await axios.post(`${API_URL}/ciclos`, { ciclo: cicloForm.ciclo, data_inicio: cicloForm.data_inicio, data_fim: cicloForm.data_fim, meta_ciclo: Number(cicloForm.meta_ciclo || 0), status_ciclo: cicloForm.status_ciclo }); setMensagemCiclo('Cadastrado com sucesso.'); setCicloForm(cicloFormVazio); limparCachesDados(); await carregarCiclos(); await carregarOpcoesFiltros(true); await carregarDashboard(filtrosAtivos, true); } catch (erro) { setErroCiclo(erro.response?.data?.detail || 'Erro.'); } };
  const abrirEditarCiclo = (ciclo) => { setCicloEditando({ ...ciclo, data_inicio: ciclo.data_inicio ? String(ciclo.data_inicio).slice(0, 10) : '', data_fim: ciclo.data_fim ? String(ciclo.data_fim).slice(0, 10) : '', meta_ciclo: ciclo.meta_ciclo || '' }); setModalEditarCicloAberto(true); };
  const salvarEdicaoCiclo = async (e) => { e.preventDefault(); if (!cicloEditando) return; try { await axios.put(`${API_URL}/ciclos/${cicloEditando.id}`, { ciclo: cicloEditando.ciclo, data_inicio: cicloEditando.data_inicio, data_fim: cicloEditando.data_fim, meta_ciclo: Number(cicloEditando.meta_ciclo || 0), status_ciclo: cicloEditando.status_ciclo }); setModalEditarCicloAberto(false); setCicloEditando(null); setMensagemCiclo('Atualizado.'); limparCachesDados(); await carregarCiclos(); await carregarOpcoesFiltros(true); await carregarDashboard(filtrosAtivos, true); } catch (erro) { setErroCiclo(erro.response?.data?.detail || 'Erro.'); } };
  const abrirExcluirCiclo = (ciclo) => { setCicloParaExcluir(ciclo); setModalExcluirCicloAberto(true); };
  const confirmarExclusaoCiclo = async () => { if (!cicloParaExcluir) return; try { await axios.delete(`${API_URL}/ciclos/${cicloParaExcluir.id}`); setModalExcluirCicloAberto(false); setCicloParaExcluir(null); setMensagemCiclo('Excluído.'); limparCachesDados(); await carregarCiclos(); await carregarOpcoesFiltros(true); await carregarDashboard(filtrosAtivos, true); } catch (erro) { setErroCiclo(erro.response?.data?.detail || 'Erro.'); } };

  const salvarNovoConsultor = async (e) => { e.preventDefault(); setErroGestaoConsultor(''); setMensagemConsultor(''); try { await axios.post(`${API_URL}/consultores`, novoConsultor); setModalCriarConsultorAberto(false); setNovoConsultor(consultorVazio); setMensagemConsultor('Criado.'); limparCachesDados(); await carregarListaConsultores(); } catch (erro) { setErroGestaoConsultor(erro.response?.data?.detail || 'Erro.'); } };
  const abrirEditarConsultor = (consultor) => { setConsultorEditando({ ...consultor }); setModalEditarConsultorAberto(true); };
  const salvarEdicaoConsultor = async (e) => { e.preventDefault(); setErroGestaoConsultor(''); setMensagemConsultor(''); try { await axios.put(`${API_URL}/consultores/${consultorEditando.id}`, consultorEditando); setModalEditarConsultorAberto(false); setMensagemConsultor('Atualizado.'); limparCachesDados(); await carregarListaConsultores(); } catch (erro) { setErroGestaoConsultor(erro.response?.data?.detail || 'Erro.'); } };
  const abrirExcluirConsultor = (consultor) => { setConsultorParaExcluir(consultor); setModalExcluirConsultorAberto(true); };
  const confirmarExclusaoConsultor = async () => { if (!consultorParaExcluir) return; setErroGestaoConsultor(''); setMensagemConsultor(''); try { await axios.delete(`${API_URL}/consultores/${consultorParaExcluir.id}`); setModalExcluirConsultorAberto(false); setConsultorParaExcluir(null); setMensagemConsultor('Excluído.'); limparCachesDados(); await carregarListaConsultores(); } catch (erro) { setErroGestaoConsultor(erro.response?.data?.detail || 'Erro.'); } };

  const abrirModalValExp = (tit, valStr, desc, detalhes = [], formula = '') => setModalValorExpandido({ aberto: true, titulo: tit, valorTexto: valStr, descricao: desc, detalhes, formula });
  const fecharModalValExp = () => setModalValorExpandido({ aberto: false, titulo: '', valorTexto: '', descricao: '', detalhes: [], formula: '' });
  
  const abrirDetRealizadoTotal = () => {
    const realizado = Number(dados?.valor_total || 0);
    const meta = Number(metaFaturamentoDashboard || 0);
    const percentual = calcPerc(realizado, meta);
    const falta = Math.max(meta - realizado, 0);
    setModalDetalhes({
      titulo: 'Realizado Total',
      subtitulo: 'Realizado vs Meta',
      tipo: 'padrao',
      itens: [
        { label: 'Realizado', valor: formatarMoeda(realizado) },
        { label: 'Meta faturamento', valor: formatarMoeda(meta) },
        { label: '% da meta', valor: `${formatarNumeroBR(percentual, 1)}%` },
        { label: 'Faltam faturar', valor: falta > 0 ? formatarMoeda(falta) : 'Meta batida' }
      ]
    });
  };
  const abrirDetRealizadoDiario = () => {
    const realizado = Number(dados?.realizado_diario || 0);
    const meta = Number(dados?.meta_diaria || 0);
    const percentual = calcPerc(realizado, meta);
    const falta = Math.max(meta - realizado, 0);
    setModalDetalhes({
      titulo: 'Realizado Diário',
      subtitulo: 'Realizado Hoje',
      tipo: 'padrao',
      itens: [
        { label: 'Realizado hoje', valor: formatarMoeda(realizado) },
        { label: 'Meta diária', valor: formatarMoeda(meta) },
        { label: '% da meta diária', valor: `${formatarNumeroBR(percentual, 1)}%` },
        { label: 'Faltam faturar hoje', valor: falta > 0 ? formatarMoeda(falta) : 'Meta batida' }
      ]
    });
  };
  const calcularPlanoInteligenteTendencia = () => {
    const metaCiclo = Number(dados?.meta_ciclo || metaFaturamentoDashboard || 0);
    const realizadoCiclo = Number(dados?.realizado_ciclo || dados?.valor_total || 0);
    const realizadoDiario = Number(dados?.realizado_diario || 0);
    const metaDiaria = Number(dados?.meta_diaria || 0);
    const tendencia = Number(dados?.tendencia_ciclo || 0);
    const gap = Number(dados?.gap_tendencia || 0);
    const valorFaltante = Math.max(Number(dados?.valor_faltante_ciclo || (metaCiclo - realizadoCiclo) || 0), 0);

    const parseDataLocal = (valor) => {
      if (!valor) return null;
      const d = new Date(`${valor}T00:00:00`);
      return Number.isNaN(d.getTime()) ? null : d;
    };

    const pesoDiaLocal = (data) => {
      const dia = data.getDay();
      if (dia >= 1 && dia <= 5) return 1;
      if (dia === 6) return 0.5;
      return 0;
    };

    const somarDiasPonderados = (inicio, fim) => {
      if (!inicio || !fim || inicio > fim) return 0;
      let total = 0;
      const atual = new Date(inicio);
      while (atual <= fim) {
        total += pesoDiaLocal(atual);
        atual.setDate(atual.getDate() + 1);
      }
      return Number(total.toFixed(2));
    };

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataReferencia = parseDataLocal(filtrosAtivos?.data_fim) || hoje;
    const fimCiclo = parseDataLocal(dados?.fim_ciclo);
    const diasRestantes = somarDiasPonderados(dataReferencia, fimCiclo);
    const mediaNecessaria = diasRestantes > 0 ? valorFaltante / diasRestantes : 0;
    const faltaHoje = Math.max(metaDiaria - realizadoDiario, 0);
    const sobraHoje = Math.max(realizadoDiario - metaDiaria, 0);
    const precisaAcelerar = gap < 0;
    const percentualMetaDiaria = calcPerc(realizadoDiario, metaDiaria);

    let titulo = '';
    let resumo = '';
    let sugestoes = [];

    if (metaCiclo <= 0) {
      titulo = 'Cadastre a meta do ciclo para gerar uma recomendação.';
      resumo = 'Sem meta cadastrada, o sistema não consegue calcular o esforço necessário para bater o ciclo.';
      sugestoes = ['Cadastre a meta do ciclo na aba Base > Ciclos.', 'Depois atualize o dashboard para recalcular a tendência.'];
    } else if (valorFaltante <= 0 || tendencia >= metaCiclo) {
      titulo = 'A tendência está positiva. O foco agora é manter o ritmo.';
      resumo = `Mantendo a média atual, a projeção fecha em ${formatarMoeda(tendencia)}, com folga aproximada de ${formatarMoeda(Math.max(gap, 0))}.`;
      sugestoes = [
        'Preserve o ritmo das estruturas que estão acima de 100% da meta.',
        'Direcione reforço para as estruturas abaixo de 80% para aumentar a folga.',
        'Monitore MAKE, CABELO e Atividade para não perder qualidade no resultado.'
      ];
    } else {
      titulo = 'Plano sugerido para recuperar a meta';
      resumo = `Faltam ${formatarMoeda(valorFaltante)} para bater a meta do ciclo. Para recuperar, venda em média ${formatarMoeda(mediaNecessaria)} por dia útil ponderado até o fim do ciclo.`;
      sugestoes = [
        `Recuperar o gap de tendência de ${formatarMoeda(Math.abs(gap))}.`,
        faltaHoje > 0
          ? `Hoje faltaram ${formatarMoeda(faltaHoje)} para a meta diária. Use esse valor como alvo mínimo de recuperação no próximo dia.`
          : `Hoje você superou a meta diária em ${formatarMoeda(sobraHoje)}. Mantenha esse ritmo para reduzir o gap.`,
        'Priorize as estruturas com maior base ativa e menor % de atingimento, pois elas tendem a ter mais espaço de recuperação.',
        'Acione os consultores do ranking individual com melhor conversão para puxar pedidos VD+ e APP Revendedor.',
        'Crie uma campanha de curto prazo focada nos produtos de maior saída e acompanhe o realizado a cada atualização da base.'
      ];
    }

    return {
      titulo,
      resumo,
      status: precisaAcelerar ? 'risco' : 'ok',
      cards: [
        { label: 'Falta para meta', valor: formatarMoeda(valorFaltante) },
        { label: 'Média necessária/dia', valor: formatarMoeda(mediaNecessaria) },
        { label: 'Dias úteis ponderados', valor: diasRestantes.toLocaleString('pt-BR') },
        { label: '% da meta diária', valor: `${percentualMetaDiaria.toFixed(1)}%` }
      ],
      sugestoes
    };
  };

  const abrirDetTendencia = () => {
    const plano = calcularPlanoInteligenteTendencia();
    setModalDetalhes({
      titulo: 'Tendência',
      subtitulo: 'Projeção final com plano inteligente de recuperação',
      tipo: 'tendencia',
      itens: [
        { label: 'Tendência', valor: formatarMoeda(dados?.tendencia_ciclo) },
        { label: 'Gap', valor: formatarMoeda(dados?.gap_tendencia) }
      ],
      plano
    });
  };
  const obterResumoMetasAtual = () => dadosMetas || cacheMetas || {};

  const abrirDetAtiv = () => {
    const resumoMetas = obterResumoMetasAtual();
    const ativados = Number(dados?.revendedores_ativados || resumoMetas?.atividade_total_geral || 0);
    const percentualAtual = Number(dados?.percentual_atividade_geral || resumoMetas?.percentual_atividade_total_geral || 0);
    const baseAtivaCalculada = percentualAtual > 0 && ativados > 0 ? Math.round(ativados / (percentualAtual / 100)) : 0;
    const baseAtiva = Number(resumoMetas?.base_ativa_total_geral || baseAtivaCalculada || 0);
    const metaAtividade = Number(resumoMetas?.meta_atividade_geral || 0);
    const metaEmRevendedores = calcularQtdMetaAtividade(baseAtiva, metaAtividade);
    const faltamAtivar = calcularFaltamAtivar(ativados, baseAtiva, metaAtividade);
    const percentualDaMeta = calcPerc(percentualAtual, metaAtividade);

    abrirModalValExp(
      'Atividade Geral',
      `${formatarNumeroBR(percentualAtual, 1)}%`,
      'Atividade = revendedores ativados dividido pela base ativa.',
      [
        { label: 'Revendedores ativados', valor: formatarNumeroBR(ativados, 0) },
        { label: '% atividade atual', valor: `${formatarNumeroBR(percentualAtual, 1)}%` },
        { label: '% da meta', valor: `${formatarNumeroBR(percentualDaMeta, 1)}%` },
        { label: 'Base ativa', valor: formatarNumeroBR(baseAtiva, 0) },
        { label: 'Meta atividade', valor: `${formatarNumeroBR(metaAtividade, 1)}%` },
        { label: 'Meta em revendedores', valor: formatarNumeroBR(metaEmRevendedores, 0) },
        { label: 'Faltam ativar', valor: formatarFaltamAtivar(faltamAtivar) }
      ],
      `${formatarNumeroBR(baseAtiva, 0)} × ${formatarNumeroBR(metaAtividade, 1)}% = ${formatarNumeroBR(metaEmRevendedores, 0)} revendedores necessários`
    );
  };

  const abrirDetIndicadorDashboard = (tipo) => {
    const resumoMetas = obterResumoMetasAtual();
    const tipoNormalizado = String(tipo || '').toUpperCase();
    const ehMake = tipoNormalizado === 'MAKE';
    const titulo = ehMake ? 'MAKE Geral' : 'CABELO Geral';
    const realizados = Number((ehMake ? dados?.revendedores_make : dados?.revendedores_cabelo) || 0);
    const percentualAtual = Number((ehMake ? dados?.percentual_make : dados?.percentual_cabelo) || 0);
    const metaPercentual = Number((ehMake ? resumoMetas?.meta_make_geral : resumoMetas?.meta_cabelo_geral) || 0);
    const ativados = Number(dados?.revendedores_ativados || resumoMetas?.atividade_total_geral || 0);
    const metaEmRevendedores = calcularQtdMetaAtividade(ativados, metaPercentual);
    const faltamIncluir = Math.max(metaEmRevendedores - realizados, 0);
    const percentualDaMeta = calcPerc(percentualAtual, metaPercentual);

    abrirModalValExp(
      titulo,
      `${formatarNumeroBR(percentualAtual, 1)}%`,
      `${tipoNormalizado} = revendedores ativados que compraram/incluíram itens de ${tipoNormalizado} dividido pelo total de revendedores ativados.`,
      [
        { label: `Revendedores com ${tipoNormalizado}`, valor: formatarNumeroBR(realizados, 0) },
        { label: `% ${tipoNormalizado} atual`, valor: `${formatarNumeroBR(percentualAtual, 1)}%` },
        { label: '% da meta', valor: `${formatarNumeroBR(percentualDaMeta, 1)}%` },
        { label: 'Revendedores ativados', valor: formatarNumeroBR(ativados, 0) },
        { label: `Meta ${tipoNormalizado}`, valor: `${formatarNumeroBR(metaPercentual, 1)}%` },
        { label: 'Meta em revendedores', valor: formatarNumeroBR(metaEmRevendedores, 0) },
        { label: `Faltam incluir ${tipoNormalizado}`, valor: formatarFaltamAtivar(faltamIncluir) }
      ],
      `${formatarNumeroBR(ativados, 0)} revendedores ativados × ${formatarNumeroBR(metaPercentual, 1)}% = ${formatarNumeroBR(metaEmRevendedores, 0)} revendedores necessários com ${tipoNormalizado}`
    );
  };

  const abrirDetDesempenhoDashboard = (tipo) => {
    const resumoMetas = obterResumoMetasAtual();
    const tipoNormalizado = String(tipo || '').toUpperCase();
    const valorTotal = Number(dados?.valor_total || 0);
    const pedidos = Number(dados?.total_pedidos || 0);
    const ativados = Number(dados?.revendedores_ativados || 0);
    const totalItens = Number(dados?.total_itens || 0);

    if (tipoNormalizado === 'RPA') {
      const rpa = ativados > 0 ? valorTotal / ativados : 0;
      const meta = Number(resumoMetas?.meta_rpa_geral || 0);
      const faturamentoNecessario = ativados * meta;
      const faltaFaturamento = Math.max(faturamentoNecessario - valorTotal, 0);
      abrirModalValExp(
        'RPA Geral',
        formatarMoeda(rpa),
        'RPA = faturamento realizado dividido por revendedores ativados.',
        [
          { label: 'RPA atual', valor: formatarMoeda(rpa) },
          { label: 'Meta RPA', valor: formatarMoeda(meta) },
          { label: '% da meta', valor: `${formatarNumeroBR(calcPerc(rpa, meta), 1)}%` },
          { label: 'Faturamento realizado', valor: formatarMoeda(valorTotal) },
          { label: 'Revendedores ativados', valor: formatarNumeroBR(ativados, 0) },
          { label: 'Faturamento necessário', valor: formatarMoeda(faturamentoNecessario) },
          { label: 'Faltam faturar', valor: faltaFaturamento > 0 ? formatarMoeda(faltaFaturamento) : 'Meta batida' }
        ],
        `${formatarMoeda(valorTotal)} ÷ ${formatarNumeroBR(ativados, 0)} = ${formatarMoeda(rpa)} | Meta: ${formatarNumeroBR(ativados, 0)} × ${formatarMoeda(meta)} = ${formatarMoeda(faturamentoNecessario)}`
      );
      return;
    }

    if (tipoNormalizado === 'TKT') {
      const tkt = pedidos > 0 ? valorTotal / pedidos : 0;
      const meta = Number(resumoMetas?.meta_tkt_medio_geral || 0);
      const faturamentoNecessario = pedidos * meta;
      const faltaFaturamento = Math.max(faturamentoNecessario - valorTotal, 0);
      abrirModalValExp(
        'Ticket Médio Geral',
        formatarMoeda(tkt),
        'Ticket médio = faturamento realizado dividido pelo total de pedidos.',
        [
          { label: 'Ticket médio atual', valor: formatarMoeda(tkt) },
          { label: 'Meta ticket médio', valor: formatarMoeda(meta) },
          { label: '% da meta', valor: `${formatarNumeroBR(calcPerc(tkt, meta), 1)}%` },
          { label: 'Faturamento realizado', valor: formatarMoeda(valorTotal) },
          { label: 'Total de pedidos', valor: formatarNumeroBR(pedidos, 0) },
          { label: 'Faturamento necessário', valor: formatarMoeda(faturamentoNecessario) },
          { label: 'Faltam faturar', valor: faltaFaturamento > 0 ? formatarMoeda(faltaFaturamento) : 'Meta batida' }
        ],
        `${formatarMoeda(valorTotal)} ÷ ${formatarNumeroBR(pedidos, 0)} = ${formatarMoeda(tkt)} | Meta: ${formatarNumeroBR(pedidos, 0)} × ${formatarMoeda(meta)} = ${formatarMoeda(faturamentoNecessario)}`
      );
      return;
    }

    const upa = calcularUpa(totalItens, ativados);
    const meta = Number(resumoMetas?.meta_upa_geral || 0);
    const itensNecessarios = Math.ceil(ativados * meta);
    const faltamItens = Math.max(itensNecessarios - totalItens, 0);
    abrirModalValExp(
      'UPA Geral',
      formatarNumeroBR(upa, 2),
      'UPA = total de itens vendidos dividido por revendedores ativados.',
      [
        { label: 'UPA atual', valor: formatarNumeroBR(upa, 2) },
        { label: 'Meta UPA', valor: formatarNumeroBR(meta, 1) },
        { label: '% da meta', valor: `${formatarNumeroBR(calcPerc(upa, meta), 1)}%` },
        { label: 'Itens vendidos', valor: formatarNumeroBR(totalItens, 0) },
        { label: 'Revendedores ativados', valor: formatarNumeroBR(ativados, 0) },
        { label: 'Itens necessários', valor: formatarNumeroBR(itensNecessarios, 0) },
        { label: 'Faltam itens', valor: faltamItens > 0 ? formatarNumeroBR(faltamItens, 0) : 'Meta batida' }
      ],
      `${formatarNumeroBR(totalItens, 0)} ÷ ${formatarNumeroBR(ativados, 0)} = ${formatarNumeroBR(upa, 2)} | Meta: ${formatarNumeroBR(ativados, 0)} × ${formatarNumeroBR(meta, 1)} = ${formatarNumeroBR(itensNecessarios, 0)} itens`
    );
  };

  const abrirDetCancelados = () => setModalDetalhes({ titulo: 'Cancelados', subtitulo: 'Pedidos Cancelados', tipo: 'cancelados', itens: [{ label: 'Quantidade', valor: dados?.total_cancelados }], motivos_cancelamento: dados?.motivos_cancelamento });

  const renderTelaDashboard = () => {
    if (carregandoDashboard && !dados) return <DashboardSkeletons />;
    if (!dados) return (<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8"><p className="text-gray-400">Nenhum dado carregado.</p></div>);
    const pTot = calcPerc(dados.valor_total, metaFaturamentoDashboard); const pDia = Number(dados.percentual_meta_diaria || 0); const pMk = Number(dados.percentual_make || 0); const pCb = Number(dados.percentual_cabelo || 0); const tPos = Number(dados.gap_tendencia || 0) >= 0;
    const corMakeDashboard = corPorFaixaMeta(pMk);
    const corCabeloDashboard = corPorFaixaMeta(pCb);
    const corAtividadeDashboard = corPorFaixaMeta(Number(dados.percentual_atividade_geral || 0));
    const rpaDashboard = dados.revendedores_ativados > 0 ? dados.valor_total / dados.revendedores_ativados : 0;
    const tktDashboard = dados.total_pedidos > 0 ? dados.valor_total / dados.total_pedidos : 0;
    const upaDashboard = dados.revendedores_ativados > 0 ? (dados.total_itens || 0) / dados.revendedores_ativados : 0;
    const resumoMetasDashboard = obterResumoMetasAtual();
    const corRpaDashboard = corPorFaixaMeta(calcPerc(rpaDashboard, resumoMetasDashboard?.meta_rpa_geral));
    const corTktDashboard = corPorFaixaMeta(calcPerc(tktDashboard, resumoMetasDashboard?.meta_tkt_medio_geral));
    const corUpaDashboard = corPorFaixaMeta(calcPerc(upaDashboard, resumoMetasDashboard?.meta_upa_geral));
    const mCap = [...(dados.meios_captacao || [])].sort((a, b) => Number(b.value || 0) - Number(a.value || 0)); const rMar = [...(dados.realizado_por_marca || [])].sort((a, b) => Number(b.value || 0) - Number(a.value || 0)); const rEst = [...(dados.realizado_por_estrutura || [])].sort((a, b) => Number(b.ValorPraticado || 0) - Number(a.ValorPraticado || 0)); const vCan = [...(dados.vendas_por_canal || [])].sort((a, b) => Number(b.receita_total || 0) - Number(a.receita_total || 0));
    const tCap = mCap.reduce((acc, curr) => acc + Number(curr.value || 0), 0); const altEst = Math.max(300, rEst.length * 48);
    const consDataDash = [...(dados.realizado_por_consultor || [])].sort((a, b) => Number(b.ValorPraticado || 0) - Number(a.ValorPraticado || 0));

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <FiltroRapidoNucleos filtrosAtivos={filtrosAtivos} onSelecionar={handleFiltroRapidoNucleo} />
          <p className="text-xs font-medium text-gray-400 text-left sm:text-right">{dados.ultima_atualizacao_pedidos ? `Última atualização (Base Pedidos): ${dados.ultima_atualizacao_pedidos}` : 'Nenhum upload de Pedidos'}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 xl:gap-5">
          <CardMini titulo="Realizado Total" valor={formatarAbrev(dados.valor_total)} percentual={pTot} labelMeta="Meta Faturamento:" valorMeta={formatarAbrev(metaFaturamentoDashboard)} onClickExpandir={abrirDetRealizadoTotal} />
          <CardMini titulo="Realizado Diário" valor={formatarAbrev(dados.realizado_diario || 0)} percentual={pDia} labelMeta="Meta Diária:" valorMeta={formatarAbrev(dados.meta_diaria || 0)} onClickExpandir={abrirDetRealizadoDiario} />
          <CardMini titulo="Tendência" valor={formatarAbrev(dados.tendencia_ciclo || 0)} percentual={calcPerc(dados.tendencia_ciclo, dados.meta_ciclo || metaFaturamentoDashboard)} labelMeta="Gap Tendência:" valorMeta={formatarAbrev(dados.gap_tendencia || 0)} onClickExpandir={abrirDetTendencia} isTendencia tendenciaIcon={tPos ? TrendingUp : TrendingDown} tendenciaStatus={dados.status_tendencia || 'Sem tendência'} />
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full min-w-0 transition-transform hover:shadow-md">
            <div className="grid grid-cols-2 flex-1 min-w-0"><div className="p-3 sm:p-4 border-r border-gray-100 min-w-0 flex flex-col justify-center"><h3 className="text-[10px] font-bold uppercase text-gray-500 mb-1 truncate pr-1">Total pedidos</h3><p className="text-lg sm:text-xl lg:text-2xl font-extrabold text-[#048187] tracking-tighter truncate">{Number(dados.total_pedidos || 0).toLocaleString('pt-BR')}</p></div><div className="p-3 sm:p-4 relative min-w-0 flex flex-col justify-center"><button onClick={abrirDetAtiv} className="absolute top-2 right-2 text-[#048187] hover:text-[#036b70] bg-[#e6f6f7] p-1.5 rounded-full z-10"><Eye size={12} /></button><h3 className="text-[10px] font-bold uppercase text-gray-500 mb-1 pr-4 truncate">Ativados</h3><p className="text-lg sm:text-xl lg:text-2xl font-extrabold text-[#048187] tracking-tighter truncate">{Number(dados.revendedores_ativados || 0).toLocaleString('pt-BR')}</p></div></div>
            <div className="p-2 sm:p-3 border-t border-gray-50 bg-gray-50/50 flex items-center justify-between min-w-0 gap-2"><p className="text-[9px] font-bold text-gray-400 uppercase truncate">Cancelados</p><button onClick={abrirDetCancelados} className="text-sm font-bold text-[#712231] hover:underline tracking-tighter flex items-center gap-1 truncate">{Number(dados.total_cancelados || 0).toLocaleString('pt-BR')} <Eye size={14}/></button></div>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full min-w-0 justify-center transition-transform hover:shadow-md">
            <h3 className="text-[10px] font-bold uppercase text-gray-500 mb-2 border-b border-gray-50 pb-1.5 truncate">Indicadores</h3>
            <div className="space-y-1.5">
              <button type="button" onClick={() => abrirDetIndicadorDashboard('MAKE')} className="w-full text-white rounded px-2 py-1 flex justify-between items-center transition-colors min-w-0" style={{ backgroundColor: corMakeDashboard }}><span className="text-[9px] sm:text-[10px] font-bold truncate">MAKE</span><span className="text-[9px] sm:text-[10px] font-bold shrink-0">{pMk.toFixed(1)}%</span></button>
              <button type="button" onClick={() => abrirDetIndicadorDashboard('CABELO')} className="w-full text-white rounded px-2 py-1 flex justify-between items-center transition-colors min-w-0" style={{ backgroundColor: corCabeloDashboard }}><span className="text-[9px] sm:text-[10px] font-bold truncate">CABELO</span><span className="text-[9px] sm:text-[10px] font-bold shrink-0">{pCb.toFixed(1)}%</span></button>
              <button type="button" onClick={abrirDetAtiv} className="w-full text-white rounded px-2 py-1 flex justify-between items-center transition-colors min-w-0" style={{ backgroundColor: corAtividadeDashboard }}><span className="text-[9px] sm:text-[10px] font-bold truncate">ATIV.</span><span className="text-[9px] sm:text-[10px] font-bold shrink-0">{Number(dados.percentual_atividade_geral || 0).toFixed(1)}%</span></button>
            </div>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full min-w-0 justify-center transition-transform hover:shadow-md">
            <h3 className="text-[10px] font-bold uppercase text-gray-500 mb-2 border-b border-gray-50 pb-1.5 truncate">Desempenho</h3>
            <div className="space-y-1.5">
              <button type="button" onClick={() => abrirDetDesempenhoDashboard('RPA')} className="w-full bg-[#fcfbf7] border border-gray-100 text-gray-700 rounded px-2 py-1 flex justify-between items-center min-w-0 hover:bg-[#e6f6f7] transition-colors"><span className="text-[9px] sm:text-[10px] font-bold uppercase truncate">RPA</span><span className="text-[9px] sm:text-[10px] font-bold shrink-0" style={{ color: corRpaDashboard }}>{formatarMoeda(rpaDashboard)}</span></button>
              <button type="button" onClick={() => abrirDetDesempenhoDashboard('TKT')} className="w-full bg-[#fcfbf7] border border-gray-100 text-gray-700 rounded px-2 py-1 flex justify-between items-center min-w-0 hover:bg-[#e6f6f7] transition-colors"><span className="text-[9px] sm:text-[10px] font-bold uppercase truncate">TKT MÉD.</span><span className="text-[9px] sm:text-[10px] font-bold shrink-0" style={{ color: corTktDashboard }}>{formatarMoeda(tktDashboard)}</span></button>
              <button type="button" onClick={() => abrirDetDesempenhoDashboard('UPA')} className="w-full bg-[#fcfbf7] border border-gray-100 text-gray-700 rounded px-2 py-1 flex justify-between items-center min-w-0 hover:bg-[#e6f6f7] transition-colors"><span className="text-[9px] sm:text-[10px] font-bold uppercase truncate">UPA</span><span className="text-[9px] sm:text-[10px] font-bold shrink-0" style={{ color: corUpaDashboard }}>{Number(upaDashboard).toFixed(1)}</span></button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 xl:gap-6 mt-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 min-w-0">
            <h3 className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase text-center mb-3 border-b border-gray-100 pb-2 leading-tight truncate">Vendas por dia de Captação</h3>
            <div className="h-[260px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dados.vendas_por_dia || []} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs><linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#048187" stopOpacity={0.25} /><stop offset="95%" stopColor="#048187" stopOpacity={0.03} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="Data Captação" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={formatarTickMoeda} width={48} />
                  <Tooltip formatter={(value) => formatarMoeda(value)} />
                  <Area type="monotone" dataKey="ValorPraticado" stroke="#048187" strokeWidth={3} fill="url(#colorVendas)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 min-w-0">
            <h3 className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase text-center mb-3 border-b border-gray-100 pb-2 leading-tight truncate">MODELO DE VENDA</h3>
            <div className="h-[260px] sm:h-[300px] overflow-hidden">
              {rMar.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 0, right: 0, bottom: 20, left: 0 }}>
                    <Pie data={rMar} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius="40%" outerRadius="75%">{rMar.map((entry, index) => (<Cell key={entry.name} fill={CORES_GRAFICO[index % CORES_GRAFICO.length]} />))}</Pie>
                    <Tooltip formatter={(value) => formatarMoeda(value)} />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (<div className="h-full flex items-center justify-center text-gray-400 text-sm">Nenhum dado</div>)}
            </div>
          </div>
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 min-w-0">
            <h3 className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase text-center mb-3 border-b border-gray-100 pb-2 leading-tight truncate">Meios de Captação</h3>
            <div className="h-[260px] sm:h-[300px]">
              {mCap.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mCap} layout="vertical" margin={{ top: 20, right: 45, left: 35, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="MeioCaptacao" type="category" width={85} tick={{ fontSize: 11, fill: '#334155' }} />
                    <Tooltip formatter={(value) => `${value} pedidos`} />
                    <Bar dataKey="value" fill="#048187" radius={[0, 4, 4, 0]}>
                      <LabelList content={({ x, y, width, height, value }) => { const percentual = tCap > 0 ? ((Number(value || 0) / tCap) * 100).toFixed(1) : '0.0'; return (<text x={x + width + 8} y={y + height / 2 + 4} fill="#475569" fontSize={11} fontWeight="bold">{percentual}%</text>); }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (<div className="h-full flex items-center justify-center text-gray-400 text-sm">Sem dados</div>)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 xl:gap-6 mt-6">
          <div className="xl:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 min-w-0">
            <h3 className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase text-center mb-3 border-b border-gray-100 pb-2 leading-tight truncate">Vendas por canal</h3>
            <div className="overflow-x-auto h-[360px]" style={{ scrollbarWidth: 'thin', scrollbarColor: '#ccecee transparent' }}>
              {vCan.length > 0 ? (
                <table className="w-full text-[11px] min-w-[800px] border-collapse">
                  <thead className="bg-[#048187] text-white sticky top-0 z-10">
                    <tr><th className="px-3 py-2 text-left font-bold border border-white/30">Estrutura</th><th className="px-3 py-2 text-right font-bold border border-white/30">App Rev.</th><th className="px-3 py-2 text-right font-bold border border-white/30">Omni</th><th className="px-3 py-2 text-right font-bold border border-white/30">Portal Rev.</th><th className="px-3 py-2 text-right font-bold border border-white/30">VD+</th><th className="px-3 py-2 text-right font-bold border border-white/30">Cancelado</th><th className="px-3 py-2 text-right font-bold border border-white/30">Receita Total</th></tr>
                  </thead>
                  <tbody>
                    {vCan.map((i, idx) => (
                      <tr key={`${i.estrutura}-${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2 font-bold text-gray-700 border border-gray-200 whitespace-nowrap">{i.estrutura}</td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-700 border border-gray-200 whitespace-nowrap">{formatarMoeda(i.app_revendedor)}</td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-700 border border-gray-200 whitespace-nowrap">{formatarMoeda(i.omni)}</td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-700 border border-gray-200 whitespace-nowrap">{formatarMoeda(i.portal_revendedor)}</td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-700 border border-gray-200 whitespace-nowrap">{formatarMoeda(i.vd_mais)}</td>
                        <td className="px-3 py-2 text-right font-semibold text-[#712231] border border-gray-200 whitespace-nowrap">{formatarMoeda(i.cancelado)}</td>
                        <td className="px-3 py-2 text-right font-extrabold text-green-600 border border-gray-200 whitespace-nowrap">{formatarMoeda(i.receita_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (<div className="p-10 flex items-center justify-center text-gray-400 text-sm">Sem dados</div>)}
            </div>
          </div>
          
          <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 min-w-0">
            <h3 className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase text-center mb-3 border-b border-gray-100 pb-2 leading-tight truncate">Realizado por Estrutura</h3>
            <div className="h-[360px] overflow-y-auto pr-2">
              <div style={{ height: altEst }}>
                {rEst.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rEst} layout="vertical" margin={{ top: 10, right: 45, left: 95, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => formatarAbrev(v)} />
                      <YAxis dataKey="Estrutura" type="category" width={95} tick={{ fontSize: 9, fill: '#334155' }} />
                      <Tooltip content={<TooltipEstrutura />} />
                      <Bar dataKey="ValorPraticado" radius={[0, 4, 4, 0]}>{rEst.map((e, i) => (<Cell key={e.Estrutura} fill={CORES_ESTRUTURA[i % CORES_ESTRUTURA.length]} />))}<LabelList dataKey="ValorPraticado" position="right" formatter={(v) => formatarAbrev(v)} style={{ fontSize: 10, fill: '#334155', fontWeight: 700 }} /></Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (<div className="h-full flex items-center justify-center text-gray-400 text-sm">Sem dados</div>)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 mt-6">
          <h3 className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase text-center mb-4 border-b border-gray-100 pb-2">Vendas por Consultor</h3>
          <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#ccecee transparent' }}>
            {consDataDash.length > 0 ? consDataDash.map((c, idx) => {
              const perc = dados.valor_total > 0 ? (Number(c.ValorPraticado || 0) / dados.valor_total) * 100 : 0;
              return (
                <div key={`${c.Consultor}-${idx}`} className="flex items-center gap-3 p-3 bg-[#fcfbf7] rounded-xl border border-gray-100 transition-all hover:bg-white min-w-0">
                  <span className="w-8 h-8 rounded-full bg-[#048187] text-white flex items-center justify-center font-black text-xs shrink-0">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-700 truncate text-xs sm:text-sm">{c.Consultor}</p>
                    <div className="w-full bg-gray-200 h-1.5 rounded-full mt-1.5"><div className="bg-[#048187] h-1.5 rounded-full" style={{ width: `${Math.min(perc, 100)}%` }}></div></div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-[#048187] text-sm sm:text-base">{formatarAbrev(c.ValorPraticado)}</p>
                    <p className="text-[9px] font-bold text-gray-400 mt-0.5">{perc.toFixed(1)}% do total</p>
                  </div>
                </div>
              );
            }) : (<div className="h-full flex items-center justify-center text-gray-400 text-sm py-10">Sem dados de consultores.</div>)}
          </div>
        </div>
      </div>
    );
  };

  const renderTelaMetas = () => {
    if (carregandoMetas && !dadosMetas) return <DashboardSkeletons />;
    const ests = [...(dadosMetas?.estruturas || [])].sort((a, b) => Number(b.realizado || 0) - Number(a.realizado || 0));
    const estruturasFiltradasBuscaMeta = ests.filter((item) => String(item.estrutura || '').toLowerCase().includes(String(buscaEstruturaMeta || '').toLowerCase())).slice(0, 12);
    const consOriginais = [...(detalheMeta?.consultores || [])].sort((a, b) => Number(b.realizado || 0) - Number(a.realizado || 0));
    const possuiConsultoresDetalhados = consOriginais.length > 0;
    const vFora = detalheMeta?.vendas_fora_estrutura || [];

    const rpaGeral = dadosMetas?.atividade_total_geral > 0 ? dadosMetas?.realizado_total_geral / dadosMetas?.atividade_total_geral : 0;
    const tktGeral = dadosMetas?.realizado_total_geral && dadosMetas.estruturas ? dadosMetas.realizado_total_geral / dadosMetas.estruturas.reduce((a,e)=>a+(e.quantidade_pedidos||0),0) : 0;
    const totalItensGeral = dadosMetas?.estruturas ? dadosMetas.estruturas.reduce((a,e)=>a+Number(e.total_itens||0),0) : 0;
    const atividadeGeral = Number(dadosMetas?.atividade_total_geral || 0);
    const upaGeral = calcularUpa(totalItensGeral, atividadeGeral);
    const totalItensDetalhe = Number(detalheMeta?.total_itens || 0);
    const atividadeDetalhe = Number(detalheMeta?.atividade_realizada || 0);
    const upaDetalhe = calcularUpa(totalItensDetalhe, atividadeDetalhe);
    const percentualAtividadeGeral = Number(dadosMetas?.percentual_atividade_total_geral || 0);
    const baseAtivaGeral = Number(dadosMetas?.base_ativa_total_geral || 0);
    const metaAtividadeGeralPercentual = Number(dadosMetas?.meta_atividade_geral || 0);
    const qtdMetaAtividadeGeral = calcularQtdMetaAtividade(baseAtivaGeral, metaAtividadeGeralPercentual);
    const faltamAtivarGeral = calcularFaltamAtivar(atividadeGeral, baseAtivaGeral, metaAtividadeGeralPercentual);
    const percentualAtividadeDetalhe = Number(detalheMeta?.percentual_atividade || 0);
    const baseAtivaDetalhe = Number(detalheMeta?.base_ativa || 0);
    const metaAtividadeDetalhePercentual = Number(detalheMeta?.meta?.atividade || 0);
    const qtdMetaAtividadeDetalhe = calcularQtdMetaAtividade(baseAtivaDetalhe, metaAtividadeDetalhePercentual);
    const faltamAtivarDetalhe = calcularFaltamAtivar(atividadeDetalhe, baseAtivaDetalhe, metaAtividadeDetalhePercentual);
    const makeGeral = Number(dadosMetas?.make_total_geral || 0);
    const percentualMakeGeral = Number(dadosMetas?.percentual_make_total_geral || 0);
    const metaMakeGeralPercentual = Number(dadosMetas?.meta_make_geral || 0);
    const qtdMetaMakeGeral = calcularQtdMetaAtividade(atividadeGeral, metaMakeGeralPercentual);
    const faltamMakeGeral = Math.max(qtdMetaMakeGeral - makeGeral, 0);
    const cabeloGeral = Number(dadosMetas?.cabelo_total_geral || 0);
    const percentualCabeloGeral = Number(dadosMetas?.percentual_cabelo_total_geral || 0);
    const metaCabeloGeralPercentual = Number(dadosMetas?.meta_cabelo_geral || 0);
    const qtdMetaCabeloGeral = calcularQtdMetaAtividade(atividadeGeral, metaCabeloGeralPercentual);
    const faltamCabeloGeral = Math.max(qtdMetaCabeloGeral - cabeloGeral, 0);
    const makeDetalhe = Number(detalheMeta?.make_realizado || 0);
    const percentualMakeDetalhe = Number(detalheMeta?.percentual_make || 0);
    const metaMakeDetalhePercentual = Number(detalheMeta?.meta?.make || 0);
    const qtdMetaMakeDetalhe = calcularQtdMetaAtividade(atividadeDetalhe, metaMakeDetalhePercentual);
    const faltamMakeDetalhe = Math.max(qtdMetaMakeDetalhe - makeDetalhe, 0);
    const cabeloDetalhe = Number(detalheMeta?.cabelo_realizado || 0);
    const percentualCabeloDetalhe = Number(detalheMeta?.percentual_cabelo || 0);
    const metaCabeloDetalhePercentual = Number(detalheMeta?.meta?.cabelo || 0);
    const qtdMetaCabeloDetalhe = calcularQtdMetaAtividade(atividadeDetalhe, metaCabeloDetalhePercentual);
    const faltamCabeloDetalhe = Math.max(qtdMetaCabeloDetalhe - cabeloDetalhe, 0);
    const pedidosGeralMetas = dadosMetas?.estruturas ? dadosMetas.estruturas.reduce((a, e) => a + Number(e.quantidade_pedidos || 0), 0) : 0;
    const pedidosDetalheMetas = Number(detalheMeta?.quantidade_pedidos || 0);

    const textoFaltaMoeda = (valor) => Number(valor || 0) > 0 ? formatarMoeda(valor) : 'Meta batida';
    const textoFaltaQtd = (valor) => Number(valor || 0) > 0 ? formatarNumeroBR(valor, 0) : 'Meta batida';
    const calcularMetaDistribuida = (metaTotal, peso, casas = 0) => {
      const valor = Number(metaTotal || 0) * (Number(peso || 0) / 100);
      if (casas === 0) return Math.round(valor);
      return Number(valor.toFixed(casas));
    };
    const obterPesoRanking = (item) => {
      const pesoInformado = Number(item?.peso_meta || 0);
      if (pesoInformado > 0) return pesoInformado;
      if (consOriginais.length > 0) return 100 / consOriginais.length;
      return 100;
    };
    const nomeEquipeFallback = detalheMeta?.estrutura
      ? (String(detalheMeta.estrutura).toUpperCase().startsWith('EQUIPE') ? String(detalheMeta.estrutura) : `EQUIPE ${detalheMeta.estrutura}`)
      : 'EQUIPE';
    const cons = consOriginais.length > 0
      ? consOriginais
      : (detalheMeta ? [{
          id_colaborador: `estrutura-${String(detalheMeta.estrutura || 'equipe').replace(/\s+/g, '-').toLowerCase()}`,
          nome: nomeEquipeFallback,
          nome_exibicao: nomeEquipeFallback,
          estrutura: detalheMeta.estrutura,
          peso_meta: 100,
          quantidade_pedidos: Number(detalheMeta?.quantidade_pedidos || 0),
          meta_individual: Number(detalheMeta?.meta?.receita || 0),
          realizado: Number(detalheMeta?.realizado || 0),
          percentual: calcPerc(Number(detalheMeta?.realizado || 0), Number(detalheMeta?.meta?.receita || 0)),
          atividade_realizada: atividadeDetalhe,
          percentual_atividade: percentualAtividadeDetalhe,
          total_itens: totalItensDetalhe,
          make_realizado: makeDetalhe,
          percentual_make: percentualMakeDetalhe,
          cabelo_realizado: cabeloDetalhe,
          percentual_cabelo: percentualCabeloDetalhe,
          tipo_fallback_estrutura: true,
        }]
      : []);
    const descricaoResumoDetalhe = possuiConsultoresDetalhados
      ? 'Resumo da estrutura e resultado individual dos consultores.'
      : 'Resumo da estrutura e resultado consolidado da equipe.';
    const obterCorDesempenho = (percentual) => {
      const valor = Number(percentual || 0);
      if (valor < 70) return '#7c1f31';
      if (valor < 91) return '#ff6f03';
      return '#048187';
    };

    const CardIndicadorRanking = ({ titulo, meta, realizado, percentualMeta, onClickExpandir }) => {
      const percentualSeguro = Number(percentualMeta || 0);
      const percentualBarra = Math.max(0, Math.min(percentualSeguro, 100));
      const faltaPercentual = Math.max(100 - percentualSeguro, 0);
      const corDesempenho = obterCorDesempenho(percentualSeguro);

      return (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] uppercase font-black tracking-wide text-gray-500">{titulo}:</p>
            <button
              type="button"
              onClick={onClickExpandir}
              className="text-[#048187] hover:text-[#026a6e] transition-colors"
              title={`Ver detalhes de ${titulo}`}
            >
              <Eye size={16} />
            </button>
          </div>
          <div className="mt-3 space-y-2">
            <div>
              <p className="text-[11px] uppercase font-black text-gray-400">Meta:</p>
              <p className="text-[13px] sm:text-[14px] font-black text-gray-700 mt-0.5 break-words leading-tight">{meta}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase font-black text-gray-400">Realizado:</p>
              <p className="text-[13px] sm:text-[14px] font-black mt-0.5 break-words leading-tight" style={{ color: corDesempenho }}>{realizado}</p>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between gap-3 text-[11px] font-semibold flex-wrap">
              <span style={{ color: corDesempenho }}>{formatarNumeroBR(percentualSeguro, 1)}% da meta</span>
              <span style={{ color: corDesempenho }}>{percentualSeguro >= 100 ? 'Meta batida' : `Falta ${formatarNumeroBR(faltaPercentual, 1)}%`}</span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${percentualBarra}%`, backgroundColor: corDesempenho }} />
            </div>
          </div>
        </div>
      );
    };

    const abrirDetalheFaturamentoGeralMetas = () => {
      const realizado = Number(dadosMetas?.realizado_total_geral || 0);
      const meta = Number(dadosMetas?.meta_total_geral || 0);
      const percentual = calcPerc(realizado, meta);
      const faltam = Math.max(meta - realizado, 0);
      abrirModalValExp(
        'Faturamento Geral',
        formatarMoeda(realizado),
        'Soma da receita válida de todas as estruturas.',
        [
          { label: 'Realizado', valor: formatarMoeda(realizado) },
          { label: 'Meta faturamento', valor: formatarMoeda(meta) },
          { label: '% da meta', valor: `${formatarNumeroBR(percentual, 1)}%` },
          { label: 'Faltam faturar', valor: textoFaltaMoeda(faltam) }
        ],
        meta > 0 ? `${formatarMoeda(realizado)} ÷ ${formatarMoeda(meta)} = ${formatarNumeroBR(percentual, 1)}% da meta` : 'Meta de faturamento não cadastrada.'
      );
    };

    const abrirDetalheRealizadoDiarioMetas = () => {
      const realizado = Number(dados?.realizado_diario || 0);
      const meta = Number(dados?.meta_diaria || 0);
      const percentual = calcPerc(realizado, meta);
      const faltam = Math.max(meta - realizado, 0);
      abrirModalValExp(
        'Realizado Diário',
        formatarMoeda(realizado),
        'Receita total do dia atual.',
        [
          { label: 'Realizado hoje', valor: formatarMoeda(realizado) },
          { label: 'Meta diária', valor: formatarMoeda(meta) },
          { label: '% da meta diária', valor: `${formatarNumeroBR(percentual, 1)}%` },
          { label: 'Faltam faturar hoje', valor: textoFaltaMoeda(faltam) }
        ],
        meta > 0 ? `${formatarMoeda(realizado)} ÷ ${formatarMoeda(meta)} = ${formatarNumeroBR(percentual, 1)}% da meta diária` : 'Meta diária não cadastrada.'
      );
    };

    const abrirDetalheRpaGeralMetas = () => {
      const realizado = Number(dadosMetas?.realizado_total_geral || 0);
      const ativados = Number(atividadeGeral || 0);
      const rpa = ativados > 0 ? realizado / ativados : 0;
      const meta = Number(dadosMetas?.meta_rpa_geral || 0);
      const faturamentoNecessario = ativados * meta;
      const faltam = Math.max(faturamentoNecessario - realizado, 0);
      abrirModalValExp(
        'RPA Geral',
        formatarMoeda(rpa),
        'RPA = faturamento realizado dividido pelas revendedoras ativadas.',
        [
          { label: 'RPA atual', valor: formatarMoeda(rpa) },
          { label: 'Meta RPA', valor: formatarMoeda(meta) },
          { label: '% da meta', valor: `${formatarNumeroBR(calcPerc(rpa, meta), 1)}%` },
          { label: 'Faturamento realizado', valor: formatarMoeda(realizado) },
          { label: 'Revendedoras ativadas', valor: formatarNumeroBR(ativados, 0) },
          { label: 'Faturamento necessário', valor: formatarMoeda(faturamentoNecessario) },
          { label: 'Faltam faturar', valor: textoFaltaMoeda(faltam) }
        ],
        `${formatarMoeda(realizado)} ÷ ${formatarNumeroBR(ativados, 0)} = ${formatarMoeda(rpa)} | Meta: ${formatarNumeroBR(ativados, 0)} × ${formatarMoeda(meta)} = ${formatarMoeda(faturamentoNecessario)}`
      );
    };

    const abrirDetalheTicketGeralMetas = () => {
      const realizado = Number(dadosMetas?.realizado_total_geral || 0);
      const pedidos = Number(pedidosGeralMetas || 0);
      const ticket = pedidos > 0 ? realizado / pedidos : 0;
      const meta = Number(dadosMetas?.meta_tkt_medio_geral || 0);
      const faturamentoNecessario = pedidos * meta;
      const faltam = Math.max(faturamentoNecessario - realizado, 0);
      abrirModalValExp(
        'Ticket Médio Geral',
        formatarMoeda(ticket),
        'Ticket médio = faturamento realizado dividido pelo total de pedidos.',
        [
          { label: 'Ticket médio atual', valor: formatarMoeda(ticket) },
          { label: 'Meta ticket médio', valor: formatarMoeda(meta) },
          { label: '% da meta', valor: `${formatarNumeroBR(calcPerc(ticket, meta), 1)}%` },
          { label: 'Faturamento realizado', valor: formatarMoeda(realizado) },
          { label: 'Total de pedidos', valor: formatarNumeroBR(pedidos, 0) },
          { label: 'Faturamento necessário', valor: formatarMoeda(faturamentoNecessario) },
          { label: 'Faltam faturar', valor: textoFaltaMoeda(faltam) }
        ],
        `${formatarMoeda(realizado)} ÷ ${formatarNumeroBR(pedidos, 0)} = ${formatarMoeda(ticket)} | Meta: ${formatarNumeroBR(pedidos, 0)} × ${formatarMoeda(meta)} = ${formatarMoeda(faturamentoNecessario)}`
      );
    };

    const abrirDetalheUpaGeralMetas = () => {
      const meta = Number(dadosMetas?.meta_upa_geral || 0);
      const itensNecessarios = Math.ceil(atividadeGeral * meta);
      const faltam = Math.max(itensNecessarios - totalItensGeral, 0);
      abrirModalValExp(
        'UPA Geral',
        formatarNumeroBR(upaGeral, 2),
        'UPA = total de itens vendidos dividido pelas revendedoras ativadas.',
        [
          { label: 'UPA atual', valor: formatarNumeroBR(upaGeral, 2) },
          { label: 'Meta UPA', valor: formatarNumeroBR(meta, 1) },
          { label: '% da meta', valor: `${formatarNumeroBR(calcPerc(upaGeral, meta), 1)}%` },
          { label: 'Itens vendidos', valor: formatarNumeroBR(totalItensGeral, 0) },
          { label: 'Revendedoras ativadas', valor: formatarNumeroBR(atividadeGeral, 0) },
          { label: 'Itens necessários', valor: formatarNumeroBR(itensNecessarios, 0) },
          { label: 'Faltam itens', valor: textoFaltaQtd(faltam) }
        ],
        `${formatarNumeroBR(totalItensGeral, 0)} ÷ ${formatarNumeroBR(atividadeGeral, 0)} = ${formatarNumeroBR(upaGeral, 2)} | Meta: ${formatarNumeroBR(atividadeGeral, 0)} × ${formatarNumeroBR(meta, 1)} = ${formatarNumeroBR(itensNecessarios, 0)} itens`
      );
    };

    const abrirDetalheFaturamentoEstruturaMetas = () => {
      if (!detalheMeta) return;
      const realizado = Number(detalheMeta?.realizado || 0);
      const meta = Number(detalheMeta?.meta?.receita || 0);
      const percentual = calcPerc(realizado, meta);
      const faltam = Math.max(meta - realizado, 0);
      abrirModalValExp(
        `Faturamento ${detalheMeta.estrutura}`,
        formatarMoeda(realizado),
        'Faturamento válido da estrutura.',
        [
          { label: 'Realizado', valor: formatarMoeda(realizado) },
          { label: 'Meta faturamento', valor: formatarMoeda(meta) },
          { label: '% da meta', valor: `${formatarNumeroBR(percentual, 1)}%` },
          { label: 'Faltam faturar', valor: textoFaltaMoeda(faltam) }
        ],
        meta > 0 ? `${formatarMoeda(realizado)} ÷ ${formatarMoeda(meta)} = ${formatarNumeroBR(percentual, 1)}% da meta` : 'Meta de faturamento da estrutura não cadastrada.'
      );
    };

    const abrirDetalheRpaEstruturaMetas = () => {
      const realizado = Number(detalheMeta?.realizado || 0);
      const ativados = Number(atividadeDetalhe || 0);
      const rpa = ativados > 0 ? realizado / ativados : 0;
      const meta = Number(detalheMeta?.meta?.rpa || 0);
      const faturamentoNecessario = ativados * meta;
      const faltam = Math.max(faturamentoNecessario - realizado, 0);
      abrirModalValExp(
        'RPA',
        formatarMoeda(rpa),
        'RPA = faturamento realizado da estrutura dividido pelas revendedoras ativadas.',
        [
          { label: 'RPA atual', valor: formatarMoeda(rpa) },
          { label: 'Meta RPA', valor: formatarMoeda(meta) },
          { label: '% da meta', valor: `${formatarNumeroBR(calcPerc(rpa, meta), 1)}%` },
          { label: 'Faturamento realizado', valor: formatarMoeda(realizado) },
          { label: 'Revendedoras ativadas', valor: formatarNumeroBR(ativados, 0) },
          { label: 'Faturamento necessário', valor: formatarMoeda(faturamentoNecessario) },
          { label: 'Faltam faturar', valor: textoFaltaMoeda(faltam) }
        ],
        `${formatarMoeda(realizado)} ÷ ${formatarNumeroBR(ativados, 0)} = ${formatarMoeda(rpa)} | Meta: ${formatarNumeroBR(ativados, 0)} × ${formatarMoeda(meta)} = ${formatarMoeda(faturamentoNecessario)}`
      );
    };

    const abrirDetalheTicketEstruturaMetas = () => {
      const realizado = Number(detalheMeta?.realizado || 0);
      const pedidos = Number(pedidosDetalheMetas || 0);
      const ticket = pedidos > 0 ? realizado / pedidos : 0;
      const meta = Number(detalheMeta?.meta?.tkt_medio || 0);
      const faturamentoNecessario = pedidos * meta;
      const faltam = Math.max(faturamentoNecessario - realizado, 0);
      abrirModalValExp(
        'Ticket Médio',
        formatarMoeda(ticket),
        'Ticket médio = faturamento realizado da estrutura dividido pelo total de pedidos.',
        [
          { label: 'Ticket médio atual', valor: formatarMoeda(ticket) },
          { label: 'Meta ticket médio', valor: formatarMoeda(meta) },
          { label: '% da meta', valor: `${formatarNumeroBR(calcPerc(ticket, meta), 1)}%` },
          { label: 'Faturamento realizado', valor: formatarMoeda(realizado) },
          { label: 'Total de pedidos', valor: formatarNumeroBR(pedidos, 0) },
          { label: 'Faturamento necessário', valor: formatarMoeda(faturamentoNecessario) },
          { label: 'Faltam faturar', valor: textoFaltaMoeda(faltam) }
        ],
        `${formatarMoeda(realizado)} ÷ ${formatarNumeroBR(pedidos, 0)} = ${formatarMoeda(ticket)} | Meta: ${formatarNumeroBR(pedidos, 0)} × ${formatarMoeda(meta)} = ${formatarMoeda(faturamentoNecessario)}`
      );
    };

    const abrirDetalheUpaEstruturaMetas = () => {
      const meta = Number(detalheMeta?.meta?.upa || 0);
      const itensNecessarios = Math.ceil(atividadeDetalhe * meta);
      const faltam = Math.max(itensNecessarios - totalItensDetalhe, 0);
      abrirModalValExp(
        'UPA',
        formatarNumeroBR(upaDetalhe, 2),
        'UPA = total de itens vendidos dividido pelas revendedoras ativadas.',
        [
          { label: 'UPA atual', valor: formatarNumeroBR(upaDetalhe, 2) },
          { label: 'Meta UPA', valor: formatarNumeroBR(meta, 1) },
          { label: '% da meta', valor: `${formatarNumeroBR(calcPerc(upaDetalhe, meta), 1)}%` },
          { label: 'Itens vendidos', valor: formatarNumeroBR(totalItensDetalhe, 0) },
          { label: 'Revendedoras ativadas', valor: formatarNumeroBR(atividadeDetalhe, 0) },
          { label: 'Itens necessários', valor: formatarNumeroBR(itensNecessarios, 0) },
          { label: 'Faltam itens', valor: textoFaltaQtd(faltam) }
        ],
        `${formatarNumeroBR(totalItensDetalhe, 0)} ÷ ${formatarNumeroBR(atividadeDetalhe, 0)} = ${formatarNumeroBR(upaDetalhe, 2)} | Meta: ${formatarNumeroBR(atividadeDetalhe, 0)} × ${formatarNumeroBR(meta, 1)} = ${formatarNumeroBR(itensNecessarios, 0)} itens`
      );
    };

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-8">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-full bg-[#048187] text-white flex items-center justify-center shrink-0"><Target size={25} /></div>
              <div className="min-w-0"><h1 className="text-xl sm:text-2xl font-bold text-gray-700 break-words">{visaoMetas === 'estruturas' ? 'Metas por Estrutura' : 'Metas por Consultores'}</h1><p className="text-sm text-gray-400">{visaoMetas === 'estruturas' ? 'Visão consolidada por estrutura comercial.' : 'Resumo da estrutura selecionada e performance individual dos consultores.'}</p></div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {visaoMetas === 'consultores' && (
                <button
                  type="button"
                  onClick={voltarParaListaMetas}
                  className="bg-[#e6f6f7] text-[#048187] hover:bg-[#d8f0f1] px-4 py-2 rounded-lg font-black text-xs inline-flex items-center gap-2 transition-colors"
                >
                  <ChevronLeft size={18} /> Voltar
                </button>
              )}
              <FiltroRapidoNucleos filtrosAtivos={filtrosAtivos} onSelecionar={handleFiltroRapidoNucleo} />
            </div>
          </div>
        </div>
        {erroMetas && (<div className="rounded-xl p-4 font-bold text-sm bg-red-50 border border-red-100 text-red-600">{erroMetas}</div>)}
        {visaoMetas === 'estruturas' && (
        <div className="overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#ccecee transparent' }}>
          <div className="grid grid-cols-8 gap-3 min-w-[1040px]">
          <CardMini titulo="Faturamento Geral" valor={formatarAbrev(dadosMetas?.realizado_total_geral)} percentual={calcPerc(dadosMetas?.realizado_total_geral, dadosMetas?.meta_total_geral)} labelMeta="Meta Faturamento:" valorMeta={formatarAbrev(dadosMetas?.meta_total_geral)} onClickExpandir={abrirDetalheFaturamentoGeralMetas} />
          <CardMini titulo="Realizado Diário" valor={formatarAbrev(dados?.realizado_diario)} percentual={calcPerc(dados?.realizado_diario, dados?.meta_diaria)} labelMeta="Meta Diária:" valorMeta={formatarAbrev(dados?.meta_diaria)} onClickExpandir={abrirDetalheRealizadoDiarioMetas} />
          <CardMini titulo="Atividade Geral" valor={`${percentualAtividadeGeral.toFixed(1)}%`} percentual={calcPerc(percentualAtividadeGeral, metaAtividadeGeralPercentual)} labelMeta="Meta Atividade:" valorMeta={`${metaAtividadeGeralPercentual.toFixed(1)}%`} onClickExpandir={() => abrirModalValExp('Atividade Geral', `${formatarNumeroBR(percentualAtividadeGeral, 1)}%`, 'Atividade = revendedores ativados dividido pela base ativa.', [{ label: 'Revendedores ativados', valor: formatarNumeroBR(atividadeGeral, 0) }, { label: '% atividade atual', valor: `${formatarNumeroBR(percentualAtividadeGeral, 1)}%` }, { label: '% da meta', valor: `${formatarNumeroBR(calcPerc(percentualAtividadeGeral, metaAtividadeGeralPercentual), 1)}%` }, { label: 'Base ativa', valor: formatarNumeroBR(baseAtivaGeral, 0) }, { label: 'Meta atividade', valor: `${formatarNumeroBR(metaAtividadeGeralPercentual, 1)}%` }, { label: 'Meta em revendedores', valor: formatarNumeroBR(qtdMetaAtividadeGeral, 0) }, { label: 'Faltam ativar', valor: formatarFaltamAtivar(faltamAtivarGeral) }], `${formatarNumeroBR(baseAtivaGeral, 0)} × ${formatarNumeroBR(metaAtividadeGeralPercentual, 1)}% = ${formatarNumeroBR(qtdMetaAtividadeGeral, 0)} revendedores necessários`)} />
          <CardMini titulo="MAKE Geral" valor={`${percentualMakeGeral.toFixed(1)}%`} percentual={calcPerc(percentualMakeGeral, metaMakeGeralPercentual)} labelMeta="Meta MAKE:" valorMeta={`${metaMakeGeralPercentual.toFixed(1)}%`} onClickExpandir={() => abrirModalValExp('MAKE Geral', `${formatarNumeroBR(percentualMakeGeral, 1)}%`, 'MAKE = revendedoras ativadas que compraram/incluíram itens de MAKE dividido pelo total de revendedoras ativadas.', [{ label: 'Revendedoras com MAKE', valor: formatarNumeroBR(makeGeral, 0) }, { label: '% MAKE atual', valor: `${formatarNumeroBR(percentualMakeGeral, 1)}%` }, { label: '% da meta', valor: `${formatarNumeroBR(calcPerc(percentualMakeGeral, metaMakeGeralPercentual), 1)}%` }, { label: 'Revendedoras ativadas', valor: formatarNumeroBR(atividadeGeral, 0) }, { label: 'Meta MAKE', valor: `${formatarNumeroBR(metaMakeGeralPercentual, 1)}%` }, { label: 'Meta em revendedoras', valor: formatarNumeroBR(qtdMetaMakeGeral, 0) }, { label: 'Faltam incluir MAKE', valor: formatarFaltamAtivar(faltamMakeGeral) }], `${formatarNumeroBR(atividadeGeral, 0)} revendedoras ativadas × ${formatarNumeroBR(metaMakeGeralPercentual, 1)}% = ${formatarNumeroBR(qtdMetaMakeGeral, 0)} revendedoras necessárias com MAKE`)} />
          <CardMini titulo="CABELO Geral" valor={`${percentualCabeloGeral.toFixed(1)}%`} percentual={calcPerc(percentualCabeloGeral, metaCabeloGeralPercentual)} labelMeta="Meta CABELO:" valorMeta={`${metaCabeloGeralPercentual.toFixed(1)}%`} onClickExpandir={() => abrirModalValExp('CABELO Geral', `${formatarNumeroBR(percentualCabeloGeral, 1)}%`, 'CABELO = revendedoras ativadas que compraram/incluíram itens de CABELO dividido pelo total de revendedoras ativadas.', [{ label: 'Revendedoras com CABELO', valor: formatarNumeroBR(cabeloGeral, 0) }, { label: '% CABELO atual', valor: `${formatarNumeroBR(percentualCabeloGeral, 1)}%` }, { label: '% da meta', valor: `${formatarNumeroBR(calcPerc(percentualCabeloGeral, metaCabeloGeralPercentual), 1)}%` }, { label: 'Revendedoras ativadas', valor: formatarNumeroBR(atividadeGeral, 0) }, { label: 'Meta CABELO', valor: `${formatarNumeroBR(metaCabeloGeralPercentual, 1)}%` }, { label: 'Meta em revendedoras', valor: formatarNumeroBR(qtdMetaCabeloGeral, 0) }, { label: 'Faltam incluir CABELO', valor: formatarFaltamAtivar(faltamCabeloGeral) }], `${formatarNumeroBR(atividadeGeral, 0)} revendedoras ativadas × ${formatarNumeroBR(metaCabeloGeralPercentual, 1)}% = ${formatarNumeroBR(qtdMetaCabeloGeral, 0)} revendedoras necessárias com CABELO`)} />
          <CardMini titulo="RPA Geral" valor={formatarMoeda(rpaGeral)} percentual={calcPerc(rpaGeral, dadosMetas?.meta_rpa_geral)} labelMeta="Meta RPA:" valorMeta={formatarMoeda(dadosMetas?.meta_rpa_geral)} onClickExpandir={abrirDetalheRpaGeralMetas} />
          <CardMini titulo="Ticket Médio" valor={formatarMoeda(tktGeral)} percentual={calcPerc(tktGeral, dadosMetas?.meta_tkt_medio_geral)} labelMeta="Meta Tkt Médio:" valorMeta={formatarMoeda(dadosMetas?.meta_tkt_medio_geral)} onClickExpandir={abrirDetalheTicketGeralMetas} />
          <CardMini titulo="UPA Geral" valor={upaGeral.toFixed(1)} percentual={calcPerc(upaGeral, dadosMetas?.meta_upa_geral)} labelMeta="Meta UPA:" valorMeta={Number(dadosMetas?.meta_upa_geral||0).toFixed(1)} onClickExpandir={abrirDetalheUpaGeralMetas} />
          </div>
        </div>
        )}
        
        {visaoMetas === 'estruturas' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4"><div><h2 className="text-lg font-bold text-gray-700">Estruturas cadastradas</h2></div><span className="text-sm font-bold text-[#048187]">{ests.length} estruturas</span></div>
          <div className="overflow-x-auto"><div className="max-h-[36rem] overflow-y-auto pr-2"><table className="w-full text-sm min-w-[1400px]"><thead className="sticky top-0 bg-white z-10"><tr className="text-left text-gray-500 border-b border-gray-100"><th className="py-3 pr-4">Estrutura</th><th className="py-3 text-right">Meta</th><th className="py-3 text-right">Realizado</th><th className="py-3 text-right">% Rec.</th><th className="py-3 text-right">Ativ.</th><th className="py-3 text-right">% Ativ.</th><th className="py-3 text-right">RPA</th><th className="py-3 text-right">Tkt Méd.</th><th className="py-3 text-right">UPA</th><th className="py-3 text-right">MAKE</th><th className="py-3 text-right">% Make</th><th className="py-3 text-right">CABELO</th><th className="py-3 text-right">% Cab.</th><th className="py-3 text-right">Ação</th></tr></thead><tbody>
            {ests.map(i => (<tr key={i.estrutura} className={`border-b border-gray-50 hover:bg-[#f4fbfb] ${estruturaSelecionada === i.estrutura ? 'bg-[#e6f6f7]' : ''}`}><td className="py-3 pr-4 font-medium text-gray-700">{i.estrutura}</td><td className="py-3 text-right text-gray-600">{formatarMoeda(i.receita)}</td><td className="py-3 text-right font-bold text-[#048187]">{formatarMoeda(i.realizado)}</td><td className="py-3 text-right font-bold text-gray-700">{Number(i.percentual || 0).toFixed(2)}%</td><td className="py-3 text-right font-bold text-gray-700">{Number(i.atividade_realizada || 0).toLocaleString('pt-BR')}</td><td className="py-3 text-right font-bold text-[#F97316]">{Number(i.percentual_atividade || 0).toFixed(2)}%</td><td className="py-3 text-right font-bold text-gray-700">{formatarMoeda(i.atividade_realizada > 0 ? i.realizado / i.atividade_realizada : 0)}</td><td className="py-3 text-right font-bold text-gray-700">{formatarMoeda(i.quantidade_pedidos > 0 ? i.realizado / i.quantidade_pedidos : 0)}</td><td className="py-3 text-right font-bold text-gray-700">{Number(i.atividade_realizada > 0 ? (i.total_itens || 0) / i.atividade_realizada : 0).toFixed(1)}</td><td className="py-3 text-right font-bold text-gray-700">{Number(i.make_realizado || 0).toLocaleString('pt-BR')}</td><td className="py-3 text-right font-bold text-[#048187]">{Number(i.percentual_make || 0).toFixed(2)}%</td><td className="py-3 text-right font-bold text-gray-700">{Number(i.cabelo_realizado || 0).toLocaleString('pt-BR')}</td><td className="py-3 text-right font-bold text-[#712231]">{Number(i.percentual_cabelo || 0).toFixed(2)}%</td><td className="py-3 text-right"><button onClick={async () => { await carregarDetalheMeta(i.estrutura, filtrosAtivos, false); setVisaoMetas('consultores'); }} className="bg-[#048187] text-white px-3 py-2 rounded-md hover:bg-[#036b70] inline-flex items-center gap-1"><Search size={14} /> Ver</button></td></tr>))}
          </tbody></table></div></div>
        </div>
        )}

        {visaoMetas === 'consultores' && detalheMeta && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-8">
              <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6 mb-6">
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={voltarParaListaMetas}
                    className="mb-3 bg-[#e6f6f7] text-[#048187] hover:bg-[#d8f0f1] px-4 py-2 rounded-lg font-black text-xs inline-flex items-center gap-2 transition-colors"
                  >
                    <ChevronLeft size={16} /> Voltar para estruturas
                  </button>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-700 break-words">{detalheMeta.estrutura}</h2>
                  <p className="text-sm text-gray-400 mt-1">{descricaoResumoDetalhe}</p>
                </div>
                <div className="w-full xl:w-[420px] relative">
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-wide">Filtro rápido de estrutura</label>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={buscaEstruturaMeta}
                      onFocus={() => setMostrarListaEstruturaMeta(true)}
                      onBlur={() => setTimeout(() => setMostrarListaEstruturaMeta(false), 180)}
                      onChange={(e) => { setBuscaEstruturaMeta(e.target.value); setMostrarListaEstruturaMeta(true); }}
                      placeholder="Buscar estrutura para consultar..."
                      className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-3 text-sm font-medium text-gray-700 outline-none focus:border-[#048187] focus:ring-2 focus:ring-[#048187]/10 bg-white"
                    />
                    {buscaEstruturaMeta && (
                      <button type="button" onClick={() => { setBuscaEstruturaMeta(''); setMostrarListaEstruturaMeta(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  {mostrarListaEstruturaMeta && (
                  <div className="absolute z-30 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-xl max-h-72 overflow-y-auto">
                    {(buscaEstruturaMeta ? estruturasFiltradasBuscaMeta : ests.slice(0, 8)).map((item) => (
                      <button
                        key={item.estrutura}
                        type="button"
                        onClick={async () => { await carregarDetalheMeta(item.estrutura, filtrosAtivos, false); setBuscaEstruturaMeta(''); setVisaoMetas('consultores'); }}
                        className={`w-full text-left px-4 py-3 text-sm border-b border-gray-50 last:border-b-0 hover:bg-[#e6f6f7] transition-colors ${detalheMeta?.estrutura === item.estrutura ? 'bg-[#f4fbfb] text-[#048187] font-bold' : 'text-gray-600 font-medium'}`}
                      >
                        <div className="flex items-center justify-between gap-3 min-w-0">
                          <span className="truncate">{item.estrutura}</span>
                          <span className="text-[11px] font-black text-[#048187] shrink-0">{Number(item.percentual || 0).toFixed(1)}%</span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate">Realizado: {formatarMoeda(item.realizado)} • Meta: {formatarMoeda(item.receita)}</p>
                      </button>
                    ))}
                    {estruturasFiltradasBuscaMeta.length === 0 && buscaEstruturaMeta && (
                      <div className="px-4 py-6 text-center text-xs font-bold text-gray-400">Nenhuma estrutura encontrada.</div>
                    )}
                  </div>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto pb-2 mb-6" style={{ scrollbarWidth: 'thin', scrollbarColor: '#ccecee transparent' }}>
                <div className="grid grid-cols-7 gap-3 min-w-[1120px]">
                <CardMetaNova titulo="Faturamento Estrutura" valor={formatarAbrev(detalheMeta.realizado)} percentual={calcPerc(detalheMeta.realizado, detalheMeta.meta?.receita)} labelMeta="Meta Faturamento:" valorMeta={formatarAbrev(detalheMeta.meta?.receita)} onClickExpandir={abrirDetalheFaturamentoEstruturaMetas} />
                <CardMetaNova titulo="Atividade" valor={`${percentualAtividadeDetalhe.toFixed(1)}%`} percentual={calcPerc(percentualAtividadeDetalhe, metaAtividadeDetalhePercentual)} labelMeta="Meta Atividade:" valorMeta={`${metaAtividadeDetalhePercentual.toFixed(1)}%`} onClickExpandir={() => abrirModalValExp('Atividade', `${formatarNumeroBR(percentualAtividadeDetalhe, 1)}%`, 'Atividade = revendedoras ativadas dividido pela base ativa da estrutura.', [{ label: 'Revendedoras ativadas', valor: formatarNumeroBR(atividadeDetalhe, 0) }, { label: '% atividade atual', valor: `${formatarNumeroBR(percentualAtividadeDetalhe, 1)}%` }, { label: '% da meta', valor: `${formatarNumeroBR(calcPerc(percentualAtividadeDetalhe, metaAtividadeDetalhePercentual), 1)}%` }, { label: 'Base ativa', valor: formatarNumeroBR(baseAtivaDetalhe, 0) }, { label: 'Meta atividade', valor: `${formatarNumeroBR(metaAtividadeDetalhePercentual, 1)}%` }, { label: 'Meta em revendedoras', valor: formatarNumeroBR(qtdMetaAtividadeDetalhe, 0) }, { label: 'Faltam ativar', valor: formatarFaltamAtivar(faltamAtivarDetalhe) }], `${formatarNumeroBR(baseAtivaDetalhe, 0)} × ${formatarNumeroBR(metaAtividadeDetalhePercentual, 1)}% = ${formatarNumeroBR(qtdMetaAtividadeDetalhe, 0)} revendedoras necessárias`)} />
                <CardMetaNova titulo="MAKE" valor={`${percentualMakeDetalhe.toFixed(1)}%`} percentual={calcPerc(percentualMakeDetalhe, metaMakeDetalhePercentual)} labelMeta="Meta MAKE:" valorMeta={`${metaMakeDetalhePercentual.toFixed(1)}%`} onClickExpandir={() => abrirModalValExp('MAKE', `${formatarNumeroBR(percentualMakeDetalhe, 1)}%`, 'MAKE = revendedoras ativadas da estrutura que compraram/incluíram itens de MAKE dividido pelo total de revendedoras ativadas da estrutura.', [{ label: 'Revendedoras com MAKE', valor: formatarNumeroBR(makeDetalhe, 0) }, { label: '% MAKE atual', valor: `${formatarNumeroBR(percentualMakeDetalhe, 1)}%` }, { label: '% da meta', valor: `${formatarNumeroBR(calcPerc(percentualMakeDetalhe, metaMakeDetalhePercentual), 1)}%` }, { label: 'Revendedoras ativadas', valor: formatarNumeroBR(atividadeDetalhe, 0) }, { label: 'Meta MAKE', valor: `${formatarNumeroBR(metaMakeDetalhePercentual, 1)}%` }, { label: 'Meta em revendedoras', valor: formatarNumeroBR(qtdMetaMakeDetalhe, 0) }, { label: 'Faltam incluir MAKE', valor: formatarFaltamAtivar(faltamMakeDetalhe) }], `${formatarNumeroBR(atividadeDetalhe, 0)} revendedoras ativadas × ${formatarNumeroBR(metaMakeDetalhePercentual, 1)}% = ${formatarNumeroBR(qtdMetaMakeDetalhe, 0)} revendedoras necessárias com MAKE`)} />
                <CardMetaNova titulo="CABELO" valor={`${percentualCabeloDetalhe.toFixed(1)}%`} percentual={calcPerc(percentualCabeloDetalhe, metaCabeloDetalhePercentual)} labelMeta="Meta CABELO:" valorMeta={`${metaCabeloDetalhePercentual.toFixed(1)}%`} onClickExpandir={() => abrirModalValExp('CABELO', `${formatarNumeroBR(percentualCabeloDetalhe, 1)}%`, 'CABELO = revendedoras ativadas da estrutura que compraram/incluíram itens de CABELO dividido pelo total de revendedoras ativadas da estrutura.', [{ label: 'Revendedoras com CABELO', valor: formatarNumeroBR(cabeloDetalhe, 0) }, { label: '% CABELO atual', valor: `${formatarNumeroBR(percentualCabeloDetalhe, 1)}%` }, { label: '% da meta', valor: `${formatarNumeroBR(calcPerc(percentualCabeloDetalhe, metaCabeloDetalhePercentual), 1)}%` }, { label: 'Revendedoras ativadas', valor: formatarNumeroBR(atividadeDetalhe, 0) }, { label: 'Meta CABELO', valor: `${formatarNumeroBR(metaCabeloDetalhePercentual, 1)}%` }, { label: 'Meta em revendedoras', valor: formatarNumeroBR(qtdMetaCabeloDetalhe, 0) }, { label: 'Faltam incluir CABELO', valor: formatarFaltamAtivar(faltamCabeloDetalhe) }], `${formatarNumeroBR(atividadeDetalhe, 0)} revendedoras ativadas × ${formatarNumeroBR(metaCabeloDetalhePercentual, 1)}% = ${formatarNumeroBR(qtdMetaCabeloDetalhe, 0)} revendedoras necessárias com CABELO`)} />
                <CardMetaNova titulo="RPA" valor={formatarMoeda(detalheMeta?.atividade_realizada > 0 ? detalheMeta?.realizado / detalheMeta?.atividade_realizada : 0)} percentual={calcPerc(detalheMeta?.atividade_realizada > 0 ? detalheMeta?.realizado / detalheMeta?.atividade_realizada : 0, detalheMeta.meta?.rpa)} labelMeta="Meta RPA:" valorMeta={formatarMoeda(detalheMeta.meta?.rpa)} onClickExpandir={abrirDetalheRpaEstruturaMetas} />
                <CardMetaNova titulo="Ticket Médio" valor={formatarMoeda(detalheMeta?.quantidade_pedidos > 0 ? detalheMeta?.realizado / detalheMeta?.quantidade_pedidos : 0)} percentual={calcPerc(detalheMeta?.quantidade_pedidos > 0 ? detalheMeta?.realizado / detalheMeta?.quantidade_pedidos : 0, detalheMeta.meta?.tkt_medio)} labelMeta="Meta Tkt Médio:" valorMeta={formatarMoeda(detalheMeta.meta?.tkt_medio)} onClickExpandir={abrirDetalheTicketEstruturaMetas} />
                <CardMetaNova titulo="UPA" valor={upaDetalhe.toFixed(1)} percentual={calcPerc(upaDetalhe, detalheMeta.meta?.upa)} labelMeta="Meta UPA:" valorMeta={Number(detalheMeta.meta?.upa||0).toFixed(1)} onClickExpandir={abrirDetalheUpaEstruturaMetas} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
              <h2 className="text-lg font-bold text-gray-700 text-center mb-4 border-b border-gray-100 pb-3">Ranking individual</h2>
              <div className="space-y-4">
                {cons.map((c, idx) => {
                  const trend = obterTendenciaVisual(c.id_colaborador);
                  const pesoConsultor = obterPesoRanking(c);
                  const faturamentoRealizado = Number(c.realizado || 0);
                  const faturamentoMeta = Number(c.meta_individual || 0);
                  const atividadeRealizadaItem = Number(c.atividade_realizada || 0);
                  const percentualAtividadeItem = Number(c.percentual_atividade || 0);
                  const metaAtividadeItem = c.tipo_fallback_estrutura ? qtdMetaAtividadeDetalhe : calcularMetaDistribuida(qtdMetaAtividadeDetalhe, pesoConsultor, 0);
                  const percentualMetaAtividadeItem = metaAtividadeDetalhePercentual;
                  const makeRealizadoItem = Number(c.make_realizado || 0);
                  const percentualMakeItem = Number(c.percentual_make || 0);
                  const percentualMetaMakeItem = metaMakeDetalhePercentual;
                  const metaMakeItem = Math.ceil((atividadeRealizadaItem * percentualMetaMakeItem) / 100);
                  const cabeloRealizadoItem = Number(c.cabelo_realizado || 0);
                  const percentualCabeloItem = Number(c.percentual_cabelo || 0);
                  const percentualMetaCabeloItem = metaCabeloDetalhePercentual;
                  const metaCabeloItem = Math.ceil((atividadeRealizadaItem * percentualMetaCabeloItem) / 100);
                  const rpaRealizadoItem = atividadeRealizadaItem > 0 ? faturamentoRealizado / atividadeRealizadaItem : 0;
                  const ticketRealizadoItem = Number(c.quantidade_pedidos || 0) > 0 ? faturamentoRealizado / Number(c.quantidade_pedidos || 0) : 0;
                  const upaRealizadoItem = calcularUpa(Number(c.total_itens || 0), atividadeRealizadaItem);
                  const percentualFaturamentoItem = calcPerc(faturamentoRealizado, faturamentoMeta);
                  const faltaFaturamentoItem = Math.max(faturamentoMeta - faturamentoRealizado, 0);
                  const percentualMetaAtividadeAtingido = calcPerc(percentualAtividadeItem, percentualMetaAtividadeItem);
                  const faltamAtivarItem = Math.max(metaAtividadeItem - atividadeRealizadaItem, 0);
                  const percentualMetaMakeAtingido = calcPerc(makeRealizadoItem, metaMakeItem);
                  const faltamMakeItem = Math.max(metaMakeItem - makeRealizadoItem, 0);
                  const percentualMetaCabeloAtingido = calcPerc(cabeloRealizadoItem, metaCabeloItem);
                  const faltamCabeloItem = Math.max(metaCabeloItem - cabeloRealizadoItem, 0);
                  const metaRpaItem = Number(detalheMeta?.meta?.rpa || 0);
                  const percentualMetaRpaAtingido = calcPerc(rpaRealizadoItem, metaRpaItem);
                  const faturamentoNecessarioRpaItem = metaRpaItem * atividadeRealizadaItem;
                  const faltamFaturarRpaItem = Math.max(faturamentoNecessarioRpaItem - faturamentoRealizado, 0);
                  const metaTicketItem = Number(detalheMeta?.meta?.tkt_medio || 0);
                  const percentualMetaTicketAtingido = calcPerc(ticketRealizadoItem, metaTicketItem);
                  const faturamentoNecessarioTicketItem = metaTicketItem * Number(c.quantidade_pedidos || 0);
                  const faltamFaturarTicketItem = Math.max(faturamentoNecessarioTicketItem - faturamentoRealizado, 0);
                  const metaUpaItem = Number(detalheMeta?.meta?.upa || 0);
                  const percentualMetaUpaAtingido = calcPerc(upaRealizadoItem, metaUpaItem);
                  const itensNecessariosUpaItem = metaUpaItem * atividadeRealizadaItem;
                  const faltamItensUpaItem = Math.max(itensNecessariosUpaItem - Number(c.total_itens || 0), 0);

                  const abrirDetalheFaturamentoRanking = () => abrirModalValExp(
                    `Faturamento ${obterNomeExibicaoConsultor(c)}`,
                    formatarMoeda(faturamentoRealizado),
                    'Detalhamento do faturamento realizado versus a meta individual.',
                    [
                      { label: 'Meta faturamento', valor: formatarMoeda(faturamentoMeta) },
                      { label: 'Realizado', valor: formatarMoeda(faturamentoRealizado) },
                      { label: '% realizado da meta', valor: `${formatarNumeroBR(percentualFaturamentoItem, 1)}%` },
                      { label: 'Faltam faturar', valor: faltaFaturamentoItem > 0 ? formatarMoeda(faltaFaturamentoItem) : 'Meta batida' },
                    ],
                    `${formatarMoeda(faturamentoRealizado)} ÷ ${formatarMoeda(faturamentoMeta)} = ${formatarNumeroBR(percentualFaturamentoItem, 1)}% da meta`
                  );

                  const abrirDetalheAtividadeRanking = () => abrirModalValExp(
                    `Atividade ${obterNomeExibicaoConsultor(c)}`,
                    `${formatarNumeroBR(percentualAtividadeItem, 1)}%`,
                    'Atividade calculada com base na meta percentual, na base ativa da estrutura e na distribuição individual pelo peso do consultor quando aplicável.',
                    [
                      { label: 'Base ativa da estrutura', valor: formatarNumeroBR(baseAtivaDetalhe, 0) },
                      { label: 'Meta atividade da estrutura', valor: `${formatarNumeroBR(metaAtividadeDetalhePercentual, 1)}%` },
                      { label: 'Meta em revendedores da estrutura', valor: formatarNumeroBR(qtdMetaAtividadeDetalhe, 0) },
                      { label: c.tipo_fallback_estrutura ? 'Meta da equipe' : 'Peso do consultor', valor: c.tipo_fallback_estrutura ? '100,00%' : `${formatarNumeroBR(pesoConsultor, 2)}%` },
                      { label: 'Meta individual em revendedores', valor: formatarNumeroBR(metaAtividadeItem, 0) },
                      { label: 'Revendedores ativados', valor: formatarNumeroBR(atividadeRealizadaItem, 0) },
                      { label: '% atividade realizado', valor: `${formatarNumeroBR(percentualAtividadeItem, 1)}%` },
                      { label: '% realizado da meta', valor: `${formatarNumeroBR(percentualMetaAtividadeAtingido, 1)}%` },
                      { label: 'Faltam ativar', valor: faltamAtivarItem > 0 ? `${formatarNumeroBR(faltamAtivarItem, 0)} revendedores` : 'Meta batida' },
                    ],
                    c.tipo_fallback_estrutura
                      ? `${formatarNumeroBR(baseAtivaDetalhe, 0)} × ${formatarNumeroBR(metaAtividadeDetalhePercentual, 1)}% = ${formatarNumeroBR(qtdMetaAtividadeDetalhe, 0)} revendedores necessários`
                      : `Meta individual: ${formatarNumeroBR(qtdMetaAtividadeDetalhe, 0)} × ${formatarNumeroBR(pesoConsultor, 2)}% = ${formatarNumeroBR(metaAtividadeItem, 0)} revendedores`
                  );

                  const abrirDetalheMakeRanking = () => abrirModalValExp(
                    `MAKE ${obterNomeExibicaoConsultor(c)}`,
                    `${formatarNumeroBR(percentualMakeItem, 1)}%`,
                    'MAKE calculado sobre a atividade do próprio consultor: revendedores ativados pelo consultor × meta percentual de MAKE.',
                    [
                      { label: 'Revendedores ativados pelo consultor', valor: formatarNumeroBR(atividadeRealizadaItem, 0) },
                      { label: 'Meta MAKE (%)', valor: `${formatarNumeroBR(percentualMetaMakeItem, 1)}%` },
                      { label: 'Meta individual com MAKE', valor: formatarNumeroBR(metaMakeItem, 0) },
                      { label: 'Revendedores com MAKE', valor: formatarNumeroBR(makeRealizadoItem, 0) },
                      { label: '% MAKE realizado', valor: `${formatarNumeroBR(percentualMakeItem, 1)}%` },
                      { label: '% realizado da meta', valor: `${formatarNumeroBR(percentualMetaMakeAtingido, 1)}%` },
                      { label: 'Faltam incluir MAKE', valor: faltamMakeItem > 0 ? `${formatarNumeroBR(faltamMakeItem, 0)} revendedores` : 'Meta batida' },
                    ],
                    `${formatarNumeroBR(atividadeRealizadaItem, 0)} ativados × ${formatarNumeroBR(percentualMetaMakeItem, 1)}% = ${formatarNumeroBR(metaMakeItem, 0)} revendedores necessários com MAKE`
                  );

                  const abrirDetalheCabeloRanking = () => abrirModalValExp(
                    `CABELO ${obterNomeExibicaoConsultor(c)}`,
                    `${formatarNumeroBR(percentualCabeloItem, 1)}%`,
                    'CABELO calculado sobre a atividade do próprio consultor: revendedores ativados pelo consultor × meta percentual de CABELO.',
                    [
                      { label: 'Revendedores ativados pelo consultor', valor: formatarNumeroBR(atividadeRealizadaItem, 0) },
                      { label: 'Meta CABELO (%)', valor: `${formatarNumeroBR(percentualMetaCabeloItem, 1)}%` },
                      { label: 'Meta individual com CABELO', valor: formatarNumeroBR(metaCabeloItem, 0) },
                      { label: 'Revendedores com CABELO', valor: formatarNumeroBR(cabeloRealizadoItem, 0) },
                      { label: '% CABELO realizado', valor: `${formatarNumeroBR(percentualCabeloItem, 1)}%` },
                      { label: '% realizado da meta', valor: `${formatarNumeroBR(percentualMetaCabeloAtingido, 1)}%` },
                      { label: 'Faltam incluir CABELO', valor: faltamCabeloItem > 0 ? `${formatarNumeroBR(faltamCabeloItem, 0)} revendedores` : 'Meta batida' },
                    ],
                    `${formatarNumeroBR(atividadeRealizadaItem, 0)} ativados × ${formatarNumeroBR(percentualMetaCabeloItem, 1)}% = ${formatarNumeroBR(metaCabeloItem, 0)} revendedores necessários com CABELO`
                  );

                  const abrirDetalheRpaRanking = () => abrirModalValExp(
                    `RPA ${obterNomeExibicaoConsultor(c)}`,
                    formatarMoeda(rpaRealizadoItem),
                    'RPA calculado pelo faturamento realizado dividido pelos revendedores ativados.',
                    [
                      { label: 'Meta RPA', valor: formatarMoeda(metaRpaItem) },
                      { label: 'RPA realizado', valor: formatarMoeda(rpaRealizadoItem) },
                      { label: '% realizado da meta', valor: `${formatarNumeroBR(percentualMetaRpaAtingido, 1)}%` },
                      { label: 'Faturamento realizado', valor: formatarMoeda(faturamentoRealizado) },
                      { label: 'Revendedores ativados', valor: formatarNumeroBR(atividadeRealizadaItem, 0) },
                      { label: 'Faturamento necessário', valor: formatarMoeda(faturamentoNecessarioRpaItem) },
                      { label: 'Faltam faturar', valor: faltamFaturarRpaItem > 0 ? formatarMoeda(faltamFaturarRpaItem) : 'Meta batida' },
                    ],
                    `${formatarMoeda(faturamentoRealizado)} ÷ ${formatarNumeroBR(atividadeRealizadaItem, 0)} = ${formatarMoeda(rpaRealizadoItem)} | Meta: ${formatarNumeroBR(atividadeRealizadaItem, 0)} × ${formatarMoeda(metaRpaItem)} = ${formatarMoeda(faturamentoNecessarioRpaItem)}`
                  );

                  const abrirDetalheTicketRanking = () => abrirModalValExp(
                    `Ticket Médio ${obterNomeExibicaoConsultor(c)}`,
                    formatarMoeda(ticketRealizadoItem),
                    'Ticket médio calculado pelo faturamento realizado dividido pela quantidade de pedidos.',
                    [
                      { label: 'Meta ticket médio', valor: formatarMoeda(metaTicketItem) },
                      { label: 'Ticket médio realizado', valor: formatarMoeda(ticketRealizadoItem) },
                      { label: '% realizado da meta', valor: `${formatarNumeroBR(percentualMetaTicketAtingido, 1)}%` },
                      { label: 'Faturamento realizado', valor: formatarMoeda(faturamentoRealizado) },
                      { label: 'Quantidade de pedidos', valor: formatarNumeroBR(Number(c.quantidade_pedidos || 0), 0) },
                      { label: 'Faturamento necessário', valor: formatarMoeda(faturamentoNecessarioTicketItem) },
                      { label: 'Faltam faturar', valor: faltamFaturarTicketItem > 0 ? formatarMoeda(faltamFaturarTicketItem) : 'Meta batida' },
                    ],
                    `${formatarMoeda(faturamentoRealizado)} ÷ ${formatarNumeroBR(Number(c.quantidade_pedidos || 0), 0)} = ${formatarMoeda(ticketRealizadoItem)} | Meta: ${formatarNumeroBR(Number(c.quantidade_pedidos || 0), 0)} × ${formatarMoeda(metaTicketItem)} = ${formatarMoeda(faturamentoNecessarioTicketItem)}`
                  );

                  const abrirDetalheUpaRanking = () => abrirModalValExp(
                    `UPA ${obterNomeExibicaoConsultor(c)}`,
                    formatarNumeroBR(upaRealizadoItem, 1),
                    'UPA calculado pelo total de itens vendidos dividido pelos revendedores ativados.',
                    [
                      { label: 'Meta UPA', valor: formatarNumeroBR(metaUpaItem, 1) },
                      { label: 'UPA realizado', valor: formatarNumeroBR(upaRealizadoItem, 1) },
                      { label: '% realizado da meta', valor: `${formatarNumeroBR(percentualMetaUpaAtingido, 1)}%` },
                      { label: 'Itens vendidos', valor: formatarNumeroBR(Number(c.total_itens || 0), 0) },
                      { label: 'Revendedores ativados', valor: formatarNumeroBR(atividadeRealizadaItem, 0) },
                      { label: 'Itens necessários', valor: formatarNumeroBR(itensNecessariosUpaItem, 0) },
                      { label: 'Faltam itens', valor: faltamItensUpaItem > 0 ? formatarNumeroBR(faltamItensUpaItem, 0) : 'Meta batida' },
                    ],
                    `${formatarNumeroBR(Number(c.total_itens || 0), 0)} ÷ ${formatarNumeroBR(atividadeRealizadaItem, 0)} = ${formatarNumeroBR(upaRealizadoItem, 1)} | Meta: ${formatarNumeroBR(atividadeRealizadaItem, 0)} × ${formatarNumeroBR(metaUpaItem, 1)} = ${formatarNumeroBR(itensNecessariosUpaItem, 0)} itens`
                  );

                  return (
                    <div key={`${c.id_colaborador}-${idx}`} className="border border-gray-100 rounded-xl p-4 bg-[#fcfbf7] min-w-0">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-7 h-7 rounded-full bg-[#048187] text-white text-xs font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-gray-700 truncate">{obterNomeExibicaoConsultor(c)}</h3>
                            <p className="text-xs text-gray-400 truncate">
                              {c.tipo_fallback_estrutura
                                ? `Resultado consolidado da equipe • Pedidos: ${c.quantidade_pedidos || 0}`
                                : `ID: ${c.id_colaborador} • Peso: ${Number(c.peso_meta || 0).toFixed(2)}% • Pedidos: ${c.quantidade_pedidos}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <p className="text-lg font-bold text-[#048187] whitespace-nowrap">{Number(c.percentual || 0).toFixed(2)}%</p>
                          {!c.tipo_fallback_estrutura && trend.val > 0 && (trend.up ? <ArrowUpRight size={18} className="text-green-500" /> : <ArrowDownRight size={18} className="text-red-500" />)}
                        </div>
                      </div>

                      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
                        <CardIndicadorRanking
                          titulo="Faturamento"
                          meta={formatarAbrev(faturamentoMeta)}
                          realizado={formatarAbrev(faturamentoRealizado)}
                          percentualMeta={percentualFaturamentoItem}
                          corRealizado="text-[#048187]"
                          corBarra="#048187"
                          onClickExpandir={abrirDetalheFaturamentoRanking}
                        />
                        <CardIndicadorRanking
                          titulo="Atividade"
                          meta={`${formatarNumeroBR(metaAtividadeItem, 0)} rev. • ${formatarNumeroBR(percentualMetaAtividadeItem, 1)}%`}
                          realizado={`${formatarNumeroBR(atividadeRealizadaItem, 0)} rev. • ${formatarNumeroBR(percentualAtividadeItem, 1)}%`}
                          percentualMeta={percentualMetaAtividadeAtingido}
                          corRealizado="text-[#F97316]"
                          corBarra="#F97316"
                          onClickExpandir={abrirDetalheAtividadeRanking}
                        />
                        <CardIndicadorRanking
                          titulo="MAKE"
                          meta={`${formatarNumeroBR(metaMakeItem, 0)} rev. • ${formatarNumeroBR(percentualMetaMakeItem, 1)}%`}
                          realizado={`${formatarNumeroBR(makeRealizadoItem, 0)} rev. • ${formatarNumeroBR(percentualMakeItem, 1)}%`}
                          percentualMeta={percentualMetaMakeAtingido}
                          corRealizado="text-[#048187]"
                          corBarra="#048187"
                          onClickExpandir={abrirDetalheMakeRanking}
                        />
                        <CardIndicadorRanking
                          titulo="Cabelo"
                          meta={`${formatarNumeroBR(metaCabeloItem, 0)} rev. • ${formatarNumeroBR(percentualMetaCabeloItem, 1)}%`}
                          realizado={`${formatarNumeroBR(cabeloRealizadoItem, 0)} rev. • ${formatarNumeroBR(percentualCabeloItem, 1)}%`}
                          percentualMeta={percentualMetaCabeloAtingido}
                          corRealizado="text-[#712231]"
                          corBarra="#712231"
                          onClickExpandir={abrirDetalheCabeloRanking}
                        />
                        <CardIndicadorRanking
                          titulo="RPA"
                          meta={formatarMoeda(metaRpaItem)}
                          realizado={formatarMoeda(rpaRealizadoItem)}
                          percentualMeta={percentualMetaRpaAtingido}
                          corRealizado="text-gray-700"
                          corBarra="#257B9C"
                          onClickExpandir={abrirDetalheRpaRanking}
                        />
                        <CardIndicadorRanking
                          titulo="Ticket Médio"
                          meta={formatarMoeda(metaTicketItem)}
                          realizado={formatarMoeda(ticketRealizadoItem)}
                          percentualMeta={percentualMetaTicketAtingido}
                          corRealizado="text-gray-700"
                          corBarra="#257B9C"
                          onClickExpandir={abrirDetalheTicketRanking}
                        />
                        <CardIndicadorRanking
                          titulo="UPA"
                          meta={formatarNumeroBR(metaUpaItem, 1)}
                          realizado={formatarNumeroBR(upaRealizadoItem, 1)}
                          percentualMeta={percentualMetaUpaAtingido}
                          corRealizado="text-gray-700"
                          corBarra="#257B9C"
                          onClickExpandir={abrirDetalheUpaRanking}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
              <div className="flex items-start gap-2 mb-4"><AlertCircle size={22} className="text-[#F97316] shrink-0" /><div><h2 className="text-lg font-bold text-gray-700">Vendas fora da estrutura</h2></div></div>
              {vFora.length > 0 ? (
                <div className="overflow-x-auto"><table className="w-full text-sm min-w-[820px]"><thead><tr className="text-left text-gray-500 border-b border-gray-100"><th className="py-3 px-2">Consultor</th><th className="py-3 px-2">ID</th><th className="py-3 px-2">Estrutura onde vendeu</th><th className="py-3 px-2 text-right">Pedidos</th><th className="py-3 px-2 text-right">Valor</th></tr></thead><tbody>
                  {vFora.map((i, idx) => (<tr key={`${i.cod_usuario_finalizacao}-${idx}`} className="border-b border-gray-50"><td className="py-4 px-2 font-medium text-gray-700">{i.nome_consultor}</td><td className="py-4 px-2 text-gray-500">{i.cod_usuario_finalizacao}</td><td className="py-4 px-2 text-gray-600">{i.estrutura}</td><td className="py-4 px-2 text-right text-gray-600">{i.quantidade_pedidos}</td><td className="py-4 px-2 text-right font-bold text-[#F97316]">{formatarMoeda(i.valor_praticado)}</td></tr>))}
                </tbody></table></div>
              ) : (<div className="bg-green-50 border border-green-100 rounded-xl p-5 text-green-700 font-bold text-sm flex items-center gap-2"><CheckCircle size={18} /> Nenhuma venda fora da estrutura.</div>)}
            </div>
          </>
        )}
      </div>
    );
  };

  const renderTelaRanking = () => {
    if (carregandoMetas && !dadosMetas) return <DashboardSkeletons />;
    if (!dadosMetas || !dadosMetas.ranking_consultores || dadosMetas.ranking_consultores.length === 0) return (<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8"><p className="text-gray-400">Nenhum dado encontrado para montar o Ranking.</p></div>);

    const estData = (dadosMetas.estruturas || []).map(e => {
      const realizado = Number(e.realizado || 0);
      const receita = Number(e.receita || e.meta || e.meta_faturamento || 0);
      const percentualFaturamento = e.percentual !== undefined && e.percentual !== null
        ? Number(e.percentual || 0)
        : (receita > 0 ? (realizado / receita) * 100 : 0);

      return {
        id_colaborador: e.estrutura,
        nome: e.estrutura,
        estrutura: `${e.quantidade_pedidos || 0} pedidos`,
        receita,
        realizado,
        percentual: percentualFaturamento,
        percentual_atividade: e.percentual_atividade || 0,
        percentual_make: e.percentual_make || 0,
        percentual_cabelo: e.percentual_cabelo || 0,
        rpa: e.atividade_realizada > 0 ? realizado / e.atividade_realizada : 0,
        tkt_medio: e.quantidade_pedidos > 0 ? realizado / e.quantidade_pedidos : 0,
        upa: e.atividade_realizada > 0 ? e.total_itens / e.atividade_realizada : 0
      };
    });

    const cData = visaoRanking === 'consultores' ? dadosMetas.ranking_consultores : estData;
    const topPercentualFaturamento = [...cData].sort((a,b) => Number(b.percentual || 0) - Number(a.percentual || 0));
    const podio = [topPercentualFaturamento[1], topPercentualFaturamento[0], topPercentualFaturamento[2]];
    const formatarPercentualFaturamento = (item) => `${Number(item?.percentual || 0).toFixed(1)}%`;
    const formatarRealizadoPodio = (item) => formatarAbrev(item?.realizado || 0);

    const formatarNomePodio = (nome) => {
      if (!nome) return '';
      if (visaoRanking === 'estruturas' && nome.includes('-')) return nome.split('-')[1].trim();
      return nome.split(' ')[0];
    };
    
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-full bg-yellow-500 text-white flex items-center justify-center shrink-0"><Trophy size={25}/></div>
            <div className="min-w-0"><h1 className="text-xl sm:text-2xl font-bold text-gray-700 truncate">Ranking e Gamificação</h1><p className="text-sm text-gray-400 truncate">Top 5 de alta performance da equipe</p></div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <FiltroRapidoNucleos filtrosAtivos={filtrosAtivos} onSelecionar={handleFiltroRapidoNucleo} />
            <div className="flex bg-gray-100 p-1 rounded-lg shrink-0">
              <button onClick={() => setVisaoRanking('consultores')} className={`p-2 px-3 sm:px-4 rounded-md transition-colors ${visaoRanking === 'consultores' ? 'bg-[#048187] text-white shadow' : 'text-gray-500 hover:text-gray-700'}`} title="Visão Consultores"><User size={18} /></button>
              <button onClick={() => setVisaoRanking('estruturas')} className={`p-2 px-3 sm:px-4 rounded-md transition-colors ${visaoRanking === 'estruturas' ? 'bg-[#048187] text-white shadow' : 'text-gray-500 hover:text-gray-700'}`} title="Visão Estruturas"><Users size={18} /></button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-end min-h-[320px]">
          <h2 className="text-lg font-bold text-gray-700 mb-8 uppercase tracking-widest text-center">Top 3 % de Faturamento ({visaoRanking === 'consultores' ? 'Consultores' : 'Estruturas'})</h2>
          <div className="flex items-end justify-center w-full max-w-2xl gap-2 sm:gap-4 h-48">
            {podio[0] && (
              <div className="flex flex-col items-center w-1/3 z-10 hover:-translate-y-2 transition-transform cursor-default group">
                <p className="text-xs font-bold text-gray-600 truncate w-full text-center px-1">{formatarNomePodio(obterNomeExibicaoConsultor(podio[0]))}</p>
                <p className="text-sm font-black text-gray-600 mb-0.5 truncate w-full text-center">{formatarPercentualFaturamento(podio[0])}</p>
                <p className="text-[10px] text-gray-400 mb-2 truncate w-full text-center">{formatarRealizadoPodio(podio[0])}</p>
                <div className="w-full h-32 bg-gradient-to-t from-gray-300 to-gray-200 rounded-t-lg flex flex-col items-center justify-start pt-2 border-t-4 border-gray-400 shadow-inner"><span className="text-xl font-black text-white drop-shadow-md">2º</span></div>
              </div>
            )}
            {podio[1] && (
              <div className="flex flex-col items-center w-1/3 z-20 hover:-translate-y-2 transition-transform cursor-default group">
                <Trophy size={24} className="text-yellow-500 mb-1 animate-bounce" />
                <p className="text-sm font-black text-[#048187] truncate w-full text-center px-1">{formatarNomePodio(obterNomeExibicaoConsultor(podio[1]))}</p>
                <p className="text-base font-black text-yellow-600 mb-0.5 truncate w-full text-center">{formatarPercentualFaturamento(podio[1])}</p>
                <p className="text-[11px] text-gray-400 mb-2 truncate w-full text-center">{formatarRealizadoPodio(podio[1])}</p>
                <div className="w-full h-40 bg-gradient-to-t from-yellow-300 to-yellow-100 rounded-t-lg flex flex-col items-center justify-start pt-2 border-t-4 border-yellow-500 shadow-2xl relative"><span className="text-3xl font-black text-white drop-shadow-md">1º</span></div>
              </div>
            )}
            {podio[2] && (
              <div className="flex flex-col items-center w-1/3 z-0 hover:-translate-y-2 transition-transform cursor-default group">
                <p className="text-xs font-bold text-gray-600 truncate w-full text-center px-1">{formatarNomePodio(obterNomeExibicaoConsultor(podio[2]))}</p>
                <p className="text-sm font-black text-orange-600 mb-0.5 truncate w-full text-center">{formatarPercentualFaturamento(podio[2])}</p>
                <p className="text-[10px] text-gray-400 mb-2 truncate w-full text-center">{formatarRealizadoPodio(podio[2])}</p>
                <div className="w-full h-24 bg-gradient-to-t from-orange-300 to-orange-200 rounded-t-lg flex flex-col items-center justify-start pt-2 border-t-4 border-orange-400 shadow-inner"><span className="text-xl font-black text-white drop-shadow-md">3º</span></div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-6">
          <CardTop5 titulo="Maior % Faturamento" dados={cData} propValor="percentual" formatter={(v)=>`${Number(v || 0).toFixed(1)}%`} corValor="#048187" propSubValor="realizado" subFormatter={formatarAbrev} />
          <CardTop5 titulo="Melhor % Atividade" dados={cData} propValor="percentual_atividade" formatter={(v)=>`${Number(v).toFixed(1)}%`} corValor="#F97316" />
          <CardTop5 titulo="Melhor % MAKE" dados={cData} propValor="percentual_make" formatter={(v)=>`${Number(v).toFixed(1)}%`} corValor="#048187" />
          <CardTop5 titulo="Melhor % CABELO" dados={cData} propValor="percentual_cabelo" formatter={(v)=>`${Number(v).toFixed(1)}%`} corValor="#712231" />
          <CardTop5 titulo="Maior RPA" dados={cData} propValor="rpa" formatter={formatarMoeda} corValor="#15956B" />
          <CardTop5 titulo="Maior Ticket Médio" dados={cData} propValor="tkt_medio" formatter={formatarMoeda} corValor="#56549E" />
          <CardTop5 titulo="Maior UPA" dados={cData} propValor="upa" formatter={(v)=>Number(v).toFixed(1)} corValor="#257B9C" />
        </div>
      </div>
    );
  };

  const renderTelaComparativo = () => {
    if (loadComp && !dadosComp) return <DashboardSkeletons />;
    if (!dadosComp) return (<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8"><p className="text-gray-400">Clique em "Atualizar" para comparar os núcleos.</p></div>);

    const n1 = dadosComp.n1; const n2 = dadosComp.n2;

    let chartData = [];
    const v1 = n1.dash.vendas_por_dia || []; const v2 = n2.dash.vendas_por_dia || [];
    const dates = Array.from(new Set([...v1.map(d=>d['Data Captação']), ...v2.map(d=>d['Data Captação'])]));
    dates.sort((a,b) => { const [da,ma,ya] = a.split('/'); const [db,mb,yb] = b.split('/'); return new Date(ya,ma-1,da) - new Date(yb,mb-1,db); });
    chartData = dates.map(d => ({ data: d, N1: v1.find(x=>x['Data Captação']===d)?.ValorPraticado || 0, N2: v2.find(x=>x['Data Captação']===d)?.ValorPraticado || 0 }));

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-full bg-[#048187] text-white flex items-center justify-center shrink-0"><Scale size={25}/></div>
            <div className="min-w-0"><h1 className="text-xl sm:text-2xl font-bold text-gray-700 truncate">Comparativo de Núcleos</h1><p className="text-sm text-gray-400 truncate">Análise de performance N1 vs N2</p></div>
          </div>
          <button onClick={() => carregarComparativo(filtrosAtivos)} className="bg-[#048187] text-white font-bold px-4 py-3 rounded-lg flex items-center gap-2 shrink-0"><RefreshCcw size={16}/> Atualizar</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 xl:gap-6">
          <CardVersus titulo="Faturamento Geral" formataVal={formatarAbrev} val1={n1.metas.realizado_total_geral} desc1={`${calcPerc(n1.metas.realizado_total_geral, n1.metas.meta_total_geral).toFixed(1)}% da meta`} val2={n2.metas.realizado_total_geral} desc2={`${calcPerc(n2.metas.realizado_total_geral, n2.metas.meta_total_geral).toFixed(1)}% da meta`} />
          <CardVersus titulo="Realizado Diário" formataVal={formatarAbrev} val1={n1.dash.realizado_diario} desc1={`${calcPerc(n1.dash.realizado_diario, n1.dash.meta_diaria).toFixed(1)}% da meta`} val2={n2.dash.realizado_diario} desc2={`${calcPerc(n2.dash.realizado_diario, n2.dash.meta_diaria).toFixed(1)}% da meta`} />
          <CardVersus titulo="Atividade" isPerc formataVal={(v)=>v} val1={n1.metas.percentual_atividade_total_geral} desc1={`${n1.metas.atividade_total_geral} ativados`} val2={n2.metas.percentual_atividade_total_geral} desc2={`${n2.metas.atividade_total_geral} ativados`} />
          <CardVersus titulo="Penetração MAKE" isPerc formataVal={(v)=>v} val1={n1.metas.percentual_make_total_geral} desc1={`${n1.metas.make_total_geral} ativados`} val2={n2.metas.percentual_make_total_geral} desc2={`${n2.metas.make_total_geral} ativados`} />
          <CardVersus titulo="Penetração CABELO" isPerc formataVal={(v)=>v} val1={n1.metas.percentual_cabelo_total_geral} desc1={`${n1.metas.cabelo_total_geral} ativados`} val2={n2.metas.percentual_cabelo_total_geral} desc2={`${n2.metas.cabelo_total_geral} ativados`} />
          <CardVersus titulo="RPA" formataVal={formatarMoeda} val1={n1.metas.meta_rpa_geral ? (n1.metas.realizado_total_geral / n1.metas.atividade_total_geral) : 0} desc1={`Meta: ${formatarMoeda(n1.metas.meta_rpa_geral)}`} val2={n2.metas.meta_rpa_geral ? (n2.metas.realizado_total_geral / n2.metas.atividade_total_geral) : 0} desc2={`Meta: ${formatarMoeda(n2.metas.meta_rpa_geral)}`} />
          <CardVersus titulo="Ticket Médio" formataVal={formatarMoeda} val1={n1.metas.meta_tkt_medio_geral ? (n1.metas.realizado_total_geral / n1.dash.total_pedidos) : 0} desc1={`Meta: ${formatarMoeda(n1.metas.meta_tkt_medio_geral)}`} val2={n2.metas.meta_tkt_medio_geral ? (n2.metas.realizado_total_geral / n2.dash.total_pedidos) : 0} desc2={`Meta: ${formatarMoeda(n2.metas.meta_tkt_medio_geral)}`} />
          <CardVersus titulo="UPA" formataVal={(v)=>v.toFixed(1)} val1={n1.metas.meta_upa_geral ? (n1.dash.total_itens / n1.metas.atividade_total_geral) : 0} desc1={`Meta: ${Number(n1.metas.meta_upa_geral||0).toFixed(1)}`} val2={n2.metas.meta_upa_geral ? (n2.dash.total_itens / n2.metas.atividade_total_geral) : 0} desc2={`Meta: ${Number(n2.metas.meta_upa_geral||0).toFixed(1)}`} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 min-w-0">
          <h3 className="text-base font-bold text-gray-600 text-center mb-3 border-b border-gray-100 pb-2 truncate">Vendas Diárias (N1 vs N2)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="data" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={formatarTickMoeda} width={48} />
                <Tooltip formatter={(value) => formatarMoeda(value)} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" name="NÚCLEO 1" dataKey="N1" stroke="#048187" fill="#048187" fillOpacity={0.1} strokeWidth={3} />
                <Area type="monotone" name="NÚCLEO 2" dataKey="N2" stroke="#F97316" fill="#F97316" fillOpacity={0.1} strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };


  const renderTelaRevendedores = () => {
    const lista = dadosRevendedores?.revendedores || [];
    const termo = buscaRevendedores.toLowerCase().trim();

    const passaFiltroLista = (campoFiltro, valor) => {
      const selecionados = filtrosRevendedores[campoFiltro] || [];
      if (!selecionados.length) return true;
      return selecionados.includes(String(valor || '').trim());
    };

    const ehInadimplente = (valor) => String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('sim');
    const papelTratado = (valor) => String(valor || '').trim() || 'Não informado';
    const atividadeTratada = (valor) => String(valor || '').trim() || 'Não informado';

    const listaFiltrada = lista.filter((item) => {
      const passaBusca = !termo || [item.cod_revendedor, item.nome_revendedor, item.nome_estrutura, item.cidade, item.bairro, item.atividade, item.papel]
        .some((valor) => String(valor || '').toLowerCase().includes(termo));
      return passaBusca
        && passaFiltroLista('estruturas', item.nome_estrutura)
        && passaFiltroLista('cidades', item.cidade)
        && passaFiltroLista('atividades', item.atividade)
        && passaFiltroLista('papeis', item.papel)
        && passaFiltroLista('inadimplentes', item.inadimplente);
    });

    const somaCampo = (campo) => listaFiltrada.reduce((acc, item) => acc + Number(item?.[campo] || 0), 0);
    const totalFiltrado = listaFiltrada.length;
    const estruturasFiltradas = new Set(listaFiltrada.map((i) => String(i.nome_estrutura || '').trim()).filter(Boolean)).size;
    const cidadesFiltradas = new Set(listaFiltrada.map((i) => String(i.cidade || '').trim()).filter(Boolean)).size;
    const inadimplentesFiltrados = listaFiltrada.filter((i) => ehInadimplente(i.inadimplente)).length;
    const ativosFiltrados = listaFiltrada.filter((i) => String(i.atividade || '').trim().toUpperCase().startsWith('A')).length;
    const receitaFiltrada = somaCampo('vlr_receita_liquida');
    const creditoFiltrado = somaCampo('credito_disponivel');

    const papelMapa = {};
    listaFiltrada.forEach((item) => {
      const chave = papelTratado(item.papel);
      if (!papelMapa[chave]) papelMapa[chave] = { name: chave, adimplente: 0, inadimplente: 0, total: 0 };
      if (ehInadimplente(item.inadimplente)) papelMapa[chave].inadimplente += 1;
      else papelMapa[chave].adimplente += 1;
      papelMapa[chave].total += 1;
    });
    const papelData = Object.values(papelMapa).sort((a, b) => b.total - a.total).slice(0, 10);

    const atividadeMapa = {};
    listaFiltrada.forEach((item) => {
      const chave = atividadeTratada(item.atividade);
      atividadeMapa[chave] = (atividadeMapa[chave] || 0) + 1;
    });
    const ordemAtividade = ['I', 'R', 'A0', 'A1', 'A2', 'A3', 'I4', 'I5', 'I6', 'C7', 'C8', 'C9', 'C10', 'C11', 'C12', 'C13', 'C14', 'C15'];
    const atividadeData = Object.entries(atividadeMapa)
      .map(([name, value]) => ({ name, value, ordem: ordemAtividade.indexOf(String(name).toUpperCase()) >= 0 ? ordemAtividade.indexOf(String(name).toUpperCase()) : 999 }))
      .sort((a, b) => a.ordem - b.ordem || String(a.name).localeCompare(String(b.name)))
      .slice(0, 18);

    const receitaPapelMapa = {};
    listaFiltrada.forEach((item) => {
      const chave = papelTratado(item.papel);
      const valorPedido = Number(item.receita_praticada_pedidos || 0);
      const valorFallback = Number(item.vlr_receita_liquida || 0);
      receitaPapelMapa[chave] = (receitaPapelMapa[chave] || 0) + (valorPedido > 0 ? valorPedido : valorFallback);
    });
    const receitaPorPapelData = Object.entries(receitaPapelMapa)
      .map(([name, value]) => ({ name, value }))
      .filter((item) => Number(item.value || 0) > 0)
      .sort((a, b) => b.value - a.value);

    const corAtividade = (nome) => {
      const n = String(nome || '').toUpperCase();
      if (n === 'I' || n === 'R') return 'bg-[#c9a27f] text-[#3f2d20]';
      if (n.startsWith('A')) return 'bg-[#739e6b] text-white';
      if (n.startsWith('I')) return 'bg-[#f5e35c] text-[#554d00]';
      if (n.startsWith('C7') || n.startsWith('C8') || n.startsWith('C9')) return 'bg-[#f6b7b7] text-[#5b1e1e]';
      if (n.startsWith('C')) return 'bg-[#bd4a4a] text-white';
      return 'bg-gray-100 text-gray-700';
    };

    const CardRevendedor = ({ titulo, valor, detalhe }) => (
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 min-w-0">
        <h3 className="text-[10px] font-bold uppercase text-gray-500 tracking-wide truncate mb-2">{titulo}</h3>
        <p className="text-2xl font-black text-[#048187] tracking-tighter truncate">{valor}</p>
        {detalhe && <p className="text-[10px] font-bold text-gray-400 uppercase mt-3 truncate">{detalhe}</p>}
      </div>
    );

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-full bg-[#e6f6f7] text-[#048187] flex items-center justify-center shrink-0"><UserCircle size={26} /></div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-700 truncate">Revendedores</h1>
              <p className="text-sm text-gray-400">Visão adaptada da base Detalhe Revendedor.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={carregarRevendedores} className="bg-[#048187] text-white font-bold px-4 py-3 rounded-lg hover:bg-[#036b70] inline-flex items-center justify-center gap-2"><RefreshCcw size={17} />Atualizar</button>
          </div>
        </div>

        {erroRevendedores && (<div className="rounded-xl p-4 font-bold text-sm bg-red-50 text-red-600">{erroRevendedores}</div>)}

        {carregandoRevendedores ? (
          <DashboardSkeletons />
        ) : !dadosRevendedores ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-gray-400 font-medium">Nenhuma base de revendedores carregada ainda. Envie a planilha na aba Base.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <CardRevendedor titulo="Receita Praticada" valor={formatarAbrev(receitaFiltrada)} detalhe={`Selecionados: ${Number(totalFiltrado || 0).toLocaleString('pt-BR')}`} />
              <CardRevendedor titulo="RE Ativos" valor={Number(ativosFiltrados || 0).toLocaleString('pt-BR')} detalhe={`${calcPerc(ativosFiltrados, totalFiltrado).toFixed(1)}% da base`} />
              <CardRevendedor titulo="Crédito Disponível" valor={formatarAbrev(creditoFiltrado)} />
              <CardRevendedor titulo="Inadimplentes" valor={Number(inadimplentesFiltrados || 0).toLocaleString('pt-BR')} />
              <CardRevendedor titulo="Cidades" valor={Number(cidadesFiltradas || 0).toLocaleString('pt-BR')} detalhe={`Registros: ${Number(totalFiltrado || 0).toLocaleString('pt-BR')}`} />
              <CardRevendedor titulo="Estruturas" valor={Number(estruturasFiltradas || 0).toLocaleString('pt-BR')} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 xl:gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 min-w-0">
                <h3 className="text-sm font-bold text-gray-600 text-center mb-3">Revendedores por papel</h3>
                <div className="h-[270px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={papelData.slice(0, 8)} layout="vertical" margin={{ top: 4, right: 34, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={92} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip formatter={(value, name) => [Number(value || 0).toLocaleString('pt-BR'), name === 'adimplente' ? 'Adimplente' : 'Inadimplente']} />
                      <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: '11px' }} formatter={(value) => value === 'adimplente' ? 'Adimplente' : 'Inadimplente'} />
                      <Bar dataKey="adimplente" stackId="a" fill="#048187" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="inadimplente" stackId="a" fill="#712231" radius={[0, 7, 7, 0]}>
                        <LabelList dataKey="total" position="right" fontSize={11} fill="#64748b" formatter={(v) => Number(v || 0).toLocaleString('pt-BR')} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 min-w-0">
                <h3 className="text-sm font-bold text-gray-600 text-center mb-3">Receita por papel</h3>
                <div className="h-[270px]">
                  {receitaPorPapelData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={receitaPorPapelData.slice(0, 8)} layout="vertical" margin={{ top: 12, right: 52, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={92} tick={{ fontSize: 11, fill: '#64748b' }} />
                        <Tooltip formatter={(value) => formatarMoeda(value)} />
                        <Bar dataKey="value" fill="#048187" radius={[0, 7, 7, 0]}>
                          <LabelList dataKey="value" position="right" fontSize={11} fill="#64748b" formatter={(v) => formatarAbrev(v)} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (<div className="h-full flex items-center justify-center text-gray-400 text-sm">Nenhuma receita encontrada.</div>)}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 min-w-0">
                <h3 className="text-sm font-bold text-gray-600 text-center mb-3">Revendedores por atividade</h3>
                <div className="mx-auto max-w-[210px] border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                  <div className="grid grid-cols-[1fr_1.1fr] bg-[#048187] text-white text-xs font-black text-center">
                    <div className="py-2 border-r border-white/60">Atividade</div>
                    <div className="py-2">Qtd.</div>
                  </div>
                  <div className="max-h-[260px] overflow-y-auto">
                    {atividadeData.map((item) => (
                      <div key={item.name} className={`grid grid-cols-[1fr_1.1fr] text-sm font-bold text-center ${corAtividade(item.name)}`}>
                        <div className="py-1.5 border-r border-white/60">{item.name}</div>
                        <div className="py-1.5">{Number(item.value || 0).toLocaleString('pt-BR')}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-lg font-bold text-gray-700">Tabela de Revendedores</h2>
                    <p className="text-sm text-gray-400">Mostrando {Number(listaFiltrada.slice(0, 300).length).toLocaleString('pt-BR')} de {Number(totalFiltrado).toLocaleString('pt-BR')} registros filtrados.</p>
                  </div>
                  <div className="relative w-full sm:w-80">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={buscaRevendedores} onChange={(e) => setBuscaRevendedores(e.target.value)} placeholder="Buscar revendedor, estrutura, cidade..." className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:border-[#048187]" />
                  </div>
                </div>
                <div className="overflow-x-auto max-h-[390px]">
                  <table className="w-full text-sm min-w-[1150px]">
                    <thead className="sticky top-0 bg-white z-10">
                      <tr className="text-left text-gray-500 border-b border-gray-100">
                        <th className="py-3 px-2">Cód.</th>
                        <th className="py-3 px-2">Revendedor</th>
                        <th className="py-3 px-2">Estrutura</th>
                        <th className="py-3 px-2">Cidade</th>
                        <th className="py-3 px-2">Atividade</th>
                        <th className="py-3 px-2">Papel</th>
                        <th className="py-3 px-2 text-right">Crédito</th>
                        <th className="py-3 px-2 text-right">Receita Praticada</th>
                        <th className="py-3 px-2">Inadimplente?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listaFiltrada.slice(0, 300).map((r, idx) => (
                        <tr key={`${r.cod_revendedor}-${idx}`} className="border-b border-gray-50 hover:bg-gray-50/60">
                          <td className="py-3 px-2 font-bold text-[#048187]">{r.cod_revendedor || '-'}</td>
                          <td className="py-3 px-2 font-bold text-gray-700">{r.nome_revendedor || '-'}</td>
                          <td className="py-3 px-2 text-gray-500">{r.nome_estrutura || '-'}</td>
                          <td className="py-3 px-2 text-gray-500">{r.cidade || '-'}</td>
                          <td className="py-3 px-2 text-gray-500">{r.atividade || '-'}</td>
                          <td className="py-3 px-2 text-gray-500">{r.papel || '-'}</td>
                          <td className="py-3 px-2 text-right font-bold text-gray-700">{formatarMoeda(r.credito_disponivel || 0)}</td>
                          <td className="py-3 px-2 text-right font-bold text-gray-700">{formatarMoeda(Number(r.receita_praticada_pedidos || 0) > 0 ? r.receita_praticada_pedidos : r.vlr_receita_liquida || 0)}</td>
                          <td className="py-3 px-2"><span className={`px-2 py-1 rounded-full text-xs font-bold ${ehInadimplente(r.inadimplente) ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>{r.inadimplente || '-'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderTelaBase = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-700 mb-2">Base de dados</h1>
        <p className="text-sm text-gray-400 font-semibold">Uploads de bases operacionais. Cadastros manuais agora ficam na aba Cadastro.</p>
      </div>
      {(mensagemUpload || erroUpload) && (<div className={`rounded-xl p-4 font-bold text-sm ${mensagemUpload ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{mensagemUpload || erroUpload}</div>)}
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 xl:gap-6">
        <CompUpload titulo="Pedidos" desc="Base principal" arq={arquivoPedidos} setArq={setArquivoPedidos} onEnv={() => enviarArquivo('pedidos')} icone={Database} load={carregandoUpload} acaoExtraLabel="Atualizar via SGI" onAcaoExtra={iniciarAtualizacaoAutomaticaPedidos} acaoExtraLoad={carregandoAutomacaoPedidos} />
        <CompUpload titulo="Base Ativa" desc="Base de revendedores." arq={arquivoBaseAtiva} setArq={setArquivoBaseAtiva} onEnv={() => enviarArquivo('baseAtiva')} icone={Target} load={carregandoUpload} />
        <CompUpload titulo="Revendedores" desc="Visão Geral - Detalhe Revendedor." arq={arquivoRevendedores} setArq={setArquivoRevendedores} onEnv={() => enviarArquivo('revendedores')} icone={UserCircle} load={carregandoUpload} />
        <CompUpload titulo="SKUS IAF" desc="Abas MAKE e CABELO." arq={arquivoSkusIaf} setArq={setArquivoSkusIaf} onEnv={() => enviarArquivo('skusIaf')} icone={Sparkles} load={carregandoUpload} />
        <CompUpload titulo="Vendas MAKE" desc="Boticário, Eudora, QDB." arquivos={arquivosVendasMake} setArqs={setArquivosVendasMake} onEnv={() => enviarArquivo('vendasMake')} icone={Upload} mult load={carregandoUpload} acaoExtraLabel="Atualizar via SGI" onAcaoExtra={iniciarAtualizacaoAutomaticaMake} acaoExtraLoad={carregandoAutomacaoMake} />
        <CompUpload titulo="Vendas CABELO" desc="Planilhas Cabelo." arquivos={arquivosVendasCabelo} setArqs={setArquivosVendasCabelo} onEnv={() => enviarArquivo('vendasCabelo')} icone={Scissors} mult load={carregandoUpload} acaoExtraLabel="Atualizar via SGI" onAcaoExtra={iniciarAtualizacaoAutomaticaCabelo} acaoExtraLoad={carregandoAutomacaoCabelo} />
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-8">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6"><div className="flex items-start sm:items-center gap-3"><div className="w-11 h-11 rounded-full bg-[#e6f6f7] text-[#048187] flex items-center justify-center shrink-0"><CalendarDays size={22} /></div><div><h2 className="text-lg sm:text-xl font-bold text-gray-700">Ciclos</h2></div></div><button onClick={carregarCiclos} className="bg-[#048187] text-white font-bold px-4 py-3 rounded-lg hover:bg-[#036b70] inline-flex items-center justify-center gap-2"><RefreshCcw size={17} />Atualizar</button></div>
        {(mensagemCiclo || erroCiclo) && (<div className={`rounded-xl p-4 font-bold text-sm mb-5 ${mensagemCiclo ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{mensagemCiclo || erroCiclo}</div>)}
        <FormCiclo form={cicloForm} setForm={setCicloForm} onSub={criarCiclo} txtBtn="Cadastrar" />
        <div className="mt-8">
          <h3 className="text-lg font-bold text-gray-700 mb-4">Ciclos cadastrados</h3>
          {carregandoCiclos ? (<p className="text-[#048187] font-bold">Carregando ciclos...</p>) : (
            <div className="overflow-x-auto"><table className="w-full text-sm min-w-[760px]"><thead><tr className="text-left text-gray-500 border-b border-gray-100"><th className="py-3 px-2">Ciclo</th><th className="py-3 px-2">Início</th><th className="py-3 px-2">Fim</th><th className="py-3 px-2 text-right">Meta</th><th className="py-3 px-2 text-center">Status</th><th className="py-3 px-2 text-right">Ações</th></tr></thead><tbody>
              {ciclos.map((c) => (<tr key={c.id} className="border-b border-gray-50"><td className="py-4 px-2 font-bold text-gray-700">{c.ciclo}</td><td className="py-4 px-2 text-gray-500">{formatarDataBR(c.data_inicio)}</td><td className="py-4 px-2 text-gray-500">{formatarDataBR(c.data_fim)}</td><td className="py-4 px-2 text-right font-bold text-[#048187]">{formatarMoeda(c.meta_ciclo)}</td><td className="py-4 px-2 text-center"><span className={`px-3 py-1 rounded-full text-xs font-bold ${c.status_ciclo === 'ativo' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{c.status_ciclo}</span></td><td className="py-4 px-2 text-right"><button onClick={() => abrirEditarCiclo(c)} className="text-[#048187] hover:text-[#036b70] mr-3"><Pencil size={17} /></button><button onClick={() => abrirExcluirCiclo(c)} className="text-red-500 hover:text-red-600"><Trash2 size={17} /></button></td></tr>))}
            </tbody></table></div>
          )}
        </div>
      </div>
    </div>
  );

  const renderTelaCadastro = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-700 mb-2">Cadastro</h1>
            <p className="text-sm text-gray-400 font-semibold">Cadastre e mantenha consultores, nomes sociais, pesos de meta e metas reais.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={() => setModalMetasReaisAberto(true)} className="bg-[#048187] hover:bg-[#036b70] text-white font-black rounded-lg px-4 py-3 inline-flex items-center justify-center gap-2">
              <Plus size={16} /> Cadastrar / Ver metas reais
            </button>
          </div>
        </div>
      </div>
      {renderTelaConsultores()}
    </div>
  );

  const renderTelaConsultores = () => {
    const cFilt = listaConsultores.filter(c => String(c.nome || '').toLowerCase().includes(buscaConsultor.toLowerCase()) || String(c.nome_social || '').toLowerCase().includes(buscaConsultor.toLowerCase()) || String(c.id_colaborador).includes(buscaConsultor));
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-8"><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2"><h1 className="text-xl sm:text-2xl font-bold text-gray-700">Gestão de Consultores</h1><div className="flex gap-2"><button onClick={() => setModalCriarConsultorAberto(true)} className="bg-[#048187] text-white font-bold px-4 py-2 rounded-lg hover:bg-[#036b70] flex items-center gap-2 text-sm"><Plus size={16} /> Novo consultor</button><button onClick={carregarListaConsultores} className="bg-[#e6f6f7] text-[#048187] font-bold px-4 py-2 rounded-lg hover:bg-[#d0f0f1] flex items-center gap-2 text-sm"><RefreshCcw size={16} /> Atualizar</button></div></div></div>
        {(mensagemConsultor || erroGestaoConsultor) && (<div className={`rounded-xl p-4 font-bold text-sm ${mensagemConsultor ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{mensagemConsultor || erroGestaoConsultor}</div>)}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"><div className="relative w-full sm:w-96"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Buscar por nome ou ID..." value={buscaConsultor} onChange={(e) => setBuscaConsultor(e.target.value)} className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#048187]" /></div><div className="text-sm font-bold text-[#048187] bg-[#e6f6f7] px-3 py-1.5 rounded-full">{cFilt.length} Registros</div></div>
          {carregandoListaConsultores ? (<div className="py-10 text-center text-[#048187] font-bold">Carregando...</div>) : (
            <div className="overflow-x-auto"><div className="max-h-[600px] overflow-y-auto pr-2"><table className="w-full text-sm min-w-[900px]"><thead className="sticky top-0 bg-white z-10"><tr className="text-left text-gray-500 border-b border-gray-200"><th className="py-3 px-2">ID</th><th className="py-3 px-2">Nome</th><th className="py-3 px-2">Nome Social</th><th className="py-3 px-2">Estrutura</th><th className="py-3 px-2">Canal</th><th className="py-3 px-2">Status</th><th className="py-3 px-2 text-right">Peso Meta</th><th className="py-3 px-2 text-right">Ações</th></tr></thead><tbody>
              {cFilt.map((c) => (<tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50"><td className="py-3 px-2 font-medium text-gray-500">{c.id_colaborador}</td><td className="py-3 px-2 font-bold text-gray-700">{c.nome}</td><td className="py-3 px-2 font-bold text-[#048187]">{c.nome_social || '-'}</td><td className="py-3 px-2 text-gray-600">{c.estrutura}</td><td className="py-3 px-2 text-gray-600">{c.canal}</td><td className="py-3 px-2"><span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${c.status_consultor === 'ativo' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{c.status_consultor}</span></td><td className="py-3 px-2 text-right font-bold text-[#048187]">{Number(c.peso_meta || 0).toFixed(2)}%</td><td className="py-3 px-2 text-right whitespace-nowrap"><button onClick={() => abrirEditarConsultor(c)} className="text-[#048187] hover:text-[#036b70] mr-3"><Pencil size={17} /></button><button onClick={() => abrirExcluirConsultor(c)} className="text-red-500 hover:text-red-600"><Trash2 size={17} /></button></td></tr>))}
            </tbody></table></div></div>
          )}
        </div>
      </div>
    );
  };

  const renderTelaPerfil = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-8"><div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-gray-100 pb-6 mb-6"><div className="w-16 h-16 rounded-full bg-[#048187] text-white flex items-center justify-center shrink-0"><User size={34} /></div><div className="min-w-0"><h1 className="text-xl sm:text-2xl font-bold text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis">{usuarioLogado.nome}</h1><p className="text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis">{usuarioLogado.email}</p></div></div><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="bg-[#fcfbf7] border border-gray-100 rounded-xl p-4"><p className="text-xs font-bold text-gray-400 uppercase mb-1">Nome</p><p className="text-lg font-bold text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis">{usuarioLogado.nome}</p></div><div className="bg-[#fcfbf7] border border-gray-100 rounded-xl p-4"><p className="text-xs font-bold text-gray-400 uppercase mb-1">Perfil</p><p className="text-lg font-bold text-[#048187] uppercase whitespace-nowrap overflow-hidden text-ellipsis">{usuarioLogado.perfil}</p></div><div className="bg-[#fcfbf7] border border-gray-100 rounded-xl p-4"><p className="text-xs font-bold text-gray-400 uppercase mb-1">Status</p><p className="text-lg font-bold text-green-600 whitespace-nowrap overflow-hidden text-ellipsis">{usuarioLogado.status_usuario}</p></div></div></div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-8"><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6"><div className="flex items-center gap-2"><KeyRound size={22} className="text-[#048187]" /><h2 className="text-xl font-bold text-gray-700">Trocar senha</h2></div><button type="button" onClick={() => setMostrarSenhasPerfil(!mostrarSenhasPerfil)} className="flex items-center gap-2 text-sm font-bold text-[#048187]">{mostrarSenhasPerfil ? <EyeOff size={18} /> : <Eye size={18} />}{mostrarSenhasPerfil ? 'Ocultar senhas' : 'Mostrar senhas'}</button></div>{(mensagemSenha || erroSenha) && (<div className={`rounded-xl p-4 font-bold text-sm mb-4 ${mensagemSenha ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{mensagemSenha || erroSenha}</div>)}<form onSubmit={alterarSenha} className="grid grid-cols-1 md:grid-cols-3 gap-4"><input type={mostrarSenhasPerfil ? 'text' : 'password'} placeholder="Senha atual" value={senhaPerfil.senha_atual} onChange={(e) => setSenhaPerfil({ ...senhaPerfil, senha_atual: e.target.value })} className="border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187]" required /><input type={mostrarSenhasPerfil ? 'text' : 'password'} placeholder="Nova senha" value={senhaPerfil.nova_senha} onChange={(e) => setSenhaPerfil({ ...senhaPerfil, nova_senha: e.target.value })} className="border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187]" required /><input type={mostrarSenhasPerfil ? 'text' : 'password'} placeholder="Confirmar nova senha" value={senhaPerfil.confirmar_senha} onChange={(e) => setSenhaPerfil({ ...senhaPerfil, confirmar_senha: e.target.value })} className="border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187]" required /><button type="submit" className="md:col-span-3 bg-[#048187] text-white font-bold py-3 rounded-lg hover:bg-[#036b70] inline-flex items-center justify-center gap-2"><Save size={18} /> Alterar senha</button></form></div>
    </div>
  );

  const renderTelaConfiguracoes = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-8"><h1 className="text-xl sm:text-2xl font-bold text-gray-700 mb-2">Configurações</h1><p className="text-gray-400">Gerencie usuários e permissões de acesso.</p></div>
      {(mensagemUsuarios || erroUsuarios) && (<div className={`rounded-xl p-4 font-bold text-sm ${mensagemUsuarios ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{mensagemUsuarios || erroUsuarios}</div>)}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-8">
        <div className="flex items-center gap-3"><div className="w-12 h-12 rounded-full bg-[#e6f6f7] text-[#048187] flex items-center justify-center shrink-0"><ShieldCheck size={24} /></div><div><h2 className="text-xl font-bold text-gray-700">Controle de Permissões</h2><p className="text-sm text-gray-400">Configure as abas liberadas na coluna Permissões dos usuários cadastrados.</p></div></div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-8">
        <div className="flex items-center gap-2 mb-6"><Plus size={22} className="text-[#048187]" /><h2 className="text-xl font-bold text-gray-700">Criar usuário</h2></div>
        <form onSubmit={criarUsuario} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4"><input type="text" placeholder="Nome" value={novoUsuario.nome} onChange={(e) => setNovoUsuario({ ...novoUsuario, nome: e.target.value })} className="border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187]" required /><input type="email" placeholder="E-mail" value={novoUsuario.email} onChange={(e) => setNovoUsuario({ ...novoUsuario, email: e.target.value })} className="border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187]" required /><input type="password" placeholder="Senha" value={novoUsuario.senha} onChange={(e) => setNovoUsuario({ ...novoUsuario, senha: e.target.value })} className="border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187]" required /><select value={novoUsuario.perfil} onChange={(e) => setNovoUsuario({ ...novoUsuario, perfil: e.target.value })} className="border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187]"><option value="admin">Admin</option><option value="gestor">Gestor</option><option value="visualizador">Visualizador</option></select><button type="submit" className="bg-[#048187] text-white font-bold rounded-lg py-3 hover:bg-[#036b70] inline-flex items-center justify-center gap-2"><ShieldCheck size={18} /> Criar</button></form>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6"><h2 className="text-xl font-bold text-gray-700">Usuários cadastrados</h2><button onClick={carregarUsuarios} className="text-[#048187] font-bold text-sm hover:underline">Atualizar</button></div>
        {carregandoUsuarios ? (<p className="text-[#048187] font-bold">Carregando usuários...</p>) : (
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[980px]"><thead><tr className="text-left text-gray-500 border-b border-gray-100"><th className="py-3 px-2">Nome</th><th className="py-3 px-2">E-mail</th><th className="py-3 px-2">Perfil</th><th className="py-3 px-2">Permissões</th><th className="py-3 px-2">Status</th><th className="py-3 px-2 text-right">Ações</th></tr></thead><tbody>{usuariosSistema.map((u) => { const abasPerfil = permissoesAtivas[u.perfil] || []; const podeConfigurarPermissoes = usuarioLogado?.perfil === 'admin'; return (<tr key={u.id} className="border-b border-gray-50"><td className="py-4 px-2 font-bold text-gray-700">{u.nome}</td><td className="py-4 px-2 text-gray-500">{u.email}</td><td className="py-4 px-2 text-[#048187] font-bold uppercase">{u.perfil}</td><td className="py-4 px-2"><div className="flex flex-col gap-2 min-w-[220px]"><div className="flex flex-wrap gap-1.5">{abasPerfil.slice(0, 3).map((aba) => (<span key={aba} className="bg-[#e6f6f7] text-[#048187] px-2 py-1 rounded-full text-[10px] font-bold">{obterNomeAba(aba)}</span>))}{abasPerfil.length > 3 && (<span className="bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-[10px] font-bold">+{abasPerfil.length - 3}</span>)}</div>{podeConfigurarPermissoes ? (<button type="button" onClick={() => abrirModalPermissoes(u.perfil)} className="w-fit bg-[#048187] text-white font-bold px-3 py-1.5 rounded-lg hover:bg-[#036b70] transition-colors text-xs inline-flex items-center gap-1"><ShieldCheck size={13} /> Configurar abas</button>) : (<span className="text-xs text-gray-400 font-medium">Somente admin pode alterar</span>)}</div></td><td className="py-4 px-2"><span className={`px-3 py-1 rounded-full text-xs font-bold ${u.status_usuario === 'ativo' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{u.status_usuario}</span></td><td className="py-4 px-2 text-right"><button onClick={() => abrirEditarUsuario(u)} className="text-[#048187] hover:text-[#036b70] mr-3"><Pencil size={17} /></button><button onClick={() => abrirExcluirUsuario(u)} className="text-red-500 hover:text-red-600"><Trash2 size={17} /></button></td></tr>); })}</tbody></table></div>
        )}
      </div>
    </div>
  );

  const renderTelaHistorico = () => {
    const resumo = dadosHistorico?.resumo || null;
    const estruturas = dadosHistorico?.estruturas || [];
    const consultores = dadosHistorico?.consultores || [];
    const consultoresAtivos = dadosHistorico?.consultoresAtivos || [];
    const metas = dadosHistorico?.metas || [];
    const fmtPerc = (v) => `${Number(v || 0).toFixed(1)}%`;
    const fmtDataHora = (v) => {
      if (!v) return '-';
      const data = new Date(v);
      if (Number.isNaN(data.getTime())) return String(v);
      return data.toLocaleString('pt-BR');
    };
    const qtdEstruturasMeta = (meta) => {
      const valor = meta?.estruturas_vinculadas;
      if (Array.isArray(valor)) return valor.length;
      if (typeof valor === 'string') {
        try { const parsed = JSON.parse(valor); return Array.isArray(parsed) ? parsed.length : 0; } catch { return 0; }
      }
      return 0;
    };

    const abasHistorico = [
      { id: 'estruturas', label: 'Estruturas', total: estruturas.length },
      { id: 'consultores', label: 'Consultores', total: consultores.length },
      { id: 'ativos', label: 'Consultores ativos', total: consultoresAtivos.length },
      { id: 'metas', label: 'Metas salvas', total: metas.length }
    ];

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-8">
          <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-700 mb-2">Histórico de ciclos</h1>
              <p className="text-sm text-gray-400 font-semibold max-w-3xl">Consulte a fotografia oficial de ciclos fechados: consultores ativos na época, metas cadastradas e performance congelada por estrutura e consultor.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
              <select
                value={cicloHistoricoSelecionado}
                onChange={(e) => { const ciclo = e.target.value; setCicloHistoricoSelecionado(ciclo); carregarHistoricoCiclo(ciclo); }}
                className="border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 font-bold outline-none focus:border-[#048187] min-w-[180px]"
              >
                <option value="">Selecione o ciclo</option>
                {historicoCiclos.map((c) => <option key={c.ciclo} value={c.ciclo}>{c.ciclo}</option>)}
              </select>
              <button onClick={() => carregarHistoricoCiclo()} disabled={!cicloHistoricoSelecionado || carregandoHistorico} className="bg-[#e6f6f7] text-[#048187] font-black rounded-lg px-4 py-3 inline-flex items-center justify-center gap-2 disabled:opacity-60"><RefreshCcw size={18} /> Atualizar</button>
              <button onClick={reprocessarCicloHistorico} disabled={!cicloHistoricoSelecionado || carregandoHistorico} className="bg-[#048187] hover:bg-[#036b70] text-white font-black rounded-lg px-4 py-3 inline-flex items-center justify-center gap-2 disabled:opacity-60"><RefreshCcw size={18} /> Reprocessar</button>
            </div>
          </div>
        </div>

        {(erroHistorico || mensagemHistorico) && (
          <div className={`rounded-xl px-4 py-3 text-sm font-bold border ${erroHistorico ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>{erroHistorico || mensagemHistorico}</div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-end gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Ciclo para fechar</label>
                <input value={fechamentoHistorico.ciclo} onChange={(e) => setFechamentoHistorico({ ...fechamentoHistorico, ciclo: e.target.value })} placeholder="Ex.: 08/2026" className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#048187]" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Observação</label>
                <input value={fechamentoHistorico.observacao} onChange={(e) => setFechamentoHistorico({ ...fechamentoHistorico, observacao: e.target.value })} placeholder="Ex.: Fechamento oficial do ciclo" className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#048187]" />
              </div>
            </div>
            <button onClick={fecharCicloHistorico} disabled={carregandoHistorico} className="bg-[#111827] hover:bg-black text-white font-black rounded-lg px-5 py-3 inline-flex items-center justify-center gap-2 disabled:opacity-60"><Save size={18} /> Fechar ciclo</button>
          </div>
        </div>

        {carregandoHistorico && !resumo ? <DashboardSkeletons /> : resumo ? (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-black text-gray-700 text-lg">Ciclo {resumo.ciclo}</h2>
                  <p className="text-xs text-gray-400 font-bold">Fechado em {fmtDataHora(resumo.fechado_em)} por {resumo.fechado_por || '-'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-[#e6f6f7] text-[#048187] rounded-full px-3 py-1 text-xs font-black">{resumo.qtd_estruturas || 0} estruturas</span>
                  <span className="bg-[#e6f6f7] text-[#048187] rounded-full px-3 py-1 text-xs font-black">{resumo.qtd_consultores_ativos || 0} consultores ativos</span>
                  <span className="bg-[#e6f6f7] text-[#048187] rounded-full px-3 py-1 text-xs font-black">{resumo.qtd_pedidos || 0} pedidos</span>
                </div>
              </div>

              <div className="overflow-x-auto pb-2">
                <div className="grid grid-cols-9 gap-3 min-w-[1350px]">
                  <CardMini titulo="Faturamento" valor={formatarAbrev(resumo.faturamento_total)} percentual={resumo.percentual_faturamento} labelMeta="Meta" valorMeta={formatarMoeda(resumo.meta_faturamento_total)} />
                  <CardMini titulo="Atividade" valor={Number(resumo.atividade_total || 0).toLocaleString('pt-BR')} percentual={resumo.percentual_atividade} labelMeta="Meta" valorMeta={Number(resumo.meta_atividade_total || 0).toLocaleString('pt-BR')} />
                  <CardMini titulo="MAKE" valor={Number(resumo.make_total || 0).toLocaleString('pt-BR')} percentual={resumo.percentual_make} labelMeta="Meta" valorMeta={Number(resumo.meta_make_total || 0).toLocaleString('pt-BR')} />
                  <CardMini titulo="CABELO" valor={Number(resumo.cabelo_total || 0).toLocaleString('pt-BR')} percentual={resumo.percentual_cabelo} labelMeta="Meta" valorMeta={Number(resumo.meta_cabelo_total || 0).toLocaleString('pt-BR')} />
                  <CardMini titulo="RPA" valor={formatarAbrev(resumo.rpa_total)} labelMeta="Meta" valorMeta={formatarMoeda(resumo.meta_rpa_total)} />
                  <CardMini titulo="Ticket médio" valor={formatarAbrev(resumo.ticket_medio_total)} labelMeta="Meta" valorMeta={formatarMoeda(resumo.meta_ticket_medio_total)} />
                  <CardMini titulo="UPA" valor={Number(resumo.upa_total || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} labelMeta="Meta" valorMeta={Number(resumo.meta_upa_total || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} />
                  <CardMini titulo="Pedidos" valor={Number(resumo.qtd_pedidos || 0).toLocaleString('pt-BR')} labelMeta="Cancelados" valorMeta={Number(estruturas.reduce((acc, e) => acc + Number(e.cancelados || 0), 0)).toLocaleString('pt-BR')} />
                  <CardMini titulo="Revendedores" valor={Number(resumo.qtd_revendedores_ativos || 0).toLocaleString('pt-BR')} labelMeta="Consultores" valorMeta={Number(resumo.qtd_consultores || 0).toLocaleString('pt-BR')} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div>
                  <h3 className="font-black text-gray-700">Detalhamento do ciclo</h3>
                  <p className="text-xs text-gray-400 font-bold">Dados salvos no fechamento do ciclo {resumo.ciclo}.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {abasHistorico.map((aba) => (
                    <button key={aba.id} onClick={() => setVisaoHistorico(aba.id)} className={`px-3 py-2 rounded-lg text-xs font-black transition-colors ${visaoHistorico === aba.id ? 'bg-[#048187] text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>{aba.label} ({aba.total})</button>
                  ))}
                </div>
              </div>

              {visaoHistorico === 'estruturas' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[1250px]"><thead className="bg-gray-50 text-[10px] uppercase text-gray-400 font-black"><tr><th className="px-5 py-3">Rank</th><th className="px-5 py-3">Estrutura</th><th className="px-5 py-3 text-right">Realizado</th><th className="px-5 py-3 text-right">Meta</th><th className="px-5 py-3 text-right">% Fat.</th><th className="px-5 py-3 text-right">Pedidos</th><th className="px-5 py-3 text-right">Ativ.</th><th className="px-5 py-3 text-right">MAKE</th><th className="px-5 py-3 text-right">CABELO</th><th className="px-5 py-3 text-right">RPA</th><th className="px-5 py-3 text-right">Tkt</th><th className="px-5 py-3 text-right">UPA</th></tr></thead>
                    <tbody className="divide-y divide-gray-100 text-sm">{estruturas.map((e, i) => (<tr key={`${e.estrutura}-${i}`} className="hover:bg-[#f7fafb]"><td className="px-5 py-3 font-black text-[#048187]">#{e.ranking_faturamento || i + 1}</td><td className="px-5 py-3 font-black text-gray-700 max-w-[260px] truncate">{e.estrutura}</td><td className="px-5 py-3 text-right font-black text-[#048187]">{formatarMoeda(e.realizado)}</td><td className="px-5 py-3 text-right font-bold text-gray-600">{formatarMoeda(e.meta_faturamento)}</td><td className="px-5 py-3 text-right font-black text-gray-700">{fmtPerc(e.percentual_realizado)}</td><td className="px-5 py-3 text-right font-bold text-gray-600">{e.pedidos || 0}</td><td className="px-5 py-3 text-right font-bold text-gray-600">{e.atividade || 0}</td><td className="px-5 py-3 text-right font-bold text-gray-600">{e.make || 0} <span className="text-gray-400">({fmtPerc(e.percentual_make)})</span></td><td className="px-5 py-3 text-right font-bold text-gray-600">{e.cabelo || 0} <span className="text-gray-400">({fmtPerc(e.percentual_cabelo)})</span></td><td className="px-5 py-3 text-right font-bold text-gray-600">{formatarMoeda(e.rpa)}</td><td className="px-5 py-3 text-right font-bold text-gray-600">{formatarMoeda(e.ticket_medio)}</td><td className="px-5 py-3 text-right font-bold text-gray-600">{Number(e.upa || 0).toFixed(2)}</td></tr>))}</tbody></table>
                  {!estruturas.length && <div className="p-8 text-center text-gray-400 font-bold">Nenhuma estrutura salva nesse ciclo.</div>}
                </div>
              )}

              {visaoHistorico === 'consultores' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[1150px]"><thead className="bg-gray-50 text-[10px] uppercase text-gray-400 font-black"><tr><th className="px-5 py-3">Rank</th><th className="px-5 py-3">Consultor</th><th className="px-5 py-3">Estrutura</th><th className="px-5 py-3 text-right">Peso</th><th className="px-5 py-3 text-right">Meta</th><th className="px-5 py-3 text-right">Realizado</th><th className="px-5 py-3 text-right">% Fat.</th><th className="px-5 py-3 text-right">Ativ.</th><th className="px-5 py-3 text-right">MAKE</th><th className="px-5 py-3 text-right">CABELO</th></tr></thead>
                    <tbody className="divide-y divide-gray-100 text-sm">{consultores.map((c, i) => (<tr key={`${c.id_colaborador}-${c.estrutura}-${i}`} className="hover:bg-[#f7fafb]"><td className="px-5 py-3 font-black text-[#048187]">#{c.ranking_faturamento || i + 1}</td><td className="px-5 py-3"><p className="font-black text-gray-700 truncate max-w-[230px]">{c.nome_exibicao || c.nome_social || c.nome || '-'}</p><p className="text-[10px] text-gray-400 font-bold">ID {c.id_colaborador || '-'}</p></td><td className="px-5 py-3 font-bold text-gray-500 max-w-[250px] truncate">{c.estrutura || '-'}</td><td className="px-5 py-3 text-right font-bold text-gray-600">{Number(c.peso_meta || 0).toFixed(2)}%</td><td className="px-5 py-3 text-right font-bold text-gray-600">{formatarMoeda(c.meta_individual)}</td><td className="px-5 py-3 text-right font-black text-[#048187]">{formatarMoeda(c.realizado)}</td><td className="px-5 py-3 text-right font-black text-gray-700">{fmtPerc(c.percentual_realizado)}</td><td className="px-5 py-3 text-right font-bold text-gray-600">{c.atividade || 0}</td><td className="px-5 py-3 text-right font-bold text-gray-600">{c.make || 0} <span className="text-gray-400">({fmtPerc(c.percentual_make)})</span></td><td className="px-5 py-3 text-right font-bold text-gray-600">{c.cabelo || 0} <span className="text-gray-400">({fmtPerc(c.percentual_cabelo)})</span></td></tr>))}</tbody></table>
                  {!consultores.length && <div className="p-8 text-center text-gray-400 font-bold">Nenhum consultor com performance salva nesse ciclo.</div>}
                </div>
              )}

              {visaoHistorico === 'ativos' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[850px]"><thead className="bg-gray-50 text-[10px] uppercase text-gray-400 font-black"><tr><th className="px-5 py-3">Consultor ativo no ciclo</th><th className="px-5 py-3">ID</th><th className="px-5 py-3">Estrutura</th><th className="px-5 py-3">Canal</th><th className="px-5 py-3 text-right">Peso Meta</th><th className="px-5 py-3">Status</th></tr></thead>
                    <tbody className="divide-y divide-gray-100 text-sm">{consultoresAtivos.map((c, i) => (<tr key={`${c.id_colaborador}-${c.estrutura}-${i}`} className="hover:bg-[#f7fafb]"><td className="px-5 py-3 font-black text-gray-700">{c.nome_exibicao || c.nome_social || c.nome || '-'}</td><td className="px-5 py-3 font-bold text-gray-500">{c.id_colaborador || '-'}</td><td className="px-5 py-3 font-bold text-gray-500">{c.estrutura || '-'}</td><td className="px-5 py-3 font-bold text-gray-500">{c.canal || '-'}</td><td className="px-5 py-3 text-right font-black text-[#048187]">{Number(c.peso_meta || 0).toFixed(2)}%</td><td className="px-5 py-3"><span className={`px-2 py-1 rounded-full text-[10px] font-black ${c.ativo_no_ciclo ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{c.status || (c.ativo_no_ciclo ? 'ativo' : 'inativo')}</span></td></tr>))}</tbody></table>
                  {!consultoresAtivos.length && <div className="p-8 text-center text-gray-400 font-bold">Nenhum consultor ativo salvo nesse ciclo.</div>}
                </div>
              )}

              {visaoHistorico === 'metas' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[1050px]"><thead className="bg-gray-50 text-[10px] uppercase text-gray-400 font-black"><tr><th className="px-5 py-3">Meta</th><th className="px-5 py-3">Tipo</th><th className="px-5 py-3 text-right">Faturamento</th><th className="px-5 py-3 text-right">Atividade</th><th className="px-5 py-3 text-right">MAKE</th><th className="px-5 py-3 text-right">CABELO</th><th className="px-5 py-3 text-right">RPA</th><th className="px-5 py-3 text-right">Tkt</th><th className="px-5 py-3 text-right">UPA</th><th className="px-5 py-3 text-right">Estruturas</th></tr></thead>
                    <tbody className="divide-y divide-gray-100 text-sm">{metas.map((m, i) => (<tr key={`${m.nome_meta}-${i}`} className="hover:bg-[#f7fafb]"><td className="px-5 py-3 font-black text-gray-700 max-w-[260px] truncate">{m.nome_meta}</td><td className="px-5 py-3 font-bold text-gray-500">{m.tipo_meta}</td><td className="px-5 py-3 text-right font-black text-[#048187]">{formatarMoeda(m.meta_faturamento)}</td><td className="px-5 py-3 text-right font-bold text-gray-600">{Number(m.meta_atividade || 0).toFixed(1)}%</td><td className="px-5 py-3 text-right font-bold text-gray-600">{Number(m.meta_make || 0).toFixed(1)}%</td><td className="px-5 py-3 text-right font-bold text-gray-600">{Number(m.meta_cabelo || 0).toFixed(1)}%</td><td className="px-5 py-3 text-right font-bold text-gray-600">{formatarMoeda(m.meta_rpa)}</td><td className="px-5 py-3 text-right font-bold text-gray-600">{formatarMoeda(m.meta_ticket_medio)}</td><td className="px-5 py-3 text-right font-bold text-gray-600">{Number(m.meta_upa || 0).toFixed(2)}</td><td className="px-5 py-3 text-right font-black text-gray-700">{qtdEstruturasMeta(m)}</td></tr>))}</tbody></table>
                  {!metas.length && <div className="p-8 text-center text-gray-400 font-bold">Nenhuma meta real salva nesse ciclo.</div>}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
            <CalendarDays size={42} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-black">Nenhum ciclo histórico selecionado.</p>
            <p className="text-sm text-gray-400 mt-1">Feche um ciclo ou selecione um ciclo já salvo para visualizar a fotografia oficial.</p>
          </div>
        )}
      </div>
    );
  };

  const renderTelaLoja = () => {
    const pvdLoja = [
      { pvd: '9071', meta: 74937, realizado: 8117.7, deficit: 66819.3, itens: 4, boleto: 260, skinMeta: 1874, skinReal: 0, servMes: 14 },
      { pvd: '9151', meta: 48985, realizado: 8038.52, deficit: 40946.48, itens: 4, boleto: 230, skinMeta: 1224.87, skinReal: 0, servMes: 16 },
      { pvd: '17322', meta: 117263, realizado: 19936.93, deficit: 97326.07, itens: 4, boleto: 279, skinMeta: 2931.55, skinReal: 0, servMes: 19 },
      { pvd: '17324', meta: 56234, realizado: 9249.99, deficit: 46984.01, itens: 4, boleto: 276, skinMeta: 1405.86, skinReal: 0, servMes: 14 },
      { pvd: '20228', meta: 52572, realizado: 8760.01, deficit: 43811.99, itens: 4, boleto: 267, skinMeta: 1314.30, skinReal: 0, servMes: 9 },
    ].map((item) => ({ ...item, percentual: calcPerc(item.realizado, item.meta) }));

    const consultoresLoja = [
      { nome: 'MANUELA LOPES COSTA', pvd: '9071', meta: 24979, realizado: 2421.47, boleto: 269.05, itens: 2.67 },
      { nome: 'LAYNE RAQUEL MENDONÇA PINHEIRO', pvd: '9071', meta: 24979, realizado: 3476.60, boleto: 434.57, itens: 6.62 },
      { nome: 'NANES GOMES DOS SANTOS', pvd: '9151', meta: 16331.66, realizado: 2391.39, boleto: 239.14, itens: 2.90 },
      { nome: 'JOSÉ GABRIEL PINHEIRO PEREIRA', pvd: '17322', meta: 22807, realizado: 4935.21, boleto: 548.76, itens: 6.11 },
      { nome: 'ADRAYLLENA TEIXEIRA CORREA', pvd: '17322', meta: 7036, realizado: 1098.50, boleto: 366.17, itens: 2.27 },
      { nome: 'ELIANA MARIA FONSECA CABRAL', pvd: '20228', meta: 26286, realizado: 4088.80, boleto: 448.14, itens: 4.83 },
    ].map((item) => ({ ...item, percentual: calcPerc(item.realizado, item.meta) }));

    const vendasDiaLoja = [
      { dia: '15/06', realizado: 8200, meta: 7000 },
      { dia: '16/06', realizado: 10450, meta: 7000 },
      { dia: '17/06', realizado: 12100, meta: 7000 },
      { dia: '18/06', realizado: 9800, meta: 7000 },
      { dia: '19/06', realizado: 13520, meta: 7000 },
      { dia: '20/06', realizado: 11680, meta: 7000 },
      { dia: '21/06', realizado: 14240, meta: 7000 },
    ];

    const resumo = {
      metaCiclo: pvdLoja.reduce((acc, item) => acc + item.meta, 0),
      realizado: pvdLoja.reduce((acc, item) => acc + item.realizado, 0),
      deficit: pvdLoja.reduce((acc, item) => acc + item.deficit, 0),
      itensPorBoletoMeta: 4,
      itensPorBoletoReal: 4.15,
      boletoMedioMeta: 262.40,
      boletoMedioReal: 285.90,
      skinMeta: pvdLoja.reduce((acc, item) => acc + item.skinMeta, 0),
      skinReal: pvdLoja.reduce((acc, item) => acc + item.skinReal, 0),
      servicosMetaMes: 25,
      servicosRealMes: pvdLoja.reduce((acc, item) => acc + item.servMes, 0),
    };
    resumo.percentual = calcPerc(resumo.realizado, resumo.metaCiclo);
    resumo.percentualSkin = calcPerc(resumo.skinReal, resumo.skinMeta);
    resumo.percentualServicos = calcPerc(resumo.servicosRealMes, resumo.servicosMetaMes * pvdLoja.length);

    const CardLoja = ({ titulo, valor, meta, percentual, icone: Icone, subtitulo }) => {
      const cor = corPorFaixaMeta(percentual);
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wide text-gray-400 truncate">{titulo}</p>
              <p className="text-xl sm:text-2xl font-black mt-2 truncate" style={{ color: cor }}>{valor}</p>
            </div>
            {Icone && (
              <div className="w-9 h-9 rounded-xl bg-[#e6f6f7] text-[#048187] flex items-center justify-center shrink-0">
                <Icone size={18} />
              </div>
            )}
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between gap-2 text-[10px] font-bold">
              <span style={{ color: cor }}>{formatarNumeroBR(percentual, 1)}% da meta</span>
              {meta && <span className="text-gray-400 truncate">Meta: {meta}</span>}
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${Math.min(Number(percentual || 0), 100)}%`, backgroundColor: cor }} />
            </div>
          </div>
          {subtitulo && <p className="text-[11px] text-gray-400 font-bold mt-3 leading-relaxed">{subtitulo}</p>}
        </div>
      );
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <CardLoja titulo="Meta Ciclo" valor={formatarMoeda(resumo.realizado)} meta={formatarMoeda(resumo.metaCiclo)} percentual={resumo.percentual} icone={BadgeDollarSign} subtitulo={`Déficit: ${formatarMoeda(resumo.deficit)}`} />
          <CardLoja titulo="Itens por Boleto" valor={formatarNumeroBR(resumo.itensPorBoletoReal, 2)} meta={formatarNumeroBR(resumo.itensPorBoletoMeta, 0)} percentual={calcPerc(resumo.itensPorBoletoReal, resumo.itensPorBoletoMeta)} icone={FileSpreadsheet} subtitulo="Acompanha quantidade média de itens por boleto." />
          <CardLoja titulo="Boleto Médio" valor={formatarMoeda(resumo.boletoMedioReal)} meta={formatarMoeda(resumo.boletoMedioMeta)} percentual={calcPerc(resumo.boletoMedioReal, resumo.boletoMedioMeta)} icone={Trophy} subtitulo="Valor médio realizado por boleto." />
          <CardLoja titulo="Meta Skin" valor={formatarMoeda(resumo.skinReal)} meta={formatarMoeda(resumo.skinMeta)} percentual={resumo.percentualSkin} icone={Sparkles} subtitulo={`Faltam ${formatarMoeda(Math.max(resumo.skinMeta - resumo.skinReal, 0))}`} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-black text-gray-700">Vendas por dia</h2>
                <p className="text-xs text-gray-400 font-bold">Exemplo de evolução diária do canal loja.</p>
              </div>
              <span className="text-xs font-black text-[#048187]">Exemplo</span>
            </div>
            <div className="h-[300px] min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={vendasDiaLoja} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradVendasLojaDia" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#048187" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#048187" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f4" />
                  <XAxis dataKey="dia" tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 700 }} />
                  <YAxis tickFormatter={(v) => `R$${Math.round(v / 1000)}k`} tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <Tooltip formatter={(v) => formatarMoeda(v)} />
                  <Area type="monotone" dataKey="realizado" name="Realizado" stroke="#048187" strokeWidth={3} fill="url(#gradVendasLojaDia)" dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Area type="monotone" dataKey="meta" name="Meta diária" stroke="#7c1f31" strokeWidth={2} strokeDasharray="5 5" fill="transparent" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
            <h2 className="text-lg font-black text-gray-700">Serviços</h2>
            <p className="text-xs text-gray-400 font-bold mt-1">Meta mensal por PVD e realizado consolidado.</p>
            <div className="mt-5 bg-[#fcfbf7] rounded-2xl p-5 border border-gray-100">
              <p className="text-[10px] uppercase font-black text-gray-400">Realizado mês</p>
              <p className="text-3xl font-black mt-2" style={{ color: corPorFaixaMeta(resumo.percentualServicos) }}>{formatarNumeroBR(resumo.servicosRealMes, 0)}</p>
              <p className="text-xs font-bold text-gray-400 mt-1">Meta: {formatarNumeroBR(resumo.servicosMetaMes * pvdLoja.length, 0)} serviços</p>
              <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${Math.min(resumo.percentualServicos, 100)}%`, backgroundColor: corPorFaixaMeta(resumo.percentualServicos) }} />
              </div>
              <p className="text-xs font-black mt-3" style={{ color: corPorFaixaMeta(resumo.percentualServicos) }}>{formatarNumeroBR(resumo.percentualServicos, 1)}% da meta</p>
            </div>
            <div className="mt-4 space-y-2">
              {pvdLoja.map((item) => (
                <div key={item.pvd} className="flex items-center justify-between gap-3 text-xs border-b border-gray-50 pb-2 last:border-0">
                  <span className="font-black text-gray-500">PVD {item.pvd}</span>
                  <span className="font-black text-[#048187]">{item.servMes} serviços</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-black text-gray-700">Resumo por PVD</h2>
              <p className="text-xs text-gray-400 font-bold">Base visual para transformar a planilha em dashboard.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase text-gray-400 border-b border-gray-100">
                  <th className="py-3 px-2">PVD</th>
                  <th className="py-3 px-2 text-right">Meta ciclo</th>
                  <th className="py-3 px-2 text-right">Realizado</th>
                  <th className="py-3 px-2 text-right">Déficit</th>
                  <th className="py-3 px-2 text-right">% Meta</th>
                  <th className="py-3 px-2 text-right">Itens/Boleto</th>
                  <th className="py-3 px-2 text-right">Boleto médio</th>
                  <th className="py-3 px-2 text-right">Meta Skin</th>
                </tr>
              </thead>
              <tbody>
                {pvdLoja.map((item) => (
                  <tr key={item.pvd} className="border-b border-gray-50 last:border-0 hover:bg-[#f7fafb]">
                    <td className="py-3 px-2 font-black text-gray-700">{item.pvd}</td>
                    <td className="py-3 px-2 text-right font-bold text-gray-600">{formatarMoeda(item.meta)}</td>
                    <td className="py-3 px-2 text-right font-black text-[#048187]">{formatarMoeda(item.realizado)}</td>
                    <td className="py-3 px-2 text-right font-black text-[#7c1f31]">{formatarMoeda(item.deficit)}</td>
                    <td className="py-3 px-2 text-right font-black" style={{ color: corPorFaixaMeta(item.percentual) }}>{formatarNumeroBR(item.percentual, 1)}%</td>
                    <td className="py-3 px-2 text-right font-bold">{formatarNumeroBR(item.itens, 0)}</td>
                    <td className="py-3 px-2 text-right font-bold">{formatarMoeda(item.boleto)}</td>
                    <td className="py-3 px-2 text-right font-bold">{formatarMoeda(item.skinMeta)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
          <h2 className="text-lg font-black text-gray-700 mb-4">Consultoras destaque</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {consultoresLoja.map((item) => (
              <div key={`${item.pvd}-${item.nome}`} className="border border-gray-100 rounded-2xl p-4 bg-[#fcfbf7]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-black text-gray-700 truncate">{item.nome}</h3>
                    <p className="text-xs text-gray-400 font-bold mt-1">PVD {item.pvd} • Itens por boleto: {formatarNumeroBR(item.itens, 2)}</p>
                  </div>
                  <span className="text-sm font-black" style={{ color: corPorFaixaMeta(item.percentual) }}>{formatarNumeroBR(item.percentual, 1)}%</span>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4 text-xs">
                  <div>
                    <p className="uppercase text-[10px] font-black text-gray-400">Meta</p>
                    <p className="font-black text-gray-700 mt-1">{formatarMoeda(item.meta)}</p>
                  </div>
                  <div>
                    <p className="uppercase text-[10px] font-black text-gray-400">Realizado</p>
                    <p className="font-black text-[#048187] mt-1">{formatarMoeda(item.realizado)}</p>
                  </div>
                  <div>
                    <p className="uppercase text-[10px] font-black text-gray-400">Boleto médio</p>
                    <p className="font-black text-gray-700 mt-1">{formatarMoeda(item.boleto)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (telaAtual === 'Dashboard') return renderTelaDashboard();
    if (telaAtual === 'Metas') return renderTelaMetas();
    if (telaAtual === 'N1') return <TelaGestaoNucleo nucleo="N1" />;
    if (telaAtual === 'N2') return <TelaGestaoNucleo nucleo="N2" />;
    if (telaAtual === 'Ranking') return renderTelaRanking();
    if (telaAtual === 'Comparativo') return renderTelaComparativo();
    if (telaAtual === 'Histórico') return renderTelaHistorico();
    if (telaAtual === 'Revendedores') return renderTelaRevendedores();
    if (telaAtual === 'Base') return renderTelaBase();
    if (telaAtual === 'Cadastro') return renderTelaCadastro();
    if (telaAtual === 'Loja' || telaAtual === 'LojaVisaoGeral') return renderTelaLoja();
    if (telaAtual === 'Configurações') return renderTelaConfiguracoes();
    if (telaAtual === 'Perfil') return renderTelaPerfil();
    return null;
  };

  const cicloTopoAtual = dados?.ciclo_atual
    || ciclos?.find((c) => String(c.status_ciclo || '').toLowerCase() === 'ativo')?.ciclo
    || ciclos?.[0]?.ciclo
    || '';

  if (!usuarioLogado) {
    return (
      <div className="min-h-[100dvh] w-full overflow-hidden relative bg-gradient-to-r from-[#63dadd] via-[#1bb5b8] to-[#00636a]">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <img
            src={logoBrancaLogin}
            alt="SB"
            className="absolute -left-[3vw] top-[9vh] w-[70vw] max-w-[960px] min-w-[650px] opacity-[0.24] select-none"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>

        <div className="relative z-10 min-h-[100dvh] w-full flex items-center justify-end px-6 sm:px-10 lg:pr-[9vw] xl:pr-[11vw]">
          <div className="w-full max-w-[385px] sm:max-w-[405px]">
            <div className="bg-white rounded-[26px] shadow-2xl px-8 py-8 sm:px-9 sm:py-9 border border-white/80">
              <div className="flex justify-center mb-7">
                <div className="bg-[#048187] text-white rounded-md px-4 py-2 shadow-sm">
                  <span className="text-base sm:text-lg font-black tracking-[0.10em] uppercase whitespace-nowrap">DASH COMERCIAL SB</span>
                </div>
              </div>

              <h1 className="text-2xl font-black text-[#048187] mb-6 tracking-wide">Faça login</h1>

              {erroLogin && (
                <div className="bg-red-50 border border-red-100 text-red-600 font-bold text-sm rounded-xl p-4 mb-4">
                  {erroLogin}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="xxxxxx@mail.com"
                    value={emailLogin}
                    onChange={(e) => setEmailLogin(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-700 outline-none focus:border-[#048187] focus:ring-4 focus:ring-[#048187]/10 transition-all"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-gray-600">Senha</label>
                    <button type="button" className="text-sm font-black text-[#048187] hover:text-[#036b70]">
                      Esqueci A Senha
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={mostrarSenha ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      value={senhaLogin}
                      onChange={(e) => setSenhaLogin(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 pr-12 text-gray-700 outline-none focus:border-[#048187] focus:ring-4 focus:ring-[#048187]/10 transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#048187]"
                    >
                      {mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={carregandoLogin}
                  className="w-full bg-[#048187] text-white font-black py-3.5 rounded-lg hover:bg-[#036b70] disabled:opacity-60 transition-all shadow-lg shadow-[#048187]/20 mt-6"
                >
                  {carregandoLogin ? 'Entrando...' : 'Entrar'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-[100dvh] bg-[#f7fafb] flex overflow-hidden">
        <aside className={`${sidebarExpandida ? 'w-64' : 'w-20'} hidden md:flex bg-[#111827] text-white transition-all duration-300 flex-col relative shrink-0`}>
          <button onClick={() => setSidebarExpandida(!sidebarExpandida)} className="absolute -right-3 top-9 bg-[#5bb2b4] rounded-full p-1 z-30"><ChevronLeft size={14} className={sidebarExpandida ? '' : 'rotate-180'} /></button>
          <div className={`${sidebarExpandida ? 'justify-start gap-3 px-5' : 'justify-center px-3'} h-28 flex items-center border-b border-white/10`}>
            <div className={`${sidebarExpandida ? 'w-14 h-14' : 'w-11 h-11'} rounded-2xl bg-white/5 flex items-center justify-center shrink-0 overflow-hidden`}>
              <img
                src={logoEmpresa}
                alt={APP_NAME}
                className="w-full h-full object-contain p-1"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
            {sidebarExpandida && (
              <div className="min-w-0 leading-tight">
                <p className="text-[13px] font-black tracking-[0.12em] text-white truncate">DASH COMERCIAL</p>
                <p className="text-[18px] font-black tracking-[0.16em] text-[#5bb2b4] truncate">SB</p>
              </div>
            )}
          </div>
          <nav className={`${sidebarExpandida ? 'p-4 space-y-2' : 'p-3 space-y-2'} flex-1 overflow-y-auto`}>
            <div>
              <button
                type="button"
                onClick={alternarCanalVD}
                title="VD"
                className={`${sidebarExpandida ? 'w-full justify-between gap-3 px-4 py-3 rounded-lg' : 'w-11 h-11 mx-auto justify-center rounded-xl'} flex items-center font-black transition-colors ${canalAtual === 'VD' ? 'bg-[#048187] text-white shadow-lg shadow-[#048187]/20' : 'text-gray-300 hover:bg-white/10'}`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <IconeCanalVD size={sidebarExpandida ? 22 : 24} />
                  {sidebarExpandida && <span>VD</span>}
                </span>
                {sidebarExpandida && <ChevronRight size={16} className={`${menuVDExpandido ? 'rotate-90' : ''} transition-transform`} />}
              </button>

              {menuVDExpandido && (
                <div className={`${sidebarExpandida ? 'mt-2 ml-4 pl-3 space-y-2 border-l border-white/10' : 'mt-2 space-y-2'}`}>
                  {itensMenuVD.map((item) => {
                    if (!usuarioPodeAcessar(item.nome)) return null;
                    const Icone = item.icone;
                    const ativo = canalAtual === 'VD' && telaAtual === item.nome;
                    return (
                      <button
                        key={item.nome}
                        onClick={() => navegarParaTelaVD(item.nome)}
                        title={obterNomeAba(item.nome)}
                        className={`${sidebarExpandida ? 'w-full justify-start gap-3 px-4 py-2.5 rounded-lg text-sm' : 'w-11 h-11 mx-auto justify-center rounded-xl'} flex items-center font-bold transition-colors ${ativo ? 'bg-[#5bb2b4] text-white shadow-lg shadow-[#5bb2b4]/20' : 'text-gray-300 hover:bg-white/10'}`}
                      >
                        <Icone size={sidebarExpandida ? 18 : 22} strokeWidth={sidebarExpandida ? 2 : 2.05} />
                        {sidebarExpandida && <span>{obterNomeAba(item.nome)}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <button
                type="button"
                onClick={alternarCanalLoja}
                title="LOJA"
                className={`${sidebarExpandida ? 'w-full justify-between gap-3 px-4 py-3 rounded-lg' : 'w-11 h-11 mx-auto justify-center rounded-xl'} flex items-center font-black transition-colors ${canalAtual === 'LOJA' || telaAtual === 'Loja' ? 'bg-[#048187] text-white shadow-lg shadow-[#048187]/20' : 'text-gray-300 hover:bg-white/10'}`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <IconeCanalLoja size={sidebarExpandida ? 22 : 24} />
                  {sidebarExpandida && <span>LOJA</span>}
                </span>
                {sidebarExpandida && <ChevronRight size={16} className={`${menuLojaExpandido ? 'rotate-90' : ''} transition-transform`} />}
              </button>

              {menuLojaExpandido && (
                <div className={`${sidebarExpandida ? 'mt-2 ml-4 pl-3 space-y-2 border-l border-white/10' : 'mt-2 space-y-2'}`}>
                  {itensMenuLoja.length > 0 ? (
                    itensMenuLoja.map((item) => {
                      const Icone = item.icone;
                      const ativo = canalAtual === 'LOJA' && telaAtual === item.nome;
                      return (
                        <button
                          key={item.nome}
                          onClick={() => { setCanalAtual('LOJA'); setTelaAtual(item.nome); }}
                          title={obterNomeAba(item.nome)}
                          className={`${sidebarExpandida ? 'w-full justify-start gap-3 px-4 py-2.5 rounded-lg text-sm' : 'w-11 h-11 mx-auto justify-center rounded-xl'} flex items-center font-bold transition-colors ${ativo ? 'bg-[#5bb2b4] text-white shadow-lg shadow-[#5bb2b4]/20' : 'text-gray-300 hover:bg-white/10'}`}
                        >
                          <Icone size={sidebarExpandida ? 18 : 22} strokeWidth={sidebarExpandida ? 2 : 2.05} />
                          {sidebarExpandida && <span>{obterNomeAba(item.nome)}</span>}
                        </button>
                      );
                    })
                  ) : (
                    sidebarExpandida && (
                      <div className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-[11px] leading-relaxed text-gray-400 font-bold">
                        Subabas da LOJA serão adicionadas no próximo passo.
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </nav>
          <div className={`${sidebarExpandida ? 'p-4 space-y-3' : 'p-3 space-y-3'} border-t border-white/10`}>
            <button
              onClick={() => setTelaAtual('Perfil')}
              title="Perfil"
              className={`${sidebarExpandida ? 'w-full justify-start gap-3 px-4 py-3 rounded-lg' : 'w-11 h-11 mx-auto justify-center rounded-xl'} flex items-center font-bold ${telaAtual === 'Perfil' ? 'bg-[#5bb2b4] text-white shadow-lg shadow-[#5bb2b4]/20' : 'text-gray-300 hover:bg-white/10'}`}
            >
              <User size={sidebarExpandida ? 20 : 22} strokeWidth={sidebarExpandida ? 2 : 2.05} />
              {sidebarExpandida && <span>Perfil</span>}
            </button>
            {usuarioPodeAcessar('Configurações') && (
              <button
                onClick={() => setTelaAtual('Configurações')}
                title="Configurações"
                className={`${sidebarExpandida ? 'w-full justify-start gap-3 px-4 py-3 rounded-lg' : 'w-11 h-11 mx-auto justify-center rounded-xl'} flex items-center font-bold ${telaAtual === 'Configurações' ? 'bg-[#5bb2b4] text-white shadow-lg shadow-[#5bb2b4]/20' : 'text-gray-300 hover:bg-white/10'}`}
              >
                <Settings size={sidebarExpandida ? 20 : 22} strokeWidth={sidebarExpandida ? 2 : 2.05} />
                {sidebarExpandida && <span>Configurações</span>}
              </button>
            )}
            <button
              onClick={handleLogout}
              title="Logout"
              className={`${sidebarExpandida ? 'w-full justify-start gap-3 px-4 py-3 rounded-lg' : 'w-11 h-11 mx-auto justify-center rounded-xl'} flex items-center font-bold text-gray-300 hover:bg-red-500/20 hover:text-red-300`}
            >
              <LogOut size={sidebarExpandida ? 20 : 22} strokeWidth={sidebarExpandida ? 2 : 2.05} />
              {sidebarExpandida && <span>Logout</span>}
            </button>
          </div>
        </aside>

        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#111827] border-t border-white/10 z-40 px-2 py-2">
          <div className="flex items-center justify-around gap-1">
            {[...itensMenuVD, { nome: 'Loja', icone: LayoutDashboard }, { nome: 'Perfil', icone: User }].map((item) => {
              if (!usuarioPodeAcessar(item.nome)) return null;
              const Icone = item.icone; const ativo = telaAtual === item.nome;
              return (<button key={item.nome} onClick={() => item.nome === 'Loja' ? navegarParaLoja() : navegarParaTelaVD(item.nome)} className={`flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 min-w-0 flex-1 ${ativo ? 'bg-[#5bb2b4] text-white' : 'text-gray-300'}`}>{item.nome === 'Loja' ? <IconeCanalLoja size={18} /> : <Icone size={18} />}<span className="text-[10px] font-bold truncate max-w-full">{obterNomeAba(item.nome)}</span></button>);
            })}
          </div>
        </div>

        <div className={`fixed right-0 top-0 h-[100dvh] w-full sm:w-[28rem] bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${painelFiltrosAberto ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-5 border-b border-gray-100 bg-[#f7fafb] flex items-start justify-between shrink-0">
            <div><h3 className="text-xl font-bold text-gray-700">Filtros</h3><p className="text-sm text-gray-400">{telaAtual === 'Revendedores' ? 'Refine somente a aba Revendedores.' : 'Refine os dados do dashboard.'}</p></div>
            <button onClick={() => setPainelFiltrosAberto(false)} className="text-gray-400 hover:text-red-500 bg-white rounded-full p-2 shadow-sm"><X size={20} /></button>
          </div>
          {telaAtual === 'Revendedores' ? (
            <>
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                <GrupoFiltro cat="estruturas" tit="Estrutura" busca={buscaFiltrosRevendedores} setBusca={setBuscaFiltrosRevendedores} opc={obterOpcoesRevendedores(dadosRevendedores?.revendedores || [])} ativos={filtrosRevendedores} toggle={toggleFiltroRevendedoresArray} />
                <GrupoFiltro cat="cidades" tit="Cidade" busca={buscaFiltrosRevendedores} setBusca={setBuscaFiltrosRevendedores} opc={obterOpcoesRevendedores(dadosRevendedores?.revendedores || [])} ativos={filtrosRevendedores} toggle={toggleFiltroRevendedoresArray} />
                <GrupoFiltro cat="atividades" tit="Atividade" busca={buscaFiltrosRevendedores} setBusca={setBuscaFiltrosRevendedores} opc={obterOpcoesRevendedores(dadosRevendedores?.revendedores || [])} ativos={filtrosRevendedores} toggle={toggleFiltroRevendedoresArray} />
                <GrupoFiltro cat="papeis" tit="Papel" busca={buscaFiltrosRevendedores} setBusca={setBuscaFiltrosRevendedores} opc={obterOpcoesRevendedores(dadosRevendedores?.revendedores || [])} ativos={filtrosRevendedores} toggle={toggleFiltroRevendedoresArray} />
                <GrupoFiltro cat="inadimplentes" tit="Inadimplência" busca={buscaFiltrosRevendedores} setBusca={setBuscaFiltrosRevendedores} opc={obterOpcoesRevendedores(dadosRevendedores?.revendedores || [])} ativos={filtrosRevendedores} toggle={toggleFiltroRevendedoresArray} />
              </div>
              <div className="p-5 border-t border-gray-100 bg-white shrink-0 space-y-3">
                <button onClick={() => setPainelFiltrosAberto(false)} className="w-full bg-[#048187] text-white font-bold py-3 rounded-lg hover:bg-[#036b70]">Aplicar Filtros</button>
                <button onClick={() => { limparFiltrosRevendedores(); setPainelFiltrosAberto(false); }} className="w-full border-2 border-red-500 text-red-500 font-bold py-2.5 rounded-lg hover:bg-red-50">Remover Todos</button>
              </div>
            </>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                <div>
                  <h4 className="font-bold text-gray-600 mb-2 text-sm uppercase">Data de Captação</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input type="date" value={filtrosAtivos.data_inicio} onChange={(e) => setFiltrosAtivos({ ...filtrosAtivos, data_inicio: e.target.value })} className="w-full text-sm p-3 border border-gray-200 rounded-lg outline-none focus:border-[#048187]" />
                    <input type="date" value={filtrosAtivos.data_fim} onChange={(e) => setFiltrosAtivos({ ...filtrosAtivos, data_fim: e.target.value })} className="w-full text-sm p-3 border border-gray-200 rounded-lg outline-none focus:border-[#048187]" />
                  </div>
                </div>
                <GrupoFiltro cat="nucleos" tit="Núcleo (N1 e N2)" busca={buscaFiltros} setBusca={setBuscaFiltros} opc={opcoesFiltros} ativos={filtrosAtivos} toggle={toggleFiltroArray} />
                <GrupoFiltro cat="unidades" tit="Unidade" busca={buscaFiltros} setBusca={setBuscaFiltros} opc={opcoesFiltros} ativos={filtrosAtivos} toggle={toggleFiltroArray} />
                <GrupoFiltro cat="estruturas" tit="Estrutura" busca={buscaFiltros} setBusca={setBuscaFiltros} opc={opcoesFiltros} ativos={filtrosAtivos} toggle={toggleFiltroArray} />
                <GrupoFiltro cat="consultores" tit="Consultor" busca={buscaFiltros} setBusca={setBuscaFiltros} opc={opcoesFiltros} ativos={filtrosAtivos} toggle={toggleFiltroArray} />
                <GrupoFiltro cat="situacoes" tit="Situação Comercial" busca={buscaFiltros} setBusca={setBuscaFiltros} opc={opcoesFiltros} ativos={filtrosAtivos} toggle={toggleFiltroArray} />
              </div>
              <div className="p-5 border-t border-gray-100 bg-white shrink-0 space-y-3">
                <button onClick={handleAplicarFiltros} className="w-full bg-[#048187] text-white font-bold py-3 rounded-lg hover:bg-[#036b70]">Aplicar Filtros</button>
                <button onClick={handleRemoverFiltros} className="w-full border-2 border-red-500 text-red-500 font-bold py-2.5 rounded-lg hover:bg-red-50">Remover Todos</button>
              </div>
            </>
          )}
        </div>

        {painelFiltrosAberto && (<div className="fixed inset-0 bg-black/20 z-40" onClick={() => setPainelFiltrosAberto(false)} />)}

        <main className={`flex-1 overflow-y-auto relative transition-all duration-300 z-0 ${painelFiltrosAberto ? 'opacity-50' : 'opacity-100'}`}>
          <div className="p-4 sm:p-6 xl:p-8 pb-24 md:pb-8">
            <header className="mb-6 xl:mb-8 w-full bg-[#5bb2b4] min-h-12 rounded-full flex justify-between items-center px-4 sm:px-6 text-white shadow-sm gap-4">
              <span className="bg-white text-[#048187] font-extrabold text-xs sm:text-sm px-4 py-1 rounded-full uppercase tracking-wide whitespace-nowrap">
                {cicloTopoAtual ? `CICLO ${cicloTopoAtual}` : 'SEM CICLO'}
              </span>
              <div className="flex items-center gap-3 sm:gap-5 min-w-0">
                {(telaAtual === 'Dashboard' || telaAtual === 'Metas' || telaAtual === 'Ranking' || telaAtual === 'Comparativo' || telaAtual === 'Revendedores') && (
                  <button onClick={() => setPainelFiltrosAberto(true)} className="flex items-center gap-2 hover:bg-[#4a9394] px-3 py-1.5 rounded-full font-medium">
                    <SlidersHorizontal size={18} /><span className="hidden sm:inline">Filtros</span>
                  </button>
                )}
                <div className="hidden sm:block w-px h-6 bg-[#4a9394]" />
                <button onClick={() => setTelaAtual('Perfil')} className="flex items-center gap-2 hover:bg-[#4a9394] px-3 py-1.5 rounded-full min-w-0">
                  <UserCircle size={24} strokeWidth={1.5} className="shrink-0" />
                  <span className="text-sm font-medium truncate max-w-[110px] sm:max-w-[220px]">{usuarioLogado.nome}</span>
                </button>
              </div>
            </header>
            {renderContent()}
          </div>
        </main>
      </div>

      {modalValorExpandido.aberto && (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h3 className="text-2xl font-bold text-gray-700">{modalValorExpandido.titulo}</h3>
                {modalValorExpandido.descricao && (<p className="mt-1 text-sm text-gray-400">{modalValorExpandido.descricao}</p>)}
              </div>
              <button type="button" onClick={fecharModalValExp} className="w-10 h-10 rounded-full hover:bg-gray-50 text-gray-400 flex items-center justify-center"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-2xl bg-[#f8fbfc] border border-gray-100 p-6">
                <p className="text-sm font-bold uppercase tracking-wide text-gray-400">Valor completo</p>
                <h4 className="mt-3 text-4xl font-extrabold text-[#048187] break-words">{modalValorExpandido.valorTexto}</h4>
              </div>
              {Array.isArray(modalValorExpandido.detalhes) && modalValorExpandido.detalhes.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {modalValorExpandido.detalhes.map((item) => (
                    <div key={item.label} className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-wide">{item.label}</p>
                      <p className="mt-1 text-lg font-black text-gray-700">{item.valor}</p>
                    </div>
                  ))}
                </div>
              )}
              {modalValorExpandido.formula && (
                <div className="rounded-xl bg-[#e6f6f7] border border-[#ccecee] p-4">
                  <p className="text-[10px] font-black uppercase text-[#048187] tracking-wide">Cálculo</p>
                  <p className="mt-1 text-lg font-black text-[#048187] break-words">{modalValorExpandido.formula}</p>
                </div>
              )}
            </div>
            <div className="px-6 pb-6"><button type="button" onClick={fecharModalValExp} className="w-full rounded-xl bg-[#048187] hover:bg-[#036b70] text-white font-bold py-3 transition">Fechar</button></div>
          </div>
        </div>
      )}

      {modalDetalhes && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center px-4"><div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col"><div className="flex items-start justify-between p-5 sm:p-6 border-b border-gray-100 shrink-0"><div><h2 className="text-lg sm:text-xl font-bold text-gray-700">{modalDetalhes.titulo}</h2><p className="text-sm text-gray-400 mt-1 leading-relaxed">{modalDetalhes.subtitulo}</p></div><button onClick={() => setModalDetalhes(null)} className="text-gray-400 hover:text-red-500 bg-gray-50 rounded-full p-2 shrink-0"><X size={20} /></button></div><div className="p-5 sm:p-6 space-y-5 overflow-y-auto"><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{modalDetalhes.itens.map((item) => (<div key={item.label} className="bg-[#fcfbf7] border border-gray-100 rounded-xl p-4 min-w-0"><p className="text-xs font-bold uppercase text-gray-400 mb-1">{item.label}</p><p className="text-xl sm:text-2xl font-bold text-[#048187] whitespace-nowrap overflow-hidden text-ellipsis">{item.valor}</p></div>))}</div>{modalDetalhes.tipo === 'tendencia' && modalDetalhes.plano && (<div className={`rounded-2xl border p-5 ${modalDetalhes.plano.status === 'risco' ? 'bg-red-50/70 border-red-100' : 'bg-green-50/70 border-green-100'}`}><div className="flex items-start gap-3 mb-4"><div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${modalDetalhes.plano.status === 'risco' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>{modalDetalhes.plano.status === 'risco' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}</div><div><h3 className="text-base sm:text-lg font-black text-gray-700">{modalDetalhes.plano.titulo}</h3><p className="text-sm text-gray-600 mt-1 leading-relaxed">{modalDetalhes.plano.resumo}</p></div></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">{modalDetalhes.plano.cards.map((card) => (<div key={card.label} className="bg-white/80 rounded-xl border border-white p-3 shadow-sm"><p className="text-[10px] font-black uppercase text-gray-400 mb-1">{card.label}</p><p className="text-base font-black text-[#048187]">{card.valor}</p></div>))}</div><div className="bg-white/80 rounded-xl border border-white p-4"><h4 className="text-xs font-black uppercase text-gray-500 mb-3 flex items-center gap-2"><Sparkles size={15} className="text-[#048187]" /> Sugestão inteligente</h4><ul className="space-y-2">{modalDetalhes.plano.sugestoes.map((sugestao, idx) => (<li key={idx} className="flex items-start gap-2 text-sm text-gray-600 leading-relaxed"><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#048187] shrink-0" /> <span>{sugestao}</span></li>))}</ul></div></div>)}{modalDetalhes.tipo === 'cancelados' && (<div className="bg-[#fcfbf7] border border-gray-100 rounded-xl p-5"><h3 className="text-lg font-bold text-gray-700 mb-4">Motivos dos Cancelamentos</h3>{modalDetalhes.motivos_cancelamento?.length > 0 ? (<div className="overflow-x-auto"><table className="w-full text-sm min-w-[680px]"><thead><tr className="text-left text-gray-500 border-b border-gray-200"><th className="py-3">Motivo</th><th className="py-3 text-right">Pedidos</th><th className="py-3 text-right">%</th><th className="py-3 text-right">Valor líquido</th></tr></thead><tbody>{modalDetalhes.motivos_cancelamento.map((item) => (<tr key={item.motivo} className="border-b border-gray-100"><td className="py-3 font-medium text-gray-700">{item.motivo}</td><td className="py-3 text-right text-gray-600">{item.quantidade}</td><td className="py-3 text-right text-gray-600">{Number(item.percentual || 0).toFixed(2)}%</td><td className="py-3 text-right font-bold text-[#048187]">{formatarMoeda(item.valor_liquido || 0)}</td></tr>))}</tbody></table></div>) : (<div className="h-40 flex items-center justify-center text-gray-400 text-sm">Nenhum motivo de cancelamento.</div>)}</div>)}</div><div className="p-5 sm:p-6 border-t border-gray-100 shrink-0"><button onClick={() => setModalDetalhes(null)} className="w-full bg-[#048187] text-white font-bold py-3 rounded-xl hover:bg-[#036b70]">Fechar</button></div></div></div>
      )}

      {modalMetasReaisAberto && (
        <ModalMetasReais
          aberto={modalMetasReaisAberto}
          onClose={() => setModalMetasReaisAberto(false)}
          apiUrl={API_URL}
          cicloPadrao={dados?.ciclo_atual || ciclos.find((c) => c.status_ciclo === 'ativo')?.ciclo || ''}
          onAtualizacao={atualizarTelasAposMudancaBanco}
        />
      )}

      {modalCriarConsultorAberto && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center px-4"><div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"><div className="flex items-start justify-between p-6 border-b border-gray-100"><div><h2 className="text-xl font-bold text-gray-700">Novo consultor</h2></div><button onClick={() => setModalCriarConsultorAberto(false)} className="text-gray-400 hover:bg-gray-50 rounded-full p-2"><X size={20} /></button></div><form onSubmit={salvarNovoConsultor} className="p-6 space-y-4"><div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">ID Colaborador</label><input type="text" value={novoConsultor.id_colaborador} onChange={(e) => setNovoConsultor({...novoConsultor, id_colaborador: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187]" required /></div><div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Nome cadastral</label><input type="text" value={novoConsultor.nome} onChange={(e) => setNovoConsultor({...novoConsultor, nome: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187]" required /></div></div><div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Nome social</label><input type="text" value={novoConsultor.nome_social || ''} onChange={(e) => setNovoConsultor({...novoConsultor, nome_social: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187]" placeholder="Preencha somente se houver" /></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Estrutura</label><input type="text" value={novoConsultor.estrutura} onChange={(e) => setNovoConsultor({...novoConsultor, estrutura: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187]" required /></div><div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Canal</label><input type="text" value={novoConsultor.canal} onChange={(e) => setNovoConsultor({...novoConsultor, canal: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187]" /></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Status</label><select value={novoConsultor.status_consultor} onChange={(e) => setNovoConsultor({...novoConsultor, status_consultor: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187]"><option value="ativo">Ativo</option><option value="inativo">Inativo</option><option value="ferias">Férias</option></select></div><div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Peso Meta (%)</label><input type="number" step="0.01" value={novoConsultor.peso_meta} onChange={(e) => setNovoConsultor({...novoConsultor, peso_meta: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187]" /></div></div><div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setModalCriarConsultorAberto(false)} className="px-5 py-3 rounded-lg border border-gray-200 text-gray-500 font-bold hover:bg-gray-50">Cancelar</button><button type="submit" className="px-5 py-3 rounded-lg bg-[#048187] text-white font-bold hover:bg-[#036b70]">Criar Consultor</button></div></form></div></div>
      )}

      {modalEditarConsultorAberto && consultorEditando && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center px-4"><div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"><div className="flex items-start justify-between p-6 border-b border-gray-100"><div><h2 className="text-xl font-bold text-gray-700">Editar consultor</h2></div><button onClick={() => setModalEditarConsultorAberto(false)} className="text-gray-400 hover:bg-gray-50 rounded-full p-2"><X size={20} /></button></div><form onSubmit={salvarEdicaoConsultor} className="p-6 space-y-4"><div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">ID Colaborador</label><input type="text" value={consultorEditando.id_colaborador || ''} onChange={(e) => setConsultorEditando({...consultorEditando, id_colaborador: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#048187]" /></div><div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Nome cadastral</label><input type="text" value={consultorEditando.nome} onChange={(e) => setConsultorEditando({...consultorEditando, nome: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#048187]" required /></div></div><div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Nome social</label><input type="text" value={consultorEditando.nome_social || ''} onChange={(e) => setConsultorEditando({...consultorEditando, nome_social: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#048187]" placeholder="Preencha somente se houver" /></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Estrutura</label><input type="text" value={consultorEditando.estrutura} onChange={(e) => setConsultorEditando({...consultorEditando, estrutura: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#048187]" required /></div><div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Canal</label><input type="text" value={consultorEditando.canal} onChange={(e) => setConsultorEditando({...consultorEditando, canal: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#048187]" /></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Status</label><select value={consultorEditando.status_consultor} onChange={(e) => setConsultorEditando({...consultorEditando, status_consultor: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#048187]"><option value="ativo">Ativo</option><option value="inativo">Inativo</option><option value="ferias">Férias</option></select></div><div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Peso Meta (%)</label><input type="number" step="0.01" value={consultorEditando.peso_meta} onChange={(e) => setConsultorEditando({...consultorEditando, peso_meta: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#048187]" /></div></div><div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setModalEditarConsultorAberto(false)} className="px-5 py-3 rounded-lg border border-gray-200 text-gray-500 font-bold hover:bg-gray-50">Cancelar</button><button type="submit" className="px-5 py-3 rounded-lg bg-[#048187] text-white font-bold hover:bg-[#036b70]">Salvar alterações</button></div></form></div></div>
      )}

      {modalExcluirConsultorAberto && consultorParaExcluir && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center px-4"><div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6"><h2 className="text-xl font-bold text-gray-700 mb-4">Excluir consultor?</h2><p className="text-gray-600 mb-6">{obterNomeExibicaoConsultor(consultorParaExcluir)}</p><div className="flex justify-end gap-3"><button onClick={() => setModalExcluirConsultorAberto(false)} className="px-5 py-2 rounded-lg border border-gray-200 text-gray-500 font-bold hover:bg-gray-50">Cancelar</button><button onClick={confirmarExclusaoConsultor} className="bg-red-500 text-white px-5 py-2 rounded-lg font-bold hover:bg-red-600">Excluir</button></div></div></div>
      )}
      
      {modalEditarCicloAberto && cicloEditando && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center px-4"><div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"><div className="flex items-start justify-between p-6 border-b border-gray-100"><div><h2 className="text-xl font-bold text-gray-700">Editar ciclo</h2></div><button onClick={() => setModalEditarCicloAberto(false)} className="text-gray-400 hover:bg-gray-50 rounded-full p-2"><X size={20} /></button></div><div className="p-6"><form onSubmit={salvarEdicaoCiclo} className="space-y-4"><input type="text" value={cicloEditando.ciclo} onChange={e=>setCicloEditando({...cicloEditando, ciclo: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-[#048187]" required /><div className="grid grid-cols-2 gap-4"><input type="date" value={cicloEditando.data_inicio} onChange={e=>setCicloEditando({...cicloEditando, data_inicio: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-[#048187]" required /><input type="date" value={cicloEditando.data_fim} onChange={e=>setCicloEditando({...cicloEditando, data_fim: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-[#048187]" required /></div><div className="grid grid-cols-2 gap-4"><input type="number" value={cicloEditando.meta_ciclo} onChange={e=>setCicloEditando({...cicloEditando, meta_ciclo: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-[#048187]" required /><select value={cicloEditando.status_ciclo} onChange={e=>setCicloEditando({...cicloEditando, status_ciclo: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-[#048187]"><option value="ativo">Ativo</option><option value="inativo">Inativo</option></select></div><div className="flex justify-end gap-3 pt-4"><button type="submit" className="bg-[#048187] text-white px-5 py-2 rounded-lg font-bold">Salvar alterações</button></div></form></div></div></div>
      )}

      {modalExcluirCicloAberto && cicloParaExcluir && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center px-4"><div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6"><h2 className="text-xl font-bold text-gray-700 mb-4">Excluir ciclo?</h2><p className="text-gray-600 mb-6">{cicloParaExcluir.ciclo}</p><div className="flex justify-end gap-3"><button onClick={() => setModalExcluirCicloAberto(false)} className="px-5 py-2 rounded-lg border border-gray-200 text-gray-500 font-bold hover:bg-gray-50">Cancelar</button><button onClick={confirmarExclusaoCiclo} className="bg-red-500 text-white px-5 py-2 rounded-lg font-bold hover:bg-red-600">Excluir</button></div></div></div>
      )}

      {modalPermissoesAberto && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center px-4"><div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"><div className="flex items-start justify-between p-6 border-b border-gray-100"><div><h2 className="text-xl font-bold text-gray-700">Configurar Permissões</h2><p className="text-sm text-gray-400 mt-1">Marque as abas que cada perfil pode acessar.</p></div><button onClick={() => setModalPermissoesAberto(false)} className="text-gray-400 hover:bg-gray-50 rounded-full p-2"><X size={20} /></button></div><div className="flex border-b border-gray-100"><button onClick={() => setPerfilEditando('admin')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${perfilEditando === 'admin' ? 'border-[#048187] text-[#048187]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Admin</button><button onClick={() => setPerfilEditando('gestor')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${perfilEditando === 'gestor' ? 'border-[#048187] text-[#048187]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Gestor</button><button onClick={() => setPerfilEditando('visualizador')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${perfilEditando === 'visualizador' ? 'border-[#048187] text-[#048187]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Visualizador</button></div><div className="p-6"><div className="grid grid-cols-2 gap-3">{ABAS_SISTEMA.map((aba) => { const travado = perfilEditando === 'admin' && (aba === 'Configurações' || aba === 'Perfil'); return (<label key={aba} className={`flex items-center gap-3 p-3 rounded-lg border ${travado ? 'bg-gray-50 border-gray-100 cursor-not-allowed opacity-60' : 'bg-white border-gray-200 cursor-pointer hover:border-[#048187]'}`}><input type="checkbox" checked={permissoesTemporarias[perfilEditando]?.includes(aba) || false} onChange={() => togglePermissaoTemporaria(perfilEditando, aba)} disabled={travado} className="w-4 h-4 accent-[#048187]" /><span className="text-sm font-bold text-gray-700">{obterNomeAba(aba)}</span></label>); })}</div></div><div className="flex justify-end gap-3 p-6 border-t border-gray-100"><button onClick={() => setModalPermissoesAberto(false)} className="px-5 py-2 rounded-lg border border-gray-200 text-gray-500 font-bold hover:bg-gray-50">Cancelar</button><button onClick={salvarPermissoes} className="px-5 py-2 rounded-lg bg-[#048187] text-white font-bold hover:bg-[#036b70]">Salvar Permissões</button></div></div></div>
      )}
      
      {modalEditarUsuarioAberto && usuarioEditando && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center px-4"><div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"><div className="flex items-start justify-between p-6 border-b border-gray-100"><div><h2 className="text-xl font-bold text-gray-700">Editar usuário</h2></div><button onClick={() => setModalEditarUsuarioAberto(false)} className="text-gray-400 hover:bg-gray-50 rounded-full p-2"><X size={20} /></button></div><form onSubmit={salvarEdicaoUsuario} className="p-6 space-y-4"><div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Nome</label><input type="text" value={usuarioEditando.nome} onChange={(e) => setUsuarioEditando({...usuarioEditando, nome: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#048187]" required /></div><div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Perfil</label><select value={usuarioEditando.perfil} onChange={(e) => setUsuarioEditando({...usuarioEditando, perfil: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#048187]"><option value="admin">Admin</option><option value="gestor">Gestor</option><option value="visualizador">Visualizador</option></select></div><div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Status</label><select value={usuarioEditando.status_usuario} onChange={(e) => setUsuarioEditando({...usuarioEditando, status_usuario: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#048187]"><option value="ativo">Ativo</option><option value="inativo">Inativo</option></select></div></div><div className="flex justify-end gap-3 pt-4"><button type="submit" className="bg-[#048187] text-white px-5 py-2 rounded-lg font-bold">Salvar alterações</button></div></form></div></div>
      )}

      {modalExcluirUsuarioAberto && usuarioParaExcluir && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center px-4"><div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6"><h2 className="text-xl font-bold text-gray-700 mb-4">Excluir usuário?</h2><p className="text-gray-600 mb-6">{usuarioParaExcluir.nome}</p><div className="flex justify-end gap-3"><button onClick={() => setModalExcluirUsuarioAberto(false)} className="px-5 py-2 rounded-lg border border-gray-200 text-gray-500 font-bold hover:bg-gray-50">Cancelar</button><button onClick={confirmarExclusaoUsuario} className="bg-red-500 text-white px-5 py-2 rounded-lg font-bold hover:bg-red-600">Excluir</button></div></div></div>
      )}
    </>
  );
}