import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, PieChart, Pie, Cell, BarChart, Bar, Tooltip, CartesianGrid, LabelList, Legend } from 'recharts';
import { Eye, EyeOff, UserCircle, LayoutDashboard, SlidersHorizontal, ChevronLeft, ChevronRight, X, BarChart2, Users, Database, Settings, LogOut, User, Save, Plus, ShieldCheck, KeyRound, Trash2, Pencil, TrendingUp, TrendingDown, Target, RefreshCcw, BadgeDollarSign, Sparkles, Scissors, AlertCircle, CheckCircle, Upload, Search, CalendarDays, FileSpreadsheet, Scale, Trophy, ArrowUpRight, ArrowDownRight, Medal, Maximize2, Minimize2 } from 'lucide-react';
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

const CLASSE_INPUT_CADASTRO_LOJA = "w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-700 outline-none focus:border-[#048187] focus:ring-4 focus:ring-[#048187]/10 transition-all font-bold bg-white";

const CampoLojaCadastroLoja = React.memo(({ label, value, onChange, placeholder, type = 'text', disabled = false }) => (
  <div>
    <label className="block text-[10px] font-black uppercase tracking-wide text-gray-400 mb-1.5">{label}</label>
    <input
      type={type}
      inputMode={type === 'number' ? 'decimal' : undefined}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      autoComplete="off"
      className={`${CLASSE_INPUT_CADASTRO_LOJA} ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
    />
  </div>
));

const SelectLojaCadastroLoja = React.memo(({ label, value, onChange, children }) => (
  <div>
    <label className="block text-[10px] font-black uppercase tracking-wide text-gray-400 mb-1.5">{label}</label>
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className={CLASSE_INPUT_CADASTRO_LOJA}
    >
      {children}
    </select>
  </div>
));


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
  admin: ['Dashboard', 'Metas', 'N1', 'N2', 'N3', 'Ranking', 'Comparativo', 'Ações', 'Histórico', 'Revendedores', 'Cadastro', 'Base', 'Loja', 'LojaVisaoGeral', 'LojaCadastro', 'LojaUnidades', 'LojaConsultoras', 'LojaRanking', 'ADM', 'Configurações', 'Perfil'],
  gestor: ['Dashboard', 'Metas', 'N1', 'N2', 'N3', 'Ranking', 'Comparativo', 'Ações', 'Histórico', 'Revendedores', 'Cadastro', 'Perfil'],
  visualizador: ['Dashboard', 'Metas', 'N1', 'N2', 'N3', 'Ranking', 'Comparativo', 'Histórico', 'Revendedores', 'Perfil']
};

const obterNomeAba = (nome) => ({
  Dashboard: 'Visão Geral',
  Metas: 'Metas Estruturas',
  N1: 'N1',
  N2: 'N2',
  Loja: 'LOJA',
  LojaVisaoGeral: 'Visão Geral',
  LojaCadastro: 'Cadastro',
  LojaUnidades: 'Unidades',
  LojaConsultoras: 'Consultoras',
  LojaRanking: 'Ranking',
  ADM: 'Painel ADM',
}[nome] || nome);


const ABAS_SISTEMA = ['Dashboard', 'Metas', 'N1', 'N2', 'N3', 'Ranking', 'Comparativo', 'Ações', 'Histórico', 'Revendedores', 'Cadastro', 'Base', 'Loja', 'LojaVisaoGeral', 'LojaCadastro', 'LojaUnidades', 'LojaConsultoras', 'LojaRanking', 'ADM', 'Configurações', 'Perfil'];
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

  // Garante que abas importantes continuem aparecendo mesmo quando as permissões antigas já estavam salvas no banco.
  PERFIS_SISTEMA.forEach((perfil) => {
    if (!normalizadas[perfil].includes('Histórico')) normalizadas[perfil].push('Histórico');
  });

  // Ações é uma aba de gestão operacional. Libera por padrão para admin e gestor.
  ['admin', 'gestor'].forEach((perfil) => {
    if (!normalizadas[perfil].includes('Ações')) normalizadas[perfil].push('Ações');
  });

  // Cadastro precisa ficar disponível para admin e gestor.
  // Sem essa migração, permissões antigas salvas no banco podem esconder a aba no menu.
  ['admin', 'gestor'].forEach((perfil) => {
    if (!normalizadas[perfil].includes('Cadastro')) normalizadas[perfil].push('Cadastro');
  });

  // LOJA: garante subabas para admin mesmo se a configuração antiga não tinha essas permissões.
  ['Loja', 'LojaVisaoGeral', 'LojaUnidades', 'LojaConsultoras', 'LojaRanking', 'LojaCadastro'].forEach((abaLoja) => {
    if (!normalizadas.admin.includes(abaLoja)) normalizadas.admin.push(abaLoja);
  });

  // O admin nunca pode perder acesso à própria tela de configuração/perfil.
  ['ADM', 'Configurações', 'Perfil'].forEach((abaObrigatoria) => {
    if (!normalizadas.admin.includes(abaObrigatoria)) {
      normalizadas.admin.push(abaObrigatoria);
    }
  });

  return normalizadas;
};


const normalizarListaPermissoesUsuario = (abas = [], perfil = 'visualizador') => {
  const listaBase = Array.isArray(abas) ? abas : (permissoesPadrao[perfil] || permissoesPadrao.visualizador || []);
  const migradas = listaBase.map((aba) => aba === 'Consultores' ? 'Cadastro' : aba);
  const normalizadas = Array.from(new Set(migradas.filter((aba) => ABAS_SISTEMA.includes(aba))));

  if (!normalizadas.includes('Perfil')) normalizadas.push('Perfil');

  if (perfil === 'admin') {
    ['ADM', 'Configurações', 'Perfil'].forEach((abaObrigatoria) => {
      if (!normalizadas.includes(abaObrigatoria)) normalizadas.push(abaObrigatoria);
    });
  }

  return normalizadas;
};

const filtroVazio = { nucleos: [], unidades: [], estruturas: [], consultores: [], situacoes: [], meios_captacao: [], modelos_comerciais: [], canais_venda: [], data_inicio: '', data_fim: '' };
const buscaFiltrosVazia = { nucleos: '', unidades: '', estruturas: '', consultores: '', situacoes: '', meios_captacao: '', modelos_comerciais: '', canais_venda: '' };
const cicloFormVazio = { ciclo: '', data_inicio: '', data_fim: '', meta_ciclo: '', status_ciclo: 'ativo' };
const consultorVazio = { id_colaborador: '', nome: '', nome_social: '', estrutura: '', canal: 'ESPAÇO DO REVENDEDOR', status_consultor: 'ativo', peso_meta: 0 };
const estruturaConfigVazia = { cod_estrutura: '', estrutura: '', canal: 'VD', nucleo: 'NUCLEO 1', tipo_estrutura: 'estrutura', status: 'ativo' };

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
const formatarMoedaCompactaCard = (v) => {
  const n = Number(v || 0);
  const a = Math.abs(n);
  const s = n < 0 ? '-' : '';
  if (a >= 1000000) return `${s}R$${(a / 1000000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Mi`;
  if (a >= 1000) return `${s}R$${(a / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Mil`;
  return `${s}${formatarMoeda(a)}`;
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
  const [expandido, setExpandido] = useState(false);
  const ordenados = [...(dados || [])].sort((a, b) => Number(b[propValor] || 0) - Number(a[propValor] || 0));
  const lista = expandido ? ordenados : ordenados.slice(0, 5);
  const total = ordenados.length;

  return (
    <div className={`bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col min-w-0 transition-all hover:shadow-md ${expandido ? 'h-auto' : 'h-full'}`}>
      <div className="flex items-center justify-between gap-3 mb-4 border-b border-gray-100 pb-2 min-w-0">
        <h3 className="text-xs font-bold text-gray-500 uppercase truncate">{titulo}</h3>

        {total > 5 && (
          <button
            type="button"
            onClick={() => setExpandido((atual) => !atual)}
            className="shrink-0 rounded-lg bg-[#e6f6f7] px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-[#048187] hover:bg-[#d0f0f1] transition-colors"
          >
            {expandido ? 'Ver menos' : 'Ver completo'}
          </button>
        )}
      </div>

      <div className={`space-y-3.5 flex-1 pr-1 ${expandido ? 'max-h-[520px] overflow-y-auto' : ''}`} style={expandido ? { scrollbarWidth: 'thin', scrollbarColor: '#ccecee transparent' } : undefined}>
        {lista.map((c, i) => {
          const posicaoReal = i + 1;
          const trend = obterTendenciaVisual(c.id_colaborador);
          const subtituloBase = c.estrutura || '';
          const subtituloExtra = propSubValor ? `${subLabel || ''}${subFormatter ? subFormatter(c[propSubValor]) : c[propSubValor]}` : '';
          const subtitulo = subtituloExtra ? `${subtituloBase} • ${subtituloExtra}` : subtituloBase;
          return (
            <div key={`${c.id_colaborador || c.nome || c.estrutura || titulo}-${i}`} className="flex justify-between items-center min-w-0 gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0">{posicaoReal}</span>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-gray-700 truncate" title={obterNomeExibicaoConsultor(c)}>{obterNomeExibicaoConsultor(c)}</span>
                  <span className="text-[9px] text-gray-400 truncate" title={subtitulo}>{subtitulo}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-black text-sm truncate" style={{ color: corValor }}>{formatter(c[propValor])}</span>
                {trend.val > 0 ? (trend.up ? <ArrowUpRight size={14} className="text-green-500" /> : <ArrowDownRight size={14} className="text-red-500" />) : (<span className="w-3.5"></span>)}
              </div>
            </div>
          );
        })}
      </div>

      {expandido && total > 5 && (
        <div className="mt-4 rounded-lg bg-gray-50 px-3 py-2 text-[10px] font-bold text-gray-400 text-center">
          Exibindo lista completa: {total} registros
        </div>
      )}
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
  <form onSubmit={onSub} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
    <input type="text" placeholder="Ciclo. Ex: 09/2026" value={form.ciclo} onChange={(e) => setForm({ ...form, ciclo: e.target.value })} className="border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187]" required />
    <input type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} className="border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187]" required />
    <input type="date" value={form.data_fim} onChange={(e) => setForm({ ...form, data_fim: e.target.value })} className="border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187]" required />
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

const FiltroRapidoNucleos = ({ filtrosAtivos, onSelecionar, opcoesNucleos = [] }) => {
  const nucleosSelecionados = filtrosAtivos?.nucleos || [];
  const filtroSelecionado = nucleosSelecionados.length === 1 ? nucleosSelecionados[0] : 'TODOS';
  const normalizarBotaoNucleo = (valor) => {
    const texto = String(valor || '').toUpperCase().replace('Ú', 'U').trim();
    const match = texto.match(/(\d+)/);
    return match ? `N${match[1]}` : texto;
  };
  const nucleosDisponiveis = Array.from(new Set([...(opcoesNucleos || []), 'NUCLEO 1', 'NUCLEO 2', 'NUCLEO 3']))
    .filter(Boolean)
    .sort((a, b) => {
      const na = Number(String(a).match(/\d+/)?.[0] || 99);
      const nb = Number(String(b).match(/\d+/)?.[0] || 99);
      return na - nb;
    });
  const botoes = [
    { label: 'TODOS', valor: 'TODOS' },
    ...nucleosDisponiveis.map((n) => ({ label: normalizarBotaoNucleo(n), valor: n }))
  ];

  return (
    <div className="flex bg-gray-100 p-1 rounded-lg shrink-0 overflow-x-auto max-w-full">
      {botoes.map((botao) => (
        <button
          key={botao.valor}
          type="button"
          onClick={() => onSelecionar(botao.valor)}
          className={`px-4 sm:px-5 py-2 rounded-md text-xs font-black transition-colors whitespace-nowrap ${filtroSelecionado === botao.valor ? 'bg-[#048187] text-white shadow' : 'text-[#048187] hover:bg-white hover:text-[#036b70]'}`}
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

function ModalMetasReais({ aberto, onClose, apiUrl, cicloPadrao = '', onAtualizacao, modoInline = false }) {
  const [metas, setMetas] = useState([]);
  const [estruturas, setEstruturas] = useState([]);
  const [estruturasConfigMeta, setEstruturasConfigMeta] = useState([]);
  const [busca, setBusca] = useState('');
  const [form, setForm] = useState({ ...metaRealVazia, ciclo: cicloPadrao || '' });
  const [editandoId, setEditandoId] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [salvandoTabela, setSalvandoTabela] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [avisoEstrutura, setAvisoEstrutura] = useState(null);
  const [mostrarListaEstruturasMeta, setMostrarListaEstruturasMeta] = useState(false);
  const [mostrarFormularioMeta, setMostrarFormularioMeta] = useState(false);
  const [modoTabelaCiclo, setModoTabelaCiclo] = useState(false);
  const [linhasNovoCiclo, setLinhasNovoCiclo] = useState([]);
  const [metaExpandidaId, setMetaExpandidaId] = useState(null);
  const [metaLinhaEditandoId, setMetaLinhaEditandoId] = useState(null);
  const [linhaEditandoMeta, setLinhaEditandoMeta] = useState(null);
  const [salvandoLinhaMeta, setSalvandoLinhaMeta] = useState(false);
  const [filtroNucleoMetas, setFiltroNucleoMetas] = useState('Todos');
  const [cadastroMetasVdExpandido, setCadastroMetasVdExpandido] = useState(false);

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

  const carregarEstruturasConfigMeta = async () => {
    try {
      const { data } = await axios.get(`${apiUrl}/estruturas-config`);
      setEstruturasConfigMeta(data.estruturas || []);
    } catch (e) {
      setEstruturasConfigMeta([]);
    }
  };

  useEffect(() => {
    if (!aberto) return;
    setForm((atual) => ({ ...atual, ciclo: atual.ciclo || cicloPadrao || '' }));
    carregarMetas();
    carregarEstruturas();
    carregarEstruturasConfigMeta();
  }, [aberto]);

  useEffect(() => {
    if (!avisoEstrutura) return;
    const timer = setTimeout(() => setAvisoEstrutura(null), 3500);
    return () => clearTimeout(timer);
  }, [avisoEstrutura]);

  const opcoesEstruturasCadastro = (estruturasConfigMeta.length ? estruturasConfigMeta : estruturas)
    .map((item) => ({
      cod_estrutura: String(item.cod_estrutura || String(item.estrutura || '').split('-')[0] || '').trim(),
      estrutura: String(item.estrutura || '').trim(),
      canal: item.canal || 'VD',
      nucleo: item.nucleo || item.núcleo || 'NUCLEO 1',
      tipo_estrutura: item.tipo_estrutura || 'estrutura',
      status: item.status || 'ativo'
    }))
    .filter((item) => item.estrutura && !['excluido', 'excluído'].includes(String(item.status || '').toLowerCase()))
    .sort((a, b) => `${a.nucleo}-${a.estrutura}`.localeCompare(`${b.nucleo}-${b.estrutura}`));

  const limparForm = (cicloManter = null) => {
    setEditandoId(null);
    setForm({ ...metaRealVazia, ciclo: cicloManter || cicloPadrao || form.ciclo || '' });
    setBusca('');
    setAvisoEstrutura(null);
    setMostrarListaEstruturasMeta(false);
    setMostrarFormularioMeta(false);
    setMetaLinhaEditandoId(null);
    setLinhaEditandoMeta(null);
  };

  const normalizarEstruturaMeta = (valor) => String(valor || '').trim().toLowerCase();
  const estruturaJaSelecionada = (estrutura) => form.estruturas.some((e) => normalizarEstruturaMeta(e.estrutura) === normalizarEstruturaMeta(estrutura));

  const estruturaJaCadastradaEmMeta = (estrutura, codEstrutura = '') => {
    const estruturaNormalizada = normalizarEstruturaMeta(estrutura);
    const codNormalizado = normalizarEstruturaMeta(codEstrutura || String(estrutura || '').split('-')[0]);

    return metas.some((meta) => {
      if (editandoId && String(meta.id) === String(editandoId)) return false;

      return (meta.estruturas || []).some((item) => {
        const estruturaItem = normalizarEstruturaMeta(item.estrutura);
        const codItem = normalizarEstruturaMeta(item.cod_estrutura || String(item.estrutura || '').split('-')[0]);

        return estruturaItem === estruturaNormalizada || (!!codNormalizado && codItem === codNormalizado);
      });
    });
  };

  const notificarEstruturaDuplicada = (estrutura = '') => {
    setAvisoEstrutura({
      tipo: 'erro',
      texto: 'Estrutura já está cadastrada!',
      detalhe: estrutura ? `A estrutura ${estrutura} já está vinculada em uma meta real deste ciclo.` : ''
    });
  };

  const notificarEstruturaAdicionada = (estrutura = '') => {
    setAvisoEstrutura({
      tipo: 'sucesso',
      texto: 'Estrutura cadastrada!',
      detalhe: estrutura ? `${estrutura} foi vinculada à nova meta.` : ''
    });
  };

  const adicionarEstrutura = (item) => {
    const estrutura = String(item.estrutura || '').trim();
    const cod = String(item.cod_estrutura || estrutura.split('-')[0] || '').trim();

    if (!estrutura) return;

    if (estruturaJaSelecionada(estrutura) || estruturaJaCadastradaEmMeta(estrutura, cod)) {
      notificarEstruturaDuplicada(estrutura);
      return;
    }

    setForm((atual) => ({
      ...atual,
      estruturas: [...atual.estruturas, { cod_estrutura: cod, estrutura }]
    }));
    setBusca('');
    setMostrarListaEstruturasMeta(false);
    notificarEstruturaAdicionada(estrutura);
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
    setModoTabelaCiclo(false);
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
    setMostrarFormularioMeta(true);
  };

  const formatarNucleoCurtoMeta = (valor = '') => {
    const texto = String(valor || '').toUpperCase();
    if (texto.includes('3')) return 'N3';
    if (texto.includes('2')) return 'N2';
    return 'N1';
  };

  const normalizarNucleoMeta = (valor = '') => {
    const texto = String(valor || '').toUpperCase();
    if (texto.includes('3')) return 'NUCLEO 3';
    if (texto.includes('2')) return 'NUCLEO 2';
    return 'NUCLEO 1';
  };

  const encontrarConfigDaMeta = (meta) => {
    const primeira = (meta.estruturas || [])[0] || {};
    const estruturaMeta = String(primeira.estrutura || '').trim();
    const codMeta = String(primeira.cod_estrutura || estruturaMeta.split('-')[0] || '').trim();

    return opcoesEstruturasCadastro.find((item) => {
      const estruturaIgual = normalizarEstruturaMeta(item.estrutura) === normalizarEstruturaMeta(estruturaMeta);
      const codIgual = String(item.cod_estrutura || '').trim() && String(item.cod_estrutura || '').trim() === codMeta;
      return estruturaIgual || codIgual;
    });
  };

  const iniciarEdicaoLinhaMeta = (meta) => {
    if (!meta?.id) {
      setErro('Não foi possível identificar a meta para edição.');
      return;
    }

    const primeiraEstrutura = (meta.estruturas || [])[0] || {};
    const estruturaConfig = encontrarConfigDaMeta(meta) || {};
    const estruturaTexto = String(primeiraEstrutura.estrutura || '').trim();
    const codEstrutura = String(primeiraEstrutura.cod_estrutura || estruturaConfig.cod_estrutura || estruturaTexto.split('-')[0] || '').trim();

    setErro('');
    setMensagem(`Editando ${meta.nome_meta || estruturaTexto || 'meta'}. Altere os campos na própria linha e clique em Salvar.`);
    setMetaExpandidaId(null);
    setMostrarFormularioMeta(false);
    setModoTabelaCiclo(false);
    setMetaLinhaEditandoId(meta.id);
    setLinhaEditandoMeta({
      id: meta.id,
      nome_meta: meta.nome_meta || '',
      estrutura: estruturaTexto,
      cod_estrutura: codEstrutura,
      canal: estruturaConfig.canal || 'VD',
      nucleo: normalizarNucleoMeta(estruturaConfig.nucleo || 'NUCLEO 1'),
      ciclo: meta.ciclo || form.ciclo || cicloPadrao || '',
      meta_real: formatarMetaRealInput(meta.meta_real),
      meta_atividade: formatarMetaIndicadorInput(meta.meta_atividade, 1),
      meta_rpa: formatarMetaIndicadorInput(meta.meta_rpa, 2),
      meta_tkt_medio: formatarMetaIndicadorInput(meta.meta_tkt_medio, 2),
      meta_upa: formatarMetaIndicadorInput(meta.meta_upa, 1),
      meta_make: formatarMetaIndicadorInput(meta.meta_make, 1),
      meta_cabelo: formatarMetaIndicadorInput(meta.meta_cabelo, 1),
      tipo_meta: meta.tipo_meta || 'estrutura',
      status: meta.status || 'ativo',
      observacao: meta.observacao || ''
    });
  };

  const atualizarLinhaMetaEditando = (campo, valor) => {
    setLinhaEditandoMeta((atual) => ({ ...(atual || {}), [campo]: valor }));
  };

  const cancelarEdicaoLinhaMeta = () => {
    setMetaLinhaEditandoId(null);
    setLinhaEditandoMeta(null);
    setErro('');
    setMensagem('');
  };

  const salvarEdicaoLinhaMeta = async (metaOriginal) => {
    if (!linhaEditandoMeta || !metaOriginal?.id) return;

    setErro('');
    setMensagem('');
    setSalvandoLinhaMeta(true);

    const estruturaTexto = String(linhaEditandoMeta.estrutura || '').trim();
    const codEstrutura = String(linhaEditandoMeta.cod_estrutura || estruturaTexto.split('-')[0] || '').trim();
    const nomeMeta = String(linhaEditandoMeta.nome_meta || obterNomeLimpoEstrutura(estruturaTexto) || estruturaTexto || '').trim();

    if (!nomeMeta) {
      setErro('Informe o nome da meta.');
      setSalvandoLinhaMeta(false);
      return;
    }
    if (!estruturaTexto) {
      setErro('A estrutura da meta não foi identificada.');
      setSalvandoLinhaMeta(false);
      return;
    }

    const estruturasOriginaisMeta = Array.isArray(metaOriginal.estruturas) ? metaOriginal.estruturas.filter((e) => String(e?.estrutura || '').trim()) : [];
    const metaTemMultiplasEstruturas = estruturasOriginaisMeta.length > 1;
    const estruturasPayloadEdicao = metaTemMultiplasEstruturas
      ? estruturasOriginaisMeta.map((e) => ({
          cod_estrutura: e.cod_estrutura || String(e.estrutura || '').split('-')[0] || '',
          estrutura: e.estrutura
        }))
      : [{ cod_estrutura: codEstrutura, estrutura: estruturaTexto }];

    const payload = {
      ciclo: String(linhaEditandoMeta.ciclo || '').trim(),
      nome_meta: nomeMeta,
      tipo_meta: metaTemMultiplasEstruturas ? 'grupo_estruturas' : (linhaEditandoMeta.tipo_meta || metaOriginal.tipo_meta || 'estrutura'),
      meta_real: converterMetaRealParaNumero(linhaEditandoMeta.meta_real),
      meta_atividade: converterMetaRealParaNumero(linhaEditandoMeta.meta_atividade),
      meta_make: converterMetaRealParaNumero(linhaEditandoMeta.meta_make),
      meta_cabelo: converterMetaRealParaNumero(linhaEditandoMeta.meta_cabelo),
      meta_rpa: converterMetaRealParaNumero(linhaEditandoMeta.meta_rpa),
      meta_tkt_medio: converterMetaRealParaNumero(linhaEditandoMeta.meta_tkt_medio),
      meta_upa: converterMetaRealParaNumero(linhaEditandoMeta.meta_upa),
      regra_calculo: metaOriginal.regra_calculo || 'somar_estruturas',
      status: linhaEditandoMeta.status || metaOriginal.status || 'ativo',
      observacao: linhaEditandoMeta.observacao || metaOriginal.observacao || '',
      estruturas: estruturasPayloadEdicao
    };

    if (!payload.ciclo) {
      setErro('Informe o ciclo.');
      setSalvandoLinhaMeta(false);
      return;
    }
    if (payload.meta_real <= 0) {
      setErro('Informe uma receita/meta maior que zero.');
      setSalvandoLinhaMeta(false);
      return;
    }

    try {
      await axios.put(`${apiUrl}/metas-reais/${metaOriginal.id}`, payload);

      if (!metaTemMultiplasEstruturas) {
        await axios.post(`${apiUrl}/estruturas-config`, {
          cod_estrutura: codEstrutura,
          estrutura: estruturaTexto,
          canal: linhaEditandoMeta.canal || 'VD',
          nucleo: normalizarNucleoMeta(linhaEditandoMeta.nucleo),
          tipo_estrutura: payload.tipo_meta || 'estrutura',
          status: 'ativo'
        });
      }

      setMensagem('Linha atualizada com sucesso.');
      cancelarEdicaoLinhaMeta();
      await carregarEstruturasConfigMeta();
      await carregarMetas(payload.ciclo);
      if (onAtualizacao) onAtualizacao();
    } catch (err) {
      const detalheErro = err.response?.data?.detail || 'Erro ao salvar a linha da meta.';
      setErro(
        String(detalheErro).toLowerCase().includes('acesso')
          ? `${detalheErro} Verifique se este usuário tem permissão na aba Cadastro.`
          : detalheErro
      );
    } finally {
      setSalvandoLinhaMeta(false);
    }
  };

  const excluirMeta = async (meta) => {
    const ok = window.confirm(`Excluir a meta real "${meta.nome_meta}"?`);
    if (!ok) return;
    setErro('');
    try {
      if (meta?.id) await axios.delete(`${apiUrl}/metas-reais/${meta.id}`);
      setMensagem('Meta real excluída.');
      await carregarMetas();
      if (onAtualizacao) onAtualizacao();
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao excluir meta real.');
    }
  };

  const salvarConsultorNaMeta = async (consultor, atualizacoes = {}) => {
    const idConsultor = consultor?.id;
    if (!idConsultor) {
      setErro('Não foi possível identificar o cadastro do consultor.');
      return;
    }

    try {
      await axios.put(`${apiUrl}/consultores/${idConsultor}`, {
        id_colaborador: consultor.id_colaborador || '',
        nome: consultor.nome || consultor.nome_cadastral || consultor.nome_exibicao || '',
        nome_social: consultor.nome_social || '',
        estrutura: consultor.estrutura || '',
        canal: consultor.canal || 'ESPAÇO DO REVENDEDOR',
        status_consultor: atualizacoes.status_consultor ?? consultor.status_consultor ?? 'ativo',
        peso_meta: atualizacoes.peso_meta ?? Number(consultor.peso_meta || 0)
      });
      setMensagem('Consultor atualizado.');
      await carregarMetas(cicloConsulta);
      if (onAtualizacao) onAtualizacao();
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao atualizar consultor.');
    }
  };

  const salvarPesoConsultorMeta = async (consultor, valorPeso) => {
    const pesoNumero = Number(String(valorPeso ?? '0').replace(',', '.')) || 0;
    await salvarConsultorNaMeta(consultor, { peso_meta: pesoNumero });
  };

  const estruturasFiltradas = opcoesEstruturasCadastro
    .filter((e) => {
      const termo = busca.toLowerCase().trim();
      if (!termo) return true;
      return String(e.estrutura || '').toLowerCase().includes(termo) || String(e.cod_estrutura || '').toLowerCase().includes(termo);
    })
    .slice(0, 60);

  const obterNomeLimpoEstrutura = (estrutura = '') => String(estrutura || '').replace(/^\s*\d+\s*-\s*/g, '').trim();

  const criarLinhaMeta = (estrutura, indice = 0) => {
    const estruturaNome = String(estrutura?.estrutura || '').trim();
    const codigo = String(estrutura?.cod_estrutura || estruturaNome.split('-')[0] || '').trim();
    const nomeLimpo = obterNomeLimpoEstrutura(estruturaNome) || estruturaNome || `NOVA ESTRUTURA ${indice + 1}`;
    const tipo = String(estrutura?.tipo_estrutura || '').toLowerCase().includes('er') ? 'er' : 'estrutura';

    return {
      uid: `${codigo || indice}-${Date.now()}-${indice}`,
      ciclo: form.ciclo || cicloPadrao || '',
      nome_meta: nomeLimpo,
      cod_estrutura: codigo,
      estrutura: estruturaNome,
      canal: estrutura?.canal || 'VD',
      nucleo: estrutura?.nucleo || 'NUCLEO 1',
      tipo_meta: tipo,
      status: 'ativo',
      meta_real: '',
      meta_atividade: '46,0',
      meta_rpa: '1.350,00',
      meta_tkt_medio: '600,00',
      meta_upa: '12,0',
      meta_make: '40,0',
      meta_cabelo: '40,0',
      observacao: ''
    };
  };

  const abrirTabelaNovoCiclo = async () => {
    setErro('');
    setMensagem('');
    setMostrarFormularioMeta(false);
    setEditandoId(null);
    setModoTabelaCiclo(true);

    const fonte = opcoesEstruturasCadastro.length ? opcoesEstruturasCadastro : estruturas;
    const linhas = fonte
      .filter((item) => !['inativo', 'excluido', 'excluído'].includes(String(item.status || '').toLowerCase()))
      .map((item, indice) => criarLinhaMeta(item, indice));

    setLinhasNovoCiclo(linhas.length ? linhas : [criarLinhaMeta({}, 0)]);
  };

  const fecharTabelaNovoCiclo = () => {
    setModoTabelaCiclo(false);
    setLinhasNovoCiclo([]);
  };

  const atualizarLinhaNovoCiclo = (uid, campo, valor) => {
    setLinhasNovoCiclo((atuais) => atuais.map((linha) => {
      if (linha.uid !== uid) return linha;
      const novaLinha = { ...linha, [campo]: valor };
      if (campo === 'estrutura') {
        const encontrada = opcoesEstruturasCadastro.find((item) => item.estrutura === valor);
        if (encontrada) {
          novaLinha.cod_estrutura = encontrada.cod_estrutura || String(encontrada.estrutura || '').split('-')[0] || '';
          novaLinha.nome_meta = obterNomeLimpoEstrutura(encontrada.estrutura) || encontrada.estrutura;
          novaLinha.canal = encontrada.canal || novaLinha.canal;
          novaLinha.nucleo = encontrada.nucleo || novaLinha.nucleo;
          novaLinha.tipo_meta = String(encontrada.tipo_estrutura || '').toLowerCase().includes('er') ? 'er' : 'estrutura';
        }
      }
      return novaLinha;
    }));
  };

  const adicionarLinhaNovoCiclo = () => {
    setLinhasNovoCiclo((atuais) => [...atuais, criarLinhaMeta({}, atuais.length)]);
  };

  const removerLinhaNovoCiclo = (uid) => {
    setLinhasNovoCiclo((atuais) => atuais.filter((linha) => linha.uid !== uid));
  };

  const localizarMetaExistenteDaLinha = (linha) => {
    const estruturaNormalizada = normalizarEstruturaMeta(linha.estrutura);
    const codNormalizado = normalizarEstruturaMeta(linha.cod_estrutura);
    return metas.find((meta) => String(meta.ciclo || '') === String(linha.ciclo || '') && (meta.estruturas || []).some((estruturaMeta) => {
      const eNorm = normalizarEstruturaMeta(estruturaMeta.estrutura);
      const cNorm = normalizarEstruturaMeta(estruturaMeta.cod_estrutura || String(estruturaMeta.estrutura || '').split('-')[0]);
      return eNorm === estruturaNormalizada || (!!codNormalizado && cNorm === codNormalizado);
    }));
  };

  const agruparLinhasValidasNovoCiclo = (linhasComEstrutura = []) => {
    /*
      Regra segura do Cadastro de Metas VD:
      - cada linha com Receita > 0 vira uma meta própria;
      - linhas com Receita zerada só entram como estrutura vinculada quando existir exatamente
        uma linha positiva com o mesmo nome limpo;
      - nunca somar automaticamente duas linhas positivas com o mesmo nome, porque isso fazia
        algumas metas dobrarem ou mudarem depois de salvar.
    */
    const positivas = linhasComEstrutura.filter((linha) => converterMetaRealParaNumero(linha.meta_real) > 0);
    const zeradas = linhasComEstrutura.filter((linha) => converterMetaRealParaNumero(linha.meta_real) <= 0);
    const grupos = positivas.map((linha, index) => {
      const cicloLinha = String(linha.ciclo || form.ciclo || cicloPadrao || '').trim();
      const nomeLinha = String(linha.nome_meta || obterNomeLimpoEstrutura(linha.estrutura) || linha.estrutura || '').trim();
      return {
        ciclo: cicloLinha,
        nome_meta: nomeLinha,
        chave_segura: `${cicloLinha}__${normalizarEstruturaMeta(linha.estrutura)}__${index}`,
        linhas: [linha]
      };
    });

    zeradas.forEach((linhaZerada) => {
      const nomeZerado = normalizarEstruturaMeta(linhaZerada.nome_meta || obterNomeLimpoEstrutura(linhaZerada.estrutura) || linhaZerada.estrutura);
      if (!nomeZerado) return;
      const gruposMesmoNome = grupos.filter((grupo) => normalizarEstruturaMeta(grupo.nome_meta) === nomeZerado);
      if (gruposMesmoNome.length === 1) {
        const grupoDestino = gruposMesmoNome[0];
        const estruturaJaExiste = grupoDestino.linhas.some((linha) => normalizarEstruturaMeta(linha.estrutura) === normalizarEstruturaMeta(linhaZerada.estrutura));
        if (!estruturaJaExiste) grupoDestino.linhas.push(linhaZerada);
      }
    });

    return grupos;
  };

  const localizarMetaExistenteDoGrupo = (grupo) => {
    const nomeNormalizado = normalizarEstruturaMeta(grupo.nome_meta);
    const cicloNormalizado = String(grupo.ciclo || '').trim();
    const estruturasGrupo = new Set(
      grupo.linhas
        .map((linha) => normalizarEstruturaMeta(linha.estrutura))
        .filter(Boolean)
    );
    const codigosGrupo = new Set(
      grupo.linhas
        .map((linha) => normalizarEstruturaMeta(linha.cod_estrutura))
        .filter(Boolean)
    );

    return metas.find((meta) => {
      const mesmoCiclo = String(meta.ciclo || '').trim() === cicloNormalizado;
      if (!mesmoCiclo) return false;
      return (meta.estruturas || []).some((estruturaMeta) => {
        const estruturaNorm = normalizarEstruturaMeta(estruturaMeta.estrutura);
        const codNorm = normalizarEstruturaMeta(estruturaMeta.cod_estrutura || String(estruturaMeta.estrutura || '').split('-')[0]);
        return estruturasGrupo.has(estruturaNorm) || codigosGrupo.has(codNorm);
      });
    });
  };

  const salvarTabelaNovoCiclo = async () => {
    setErro('');
    setMensagem('');
    const linhasComEstrutura = linhasNovoCiclo.filter((linha) => String(linha.estrutura || '').trim());
    const gruposValidos = agruparLinhasValidasNovoCiclo(linhasComEstrutura)
      .filter((grupo) => grupo.linhas.some((linha) => converterMetaRealParaNumero(linha.meta_real) > 0));

    if (!gruposValidos.length) {
      setErro('Preencha pelo menos uma estrutura com Receita maior que zero.');
      return;
    }

    const linhasValidas = gruposValidos.flatMap((grupo) => grupo.linhas).filter((linha) => converterMetaRealParaNumero(linha.meta_real) > 0);

    setSalvandoTabela(true);
    let salvas = 0;
    let atualizadas = 0;
    let estruturasVinculadas = 0;

    try {
      for (const grupo of gruposValidos) {
        const linhasComReceitaGrupo = grupo.linhas.filter((linha) => converterMetaRealParaNumero(linha.meta_real) > 0);
        const primeira = linhasComReceitaGrupo[0] || grupo.linhas[0] || {};
        const metaRealTotal = linhasComReceitaGrupo.reduce((soma, linha) => soma + converterMetaRealParaNumero(linha.meta_real), 0);
        const estruturasPayload = grupo.linhas.map((linha) => ({
          cod_estrutura: linha.cod_estrutura || String(linha.estrutura || '').split('-')[0] || '',
          estrutura: linha.estrutura
        }));

        const payload = {
          ciclo: grupo.ciclo,
          nome_meta: grupo.nome_meta,
          tipo_meta: grupo.linhas.length > 1 ? 'grupo_estruturas' : (primeira.tipo_meta || 'estrutura'),
          meta_real: metaRealTotal,
          meta_atividade: converterMetaRealParaNumero(primeira.meta_atividade),
          meta_make: converterMetaRealParaNumero(primeira.meta_make),
          meta_cabelo: converterMetaRealParaNumero(primeira.meta_cabelo),
          meta_rpa: converterMetaRealParaNumero(primeira.meta_rpa),
          meta_tkt_medio: converterMetaRealParaNumero(primeira.meta_tkt_medio),
          meta_upa: converterMetaRealParaNumero(primeira.meta_upa),
          regra_calculo: 'somar_estruturas',
          status: primeira.status || 'ativo',
          observacao: grupo.linhas.length > 1
            ? `Grupo com ${grupo.linhas.length} estruturas vinculadas.`
            : (primeira.observacao || `${primeira.canal || 'VD'} • ${String(primeira.nucleo || '').replace('NUCLEO', 'NÚCLEO')}`),
          estruturas: estruturasPayload
        };

        if (!payload.ciclo) throw new Error('Informe o ciclo em todas as linhas.');
        if (!payload.nome_meta) throw new Error('Informe o nome da meta em todas as linhas.');

        const existente = localizarMetaExistenteDoGrupo(grupo);
        if (existente?.id) {
          await axios.put(`${apiUrl}/metas-reais/${existente.id}`, payload);
          atualizadas += 1;
        } else {
          await axios.post(`${apiUrl}/metas-reais`, payload);
          salvas += 1;
        }

        for (const linha of grupo.linhas) {
          await axios.post(`${apiUrl}/estruturas-config`, {
            cod_estrutura: linha.cod_estrutura || String(linha.estrutura || '').split('-')[0] || '',
            estrutura: linha.estrutura,
            canal: linha.canal || 'VD',
            nucleo: normalizarNucleoMeta(linha.nucleo),
            tipo_estrutura: String(linha.tipo_meta || '').toLowerCase().includes('er') ? 'er' : 'estrutura',
            status: 'ativo'
          });
          estruturasVinculadas += 1;
        }
      }

      const cicloSalvo = linhasValidas[0]?.ciclo || form.ciclo || cicloPadrao || '';
      setMensagem(`Ciclo salvo com sucesso. Grupos novos: ${salvas}. Grupos atualizados: ${atualizadas}. Estruturas vinculadas: ${estruturasVinculadas}.`);
      setModoTabelaCiclo(false);
      setLinhasNovoCiclo([]);
      await carregarEstruturasConfigMeta();
      await carregarMetas(cicloSalvo);
      if (onAtualizacao) onAtualizacao();
    } catch (err) {
      setErro(err.response?.data?.detail || err.message || 'Erro ao salvar tabela do novo ciclo.');
    } finally {
      setSalvandoTabela(false);
    }
  };

  const totalTabela = linhasNovoCiclo.reduce((acc, linha) => acc + converterMetaRealParaNumero(linha.meta_real), 0);
  const mediaTabela = (campo) => {
    const valores = linhasNovoCiclo.map((linha) => converterMetaRealParaNumero(linha[campo])).filter((valor) => valor > 0);
    if (!valores.length) return 0;
    return valores.reduce((soma, valor) => soma + valor, 0) / valores.length;
  };

  const totalMetas = metas.reduce((acc, meta) => acc + Number(meta.meta_real || 0), 0);
  const totalRealizado = metas.reduce((acc, meta) => acc + Number(meta.realizado || 0), 0);
  const percentualTotal = totalMetas > 0 ? (totalRealizado / totalMetas) * 100 : 0;

  const obterEstruturasMeta = (meta) => (Array.isArray(meta?.estruturas) ? meta.estruturas.filter((e) => String(e?.estrutura || '').trim()) : []);
  const obterConfigEstruturaMeta = (estruturaMeta = {}) => {
    const estruturaTexto = String(estruturaMeta.estrutura || '').trim();
    const codTexto = String(estruturaMeta.cod_estrutura || estruturaTexto.split('-')[0] || '').trim();
    return opcoesEstruturasCadastro.find((item) => {
      const estruturaIgual = normalizarEstruturaMeta(item.estrutura) === normalizarEstruturaMeta(estruturaTexto);
      const codIgual = String(item.cod_estrutura || '').trim() && String(item.cod_estrutura || '').trim() === codTexto;
      return estruturaIgual || codIgual;
    }) || {};
  };
  const obterConsultoresMeta = (meta) => (Array.isArray(meta?.consultores) ? meta.consultores : []);

  const agruparMetasParaVisualizacao = (listaMetas = []) => {
    // Uma linha visual por meta salva. Não agrupamos mais por nome_meta, pois existem equipes
    // com o mesmo nome em códigos diferentes e isso fazia a tela somar/deletar metas sem o usuário perceber.
    return (listaMetas || []).map((meta) => {
      const estruturasUnicas = [];
      const chavesEstruturas = new Set();
      obterEstruturasMeta(meta).forEach((estruturaItem) => {
        const chaveEstrutura = normalizarEstruturaMeta(`${estruturaItem.cod_estrutura || ''}__${estruturaItem.estrutura || ''}`);
        if (!chaveEstrutura || chavesEstruturas.has(chaveEstrutura)) return;
        chavesEstruturas.add(chaveEstrutura);
        estruturasUnicas.push(estruturaItem);
      });

      const metaReal = Number(meta.meta_real || 0);
      const realizado = Number(meta.realizado || 0);
      const percentual = metaReal > 0 ? (realizado / metaReal) * 100 : 0;

      return {
        ...meta,
        _metasAgrupadas: [meta],
        estruturas: estruturasUnicas,
        meta_real: metaReal,
        realizado,
        pedidos: Number(meta.pedidos || 0),
        ativos: Number(meta.ativos || 0),
        percentual,
        tipo_meta: estruturasUnicas.length > 1 ? 'grupo_estruturas' : meta.tipo_meta
      };
    });
  };

  const metasTabelaVisual = agruparMetasParaVisualizacao(metas);

  const metaPertenceAoNucleoFiltro = (meta) => {
    if (!filtroNucleoMetas || filtroNucleoMetas === 'Todos') return true;
    const estruturasMeta = obterEstruturasMeta(meta);
    if (!estruturasMeta.length) return filtroNucleoMetas === 'Sem núcleo';
    return estruturasMeta.some((estruturaItem) => {
      const config = obterConfigEstruturaMeta(estruturaItem);
      return formatarNucleoCurtoMeta(config.nucleo || 'NUCLEO 1') === filtroNucleoMetas;
    });
  };

  const metasTabelaVisualFiltradas = metasTabelaVisual.filter((m) => {
    const termo = busca.toLowerCase().trim();
    const estruturasTexto = (m.estruturas || []).map((e) => e.estrutura).join(' ');
    const passaBusca = !termo || `${m.nome_meta} ${estruturasTexto} ${m.ciclo}`.toLowerCase().includes(termo);
    return passaBusca && metaPertenceAoNucleoFiltro(m);
  });

  const totalMetasFiltrado = metasTabelaVisualFiltradas.reduce((acc, meta) => acc + Number(meta.meta_real || 0), 0);
  const totalRealizadoFiltrado = metasTabelaVisualFiltradas.reduce((acc, meta) => acc + Number(meta.realizado || 0), 0);
  const percentualTotalFiltrado = totalMetasFiltrado > 0 ? (totalRealizadoFiltrado / totalMetasFiltrado) * 100 : 0;
  const estruturasBaseFiltradas = (() => {
    const chaves = new Set();
    metasTabelaVisualFiltradas.forEach((meta) => {
      const estruturasMeta = obterEstruturasMeta(meta);
      if (!estruturasMeta.length && meta?.estrutura) {
        chaves.add(normalizarEstruturaMeta(meta.estrutura));
      }
      estruturasMeta.forEach((estruturaItem) => {
        const chave = normalizarEstruturaMeta(`${estruturaItem.cod_estrutura || ''}__${estruturaItem.estrutura || ''}`);
        if (chave) chaves.add(chave);
      });
    });
    return chaves.size;
  })();

  const nucleosDisponiveisMetas = ['Todos', 'N1', 'N2', 'N3'];
  const resumoMetasPorNucleo = metasTabelaVisual.reduce((acc, meta) => {
    const estruturasMeta = obterEstruturasMeta(meta);
    const nucleosMeta = new Set(
      estruturasMeta.map((estruturaItem) => {
        const config = obterConfigEstruturaMeta(estruturaItem);
        return formatarNucleoCurtoMeta(config.nucleo || 'NUCLEO 1');
      })
    );
    Array.from(nucleosMeta).forEach((nucleo) => {
      acc[nucleo] = (acc[nucleo] || 0) + 1;
    });
    return acc;
  }, {});

  if (!aberto) return null;

  return (
    <div className={modoInline ? "w-full" : "fixed inset-0 bg-black/45 z-[9999] flex items-center justify-center p-2 md:p-4"}>
      <div className={modoInline ? "bg-white w-full rounded-xl shadow-sm border border-gray-100 overflow-visible flex flex-col" : "bg-white w-full max-w-[98vw] h-[95vh] rounded-[28px] shadow-2xl overflow-hidden flex flex-col"}>
        <div className="flex items-start justify-between gap-4 p-5 md:p-7 border-b border-gray-100 bg-white">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl md:text-3xl font-black text-gray-700">Cadastro de Metas por Ciclo</h2>
              <span className="px-3 py-1 rounded-full bg-[#e6f6f7] text-[#048187] text-xs font-black">{cicloConsulta || 'Sem ciclo'}</span>
            </div>
            <p className="text-sm md:text-base text-gray-400 font-semibold mt-1">Tela em formato de planilha: cadastre metas, acompanhe realizado e abra cada estrutura para dividir por consultor.</p>
          </div>
          {!modoInline && <button onClick={onClose} className="text-gray-400 hover:bg-gray-50 rounded-full p-2 shrink-0"><X size={24} /></button>}
        </div>

        <div className="px-5 md:px-7 py-4 border-b border-gray-100 bg-[#fbfefe]">
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-4"><p className="text-[10px] uppercase font-black text-gray-400">Meta do ciclo</p><p className="text-lg font-black text-[#048187] mt-1">{formatarMoeda(totalMetasFiltrado)}</p></div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4"><p className="text-[10px] uppercase font-black text-gray-400">Realizado</p><p className="text-lg font-black text-[#048187] mt-1">{formatarMoeda(totalRealizadoFiltrado)}</p></div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4"><p className="text-[10px] uppercase font-black text-gray-400">% ating.</p><p className="text-lg font-black mt-1" style={{ color: corPorFaixaMeta(percentualTotalFiltrado) }}>{percentualTotalFiltrado.toFixed(1)}%</p></div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4"><p className="text-[10px] uppercase font-black text-gray-400">Metas cadastradas</p><p className="text-lg font-black text-gray-700 mt-1">{metasTabelaVisualFiltradas.length}</p></div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4"><p className="text-[10px] uppercase font-black text-gray-400">Estruturas base</p><p className="text-lg font-black text-gray-700 mt-1">{estruturasBaseFiltradas || 0}</p></div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4"><p className="text-[10px] uppercase font-black text-gray-400">Núcleos</p><p className="text-lg font-black text-gray-700 mt-1">N1 • N2 • N3</p></div>
          </div>

          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={abrirTabelaNovoCiclo} className="bg-[#048187] text-white font-black px-5 py-3 rounded-xl hover:brightness-110 inline-flex items-center gap-2 text-sm"><Plus size={18} /> Novo ciclo</button>
              <button type="button" onClick={() => { setModoTabelaCiclo(false); setMostrarFormularioMeta(true); setEditandoId(null); setForm({ ...metaRealVazia, ciclo: form.ciclo || cicloPadrao || '' }); }} className="bg-white border border-gray-200 text-gray-600 font-black px-5 py-3 rounded-xl hover:bg-gray-50 inline-flex items-center gap-2 text-sm"><Pencil size={16} /> Cadastro simples</button>
              <button type="button" onClick={() => { carregarMetas(); carregarEstruturas(); carregarEstruturasConfigMeta(); }} className="bg-[#e6f6f7] text-[#048187] font-black px-5 py-3 rounded-xl hover:bg-[#d0f0f1] inline-flex items-center gap-2 text-sm"><RefreshCcw size={16} /> Atualizar</button>
            </div>
            <div className="flex flex-col lg:flex-row gap-3 w-full xl:w-auto">
              <div className="flex flex-wrap gap-2">
                {nucleosDisponiveisMetas.map((nucleo) => (
                  <button
                    key={nucleo}
                    type="button"
                    onClick={() => setFiltroNucleoMetas(nucleo)}
                    className={`px-4 py-3 rounded-xl text-sm font-black transition-colors ${filtroNucleoMetas === nucleo ? 'bg-[#048187] text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-500 hover:bg-[#e6f6f7] hover:text-[#048187]'}`}
                  >
                    {nucleo}
                    {nucleo !== 'Todos' && <span className={`ml-2 ${filtroNucleoMetas === nucleo ? 'text-white/80' : 'text-gray-400'}`}>{resumoMetasPorNucleo[nucleo] || 0}</span>}
                  </button>
                ))}
              </div>
              <div className="relative w-full xl:w-[420px]">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar meta, estrutura ou código..." className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-[#048187]" />
              </div>
            </div>
          </div>

          {(erro || mensagem) && (
            <div className="mt-4 space-y-2">
              {erro && <div className="bg-red-50 text-red-600 border border-red-100 rounded-xl p-3 text-sm font-bold">{erro}</div>}
              {mensagem && <div className="bg-green-50 text-green-700 border border-green-100 rounded-xl p-3 text-sm font-bold">{mensagem}</div>}
            </div>
          )}
        </div>

        <div className={modoInline ? "p-5 md:p-7 space-y-6 bg-[#f7fafb] overflow-visible" : "flex-1 overflow-y-auto p-5 md:p-7 space-y-6 bg-[#f7fafb]"}>
          {modoTabelaCiclo && (
            <div className="bg-white border border-[#d9eff0] rounded-[24px] overflow-hidden shadow-sm">
              <div className="p-5 border-b border-gray-100 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black text-gray-700">Novo ciclo em modo planilha</h3>
                  <p className="text-sm text-gray-400 font-semibold mt-1">Preencha somente as linhas que terão meta. Ao salvar, cada linha vira uma meta oficial daquele ciclo.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={adicionarLinhaNovoCiclo} className="bg-white border border-gray-200 text-gray-600 font-black px-4 py-2.5 rounded-xl hover:bg-gray-50 inline-flex items-center gap-2 text-sm"><Plus size={15} /> Linha</button>
                  <button type="button" onClick={fecharTabelaNovoCiclo} className="bg-white border border-gray-200 text-gray-600 font-black px-4 py-2.5 rounded-xl hover:bg-gray-50 text-sm">Cancelar</button>
                  <button type="button" onClick={salvarTabelaNovoCiclo} disabled={salvandoTabela} className="bg-[#048187] text-white font-black px-5 py-2.5 rounded-xl hover:brightness-110 disabled:opacity-60 inline-flex items-center gap-2 text-sm"><Save size={15} /> {salvandoTabela ? 'Salvando...' : 'Salvar ciclo'}</button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-[12px] min-w-[1320px]">
                  <thead className="bg-[#f2fafb] text-[10px] uppercase text-gray-500 font-black">
                    <tr>
                      <th className="px-3 py-3 text-left w-[190px]">Nome Estrutura</th>
                      <th className="px-3 py-3 text-left w-[260px]">Estrutura</th>
                      <th className="px-3 py-3 text-left w-[110px]">Canal</th>
                      <th className="px-3 py-3 text-left w-[120px]">Núcleo</th>
                      <th className="px-3 py-3 text-left w-[110px]">Ciclo</th>
                      <th className="px-3 py-3 text-right w-[150px]">Receita</th>
                      <th className="px-3 py-3 text-right w-[110px]">Atividade</th>
                      <th className="px-3 py-3 text-right w-[130px]">RPA</th>
                      <th className="px-3 py-3 text-right w-[130px]">Tkt Médio</th>
                      <th className="px-3 py-3 text-right w-[100px]">UPA</th>
                      <th className="px-3 py-3 text-right w-[110px]">Pen. Make</th>
                      <th className="px-3 py-3 text-right w-[120px]">Pen. Cabelos</th>
                      <th className="px-3 py-3 text-right w-[90px]">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {linhasNovoCiclo.map((linha) => (
                      <tr key={linha.uid} className="hover:bg-[#fbfefe]">
                        <td className="px-3 py-2"><input value={linha.nome_meta} onChange={(e) => atualizarLinhaNovoCiclo(linha.uid, 'nome_meta', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 font-bold text-gray-700 outline-none focus:border-[#048187]" /></td>
                        <td className="px-3 py-2">
                          <select value={linha.estrutura} onChange={(e) => atualizarLinhaNovoCiclo(linha.uid, 'estrutura', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 font-bold text-gray-700 outline-none focus:border-[#048187]">
                            <option value="">Selecionar estrutura</option>
                            {opcoesEstruturasCadastro.map((item) => <option key={`${linha.uid}-${item.cod_estrutura}-${item.estrutura}`} value={item.estrutura}>{item.estrutura}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2"><select value={linha.canal} onChange={(e) => atualizarLinhaNovoCiclo(linha.uid, 'canal', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 font-bold text-gray-700 outline-none focus:border-[#048187]"><option value="VD">VD</option><option value="LOJA">LOJA</option><option value="ER">ER</option></select></td>
                        <td className="px-3 py-2"><select value={linha.nucleo} onChange={(e) => atualizarLinhaNovoCiclo(linha.uid, 'nucleo', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 font-bold text-gray-700 outline-none focus:border-[#048187]"><option value="NUCLEO 1">N1</option><option value="NUCLEO 2">N2</option><option value="NUCLEO 3">N3</option></select></td>
                        <td className="px-3 py-2"><input value={linha.ciclo} onChange={(e) => atualizarLinhaNovoCiclo(linha.uid, 'ciclo', e.target.value)} placeholder="09/2026" className="w-full border border-gray-200 rounded-lg px-3 py-2 font-bold text-gray-700 outline-none focus:border-[#048187]" /></td>
                        <td className="px-3 py-2"><input value={linha.meta_real} onChange={(e) => atualizarLinhaNovoCiclo(linha.uid, 'meta_real', e.target.value)} onBlur={(e) => atualizarLinhaNovoCiclo(linha.uid, 'meta_real', formatarMetaRealInput(e.target.value))} placeholder="R$ 0,00" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right font-black text-[#048187] outline-none focus:border-[#048187]" /></td>
                        <td className="px-3 py-2"><input value={linha.meta_atividade} onChange={(e) => atualizarLinhaNovoCiclo(linha.uid, 'meta_atividade', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right font-bold text-gray-700 outline-none focus:border-[#048187]" /></td>
                        <td className="px-3 py-2"><input value={linha.meta_rpa} onChange={(e) => atualizarLinhaNovoCiclo(linha.uid, 'meta_rpa', e.target.value)} onBlur={(e) => atualizarLinhaNovoCiclo(linha.uid, 'meta_rpa', formatarMetaIndicadorInput(e.target.value, 2))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right font-bold text-gray-700 outline-none focus:border-[#048187]" /></td>
                        <td className="px-3 py-2"><input value={linha.meta_tkt_medio} onChange={(e) => atualizarLinhaNovoCiclo(linha.uid, 'meta_tkt_medio', e.target.value)} onBlur={(e) => atualizarLinhaNovoCiclo(linha.uid, 'meta_tkt_medio', formatarMetaIndicadorInput(e.target.value, 2))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right font-bold text-gray-700 outline-none focus:border-[#048187]" /></td>
                        <td className="px-3 py-2"><input value={linha.meta_upa} onChange={(e) => atualizarLinhaNovoCiclo(linha.uid, 'meta_upa', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right font-bold text-gray-700 outline-none focus:border-[#048187]" /></td>
                        <td className="px-3 py-2"><input value={linha.meta_make} onChange={(e) => atualizarLinhaNovoCiclo(linha.uid, 'meta_make', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right font-bold text-gray-700 outline-none focus:border-[#048187]" /></td>
                        <td className="px-3 py-2"><input value={linha.meta_cabelo} onChange={(e) => atualizarLinhaNovoCiclo(linha.uid, 'meta_cabelo', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right font-bold text-gray-700 outline-none focus:border-[#048187]" /></td>
                        <td className="px-3 py-2 text-right"><button type="button" onClick={() => removerLinhaNovoCiclo(linha.uid)} className="text-red-500 hover:bg-red-50 rounded-lg p-2"><Trash2 size={16} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-yellow-100 text-gray-800 font-black">
                    <tr>
                      <td className="px-3 py-3 text-center" colSpan={5}>TOTAL GERAL</td>
                      <td className="px-3 py-3 text-right">{formatarMoeda(totalTabela)}</td>
                      <td className="px-3 py-3 text-right">{mediaTabela('meta_atividade').toFixed(1)}%</td>
                      <td className="px-3 py-3 text-right">{formatarMoeda(mediaTabela('meta_rpa'))}</td>
                      <td className="px-3 py-3 text-right">{formatarMoeda(mediaTabela('meta_tkt_medio'))}</td>
                      <td className="px-3 py-3 text-right">{mediaTabela('meta_upa').toFixed(1)}</td>
                      <td className="px-3 py-3 text-right">{mediaTabela('meta_make').toFixed(1)}%</td>
                      <td className="px-3 py-3 text-right">{mediaTabela('meta_cabelo').toFixed(1)}%</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {mostrarFormularioMeta && (
            <form onSubmit={salvarMeta} className="border border-[#d9eff0] bg-white rounded-[24px] p-5 md:p-6 space-y-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-black text-gray-700">{editandoId ? 'Editar meta real' : 'Nova meta real'}</h3>
                <button type="submit" disabled={salvando} className="bg-[#048187] text-white font-black px-5 py-3 rounded-xl hover:brightness-110 disabled:opacity-60 inline-flex items-center gap-2 text-sm"><Save size={16} /> {salvando ? 'Salvando...' : editandoId ? 'Salvar alterações' : 'Cadastrar meta'}</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div><label className="text-xs font-black text-gray-400 uppercase block mb-1">Ciclo</label><input value={form.ciclo} onChange={(e) => setForm({ ...form, ciclo: e.target.value })} placeholder="09/2026" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#048187]" required /></div>
                <div><label className="text-xs font-black text-gray-400 uppercase block mb-1">Meta Real</label><input value={form.meta_real} onChange={(e) => { setMensagem(''); setForm({ ...form, meta_real: e.target.value }); }} onBlur={(e) => setForm((atual) => ({ ...atual, meta_real: formatarMetaRealInput(e.target.value) }))} placeholder="383337,00" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#048187]" required /></div>
                <div><label className="text-xs font-black text-gray-400 uppercase block mb-1">Tipo</label><select value={form.tipo_meta} onChange={(e) => setForm({ ...form, tipo_meta: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#048187]"><option value="estrutura">Estrutura</option><option value="er">ER</option><option value="grupo_estruturas">Grupo de estruturas</option></select></div>
                <div><label className="text-xs font-black text-gray-400 uppercase block mb-1">Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#048187]"><option value="ativo">Ativo</option><option value="inativo">Inativo</option></select></div>
              </div>

              <div><label className="text-xs font-black text-gray-400 uppercase block mb-1">Nome da meta</label><input value={form.nome_meta} onChange={(e) => setForm({ ...form, nome_meta: e.target.value })} placeholder="EQUIPE GRAZIELLE" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#048187]" required /></div>

              <div className="border border-gray-100 bg-[#f7fafb] rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-black text-gray-600 uppercase">Indicadores da estrutura</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  <CampoMetaIndicador label="Meta Atividade (%)" value={form.meta_atividade} casas={1} placeholder="46,0" onChange={(valor) => setForm({ ...form, meta_atividade: valor })} />
                  <CampoMetaIndicador label="Meta MAKE (%)" value={form.meta_make} casas={1} placeholder="40,0" onChange={(valor) => setForm({ ...form, meta_make: valor })} />
                  <CampoMetaIndicador label="Meta CABELO (%)" value={form.meta_cabelo} casas={1} placeholder="40,0" onChange={(valor) => setForm({ ...form, meta_cabelo: valor })} />
                  <CampoMetaIndicador label="Meta RPA (R$)" value={form.meta_rpa} casas={2} placeholder="1.500,00" onChange={(valor) => setForm({ ...form, meta_rpa: valor })} />
                  <CampoMetaIndicador label="Meta Tkt Médio (R$)" value={form.meta_tkt_medio} casas={2} placeholder="800,00" onChange={(valor) => setForm({ ...form, meta_tkt_medio: valor })} />
                  <CampoMetaIndicador label="Meta UPA" value={form.meta_upa} casas={1} placeholder="15,0" onChange={(valor) => setForm({ ...form, meta_upa: valor })} />
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_.9fr] gap-4">
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase block mb-1">Estruturas vinculadas</label>
                  <div className="relative" onBlur={() => setTimeout(() => setMostrarListaEstruturasMeta(false), 180)}>
                    <Search size={16} className="absolute left-3 top-3.5 text-gray-400" />
                    <input value={busca} onFocus={() => setMostrarListaEstruturasMeta(true)} onClick={() => setMostrarListaEstruturasMeta(true)} onChange={(e) => { setBusca(e.target.value); setMostrarListaEstruturasMeta(true); }} placeholder="Buscar por código ou nome da estrutura" className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-[#048187]" />
                    {mostrarListaEstruturasMeta && (
                      <div className="absolute z-10 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden max-h-72 overflow-y-auto">
                        {estruturasFiltradas.length > 0 ? estruturasFiltradas.map((e) => {
                          const estrutura = String(e.estrutura || '').trim();
                          const cod = String(e.cod_estrutura || estrutura.split('-')[0] || '').trim();
                          const jaCadastrada = estruturaJaSelecionada(estrutura) || estruturaJaCadastradaEmMeta(estrutura, cod);
                          return (
                            <button key={`${e.cod_estrutura}-${e.estrutura}`} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => adicionarEstrutura(e)} className={`w-full text-left px-4 py-3 text-sm hover:bg-[#e6f6f7] font-bold flex items-center justify-between gap-3 ${jaCadastrada ? 'text-[#7c1f31] bg-[#7c1f31]/5' : 'text-gray-600'}`}>
                              <span className="truncate">{e.estrutura}</span>
                              <span className={`shrink-0 text-[10px] font-black uppercase rounded-full px-2 py-1 ${jaCadastrada ? 'bg-[#7c1f31] text-white' : 'bg-[#048187] text-white'}`}>{jaCadastrada ? 'Já cadastrada' : 'Disponível'}</span>
                            </button>
                          );
                        }) : <div className="px-4 py-3 text-sm font-bold text-gray-400">Nenhuma estrutura encontrada.</div>}
                      </div>
                    )}
                  </div>
                  {avisoEstrutura && <div className={`mt-2 rounded-xl border px-3 py-3 text-sm font-bold ${avisoEstrutura.tipo === 'erro' ? 'border-red-100 bg-red-50 text-red-600' : 'border-green-100 bg-green-50 text-green-700'}`}><div>{avisoEstrutura.texto}</div>{!!avisoEstrutura.detalhe && <div className="text-xs font-semibold mt-1 opacity-80">{avisoEstrutura.detalhe}</div>}</div>}
                  <div className="mt-3 flex flex-wrap gap-2 min-h-[44px]">{form.estruturas.map((e) => <span key={e.estrutura} className="bg-[#e6f6f7] text-[#048187] px-3 py-2 rounded-xl text-xs font-black inline-flex items-center gap-2">{e.estrutura}<button type="button" onClick={() => removerEstrutura(e.estrutura)} className="hover:text-red-500"><X size={14} /></button></span>)}{!form.estruturas.length && <span className="text-sm text-gray-400 font-semibold">Nenhuma estrutura vinculada.</span>}</div>
                </div>
                <div><label className="text-xs font-black text-gray-400 uppercase block mb-1">Observação</label><textarea value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} rows={5} placeholder="Ex.: soma as estruturas 13476 e 17325" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#048187] resize-none" /></div>
              </div>
            </form>
          )}

          <div className={`${cadastroMetasVdExpandido ? 'fixed inset-3 md:inset-5 z-[99999] bg-white border border-[#d9eff0] rounded-[24px] overflow-auto shadow-2xl' : 'bg-white border border-gray-100 rounded-[24px] overflow-hidden shadow-sm'}`}>
            <div className="p-5 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-white sticky top-0 z-10">
              <div>
                <h3 className="text-xl font-black text-gray-700">Metas salvas do ciclo</h3>
                <p className="text-sm text-gray-400 font-semibold">Use Ver + para abrir uma estrutura e ajustar consultores, peso e status.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-[#e6f6f7] text-[#048187] px-3 py-1.5 rounded-full text-xs font-black w-fit">{metasTabelaVisualFiltradas.length} blocos</span>
                <button
                  type="button"
                  onClick={() => setCadastroMetasVdExpandido((atual) => !atual)}
                  className="h-9 px-3 rounded-xl bg-[#e6f6f7] text-[#048187] hover:bg-[#d0f0f1] inline-flex items-center gap-2 font-black text-xs"
                  title={cadastroMetasVdExpandido ? 'Reduzir tabela' : 'Expandir tabela'}
                >
                  {cadastroMetasVdExpandido ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  {cadastroMetasVdExpandido ? 'Reduzir' : 'Expandir'}
                </button>
              </div>
            </div>

            {carregando ? <p className="p-8 text-[#048187] font-bold">Carregando metas reais...</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-[12px] min-w-[1320px]">
                  <thead className="bg-[#f2fafb] text-[10px] uppercase text-gray-500 font-black">
                    <tr>
                      <th className="px-4 py-3 text-left">Nome Estrutura</th>
                      <th className="px-4 py-3 text-left">Estrutura</th>
                      <th className="px-4 py-3 text-left">Canal/Núcleo</th>
                      <th className="px-4 py-3 text-left">Ciclo</th>
                      <th className="px-4 py-3 text-right">Receita</th>
                      <th className="px-4 py-3 text-right">Realizado</th>
                      <th className="px-4 py-3 text-right">% Ating.</th>
                      <th className="px-4 py-3 text-right">Atividade</th>
                      <th className="px-4 py-3 text-right">RPA</th>
                      <th className="px-4 py-3 text-right">Tkt Médio</th>
                      <th className="px-4 py-3 text-right">UPA</th>
                      <th className="px-4 py-3 text-right">Pen. Make</th>
                      <th className="px-4 py-3 text-right">Pen. Cabelos</th>
                      <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {metasTabelaVisualFiltradas
                      .map((m) => {
                        const estruturasMeta = obterEstruturasMeta(m);
                        const primeiraEstrutura = estruturasMeta[0] || {};
                        const estruturaConfig = obterConfigEstruturaMeta(primeiraEstrutura);
                        const configsEstruturas = estruturasMeta.map((estruturaItem) => ({ estruturaItem, config: obterConfigEstruturaMeta(estruturaItem) }));
                        const canaisUnicosMeta = Array.from(new Set(configsEstruturas.map(({ config }) => config.canal || 'VD')));
                        const nucleosUnicosMeta = Array.from(new Set(configsEstruturas.map(({ config }) => normalizarNucleoMeta(config.nucleo || 'NUCLEO 1'))));
                        const metaTemMultiplasEstruturas = estruturasMeta.length > 1;
                        const consultoresMeta = obterConsultoresMeta(m);
                        const abertoLinha = String(metaExpandidaId) === String(m.id);
                        const editandoLinha = String(metaLinhaEditandoId) === String(m.id);
                        const linhaEditavel = editandoLinha && linhaEditandoMeta ? linhaEditandoMeta : null;
                        return (
                          <React.Fragment key={m.id}>
                            <tr className={`${editandoLinha ? 'bg-[#f2fafb] ring-2 ring-[#048187]/20' : 'hover:bg-[#fbfefe]'}`}>
                              <td className="px-4 py-3 font-black text-gray-700 max-w-[240px]">
                                {editandoLinha ? (
                                  <input value={linhaEditavel.nome_meta} onChange={(e) => atualizarLinhaMetaEditando('nome_meta', e.target.value)} className="w-full min-w-[180px] border border-gray-200 rounded-lg px-3 py-2 text-sm font-black text-gray-700 outline-none focus:border-[#048187]" />
                                ) : (
                                  <span className="truncate block">{m.nome_meta}</span>
                                )}
                              </td>
                              <td className="px-4 py-3 font-bold text-gray-500 max-w-[360px]">
                                <div className="flex flex-col gap-1">
                                  <span className="truncate">{primeiraEstrutura.estrutura || '-'}</span>
                                  {metaTemMultiplasEstruturas && (
                                    <div className="flex flex-wrap gap-1">
                                      <span className="bg-[#e6f6f7] text-[#048187] px-2 py-1 rounded-full text-[10px] font-black">{estruturasMeta.length} estruturas vinculadas</span>
                                      {estruturasMeta.slice(1, 3).map((estruturaItem) => (
                                        <span key={`${m.id}-${estruturaItem.estrutura}`} className="bg-gray-50 text-gray-500 px-2 py-1 rounded-full text-[10px] font-bold max-w-[220px] truncate">{estruturaItem.estrutura}</span>
                                      ))}
                                      {estruturasMeta.length > 3 && <span className="bg-gray-50 text-gray-500 px-2 py-1 rounded-full text-[10px] font-bold">+{estruturasMeta.length - 3}</span>}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 min-w-[190px]">
                                {editandoLinha ? (
                                  metaTemMultiplasEstruturas ? (
                                    <div className="flex flex-wrap gap-1 min-w-[170px]">
                                      <span className="px-2 py-1 rounded-full bg-gray-50 text-gray-500 text-[10px] font-black">GRUPO</span>
                                      <span className="px-2 py-1 rounded-full bg-[#e6f6f7] text-[#048187] text-[10px] font-black">{estruturasMeta.length} estruturas</span>
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-2 gap-2 min-w-[170px]">
                                      <select value={linhaEditavel.canal || 'VD'} onChange={(e) => atualizarLinhaMetaEditando('canal', e.target.value)} className="border border-gray-200 rounded-lg px-2 py-2 text-xs font-black text-gray-700 outline-none focus:border-[#048187]">
                                        <option value="VD">VD</option>
                                        <option value="LOJA">LOJA</option>
                                        <option value="ER">ER</option>
                                      </select>
                                      <select value={normalizarNucleoMeta(linhaEditavel.nucleo)} onChange={(e) => atualizarLinhaMetaEditando('nucleo', e.target.value)} className="border border-gray-200 rounded-lg px-2 py-2 text-xs font-black text-gray-700 outline-none focus:border-[#048187]">
                                        <option value="NUCLEO 1">N1</option>
                                        <option value="NUCLEO 2">N2</option>
                                        <option value="NUCLEO 3">N3</option>
                                      </select>
                                    </div>
                                  )
                                ) : (
                                  <div className="flex flex-wrap gap-1">
                                    {canaisUnicosMeta.map((canal) => <span key={`${m.id}-canal-${canal}`} className="px-2 py-1 rounded-full bg-gray-50 text-gray-500 text-[10px] font-black">{canal}</span>)}
                                    {nucleosUnicosMeta.map((nucleo) => <span key={`${m.id}-nucleo-${nucleo}`} className="px-2 py-1 rounded-full bg-[#e6f6f7] text-[#048187] text-[10px] font-black">{formatarNucleoCurtoMeta(nucleo)}</span>)}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 font-bold text-gray-600 min-w-[110px]">
                                {editandoLinha ? <input value={linhaEditavel.ciclo} onChange={(e) => atualizarLinhaMetaEditando('ciclo', e.target.value)} className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-[#048187]" /> : m.ciclo}
                              </td>
                              <td className="px-4 py-3 text-right font-black text-[#048187] min-w-[145px]">
                                {editandoLinha ? <input value={linhaEditavel.meta_real} onChange={(e) => atualizarLinhaMetaEditando('meta_real', e.target.value)} onBlur={(e) => atualizarLinhaMetaEditando('meta_real', formatarMetaRealInput(e.target.value))} className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm text-right font-black text-[#048187] outline-none focus:border-[#048187]" /> : formatarMoeda(m.meta_real)}
                              </td>
                              <td className="px-4 py-3 text-right font-black text-gray-700">{formatarMoeda(m.realizado)}</td>
                              <td className="px-4 py-3 text-right font-black" style={{ color: corPorFaixaMeta(m.percentual) }}>{Number(m.percentual || 0).toFixed(1)}%</td>
                              <td className="px-4 py-3 text-right font-bold text-gray-600 min-w-[110px]">
                                {editandoLinha ? <input value={linhaEditavel.meta_atividade} onChange={(e) => atualizarLinhaMetaEditando('meta_atividade', e.target.value)} onBlur={(e) => atualizarLinhaMetaEditando('meta_atividade', formatarMetaIndicadorInput(e.target.value, 1))} className="w-20 border border-gray-200 rounded-lg px-2 py-2 text-sm text-right font-bold outline-none focus:border-[#048187]" /> : `${Number(m.meta_atividade || 0).toFixed(1)}%`}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-gray-600 min-w-[135px]">
                                {editandoLinha ? <input value={linhaEditavel.meta_rpa} onChange={(e) => atualizarLinhaMetaEditando('meta_rpa', e.target.value)} onBlur={(e) => atualizarLinhaMetaEditando('meta_rpa', formatarMetaIndicadorInput(e.target.value, 2))} className="w-28 border border-gray-200 rounded-lg px-2 py-2 text-sm text-right font-bold outline-none focus:border-[#048187]" /> : formatarMoeda(m.meta_rpa)}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-gray-600 min-w-[135px]">
                                {editandoLinha ? <input value={linhaEditavel.meta_tkt_medio} onChange={(e) => atualizarLinhaMetaEditando('meta_tkt_medio', e.target.value)} onBlur={(e) => atualizarLinhaMetaEditando('meta_tkt_medio', formatarMetaIndicadorInput(e.target.value, 2))} className="w-28 border border-gray-200 rounded-lg px-2 py-2 text-sm text-right font-bold outline-none focus:border-[#048187]" /> : formatarMoeda(m.meta_tkt_medio)}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-gray-600 min-w-[90px]">
                                {editandoLinha ? <input value={linhaEditavel.meta_upa} onChange={(e) => atualizarLinhaMetaEditando('meta_upa', e.target.value)} onBlur={(e) => atualizarLinhaMetaEditando('meta_upa', formatarMetaIndicadorInput(e.target.value, 1))} className="w-20 border border-gray-200 rounded-lg px-2 py-2 text-sm text-right font-bold outline-none focus:border-[#048187]" /> : Number(m.meta_upa || 0).toFixed(1)}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-gray-600 min-w-[110px]">
                                {editandoLinha ? <input value={linhaEditavel.meta_make} onChange={(e) => atualizarLinhaMetaEditando('meta_make', e.target.value)} onBlur={(e) => atualizarLinhaMetaEditando('meta_make', formatarMetaIndicadorInput(e.target.value, 1))} className="w-20 border border-gray-200 rounded-lg px-2 py-2 text-sm text-right font-bold outline-none focus:border-[#048187]" /> : `${Number(m.meta_make || 0).toFixed(1)}%`}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-gray-600 min-w-[120px]">
                                {editandoLinha ? <input value={linhaEditavel.meta_cabelo} onChange={(e) => atualizarLinhaMetaEditando('meta_cabelo', e.target.value)} onBlur={(e) => atualizarLinhaMetaEditando('meta_cabelo', formatarMetaIndicadorInput(e.target.value, 1))} className="w-20 border border-gray-200 rounded-lg px-2 py-2 text-sm text-right font-bold outline-none focus:border-[#048187]" /> : `${Number(m.meta_cabelo || 0).toFixed(1)}%`}
                              </td>
                              <td className="px-4 py-3 text-right whitespace-nowrap min-w-[170px]">
                                {editandoLinha ? (
                                  <>
                                    <button type="button" onClick={() => salvarEdicaoLinhaMeta(m)} disabled={salvandoLinhaMeta} className="bg-[#048187] text-white hover:brightness-110 disabled:opacity-60 rounded-lg px-3 py-2 inline-flex items-center gap-1 text-xs font-black mr-1"><Save size={14} /> Salvar</button>
                                    <button type="button" onClick={cancelarEdicaoLinhaMeta} className="bg-gray-50 text-gray-500 hover:bg-gray-100 rounded-lg p-2"><X size={16} /></button>
                                  </>
                                ) : (
                                  <>
                                    <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setMetaExpandidaId(abertoLinha ? null : m.id); }} className="bg-[#e6f6f7] text-[#048187] hover:bg-[#d0f0f1] rounded-lg px-3 py-2 inline-flex items-center gap-1 text-xs font-black mr-1">Ver +</button>
                                    <button
                                      type="button"
                                      onClick={(event) => { event.preventDefault(); event.stopPropagation(); iniciarEdicaoLinhaMeta(m); }}
                                      title="Editar meta na própria linha"
                                      className="bg-white border border-[#d9eff0] text-[#048187] hover:bg-[#e6f6f7] rounded-lg px-3 py-2 inline-flex items-center gap-1 text-xs font-black mr-1"
                                    >
                                      <Pencil size={15} /> Editar
                                    </button>
                                    <button type="button" onClick={() => excluirMeta(m)} className="text-red-500 hover:bg-red-50 rounded-lg p-2"><Trash2 size={16} /></button>
                                  </>
                                )}
                              </td>
                            </tr>

                            {abertoLinha && (
                              <tr>
                                <td colSpan={14} className="bg-[#fbfefe] px-6 py-5">
                                  <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white">
                                    <div className="px-5 py-4 border-b border-gray-100">
                                      <div className="flex items-center justify-between gap-3 flex-wrap">
                                        <div>
                                          <h4 className="font-black text-gray-700">Estruturas vinculadas à equipe</h4>
                                          <p className="text-xs text-gray-400 font-semibold mt-1">Aqui você enxerga quando uma mesma equipe tem mais de uma estrutura, como EQUIPE GRAZIELLE.</p>
                                        </div>
                                        <span className="bg-[#e6f6f7] text-[#048187] px-3 py-1.5 rounded-full text-xs font-black">{estruturasMeta.length} estrutura(s)</span>
                                      </div>
                                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                        {estruturasMeta.map((estruturaItem) => {
                                          const configItem = obterConfigEstruturaMeta(estruturaItem);
                                          return (
                                            <div key={`${m.id}-estrutura-${estruturaItem.estrutura}`} className="bg-[#f7fafb] border border-gray-100 rounded-2xl p-4">
                                              <p className="text-xs font-black text-gray-700">{estruturaItem.estrutura}</p>
                                              <div className="flex flex-wrap gap-1 mt-2">
                                                <span className="px-2 py-1 rounded-full bg-white text-gray-500 text-[10px] font-black">{configItem.canal || 'VD'}</span>
                                                <span className="px-2 py-1 rounded-full bg-[#e6f6f7] text-[#048187] text-[10px] font-black">{formatarNucleoCurtoMeta(configItem.nucleo || 'NUCLEO 1')}</span>
                                                <span className="px-2 py-1 rounded-full bg-white text-gray-500 text-[10px] font-bold">Cód. {estruturaItem.cod_estrutura || String(estruturaItem.estrutura || '').split('-')[0] || '-'}</span>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
                                      <div>
                                        <h4 className="font-black text-gray-700">Consultores vinculados</h4>
                                        <p className="text-xs text-gray-400 font-semibold mt-1">Edite peso e status. Consultores em férias/inativos não entram na divisão ativa da meta.</p>
                                      </div>
                                      <span className="bg-[#e6f6f7] text-[#048187] px-3 py-1.5 rounded-full text-xs font-black">{consultoresMeta.length} consultores</span>
                                    </div>
                                    <div className="overflow-x-auto">
                                      <table className="w-full min-w-[900px] text-sm">
                                        <thead className="bg-gray-50 text-[10px] uppercase text-gray-400 font-black"><tr><th className="px-5 py-3 text-left">Consultor</th><th className="px-5 py-3 text-left">Estrutura</th><th className="px-5 py-3 text-left">Status</th><th className="px-5 py-3 text-right">Peso</th><th className="px-5 py-3 text-right">Meta individual</th><th className="px-5 py-3 text-right">Realizado</th><th className="px-5 py-3 text-right">% Fat.</th></tr></thead>
                                        <tbody className="divide-y divide-gray-100">
                                          {consultoresMeta.map((c) => (
                                            <tr key={`${m.id}-${c.id_colaborador}-${c.id}`} className="hover:bg-[#f7fafb]">
                                              <td className="px-5 py-3"><p className="font-black text-gray-700">{c.nome_exibicao || c.nome_social || c.nome}</p><p className="text-[10px] text-gray-400 font-bold">ID {c.id_colaborador || '-'}</p></td>
                                              <td className="px-5 py-3 text-xs font-bold text-gray-500 max-w-[260px]"><span className="line-clamp-2">{c.estrutura || c.nome_estrutura || '-'}</span></td>
                                              <td className="px-5 py-3"><select defaultValue={c.status_consultor || 'ativo'} onChange={(e) => salvarConsultorNaMeta(c, { status_consultor: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#048187]"><option value="ativo">Ativo</option><option value="ferias">Férias</option><option value="inativo">Inativo</option></select></td>
                                              <td className="px-5 py-3 text-right"><div className="inline-flex items-center gap-2"><input type="number" step="0.01" defaultValue={Number(c.peso_meta || 0).toFixed(2)} onBlur={(e) => salvarPesoConsultorMeta(c, e.target.value)} className="w-24 border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold text-[#048187] outline-none focus:border-[#048187]" />%</div></td>
                                              <td className="px-5 py-3 text-right font-bold text-gray-600">{formatarMoeda(c.meta_individual)}</td>
                                              <td className="px-5 py-3 text-right font-black text-[#048187]">{formatarMoeda(c.realizado)}</td>
                                              <td className="px-5 py-3 text-right font-black" style={{ color: corPorFaixaMeta(c.percentual) }}>{Number(c.percentual || 0).toFixed(1)}%</td>
                                            </tr>
                                          ))}
                                          {!consultoresMeta.length && <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400 font-bold">Nenhum consultor cadastrado nessa estrutura.</td></tr>}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    {!metasTabelaVisual.length && <tr><td colSpan={14} className="p-10 text-center text-gray-400 font-bold">Nenhuma meta real cadastrada para este ciclo.</td></tr>}
                  </tbody>
                  <tfoot className="bg-yellow-100 text-gray-800 font-black">
                    <tr>
                      <td className="px-4 py-3 text-center" colSpan={4}>TOTAL GERAL</td>
                      <td className="px-4 py-3 text-right">{formatarMoeda(totalMetasFiltrado)}</td>
                      <td className="px-4 py-3 text-right">{formatarMoeda(totalRealizadoFiltrado)}</td>
                      <td className="px-4 py-3 text-right">{percentualTotalFiltrado.toFixed(1)}%</td>
                      <td colSpan={7}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



const EXCLUSAO_REVENDEDOR_VAZIA = {
  codigo_revendedor: '',
  nome_revendedor: '',
  motivo: '',
  ciclo: 'TODOS',
  tipo_exclusao: 'todos',
  ativo: true
};

const TIPOS_EXCLUSAO_REVENDEDOR = [
  { value: 'todos', label: 'Todos os cálculos' },
  { value: 'metas', label: 'Somente Metas' },
  { value: 'dashboard', label: 'Somente Dashboard' },
  { value: 'ranking', label: 'Somente Ranking' },
  { value: 'historico', label: 'Somente Histórico' },
  { value: 'revendedores', label: 'Somente Revendedores' }
];

function TelaExclusoesRevendedores({ apiUrl = API_URL, onAtualizacao }) {
  const [exclusoes, setExclusoes] = useState([]);
  const [form, setForm] = useState(EXCLUSAO_REVENDEDOR_VAZIA);
  const [editandoId, setEditandoId] = useState(null);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('ativos');
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  const normalizarBusca = (valor) => String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  const carregarExclusoes = async () => {
    setCarregando(true);
    setErro('');
    try {
      const { data } = await axios.get(`${apiUrl}/exclusoes-revendedores`);
      const lista = Array.isArray(data)
        ? data
        : (data?.exclusoes || data?.itens || data?.dados || []);
      setExclusoes(Array.isArray(lista) ? lista : []);
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao carregar exclusões de revendedores. Verifique se o backend já foi atualizado com as rotas /exclusoes-revendedores.');
      setExclusoes([]);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarExclusoes();
  }, []);

  const exclusoesFiltradas = exclusoes.filter((item) => {
    const ativo = item?.ativo !== false;
    const statusOk =
      filtroStatus === 'todos' ||
      (filtroStatus === 'ativos' && ativo) ||
      (filtroStatus === 'inativos' && !ativo);

    if (!statusOk) return false;

    const termo = normalizarBusca(busca);
    if (!termo) return true;

    const texto = normalizarBusca([
      item?.codigo_revendedor,
      item?.nome_revendedor,
      item?.motivo,
      item?.ciclo,
      item?.tipo_exclusao
    ].join(' '));

    return texto.includes(termo);
  });

  const atualizarCampo = (campo, valor) => {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  };

  const limparFormulario = () => {
    setForm(EXCLUSAO_REVENDEDOR_VAZIA);
    setEditandoId(null);
    setErro('');
    setMensagem('');
  };

  const validarFormulario = () => {
    if (!String(form.codigo_revendedor || '').trim()) return 'Informe o código do revendedor.';
    if (!String(form.nome_revendedor || '').trim()) return 'Informe o nome do revendedor.';
    if (!String(form.motivo || '').trim()) return 'Informe o motivo da exclusão.';
    if (!String(form.ciclo || '').trim()) return 'Informe o ciclo. Use TODOS para aplicar em todos os ciclos.';
    if (!String(form.tipo_exclusao || '').trim()) return 'Informe o tipo de exclusão.';
    return '';
  };

  const salvarExclusao = async (e) => {
    e.preventDefault();

    const erroValidacao = validarFormulario();
    if (erroValidacao) {
      setErro(erroValidacao);
      setMensagem('');
      return;
    }

    setSalvando(true);
    setErro('');
    setMensagem('');

    const payload = {
      codigo_revendedor: String(form.codigo_revendedor || '').trim(),
      nome_revendedor: String(form.nome_revendedor || '').trim(),
      motivo: String(form.motivo || '').trim(),
      ciclo: String(form.ciclo || 'TODOS').trim().toUpperCase(),
      tipo_exclusao: String(form.tipo_exclusao || 'todos').trim(),
      ativo: form.ativo !== false
    };

    try {
      const mensagemSucesso = editandoId
        ? 'Exclusão atualizada com sucesso.'
        : 'Exclusão cadastrada com sucesso.';

      if (editandoId) {
        await axios.put(`${apiUrl}/exclusoes-revendedores/${editandoId}`, payload);
      } else {
        await axios.post(`${apiUrl}/exclusoes-revendedores`, payload);
      }

      limparFormulario();
      setMensagem(mensagemSucesso);
      await carregarExclusoes();
      if (onAtualizacao) onAtualizacao();
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao salvar exclusão de revendedor.');
    } finally {
      setSalvando(false);
    }
  };

  const editarExclusao = (item) => {
    setEditandoId(item.id);
    setForm({
      codigo_revendedor: item.codigo_revendedor || '',
      nome_revendedor: item.nome_revendedor || '',
      motivo: item.motivo || '',
      ciclo: item.ciclo || 'TODOS',
      tipo_exclusao: item.tipo_exclusao || 'todos',
      ativo: item.ativo !== false
    });
    setErro('');
    setMensagem('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const desativarExclusao = async (item) => {
    const nome = item?.nome_revendedor || item?.codigo_revendedor || 'este revendedor';
    if (!window.confirm(`Desativar a exclusão de ${nome}?`)) return;

    setCarregando(true);
    setErro('');
    setMensagem('');

    try {
      await axios.delete(`${apiUrl}/exclusoes-revendedores/${item.id}`);
      setMensagem('Exclusão desativada com sucesso.');
      await carregarExclusoes();
      if (onAtualizacao) onAtualizacao();
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao desativar exclusão.');
    } finally {
      setCarregando(false);
    }
  };

  const obterLabelTipo = (tipo) => TIPOS_EXCLUSAO_REVENDEDOR.find((item) => item.value === tipo)?.label || tipo || 'Não informado';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#e6f6f7] text-[#048187] px-3 py-1 text-[11px] font-black uppercase tracking-wide mb-3">
              <ShieldCheck size={14} /> Configuração automática
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-700">Exclusões de Revendedores</h2>
            <p className="text-sm text-gray-400 font-semibold mt-2 max-w-3xl">
              Cadastre revendedores que não devem entrar nos cálculos. Depois de salvar, o backend exclui automaticamente dos indicadores sem alterar a base original.
            </p>
          </div>

          <button
            type="button"
            onClick={carregarExclusoes}
            disabled={carregando || salvando}
            className="bg-[#e6f6f7] text-[#048187] font-black rounded-lg px-5 py-3 hover:bg-[#d0f0f1] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <RefreshCcw size={18} /> {carregando ? 'Atualizando...' : 'Atualizar lista'}
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-[#048187]/15 bg-[#e6f6f7] p-4 text-sm text-[#036b70] font-semibold leading-relaxed">
          Use <strong>TODOS</strong> no ciclo para excluir em todos os ciclos. Para uma exclusão pontual, informe o ciclo no formato usado no sistema, por exemplo <strong>08/2026</strong>.
        </div>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-4 text-sm font-bold flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" /> <span>{erro}</span>
        </div>
      )}

      {mensagem && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl p-4 text-sm font-bold flex items-start gap-2">
          <CheckCircle size={18} className="shrink-0 mt-0.5" /> <span>{mensagem}</span>
        </div>
      )}

      <form onSubmit={salvarExclusao} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
          <div>
            <h3 className="text-lg font-black text-gray-700">{editandoId ? 'Editar exclusão' : 'Nova exclusão'}</h3>
            <p className="text-xs text-gray-400 font-bold mt-1">Preencha os dados do revendedor que deve ser ignorado nos cálculos.</p>
          </div>

          {editandoId && (
            <button
              type="button"
              onClick={limparFormulario}
              className="bg-gray-100 text-gray-500 font-black rounded-lg px-4 py-2 hover:bg-gray-200"
            >
              Cancelar edição
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-black text-gray-400 uppercase block mb-1">Código do Revendedor</label>
            <input
              value={form.codigo_revendedor}
              onChange={(e) => atualizarCampo('codigo_revendedor', e.target.value)}
              placeholder="Ex.: 16492472"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187] focus:ring-4 focus:ring-[#048187]/10"
              required
            />
          </div>

          <div>
            <label className="text-xs font-black text-gray-400 uppercase block mb-1">Nome do Revendedor</label>
            <input
              value={form.nome_revendedor}
              onChange={(e) => atualizarCampo('nome_revendedor', e.target.value)}
              placeholder="Ex.: MEYRE"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187] focus:ring-4 focus:ring-[#048187]/10"
              required
            />
          </div>

          <div>
            <label className="text-xs font-black text-gray-400 uppercase block mb-1">Ciclo</label>
            <input
              value={form.ciclo}
              onChange={(e) => atualizarCampo('ciclo', e.target.value)}
              placeholder="TODOS ou 08/2026"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187] focus:ring-4 focus:ring-[#048187]/10"
              required
            />
          </div>

          <div>
            <label className="text-xs font-black text-gray-400 uppercase block mb-1">Tipo de exclusão</label>
            <select
              value={form.tipo_exclusao}
              onChange={(e) => atualizarCampo('tipo_exclusao', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187] focus:ring-4 focus:ring-[#048187]/10 bg-white"
            >
              {TIPOS_EXCLUSAO_REVENDEDOR.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 xl:col-span-3">
            <label className="text-xs font-black text-gray-400 uppercase block mb-1">Motivo</label>
            <textarea
              value={form.motivo}
              onChange={(e) => atualizarCampo('motivo', e.target.value)}
              placeholder="Ex.: Cadastro teste - não contar nas metas"
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187] focus:ring-4 focus:ring-[#048187]/10 resize-y"
              required
            />
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-4 font-black text-gray-600">
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(e) => atualizarCampo('ativo', e.target.checked)}
              className="w-5 h-5 accent-[#048187]"
            />
            Exclusão ativa
          </label>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={limparFormulario}
            disabled={salvando}
            className="bg-gray-100 text-gray-500 font-black rounded-lg px-5 py-3 hover:bg-gray-200 disabled:opacity-60"
          >
            Limpar
          </button>
          <button
            type="submit"
            disabled={salvando}
            className="bg-[#048187] text-white font-black rounded-lg px-5 py-3 hover:bg-[#036b70] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Save size={18} /> {salvando ? 'Salvando...' : editandoId ? 'Salvar alterações' : 'Cadastrar exclusão'}
          </button>
        </div>
      </form>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-5">
          <div>
            <h3 className="text-lg font-black text-gray-700">Revendedores excluídos</h3>
            <p className="text-xs text-gray-400 font-bold mt-1">{exclusoesFiltradas.length} registro(s) encontrado(s).</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 xl:min-w-[520px]">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por código, nome, ciclo ou motivo..."
                className="w-full border border-gray-200 rounded-lg pl-9 pr-4 py-3 text-sm outline-none focus:border-[#048187]"
              />
            </div>

            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187] bg-white font-bold text-gray-600"
            >
              <option value="ativos">Ativos</option>
              <option value="inativos">Inativos</option>
              <option value="todos">Todos</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full min-w-[980px] text-left">
            <thead className="bg-[#048187] text-white">
              <tr>
                <th className="px-4 py-3 text-[11px] font-black uppercase">Código</th>
                <th className="px-4 py-3 text-[11px] font-black uppercase">Revendedor</th>
                <th className="px-4 py-3 text-[11px] font-black uppercase">Ciclo</th>
                <th className="px-4 py-3 text-[11px] font-black uppercase">Tipo</th>
                <th className="px-4 py-3 text-[11px] font-black uppercase">Motivo</th>
                <th className="px-4 py-3 text-[11px] font-black uppercase">Status</th>
                <th className="px-4 py-3 text-[11px] font-black uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {carregando ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm font-bold text-gray-400">Carregando exclusões...</td>
                </tr>
              ) : exclusoesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm font-bold text-gray-400">Nenhuma exclusão encontrada.</td>
                </tr>
              ) : (
                exclusoesFiltradas.map((item) => {
                  const ativo = item?.ativo !== false;
                  return (
                    <tr key={item.id || `${item.codigo_revendedor}-${item.ciclo}-${item.tipo_exclusao}`} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-black text-gray-700">{item.codigo_revendedor}</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-700">{item.nome_revendedor || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-[#e6f6f7] px-3 py-1 text-[11px] font-black text-[#048187]">{item.ciclo || 'TODOS'}</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-600">{obterLabelTipo(item.tipo_exclusao)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-500 max-w-[340px]">{item.motivo || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-3 py-1 text-[11px] font-black ${ativo ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                          {ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => editarExclusao(item)}
                            className="bg-[#e6f6f7] text-[#048187] rounded-lg px-3 py-2 text-xs font-black hover:bg-[#d0f0f1] flex items-center gap-1"
                          >
                            <Pencil size={14} /> Editar
                          </button>
                          {ativo && (
                            <button
                              type="button"
                              onClick={() => desativarExclusao(item)}
                              className="bg-red-50 text-red-600 rounded-lg px-3 py-2 text-xs font-black hover:bg-red-100 flex items-center gap-1"
                            >
                              <Trash2 size={14} /> Desativar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


export default function App() {
  const [usuarioLogado, setUsuarioLogado] = useState(() => { const s = localStorage.getItem('usuarioLogado'); return s ? JSON.parse(s) : null; });
  const [tokenAuth, setTokenAuth] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) || '');
  const [emailLogin, setEmailLogin] = useState(''); const [senhaLogin, setSenhaLogin] = useState(''); const [mostrarSenha, setMostrarSenha] = useState(false); const [erroLogin, setErroLogin] = useState(''); const [carregandoLogin, setCarregandoLogin] = useState(false);
  const [modalRecuperacaoSenhaAberto, setModalRecuperacaoSenhaAberto] = useState(false);
  const [etapaRecuperacaoSenha, setEtapaRecuperacaoSenha] = useState('solicitar');
  const [carregandoRecuperacaoSenha, setCarregandoRecuperacaoSenha] = useState(false);
  const [mensagemRecuperacaoSenha, setMensagemRecuperacaoSenha] = useState('');
  const [erroRecuperacaoSenha, setErroRecuperacaoSenha] = useState('');
  const [codigoGeradoRecuperacao, setCodigoGeradoRecuperacao] = useState('');
  const [formRecuperacaoSenha, setFormRecuperacaoSenha] = useState({ email: '', codigo: '', nova_senha: '', confirmar_senha: '' });
  
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
  const [usuarioPermissoesEditando, setUsuarioPermissoesEditando] = useState(null);
  const [permissoesTemporarias, setPermissoesTemporarias] = useState([]);

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

    if (telaEhLoja(telaAtual) && !usuarioPodeAcessarLoja()) {
      setCanalAtual('VD');
      setMenuLojaExpandido(false);
      setMenuVDExpandido(true);
      setTelaAtual('Dashboard');
      localStorage.setItem(TELA_ATUAL_STORAGE_KEY, 'Dashboard');
      return;
    }

    if (ABAS_SISTEMA.includes(telaAtual)) {
      localStorage.setItem(TELA_ATUAL_STORAGE_KEY, telaAtual);
      registrarUsoTela(telaAtual);
    }
  }, [usuarioLogado, telaAtual, permissoesAtivas]);

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


  const [usuariosSistema, setUsuariosSistema] = useState([]); const [carregandoUsuarios, setCarregandoUsuarios] = useState(false); const [mensagemUsuarios, setMensagemUsuarios] = useState(''); const [erroUsuarios, setErroUsuarios] = useState(''); const [usuarioEditando, setUsuarioEditando] = useState(null); const [modalEditarUsuarioAberto, setModalEditarUsuarioAberto] = useState(false); const [modalExcluirUsuarioAberto, setModalExcluirUsuarioAberto] = useState(false); const [usuarioParaExcluir, setUsuarioParaExcluir] = useState(null); const [novoUsuario, setNovoUsuario] = useState({ nome: '', email: '', senha: '', perfil: 'visualizador', status_usuario: 'ativo' }); const [senhaPerfil, setSenhaPerfil] = useState({ senha_atual: '', nova_senha: '', confirmar_senha: '' }); const [mostrarSenhasPerfil, setMostrarSenhasPerfil] = useState(false); const [mensagemSenha, setMensagemSenha] = useState(''); const [erroSenha, setErroSenha] = useState(''); const [modalResetSenhaAdminAberto, setModalResetSenhaAdminAberto] = useState(false); const [usuarioResetSenhaAdmin, setUsuarioResetSenhaAdmin] = useState(null); const [novaSenhaAdmin, setNovaSenhaAdmin] = useState(''); const [carregandoResetSenhaAdmin, setCarregandoResetSenhaAdmin] = useState(false);
  const [dadosAuditoria, setDadosAuditoria] = useState(null); const [carregandoAuditoria, setCarregandoAuditoria] = useState(false); const [erroAuditoria, setErroAuditoria] = useState(''); const [filtrosAuditoria, setFiltrosAuditoria] = useState({ dias: 7, aba: 'acessos' }); const [auditoriaDetalhe, setAuditoriaDetalhe] = useState(null);

  const [arquivoPedidos, setArquivoPedidos] = useState(null); const [arquivoMetas, setArquivoMetas] = useState(null); const [arquivoConsultores, setArquivoConsultores] = useState(null); const [arquivoBaseAtiva, setArquivoBaseAtiva] = useState(null); const [arquivoRevendedores, setArquivoRevendedores] = useState(null); const [arquivoSkusIaf, setArquivoSkusIaf] = useState(null); const [arquivosVendasMake, setArquivosVendasMake] = useState([]); const [arquivosVendasCabelo, setArquivosVendasCabelo] = useState([]); const [mensagemUpload, setMensagemUpload] = useState(''); const [erroUpload, setErroUpload] = useState(''); const [carregandoUpload, setCarregandoUpload] = useState(false); const [carregandoAutomacaoPedidos, setCarregandoAutomacaoPedidos] = useState(false); const [carregandoAutomacaoMake, setCarregandoAutomacaoMake] = useState(false); const [carregandoAutomacaoCabelo, setCarregandoAutomacaoCabelo] = useState(false); const [modalMetasReaisAberto, setModalMetasReaisAberto] = useState(false); const [visaoCadastro, setVisaoCadastro] = useState('geral');

  const [ciclos, setCiclos] = useState([]); const [cicloForm, setCicloForm] = useState(cicloFormVazio); const [cicloEditando, setCicloEditando] = useState(null); const [mensagemCiclo, setMensagemCiclo] = useState(''); const [erroCiclo, setErroCiclo] = useState(''); const [carregandoCiclos, setCarregandoCiclos] = useState(false); const [modalEditarCicloAberto, setModalEditarCicloAberto] = useState(false); const [modalExcluirCicloAberto, setModalExcluirCicloAberto] = useState(false); const [cicloParaExcluir, setCicloParaExcluir] = useState(null);

  const [listaConsultores, setListaConsultores] = useState([]); const [carregandoListaConsultores, setCarregandoListaConsultores] = useState(false); const [buscaConsultor, setBuscaConsultor] = useState(''); const [novoConsultor, setNovoConsultor] = useState(consultorVazio); const [modalCriarConsultorAberto, setModalCriarConsultorAberto] = useState(false); const [consultorEditando, setConsultorEditando] = useState(null); const [modalEditarConsultorAberto, setModalEditarConsultorAberto] = useState(false); const [consultorParaExcluir, setConsultorParaExcluir] = useState(null); const [modalExcluirConsultorAberto, setModalExcluirConsultorAberto] = useState(false); const [mensagemConsultor, setMensagemConsultor] = useState(''); const [erroGestaoConsultor, setErroGestaoConsultor] = useState('');
  const [listaEstruturasConfig, setListaEstruturasConfig] = useState([]); const [carregandoEstruturasConfig, setCarregandoEstruturasConfig] = useState(false); const [buscaEstruturaConfig, setBuscaEstruturaConfig] = useState(''); const [estruturaConfigForm, setEstruturaConfigForm] = useState(estruturaConfigVazia); const [estruturaConfigEditando, setEstruturaConfigEditando] = useState(null); const [mensagemEstruturaConfig, setMensagemEstruturaConfig] = useState(''); const [erroEstruturaConfig, setErroEstruturaConfig] = useState('');

  const [dadosRevendedores, setDadosRevendedores] = useState(null); const [carregandoRevendedores, setCarregandoRevendedores] = useState(false); const [erroRevendedores, setErroRevendedores] = useState(''); const [buscaRevendedores, setBuscaRevendedores] = useState('');
  const [filtrosRevendedores, setFiltrosRevendedores] = useState({ estruturas: [], cidades: [], atividades: [], papeis: [], inadimplentes: [] }); const [buscaFiltrosRevendedores, setBuscaFiltrosRevendedores] = useState({ estruturas: '', cidades: '', atividades: '', papeis: '', inadimplentes: '' });

  const [opcoesFiltros, setOpcFiltros] = useState({ nucleos: ['NUCLEO 1', 'NUCLEO 2', 'NUCLEO 3'], unidades: [], estruturas: [], consultores: [], situacoes: [], meios_captacao: [], modelos_comerciais: [], canais_venda: ['app_revendedor', 'omni', 'portal_revendedor', 'vd_mais', 'outros'] });
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
  const [lancamentoHistorico, setLancamentoHistorico] = useState({
    ciclo: '',
    data_inicio: '',
    data_fim: '',
    observacao: '',
    pedidos: null,
    base_ativa: null,
    consultores: null,
    metas: null,
    make: [],
    cabelo: []
  });

  const acaoCicloVazia = {
    nome_acao: '',
    ciclo: '',
    data_inicio: '',
    data_fim: '',
    meta_valor: '',
    status_acao: 'acontecendo',
    estruturas: [],
    observacao: ''
  };
  const [acoesCiclo, setAcoesCiclo] = useState([]);
  const [carregandoAcoesCiclo, setCarregandoAcoesCiclo] = useState(false);
  const [erroAcoesCiclo, setErroAcoesCiclo] = useState('');
  const [mensagemAcoesCiclo, setMensagemAcoesCiclo] = useState('');
  const [modalAcaoCicloAberto, setModalAcaoCicloAberto] = useState(false);
  const [acaoCicloForm, setAcaoCicloForm] = useState(acaoCicloVazia);
  const [acaoCicloEditandoId, setAcaoCicloEditandoId] = useState(null);
  const [acaoCicloDetalhe, setAcaoCicloDetalhe] = useState(null);
  const [buscaEstruturaAcao, setBuscaEstruturaAcao] = useState('');

  const [dadosLoja, setDadosLoja] = useState(null);
  const [carregandoLoja, setCarregandoLoja] = useState(false);
  const [erroLoja, setErroLoja] = useState('');
  const [mensagemLoja, setMensagemLoja] = useState('');
  const [cicloLoja, setCicloLoja] = useState('');
  const [arquivoGerencialLoja, setArquivoGerencialLoja] = useState(null);
  const [arquivosLojaUpload, setArquivosLojaUpload] = useState({
    vendas: null,
    skin: null,
    unidades: null,
    consultoras: null,
    metas_unidade: null,
    metas_consultora: null,
    servicos: null
  });
  const [buscaLoja, setBuscaLoja] = useState('');
  const [filtrosLoja, setFiltrosLoja] = useState({ unidade: '', consultora: '' });
  const [lojaUnidadeForm, setLojaUnidadeForm] = useState({ codigo_pdv: '', cidade: '', nome_loja: '', status_loja: 'ativo' });
  const [lojaConsultoraForm, setLojaConsultoraForm] = useState({ id_consultora: '', nome_consultora: '', codigo_pdv_oficial: '', status_consultora: 'ativo' });
  const [lojaMetaUnidadeForm, setLojaMetaUnidadeForm] = useState({ ciclo: '', codigo_pdv: '', meta_faturamento: '', meta_boleto_medio: '', meta_itens_boleto: 4, meta_skin: '', meta_servicos_mes: '', meta_servicos_ano: '' });
  const [lojaMetaConsultoraForm, setLojaMetaConsultoraForm] = useState({ ciclo: '', id_consultora: '', codigo_pdv_oficial: '', meta_faturamento: '', meta_boleto_medio: '', meta_itens_boleto: 4, meta_skin: '' });
  const [tabelaLojaExpandida, setTabelaLojaExpandida] = useState(null);
  const [tabelaCadastroLojaExpandida, setTabelaCadastroLojaExpandida] = useState(null);
  const [visaoCadastroLoja, setVisaoCadastroLoja] = useState('geral');
  const [linhaMetaUnidadeLojaEditando, setLinhaMetaUnidadeLojaEditando] = useState(null);
  const [linhaMetaConsultoraLojaEditando, setLinhaMetaConsultoraLojaEditando] = useState(null);
  const [modalSgiLojaAberto, setModalSgiLojaAberto] = useState(false);
  const [sgiLojaForm, setSgiLojaForm] = useState({ usuario: '', senha: '' });
  const [sgiLojaExecutando, setSgiLojaExecutando] = useState(false);
  const [statusSgiLoja, setStatusSgiLoja] = useState('');
  const sgiLojaUsuarioRef = useRef(null);
  const sgiLojaSenhaRef = useRef(null);

  useEffect(() => {
    if (!mensagemLoja) return undefined;

    const timer = window.setTimeout(() => {
      setMensagemLoja('');
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [mensagemLoja]);

  const promessasEmAndamentoRef = useRef({});
  const ultimoCarregamentoTelaRef = useRef('');
  const debounceFiltroRapidoRef = useRef(null);

  const itensMenuTopo = [
    { nome: 'Dashboard', icone: LayoutDashboard }, { nome: 'Metas', icone: BarChart2 }, { nome: 'N1', icone: Target }, { nome: 'N2', icone: Target }, { nome: 'N3', icone: Target }, { nome: 'Ranking', icone: Medal }, { nome: 'Comparativo', icone: Scale }, { nome: 'Ações', icone: Sparkles }, { nome: 'Histórico', icone: CalendarDays }, { nome: 'Revendedores', icone: UserCircle }, { nome: 'Cadastro', icone: Users }, { nome: 'Base', icone: Database }
  ];

  const itensMenuVD = itensMenuTopo;
  const itensMenuLoja = [
    { nome: 'LojaVisaoGeral', icone: LayoutDashboard },
    { nome: 'LojaRanking', icone: Trophy },
    { nome: 'LojaCadastro', icone: Save }
  ];

  const navegarParaTelaVD = (nomeTela) => {
    setCanalAtual('VD');
    setMenuVDExpandido(true);
    setMenuLojaExpandido(false);
    setTelaAtual(nomeTela);
  };

  const navegarParaLoja = () => {
    if (!usuarioPodeAcessarLoja()) {
      setCanalAtual('VD');
      setMenuLojaExpandido(false);
      setMenuVDExpandido(true);
      setTelaAtual('Dashboard');
      return;
    }
    setCanalAtual('LOJA');
    setMenuLojaExpandido(true);
    setMenuVDExpandido(false);
    setTelaAtual('LojaVisaoGeral');
  };

  const alternarCanalVD = () => {
    setCanalAtual('VD');
    setMenuVDExpandido((atual) => !atual);
    setMenuLojaExpandido(false);
    if (telaEhLoja(telaAtual)) setTelaAtual('Dashboard');
  };

  const alternarCanalLoja = () => {
    if (!usuarioPodeAcessarLoja()) {
      setCanalAtual('VD');
      setMenuLojaExpandido(false);
      setMenuVDExpandido(true);
      setTelaAtual('Dashboard');
      return;
    }
    setCanalAtual('LOJA');
    setMenuLojaExpandido((atual) => !atual);
    setMenuVDExpandido(false);
    setTelaAtual('LojaVisaoGeral');
  };

  const abrirCanalVD = () => {
    setCanalAtual('VD');
    setMenuVDExpandido(true);
    setMenuLojaExpandido(false);
    if (telaEhLoja(telaAtual)) setTelaAtual('Dashboard');
  };

  const carregarPermissoesDoBanco = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/permissoes`);
      const permissoesNormalizadas = normalizarPermissoesSistema(res.data?.permissoes || {});
      setPermissoesAtivas(permissoesNormalizadas);
      setPermissoesTemporarias([]);
    } catch (erro) {
      console.error('Erro ao carregar permissões:', erro);
      const permissoesNormalizadas = normalizarPermissoesSistema(permissoesPadrao);
      setPermissoesAtivas(permissoesNormalizadas);
      setPermissoesTemporarias([]);
    }
  };

  const permissoesDoUsuarioAtual = () => {
    if (!usuarioLogado) return [];
    const perfilUsuario = usuarioLogado.perfil || 'visualizador';
    if (Array.isArray(usuarioLogado.permissoes)) {
      return normalizarListaPermissoesUsuario(usuarioLogado.permissoes, perfilUsuario);
    }
    return normalizarListaPermissoesUsuario(permissoesAtivas[perfilUsuario] || [], perfilUsuario);
  };

  const usuarioPodeAcessar = (tela) => {
    if (!usuarioLogado) return false;
    if (usuarioLogado.perfil === 'admin') return true;
    return permissoesDoUsuarioAtual().includes(tela);
  };

  const usuarioPodeAcessarLoja = () => usuarioPodeAcessar('Loja') || usuarioPodeAcessar('LojaVisaoGeral') || usuarioPodeAcessar('LojaCadastro') || usuarioPodeAcessar('LojaUnidades') || usuarioPodeAcessar('LojaConsultoras') || usuarioPodeAcessar('LojaRanking');

  const telaEhLoja = (tela) => ['Loja', 'LojaVisaoGeral', 'LojaCadastro', 'LojaUnidades', 'LojaConsultoras', 'LojaRanking'].includes(tela);

  const obterPermissoesUsuarioLista = (usuario) => normalizarListaPermissoesUsuario(
    Array.isArray(usuario?.permissoes) ? usuario.permissoes : (permissoesAtivas[usuario?.perfil] || []),
    usuario?.perfil || 'visualizador'
  );

  const abrirModalPermissoes = (usuario) => {
    const usuarioAlvo = usuario && usuario.id ? usuario : null;
    if (!usuarioAlvo) return;
    setUsuarioPermissoesEditando(usuarioAlvo);
    setPerfilEditando(usuarioAlvo.perfil || 'visualizador');
    setPermissoesTemporarias(obterPermissoesUsuarioLista(usuarioAlvo));
    setModalPermissoesAberto(true);
  };

  const togglePermissaoTemporaria = (aba) => {
    const perfil = usuarioPermissoesEditando?.perfil || perfilEditando || 'visualizador';
    if (perfil === 'admin' && ['ADM', 'Configurações', 'Perfil'].includes(aba)) return;
    if (aba === 'Perfil') return;

    const listaAtual = Array.isArray(permissoesTemporarias) ? permissoesTemporarias : [];
    const novaLista = listaAtual.includes(aba)
      ? listaAtual.filter(i => i !== aba)
      : [...listaAtual, aba];

    setPermissoesTemporarias(normalizarListaPermissoesUsuario(novaLista, perfil));
  };

  const salvarPermissoes = async () => {
    if (!usuarioPermissoesEditando) return;
    try {
      const permissoesNormalizadas = normalizarListaPermissoesUsuario(permissoesTemporarias, usuarioPermissoesEditando.perfil);
      const resposta = await axios.put(`${API_URL}/auth/usuario-permissoes`, {
        id: usuarioPermissoesEditando.id,
        permissoes: permissoesNormalizadas
      });

      setUsuariosSistema((lista) => lista.map((u) => (
        u.id === usuarioPermissoesEditando.id
          ? { ...u, permissoes: resposta.data?.usuario?.permissoes || permissoesNormalizadas }
          : u
      )));

      if (usuarioLogado?.id === usuarioPermissoesEditando.id) {
        const usuarioAtualizado = {
          ...usuarioLogado,
          permissoes: resposta.data?.usuario?.permissoes || permissoesNormalizadas
        };
        setUsuarioLogado(usuarioAtualizado);
        localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtualizado));
      }

      setModalPermissoesAberto(false);
      setUsuarioPermissoesEditando(null);
      setMensagemUsuarios(`Permissões de ${usuarioPermissoesEditando.nome} atualizadas!`);
      await carregarUsuarios();
    } catch (erro) {
      setErroUsuarios(erro.response?.data?.detail || 'Falha ao salvar permissões do usuário.');
    }
  };

  const gerarChaveFiltros = (filtros) => JSON.stringify({ nu: [...(filtros?.nucleos || [])].sort(), un: [...(filtros?.unidades || [])].sort(), es: [...(filtros?.estruturas || [])].sort(), co: [...(filtros?.consultores || [])].sort(), si: [...(filtros?.situacoes || [])].sort(), mc: [...(filtros?.meios_captacao || [])].sort(), mo: [...(filtros?.modelos_comerciais || [])].sort(), cv: [...(filtros?.canais_venda || [])].sort(), di: filtros?.data_inicio || '', df: filtros?.data_fim || '' });

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
          nucleos: resposta.data.nucleos || prev.nucleos || ['NUCLEO 1', 'NUCLEO 2', 'NUCLEO 3'],
          unidades: resposta.data.unidades || [],
          estruturas: resposta.data.estruturas || [],
          consultores: resposta.data.consultores || [],
          situacoes: resposta.data.situacoes || [],
          meios_captacao: resposta.data.meios_captacao || [],
          modelos_comerciais: resposta.data.modelos_comerciais || [],
          canais_venda: resposta.data.canais_venda || prev.canais_venda || ['app_revendedor', 'omni', 'portal_revendedor', 'vd_mais', 'outros']
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

  const normalizarChaveFiltroMeta = (valor) => String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

  const obterEstruturasDaMetaDashboard = (item) => {
    const vinculadas = Array.isArray(item?.estruturas_vinculadas) ? item.estruturas_vinculadas : [];
    return vinculadas.length ? vinculadas : [item?.estrutura].filter(Boolean);
  };

  const calcularMetaDashboardPelosFiltros = (dadosMetasApi, filtros, dadosDashboardApi = null) => {
    const estruturasMetas = dadosMetasApi?.estruturas || [];

    if (!estruturasMetas.length) {
      return Number(dadosDashboardApi?.meta_contextual || dadosDashboardApi?.meta_ciclo || 0);
    }

    const estruturasFiltro = (filtros?.estruturas || []).map(normalizarChaveFiltroMeta).filter(Boolean);
    const unidadesFiltro = (filtros?.unidades || []).map((u) => String(u || '').trim()).filter(Boolean);

    if (estruturasFiltro.length > 0) {
      const metaEstruturas = estruturasMetas
        .filter((item) => {
          const estruturasItem = obterEstruturasDaMetaDashboard(item).map(normalizarChaveFiltroMeta);
          return estruturasItem.some((estrutura) => estruturasFiltro.includes(estrutura));
        })
        .reduce((acc, item) => acc + Number(item.receita || 0), 0);

      if (metaEstruturas > 0) return metaEstruturas;
    }

    if (unidadesFiltro.length > 0) {
      const metaUnidades = estruturasMetas
        .filter((item) => {
          const estruturasItem = obterEstruturasDaMetaDashboard(item);
          return estruturasItem.some((estrutura) => {
            const unidadeEstrutura = String(estrutura || '').split('-')[0].trim();
            return unidadesFiltro.includes(unidadeEstrutura);
          });
        })
        .reduce((acc, item) => acc + Number(item.receita || 0), 0);

      if (metaUnidades > 0) return metaUnidades;
    }

    return Number(dadosMetasApi?.meta_total_geral || dadosDashboardApi?.meta_contextual || dadosDashboardApi?.meta_ciclo || 0);
  };

  const carregarDashboard = async (filtros, forcarAtualizacao = false) => {
    if (!usuarioLogado) return;
    const chaveCache = gerarChaveFiltros(filtros);
    const chavePromessa = `dashboard_${chaveCache}_${forcarAtualizacao ? 'force' : 'cache'}`;

    if (!forcarAtualizacao && cacheDashboard[chaveCache]) {
      const c = cacheDashboard[chaveCache];
      setDados(c.dados);
      if (c.dadosMetas) {
        setDadosMetas(c.dadosMetas);
        setCacheMetas(c.dadosMetas);
      }
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

        const metaCalculada = calcularMetaDashboardPelosFiltros(resumoMetas, filtros, resDados.value.data);
        setDados(resDados.value.data);
        setMetaFaturamentoDashboard(metaCalculada);
        setCacheDashboard((prev) => ({ ...prev, [chaveCache]: { dados: resDados.value.data, dadosMetas: resumoMetas, metaFaturamentoDashboard: metaCalculada } }));
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
          const metaCalculada = calcularMetaDashboardPelosFiltros(dadosMetasAtualizados || cacheMetas, filtros, resDados.value.data);
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

  const carregarAuditoria = async (dias = filtrosAuditoria.dias) => {
    if (!usuarioLogado || usuarioLogado.perfil !== 'admin') return;
    setCarregandoAuditoria(true);
    setErroAuditoria('');
    try {
      const { data } = await axios.get(`${API_URL}/auditoria/resumo`, { params: { dias, limite: 200 } });
      setDadosAuditoria(data);
    } catch (erro) {
      setErroAuditoria(erro.response?.data?.detail || 'Erro ao carregar auditoria.');
    } finally {
      setCarregandoAuditoria(false);
    }
  };

  const registrarUsoTela = async (tela) => {
    if (!usuarioLogado || !tela) return;
    try {
      await axios.post(`${API_URL}/auditoria/registrar-uso`, {
        tela,
        modulo: obterNomeAba(tela),
        descricao: `Acessou a tela ${obterNomeAba(tela)}`
      });
    } catch (_) {}
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


  const carregarEstruturasConfig = async () => {
    setCarregandoEstruturasConfig(true); setErroEstruturaConfig('');
    try {
      const resposta = await axios.get(`${API_URL}/estruturas-config`);
      setListaEstruturasConfig(resposta.data.estruturas || []);
      if (resposta.data.nucleos?.length) setOpcFiltros((prev) => ({ ...prev, nucleos: resposta.data.nucleos }));
    } catch (erro) {
      setErroEstruturaConfig(erro.response?.data?.detail || 'Erro ao carregar estruturas e núcleos.');
    } finally {
      setCarregandoEstruturasConfig(false);
    }
  };

  const sincronizarEstruturasConfig = async () => {
    setErroEstruturaConfig(''); setMensagemEstruturaConfig(''); setCarregandoEstruturasConfig(true);
    try {
      const resposta = await axios.post(`${API_URL}/estruturas-config/sincronizar-pedidos`);
      setMensagemEstruturaConfig(resposta.data?.mensagem || 'Estruturas sincronizadas com as bases.');
      await carregarEstruturasConfig();
      await carregarOpcoesFiltros(true);
    } catch (erro) {
      setErroEstruturaConfig(erro.response?.data?.detail || 'Erro ao sincronizar estruturas.');
    } finally {
      setCarregandoEstruturasConfig(false);
    }
  };

  const limparFormEstruturaConfig = () => {
    setEstruturaConfigEditando(null);
    setEstruturaConfigForm(estruturaConfigVazia);
  };

  const salvarEstruturaConfig = async (e) => {
    e.preventDefault(); setErroEstruturaConfig(''); setMensagemEstruturaConfig('');
    try {
      const payload = { ...estruturaConfigForm, nucleo: estruturaConfigForm.nucleo || 'NUCLEO 1' };
      if (estruturaConfigEditando?.id) await axios.put(`${API_URL}/estruturas-config/${estruturaConfigEditando.id}`, payload);
      else await axios.post(`${API_URL}/estruturas-config`, payload);
      setMensagemEstruturaConfig(estruturaConfigEditando?.id ? 'Estrutura atualizada.' : 'Estrutura cadastrada.');
      limparFormEstruturaConfig();
      limparCachesDados();
      await carregarEstruturasConfig();
      await carregarOpcoesFiltros(true);
    } catch (erro) {
      setErroEstruturaConfig(erro.response?.data?.detail || 'Erro ao salvar estrutura.');
    }
  };

  const editarEstruturaConfig = (item) => {
    setEstruturaConfigEditando(item);
    setEstruturaConfigForm({
      cod_estrutura: item.cod_estrutura || '',
      estrutura: item.estrutura || '',
      canal: item.canal || 'VD',
      nucleo: item.nucleo || 'NUCLEO 1',
      tipo_estrutura: item.tipo_estrutura || 'estrutura',
      status: item.status || 'ativo'
    });
  };

  const excluirEstruturaConfig = async (item) => {
    const ok = window.confirm(`Remover a estrutura "${item.estrutura}" do cadastro de núcleos?`);
    if (!ok) return;
    setErroEstruturaConfig(''); setMensagemEstruturaConfig('');
    try {
      await axios.delete(`${API_URL}/estruturas-config/${item.id}`);
      setMensagemEstruturaConfig('Estrutura removida.');
      limparCachesDados();
      await carregarEstruturasConfig();
      await carregarOpcoesFiltros(true);
    } catch (erro) {
      setErroEstruturaConfig(erro.response?.data?.detail || 'Erro ao remover estrutura.');
    }
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
        setMensagemUpload(data.mensagem || 'Automação MAKE iniciada. Aguarde o download dos 5 relatórios no SGI.');
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


  const obterCicloReferenciaAtual = () => (
    dados?.ciclo_atual
    || ciclos?.find((c) => String(c.status_ciclo || '').toLowerCase() === 'ativo')?.ciclo
    || ciclos?.[0]?.ciclo
    || ''
  );

  const normalizarDataAcao = (valor) => {
    if (!valor) return '';
    return String(valor).slice(0, 10);
  };

  const obterCicloPorPeriodoAcao = (dataInicio, dataFim) => {
    const inicio = normalizarDataAcao(dataInicio);
    const fim = normalizarDataAcao(dataFim || dataInicio);

    if (!inicio && !fim) {
      return { ciclo: '', mensagem: 'Selecione o período para identificar o ciclo automaticamente.' };
    }

    if (!inicio || !fim) {
      return { ciclo: '', mensagem: 'Informe data início e data fim para identificar o ciclo.' };
    }

    if (inicio > fim) {
      return { ciclo: '', mensagem: 'A data inicial não pode ser maior que a data final.' };
    }

    const cicloEncontrado = (ciclos || []).find((cicloItem) => {
      const dataInicioCiclo = normalizarDataAcao(cicloItem.data_inicio);
      const dataFimCiclo = normalizarDataAcao(cicloItem.data_fim);
      return dataInicioCiclo && dataFimCiclo && inicio >= dataInicioCiclo && fim <= dataFimCiclo;
    });

    if (!cicloEncontrado) {
      return { ciclo: '', mensagem: 'Nenhum ciclo cadastrado cobre esse período.' };
    }

    return {
      ciclo: cicloEncontrado.ciclo || '',
      mensagem: `${formatarDataBR(inicio)} até ${formatarDataBR(fim)} pertence ao ciclo ${cicloEncontrado.ciclo}.`
    };
  };

  const atualizarPeriodoAcao = (campo, valor) => {
    setAcaoCicloForm((atual) => {
      const novo = { ...atual, [campo]: valor };
      const cicloInfo = obterCicloPorPeriodoAcao(novo.data_inicio, novo.data_fim);
      return { ...novo, ciclo: cicloInfo.ciclo || '' };
    });
  };

  const carregarAcoesCiclo = async () => {
    if (!usuarioLogado) return;

    setCarregandoAcoesCiclo(true);
    setErroAcoesCiclo('');

    try {
      await Promise.allSettled([carregarOpcoesFiltros(), carregarCiclos()]);
      const ciclo = obterCicloReferenciaAtual();
      const params = ciclo ? { ciclo } : {};
      const { data } = await axios.get(`${API_URL}/acoes-ciclo`, { params });
      setAcoesCiclo(data?.acoes || []);
    } catch (erro) {
      setErroAcoesCiclo(erro.response?.data?.detail || 'Erro ao carregar ações do ciclo.');
    } finally {
      setCarregandoAcoesCiclo(false);
    }
  };

  const abrirModalCriarAcaoCiclo = () => {
    setAcaoCicloEditandoId(null);
    setAcaoCicloForm({ ...acaoCicloVazia, ciclo: '', status_acao: 'acontecendo' });
    setBuscaEstruturaAcao('');
    setMensagemAcoesCiclo('');
    setErroAcoesCiclo('');
    setModalAcaoCicloAberto(true);
  };

  const abrirModalEditarAcaoCiclo = (acao) => {
    setAcaoCicloEditandoId(acao.id);
    setAcaoCicloForm({
      nome_acao: acao.nome_acao || '',
      ciclo: acao.ciclo || obterCicloReferenciaAtual(),
      data_inicio: acao.data_inicio || '',
      data_fim: acao.data_fim || '',
      meta_valor: Number(acao.meta_valor || 0),
      status_acao: acao.status_acao || 'acontecendo',
      estruturas: Array.isArray(acao.estruturas) ? acao.estruturas : [],
      observacao: acao.observacao || ''
    });
    setBuscaEstruturaAcao('');
    setMensagemAcoesCiclo('');
    setErroAcoesCiclo('');
    setModalAcaoCicloAberto(true);
  };

  const alternarEstruturaAcao = (estrutura) => {
    setAcaoCicloForm((atual) => {
      const lista = Array.isArray(atual.estruturas) ? atual.estruturas : [];
      return {
        ...atual,
        estruturas: lista.includes(estrutura)
          ? lista.filter((item) => item !== estrutura)
          : [...lista, estrutura]
      };
    });
  };

  const selecionarTodasEstruturasAcao = (estruturas) => {
    setAcaoCicloForm((atual) => ({ ...atual, estruturas: estruturas }));
  };

  const salvarAcaoCiclo = async () => {
    const nome = String(acaoCicloForm.nome_acao || '').trim();
    const dataInicio = String(acaoCicloForm.data_inicio || '').trim();
    const dataFim = String(acaoCicloForm.data_fim || '').trim();
    const cicloInfo = obterCicloPorPeriodoAcao(dataInicio, dataFim);
    const ciclo = String(cicloInfo.ciclo || '').trim();
    const metaValor = Number(acaoCicloForm.meta_valor || 0);

    if (!nome) {
      setErroAcoesCiclo('Informe o nome da ação.');
      return;
    }
    if (!dataInicio || !dataFim) {
      setErroAcoesCiclo('Informe o período da ação.');
      return;
    }
    if (new Date(dataInicio) > new Date(dataFim)) {
      setErroAcoesCiclo('A data inicial não pode ser maior que a data final.');
      return;
    }
    if (!ciclo) {
      setErroAcoesCiclo(cicloInfo.mensagem || 'A data informada não pertence a nenhum ciclo cadastrado.');
      return;
    }
    if (metaValor <= 0) {
      setErroAcoesCiclo('Informe uma meta maior que zero.');
      return;
    }
    if (!Array.isArray(acaoCicloForm.estruturas) || acaoCicloForm.estruturas.length === 0) {
      setErroAcoesCiclo('Selecione pelo menos uma estrutura.');
      return;
    }

    setCarregandoAcoesCiclo(true);
    setErroAcoesCiclo('');
    setMensagemAcoesCiclo('');

    const payload = {
      nome_acao: nome,
      ciclo,
      data_inicio: dataInicio,
      data_fim: dataFim,
      meta_valor: metaValor,
      status_acao: acaoCicloForm.status_acao || 'acontecendo',
      estruturas: acaoCicloForm.estruturas || [],
      observacao: acaoCicloForm.observacao || ''
    };

    try {
      if (acaoCicloEditandoId) {
        await axios.put(`${API_URL}/acoes-ciclo/${acaoCicloEditandoId}`, payload);
        setMensagemAcoesCiclo('Ação atualizada com sucesso.');
      } else {
        await axios.post(`${API_URL}/acoes-ciclo`, payload);
        setMensagemAcoesCiclo('Ação criada com sucesso.');
      }

      setModalAcaoCicloAberto(false);
      setAcaoCicloEditandoId(null);
      setAcaoCicloForm(acaoCicloVazia);
      await carregarAcoesCiclo();
    } catch (erro) {
      setErroAcoesCiclo(erro.response?.data?.detail || 'Erro ao salvar ação.');
    } finally {
      setCarregandoAcoesCiclo(false);
    }
  };

  const apagarAcaoCiclo = async (acao) => {
    const confirmar = window.confirm(`Apagar a ação "${acao.nome_acao}"?`);
    if (!confirmar) return;

    setCarregandoAcoesCiclo(true);
    setErroAcoesCiclo('');
    setMensagemAcoesCiclo('');

    try {
      await axios.delete(`${API_URL}/acoes-ciclo/${acao.id}`);
      setMensagemAcoesCiclo('Ação apagada com sucesso.');
      if (acaoCicloDetalhe?.id === acao.id) setAcaoCicloDetalhe(null);
      await carregarAcoesCiclo();
    } catch (erro) {
      setErroAcoesCiclo(erro.response?.data?.detail || 'Erro ao apagar ação.');
    } finally {
      setCarregandoAcoesCiclo(false);
    }
  };

  const carregarDetalheAcaoCiclo = async (acao) => {
    setCarregandoAcoesCiclo(true);
    setErroAcoesCiclo('');

    try {
      const { data } = await axios.get(`${API_URL}/acoes-ciclo/${acao.id}`);
      setAcaoCicloDetalhe(data?.acao || null);
    } catch (erro) {
      setErroAcoesCiclo(erro.response?.data?.detail || 'Erro ao carregar detalhes da ação.');
    } finally {
      setCarregandoAcoesCiclo(false);
    }
  };

  const statusVisualAcao = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'cancelada') return { texto: 'Cancelada', classe: 'bg-red-50 text-red-700' };
    if (s === 'concluida' || s === 'concluída') return { texto: 'Concluída', classe: 'bg-gray-100 text-gray-600' };
    return { texto: 'Acontecendo', classe: 'bg-[#e6f6f7] text-[#048187]' };
  };

  const cicloLojaSelecionado = () => (
    cicloLoja
    || dadosLoja?.resumo?.ciclo
    || dados?.ciclo_atual
    || ciclos?.find((c) => String(c.status_ciclo || '').toLowerCase() === 'ativo')?.ciclo
    || ciclos?.[0]?.ciclo
    || ''
  );

  const carregarDadosLoja = async (cicloParam = '') => {
    setCarregandoLoja(true);
    setErroLoja('');
    try {
      const cicloConsulta = cicloParam || cicloLojaSelecionado();
      const { data } = await axios.get(`${API_URL}/loja/dashboard`, { params: cicloConsulta ? { ciclo: cicloConsulta } : {} });
      setDadosLoja(data || null);
      if (data?.resumo?.ciclo && !cicloLoja) setCicloLoja(data.resumo.ciclo);
    } catch (erro) {
      setErroLoja(erro.response?.data?.detail || 'Erro ao carregar dados da LOJA.');
    } finally {
      setCarregandoLoja(false);
    }
  };

  const uploadGerencialLoja = async (e) => {
    e.preventDefault();
    if (!arquivoGerencialLoja) {
      setErroLoja('Selecione a base gerencial de loja para importar.');
      return;
    }
    setCarregandoLoja(true);
    setErroLoja('');
    setMensagemLoja('');
    try {
      const form = new FormData();
      form.append('file', arquivoGerencialLoja);
      form.append('ciclo', cicloLojaSelecionado());
      form.append('substituir', 'true');
      const { data } = await axios.post(`${API_URL}/loja/upload-gerencial`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMensagemLoja(data?.mensagem || 'Base de LOJA importada com sucesso.');
      setArquivoGerencialLoja(null);
      await carregarDadosLoja(data?.ciclo || cicloLojaSelecionado());
    } catch (erro) {
      setErroLoja(erro.response?.data?.detail || 'Erro ao importar base gerencial de loja.');
    } finally {
      setCarregandoLoja(false);
    }
  };


  const selecionarArquivoLojaUpload = (tipo, file) => {
    setArquivosLojaUpload((atual) => ({ ...atual, [tipo]: file || null }));
  };

  const importarBaseLojaUpload = async (tipo, endpoint, titulo, opcoes = {}) => {
    const arquivo = arquivosLojaUpload?.[tipo];
    if (!arquivo) {
      setErroLoja(`Selecione o arquivo: ${titulo}.`);
      return;
    }

    setCarregandoLoja(true);
    setErroLoja('');
    setMensagemLoja('');

    try {
      const form = new FormData();
      form.append('file', arquivo);

      if (opcoes.usaCiclo !== false) {
        form.append('ciclo', cicloLojaSelecionado());
      }

      if (opcoes.substituir) {
        form.append('substituir', 'true');
      }

      const { data } = await axios.post(`${API_URL}${endpoint}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMensagemLoja(data?.mensagem || `${titulo} importada.`);
      setArquivosLojaUpload((atual) => ({ ...atual, [tipo]: null }));
      await carregarDadosLoja(data?.ciclo || cicloLojaSelecionado());
    } catch (erro) {
      setErroLoja(erro.response?.data?.detail || `Erro ao importar ${titulo}.`);
    } finally {
      setCarregandoLoja(false);
    }
  };

  const abrirModalAtualizacaoLojaSgi = () => {
    setErroLoja('');
    setMensagemLoja('');
    setStatusSgiLoja('');
    setSgiLojaForm({ usuario: '', senha: '' });
    setModalSgiLojaAberto(true);

    window.setTimeout(() => {
      if (sgiLojaUsuarioRef.current) sgiLojaUsuarioRef.current.value = '';
      if (sgiLojaSenhaRef.current) sgiLojaSenhaRef.current.value = '';
      sgiLojaUsuarioRef.current?.focus?.();
    }, 80);
  };

  const enviarComandoExtensaoLojaSgi = (payload) => new Promise((resolve, reject) => {
    const requestId = `loja-sgi-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const timeout = window.setTimeout(() => {
      window.removeEventListener('message', listener);
      reject(new Error('A extensão não respondeu. Verifique se a extensão DASH SB está instalada e atualizada.'));
    }, 15 * 60 * 1000);

    function listener(event) {
      if (event.source !== window) return;
      const msg = event.data || {};
      if (msg.origem !== 'dash-sb-extensao-loja-sgi') return;
      if (msg.requestId !== requestId) return;

      window.clearTimeout(timeout);
      window.removeEventListener('message', listener);

      if (msg.ok) resolve(msg);
      else reject(new Error(msg.erro || 'A automação SGI falhou.'));
    }

    window.addEventListener('message', listener);
    window.postMessage({
      origem: 'dash-sb-painel',
      acao: 'ATUALIZAR_LOJA_GMV_SGI',
      requestId,
      payload
    }, window.location.origin);
  });

  const iniciarAtualizacaoLojaViaSgi = async (e) => {
    e.preventDefault();

    const usuario = String(sgiLojaUsuarioRef.current?.value || '').trim();
    const senha = String(sgiLojaSenhaRef.current?.value || '').trim();
    const ciclo = cicloLojaSelecionado();

    if (!usuario) {
      setStatusSgiLoja('Informe o usuário do SGI.');
      return;
    }

    if (!senha) {
      setStatusSgiLoja('Informe a senha do SGI.');
      return;
    }

    if (!ciclo) {
      setStatusSgiLoja('Não foi possível identificar o ciclo atual da LOJA.');
      return;
    }

    setSgiLojaExecutando(true);
    setCarregandoLoja(true);
    setErroLoja('');
    setMensagemLoja('');
    setStatusSgiLoja('Iniciando automação no SGI. Não feche o navegador.');

    try {
      const cicloInfo = ciclos.find((c) => String(c.ciclo || '') === String(ciclo || '')) || {};
      const token = localStorage.getItem(TOKEN_STORAGE_KEY) || '';

      const resposta = await enviarComandoExtensaoLojaSgi({
        apiUrl: API_URL,
        token,
        usuario,
        senha,
        ciclo,
        dataInicioCiclo: cicloInfo.data_inicio || dadosLoja?.resumo?.data_inicio || '',
        dataFimCiclo: cicloInfo.data_fim || dadosLoja?.resumo?.data_fim || '',
        dataReferenciaDiaria: new Date().toISOString().slice(0, 10)
      });

      setMensagemLoja(resposta.mensagem || 'Base de vendas LOJA atualizada via SGI com sucesso.');
      setStatusSgiLoja('');
      setSgiLojaForm({ usuario: '', senha: '' });
      if (sgiLojaUsuarioRef.current) sgiLojaUsuarioRef.current.value = '';
      if (sgiLojaSenhaRef.current) sgiLojaSenhaRef.current.value = '';
      setModalSgiLojaAberto(false);
      await carregarDadosLoja(ciclo);
    } catch (erro) {
      setErroLoja(erro.message || 'Erro ao atualizar vendas LOJA via SGI.');
      setStatusSgiLoja(erro.message || 'Erro ao atualizar vendas LOJA via SGI.');
    } finally {
      setSgiLojaExecutando(false);
      setCarregandoLoja(false);
    }
  };

  const salvarUnidadeLoja = async (e) => {
    e.preventDefault();
    setCarregandoLoja(true); setErroLoja(''); setMensagemLoja('');
    try {
      await axios.post(`${API_URL}/loja/unidades`, lojaUnidadeForm);
      setMensagemLoja('Unidade salva com sucesso.');
      setLojaUnidadeForm({ codigo_pdv: '', cidade: '', nome_loja: '', status_loja: 'ativo' });
      await carregarDadosLoja();
    } catch (erro) {
      setErroLoja(erro.response?.data?.detail || 'Erro ao salvar unidade.');
    } finally { setCarregandoLoja(false); }
  };

  const salvarConsultoraLoja = async (e) => {
    e.preventDefault();
    setCarregandoLoja(true); setErroLoja(''); setMensagemLoja('');
    try {
      await axios.post(`${API_URL}/loja/consultoras`, lojaConsultoraForm);
      setMensagemLoja('Consultora salva com sucesso.');
      setLojaConsultoraForm({ id_consultora: '', nome_consultora: '', codigo_pdv_oficial: '', status_consultora: 'ativo' });
      await carregarDadosLoja();
    } catch (erro) {
      setErroLoja(erro.response?.data?.detail || 'Erro ao salvar consultora.');
    } finally { setCarregandoLoja(false); }
  };

  const salvarMetaUnidadeLoja = async (e) => {
    e.preventDefault();
    setCarregandoLoja(true); setErroLoja(''); setMensagemLoja('');
    try {
      await axios.post(`${API_URL}/loja/metas/unidade`, { ...lojaMetaUnidadeForm, ciclo: lojaMetaUnidadeForm.ciclo || cicloLojaSelecionado() });
      setMensagemLoja('Meta da unidade salva com sucesso.');
      setLojaMetaUnidadeForm({ ciclo: cicloLojaSelecionado(), codigo_pdv: '', meta_faturamento: '', meta_boleto_medio: '', meta_itens_boleto: 4, meta_skin: '', meta_servicos_mes: '', meta_servicos_ano: '' });
      setLinhaMetaUnidadeLojaEditando(null);
      await carregarDadosLoja();
    } catch (erro) {
      setErroLoja(erro.response?.data?.detail || 'Erro ao salvar meta da unidade.');
    } finally { setCarregandoLoja(false); }
  };

  const salvarMetaConsultoraLoja = async (e) => {
    e.preventDefault();
    setCarregandoLoja(true); setErroLoja(''); setMensagemLoja('');
    try {
      await axios.post(`${API_URL}/loja/metas/consultora`, { ...lojaMetaConsultoraForm, ciclo: lojaMetaConsultoraForm.ciclo || cicloLojaSelecionado() });
      setMensagemLoja('Meta da consultora salva com sucesso.');
      setLojaMetaConsultoraForm({ ciclo: cicloLojaSelecionado(), id_consultora: '', codigo_pdv_oficial: '', meta_faturamento: '', meta_boleto_medio: '', meta_itens_boleto: 4, meta_skin: '' });
      setLinhaMetaConsultoraLojaEditando(null);
      await carregarDadosLoja();
    } catch (erro) {
      setErroLoja(erro.response?.data?.detail || 'Erro ao salvar meta da consultora.');
    } finally { setCarregandoLoja(false); }
  };


  const editarUnidadeLoja = (u) => {
    setLojaUnidadeForm({
      codigo_pdv: String(u?.codigo_pdv || ''),
      cidade: String(u?.cidade || ''),
      nome_loja: String(u?.nome_loja || ''),
      status_loja: String(u?.status_loja || 'ativo')
    });
    setMensagemLoja('Edite a unidade e clique em Salvar.');
  };

  const editarConsultoraLoja = (c) => {
    setLojaConsultoraForm({
      id_consultora: String(c?.id_consultora || ''),
      nome_consultora: String(c?.nome_consultora || ''),
      codigo_pdv_oficial: String(c?.codigo_pdv_oficial || ''),
      status_consultora: String(c?.status_consultora || 'ativo')
    });
    setMensagemLoja('Edite a consultora e clique em Salvar.');
  };

  const editarMetaUnidadeLoja = (u) => {
    setLojaMetaUnidadeForm({
      ciclo: cicloLojaSelecionado(),
      codigo_pdv: String(u?.codigo_pdv || ''),
      meta_faturamento: String(u?.meta_faturamento || ''),
      meta_boleto_medio: String(u?.meta_boleto_medio || ''),
      meta_itens_boleto: String(u?.meta_itens_boleto || 4),
      meta_skin: String(u?.meta_skin || ''),
      meta_servicos_mes: String(u?.meta_servicos_mes || ''),
      meta_servicos_ano: String(u?.meta_servicos_ano || '')
    });
    setLinhaMetaUnidadeLojaEditando(String(u?.codigo_pdv || ''));
    setMensagemLoja('Edite a meta da unidade na própria linha e clique em Salvar.');
  };

  const editarMetaConsultoraLoja = (c) => {
    setLojaMetaConsultoraForm({
      ciclo: cicloLojaSelecionado(),
      id_consultora: String(c?.id_consultora || ''),
      codigo_pdv_oficial: String(c?.codigo_pdv_oficial || ''),
      meta_faturamento: String(c?.meta_faturamento || ''),
      meta_boleto_medio: String(c?.meta_boleto_medio || ''),
      meta_itens_boleto: String(c?.meta_itens_boleto || 4),
      meta_skin: String(c?.meta_skin || '')
    });
    setLinhaMetaConsultoraLojaEditando(String(c?.id_consultora || ''));
    setMensagemLoja('Edite a meta da consultora na própria linha e clique em Salvar.');
  };

  const excluirUnidadeLoja = async (codigo) => {
    if (!codigo || !window.confirm(`Apagar a unidade ${codigo}?`)) return;
    setCarregandoLoja(true); setErroLoja(''); setMensagemLoja('');
    try {
      await axios.delete(`${API_URL}/loja/unidades/${encodeURIComponent(codigo)}`);
      setMensagemLoja('Unidade apagada com sucesso.');
      await carregarDadosLoja();
    } catch (erro) {
      setErroLoja(erro.response?.data?.detail || 'Erro ao apagar unidade.');
    } finally { setCarregandoLoja(false); }
  };

  const excluirConsultoraLoja = async (id) => {
    if (!id || !window.confirm(`Apagar a consultora ${id}?`)) return;
    setCarregandoLoja(true); setErroLoja(''); setMensagemLoja('');
    try {
      await axios.delete(`${API_URL}/loja/consultoras/${encodeURIComponent(id)}`);
      setMensagemLoja('Consultora apagada com sucesso.');
      await carregarDadosLoja();
    } catch (erro) {
      setErroLoja(erro.response?.data?.detail || 'Erro ao apagar consultora.');
    } finally { setCarregandoLoja(false); }
  };

  const excluirMetaUnidadeLoja = async (codigo) => {
    const ciclo = cicloLojaSelecionado();
    if (!codigo || !window.confirm(`Apagar a meta da unidade ${codigo} no ciclo ${ciclo}?`)) return;
    setCarregandoLoja(true); setErroLoja(''); setMensagemLoja('');
    try {
      await axios.delete(`${API_URL}/loja/metas/unidade`, { params: { ciclo, codigo_pdv: codigo } });
      setMensagemLoja('Meta da unidade apagada com sucesso.');
      await carregarDadosLoja(ciclo);
    } catch (erro) {
      setErroLoja(erro.response?.data?.detail || 'Erro ao apagar meta da unidade.');
    } finally { setCarregandoLoja(false); }
  };

  const excluirMetaConsultoraLoja = async (id) => {
    const ciclo = cicloLojaSelecionado();
    if (!id || !window.confirm(`Apagar a meta da consultora ${id} no ciclo ${ciclo}?`)) return;
    setCarregandoLoja(true); setErroLoja(''); setMensagemLoja('');
    try {
      await axios.delete(`${API_URL}/loja/metas/consultora`, { params: { ciclo, id_consultora: id } });
      setMensagemLoja('Meta da consultora apagada com sucesso.');
      await carregarDadosLoja(ciclo);
    } catch (erro) {
      setErroLoja(erro.response?.data?.detail || 'Erro ao apagar meta da consultora.');
    } finally { setCarregandoLoja(false); }
  };


  const fecharCicloHistoricoLoja = async () => {
    const ciclo = cicloLojaSelecionado();
    if (!ciclo) {
      setErroLoja('Selecione um ciclo antes de salvar no histórico.');
      return;
    }
    if (!window.confirm(`Salvar a fotografia oficial da LOJA para o ciclo ${ciclo}?`)) return;

    setCarregandoLoja(true);
    setErroLoja('');
    setMensagemLoja('');
    try {
      const { data } = await axios.post(`${API_URL}/loja/historico/fechar-ciclo`, {
        ciclo,
        fechado_por: usuarioLogado?.nome || usuarioLogado?.email || '',
        observacao: `Fechamento LOJA do ciclo ${ciclo}`,
        substituir: true
      });
      setMensagemLoja(data?.mensagem || `Ciclo LOJA ${ciclo} salvo no histórico.`);
    } catch (erro) {
      setErroLoja(erro.response?.data?.detail || 'Erro ao salvar ciclo LOJA no histórico.');
    } finally {
      setCarregandoLoja(false);
    }
  };

  const carregarTelaAtual = async (filtros = filtrosAtivos, forcarAtualizacao = false) => {
    if (!usuarioLogado) return;

    if (telaAtual === 'Dashboard') return carregarDashboard(filtros, forcarAtualizacao);
    if (telaAtual === 'Metas' || telaAtual === 'Ranking') return carregarDashboardEMetas(filtros, forcarAtualizacao);
    if (telaAtual === 'Comparativo') return carregarComparativo(filtros);
    if (telaAtual === 'Ações') return carregarAcoesCiclo();
    if (telaAtual === 'Histórico') return carregarHistoricoCiclos();
    if (telaAtual === 'Revendedores') return carregarRevendedores();
    if (telaAtual === 'Base') return carregarCiclos();
    if (telaAtual === 'Cadastro') return Promise.allSettled([carregarCiclos(), carregarListaConsultores(), carregarEstruturasConfig()]);
    if (telaEhLoja(telaAtual)) return carregarDadosLoja();
    if (telaAtual === 'ADM') return carregarAuditoria();
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

  const selecionarArquivoLancamentoHistorico = (campo, files, multiplo = false) => {
    const lista = Array.from(files || []);
    setLancamentoHistorico((atual) => ({
      ...atual,
      [campo]: multiplo ? lista : (lista[0] || null)
    }));
  };

  const processarLancamentoHistorico = async () => {
    const ciclo = String(lancamentoHistorico.ciclo || '').trim();
    if (!ciclo) {
      setErroHistorico('Informe o ciclo que deseja lançar. Ex.: 08/2026.');
      setVisaoHistorico('lancar');
      return;
    }
    if (!lancamentoHistorico.pedidos) {
      setErroHistorico('Envie pelo menos a base de Pedidos do ciclo.');
      setVisaoHistorico('lancar');
      return;
    }

    const confirmar = window.confirm(`Processar e lançar o ciclo ${ciclo} no histórico? O histórico desse ciclo será substituído.`);
    if (!confirmar) return;

    const formData = new FormData();
    formData.append('ciclo', ciclo);
    formData.append('lancado_por', usuarioLogado?.nome || usuarioLogado?.email || 'Sistema');
    formData.append('observacao', lancamentoHistorico.observacao || `Lançamento retroativo do ciclo ${ciclo}`);
    formData.append('substituir', 'true');
    if (lancamentoHistorico.data_inicio) formData.append('data_inicio', lancamentoHistorico.data_inicio);
    if (lancamentoHistorico.data_fim) formData.append('data_fim', lancamentoHistorico.data_fim);
    formData.append('pedidos', lancamentoHistorico.pedidos);
    if (lancamentoHistorico.base_ativa) formData.append('base_ativa', lancamentoHistorico.base_ativa);
    if (lancamentoHistorico.consultores) formData.append('consultores', lancamentoHistorico.consultores);
    if (lancamentoHistorico.metas) formData.append('metas', lancamentoHistorico.metas);
    (lancamentoHistorico.make || []).forEach((arquivo) => formData.append('make', arquivo));
    (lancamentoHistorico.cabelo || []).forEach((arquivo) => formData.append('cabelo', arquivo));

    setCarregandoHistorico(true);
    setErroHistorico('');
    setMensagemHistorico('');
    try {
      const { data } = await axios.post(`${API_URL}/historico/lancar-ciclo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMensagemHistorico(data?.mensagem || `Ciclo ${ciclo} lançado com sucesso.`);
      setCicloHistoricoSelecionado(ciclo);
      setVisaoHistorico('estruturas');
      setLancamentoHistorico({ ciclo: '', data_inicio: '', data_fim: '', observacao: '', pedidos: null, base_ativa: null, consultores: null, metas: null, make: [], cabelo: [] });
      await carregarHistoricoCiclos();
      await carregarHistoricoCiclo(ciclo);
    } catch (erro) {
      setErroHistorico(erro.response?.data?.detail || 'Erro ao lançar ciclo histórico.');
      setVisaoHistorico('lancar');
    } finally {
      setCarregandoHistorico(false);
    }
  };

  const salvarSnapshotAtualHistorico = async () => {
    const ciclo = String(lancamentoHistorico.ciclo || dados?.ciclo_atual || ciclos.find((c) => c.status_ciclo === 'ativo')?.ciclo || '').trim();
    if (!ciclo) {
      setErroHistorico('Informe o ciclo vigente para salvar snapshot. Ex.: 09/2026.');
      setVisaoHistorico('lancar');
      return;
    }
    const confirmar = window.confirm(`Salvar uma fotografia parcial do ciclo vigente ${ciclo}?`);
    if (!confirmar) return;

    setCarregandoHistorico(true);
    setErroHistorico('');
    setMensagemHistorico('');
    try {
      const { data } = await axios.post(`${API_URL}/historico/snapshot-atual`, {
        ciclo,
        fechado_por: usuarioLogado?.nome || usuarioLogado?.email || 'Sistema',
        observacao: `Snapshot parcial do ciclo vigente ${ciclo}`,
        substituir: true
      });
      setMensagemHistorico(data?.mensagem || `Snapshot do ciclo ${ciclo} salvo.`);
      setCicloHistoricoSelecionado(ciclo);
      setVisaoHistorico('estruturas');
      await carregarHistoricoCiclos();
      await carregarHistoricoCiclo(ciclo);
    } catch (erro) {
      setErroHistorico(erro.response?.data?.detail || 'Erro ao salvar snapshot do ciclo vigente.');
      setVisaoHistorico('lancar');
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

  const abrirModalRecuperacaoSenha = () => {
    setErroLogin('');
    setErroRecuperacaoSenha('');
    setMensagemRecuperacaoSenha('');
    setCodigoGeradoRecuperacao('');
    setEtapaRecuperacaoSenha('solicitar');
    setFormRecuperacaoSenha({
      email: emailLogin || '',
      codigo: '',
      nova_senha: '',
      confirmar_senha: ''
    });
    setModalRecuperacaoSenhaAberto(true);
  };

  const fecharModalRecuperacaoSenha = () => {
    if (carregandoRecuperacaoSenha) return;
    setModalRecuperacaoSenhaAberto(false);
    setErroRecuperacaoSenha('');
    setMensagemRecuperacaoSenha('');
    setCodigoGeradoRecuperacao('');
  };

  const solicitarCodigoRecuperacaoSenha = async (e) => {
    e.preventDefault();
    setErroRecuperacaoSenha('');
    setMensagemRecuperacaoSenha('');
    setCodigoGeradoRecuperacao('');

    const email = String(formRecuperacaoSenha.email || '').trim().toLowerCase();
    if (!email) {
      setErroRecuperacaoSenha('Informe o e-mail cadastrado.');
      return;
    }

    setCarregandoRecuperacaoSenha(true);
    try {
      const resposta = await axios.post(`${API_URL}/auth/recuperar-senha/solicitar`, { email });
      setFormRecuperacaoSenha((atual) => ({ ...atual, email, codigo: '', nova_senha: '', confirmar_senha: '' }));
      setCodigoGeradoRecuperacao('');
      setEtapaRecuperacaoSenha('solicitar');
      setMensagemRecuperacaoSenha(resposta.data?.mensagem || 'Solicitação registrada. Procure um administrador do sistema.');
    } catch (erro) {
      setErroRecuperacaoSenha(erro.response?.data?.detail || 'Erro ao gerar código de recuperação.');
    } finally {
      setCarregandoRecuperacaoSenha(false);
    }
  };

  const redefinirSenhaRecuperacao = async (e) => {
    e.preventDefault();
    setErroRecuperacaoSenha('');
    setMensagemRecuperacaoSenha('');

    const email = String(formRecuperacaoSenha.email || '').trim().toLowerCase();
    const codigo = String(formRecuperacaoSenha.codigo || '').trim();
    const novaSenha = String(formRecuperacaoSenha.nova_senha || '');
    const confirmarSenha = String(formRecuperacaoSenha.confirmar_senha || '');

    if (!email || !codigo || !novaSenha || !confirmarSenha) {
      setErroRecuperacaoSenha('Preencha todos os campos.');
      return;
    }
    if (novaSenha.length < 6) {
      setErroRecuperacaoSenha('A nova senha precisa ter no mínimo 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setErroRecuperacaoSenha('As senhas não conferem.');
      return;
    }

    setCarregandoRecuperacaoSenha(true);
    try {
      const resposta = await axios.post(`${API_URL}/auth/recuperar-senha/redefinir`, {
        email,
        codigo,
        nova_senha: novaSenha
      });
      setMensagemRecuperacaoSenha(resposta.data?.mensagem || 'Senha redefinida com sucesso.');
      setSenhaLogin('');
      setEmailLogin(email);
      setErroLogin('');
      setTimeout(() => {
        setModalRecuperacaoSenhaAberto(false);
        setMensagemRecuperacaoSenha('');
        setCodigoGeradoRecuperacao('');
      }, 1200);
    } catch (erro) {
      setErroRecuperacaoSenha(erro.response?.data?.detail || 'Erro ao redefinir senha.');
    } finally {
      setCarregandoRecuperacaoSenha(false);
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


  const rotuloFiltroInterativo = (categoria, valor) => {
    const mapaCanal = {
      app_revendedor: 'App Revendedor',
      omni: 'Omni',
      portal_revendedor: 'Portal Revendedor',
      vd_mais: 'VD+',
      outros: 'Outros'
    };
    const mapaCategoria = {
      nucleos: 'Núcleo',
      unidades: 'Unidade',
      estruturas: 'Estrutura',
      consultores: 'Consultor',
      situacoes: 'Situação',
      meios_captacao: 'Meio de Captação',
      modelos_comerciais: 'Modelo de Venda',
      canais_venda: 'Canal de Venda'
    };
    const valorLabel = categoria === 'canais_venda' ? (mapaCanal[valor] || valor) : valor;
    return `${mapaCategoria[categoria] || categoria}: ${valorLabel}`;
  };

  const aplicarFiltroInterativo = (categoria, valor) => {
    const valorLimpo = String(valor || '').trim();
    if (!categoria || !valorLimpo) return;

    const listaAtual = filtrosAtivos[categoria] || [];
    const jaSelecionadoUnico = listaAtual.length === 1 && listaAtual[0] === valorLimpo;
    const novosFiltros = {
      ...filtrosAtivos,
      [categoria]: jaSelecionadoUnico ? [] : [valorLimpo]
    };

    if (gerarChaveFiltros(novosFiltros) === gerarChaveFiltros(filtrosAtivos)) return;

    setPainelFiltrosAberto(false);
    setFiltrosAtivos(novosFiltros);
    ultimoCarregamentoTelaRef.current = '';
    carregarTelaAtual(novosFiltros, false);
  };

  const limparFiltroInterativo = (categoria, valor = null) => {
    const novosFiltros = { ...filtrosAtivos };
    if (valor === null) novosFiltros[categoria] = [];
    else novosFiltros[categoria] = (novosFiltros[categoria] || []).filter((item) => item !== valor);
    setFiltrosAtivos(novosFiltros);
    ultimoCarregamentoTelaRef.current = '';
    carregarTelaAtual(novosFiltros, false);
  };

  const filtrosAtivosResumo = Object.entries(filtrosAtivos)
    .filter(([categoria, valor]) => Array.isArray(valor) && valor.length > 0)
    .flatMap(([categoria, valores]) => valores.map((valor) => ({ categoria, valor, label: rotuloFiltroInterativo(categoria, valor) })));

  const iniciarAtualizacaoAutomaticaPedidos = () => {
    setErroUpload('');
    setMensagemUpload('Solicitando atualização automática de pedidos pela extensão...');
    setCarregandoAutomacaoPedidos(true);

    window.postMessage({
      source: 'DASH_SB',
      acao: 'INICIAR_EXTRACAO_PEDIDOS',
      tokenAuth
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

    if (telaAtual === 'Cadastro') { tarefas.push(carregarCiclos()); tarefas.push(carregarListaConsultores()); tarefas.push(carregarEstruturasConfig()); }
    if (telaAtual === 'Histórico') tarefas.push(carregarHistoricoCiclos());
    if (telaAtual === 'Base') tarefas.push(carregarCiclos());
    if (telaAtual === 'ADM') tarefas.push(carregarAuditoria());
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
  const gerarSenhaTemporariaAdmin = () => {
    const codigo = Math.floor(100000 + Math.random() * 900000);
    setNovaSenhaAdmin(`Dash@${codigo}`);
  };
  const abrirResetSenhaAdmin = (usuario) => {
    setUsuarioResetSenhaAdmin(usuario);
    const codigo = Math.floor(100000 + Math.random() * 900000);
    setNovaSenhaAdmin(`Dash@${codigo}`);
    setErroUsuarios('');
    setMensagemUsuarios('');
    setModalResetSenhaAdminAberto(true);
  };
  const confirmarResetSenhaAdmin = async (e) => {
    e.preventDefault();
    if (!usuarioResetSenhaAdmin) return;
    if (!novaSenhaAdmin || novaSenhaAdmin.length < 6) {
      setErroUsuarios('A senha temporária precisa ter no mínimo 6 caracteres.');
      return;
    }
    setCarregandoResetSenhaAdmin(true);
    setErroUsuarios('');
    setMensagemUsuarios('');
    try {
      await axios.post(`${API_URL}/auth/usuarios/resetar-senha`, {
        email: usuarioResetSenhaAdmin.email,
        nova_senha: novaSenhaAdmin
      });
      setMensagemUsuarios(`Senha temporária criada para ${usuarioResetSenhaAdmin.email}: ${novaSenhaAdmin}`);
      setModalResetSenhaAdminAberto(false);
      setUsuarioResetSenhaAdmin(null);
      await carregarUsuarios();
    } catch (erro) {
      setErroUsuarios(erro.response?.data?.detail || 'Erro ao resetar senha.');
    } finally {
      setCarregandoResetSenhaAdmin(false);
    }
  };
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
        { label: 'Falta para a meta', valor: falta > 0 ? formatarMoeda(falta) : 'Meta batida' }
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
        { label: 'Falta para a meta diária', valor: falta > 0 ? formatarMoeda(falta) : 'Meta batida' }
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
        { label: 'Falta para a meta', valor: formatarFaltamAtivar(faltamAtivar) }
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
        { label: `Falta para a meta ${tipoNormalizado}`, valor: formatarFaltamAtivar(faltamIncluir) }
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
          { label: 'Receita necessária para a meta', valor: formatarMoeda(faturamentoNecessario) },
          { label: 'Falta para a meta', valor: faltaFaturamento > 0 ? formatarMoeda(faltaFaturamento) : 'Meta batida' }
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
          { label: 'Receita necessária para a meta', valor: formatarMoeda(faturamentoNecessario) },
          { label: 'Falta para a meta', valor: faltaFaturamento > 0 ? formatarMoeda(faltaFaturamento) : 'Meta batida' }
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
        { label: 'Falta para a meta', valor: faltamItens > 0 ? formatarNumeroBR(faltamItens, 0) : 'Meta batida' }
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


    const obterNumeroLinhaMeta = (valor, fallback = 0) => {
      const numero = Number(valor);
      if (Number.isFinite(numero)) return numero;
      const numeroFallback = Number(fallback);
      return Number.isFinite(numeroFallback) ? numeroFallback : 0;
    };

    const calcularIndicadoresLinhaEstrutura = (item) => {
      const receitaMeta = obterNumeroLinhaMeta(item?.receita, 0);
      const receitaRealizada = obterNumeroLinhaMeta(item?.realizado, 0);
      const percentualReceita = obterNumeroLinhaMeta(item?.percentual, calcPerc(receitaRealizada, receitaMeta));

      const atividadeRealizada = obterNumeroLinhaMeta(item?.atividade_realizada, 0);
      const baseAtiva = obterNumeroLinhaMeta(item?.base_ativa, 0);
      const metaAtividadePercentual = obterNumeroLinhaMeta(item?.meta_atividade, dadosMetas?.meta_atividade_geral || 0);
      const metaAtividadeQtd = calcularQtdMetaAtividade(baseAtiva, metaAtividadePercentual);
      const percentualAtividade = obterNumeroLinhaMeta(item?.percentual_atividade, calcularPercentualSeguro(atividadeRealizada, baseAtiva));

      const rpaMeta = obterNumeroLinhaMeta(item?.meta_rpa, dadosMetas?.meta_rpa_geral || 0);
      const rpaRealizado = atividadeRealizada > 0 ? receitaRealizada / atividadeRealizada : 0;

      const pedidos = obterNumeroLinhaMeta(item?.quantidade_pedidos, 0);
      const ticketMeta = obterNumeroLinhaMeta(item?.meta_tkt_medio, dadosMetas?.meta_tkt_medio_geral || 0);
      const ticketRealizado = pedidos > 0 ? receitaRealizada / pedidos : 0;

      const totalItens = obterNumeroLinhaMeta(item?.total_itens, 0);
      const upaMeta = obterNumeroLinhaMeta(item?.meta_upa, dadosMetas?.meta_upa_geral || 0);
      const upaRealizada = atividadeRealizada > 0 ? totalItens / atividadeRealizada : 0;

      const metaMakePercentual = obterNumeroLinhaMeta(item?.meta_make, dadosMetas?.meta_make_geral || 0);
      const makeRealizado = obterNumeroLinhaMeta(item?.make_realizado, 0);
      const makeMetaQtd = metaMakePercentual > 0 && atividadeRealizada > 0 ? Math.ceil((atividadeRealizada * metaMakePercentual) / 100) : 0;
      const percentualMake = obterNumeroLinhaMeta(item?.percentual_make, calcularPercentualSeguro(makeRealizado, atividadeRealizada));

      const metaCabeloPercentual = obterNumeroLinhaMeta(item?.meta_cabelo, dadosMetas?.meta_cabelo_geral || 0);
      const cabeloRealizado = obterNumeroLinhaMeta(item?.cabelo_realizado, 0);
      const cabeloMetaQtd = metaCabeloPercentual > 0 && atividadeRealizada > 0 ? Math.ceil((atividadeRealizada * metaCabeloPercentual) / 100) : 0;
      const percentualCabelo = obterNumeroLinhaMeta(item?.percentual_cabelo, calcularPercentualSeguro(cabeloRealizado, atividadeRealizada));

      return {
        receitaMeta,
        receitaRealizada,
        percentualReceita,
        atividadeRealizada,
        baseAtiva,
        metaAtividadePercentual,
        metaAtividadeQtd,
        percentualAtividade,
        rpaMeta,
        rpaRealizado,
        ticketMeta,
        ticketRealizado,
        upaMeta,
        upaRealizada,
        metaMakePercentual,
        makeMetaQtd,
        makeRealizado,
        percentualMake,
        metaCabeloPercentual,
        cabeloMetaQtd,
        cabeloRealizado,
        percentualCabelo
      };
    };

    const calcularPercentualSeguro = (realizado, meta) => {
      const m = Number(meta || 0);
      if (!m || m <= 0) return 0;
      return (Number(realizado || 0) / m) * 100;
    };

    const CelulaValorPrincipalMeta = ({ titulo, valor, tipo = 'meta', percentual = null }) => {
      const corValor = tipo === 'meta' ? '#7c1f31' : '#048187';
      return (
        <div className="h-full min-h-[84px] bg-white px-2.5 py-2 flex flex-col justify-center border-l border-gray-100 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-wide text-gray-400 truncate">{titulo}</p>
          <p className="mt-1.5 text-[13px] xl:text-sm font-black whitespace-nowrap truncate" style={{ color: corValor }} title={valor}>{valor}</p>
          {percentual !== null && (
            <span className="mt-1.5 w-fit rounded-full px-1.5 py-0.5 text-[10px] font-black bg-[#e6f6f7] text-[#048187]">
              {percentual}
            </span>
          )}
        </div>
      );
    };

    const CelulaIndicadorMetaRealizado = ({ titulo, meta, realizado, percentualMeta = null, percentualRealizado = null, percentualAtingimento = 0, compacto = false, onClickDetalhe = null }) => {
      const cor = corPorFaixaMeta(percentualAtingimento);
      return (
        <div className="h-full min-h-[84px] bg-white px-2 py-2 border-l border-gray-100 flex flex-col justify-center relative overflow-hidden min-w-0">
          <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full" style={{ backgroundColor: cor }} />
          <div className="flex items-center justify-between gap-1 pl-2 min-w-0">
            <p className="text-[9px] font-black uppercase tracking-wide text-gray-400 truncate">{titulo}</p>
            {onClickDetalhe && (
              <button
                type="button"
                onClick={(event) => { event.preventDefault(); event.stopPropagation(); onClickDetalhe(); }}
                title={`Ver detalhes de ${titulo}`}
                className="shrink-0 w-6 h-6 rounded-lg bg-[#e6f6f7] text-[#048187] hover:bg-[#d0f0f1] inline-flex items-center justify-center"
              >
                <Eye size={13} />
              </button>
            )}
          </div>
          <div className="mt-1 pl-2 min-w-0">
            <div className="flex items-baseline justify-between gap-1">
              <span className="text-[8px] font-black uppercase text-gray-400">Meta</span>
              {percentualMeta && <span className="text-[8px] font-black text-[#7c1f31] truncate">{percentualMeta}</span>}
            </div>
            <p className={`${compacto ? 'text-[12px]' : 'text-[13px]'} font-black text-[#7c1f31] whitespace-nowrap truncate`} title={String(meta)}>{meta}</p>
          </div>
          <div className="mt-1 pt-1 border-t border-gray-100 pl-2 min-w-0">
            <div className="flex items-baseline justify-between gap-1">
              <span className="text-[8px] font-black uppercase text-gray-400">Realizado</span>
              {percentualRealizado && <span className="text-[8px] font-black truncate" style={{ color: cor }}>{percentualRealizado}</span>}
            </div>
            <p className={`${compacto ? 'text-[12px]' : 'text-[13px]'} font-black text-[#048187] whitespace-nowrap truncate`} title={String(realizado)}>{realizado}</p>
          </div>
        </div>
      );
    };

    const ColunaEstruturaMetaRealizado = ({ item }) => {
      const estruturasVinculadas = Array.isArray(item?.estruturas_vinculadas) ? item.estruturas_vinculadas : [];
      return (
        <div className="h-full min-h-[84px] bg-gradient-to-br from-[#f3fbfb] via-white to-[#e6f6f7] px-3 py-3 flex items-center gap-2 rounded-l-2xl border-r border-gray-100 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#d9f0f1] text-[#048187] flex items-center justify-center shrink-0">
            <Users size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-wide text-gray-400">Estrutura</p>
            <p className="text-[13px] font-black text-gray-800 leading-tight truncate" title={item?.estrutura}>{item?.estrutura}</p>
            {estruturasVinculadas.length > 1 && (
              <span className="mt-1 inline-flex rounded-full bg-[#e6f6f7] px-1.5 py-0.5 text-[9px] font-black text-[#048187]">
                {estruturasVinculadas.length} estruturas
              </span>
            )}
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-2 min-w-0">
            <FiltroRapidoNucleos filtrosAtivos={filtrosAtivos} onSelecionar={handleFiltroRapidoNucleo} opcoesNucleos={opcoesFiltros.nucleos} />
            {filtrosAtivosResumo.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {filtrosAtivosResumo.map((filtro) => (
                  <button key={`${filtro.categoria}-${filtro.valor}`} type="button" onClick={() => limparFiltroInterativo(filtro.categoria, filtro.valor)} className="bg-[#e6f6f7] text-[#048187] px-3 py-1.5 rounded-full text-[11px] font-black inline-flex items-center gap-2 hover:bg-[#d0f0f1]">
                    {filtro.label} <X size={12} />
                  </button>
                ))}
              </div>
            )}
          </div>
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
                  <Area type="monotone" dataKey="ValorPraticado" stroke="#048187" strokeWidth={3} fill="url(#colorVendas)" activeDot={{ r: 6, cursor: 'pointer', onClick: (e, payload) => { const dataTexto = payload?.payload?.['Data Captação']; if (dataTexto) { const [dia, mes, ano] = String(dataTexto).split('/'); const dataIso = `${ano}-${mes}-${dia}`; const novosFiltros = { ...filtrosAtivos, data_inicio: dataIso, data_fim: dataIso }; setFiltrosAtivos(novosFiltros); ultimoCarregamentoTelaRef.current = ''; carregarTelaAtual(novosFiltros, false); } } }} />
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
                    <Pie data={rMar} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius="40%" outerRadius="75%" cursor="pointer" onClick={(item) => aplicarFiltroInterativo('modelos_comerciais', item?.name || item?.payload?.name)}>{rMar.map((entry, index) => (<Cell key={entry.name} fill={CORES_GRAFICO[index % CORES_GRAFICO.length]} />))}</Pie>
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
                    <Bar dataKey="value" fill="#048187" radius={[0, 4, 4, 0]} cursor="pointer" onClick={(item) => aplicarFiltroInterativo('meios_captacao', item?.MeioCaptacao || item?.payload?.MeioCaptacao)}>
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
                        <td className="px-3 py-2 font-bold text-gray-700 border border-gray-200 whitespace-nowrap"><button type="button" onClick={() => aplicarFiltroInterativo('estruturas', i.estrutura)} className="hover:text-[#048187] hover:underline font-black text-left">{i.estrutura}</button></td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-700 border border-gray-200 whitespace-nowrap"><button type="button" onClick={() => aplicarFiltroInterativo('canais_venda', 'app_revendedor')} className="hover:text-[#048187] hover:underline">{formatarMoeda(i.app_revendedor)}</button></td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-700 border border-gray-200 whitespace-nowrap"><button type="button" onClick={() => aplicarFiltroInterativo('canais_venda', 'omni')} className="hover:text-[#048187] hover:underline">{formatarMoeda(i.omni)}</button></td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-700 border border-gray-200 whitespace-nowrap"><button type="button" onClick={() => aplicarFiltroInterativo('canais_venda', 'portal_revendedor')} className="hover:text-[#048187] hover:underline">{formatarMoeda(i.portal_revendedor)}</button></td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-700 border border-gray-200 whitespace-nowrap"><button type="button" onClick={() => aplicarFiltroInterativo('canais_venda', 'vd_mais')} className="hover:text-[#048187] hover:underline">{formatarMoeda(i.vd_mais)}</button></td>
                        <td className="px-3 py-2 text-right font-semibold text-[#712231] border border-gray-200 whitespace-nowrap"><button type="button" onClick={() => aplicarFiltroInterativo('situacoes', 'Cancelado')} className="hover:underline">{formatarMoeda(i.cancelado)}</button></td>
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
                      <Bar dataKey="ValorPraticado" radius={[0, 4, 4, 0]} cursor="pointer" onClick={(item) => aplicarFiltroInterativo('estruturas', item?.Estrutura || item?.payload?.Estrutura)}>{rEst.map((e, i) => (<Cell key={e.Estrutura} fill={CORES_ESTRUTURA[i % CORES_ESTRUTURA.length]} />))}<LabelList dataKey="ValorPraticado" position="right" formatter={(v) => formatarAbrev(v)} style={{ fontSize: 10, fill: '#334155', fontWeight: 700 }} /></Bar>
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
                <div key={`${c.Consultor}-${idx}`} className="flex items-center gap-3 p-3 bg-[#fcfbf7] rounded-xl border border-gray-100 transition-all hover:bg-white min-w-0 cursor-pointer select-none" onClick={() => aplicarFiltroInterativo('consultores', c.Consultor)}>
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
          { label: 'Falta para a meta', valor: textoFaltaMoeda(faltam) }
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
          { label: 'Falta para a meta diária', valor: textoFaltaMoeda(faltam) }
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
          { label: 'Receita necessária para a meta', valor: formatarMoeda(faturamentoNecessario) },
          { label: 'Falta para a meta', valor: textoFaltaMoeda(faltam) }
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
          { label: 'Receita necessária para a meta', valor: formatarMoeda(faturamentoNecessario) },
          { label: 'Falta para a meta', valor: textoFaltaMoeda(faltam) }
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
          { label: 'Falta para a meta', valor: textoFaltaQtd(faltam) }
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
          { label: 'Falta para a meta', valor: textoFaltaMoeda(faltam) }
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
          { label: 'Receita necessária para a meta', valor: formatarMoeda(faturamentoNecessario) },
          { label: 'Falta para a meta', valor: textoFaltaMoeda(faltam) }
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
          { label: 'Receita necessária para a meta', valor: formatarMoeda(faturamentoNecessario) },
          { label: 'Falta para a meta', valor: textoFaltaMoeda(faltam) }
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
          { label: 'Falta para a meta', valor: textoFaltaQtd(faltam) }
        ],
        `${formatarNumeroBR(totalItensDetalhe, 0)} ÷ ${formatarNumeroBR(atividadeDetalhe, 0)} = ${formatarNumeroBR(upaDetalhe, 2)} | Meta: ${formatarNumeroBR(atividadeDetalhe, 0)} × ${formatarNumeroBR(meta, 1)} = ${formatarNumeroBR(itensNecessarios, 0)} itens`
      );
    };


    const obterNumeroLinhaMeta = (valor, fallback = 0) => {
      const numero = Number(valor);
      if (Number.isFinite(numero)) return numero;
      const numeroFallback = Number(fallback);
      return Number.isFinite(numeroFallback) ? numeroFallback : 0;
    };

    const calcularIndicadoresLinhaEstrutura = (item) => {
      const receitaMeta = obterNumeroLinhaMeta(item?.receita, 0);
      const receitaRealizada = obterNumeroLinhaMeta(item?.realizado, 0);
      const percentualReceita = obterNumeroLinhaMeta(item?.percentual, calcPerc(receitaRealizada, receitaMeta));

      const atividadeRealizada = obterNumeroLinhaMeta(item?.atividade_realizada, 0);
      const baseAtiva = obterNumeroLinhaMeta(item?.base_ativa, 0);
      const metaAtividadePercentual = obterNumeroLinhaMeta(item?.meta_atividade, dadosMetas?.meta_atividade_geral || 0);
      const metaAtividadeQtd = calcularQtdMetaAtividade(baseAtiva, metaAtividadePercentual);
      const percentualAtividade = obterNumeroLinhaMeta(item?.percentual_atividade, calcularPercentualSeguro(atividadeRealizada, baseAtiva));

      const rpaMeta = obterNumeroLinhaMeta(item?.meta_rpa, dadosMetas?.meta_rpa_geral || 0);
      const rpaRealizado = atividadeRealizada > 0 ? receitaRealizada / atividadeRealizada : 0;

      const pedidos = obterNumeroLinhaMeta(item?.quantidade_pedidos, 0);
      const ticketMeta = obterNumeroLinhaMeta(item?.meta_tkt_medio, dadosMetas?.meta_tkt_medio_geral || 0);
      const ticketRealizado = pedidos > 0 ? receitaRealizada / pedidos : 0;

      const totalItens = obterNumeroLinhaMeta(item?.total_itens, 0);
      const upaMeta = obterNumeroLinhaMeta(item?.meta_upa, dadosMetas?.meta_upa_geral || 0);
      const upaRealizada = atividadeRealizada > 0 ? totalItens / atividadeRealizada : 0;

      const metaMakePercentual = obterNumeroLinhaMeta(item?.meta_make, dadosMetas?.meta_make_geral || 0);
      const makeRealizado = obterNumeroLinhaMeta(item?.make_realizado, 0);
      const makeMetaQtd = metaMakePercentual > 0 && atividadeRealizada > 0 ? Math.ceil((atividadeRealizada * metaMakePercentual) / 100) : 0;
      const percentualMake = obterNumeroLinhaMeta(item?.percentual_make, calcularPercentualSeguro(makeRealizado, atividadeRealizada));

      const metaCabeloPercentual = obterNumeroLinhaMeta(item?.meta_cabelo, dadosMetas?.meta_cabelo_geral || 0);
      const cabeloRealizado = obterNumeroLinhaMeta(item?.cabelo_realizado, 0);
      const cabeloMetaQtd = metaCabeloPercentual > 0 && atividadeRealizada > 0 ? Math.ceil((atividadeRealizada * metaCabeloPercentual) / 100) : 0;
      const percentualCabelo = obterNumeroLinhaMeta(item?.percentual_cabelo, calcularPercentualSeguro(cabeloRealizado, atividadeRealizada));

      return {
        receitaMeta,
        receitaRealizada,
        percentualReceita,
        atividadeRealizada,
        baseAtiva,
        metaAtividadePercentual,
        metaAtividadeQtd,
        percentualAtividade,
        rpaMeta,
        rpaRealizado,
        ticketMeta,
        ticketRealizado,
        upaMeta,
        upaRealizada,
        metaMakePercentual,
        makeMetaQtd,
        makeRealizado,
        percentualMake,
        metaCabeloPercentual,
        cabeloMetaQtd,
        cabeloRealizado,
        percentualCabelo
      };
    };

    const calcularPercentualSeguro = (realizado, meta) => {
      const m = Number(meta || 0);
      if (!m || m <= 0) return 0;
      return (Number(realizado || 0) / m) * 100;
    };

    const CelulaValorPrincipalMeta = ({ titulo, valor, tipo = 'meta', percentual = null }) => {
      const corValor = tipo === 'meta' ? '#7c1f31' : '#048187';
      return (
        <div className="h-full min-h-[104px] bg-white px-4 py-3 flex flex-col justify-center border-l border-gray-100">
          <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">{titulo}</p>
          <p className="mt-2 text-lg font-black whitespace-nowrap" style={{ color: corValor }}>{valor}</p>
          {percentual !== null && (
            <span className="mt-2 w-fit rounded-full px-2 py-1 text-[11px] font-black bg-[#e6f6f7] text-[#048187]">
              {percentual}
            </span>
          )}
        </div>
      );
    };

    const CelulaFaturamentoMetaRealizado = ({ meta, realizado, percentualReceita = 0 }) => {
      const cor = corPorFaixaMeta(percentualReceita);
      return (
        <div className="h-full min-h-[104px] bg-white px-3 py-3 border-l border-gray-100 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full" style={{ backgroundColor: cor }} />
          <p className="text-[10px] font-black uppercase tracking-wide text-gray-400 pl-2">Faturamento</p>

          <div className="mt-2 pl-2">
            <span className="text-[9px] font-black uppercase text-gray-400">Meta</span>
            <p className="text-[15px] font-black text-[#7c1f31] whitespace-nowrap">{meta}</p>
          </div>

          <div className="mt-2 pt-2 border-t border-gray-100 pl-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[9px] font-black uppercase text-gray-400">Realizado</span>
              <span className="text-[10px] font-black" style={{ color: cor }}>{formatarNumeroBR(percentualReceita, 1)}%</span>
            </div>
            <p className="text-[15px] font-black text-[#048187] whitespace-nowrap">{realizado}</p>
          </div>
        </div>
      );
    };

    const CelulaIndicadorMetaRealizado = ({ titulo, meta, realizado, percentualMeta = null, percentualRealizado = null, percentualAtingimento = 0, compacto = false }) => {
      const cor = corPorFaixaMeta(percentualAtingimento);
      return (
        <div className="h-full min-h-[104px] bg-white px-3 py-3 border-l border-gray-100 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full" style={{ backgroundColor: cor }} />
          <p className="text-[10px] font-black uppercase tracking-wide text-gray-400 pl-2">{titulo}</p>
          <div className="mt-2 pl-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[9px] font-black uppercase text-gray-400">Meta</span>
              {percentualMeta && <span className="text-[10px] font-black text-[#7c1f31]">{percentualMeta}</span>}
            </div>
            <p className={`${compacto ? 'text-sm' : 'text-[15px]'} font-black text-[#7c1f31] whitespace-nowrap`}>{meta}</p>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 pl-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[9px] font-black uppercase text-gray-400">Realizado</span>
              {percentualRealizado && <span className="text-[10px] font-black" style={{ color: cor }}>{percentualRealizado}</span>}
            </div>
            <p className={`${compacto ? 'text-sm' : 'text-[15px]'} font-black text-[#048187] whitespace-nowrap`}>{realizado}</p>
          </div>
        </div>
      );
    };

    const quebrarNomeEstruturaTabela = (nome) => {
      const texto = String(nome || '').replace(/\s+/g, ' ').trim();
      if (!texto) return { linha1: '-', linha2: '' };

      const limite = 22;
      if (texto.length <= limite) return { linha1: texto, linha2: '' };

      const palavras = texto.split(' ');
      let linha1 = '';
      let indice = 0;

      for (let pos = 0; pos < palavras.length; pos += 1) {
        const tentativa = linha1 ? `${linha1} ${palavras[pos]}` : palavras[pos];
        if (tentativa.length <= limite || linha1 === '') {
          linha1 = tentativa;
          indice = pos + 1;
        } else {
          break;
        }
      }

      const linha2 = palavras.slice(indice).join(' ');
      return { linha1, linha2 };
    };

    const ColunaEstruturaMetaRealizado = ({ item }) => {
      const estruturasVinculadas = Array.isArray(item?.estruturas_vinculadas) ? item.estruturas_vinculadas : [];
      const nomeQuebrado = quebrarNomeEstruturaTabela(item?.estrutura);

      return (
        <div className="h-full min-h-[104px] bg-gradient-to-br from-[#f3fbfb] via-white to-[#e6f6f7] px-4 py-4 flex items-center gap-3 rounded-l-3xl border-r border-gray-100 overflow-hidden">
          <div className="w-10 h-10 rounded-2xl bg-[#d9f0f1] text-[#048187] flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div className="w-[205px] max-w-[205px] min-w-0 overflow-hidden">
            <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">Estrutura</p>
            <div className="mt-0.5 text-sm font-black text-gray-800 leading-[1.12] uppercase" title={item?.estrutura}>
              <span className="block whitespace-nowrap overflow-hidden text-ellipsis">{nomeQuebrado.linha1}</span>
              {nomeQuebrado.linha2 && (
                <span className="block whitespace-nowrap overflow-hidden text-ellipsis">{nomeQuebrado.linha2}</span>
              )}
            </div>
            {estruturasVinculadas.length > 1 && (
              <span className="mt-2 inline-flex rounded-full bg-[#e6f6f7] px-2 py-1 text-[10px] font-black text-[#048187] whitespace-nowrap">
                {estruturasVinculadas.length} estruturas vinculadas
              </span>
            )}
          </div>
        </div>
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
              <FiltroRapidoNucleos filtrosAtivos={filtrosAtivos} onSelecionar={handleFiltroRapidoNucleo} opcoesNucleos={opcoesFiltros.nucleos} />
            </div>
          </div>
        </div>
        {erroMetas && (<div className="rounded-xl p-4 font-bold text-sm bg-red-50 border border-red-100 text-red-600">{erroMetas}</div>)}
        {visaoMetas === 'estruturas' && (
        <div className="overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#ccecee transparent' }}>
          <div className="grid grid-cols-8 gap-3 min-w-[1040px]">
          <CardMini titulo="Faturamento Geral" valor={formatarAbrev(dadosMetas?.realizado_total_geral)} percentual={calcPerc(dadosMetas?.realizado_total_geral, dadosMetas?.meta_total_geral)} labelMeta="Meta Faturamento:" valorMeta={formatarAbrev(dadosMetas?.meta_total_geral)} onClickExpandir={abrirDetalheFaturamentoGeralMetas} />
          <CardMini titulo="Realizado Diário" valor={formatarAbrev(dados?.realizado_diario)} percentual={calcPerc(dados?.realizado_diario, dados?.meta_diaria)} labelMeta="Meta Diária:" valorMeta={formatarAbrev(dados?.meta_diaria)} onClickExpandir={abrirDetalheRealizadoDiarioMetas} />
          <CardMini titulo="Atividade Geral" valor={`${percentualAtividadeGeral.toFixed(1)}%`} percentual={calcPerc(percentualAtividadeGeral, metaAtividadeGeralPercentual)} labelMeta="Meta Atividade:" valorMeta={`${metaAtividadeGeralPercentual.toFixed(1)}%`} onClickExpandir={() => abrirModalValExp('Atividade Geral', `${formatarNumeroBR(percentualAtividadeGeral, 1)}%`, 'Atividade = revendedores ativados dividido pela base ativa.', [{ label: 'Revendedores ativados', valor: formatarNumeroBR(atividadeGeral, 0) }, { label: '% atividade atual', valor: `${formatarNumeroBR(percentualAtividadeGeral, 1)}%` }, { label: '% da meta', valor: `${formatarNumeroBR(calcPerc(percentualAtividadeGeral, metaAtividadeGeralPercentual), 1)}%` }, { label: 'Base ativa', valor: formatarNumeroBR(baseAtivaGeral, 0) }, { label: 'Meta atividade', valor: `${formatarNumeroBR(metaAtividadeGeralPercentual, 1)}%` }, { label: 'Meta em revendedores', valor: formatarNumeroBR(qtdMetaAtividadeGeral, 0) }, { label: 'Falta para a meta', valor: formatarFaltamAtivar(faltamAtivarGeral) }], `${formatarNumeroBR(baseAtivaGeral, 0)} × ${formatarNumeroBR(metaAtividadeGeralPercentual, 1)}% = ${formatarNumeroBR(qtdMetaAtividadeGeral, 0)} revendedores necessários`)} />
          <CardMini titulo="MAKE Geral" valor={`${percentualMakeGeral.toFixed(1)}%`} percentual={calcPerc(percentualMakeGeral, metaMakeGeralPercentual)} labelMeta="Meta MAKE:" valorMeta={`${metaMakeGeralPercentual.toFixed(1)}%`} onClickExpandir={() => abrirModalValExp('MAKE Geral', `${formatarNumeroBR(percentualMakeGeral, 1)}%`, 'MAKE = revendedoras ativadas que compraram/incluíram itens de MAKE dividido pelo total de revendedoras ativadas.', [{ label: 'Revendedoras com MAKE', valor: formatarNumeroBR(makeGeral, 0) }, { label: '% MAKE atual', valor: `${formatarNumeroBR(percentualMakeGeral, 1)}%` }, { label: '% da meta', valor: `${formatarNumeroBR(calcPerc(percentualMakeGeral, metaMakeGeralPercentual), 1)}%` }, { label: 'Revendedoras ativadas', valor: formatarNumeroBR(atividadeGeral, 0) }, { label: 'Meta MAKE', valor: `${formatarNumeroBR(metaMakeGeralPercentual, 1)}%` }, { label: 'Meta em revendedoras', valor: formatarNumeroBR(qtdMetaMakeGeral, 0) }, { label: 'Falta para a meta MAKE', valor: formatarFaltamAtivar(faltamMakeGeral) }], `${formatarNumeroBR(atividadeGeral, 0)} revendedoras ativadas × ${formatarNumeroBR(metaMakeGeralPercentual, 1)}% = ${formatarNumeroBR(qtdMetaMakeGeral, 0)} revendedoras necessárias com MAKE`)} />
          <CardMini titulo="CABELO Geral" valor={`${percentualCabeloGeral.toFixed(1)}%`} percentual={calcPerc(percentualCabeloGeral, metaCabeloGeralPercentual)} labelMeta="Meta CABELO:" valorMeta={`${metaCabeloGeralPercentual.toFixed(1)}%`} onClickExpandir={() => abrirModalValExp('CABELO Geral', `${formatarNumeroBR(percentualCabeloGeral, 1)}%`, 'CABELO = revendedoras ativadas que compraram/incluíram itens de CABELO dividido pelo total de revendedoras ativadas.', [{ label: 'Revendedoras com CABELO', valor: formatarNumeroBR(cabeloGeral, 0) }, { label: '% CABELO atual', valor: `${formatarNumeroBR(percentualCabeloGeral, 1)}%` }, { label: '% da meta', valor: `${formatarNumeroBR(calcPerc(percentualCabeloGeral, metaCabeloGeralPercentual), 1)}%` }, { label: 'Revendedoras ativadas', valor: formatarNumeroBR(atividadeGeral, 0) }, { label: 'Meta CABELO', valor: `${formatarNumeroBR(metaCabeloGeralPercentual, 1)}%` }, { label: 'Meta em revendedoras', valor: formatarNumeroBR(qtdMetaCabeloGeral, 0) }, { label: 'Falta para a meta CABELO', valor: formatarFaltamAtivar(faltamCabeloGeral) }], `${formatarNumeroBR(atividadeGeral, 0)} revendedoras ativadas × ${formatarNumeroBR(metaCabeloGeralPercentual, 1)}% = ${formatarNumeroBR(qtdMetaCabeloGeral, 0)} revendedoras necessárias com CABELO`)} />
          <CardMini titulo="RPA Geral" valor={formatarMoeda(rpaGeral)} percentual={calcPerc(rpaGeral, dadosMetas?.meta_rpa_geral)} labelMeta="Meta RPA:" valorMeta={formatarMoeda(dadosMetas?.meta_rpa_geral)} onClickExpandir={abrirDetalheRpaGeralMetas} />
          <CardMini titulo="Ticket Médio" valor={formatarMoeda(tktGeral)} percentual={calcPerc(tktGeral, dadosMetas?.meta_tkt_medio_geral)} labelMeta="Meta Tkt Médio:" valorMeta={formatarMoeda(dadosMetas?.meta_tkt_medio_geral)} onClickExpandir={abrirDetalheTicketGeralMetas} />
          <CardMini titulo="UPA Geral" valor={upaGeral.toFixed(1)} percentual={calcPerc(upaGeral, dadosMetas?.meta_upa_geral)} labelMeta="Meta UPA:" valorMeta={Number(dadosMetas?.meta_upa_geral||0).toFixed(1)} onClickExpandir={abrirDetalheUpaGeralMetas} />
          </div>
        </div>
        )}
        
        {visaoMetas === 'estruturas' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-3"><div><h2 className="text-lg font-bold text-gray-700">Estruturas cadastradas</h2></div><span className="text-sm font-bold text-[#048187]">{ests.length} estruturas</span></div>
          <div className="overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#ccecee transparent' }}>
            <div className="min-w-[1470px] space-y-2">
              <div
                className="grid gap-0 px-1 text-[9px] font-black uppercase tracking-wide text-gray-400"
                style={{ gridTemplateColumns: '280px 170px 105px 120px 105px 135px 135px 90px 120px 120px 90px' }}
              >
                <div className="px-2 py-2">Estrutura</div>
                <div className="px-2 py-2">Faturamento</div>
                <div className="px-2 py-2">% Rec.</div>
                <div className="px-2 py-2">Ativ.</div>
                <div className="px-2 py-2">% Ativ.</div>
                <div className="px-2 py-2">RPA</div>
                <div className="px-2 py-2">Tkt Méd.</div>
                <div className="px-2 py-2">UPA</div>
                <div className="px-2 py-2">% Make</div>
                <div className="px-2 py-2">% Cab.</div>
                <div className="px-2 py-2 text-center">Ação</div>
              </div>
              <div className="max-h-[42rem] overflow-y-auto pr-1 space-y-2">
                {ests.map((i) => {
                  const ind = calcularIndicadoresLinhaEstrutura(i);
                  const faltamMakeLinha = Math.max(Number(ind.makeMetaQtd || 0) - Number(ind.makeRealizado || 0), 0);
                  const faltamCabeloLinha = Math.max(Number(ind.cabeloMetaQtd || 0) - Number(ind.cabeloRealizado || 0), 0);
                  return (
                    <div
                      key={i.estrutura}
                      className={`grid rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${estruturaSelecionada === i.estrutura ? 'border-[#048187]/30 ring-2 ring-[#048187]/10' : 'border-gray-100'}`}
                      style={{ gridTemplateColumns: '280px 170px 105px 120px 105px 135px 135px 90px 120px 120px 90px' }}
                    >
                      <ColunaEstruturaMetaRealizado item={i} />
                      <CelulaFaturamentoMetaRealizado
                        meta={formatarMoeda(ind.receitaMeta)}
                        realizado={formatarMoeda(ind.receitaRealizada)}
                        percentualReceita={ind.percentualReceita}
                      />
                      <CelulaIndicadorMetaRealizado titulo="% Receita" meta="100%" realizado={`${formatarNumeroBR(ind.percentualReceita, 2)}%`} percentualAtingimento={ind.percentualReceita} compacto />
                      <CelulaIndicadorMetaRealizado titulo="Atividade" meta={formatarNumeroBR(ind.metaAtividadeQtd, 0)} realizado={formatarNumeroBR(ind.atividadeRealizada, 0)} percentualMeta={`${formatarNumeroBR(ind.metaAtividadePercentual, 1)}%`} percentualRealizado={`${formatarNumeroBR(calcPerc(ind.atividadeRealizada, ind.metaAtividadeQtd), 1)}%`} percentualAtingimento={calcPerc(ind.atividadeRealizada, ind.metaAtividadeQtd)} compacto />
                      <CelulaIndicadorMetaRealizado titulo="% Ativ." meta={`${formatarNumeroBR(ind.metaAtividadePercentual, 1)}%`} realizado={`${formatarNumeroBR(ind.percentualAtividade, 2)}%`} percentualAtingimento={calcPerc(ind.percentualAtividade, ind.metaAtividadePercentual)} compacto />
                      <CelulaIndicadorMetaRealizado titulo="RPA" meta={formatarMoeda(ind.rpaMeta)} realizado={formatarMoeda(ind.rpaRealizado)} percentualAtingimento={calcPerc(ind.rpaRealizado, ind.rpaMeta)} />
                      <CelulaIndicadorMetaRealizado titulo="Tkt Médio" meta={formatarMoeda(ind.ticketMeta)} realizado={formatarMoeda(ind.ticketRealizado)} percentualAtingimento={calcPerc(ind.ticketRealizado, ind.ticketMeta)} />
                      <CelulaIndicadorMetaRealizado titulo="UPA" meta={formatarNumeroBR(ind.upaMeta, 1)} realizado={formatarNumeroBR(ind.upaRealizada, 1)} percentualAtingimento={calcPerc(ind.upaRealizada, ind.upaMeta)} compacto />
                      <CelulaIndicadorMetaRealizado
                        titulo="% Make"
                        meta={`${formatarNumeroBR(ind.metaMakePercentual, 1)}%`}
                        realizado={`${formatarNumeroBR(ind.percentualMake, 2)}%`}
                        percentualAtingimento={calcPerc(ind.percentualMake, ind.metaMakePercentual)}
                        compacto
                        onClickDetalhe={() => abrirModalValExp(
                          `${i.estrutura} • MAKE`,
                          `${formatarNumeroBR(ind.percentualMake, 2)}%`,
                          'MAKE = revendedoras ativadas que compraram/incluíram itens de MAKE dividido pelo total de revendedoras ativadas.',
                          [
                            { label: 'Meta MAKE', valor: `${formatarNumeroBR(ind.metaMakePercentual, 1)}%` },
                            { label: 'Meta em revendedoras', valor: formatarNumeroBR(ind.makeMetaQtd, 0) },
                            { label: 'Realizado MAKE', valor: formatarNumeroBR(ind.makeRealizado, 0) },
                            { label: '% MAKE atual', valor: `${formatarNumeroBR(ind.percentualMake, 2)}%` },
                            { label: '% da meta', valor: `${formatarNumeroBR(calcPerc(ind.percentualMake, ind.metaMakePercentual), 1)}%` },
                            { label: 'Falta para a meta', valor: faltamMakeLinha > 0 ? formatarNumeroBR(faltamMakeLinha, 0) : 'Meta batida' }
                          ],
                          `${formatarNumeroBR(ind.atividadeRealizada, 0)} revendedoras ativadas × ${formatarNumeroBR(ind.metaMakePercentual, 1)}% = ${formatarNumeroBR(ind.makeMetaQtd, 0)} revendedoras necessárias com MAKE`
                        )}
                      />
                      <CelulaIndicadorMetaRealizado
                        titulo="% Cab."
                        meta={`${formatarNumeroBR(ind.metaCabeloPercentual, 1)}%`}
                        realizado={`${formatarNumeroBR(ind.percentualCabelo, 2)}%`}
                        percentualAtingimento={calcPerc(ind.percentualCabelo, ind.metaCabeloPercentual)}
                        compacto
                        onClickDetalhe={() => abrirModalValExp(
                          `${i.estrutura} • CABELO`,
                          `${formatarNumeroBR(ind.percentualCabelo, 2)}%`,
                          'CABELO = revendedoras ativadas que compraram/incluíram itens de CABELO dividido pelo total de revendedoras ativadas.',
                          [
                            { label: 'Meta CABELO', valor: `${formatarNumeroBR(ind.metaCabeloPercentual, 1)}%` },
                            { label: 'Meta em revendedoras', valor: formatarNumeroBR(ind.cabeloMetaQtd, 0) },
                            { label: 'Realizado CABELO', valor: formatarNumeroBR(ind.cabeloRealizado, 0) },
                            { label: '% CABELO atual', valor: `${formatarNumeroBR(ind.percentualCabelo, 2)}%` },
                            { label: '% da meta', valor: `${formatarNumeroBR(calcPerc(ind.percentualCabelo, ind.metaCabeloPercentual), 1)}%` },
                            { label: 'Falta para a meta', valor: faltamCabeloLinha > 0 ? formatarNumeroBR(faltamCabeloLinha, 0) : 'Meta batida' }
                          ],
                          `${formatarNumeroBR(ind.atividadeRealizada, 0)} revendedoras ativadas × ${formatarNumeroBR(ind.metaCabeloPercentual, 1)}% = ${formatarNumeroBR(ind.cabeloMetaQtd, 0)} revendedoras necessárias com CABELO`
                        )}
                      />
                      <div className="h-full min-h-[84px] bg-white px-2 py-2 border-l border-gray-100 rounded-r-2xl flex items-center justify-center">
                        <button onClick={async () => { await carregarDetalheMeta(i.estrutura, filtrosAtivos, false); setVisaoMetas('consultores'); }} className="bg-[#048187] text-white px-2.5 py-2 rounded-xl hover:bg-[#036b70] inline-flex items-center gap-1 font-black text-[11px] shadow-sm">
                          <Search size={14} /> Ver
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
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
                <CardMetaNova titulo="Atividade" valor={`${percentualAtividadeDetalhe.toFixed(1)}%`} percentual={calcPerc(percentualAtividadeDetalhe, metaAtividadeDetalhePercentual)} labelMeta="Meta Atividade:" valorMeta={`${metaAtividadeDetalhePercentual.toFixed(1)}%`} onClickExpandir={() => abrirModalValExp('Atividade', `${formatarNumeroBR(percentualAtividadeDetalhe, 1)}%`, 'Atividade = revendedoras ativadas dividido pela base ativa da estrutura.', [{ label: 'Revendedoras ativadas', valor: formatarNumeroBR(atividadeDetalhe, 0) }, { label: '% atividade atual', valor: `${formatarNumeroBR(percentualAtividadeDetalhe, 1)}%` }, { label: '% da meta', valor: `${formatarNumeroBR(calcPerc(percentualAtividadeDetalhe, metaAtividadeDetalhePercentual), 1)}%` }, { label: 'Base ativa', valor: formatarNumeroBR(baseAtivaDetalhe, 0) }, { label: 'Meta atividade', valor: `${formatarNumeroBR(metaAtividadeDetalhePercentual, 1)}%` }, { label: 'Meta em revendedoras', valor: formatarNumeroBR(qtdMetaAtividadeDetalhe, 0) }, { label: 'Falta para a meta', valor: formatarFaltamAtivar(faltamAtivarDetalhe) }], `${formatarNumeroBR(baseAtivaDetalhe, 0)} × ${formatarNumeroBR(metaAtividadeDetalhePercentual, 1)}% = ${formatarNumeroBR(qtdMetaAtividadeDetalhe, 0)} revendedoras necessárias`)} />
                <CardMetaNova titulo="MAKE" valor={`${percentualMakeDetalhe.toFixed(1)}%`} percentual={calcPerc(percentualMakeDetalhe, metaMakeDetalhePercentual)} labelMeta="Meta MAKE:" valorMeta={`${metaMakeDetalhePercentual.toFixed(1)}%`} onClickExpandir={() => abrirModalValExp('MAKE', `${formatarNumeroBR(percentualMakeDetalhe, 1)}%`, 'MAKE = revendedoras ativadas da estrutura que compraram/incluíram itens de MAKE dividido pelo total de revendedoras ativadas da estrutura.', [{ label: 'Revendedoras com MAKE', valor: formatarNumeroBR(makeDetalhe, 0) }, { label: '% MAKE atual', valor: `${formatarNumeroBR(percentualMakeDetalhe, 1)}%` }, { label: '% da meta', valor: `${formatarNumeroBR(calcPerc(percentualMakeDetalhe, metaMakeDetalhePercentual), 1)}%` }, { label: 'Revendedoras ativadas', valor: formatarNumeroBR(atividadeDetalhe, 0) }, { label: 'Meta MAKE', valor: `${formatarNumeroBR(metaMakeDetalhePercentual, 1)}%` }, { label: 'Meta em revendedoras', valor: formatarNumeroBR(qtdMetaMakeDetalhe, 0) }, { label: 'Falta para a meta MAKE', valor: formatarFaltamAtivar(faltamMakeDetalhe) }], `${formatarNumeroBR(atividadeDetalhe, 0)} revendedoras ativadas × ${formatarNumeroBR(metaMakeDetalhePercentual, 1)}% = ${formatarNumeroBR(qtdMetaMakeDetalhe, 0)} revendedoras necessárias com MAKE`)} />
                <CardMetaNova titulo="CABELO" valor={`${percentualCabeloDetalhe.toFixed(1)}%`} percentual={calcPerc(percentualCabeloDetalhe, metaCabeloDetalhePercentual)} labelMeta="Meta CABELO:" valorMeta={`${metaCabeloDetalhePercentual.toFixed(1)}%`} onClickExpandir={() => abrirModalValExp('CABELO', `${formatarNumeroBR(percentualCabeloDetalhe, 1)}%`, 'CABELO = revendedoras ativadas da estrutura que compraram/incluíram itens de CABELO dividido pelo total de revendedoras ativadas da estrutura.', [{ label: 'Revendedoras com CABELO', valor: formatarNumeroBR(cabeloDetalhe, 0) }, { label: '% CABELO atual', valor: `${formatarNumeroBR(percentualCabeloDetalhe, 1)}%` }, { label: '% da meta', valor: `${formatarNumeroBR(calcPerc(percentualCabeloDetalhe, metaCabeloDetalhePercentual), 1)}%` }, { label: 'Revendedoras ativadas', valor: formatarNumeroBR(atividadeDetalhe, 0) }, { label: 'Meta CABELO', valor: `${formatarNumeroBR(metaCabeloDetalhePercentual, 1)}%` }, { label: 'Meta em revendedoras', valor: formatarNumeroBR(qtdMetaCabeloDetalhe, 0) }, { label: 'Falta para a meta CABELO', valor: formatarFaltamAtivar(faltamCabeloDetalhe) }], `${formatarNumeroBR(atividadeDetalhe, 0)} revendedoras ativadas × ${formatarNumeroBR(metaCabeloDetalhePercentual, 1)}% = ${formatarNumeroBR(qtdMetaCabeloDetalhe, 0)} revendedoras necessárias com CABELO`)} />
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
                      { label: 'Falta para a meta', valor: faltaFaturamentoItem > 0 ? formatarMoeda(faltaFaturamentoItem) : 'Meta batida' },
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
                      { label: 'Falta para a meta', valor: faltamAtivarItem > 0 ? `${formatarNumeroBR(faltamAtivarItem, 0)} revendedores` : 'Meta batida' },
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
                      { label: 'Falta para a meta MAKE', valor: faltamMakeItem > 0 ? `${formatarNumeroBR(faltamMakeItem, 0)} revendedores` : 'Meta batida' },
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
                      { label: 'Falta para a meta CABELO', valor: faltamCabeloItem > 0 ? `${formatarNumeroBR(faltamCabeloItem, 0)} revendedores` : 'Meta batida' },
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
                      { label: 'Receita necessária para a meta', valor: formatarMoeda(faturamentoNecessarioRpaItem) },
                      { label: 'Falta para a meta', valor: faltamFaturarRpaItem > 0 ? formatarMoeda(faltamFaturarRpaItem) : 'Meta batida' },
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
                      { label: 'Receita necessária para a meta', valor: formatarMoeda(faturamentoNecessarioTicketItem) },
                      { label: 'Falta para a meta', valor: faltamFaturarTicketItem > 0 ? formatarMoeda(faltamFaturarTicketItem) : 'Meta batida' },
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
                      { label: 'Falta para a meta', valor: faltamItensUpaItem > 0 ? formatarNumeroBR(faltamItensUpaItem, 0) : 'Meta batida' },
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
      const texto = String(nome || '').replace(/\s+/g, ' ').trim();
      if (!texto) return '';

      if (visaoRanking === 'estruturas') {
        return texto.replace(/^\d+\s*-\s*/g, '');
      }

      const partes = texto.split(' ').filter(Boolean);
      return partes.slice(0, 2).join(' ');
    };
    

    const obterNumeroLinhaMeta = (valor, fallback = 0) => {
      const numero = Number(valor);
      if (Number.isFinite(numero)) return numero;
      const numeroFallback = Number(fallback);
      return Number.isFinite(numeroFallback) ? numeroFallback : 0;
    };

    const calcularIndicadoresLinhaEstrutura = (item) => {
      const receitaMeta = obterNumeroLinhaMeta(item?.receita, 0);
      const receitaRealizada = obterNumeroLinhaMeta(item?.realizado, 0);
      const percentualReceita = obterNumeroLinhaMeta(item?.percentual, calcPerc(receitaRealizada, receitaMeta));

      const atividadeRealizada = obterNumeroLinhaMeta(item?.atividade_realizada, 0);
      const baseAtiva = obterNumeroLinhaMeta(item?.base_ativa, 0);
      const metaAtividadePercentual = obterNumeroLinhaMeta(item?.meta_atividade, dadosMetas?.meta_atividade_geral || 0);
      const metaAtividadeQtd = calcularQtdMetaAtividade(baseAtiva, metaAtividadePercentual);
      const percentualAtividade = obterNumeroLinhaMeta(item?.percentual_atividade, calcularPercentualSeguro(atividadeRealizada, baseAtiva));

      const rpaMeta = obterNumeroLinhaMeta(item?.meta_rpa, dadosMetas?.meta_rpa_geral || 0);
      const rpaRealizado = atividadeRealizada > 0 ? receitaRealizada / atividadeRealizada : 0;

      const pedidos = obterNumeroLinhaMeta(item?.quantidade_pedidos, 0);
      const ticketMeta = obterNumeroLinhaMeta(item?.meta_tkt_medio, dadosMetas?.meta_tkt_medio_geral || 0);
      const ticketRealizado = pedidos > 0 ? receitaRealizada / pedidos : 0;

      const totalItens = obterNumeroLinhaMeta(item?.total_itens, 0);
      const upaMeta = obterNumeroLinhaMeta(item?.meta_upa, dadosMetas?.meta_upa_geral || 0);
      const upaRealizada = atividadeRealizada > 0 ? totalItens / atividadeRealizada : 0;

      const metaMakePercentual = obterNumeroLinhaMeta(item?.meta_make, dadosMetas?.meta_make_geral || 0);
      const makeRealizado = obterNumeroLinhaMeta(item?.make_realizado, 0);
      const makeMetaQtd = metaMakePercentual > 0 && atividadeRealizada > 0 ? Math.ceil((atividadeRealizada * metaMakePercentual) / 100) : 0;
      const percentualMake = obterNumeroLinhaMeta(item?.percentual_make, calcularPercentualSeguro(makeRealizado, atividadeRealizada));

      const metaCabeloPercentual = obterNumeroLinhaMeta(item?.meta_cabelo, dadosMetas?.meta_cabelo_geral || 0);
      const cabeloRealizado = obterNumeroLinhaMeta(item?.cabelo_realizado, 0);
      const cabeloMetaQtd = metaCabeloPercentual > 0 && atividadeRealizada > 0 ? Math.ceil((atividadeRealizada * metaCabeloPercentual) / 100) : 0;
      const percentualCabelo = obterNumeroLinhaMeta(item?.percentual_cabelo, calcularPercentualSeguro(cabeloRealizado, atividadeRealizada));

      return {
        receitaMeta,
        receitaRealizada,
        percentualReceita,
        atividadeRealizada,
        baseAtiva,
        metaAtividadePercentual,
        metaAtividadeQtd,
        percentualAtividade,
        rpaMeta,
        rpaRealizado,
        ticketMeta,
        ticketRealizado,
        upaMeta,
        upaRealizada,
        metaMakePercentual,
        makeMetaQtd,
        makeRealizado,
        percentualMake,
        metaCabeloPercentual,
        cabeloMetaQtd,
        cabeloRealizado,
        percentualCabelo
      };
    };

    const calcularPercentualSeguro = (realizado, meta) => {
      const m = Number(meta || 0);
      if (!m || m <= 0) return 0;
      return (Number(realizado || 0) / m) * 100;
    };

    const CelulaValorPrincipalMeta = ({ titulo, valor, tipo = 'meta', percentual = null }) => {
      const corValor = tipo === 'meta' ? '#7c1f31' : '#048187';
      return (
        <div className="h-full min-h-[104px] bg-white px-4 py-3 flex flex-col justify-center border-l border-gray-100">
          <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">{titulo}</p>
          <p className="mt-2 text-lg font-black whitespace-nowrap" style={{ color: corValor }}>{valor}</p>
          {percentual !== null && (
            <span className="mt-2 w-fit rounded-full px-2 py-1 text-[11px] font-black bg-[#e6f6f7] text-[#048187]">
              {percentual}
            </span>
          )}
        </div>
      );
    };

    const CelulaIndicadorMetaRealizado = ({ titulo, meta, realizado, percentualMeta = null, percentualRealizado = null, percentualAtingimento = 0, compacto = false }) => {
      const cor = corPorFaixaMeta(percentualAtingimento);
      return (
        <div className="h-full min-h-[104px] bg-white px-3 py-3 border-l border-gray-100 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full" style={{ backgroundColor: cor }} />
          <p className="text-[10px] font-black uppercase tracking-wide text-gray-400 pl-2">{titulo}</p>
          <div className="mt-2 pl-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[9px] font-black uppercase text-gray-400">Meta</span>
              {percentualMeta && <span className="text-[10px] font-black text-[#7c1f31]">{percentualMeta}</span>}
            </div>
            <p className={`${compacto ? 'text-sm' : 'text-[15px]'} font-black text-[#7c1f31] whitespace-nowrap`}>{meta}</p>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 pl-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[9px] font-black uppercase text-gray-400">Realizado</span>
              {percentualRealizado && <span className="text-[10px] font-black" style={{ color: cor }}>{percentualRealizado}</span>}
            </div>
            <p className={`${compacto ? 'text-sm' : 'text-[15px]'} font-black text-[#048187] whitespace-nowrap`}>{realizado}</p>
          </div>
        </div>
      );
    };

    const ColunaEstruturaMetaRealizado = ({ item }) => {
      const estruturasVinculadas = Array.isArray(item?.estruturas_vinculadas) ? item.estruturas_vinculadas : [];
      return (
        <div className="h-full min-h-[104px] bg-gradient-to-br from-[#f3fbfb] via-white to-[#e6f6f7] px-4 py-4 flex items-center gap-3 rounded-l-3xl border-r border-gray-100">
          <div className="w-10 h-10 rounded-2xl bg-[#d9f0f1] text-[#048187] flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">Estrutura</p>
            <p className="text-sm font-black text-gray-800 leading-tight truncate">{item?.estrutura}</p>
            {estruturasVinculadas.length > 1 && (
              <span className="mt-2 inline-flex rounded-full bg-[#e6f6f7] px-2 py-1 text-[10px] font-black text-[#048187]">
                {estruturasVinculadas.length} estruturas vinculadas
              </span>
            )}
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-full bg-yellow-500 text-white flex items-center justify-center shrink-0"><Trophy size={25}/></div>
            <div className="min-w-0"><h1 className="text-xl sm:text-2xl font-bold text-gray-700 truncate">Ranking e Gamificação</h1><p className="text-sm text-gray-400 truncate">Top 5 de alta performance da equipe</p></div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <FiltroRapidoNucleos filtrosAtivos={filtrosAtivos} onSelecionar={handleFiltroRapidoNucleo} opcoesNucleos={opcoesFiltros.nucleos} />
            <div className="flex bg-gray-100 p-1 rounded-lg shrink-0">
              <button onClick={() => setVisaoRanking('consultores')} className={`p-2 px-3 sm:px-4 rounded-md transition-colors ${visaoRanking === 'consultores' ? 'bg-[#048187] text-white shadow' : 'text-gray-500 hover:text-gray-700'}`} title="Visão Consultores"><User size={18} /></button>
              <button onClick={() => setVisaoRanking('estruturas')} className={`p-2 px-3 sm:px-4 rounded-md transition-colors ${visaoRanking === 'estruturas' ? 'bg-[#048187] text-white shadow' : 'text-gray-500 hover:text-gray-700'}`} title="Visão Estruturas"><Users size={18} /></button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-7 min-h-[360px] overflow-hidden">
          <h2 className="text-base sm:text-lg font-black text-gray-700 mb-8 uppercase tracking-widest text-center">
            Top 3 % de Faturamento ({visaoRanking === 'consultores' ? 'Consultores' : 'Estruturas'})
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 items-end justify-center w-full max-w-4xl mx-auto gap-5 sm:gap-6">
            {podio[0] && (
              <div className="flex flex-col items-center justify-end min-w-0 hover:-translate-y-1 transition-transform cursor-default">
                <div className="mb-3 w-full rounded-2xl bg-slate-50 border border-slate-100 px-3 py-3 text-center min-h-[104px] flex flex-col items-center justify-center">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-wide">2º lugar</span>
                  <p
                    className="mt-1 text-sm font-black text-gray-700 leading-tight w-full"
                    title={obterNomeExibicaoConsultor(podio[0])}
                    style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                  >
                    {formatarNomePodio(obterNomeExibicaoConsultor(podio[0]))}
                  </p>
                  <p className="mt-1 text-base font-black text-gray-600">{formatarPercentualFaturamento(podio[0])}</p>
                  <p className="text-[11px] text-gray-400">{formatarRealizadoPodio(podio[0])}</p>
                </div>
                <div className="w-full h-28 sm:h-32 bg-gradient-to-t from-gray-300 to-gray-200 rounded-t-xl flex flex-col items-center justify-start pt-3 border-t-4 border-gray-400 shadow-inner">
                  <span className="text-2xl font-black text-white drop-shadow-md">2º</span>
                </div>
              </div>
            )}

            {podio[1] && (
              <div className="flex flex-col items-center justify-end min-w-0 hover:-translate-y-1 transition-transform cursor-default">
                <div className="mb-3 w-full rounded-2xl bg-yellow-50 border border-yellow-100 px-3 py-3 text-center min-h-[118px] flex flex-col items-center justify-center shadow-sm">
                  <div className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white px-3 py-1 text-yellow-600 shadow-sm">
                    <Trophy size={18} />
                    <span className="text-[11px] font-black uppercase tracking-wide">1º lugar</span>
                  </div>
                  <p
                    className="mt-2 text-base font-black text-[#048187] leading-tight w-full"
                    title={obterNomeExibicaoConsultor(podio[1])}
                    style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                  >
                    {formatarNomePodio(obterNomeExibicaoConsultor(podio[1]))}
                  </p>
                  <p className="mt-1 text-lg font-black text-yellow-600">{formatarPercentualFaturamento(podio[1])}</p>
                  <p className="text-[11px] text-gray-400">{formatarRealizadoPodio(podio[1])}</p>
                </div>
                <div className="w-full h-36 sm:h-44 bg-gradient-to-t from-yellow-300 to-yellow-100 rounded-t-xl flex flex-col items-center justify-start pt-3 border-t-4 border-yellow-500 shadow-xl">
                  <span className="text-3xl font-black text-white drop-shadow-md">1º</span>
                </div>
              </div>
            )}

            {podio[2] && (
              <div className="flex flex-col items-center justify-end min-w-0 hover:-translate-y-1 transition-transform cursor-default">
                <div className="mb-3 w-full rounded-2xl bg-orange-50 border border-orange-100 px-3 py-3 text-center min-h-[104px] flex flex-col items-center justify-center">
                  <span className="text-[11px] font-black text-orange-500 uppercase tracking-wide">3º lugar</span>
                  <p
                    className="mt-1 text-sm font-black text-gray-700 leading-tight w-full"
                    title={obterNomeExibicaoConsultor(podio[2])}
                    style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                  >
                    {formatarNomePodio(obterNomeExibicaoConsultor(podio[2]))}
                  </p>
                  <p className="mt-1 text-base font-black text-orange-600">{formatarPercentualFaturamento(podio[2])}</p>
                  <p className="text-[11px] text-gray-400">{formatarRealizadoPodio(podio[2])}</p>
                </div>
                <div className="w-full h-24 sm:h-28 bg-gradient-to-t from-orange-300 to-orange-200 rounded-t-xl flex flex-col items-center justify-start pt-3 border-t-4 border-orange-400 shadow-inner">
                  <span className="text-2xl font-black text-white drop-shadow-md">3º</span>
                </div>
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


    const obterNumeroLinhaMeta = (valor, fallback = 0) => {
      const numero = Number(valor);
      if (Number.isFinite(numero)) return numero;
      const numeroFallback = Number(fallback);
      return Number.isFinite(numeroFallback) ? numeroFallback : 0;
    };

    const calcularIndicadoresLinhaEstrutura = (item) => {
      const receitaMeta = obterNumeroLinhaMeta(item?.receita, 0);
      const receitaRealizada = obterNumeroLinhaMeta(item?.realizado, 0);
      const percentualReceita = obterNumeroLinhaMeta(item?.percentual, calcPerc(receitaRealizada, receitaMeta));

      const atividadeRealizada = obterNumeroLinhaMeta(item?.atividade_realizada, 0);
      const baseAtiva = obterNumeroLinhaMeta(item?.base_ativa, 0);
      const metaAtividadePercentual = obterNumeroLinhaMeta(item?.meta_atividade, dadosMetas?.meta_atividade_geral || 0);
      const metaAtividadeQtd = calcularQtdMetaAtividade(baseAtiva, metaAtividadePercentual);
      const percentualAtividade = obterNumeroLinhaMeta(item?.percentual_atividade, calcularPercentualSeguro(atividadeRealizada, baseAtiva));

      const rpaMeta = obterNumeroLinhaMeta(item?.meta_rpa, dadosMetas?.meta_rpa_geral || 0);
      const rpaRealizado = atividadeRealizada > 0 ? receitaRealizada / atividadeRealizada : 0;

      const pedidos = obterNumeroLinhaMeta(item?.quantidade_pedidos, 0);
      const ticketMeta = obterNumeroLinhaMeta(item?.meta_tkt_medio, dadosMetas?.meta_tkt_medio_geral || 0);
      const ticketRealizado = pedidos > 0 ? receitaRealizada / pedidos : 0;

      const totalItens = obterNumeroLinhaMeta(item?.total_itens, 0);
      const upaMeta = obterNumeroLinhaMeta(item?.meta_upa, dadosMetas?.meta_upa_geral || 0);
      const upaRealizada = atividadeRealizada > 0 ? totalItens / atividadeRealizada : 0;

      const metaMakePercentual = obterNumeroLinhaMeta(item?.meta_make, dadosMetas?.meta_make_geral || 0);
      const makeRealizado = obterNumeroLinhaMeta(item?.make_realizado, 0);
      const makeMetaQtd = metaMakePercentual > 0 && atividadeRealizada > 0 ? Math.ceil((atividadeRealizada * metaMakePercentual) / 100) : 0;
      const percentualMake = obterNumeroLinhaMeta(item?.percentual_make, calcularPercentualSeguro(makeRealizado, atividadeRealizada));

      const metaCabeloPercentual = obterNumeroLinhaMeta(item?.meta_cabelo, dadosMetas?.meta_cabelo_geral || 0);
      const cabeloRealizado = obterNumeroLinhaMeta(item?.cabelo_realizado, 0);
      const cabeloMetaQtd = metaCabeloPercentual > 0 && atividadeRealizada > 0 ? Math.ceil((atividadeRealizada * metaCabeloPercentual) / 100) : 0;
      const percentualCabelo = obterNumeroLinhaMeta(item?.percentual_cabelo, calcularPercentualSeguro(cabeloRealizado, atividadeRealizada));

      return {
        receitaMeta,
        receitaRealizada,
        percentualReceita,
        atividadeRealizada,
        baseAtiva,
        metaAtividadePercentual,
        metaAtividadeQtd,
        percentualAtividade,
        rpaMeta,
        rpaRealizado,
        ticketMeta,
        ticketRealizado,
        upaMeta,
        upaRealizada,
        metaMakePercentual,
        makeMetaQtd,
        makeRealizado,
        percentualMake,
        metaCabeloPercentual,
        cabeloMetaQtd,
        cabeloRealizado,
        percentualCabelo
      };
    };

    const calcularPercentualSeguro = (realizado, meta) => {
      const m = Number(meta || 0);
      if (!m || m <= 0) return 0;
      return (Number(realizado || 0) / m) * 100;
    };

    const CelulaValorPrincipalMeta = ({ titulo, valor, tipo = 'meta', percentual = null }) => {
      const corValor = tipo === 'meta' ? '#7c1f31' : '#048187';
      return (
        <div className="h-full min-h-[104px] bg-white px-4 py-3 flex flex-col justify-center border-l border-gray-100">
          <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">{titulo}</p>
          <p className="mt-2 text-lg font-black whitespace-nowrap" style={{ color: corValor }}>{valor}</p>
          {percentual !== null && (
            <span className="mt-2 w-fit rounded-full px-2 py-1 text-[11px] font-black bg-[#e6f6f7] text-[#048187]">
              {percentual}
            </span>
          )}
        </div>
      );
    };

    const CelulaIndicadorMetaRealizado = ({ titulo, meta, realizado, percentualMeta = null, percentualRealizado = null, percentualAtingimento = 0, compacto = false }) => {
      const cor = corPorFaixaMeta(percentualAtingimento);
      return (
        <div className="h-full min-h-[104px] bg-white px-3 py-3 border-l border-gray-100 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full" style={{ backgroundColor: cor }} />
          <p className="text-[10px] font-black uppercase tracking-wide text-gray-400 pl-2">{titulo}</p>
          <div className="mt-2 pl-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[9px] font-black uppercase text-gray-400">Meta</span>
              {percentualMeta && <span className="text-[10px] font-black text-[#7c1f31]">{percentualMeta}</span>}
            </div>
            <p className={`${compacto ? 'text-sm' : 'text-[15px]'} font-black text-[#7c1f31] whitespace-nowrap`}>{meta}</p>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 pl-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[9px] font-black uppercase text-gray-400">Realizado</span>
              {percentualRealizado && <span className="text-[10px] font-black" style={{ color: cor }}>{percentualRealizado}</span>}
            </div>
            <p className={`${compacto ? 'text-sm' : 'text-[15px]'} font-black text-[#048187] whitespace-nowrap`}>{realizado}</p>
          </div>
        </div>
      );
    };

    const ColunaEstruturaMetaRealizado = ({ item }) => {
      const estruturasVinculadas = Array.isArray(item?.estruturas_vinculadas) ? item.estruturas_vinculadas : [];
      return (
        <div className="h-full min-h-[104px] bg-gradient-to-br from-[#f3fbfb] via-white to-[#e6f6f7] px-4 py-4 flex items-center gap-3 rounded-l-3xl border-r border-gray-100">
          <div className="w-10 h-10 rounded-2xl bg-[#d9f0f1] text-[#048187] flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">Estrutura</p>
            <p className="text-sm font-black text-gray-800 leading-tight truncate">{item?.estrutura}</p>
            {estruturasVinculadas.length > 1 && (
              <span className="mt-2 inline-flex rounded-full bg-[#e6f6f7] px-2 py-1 text-[10px] font-black text-[#048187]">
                {estruturasVinculadas.length} estruturas vinculadas
              </span>
            )}
          </div>
        </div>
      );
    };

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


    const obterNumeroLinhaMeta = (valor, fallback = 0) => {
      const numero = Number(valor);
      if (Number.isFinite(numero)) return numero;
      const numeroFallback = Number(fallback);
      return Number.isFinite(numeroFallback) ? numeroFallback : 0;
    };

    const calcularIndicadoresLinhaEstrutura = (item) => {
      const receitaMeta = obterNumeroLinhaMeta(item?.receita, 0);
      const receitaRealizada = obterNumeroLinhaMeta(item?.realizado, 0);
      const percentualReceita = obterNumeroLinhaMeta(item?.percentual, calcPerc(receitaRealizada, receitaMeta));

      const atividadeRealizada = obterNumeroLinhaMeta(item?.atividade_realizada, 0);
      const baseAtiva = obterNumeroLinhaMeta(item?.base_ativa, 0);
      const metaAtividadePercentual = obterNumeroLinhaMeta(item?.meta_atividade, dadosMetas?.meta_atividade_geral || 0);
      const metaAtividadeQtd = calcularQtdMetaAtividade(baseAtiva, metaAtividadePercentual);
      const percentualAtividade = obterNumeroLinhaMeta(item?.percentual_atividade, calcularPercentualSeguro(atividadeRealizada, baseAtiva));

      const rpaMeta = obterNumeroLinhaMeta(item?.meta_rpa, dadosMetas?.meta_rpa_geral || 0);
      const rpaRealizado = atividadeRealizada > 0 ? receitaRealizada / atividadeRealizada : 0;

      const pedidos = obterNumeroLinhaMeta(item?.quantidade_pedidos, 0);
      const ticketMeta = obterNumeroLinhaMeta(item?.meta_tkt_medio, dadosMetas?.meta_tkt_medio_geral || 0);
      const ticketRealizado = pedidos > 0 ? receitaRealizada / pedidos : 0;

      const totalItens = obterNumeroLinhaMeta(item?.total_itens, 0);
      const upaMeta = obterNumeroLinhaMeta(item?.meta_upa, dadosMetas?.meta_upa_geral || 0);
      const upaRealizada = atividadeRealizada > 0 ? totalItens / atividadeRealizada : 0;

      const metaMakePercentual = obterNumeroLinhaMeta(item?.meta_make, dadosMetas?.meta_make_geral || 0);
      const makeRealizado = obterNumeroLinhaMeta(item?.make_realizado, 0);
      const makeMetaQtd = metaMakePercentual > 0 && atividadeRealizada > 0 ? Math.ceil((atividadeRealizada * metaMakePercentual) / 100) : 0;
      const percentualMake = obterNumeroLinhaMeta(item?.percentual_make, calcularPercentualSeguro(makeRealizado, atividadeRealizada));

      const metaCabeloPercentual = obterNumeroLinhaMeta(item?.meta_cabelo, dadosMetas?.meta_cabelo_geral || 0);
      const cabeloRealizado = obterNumeroLinhaMeta(item?.cabelo_realizado, 0);
      const cabeloMetaQtd = metaCabeloPercentual > 0 && atividadeRealizada > 0 ? Math.ceil((atividadeRealizada * metaCabeloPercentual) / 100) : 0;
      const percentualCabelo = obterNumeroLinhaMeta(item?.percentual_cabelo, calcularPercentualSeguro(cabeloRealizado, atividadeRealizada));

      return {
        receitaMeta,
        receitaRealizada,
        percentualReceita,
        atividadeRealizada,
        baseAtiva,
        metaAtividadePercentual,
        metaAtividadeQtd,
        percentualAtividade,
        rpaMeta,
        rpaRealizado,
        ticketMeta,
        ticketRealizado,
        upaMeta,
        upaRealizada,
        metaMakePercentual,
        makeMetaQtd,
        makeRealizado,
        percentualMake,
        metaCabeloPercentual,
        cabeloMetaQtd,
        cabeloRealizado,
        percentualCabelo
      };
    };

    const calcularPercentualSeguro = (realizado, meta) => {
      const m = Number(meta || 0);
      if (!m || m <= 0) return 0;
      return (Number(realizado || 0) / m) * 100;
    };

    const CelulaValorPrincipalMeta = ({ titulo, valor, tipo = 'meta', percentual = null }) => {
      const corValor = tipo === 'meta' ? '#7c1f31' : '#048187';
      return (
        <div className="h-full min-h-[104px] bg-white px-4 py-3 flex flex-col justify-center border-l border-gray-100">
          <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">{titulo}</p>
          <p className="mt-2 text-lg font-black whitespace-nowrap" style={{ color: corValor }}>{valor}</p>
          {percentual !== null && (
            <span className="mt-2 w-fit rounded-full px-2 py-1 text-[11px] font-black bg-[#e6f6f7] text-[#048187]">
              {percentual}
            </span>
          )}
        </div>
      );
    };

    const CelulaIndicadorMetaRealizado = ({ titulo, meta, realizado, percentualMeta = null, percentualRealizado = null, percentualAtingimento = 0, compacto = false }) => {
      const cor = corPorFaixaMeta(percentualAtingimento);
      return (
        <div className="h-full min-h-[104px] bg-white px-3 py-3 border-l border-gray-100 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full" style={{ backgroundColor: cor }} />
          <p className="text-[10px] font-black uppercase tracking-wide text-gray-400 pl-2">{titulo}</p>
          <div className="mt-2 pl-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[9px] font-black uppercase text-gray-400">Meta</span>
              {percentualMeta && <span className="text-[10px] font-black text-[#7c1f31]">{percentualMeta}</span>}
            </div>
            <p className={`${compacto ? 'text-sm' : 'text-[15px]'} font-black text-[#7c1f31] whitespace-nowrap`}>{meta}</p>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 pl-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[9px] font-black uppercase text-gray-400">Realizado</span>
              {percentualRealizado && <span className="text-[10px] font-black" style={{ color: cor }}>{percentualRealizado}</span>}
            </div>
            <p className={`${compacto ? 'text-sm' : 'text-[15px]'} font-black text-[#048187] whitespace-nowrap`}>{realizado}</p>
          </div>
        </div>
      );
    };

    const ColunaEstruturaMetaRealizado = ({ item }) => {
      const estruturasVinculadas = Array.isArray(item?.estruturas_vinculadas) ? item.estruturas_vinculadas : [];
      return (
        <div className="h-full min-h-[104px] bg-gradient-to-br from-[#f3fbfb] via-white to-[#e6f6f7] px-4 py-4 flex items-center gap-3 rounded-l-3xl border-r border-gray-100">
          <div className="w-10 h-10 rounded-2xl bg-[#d9f0f1] text-[#048187] flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">Estrutura</p>
            <p className="text-sm font-black text-gray-800 leading-tight truncate">{item?.estrutura}</p>
            {estruturasVinculadas.length > 1 && (
              <span className="mt-2 inline-flex rounded-full bg-[#e6f6f7] px-2 py-1 text-[10px] font-black text-[#048187]">
                {estruturasVinculadas.length} estruturas vinculadas
              </span>
            )}
          </div>
        </div>
      );
    };

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
        <p className="text-sm text-gray-400 font-semibold">Uploads de bases operacionais. Ciclos, metas, estruturas e consultores agora ficam concentrados na aba Cadastro.</p>
      </div>
      {(mensagemUpload || erroUpload) && (<div className={`rounded-xl p-4 font-bold text-sm ${mensagemUpload ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{mensagemUpload || erroUpload}</div>)}
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 xl:gap-6">
        <CompUpload titulo="Pedidos" desc="Base principal" arq={arquivoPedidos} setArq={setArquivoPedidos} onEnv={() => enviarArquivo('pedidos')} icone={Database} load={carregandoUpload} acaoExtraLabel="Atualizar via SGI" onAcaoExtra={iniciarAtualizacaoAutomaticaPedidos} acaoExtraLoad={carregandoAutomacaoPedidos} />
        <CompUpload titulo="Base Ativa" desc="Base de revendedores." arq={arquivoBaseAtiva} setArq={setArquivoBaseAtiva} onEnv={() => enviarArquivo('baseAtiva')} icone={Target} load={carregandoUpload} />
        <CompUpload titulo="Revendedores" desc="Visão Geral - Detalhe Revendedor." arq={arquivoRevendedores} setArq={setArquivoRevendedores} onEnv={() => enviarArquivo('revendedores')} icone={UserCircle} load={carregandoUpload} />
        <CompUpload titulo="SKUS IAF" desc="Abas MAKE e CABELO." arq={arquivoSkusIaf} setArq={setArquivoSkusIaf} onEnv={() => enviarArquivo('skusIaf')} icone={Sparkles} load={carregandoUpload} />
        <CompUpload titulo="Vendas MAKE" desc="5 planilhas MAKE." arquivos={arquivosVendasMake} setArqs={setArquivosVendasMake} onEnv={() => enviarArquivo('vendasMake')} icone={Upload} mult load={carregandoUpload} acaoExtraLabel="Atualizar via SGI" onAcaoExtra={iniciarAtualizacaoAutomaticaMake} acaoExtraLoad={carregandoAutomacaoMake} />
        <CompUpload titulo="Vendas CABELO" desc="Planilhas Cabelo." arquivos={arquivosVendasCabelo} setArqs={setArquivosVendasCabelo} onEnv={() => enviarArquivo('vendasCabelo')} icone={Scissors} mult load={carregandoUpload} acaoExtraLabel="Atualizar via SGI" onAcaoExtra={iniciarAtualizacaoAutomaticaCabelo} acaoExtraLoad={carregandoAutomacaoCabelo} />
      </div>
    </div>
  );

  const renderTelaEstruturasConfig = () => {
    const lista = listaEstruturasConfig.filter((item) => {
      const termo = buscaEstruturaConfig.toLowerCase().trim();
      if (!termo) return true;
      return String(item.estrutura || '').toLowerCase().includes(termo) || String(item.cod_estrutura || '').toLowerCase().includes(termo) || String(item.nucleo || '').toLowerCase().includes(termo);
    });
    const resumo = listaEstruturasConfig.reduce((acc, item) => {
      const nucleo = item.nucleo || 'SEM NÚCLEO';
      acc[nucleo] = (acc[nucleo] || 0) + 1;
      return acc;
    }, {});

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-8">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-gray-700">Estruturas e Núcleos</h2>
            <p className="text-sm text-gray-400 font-semibold mt-1">Defina a qual núcleo cada estrutura pertence. Isso alimenta os botões Todos, N1, N2, N3 e o painel de filtros.</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {Object.entries(resumo).map(([nucleo, total]) => <span key={nucleo} className="bg-[#e6f6f7] text-[#048187] px-3 py-1.5 rounded-full text-xs font-black">{String(nucleo).replace('NUCLEO', 'NÚCLEO')} • {total}</span>)}
              {!Object.keys(resumo).length && <span className="text-xs font-bold text-gray-400">Nenhuma estrutura configurada ainda.</span>}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
            <button onClick={sincronizarEstruturasConfig} className="bg-[#e6f6f7] text-[#048187] font-black px-4 py-3 rounded-lg hover:bg-[#d0f0f1] inline-flex items-center justify-center gap-2 text-sm"><RefreshCcw size={16} /> Sincronizar bases</button>
            <button onClick={carregarEstruturasConfig} className="bg-white border border-gray-200 text-gray-600 font-black px-4 py-3 rounded-lg hover:bg-gray-50 inline-flex items-center justify-center gap-2 text-sm"><RefreshCcw size={16} /> Atualizar</button>
          </div>
        </div>

        {(mensagemEstruturaConfig || erroEstruturaConfig) && (<div className={`rounded-xl p-4 font-bold text-sm mb-5 ${mensagemEstruturaConfig ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{mensagemEstruturaConfig || erroEstruturaConfig}</div>)}

        <form onSubmit={salvarEstruturaConfig} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-3 mb-6 bg-[#f7fafb] border border-gray-100 rounded-2xl p-4">
          <input value={estruturaConfigForm.cod_estrutura} onChange={(e) => setEstruturaConfigForm({ ...estruturaConfigForm, cod_estrutura: e.target.value })} placeholder="Código" className="border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187]" />
          <input value={estruturaConfigForm.estrutura} onChange={(e) => setEstruturaConfigForm({ ...estruturaConfigForm, estrutura: e.target.value })} placeholder="Nome da estrutura" className="md:col-span-2 border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187]" required />
          <select value={estruturaConfigForm.nucleo} onChange={(e) => setEstruturaConfigForm({ ...estruturaConfigForm, nucleo: e.target.value })} className="border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187]">
            <option value="NUCLEO 1">N1</option>
            <option value="NUCLEO 2">N2</option>
            <option value="NUCLEO 3">N3</option>
          </select>
          <select value={estruturaConfigForm.tipo_estrutura} onChange={(e) => setEstruturaConfigForm({ ...estruturaConfigForm, tipo_estrutura: e.target.value })} className="border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187]">
            <option value="estrutura">Estrutura</option>
            <option value="er">ER</option>
            <option value="grupo">Grupo</option>
            <option value="loja">Loja</option>
          </select>
          <select value={estruturaConfigForm.status} onChange={(e) => setEstruturaConfigForm({ ...estruturaConfigForm, status: e.target.value })} className="border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187]">
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-[#048187] text-white font-black rounded-lg px-4 py-3 hover:bg-[#036b70] inline-flex items-center justify-center gap-2"><Save size={16} /> {estruturaConfigEditando ? 'Salvar' : 'Adicionar'}</button>
            {estruturaConfigEditando && <button type="button" onClick={limparFormEstruturaConfig} className="px-3 rounded-lg border border-gray-200 text-gray-500 font-black hover:bg-white"><X size={16} /></button>}
          </div>
        </form>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="relative w-full sm:w-96">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={buscaEstruturaConfig} onChange={(e) => setBuscaEstruturaConfig(e.target.value)} placeholder="Buscar estrutura, código ou núcleo..." className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#048187]" />
          </div>
          <div className="text-sm font-bold text-[#048187] bg-[#e6f6f7] px-3 py-1.5 rounded-full">{lista.length} Estruturas</div>
        </div>

        {carregandoEstruturasConfig ? <div className="py-10 text-center text-[#048187] font-bold">Carregando estruturas...</div> : (
          <div className="overflow-x-auto">
            <div className="overflow-visible pr-2">
              <table className="w-full text-sm min-w-[900px]">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="text-left text-gray-500 border-b border-gray-200"><th className="py-3 px-2">Código</th><th className="py-3 px-2">Estrutura</th><th className="py-3 px-2">Núcleo</th><th className="py-3 px-2">Tipo</th><th className="py-3 px-2">Status</th><th className="py-3 px-2 text-right">Ações</th></tr>
                </thead>
                <tbody>
                  {lista.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-2 font-black text-[#048187]">{item.cod_estrutura || '-'}</td>
                      <td className="py-3 px-2 font-bold text-gray-700">{item.estrutura}</td>
                      <td className="py-3 px-2"><span className="bg-[#e6f6f7] text-[#048187] px-2 py-1 rounded-full text-xs font-black">{String(item.nucleo || '').replace('NUCLEO', 'NÚCLEO')}</span></td>
                      <td className="py-3 px-2 text-gray-500 font-bold uppercase text-xs">{item.tipo_estrutura || '-'}</td>
                      <td className="py-3 px-2"><span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${item.status === 'ativo' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{item.status}</span></td>
                      <td className="py-3 px-2 text-right whitespace-nowrap"><button onClick={() => editarEstruturaConfig(item)} className="text-[#048187] hover:text-[#036b70] mr-3"><Pencil size={17} /></button><button onClick={() => excluirEstruturaConfig(item)} className="text-red-500 hover:text-red-600"><Trash2 size={17} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!lista.length && <div className="py-10 text-center text-gray-400 font-bold">Nenhuma estrutura encontrada. Clique em Sincronizar bases para carregar todas as equipes das bases. Agora estruturas com o mesmo código também aparecem separadas.</div>}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBlocoCiclosCadastro = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-8">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-[#e6f6f7] text-[#048187] flex items-center justify-center shrink-0"><CalendarDays size={22} /></div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-700">Ciclos</h2>
            <p className="text-sm text-gray-400 font-semibold mt-1">Cadastre o período de cada ciclo. As metas detalhadas ficam salvas em Metas por Ciclo.</p>
          </div>
        </div>
        <button onClick={carregarCiclos} className="bg-[#048187] text-white font-bold px-4 py-3 rounded-lg hover:bg-[#036b70] inline-flex items-center justify-center gap-2"><RefreshCcw size={17} />Atualizar</button>
      </div>

      {(mensagemCiclo || erroCiclo) && (<div className={`rounded-xl p-4 font-bold text-sm mb-5 ${mensagemCiclo ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{mensagemCiclo || erroCiclo}</div>)}
      <FormCiclo form={cicloForm} setForm={setCicloForm} onSub={criarCiclo} txtBtn="Cadastrar" />

      <div className="mt-8">
        <h3 className="text-lg font-bold text-gray-700 mb-4">Ciclos cadastrados</h3>
        {carregandoCiclos ? (<p className="text-[#048187] font-bold">Carregando ciclos...</p>) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[680px]">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="py-3 px-2">Ciclo</th>
                  <th className="py-3 px-2">Início</th>
                  <th className="py-3 px-2">Fim</th>
                  <th className="py-3 px-2 text-center">Status</th>
                  <th className="py-3 px-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {ciclos.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                    <td className="py-4 px-2 font-bold text-gray-700">{c.ciclo}</td>
                    <td className="py-4 px-2 text-gray-500">{formatarDataBR(c.data_inicio)}</td>
                    <td className="py-4 px-2 text-gray-500">{formatarDataBR(c.data_fim)}</td>
                    <td className="py-4 px-2 text-center"><span className={`px-3 py-1 rounded-full text-xs font-bold ${c.status_ciclo === 'ativo' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{c.status_ciclo}</span></td>
                    <td className="py-4 px-2 text-right">
                      <button onClick={() => abrirEditarCiclo(c)} className="text-[#048187] hover:text-[#036b70] mr-3"><Pencil size={17} /></button>
                      <button onClick={() => abrirExcluirCiclo(c)} className="text-red-500 hover:text-red-600"><Trash2 size={17} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!ciclos.length && <div className="py-8 text-center text-gray-400 font-bold">Nenhum ciclo cadastrado ainda.</div>}
          </div>
        )}
      </div>
    </div>
  );

  const CardOpcaoCadastro = ({ titulo, descricao, icone: Icone, onClick, destaque }) => (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-md ${destaque ? 'bg-[#048187] border-[#048187] text-white' : 'bg-white border-gray-100 text-gray-700 hover:border-[#048187]/40'}`}
    >
      <div className={`w-11 h-11 rounded-full flex items-center justify-center mb-4 ${destaque ? 'bg-white/15 text-white' : 'bg-[#e6f6f7] text-[#048187]'}`}>
        <Icone size={22} />
      </div>
      <h3 className="font-black text-base mb-1">{titulo}</h3>
      <p className={`text-sm font-semibold leading-relaxed ${destaque ? 'text-white/80' : 'text-gray-400'}`}>{descricao}</p>
    </button>
  );

  const CabecalhoSubCadastro = ({ titulo, descricao }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-8">
      <button
        type="button"
        onClick={() => setVisaoCadastro('geral')}
        className="mb-4 inline-flex items-center gap-2 text-[#048187] font-black text-sm bg-[#e6f6f7] hover:bg-[#d0f0f1] rounded-lg px-4 py-2"
      >
        <ChevronLeft size={18} /> Voltar
      </button>
      <h1 className="text-xl sm:text-2xl font-bold text-gray-700 mb-2">{titulo}</h1>
      <p className="text-sm text-gray-400 font-semibold">{descricao}</p>
    </div>
  );

  const renderTelaCadastro = () => {
    if (visaoCadastro === 'estruturas') {
      return (
        <div className="space-y-6 animate-fade-in">
          <CabecalhoSubCadastro titulo="Estruturas e Núcleos" descricao="Configure N1, N2, N3, canal, tipo e status de cada estrutura." />
          {renderTelaEstruturasConfig()}
        </div>
      );
    }

    if (visaoCadastro === 'consultores') {
      return (
        <div className="space-y-6 animate-fade-in">
          <CabecalhoSubCadastro titulo="Consultores" descricao="Cadastre nomes sociais, status, estrutura e peso de meta dos consultores." />
          {renderTelaConsultores()}
        </div>
      );
    }

    if (visaoCadastro === 'metas') {
      return (
        <div className="space-y-6 animate-fade-in">
          <CabecalhoSubCadastro titulo="Metas por Ciclo" descricao="Tabela completa na própria tela: cadastre, edite na linha, apague e use Ver + para dividir por consultor." />
          <ModalMetasReais
            aberto={true}
            onClose={() => {}}
            apiUrl={API_URL}
            cicloPadrao={dados?.ciclo_atual || ciclos.find((c) => c.status_ciclo === 'ativo')?.ciclo || ''}
            onAtualizacao={atualizarTelasAposMudancaBanco}
            modoInline
          />
        </div>
      );
    }


    if (visaoCadastro === 'exclusoes-revendedores') {
      return (
        <div className="space-y-6 animate-fade-in">
          <CabecalhoSubCadastro titulo="Exclusões de Revendedores" descricao="Cadastre revendedores que devem ficar fora dos cálculos sem mexer na base original." />
          <TelaExclusoesRevendedores
            apiUrl={API_URL}
            onAtualizacao={atualizarTelasAposMudancaBanco}
          />
        </div>
      );
    }


    const obterNumeroLinhaMeta = (valor, fallback = 0) => {
      const numero = Number(valor);
      if (Number.isFinite(numero)) return numero;
      const numeroFallback = Number(fallback);
      return Number.isFinite(numeroFallback) ? numeroFallback : 0;
    };

    const calcularIndicadoresLinhaEstrutura = (item) => {
      const receitaMeta = obterNumeroLinhaMeta(item?.receita, 0);
      const receitaRealizada = obterNumeroLinhaMeta(item?.realizado, 0);
      const percentualReceita = obterNumeroLinhaMeta(item?.percentual, calcPerc(receitaRealizada, receitaMeta));

      const atividadeRealizada = obterNumeroLinhaMeta(item?.atividade_realizada, 0);
      const baseAtiva = obterNumeroLinhaMeta(item?.base_ativa, 0);
      const metaAtividadePercentual = obterNumeroLinhaMeta(item?.meta_atividade, dadosMetas?.meta_atividade_geral || 0);
      const metaAtividadeQtd = calcularQtdMetaAtividade(baseAtiva, metaAtividadePercentual);
      const percentualAtividade = obterNumeroLinhaMeta(item?.percentual_atividade, calcularPercentualSeguro(atividadeRealizada, baseAtiva));

      const rpaMeta = obterNumeroLinhaMeta(item?.meta_rpa, dadosMetas?.meta_rpa_geral || 0);
      const rpaRealizado = atividadeRealizada > 0 ? receitaRealizada / atividadeRealizada : 0;

      const pedidos = obterNumeroLinhaMeta(item?.quantidade_pedidos, 0);
      const ticketMeta = obterNumeroLinhaMeta(item?.meta_tkt_medio, dadosMetas?.meta_tkt_medio_geral || 0);
      const ticketRealizado = pedidos > 0 ? receitaRealizada / pedidos : 0;

      const totalItens = obterNumeroLinhaMeta(item?.total_itens, 0);
      const upaMeta = obterNumeroLinhaMeta(item?.meta_upa, dadosMetas?.meta_upa_geral || 0);
      const upaRealizada = atividadeRealizada > 0 ? totalItens / atividadeRealizada : 0;

      const metaMakePercentual = obterNumeroLinhaMeta(item?.meta_make, dadosMetas?.meta_make_geral || 0);
      const makeRealizado = obterNumeroLinhaMeta(item?.make_realizado, 0);
      const makeMetaQtd = metaMakePercentual > 0 && atividadeRealizada > 0 ? Math.ceil((atividadeRealizada * metaMakePercentual) / 100) : 0;
      const percentualMake = obterNumeroLinhaMeta(item?.percentual_make, calcularPercentualSeguro(makeRealizado, atividadeRealizada));

      const metaCabeloPercentual = obterNumeroLinhaMeta(item?.meta_cabelo, dadosMetas?.meta_cabelo_geral || 0);
      const cabeloRealizado = obterNumeroLinhaMeta(item?.cabelo_realizado, 0);
      const cabeloMetaQtd = metaCabeloPercentual > 0 && atividadeRealizada > 0 ? Math.ceil((atividadeRealizada * metaCabeloPercentual) / 100) : 0;
      const percentualCabelo = obterNumeroLinhaMeta(item?.percentual_cabelo, calcularPercentualSeguro(cabeloRealizado, atividadeRealizada));

      return {
        receitaMeta,
        receitaRealizada,
        percentualReceita,
        atividadeRealizada,
        baseAtiva,
        metaAtividadePercentual,
        metaAtividadeQtd,
        percentualAtividade,
        rpaMeta,
        rpaRealizado,
        ticketMeta,
        ticketRealizado,
        upaMeta,
        upaRealizada,
        metaMakePercentual,
        makeMetaQtd,
        makeRealizado,
        percentualMake,
        metaCabeloPercentual,
        cabeloMetaQtd,
        cabeloRealizado,
        percentualCabelo
      };
    };

    const calcularPercentualSeguro = (realizado, meta) => {
      const m = Number(meta || 0);
      if (!m || m <= 0) return 0;
      return (Number(realizado || 0) / m) * 100;
    };

    const CelulaValorPrincipalMeta = ({ titulo, valor, tipo = 'meta', percentual = null }) => {
      const corValor = tipo === 'meta' ? '#7c1f31' : '#048187';
      return (
        <div className="h-full min-h-[104px] bg-white px-4 py-3 flex flex-col justify-center border-l border-gray-100">
          <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">{titulo}</p>
          <p className="mt-2 text-lg font-black whitespace-nowrap" style={{ color: corValor }}>{valor}</p>
          {percentual !== null && (
            <span className="mt-2 w-fit rounded-full px-2 py-1 text-[11px] font-black bg-[#e6f6f7] text-[#048187]">
              {percentual}
            </span>
          )}
        </div>
      );
    };

    const CelulaIndicadorMetaRealizado = ({ titulo, meta, realizado, percentualMeta = null, percentualRealizado = null, percentualAtingimento = 0, compacto = false }) => {
      const cor = corPorFaixaMeta(percentualAtingimento);
      return (
        <div className="h-full min-h-[104px] bg-white px-3 py-3 border-l border-gray-100 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full" style={{ backgroundColor: cor }} />
          <p className="text-[10px] font-black uppercase tracking-wide text-gray-400 pl-2">{titulo}</p>
          <div className="mt-2 pl-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[9px] font-black uppercase text-gray-400">Meta</span>
              {percentualMeta && <span className="text-[10px] font-black text-[#7c1f31]">{percentualMeta}</span>}
            </div>
            <p className={`${compacto ? 'text-sm' : 'text-[15px]'} font-black text-[#7c1f31] whitespace-nowrap`}>{meta}</p>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 pl-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[9px] font-black uppercase text-gray-400">Realizado</span>
              {percentualRealizado && <span className="text-[10px] font-black" style={{ color: cor }}>{percentualRealizado}</span>}
            </div>
            <p className={`${compacto ? 'text-sm' : 'text-[15px]'} font-black text-[#048187] whitespace-nowrap`}>{realizado}</p>
          </div>
        </div>
      );
    };

    const ColunaEstruturaMetaRealizado = ({ item }) => {
      const estruturasVinculadas = Array.isArray(item?.estruturas_vinculadas) ? item.estruturas_vinculadas : [];
      return (
        <div className="h-full min-h-[104px] bg-gradient-to-br from-[#f3fbfb] via-white to-[#e6f6f7] px-4 py-4 flex items-center gap-3 rounded-l-3xl border-r border-gray-100">
          <div className="w-10 h-10 rounded-2xl bg-[#d9f0f1] text-[#048187] flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">Estrutura</p>
            <p className="text-sm font-black text-gray-800 leading-tight truncate">{item?.estrutura}</p>
            {estruturasVinculadas.length > 1 && (
              <span className="mt-2 inline-flex rounded-full bg-[#e6f6f7] px-2 py-1 text-[10px] font-black text-[#048187]">
                {estruturasVinculadas.length} estruturas vinculadas
              </span>
            )}
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-700 mb-2">Cadastro</h1>
            <p className="text-sm text-gray-400 font-semibold">Cadastre ciclos, metas reais, estruturas por núcleo, consultores, nomes sociais e pesos de meta. Tudo fica salvo para histórico e comparação entre ciclos.</p>
          </div>
        </div>

        {renderBlocoCiclosCadastro()}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-8">
          <div className="mb-5">
            <h2 className="text-lg sm:text-xl font-bold text-gray-700">Módulos de cadastro</h2>
            <p className="text-sm text-gray-400 font-semibold mt-1">Escolha uma opção para editar. Use o botão Voltar para retornar a esta tela.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <CardOpcaoCadastro
              titulo="Metas por Ciclo"
              descricao="Tabela estilo planilha para receita, atividade, RPA, ticket, UPA, Make, Cabelo e divisão por consultor."
              icone={BadgeDollarSign}
              destaque
              onClick={() => setVisaoCadastro('metas')}
            />
            <CardOpcaoCadastro
              titulo="Estruturas e Núcleos"
              descricao="Defina N1, N2 ou N3, canal, tipo e status de cada estrutura."
              icone={Target}
              onClick={() => setVisaoCadastro('estruturas')}
            />
            <CardOpcaoCadastro
              titulo="Consultores"
              descricao="Gerencie nome social, status, estrutura e peso de meta dos consultores."
              icone={Users}
              onClick={() => setVisaoCadastro('consultores')}
            />
            <CardOpcaoCadastro
              titulo="Exclusões de Revendedores"
              descricao="Remova cadastros teste ou exceções dos cálculos sem alterar a base de pedidos."
              icone={ShieldCheck}
              onClick={() => setVisaoCadastro('exclusoes-revendedores')}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderTelaConsultores = () => {
    const cFilt = listaConsultores.filter(c => String(c.nome || '').toLowerCase().includes(buscaConsultor.toLowerCase()) || String(c.nome_social || '').toLowerCase().includes(buscaConsultor.toLowerCase()) || String(c.id_colaborador).includes(buscaConsultor));

    const obterNumeroLinhaMeta = (valor, fallback = 0) => {
      const numero = Number(valor);
      if (Number.isFinite(numero)) return numero;
      const numeroFallback = Number(fallback);
      return Number.isFinite(numeroFallback) ? numeroFallback : 0;
    };

    const calcularIndicadoresLinhaEstrutura = (item) => {
      const receitaMeta = obterNumeroLinhaMeta(item?.receita, 0);
      const receitaRealizada = obterNumeroLinhaMeta(item?.realizado, 0);
      const percentualReceita = obterNumeroLinhaMeta(item?.percentual, calcPerc(receitaRealizada, receitaMeta));

      const atividadeRealizada = obterNumeroLinhaMeta(item?.atividade_realizada, 0);
      const baseAtiva = obterNumeroLinhaMeta(item?.base_ativa, 0);
      const metaAtividadePercentual = obterNumeroLinhaMeta(item?.meta_atividade, dadosMetas?.meta_atividade_geral || 0);
      const metaAtividadeQtd = calcularQtdMetaAtividade(baseAtiva, metaAtividadePercentual);
      const percentualAtividade = obterNumeroLinhaMeta(item?.percentual_atividade, calcularPercentualSeguro(atividadeRealizada, baseAtiva));

      const rpaMeta = obterNumeroLinhaMeta(item?.meta_rpa, dadosMetas?.meta_rpa_geral || 0);
      const rpaRealizado = atividadeRealizada > 0 ? receitaRealizada / atividadeRealizada : 0;

      const pedidos = obterNumeroLinhaMeta(item?.quantidade_pedidos, 0);
      const ticketMeta = obterNumeroLinhaMeta(item?.meta_tkt_medio, dadosMetas?.meta_tkt_medio_geral || 0);
      const ticketRealizado = pedidos > 0 ? receitaRealizada / pedidos : 0;

      const totalItens = obterNumeroLinhaMeta(item?.total_itens, 0);
      const upaMeta = obterNumeroLinhaMeta(item?.meta_upa, dadosMetas?.meta_upa_geral || 0);
      const upaRealizada = atividadeRealizada > 0 ? totalItens / atividadeRealizada : 0;

      const metaMakePercentual = obterNumeroLinhaMeta(item?.meta_make, dadosMetas?.meta_make_geral || 0);
      const makeRealizado = obterNumeroLinhaMeta(item?.make_realizado, 0);
      const makeMetaQtd = metaMakePercentual > 0 && atividadeRealizada > 0 ? Math.ceil((atividadeRealizada * metaMakePercentual) / 100) : 0;
      const percentualMake = obterNumeroLinhaMeta(item?.percentual_make, calcularPercentualSeguro(makeRealizado, atividadeRealizada));

      const metaCabeloPercentual = obterNumeroLinhaMeta(item?.meta_cabelo, dadosMetas?.meta_cabelo_geral || 0);
      const cabeloRealizado = obterNumeroLinhaMeta(item?.cabelo_realizado, 0);
      const cabeloMetaQtd = metaCabeloPercentual > 0 && atividadeRealizada > 0 ? Math.ceil((atividadeRealizada * metaCabeloPercentual) / 100) : 0;
      const percentualCabelo = obterNumeroLinhaMeta(item?.percentual_cabelo, calcularPercentualSeguro(cabeloRealizado, atividadeRealizada));

      return {
        receitaMeta,
        receitaRealizada,
        percentualReceita,
        atividadeRealizada,
        baseAtiva,
        metaAtividadePercentual,
        metaAtividadeQtd,
        percentualAtividade,
        rpaMeta,
        rpaRealizado,
        ticketMeta,
        ticketRealizado,
        upaMeta,
        upaRealizada,
        metaMakePercentual,
        makeMetaQtd,
        makeRealizado,
        percentualMake,
        metaCabeloPercentual,
        cabeloMetaQtd,
        cabeloRealizado,
        percentualCabelo
      };
    };

    const calcularPercentualSeguro = (realizado, meta) => {
      const m = Number(meta || 0);
      if (!m || m <= 0) return 0;
      return (Number(realizado || 0) / m) * 100;
    };

    const CelulaValorPrincipalMeta = ({ titulo, valor, tipo = 'meta', percentual = null }) => {
      const corValor = tipo === 'meta' ? '#7c1f31' : '#048187';
      return (
        <div className="h-full min-h-[104px] bg-white px-4 py-3 flex flex-col justify-center border-l border-gray-100">
          <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">{titulo}</p>
          <p className="mt-2 text-lg font-black whitespace-nowrap" style={{ color: corValor }}>{valor}</p>
          {percentual !== null && (
            <span className="mt-2 w-fit rounded-full px-2 py-1 text-[11px] font-black bg-[#e6f6f7] text-[#048187]">
              {percentual}
            </span>
          )}
        </div>
      );
    };

    const CelulaIndicadorMetaRealizado = ({ titulo, meta, realizado, percentualMeta = null, percentualRealizado = null, percentualAtingimento = 0, compacto = false }) => {
      const cor = corPorFaixaMeta(percentualAtingimento);
      return (
        <div className="h-full min-h-[104px] bg-white px-3 py-3 border-l border-gray-100 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full" style={{ backgroundColor: cor }} />
          <p className="text-[10px] font-black uppercase tracking-wide text-gray-400 pl-2">{titulo}</p>
          <div className="mt-2 pl-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[9px] font-black uppercase text-gray-400">Meta</span>
              {percentualMeta && <span className="text-[10px] font-black text-[#7c1f31]">{percentualMeta}</span>}
            </div>
            <p className={`${compacto ? 'text-sm' : 'text-[15px]'} font-black text-[#7c1f31] whitespace-nowrap`}>{meta}</p>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 pl-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[9px] font-black uppercase text-gray-400">Realizado</span>
              {percentualRealizado && <span className="text-[10px] font-black" style={{ color: cor }}>{percentualRealizado}</span>}
            </div>
            <p className={`${compacto ? 'text-sm' : 'text-[15px]'} font-black text-[#048187] whitespace-nowrap`}>{realizado}</p>
          </div>
        </div>
      );
    };

    const ColunaEstruturaMetaRealizado = ({ item }) => {
      const estruturasVinculadas = Array.isArray(item?.estruturas_vinculadas) ? item.estruturas_vinculadas : [];
      return (
        <div className="h-full min-h-[104px] bg-gradient-to-br from-[#f3fbfb] via-white to-[#e6f6f7] px-4 py-4 flex items-center gap-3 rounded-l-3xl border-r border-gray-100">
          <div className="w-10 h-10 rounded-2xl bg-[#d9f0f1] text-[#048187] flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">Estrutura</p>
            <p className="text-sm font-black text-gray-800 leading-tight truncate">{item?.estrutura}</p>
            {estruturasVinculadas.length > 1 && (
              <span className="mt-2 inline-flex rounded-full bg-[#e6f6f7] px-2 py-1 text-[10px] font-black text-[#048187]">
                {estruturasVinculadas.length} estruturas vinculadas
              </span>
            )}
          </div>
        </div>
      );
    };

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


  const CardAuditoria = ({ titulo, valor, subtitulo, icone: Icone, destaque = false, perigo = false, onDetalhes }) => (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase text-gray-400">{titulo}</p>
          <p className={`text-2xl font-black mt-2 ${perigo ? 'text-[#7c1f31]' : destaque ? 'text-[#048187]' : 'text-gray-700'}`}>{valor ?? 0}</p>
          {subtitulo && <p className="text-xs font-bold text-gray-400 mt-1">{subtitulo}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${perigo ? 'bg-[#7c1f31]/10 text-[#7c1f31]' : 'bg-[#e6f6f7] text-[#048187]'}`}><Icone size={22} /></div>
          {onDetalhes && (
            <button type="button" onClick={onDetalhes} className="inline-flex items-center gap-1 text-[11px] font-black text-[#048187] hover:underline">
              <Eye size={14} /> Ver
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const formatarDataHoraAuditoria = (valor) => {
    if (!valor) return '-';
    try { return new Date(valor).toLocaleString('pt-BR'); } catch (_) { return valor; }
  };

  const LinhaLogAuditoria = ({ item }) => (
    <tr className="border-b border-gray-50 hover:bg-[#f7fafb]">
      <td className="py-3 px-3"><div className="font-black text-gray-700">{item.usuario_nome || item.usuario_email || '-'}</div><div className="text-[11px] text-gray-400 font-bold">{item.usuario_email || '-'}</div></td>
      <td className="py-3 px-3"><div className="font-black text-[#048187]">{item.modulo || '-'}</div><div className="text-[11px] text-gray-400 font-bold">{item.acao || '-'}</div></td>
      <td className="py-3 px-3 text-gray-500 font-semibold max-w-[420px]">{item.descricao || item.entidade || '-'}</td>
      <td className="py-3 px-3"><span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${item.status === 'erro' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>{item.status || 'sucesso'}</span></td>
      <td className="py-3 px-3 text-gray-500 font-bold whitespace-nowrap">{formatarDataHoraAuditoria(item.criado_em)}</td>
      <td className="py-3 px-3 text-right">
        <button type="button" onClick={() => setAuditoriaDetalhe(item)} className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#e6f6f7] text-[#048187] hover:bg-[#d0f0f1]" title="Ver detalhes da ação">
          <Eye size={17} />
        </button>
      </td>
    </tr>
  );

  const ModalDetalheAuditoria = () => {
    if (!auditoriaDetalhe) return null;

    const detalhes = auditoriaDetalhe.detalhes_json || {};
    const resumoPayload = detalhes.resumo_payload || {};
    const payload = detalhes.payload || {};
    const campos = resumoPayload.campos_alterados || [];

    return (
      <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4">
        <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-gray-700">Detalhes da ação</h2>
              <p className="text-sm text-gray-400 font-semibold mt-1">Veja quem fez, quando fez e quais campos foram enviados na edição.</p>
            </div>
            <button onClick={() => setAuditoriaDetalhe(null)} className="text-gray-400 hover:bg-gray-50 rounded-full p-2"><X size={22} /></button>
          </div>

          <div className="p-6 overflow-y-auto space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-[#f7fafb] rounded-2xl p-4">
                <p className="text-[10px] uppercase font-black text-gray-400">Usuário</p>
                <p className="font-black text-gray-700 mt-1">{auditoriaDetalhe.usuario_nome || '-'}</p>
                <p className="text-xs text-gray-400 font-bold">{auditoriaDetalhe.usuario_email || '-'}</p>
              </div>
              <div className="bg-[#f7fafb] rounded-2xl p-4">
                <p className="text-[10px] uppercase font-black text-gray-400">Módulo</p>
                <p className="font-black text-[#048187] mt-1">{auditoriaDetalhe.modulo || '-'}</p>
                <p className="text-xs text-gray-400 font-bold">{auditoriaDetalhe.acao || '-'}</p>
              </div>
              <div className="bg-[#f7fafb] rounded-2xl p-4">
                <p className="text-[10px] uppercase font-black text-gray-400">Quando</p>
                <p className="font-black text-gray-700 mt-1">{formatarDataHoraAuditoria(auditoriaDetalhe.criado_em)}</p>
                <p className="text-xs text-gray-400 font-bold">IP: {auditoriaDetalhe.ip || '-'}</p>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-4">
              <p className="text-[10px] uppercase font-black text-gray-400">O que foi feito</p>
              <p className="font-bold text-gray-700 mt-2">{auditoriaDetalhe.descricao || '-'}</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-4">
              <p className="text-[10px] uppercase font-black text-gray-400 mb-3">Campos editados/enviados</p>
              {campos.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {campos.map((campo) => <span key={campo} className="bg-[#e6f6f7] text-[#048187] px-3 py-1.5 rounded-full text-xs font-black">{campo}</span>)}
                </div>
              ) : (
                <p className="text-gray-400 font-bold text-sm">Nenhum campo registrado.</p>
              )}
            </div>

            {!!Object.keys(resumoPayload).length && (
              <div className="bg-[#fbfefe] border border-[#d9eff0] rounded-2xl p-4">
                <p className="text-[10px] uppercase font-black text-gray-400 mb-3">Resumo dos novos valores</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {Object.entries(resumoPayload).filter(([chave]) => !['campos_alterados', 'total_campos'].includes(chave)).map(([chave, valor]) => (
                    <div key={chave} className="bg-white border border-gray-100 rounded-xl px-3 py-2">
                      <p className="text-[10px] uppercase font-black text-gray-400">{chave}</p>
                      <p className="font-bold text-gray-700 break-words">{typeof valor === 'object' ? JSON.stringify(valor) : String(valor ?? '-')}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <details className="bg-gray-50 rounded-2xl p-4">
              <summary className="cursor-pointer font-black text-gray-600">Ver payload técnico</summary>
              <pre className="mt-3 bg-white border border-gray-100 rounded-xl p-4 text-xs overflow-x-auto text-gray-600">{JSON.stringify(payload, null, 2)}</pre>
            </details>
          </div>
        </div>
      </div>
    );
  };

  const TabelaLogsAuditoria = ({ titulo, dados = [], vazio = 'Nenhum registro encontrado.' }) => (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-3"><h3 className="text-lg font-black text-gray-700">{titulo}</h3><span className="bg-[#e6f6f7] text-[#048187] px-3 py-1.5 rounded-full text-xs font-black">{dados.length} registros</span></div>
      <div className="overflow-x-auto"><table className="w-full text-sm min-w-[960px]"><thead className="bg-[#f7fafb] text-[11px] uppercase text-gray-400 font-black"><tr><th className="py-3 px-3 text-left">Usuário</th><th className="py-3 px-3 text-left">Módulo/Ação</th><th className="py-3 px-3 text-left">Descrição</th><th className="py-3 px-3 text-left">Status</th><th className="py-3 px-3 text-left">Data/Hora</th><th className="py-3 px-3 text-right">Detalhes</th></tr></thead><tbody>{dados.map((item) => <LinhaLogAuditoria key={item.id} item={item} />)}</tbody></table>{!dados.length && <div className="py-10 text-center text-gray-400 font-bold">{vazio}</div>}</div>
    </div>
  );

  const renderTelaADM = () => {
    const resumo = dadosAuditoria?.resumo || {};
    const aba = filtrosAuditoria.aba || 'acessos';
    const abas = [
      { id: 'acessos', label: 'Acessos', dados: dadosAuditoria?.acessos_recentes || [] },
      { id: 'uploads', label: 'Uploads', dados: dadosAuditoria?.uploads_recentes || [] },
      { id: 'acoes', label: 'Ações', dados: dadosAuditoria?.acoes_recentes || [] },
      { id: 'erros', label: 'Erros', dados: dadosAuditoria?.erros_recentes || [] },
    ];
    const abaAtual = abas.find((item) => item.id === aba) || abas[0];
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div><h1 className="text-2xl font-black text-gray-700">Painel ADM</h1><p className="text-gray-400 font-semibold mt-1">Acompanhe acessos, uploads, alterações, erros e uso das telas do Dash.</p></div>
            <div className="flex flex-col sm:flex-row gap-2"><select value={filtrosAuditoria.dias} onChange={(e) => { const dias = Number(e.target.value); setFiltrosAuditoria((atual) => ({ ...atual, dias })); carregarAuditoria(dias); }} className="border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-[#048187]"><option value={1}>Últimas 24h</option><option value={7}>Últimos 7 dias</option><option value={15}>Últimos 15 dias</option><option value={30}>Últimos 30 dias</option><option value={90}>Últimos 90 dias</option></select><button onClick={() => carregarAuditoria()} className="bg-[#048187] text-white font-black px-5 py-3 rounded-xl hover:brightness-110 inline-flex items-center justify-center gap-2"><RefreshCcw size={18} /> Atualizar</button></div>
          </div>
          {erroAuditoria && <div className="mt-4 bg-red-50 text-red-600 p-4 rounded-xl font-bold">{erroAuditoria}</div>}
          {carregandoAuditoria && <div className="mt-4 bg-[#e6f6f7] text-[#048187] p-4 rounded-xl font-bold">Carregando auditoria...</div>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4"><CardAuditoria titulo="Usuários ativos" valor={resumo.usuarios_ativos_24h || 0} subtitulo="últimas 24h" icone={Users} destaque onDetalhes={() => setFiltrosAuditoria((atual) => ({ ...atual, aba: 'acessos' }))} /><CardAuditoria titulo="Logins" valor={resumo.logins_24h || 0} subtitulo="últimas 24h" icone={UserCircle} onDetalhes={() => setFiltrosAuditoria((atual) => ({ ...atual, aba: 'acessos' }))} /><CardAuditoria titulo="Uploads" valor={resumo.uploads_24h || 0} subtitulo="bases atualizadas" icone={Upload} destaque onDetalhes={() => setFiltrosAuditoria((atual) => ({ ...atual, aba: 'uploads' }))} /><CardAuditoria titulo="Ações" valor={resumo.acoes_24h || 0} subtitulo="cadastros/edições" icone={Pencil} onDetalhes={() => setFiltrosAuditoria((atual) => ({ ...atual, aba: 'acoes' }))} /><CardAuditoria titulo="Erros" valor={resumo.erros_24h || 0} subtitulo="últimas 24h" icone={AlertCircle} perigo={Number(resumo.erros_24h || 0) > 0} onDetalhes={() => setFiltrosAuditoria((atual) => ({ ...atual, aba: 'erros' }))} /></div>
        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_.8fr] gap-6"><div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5"><div className="flex items-center justify-between gap-3 mb-4"><h3 className="text-lg font-black text-gray-700">Telas mais usadas</h3><span className="text-xs font-black text-[#048187] bg-[#e6f6f7] px-3 py-1.5 rounded-full">{dadosAuditoria?.periodo_dias || filtrosAuditoria.dias} dias</span></div><div className="space-y-3">{(dadosAuditoria?.uso_por_tela || []).slice(0, 8).map((item, index) => (<div key={item.modulo} className="flex items-center gap-3"><div className="w-7 h-7 rounded-full bg-[#e6f6f7] text-[#048187] font-black flex items-center justify-center text-xs">{index + 1}</div><div className="flex-1 min-w-0"><div className="flex items-center justify-between gap-3"><p className="font-black text-gray-700 truncate">{item.modulo}</p><p className="font-black text-[#048187]">{item.acessos}</p></div><div className="h-2 bg-gray-100 rounded-full mt-1 overflow-hidden"><div className="h-full bg-[#048187] rounded-full" style={{ width: `${Math.min(100, Number(item.acessos || 0) * 6)}%` }} /></div><p className="text-[11px] text-gray-400 font-bold mt-1">{item.usuarios} usuário(s)</p></div></div>))}{!(dadosAuditoria?.uso_por_tela || []).length && <p className="text-gray-400 font-bold text-sm">Ainda não há uso registrado.</p>}</div></div><div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5"><h3 className="text-lg font-black text-gray-700 mb-4">Usuários recentes</h3><div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">{(dadosAuditoria?.usuarios_ativos || []).map((u) => (<div key={u.usuario_email} className="flex items-center justify-between gap-3 border-b border-gray-50 pb-3"><div className="min-w-0"><p className="font-black text-gray-700 truncate">{u.usuario_nome || '-'}</p><p className="text-xs text-gray-400 font-bold truncate">{u.usuario_email}</p></div><div className="text-right shrink-0"><span className="bg-[#e6f6f7] text-[#048187] px-2 py-1 rounded-full text-[10px] font-black uppercase">{u.perfil || '-'}</span><p className="text-[11px] text-gray-400 font-bold mt-1">{formatarDataHoraAuditoria(u.ultimo_evento)}</p></div></div>))}{!(dadosAuditoria?.usuarios_ativos || []).length && <p className="text-gray-400 font-bold text-sm">Nenhum usuário recente.</p>}</div></div></div>
        <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm"><div className="flex flex-wrap gap-2">{abas.map((item) => (<button key={item.id} onClick={() => setFiltrosAuditoria((atual) => ({ ...atual, aba: item.id }))} className={`px-4 py-2.5 rounded-xl font-black text-sm transition-colors ${aba === item.id ? 'bg-[#048187] text-white' : 'bg-[#f7fafb] text-gray-500 hover:bg-[#e6f6f7] hover:text-[#048187]'}`}>{item.label} <span className={aba === item.id ? 'text-white/80' : 'text-gray-400'}>({item.dados.length})</span></button>))}</div></div>
        <TabelaLogsAuditoria titulo={abaAtual.label} dados={abaAtual.dados} vazio={`Nenhum registro em ${abaAtual.label.toLowerCase()}.`} />
        <ModalDetalheAuditoria />
      </div>
    );
  };

  const renderTelaConfiguracoes = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-8"><h1 className="text-xl sm:text-2xl font-bold text-gray-700 mb-2">Configurações</h1><p className="text-gray-400">Gerencie usuários e permissões de acesso.</p></div>
      {(mensagemUsuarios || erroUsuarios) && (<div className={`rounded-xl p-4 font-bold text-sm ${mensagemUsuarios ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{mensagemUsuarios || erroUsuarios}</div>)}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-8">
        <div className="flex items-center gap-3"><div className="w-12 h-12 rounded-full bg-[#e6f6f7] text-[#048187] flex items-center justify-center shrink-0"><ShieldCheck size={24} /></div><div><h2 className="text-xl font-bold text-gray-700">Controle de Permissões</h2><p className="text-sm text-gray-400">Configure as abas liberadas individualmente para cada usuário cadastrado.</p></div></div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-8">
        <div className="flex items-center gap-2 mb-6"><Plus size={22} className="text-[#048187]" /><h2 className="text-xl font-bold text-gray-700">Criar usuário</h2></div>
        <form onSubmit={criarUsuario} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4"><input type="text" placeholder="Nome" value={novoUsuario.nome} onChange={(e) => setNovoUsuario({ ...novoUsuario, nome: e.target.value })} className="border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187]" required /><input type="email" placeholder="E-mail" value={novoUsuario.email} onChange={(e) => setNovoUsuario({ ...novoUsuario, email: e.target.value })} className="border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187]" required /><input type="password" placeholder="Senha" value={novoUsuario.senha} onChange={(e) => setNovoUsuario({ ...novoUsuario, senha: e.target.value })} className="border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187]" required /><select value={novoUsuario.perfil} onChange={(e) => setNovoUsuario({ ...novoUsuario, perfil: e.target.value })} className="border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#048187]"><option value="admin">Admin</option><option value="gestor">Gestor</option><option value="visualizador">Visualizador</option></select><button type="submit" className="bg-[#048187] text-white font-bold rounded-lg py-3 hover:bg-[#036b70] inline-flex items-center justify-center gap-2"><ShieldCheck size={18} /> Criar</button></form>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6"><h2 className="text-xl font-bold text-gray-700">Usuários cadastrados</h2><button onClick={carregarUsuarios} className="text-[#048187] font-bold text-sm hover:underline">Atualizar</button></div>
        {carregandoUsuarios ? (<p className="text-[#048187] font-bold">Carregando usuários...</p>) : (
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[980px]"><thead><tr className="text-left text-gray-500 border-b border-gray-100"><th className="py-3 px-2">Nome</th><th className="py-3 px-2">E-mail</th><th className="py-3 px-2">Perfil</th><th className="py-3 px-2">Permissões</th><th className="py-3 px-2">Status</th><th className="py-3 px-2 text-right">Ações</th></tr></thead><tbody>{usuariosSistema.map((u) => { const abasPerfil = obterPermissoesUsuarioLista(u); const podeConfigurarPermissoes = usuarioLogado?.perfil === 'admin'; return (<tr key={u.id} className="border-b border-gray-50"><td className="py-4 px-2 font-bold text-gray-700">{u.nome}</td><td className="py-4 px-2 text-gray-500">{u.email}</td><td className="py-4 px-2 text-[#048187] font-bold uppercase">{u.perfil}</td><td className="py-4 px-2"><div className="flex flex-col gap-2 min-w-[220px]"><div className="flex flex-wrap gap-1.5">{abasPerfil.slice(0, 3).map((aba) => (<span key={aba} className="bg-[#e6f6f7] text-[#048187] px-2 py-1 rounded-full text-[10px] font-bold">{obterNomeAba(aba)}</span>))}{abasPerfil.length > 3 && (<span className="bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-[10px] font-bold">+{abasPerfil.length - 3}</span>)}</div>{podeConfigurarPermissoes ? (<button type="button" onClick={() => abrirModalPermissoes(u)} className="w-fit bg-[#048187] text-white font-bold px-3 py-1.5 rounded-lg hover:bg-[#036b70] transition-colors text-xs inline-flex items-center gap-1"><ShieldCheck size={13} /> Configurar abas</button>) : (<span className="text-xs text-gray-400 font-medium">Somente admin pode alterar</span>)}</div></td><td className="py-4 px-2"><span className={`px-3 py-1 rounded-full text-xs font-bold ${u.status_usuario === 'ativo' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{u.status_usuario}</span></td><td className="py-4 px-2 text-right"><button onClick={() => abrirResetSenhaAdmin(u)} className="text-orange-500 hover:text-orange-600 mr-3" title="Resetar senha"><KeyRound size={17} /></button><button onClick={() => abrirEditarUsuario(u)} className="text-[#048187] hover:text-[#036b70] mr-3" title="Editar usuário"><Pencil size={17} /></button><button onClick={() => abrirExcluirUsuario(u)} className="text-red-500 hover:text-red-600" title="Excluir usuário"><Trash2 size={17} /></button></td></tr>); })}</tbody></table></div>
        )}
      </div>

      {modalResetSenhaAdminAberto && usuarioResetSenhaAdmin && (
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[520px] overflow-hidden">
            <div className="bg-[#048187] px-6 py-5 text-white flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">Resetar senha</h2>
                <p className="text-sm text-white/80 mt-1">Crie uma senha temporária para o usuário.</p>
              </div>
              <button type="button" onClick={() => setModalResetSenhaAdminAberto(false)} disabled={carregandoResetSenhaAdmin} className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center disabled:opacity-60">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={confirmarResetSenhaAdmin} className="p-6 space-y-4">
              <div className="rounded-2xl bg-[#f7fafb] border border-gray-100 p-4">
                <p className="text-[10px] uppercase font-black text-gray-400">Usuário</p>
                <p className="mt-1 font-black text-gray-700">{usuarioResetSenhaAdmin.nome}</p>
                <p className="text-xs font-bold text-gray-400">{usuarioResetSenhaAdmin.email}</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2">Senha temporária</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={novaSenhaAdmin}
                    onChange={(e) => setNovaSenhaAdmin(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-4 py-3 text-gray-700 outline-none focus:border-[#048187] focus:ring-4 focus:ring-[#048187]/10 transition-all font-black"
                    required
                  />
                  <button type="button" onClick={gerarSenhaTemporariaAdmin} className="px-4 py-3 rounded-lg bg-[#e6f6f7] text-[#048187] font-black hover:bg-[#d0f0f1]">
                    Gerar
                  </button>
                </div>
                <p className="mt-2 text-xs font-bold text-gray-400">Após salvar, copie essa senha e envie para a pessoa. Ela poderá alterar depois em Perfil.</p>
              </div>

              <button type="submit" disabled={carregandoResetSenhaAdmin} className="w-full bg-[#048187] text-white font-black py-3.5 rounded-lg hover:bg-[#036b70] disabled:opacity-60 transition-all shadow-lg shadow-[#048187]/20">
                {carregandoResetSenhaAdmin ? 'Salvando...' : 'Salvar senha temporária'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );


  const renderTelaAcoesCiclo = () => {
    const cicloAtualAcao = obterCicloReferenciaAtual();
    const estruturasDisponiveis = Array.from(new Set((opcoesFiltros.estruturas || []).filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b)));
    const estruturasFiltradas = estruturasDisponiveis.filter((estrutura) =>
      String(estrutura || '').toLowerCase().includes(String(buscaEstruturaAcao || '').toLowerCase())
    );
    const resumoAcoes = {
      total: acoesCiclo.length,
      acontecendo: acoesCiclo.filter((a) => String(a.status_final || a.status_acao || '').toLowerCase() === 'acontecendo').length,
      concluidas: acoesCiclo.filter((a) => ['concluida', 'concluída'].includes(String(a.status_final || a.status_acao || '').toLowerCase())).length,
      canceladas: acoesCiclo.filter((a) => String(a.status_final || a.status_acao || '').toLowerCase() === 'cancelada').length,
    };
    const cicloInfoAcaoForm = obterCicloPorPeriodoAcao(acaoCicloForm.data_inicio, acaoCicloForm.data_fim);

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-8">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#e6f6f7] text-[#048187] flex items-center justify-center shrink-0">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-gray-700">Ações do Ciclo</h1>
                  <p className="text-sm text-gray-400 font-semibold mt-1">
                    Crie campanhas como Dia D, viradas de ciclo, desafios de estruturas e acompanhe só o período da ação.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={carregarAcoesCiclo}
                className="border border-[#d9eff0] text-[#048187] bg-white px-5 py-3 rounded-xl font-black hover:bg-[#f4fbfb] inline-flex items-center justify-center gap-2"
              >
                <RefreshCcw size={18} /> Atualizar
              </button>
              <button
                type="button"
                onClick={abrirModalCriarAcaoCiclo}
                className="bg-[#048187] text-white px-5 py-3 rounded-xl font-black hover:bg-[#036b70] shadow-lg shadow-[#048187]/20 inline-flex items-center justify-center gap-2"
              >
                <Plus size={18} /> Criar ação
              </button>
            </div>
          </div>

          {(mensagemAcoesCiclo || erroAcoesCiclo) && (
            <div className={`mt-5 rounded-xl px-4 py-3 text-sm font-bold ${erroAcoesCiclo ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
              {erroAcoesCiclo || mensagemAcoesCiclo}
            </div>
          )}

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mt-6">
            <div className="bg-[#fbfefe] border border-gray-100 rounded-2xl p-4">
              <p className="text-[10px] uppercase font-black text-gray-400">Total de ações</p>
              <p className="text-2xl font-black text-[#048187] mt-1">{resumoAcoes.total}</p>
            </div>
            <div className="bg-[#fbfefe] border border-gray-100 rounded-2xl p-4">
              <p className="text-[10px] uppercase font-black text-gray-400">Acontecendo</p>
              <p className="text-2xl font-black text-[#048187] mt-1">{resumoAcoes.acontecendo}</p>
            </div>
            <div className="bg-[#fbfefe] border border-gray-100 rounded-2xl p-4">
              <p className="text-[10px] uppercase font-black text-gray-400">Concluídas</p>
              <p className="text-2xl font-black text-gray-600 mt-1">{resumoAcoes.concluidas}</p>
            </div>
            <div className="bg-[#fbfefe] border border-gray-100 rounded-2xl p-4">
              <p className="text-[10px] uppercase font-black text-gray-400">Canceladas</p>
              <p className="text-2xl font-black text-[#7c1f31] mt-1">{resumoAcoes.canceladas}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-gray-700">Histórico de ações</h2>
              <p className="text-xs text-gray-400 font-bold mt-1">Ciclo referência: {cicloAtualAcao || '-'}</p>
            </div>
            {carregandoAcoesCiclo && <span className="bg-[#e6f6f7] text-[#048187] px-3 py-1.5 rounded-full text-xs font-black">Carregando...</span>}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-sm">
              <thead className="bg-[#f7fafb] text-[11px] uppercase text-gray-400 font-black">
                <tr>
                  <th className="px-4 py-3 text-left">Nome da ação</th>
                  <th className="px-4 py-3 text-left">Período</th>
                  <th className="px-4 py-3 text-right">Meta</th>
                  <th className="px-4 py-3 text-right">Realizado</th>
                  <th className="px-4 py-3 text-right">% Meta</th>
                  <th className="px-4 py-3 text-center">Estruturas</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {acoesCiclo.map((acao) => {
                  const visual = statusVisualAcao(acao.status_final || acao.status_acao);
                  const percentual = Number(acao.percentual_meta || 0);
                  return (
                    <tr key={acao.id} className="border-b border-gray-50 last:border-0 hover:bg-[#fbfefe]">
                      <td className="px-4 py-4">
                        <p className="font-black text-gray-700">{acao.nome_acao}</p>
                        <p className="text-[11px] text-gray-400 font-bold mt-1">Ciclo {acao.ciclo}</p>
                      </td>
                      <td className="px-4 py-4 font-bold text-gray-600">
                        {formatarDataBR(acao.data_inicio)} até {formatarDataBR(acao.data_fim)}
                      </td>
                      <td className="px-4 py-4 text-right font-black text-[#7c1f31]">{formatarMoeda(acao.meta_valor)}</td>
                      <td className="px-4 py-4 text-right font-black text-[#048187]">{formatarMoeda(acao.realizado)}</td>
                      <td className="px-4 py-4 text-right font-black" style={{ color: corPorFaixaMeta(percentual) }}>{formatarNumeroBR(percentual, 1)}%</td>
                      <td className="px-4 py-4 text-center">
                        <span className="bg-[#e6f6f7] text-[#048187] px-3 py-1.5 rounded-full text-xs font-black">
                          {Number(acao.total_estruturas || 0)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-black ${visual.classe}`}>{visual.texto}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => carregarDetalheAcaoCiclo(acao)}
                            className="bg-[#048187] text-white px-3 py-2 rounded-lg text-xs font-black hover:bg-[#036b70] inline-flex items-center gap-1"
                          >
                            <Eye size={14} /> Ver +
                          </button>
                          <button
                            type="button"
                            onClick={() => abrirModalEditarAcaoCiclo(acao)}
                            className="bg-[#e6f6f7] text-[#048187] px-3 py-2 rounded-lg text-xs font-black hover:bg-[#d0f0f1] inline-flex items-center gap-1"
                          >
                            <Pencil size={14} /> Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => apagarAcaoCiclo(acao)}
                            className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs font-black hover:bg-red-100 inline-flex items-center gap-1"
                          >
                            <Trash2 size={14} /> Apagar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {!acoesCiclo.length && !carregandoAcoesCiclo && (
              <div className="py-12 text-center text-gray-400 font-bold">
                Nenhuma ação cadastrada ainda. Clique em “Criar ação” para começar.
              </div>
            )}
          </div>
        </div>

        {acaoCicloDetalhe && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-xl font-black text-gray-700">{acaoCicloDetalhe.nome_acao}</h2>
                <p className="text-sm text-gray-400 font-bold mt-1">
                  {formatarDataBR(acaoCicloDetalhe.data_inicio)} até {formatarDataBR(acaoCicloDetalhe.data_fim)} • {acaoCicloDetalhe.total_estruturas || 0} estruturas
                </p>
              </div>
              <button onClick={() => setAcaoCicloDetalhe(null)} className="bg-gray-100 text-gray-500 rounded-full p-2 hover:bg-gray-200"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
              <div className="rounded-2xl border border-gray-100 p-4 bg-[#fbfefe]">
                <p className="text-[10px] uppercase font-black text-gray-400">Meta da ação</p>
                <p className="text-xl font-black text-[#7c1f31] mt-1">{formatarMoeda(acaoCicloDetalhe.meta_valor)}</p>
              </div>
              <div className="rounded-2xl border border-gray-100 p-4 bg-[#fbfefe]">
                <p className="text-[10px] uppercase font-black text-gray-400">Realizado</p>
                <p className="text-xl font-black text-[#048187] mt-1">{formatarMoeda(acaoCicloDetalhe.realizado)}</p>
              </div>
              <div className="rounded-2xl border border-gray-100 p-4 bg-[#fbfefe]">
                <p className="text-[10px] uppercase font-black text-gray-400">% Meta</p>
                <p className="text-xl font-black mt-1" style={{ color: corPorFaixaMeta(acaoCicloDetalhe.percentual_meta || 0) }}>{formatarNumeroBR(acaoCicloDetalhe.percentual_meta || 0, 1)}%</p>
              </div>
              <div className="rounded-2xl border border-gray-100 p-4 bg-[#fbfefe]">
                <p className="text-[10px] uppercase font-black text-gray-400">Falta para a meta</p>
                <p className="text-xl font-black text-[#7c1f31] mt-1">{formatarMoeda(acaoCicloDetalhe.falta_meta || 0)}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-sm">
                <thead className="bg-[#f7fafb] text-[11px] uppercase text-gray-400 font-black">
                  <tr>
                    <th className="px-4 py-3 text-left">Estrutura</th>
                    <th className="px-4 py-3 text-right">Realizado</th>
                    <th className="px-4 py-3 text-right">Pedidos</th>
                    <th className="px-4 py-3 text-right">Revendedores</th>
                    <th className="px-4 py-3 text-right">Participação</th>
                  </tr>
                </thead>
                <tbody>
                  {(acaoCicloDetalhe.estruturas_apuracao || []).map((item) => (
                    <tr key={item.estrutura} className="border-b border-gray-50 last:border-0">
                      <td className="px-4 py-3 font-black text-gray-700">{item.estrutura}</td>
                      <td className="px-4 py-3 text-right font-black text-[#048187]">{formatarMoeda(item.realizado)}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-600">{Number(item.pedidos || 0).toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-600">{Number(item.revendedores || 0).toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3 text-right font-black text-gray-700">{formatarNumeroBR(item.participacao || 0, 1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {modalAcaoCicloAberto && (
          <div className="fixed inset-0 bg-black/40 z-[80] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl max-h-[92vh] overflow-hidden flex flex-col">
              <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-gray-700">{acaoCicloEditandoId ? 'Editar ação' : 'Criar ação'}</h2>
                  <p className="text-sm text-gray-400 font-bold mt-1">Defina período, estruturas participantes e meta de faturamento.</p>
                </div>
                <button onClick={() => setModalAcaoCicloAberto(false)} className="bg-gray-100 text-gray-500 rounded-full p-2 hover:bg-gray-200"><X size={18} /></button>
              </div>

              <div className="p-5 overflow-y-auto space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="xl:col-span-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Nome da ação</label>
                    <input
                      value={acaoCicloForm.nome_acao}
                      onChange={(e) => setAcaoCicloForm({ ...acaoCicloForm, nome_acao: e.target.value })}
                      placeholder="Ex.: Dia D, Virada de Ciclo, Arrancada N2"
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#048187]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Ciclo automático</label>
                    <div className={`w-full border rounded-lg px-4 py-3 text-sm font-black ${cicloInfoAcaoForm.ciclo ? 'border-[#d9eff0] bg-[#e6f6f7] text-[#048187]' : 'border-orange-100 bg-orange-50 text-orange-600'}`}>
                      {cicloInfoAcaoForm.ciclo || 'Escolha o período'}
                    </div>
                    <p className="mt-1 text-[10px] font-bold text-gray-400 leading-tight">
                      A data escolhida define o ciclo automaticamente.
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Status</label>
                    <select
                      value={acaoCicloForm.status_acao}
                      onChange={(e) => setAcaoCicloForm({ ...acaoCicloForm, status_acao: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#048187]"
                    >
                      <option value="acontecendo">Acontecendo</option>
                      <option value="concluida">Concluída</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Data início</label>
                    <input
                      type="date"
                      value={acaoCicloForm.data_inicio}
                      onChange={(e) => atualizarPeriodoAcao('data_inicio', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#048187]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Data fim</label>
                    <input
                      type="date"
                      value={acaoCicloForm.data_fim}
                      onChange={(e) => atualizarPeriodoAcao('data_fim', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#048187]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Valor da meta</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={acaoCicloForm.meta_valor}
                      onChange={(e) => setAcaoCicloForm({ ...acaoCicloForm, meta_valor: e.target.value })}
                      placeholder="Ex.: 50000"
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#048187]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Observação</label>
                    <input
                      value={acaoCicloForm.observacao}
                      onChange={(e) => setAcaoCicloForm({ ...acaoCicloForm, observacao: e.target.value })}
                      placeholder="Opcional"
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#048187]"
                    />
                  </div>
                </div>

                <div className={`rounded-2xl border px-4 py-3 text-sm font-bold ${cicloInfoAcaoForm.ciclo ? 'bg-[#f4fbfb] border-[#d9eff0] text-[#048187]' : 'bg-orange-50 border-orange-100 text-orange-600'}`}>
                  {cicloInfoAcaoForm.mensagem}
                </div>

                <div className="border border-gray-100 rounded-2xl p-4 bg-[#fbfefe]">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-black text-gray-700">Estruturas participantes</h3>
                      <p className="text-xs text-gray-400 font-bold">{acaoCicloForm.estruturas.length} selecionada(s)</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        value={buscaEstruturaAcao}
                        onChange={(e) => setBuscaEstruturaAcao(e.target.value)}
                        placeholder="Buscar estrutura..."
                        className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-[#048187]"
                      />
                      <button type="button" onClick={() => selecionarTodasEstruturasAcao(estruturasDisponiveis)} className="bg-[#e6f6f7] text-[#048187] rounded-lg px-3 py-2.5 text-xs font-black">Selecionar todas</button>
                      <button type="button" onClick={() => setAcaoCicloForm({ ...acaoCicloForm, estruturas: [] })} className="bg-red-50 text-red-600 rounded-lg px-3 py-2.5 text-xs font-black">Limpar</button>
                    </div>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#ccecee transparent' }}>
                    {estruturasFiltradas.map((estrutura) => {
                      const marcada = acaoCicloForm.estruturas.includes(estrutura);
                      return (
                        <button
                          key={estrutura}
                          type="button"
                          onClick={() => alternarEstruturaAcao(estrutura)}
                          className={`text-left rounded-xl border px-3 py-2.5 text-xs font-black transition-colors ${marcada ? 'bg-[#e6f6f7] border-[#5bb2b4] text-[#048187]' : 'bg-white border-gray-100 text-gray-600 hover:border-[#5bb2b4]'}`}
                          title={estrutura}
                        >
                          <span className="inline-flex items-center gap-2 min-w-0">
                            <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${marcada ? 'bg-[#048187] border-[#048187] text-white' : 'border-gray-300'}`}>
                              {marcada ? '✓' : ''}
                            </span>
                            <span className="truncate">{estrutura}</span>
                          </span>
                        </button>
                      );
                    })}
                    {!estruturasFiltradas.length && (
                      <div className="col-span-full py-8 text-center text-gray-400 font-bold">
                        Nenhuma estrutura encontrada.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-gray-100 bg-white flex flex-col sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalAcaoCicloAberto(false)}
                  className="border border-gray-200 text-gray-500 px-5 py-3 rounded-xl font-black hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={carregandoAcoesCiclo}
                  onClick={salvarAcaoCiclo}
                  className="bg-[#048187] text-white px-5 py-3 rounded-xl font-black hover:bg-[#036b70] disabled:opacity-60 inline-flex items-center justify-center gap-2"
                >
                  <Save size={18} /> {carregandoAcoesCiclo ? 'Salvando...' : 'Salvar ação'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };


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
      { id: 'metas', label: 'Metas salvas', total: metas.length },
      { id: 'lancar', label: 'Lançar ciclo', total: 0 }
    ];


    const obterNumeroLinhaMeta = (valor, fallback = 0) => {
      const numero = Number(valor);
      if (Number.isFinite(numero)) return numero;
      const numeroFallback = Number(fallback);
      return Number.isFinite(numeroFallback) ? numeroFallback : 0;
    };

    const calcularIndicadoresLinhaEstrutura = (item) => {
      const receitaMeta = obterNumeroLinhaMeta(item?.receita, 0);
      const receitaRealizada = obterNumeroLinhaMeta(item?.realizado, 0);
      const percentualReceita = obterNumeroLinhaMeta(item?.percentual, calcPerc(receitaRealizada, receitaMeta));

      const atividadeRealizada = obterNumeroLinhaMeta(item?.atividade_realizada, 0);
      const baseAtiva = obterNumeroLinhaMeta(item?.base_ativa, 0);
      const metaAtividadePercentual = obterNumeroLinhaMeta(item?.meta_atividade, dadosMetas?.meta_atividade_geral || 0);
      const metaAtividadeQtd = calcularQtdMetaAtividade(baseAtiva, metaAtividadePercentual);
      const percentualAtividade = obterNumeroLinhaMeta(item?.percentual_atividade, calcularPercentualSeguro(atividadeRealizada, baseAtiva));

      const rpaMeta = obterNumeroLinhaMeta(item?.meta_rpa, dadosMetas?.meta_rpa_geral || 0);
      const rpaRealizado = atividadeRealizada > 0 ? receitaRealizada / atividadeRealizada : 0;

      const pedidos = obterNumeroLinhaMeta(item?.quantidade_pedidos, 0);
      const ticketMeta = obterNumeroLinhaMeta(item?.meta_tkt_medio, dadosMetas?.meta_tkt_medio_geral || 0);
      const ticketRealizado = pedidos > 0 ? receitaRealizada / pedidos : 0;

      const totalItens = obterNumeroLinhaMeta(item?.total_itens, 0);
      const upaMeta = obterNumeroLinhaMeta(item?.meta_upa, dadosMetas?.meta_upa_geral || 0);
      const upaRealizada = atividadeRealizada > 0 ? totalItens / atividadeRealizada : 0;

      const metaMakePercentual = obterNumeroLinhaMeta(item?.meta_make, dadosMetas?.meta_make_geral || 0);
      const makeRealizado = obterNumeroLinhaMeta(item?.make_realizado, 0);
      const makeMetaQtd = metaMakePercentual > 0 && atividadeRealizada > 0 ? Math.ceil((atividadeRealizada * metaMakePercentual) / 100) : 0;
      const percentualMake = obterNumeroLinhaMeta(item?.percentual_make, calcularPercentualSeguro(makeRealizado, atividadeRealizada));

      const metaCabeloPercentual = obterNumeroLinhaMeta(item?.meta_cabelo, dadosMetas?.meta_cabelo_geral || 0);
      const cabeloRealizado = obterNumeroLinhaMeta(item?.cabelo_realizado, 0);
      const cabeloMetaQtd = metaCabeloPercentual > 0 && atividadeRealizada > 0 ? Math.ceil((atividadeRealizada * metaCabeloPercentual) / 100) : 0;
      const percentualCabelo = obterNumeroLinhaMeta(item?.percentual_cabelo, calcularPercentualSeguro(cabeloRealizado, atividadeRealizada));

      return {
        receitaMeta,
        receitaRealizada,
        percentualReceita,
        atividadeRealizada,
        baseAtiva,
        metaAtividadePercentual,
        metaAtividadeQtd,
        percentualAtividade,
        rpaMeta,
        rpaRealizado,
        ticketMeta,
        ticketRealizado,
        upaMeta,
        upaRealizada,
        metaMakePercentual,
        makeMetaQtd,
        makeRealizado,
        percentualMake,
        metaCabeloPercentual,
        cabeloMetaQtd,
        cabeloRealizado,
        percentualCabelo
      };
    };

    const calcularPercentualSeguro = (realizado, meta) => {
      const m = Number(meta || 0);
      if (!m || m <= 0) return 0;
      return (Number(realizado || 0) / m) * 100;
    };

    const CelulaValorPrincipalMeta = ({ titulo, valor, tipo = 'meta', percentual = null }) => {
      const corValor = tipo === 'meta' ? '#7c1f31' : '#048187';
      return (
        <div className="h-full min-h-[104px] bg-white px-4 py-3 flex flex-col justify-center border-l border-gray-100">
          <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">{titulo}</p>
          <p className="mt-2 text-lg font-black whitespace-nowrap" style={{ color: corValor }}>{valor}</p>
          {percentual !== null && (
            <span className="mt-2 w-fit rounded-full px-2 py-1 text-[11px] font-black bg-[#e6f6f7] text-[#048187]">
              {percentual}
            </span>
          )}
        </div>
      );
    };

    const CelulaIndicadorMetaRealizado = ({ titulo, meta, realizado, percentualMeta = null, percentualRealizado = null, percentualAtingimento = 0, compacto = false }) => {
      const cor = corPorFaixaMeta(percentualAtingimento);
      return (
        <div className="h-full min-h-[104px] bg-white px-3 py-3 border-l border-gray-100 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full" style={{ backgroundColor: cor }} />
          <p className="text-[10px] font-black uppercase tracking-wide text-gray-400 pl-2">{titulo}</p>
          <div className="mt-2 pl-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[9px] font-black uppercase text-gray-400">Meta</span>
              {percentualMeta && <span className="text-[10px] font-black text-[#7c1f31]">{percentualMeta}</span>}
            </div>
            <p className={`${compacto ? 'text-sm' : 'text-[15px]'} font-black text-[#7c1f31] whitespace-nowrap`}>{meta}</p>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 pl-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[9px] font-black uppercase text-gray-400">Realizado</span>
              {percentualRealizado && <span className="text-[10px] font-black" style={{ color: cor }}>{percentualRealizado}</span>}
            </div>
            <p className={`${compacto ? 'text-sm' : 'text-[15px]'} font-black text-[#048187] whitespace-nowrap`}>{realizado}</p>
          </div>
        </div>
      );
    };

    const ColunaEstruturaMetaRealizado = ({ item }) => {
      const estruturasVinculadas = Array.isArray(item?.estruturas_vinculadas) ? item.estruturas_vinculadas : [];
      return (
        <div className="h-full min-h-[104px] bg-gradient-to-br from-[#f3fbfb] via-white to-[#e6f6f7] px-4 py-4 flex items-center gap-3 rounded-l-3xl border-r border-gray-100">
          <div className="w-10 h-10 rounded-2xl bg-[#d9f0f1] text-[#048187] flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">Estrutura</p>
            <p className="text-sm font-black text-gray-800 leading-tight truncate">{item?.estrutura}</p>
            {estruturasVinculadas.length > 1 && (
              <span className="mt-2 inline-flex rounded-full bg-[#e6f6f7] px-2 py-1 text-[10px] font-black text-[#048187]">
                {estruturasVinculadas.length} estruturas vinculadas
              </span>
            )}
          </div>
        </div>
      );
    };

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
              <button onClick={() => setVisaoHistorico('lancar')} disabled={carregandoHistorico} className="bg-[#fff7ed] text-[#ff6f03] font-black rounded-lg px-4 py-3 inline-flex items-center justify-center gap-2 disabled:opacity-60"><Upload size={18} /> Lançar ciclo</button>
              <button onClick={() => carregarHistoricoCiclo()} disabled={!cicloHistoricoSelecionado || carregandoHistorico} className="bg-[#e6f6f7] text-[#048187] font-black rounded-lg px-4 py-3 inline-flex items-center justify-center gap-2 disabled:opacity-60"><RefreshCcw size={18} /> Atualizar</button>
              <button onClick={reprocessarCicloHistorico} disabled={!cicloHistoricoSelecionado || carregandoHistorico} className="bg-[#048187] hover:bg-[#036b70] text-white font-black rounded-lg px-4 py-3 inline-flex items-center justify-center gap-2 disabled:opacity-60"><RefreshCcw size={18} /> Reprocessar</button>
            </div>
          </div>
        </div>

        {(erroHistorico || mensagemHistorico) && (
          <div className={`rounded-xl px-4 py-3 text-sm font-bold border ${erroHistorico ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>{erroHistorico || mensagemHistorico}</div>
        )}

        {visaoHistorico === 'lancar' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
            <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4 mb-5">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-gray-700">Lançar ciclo histórico</h2>
                <p className="text-sm text-gray-400 font-semibold max-w-3xl mt-1">Use para carregar ciclos antigos. Para ciclos 08 para trás, envie pelo menos Pedidos. Base Ativa, MAKE, CABELO, Consultores e Metas deixam os indicadores completos.</p>
              </div>
              <button type="button" onClick={salvarSnapshotAtualHistorico} disabled={carregandoHistorico} className="bg-[#048187] hover:bg-[#036b70] text-white px-4 py-3 rounded-xl font-black text-xs inline-flex items-center justify-center gap-2 disabled:opacity-60">
                <Save size={17} /> Salvar snapshot do ciclo vigente
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Ciclo</label>
                <input value={lancamentoHistorico.ciclo} onChange={(e) => setLancamentoHistorico({ ...lancamentoHistorico, ciclo: e.target.value })} placeholder="Ex.: 08/2026" className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#048187]" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Data início opcional</label>
                <input type="date" value={lancamentoHistorico.data_inicio} onChange={(e) => setLancamentoHistorico({ ...lancamentoHistorico, data_inicio: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#048187]" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Data fim opcional</label>
                <input type="date" value={lancamentoHistorico.data_fim} onChange={(e) => setLancamentoHistorico({ ...lancamentoHistorico, data_fim: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#048187]" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Observação</label>
                <input value={lancamentoHistorico.observacao} onChange={(e) => setLancamentoHistorico({ ...lancamentoHistorico, observacao: e.target.value })} placeholder="Ex.: Histórico C08" className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#048187]" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {[
                { campo: 'pedidos', titulo: 'Pedidos', obrigatorio: true, mult: false },
                { campo: 'base_ativa', titulo: 'Base Ativa', obrigatorio: false, mult: false },
                { campo: 'metas', titulo: 'Metas Estruturas', obrigatorio: false, mult: false },
                { campo: 'consultores', titulo: 'Consultores', obrigatorio: false, mult: false },
                { campo: 'make', titulo: 'MAKE', obrigatorio: false, mult: true },
                { campo: 'cabelo', titulo: 'CABELO', obrigatorio: false, mult: true }
              ].map((item) => {
                const valor = lancamentoHistorico[item.campo];
                const qtd = item.mult ? (valor || []).length : (valor ? 1 : 0);
                return (
                  <label key={item.campo} className="border border-gray-100 rounded-xl p-4 bg-[#fbfdfd] hover:bg-white transition-colors cursor-pointer">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div>
                        <p className="text-sm font-black text-gray-700">{item.titulo}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">{item.obrigatorio ? 'Obrigatório' : 'Opcional'} {item.mult ? '• múltiplos arquivos' : ''}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-black ${qtd ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>{qtd ? `${qtd} arquivo(s)` : 'pendente'}</span>
                    </div>
                    <input type="file" accept=".xlsx,.xls,.csv" multiple={item.mult} onChange={(e) => selecionarArquivoLancamentoHistorico(item.campo, e.target.files, item.mult)} className="block w-full text-xs text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-[#e6f6f7] file:px-3 file:py-2 file:text-[#048187] file:font-black" />
                  </label>
                );
              })}
            </div>

            <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-end">
              <button type="button" onClick={() => setVisaoHistorico('estruturas')} className="bg-gray-50 text-gray-500 px-5 py-3 rounded-xl font-black text-xs">Voltar</button>
              <button type="button" onClick={processarLancamentoHistorico} disabled={carregandoHistorico} className="bg-[#ff6f03] hover:bg-[#e86605] text-white px-5 py-3 rounded-xl font-black text-xs inline-flex items-center justify-center gap-2 disabled:opacity-60">
                <Upload size={17} /> Processar e lançar ciclo
              </button>
            </div>
          </div>
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
                    <button key={aba.id} onClick={() => setVisaoHistorico(aba.id)} className={`px-3 py-2 rounded-lg text-xs font-black transition-colors ${visaoHistorico === aba.id ? 'bg-[#048187] text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>{aba.id === 'lancar' ? aba.label : `${aba.label} (${aba.total})`}</button>
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
    const resumo = dadosLoja?.resumo || {};
    const unidades = dadosLoja?.unidades || [];
    const consultoras = dadosLoja?.consultoras || [];
    const cicloAtualLoja = cicloLojaSelecionado();
    const abaLoja = telaAtual === 'LojaCadastro' ? 'cadastro' : telaAtual === 'LojaRanking' ? 'ranking' : 'geral';
    const busca = String(buscaLoja || '').toLowerCase();
    const filtroUnidadeLoja = String(filtrosLoja?.unidade || '');
    const filtroConsultoraLoja = String(filtrosLoja?.consultora || '');
    const unidadesFiltradas = unidades.filter((u) => {
      const texto = `${u.codigo_pdv} ${u.cidade} ${u.nome_loja}`.toLowerCase();
      const okBusca = !busca || texto.includes(busca);
      const okUnidade = !filtroUnidadeLoja || String(u.codigo_pdv) === filtroUnidadeLoja;
      return okBusca && okUnidade;
    });
    const consultorasFiltradas = consultoras.filter((c) => {
      const texto = `${c.id_consultora} ${c.nome_consultora} ${c.codigo_pdv_oficial}`.toLowerCase();
      const okBusca = !busca || texto.includes(busca);
      const okUnidade = !filtroUnidadeLoja || String(c.codigo_pdv_oficial) === filtroUnidadeLoja;
      const okConsultora = !filtroConsultoraLoja || String(c.id_consultora) === filtroConsultoraLoja;
      return okBusca && okUnidade && okConsultora;
    });

    const opcoesUnidadesLoja = unidades
      .map((u) => ({ codigo: String(u.codigo_pdv || ''), label: `${u.codigo_pdv} - ${u.cidade || u.nome_loja || ''}`.trim() }))
      .filter((u) => u.codigo);
    const opcoesConsultorasLoja = consultoras
      .map((c) => ({ id: String(c.id_consultora || ''), label: `${c.id_consultora} - ${c.nome_consultora || ''}`.trim() }))
      .filter((c) => c.id);

    const corPorValorLoja = (valor, meta) => corPorFaixaMeta(calcPerc(valor, meta));
    const rankingUnidades = [...unidadesFiltradas].sort((a, b) => Number(b.percentual || 0) - Number(a.percentual || 0));
    const rankingConsultoras = [...consultorasFiltradas].sort((a, b) => Number(b.percentual || 0) - Number(a.percentual || 0));

    const mediaValoresLoja = (lista = [], campo = '') => {
      const valores = lista
        .map((item) => Number(item?.[campo] || 0))
        .filter((valor) => Number.isFinite(valor) && valor > 0);
      if (!valores.length) return 0;
      return valores.reduce((acc, valor) => acc + valor, 0) / valores.length;
    };

    const construirResumoCardsLoja = (lista = [], origem = 'unidades') => {
      const itens = Array.isArray(lista) ? lista : [];
      const faturamento = itens.reduce((acc, item) => acc + Number(item?.realizado || 0), 0);
      const metaFaturamento = itens.reduce((acc, item) => acc + Number(item?.meta_faturamento || 0), 0);
      const skinRealizado = itens.reduce((acc, item) => acc + Number(item?.realizado_skin || 0), 0);
      const metaSkin = itens.reduce((acc, item) => acc + Number(item?.meta_skin || 0), 0);
      const pedidos = itens.reduce((acc, item) => acc + Number(item?.qtd_boletos || item?.pedidos || 0), 0);
      const somaItensPonderados = itens.reduce((acc, item) => acc + (Number(item?.itens_por_boleto || 0) * Number(item?.qtd_boletos || item?.pedidos || 0)), 0);
      const boletoMedio = pedidos > 0 ? faturamento / pedidos : mediaValoresLoja(itens, 'boleto_medio');
      const itensPorBoleto = pedidos > 0 ? somaItensPonderados / pedidos : mediaValoresLoja(itens, 'itens_por_boleto');
      const metaBoletoMedio = mediaValoresLoja(itens, 'meta_boleto_medio') || Number(resumo.meta_boleto_medio || 0);
      const metaItensBoleto = mediaValoresLoja(itens, 'meta_itens_boleto') || Number(resumo.meta_itens_boleto || 4);
      const diasPassados = Math.max(Number(resumo.dias_passados || 0), 0);
      const diasTotal = Math.max(Number(resumo.dias_total || 0), 0);
      const tendencia = diasPassados > 0 && diasTotal > 0
        ? (faturamento / diasPassados) * diasTotal
        : (Number(resumo.faturamento_realizado || 0) > 0 ? (Number(resumo.tendencia || 0) * faturamento) / Number(resumo.faturamento_realizado || 1) : faturamento);
      const metaDiaria = Number(resumo.dias_restantes || 0) > 0
        ? Math.max(metaFaturamento - faturamento, 0) / Number(resumo.dias_restantes || 1)
        : 0;

      return {
        ...resumo,
        origem_filtro: origem,
        faturamento_realizado: faturamento,
        meta_faturamento: metaFaturamento,
        deficit_faturamento: Math.max(metaFaturamento - faturamento, 0),
        percentual_faturamento: calcPerc(faturamento, metaFaturamento),
        tendencia,
        gap_tendencia: tendencia - metaFaturamento,
        realizado_diario: 0,
        meta_diaria: metaDiaria,
        skin_realizado: skinRealizado,
        meta_skin: metaSkin,
        percentual_skin: calcPerc(skinRealizado, metaSkin),
        boleto_medio: boletoMedio,
        meta_boleto_medio: metaBoletoMedio,
        itens_por_boleto: itensPorBoleto,
        meta_itens_boleto: metaItensBoleto,
        pedidos,
        ultima_atualizacao: resumo.ultima_atualizacao
      };
    };

    const temFiltroCardsLoja = Boolean(busca || filtroUnidadeLoja || filtroConsultoraLoja);
    const resumoCardsLoja = !temFiltroCardsLoja
      ? resumo
      : filtroConsultoraLoja
        ? construirResumoCardsLoja(consultorasFiltradas, 'consultora')
        : construirResumoCardsLoja(unidadesFiltradas, 'unidade');

    const formatarDataHoraLoja = (valor) => {
      if (!valor) return 'Sem atualização';
      try { return new Date(valor).toLocaleString('pt-BR'); } catch (_) { return valor; }
    };

    const abrirDetalheCardLoja = (titulo, linhas = [], formula = '') => {
      abrirModalValExp(
        titulo,
        linhas?.[0]?.valor || '-',
        'Detalhamento do indicador da LOJA.',
        linhas,
        formula
      );
    };

    const CardLoja = ({ titulo, valor, meta, percentual, subtitulo, icone: Icone, onDetalhes }) => {
      const cor = corPorFaixaMeta(percentual || 0);
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 min-w-0 transition-all hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wide text-gray-400 truncate">{titulo}</p>
              <p className="text-lg sm:text-xl 2xl:text-2xl font-black mt-2 whitespace-nowrap" style={{ color: cor }}>{valor}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onDetalhes && (
                <button
                  type="button"
                  onClick={onDetalhes}
                  className="w-8 h-8 rounded-xl bg-[#e6f6f7] text-[#048187] hover:bg-[#d0f0f1] flex items-center justify-center"
                  title={`Ver detalhes de ${titulo}`}
                >
                  <Eye size={15} />
                </button>
              )}
              {Icone && <div className="w-9 h-9 rounded-xl bg-[#e6f6f7] text-[#048187] flex items-center justify-center"><Icone size={18} /></div>}
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between gap-2 text-[10px] font-bold">
              <span style={{ color: cor }}>{formatarNumeroBR(percentual || 0, 1)}% da meta</span>
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

    const TabelaUnidades = ({ lista = unidadesFiltradas }) => (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1420px] text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase text-gray-400 border-b border-gray-100 font-black">
              <th className="py-3 px-3">PDV</th>
              <th className="py-3 px-3">Cidade/Loja</th>
              <th className="py-3 px-3 text-right">Meta ciclo</th>
              <th className="py-3 px-3 text-right">Realizado no PDV</th>
              <th className="py-3 px-3 text-right">Déficit</th>
              <th className="py-3 px-3 text-right">%</th>
              <th className="py-3 px-3 text-right">Boleto médio</th>
              <th className="py-3 px-3 text-right">% Boleto</th>
              <th className="py-3 px-3 text-right">Itens/Boleto</th>
              <th className="py-3 px-3 text-right">% Itens</th>
              <th className="py-3 px-3 text-right">Skin</th>
              <th className="py-3 px-3 text-right">% Skin</th>
              <th className="py-3 px-3 text-right">Serviços</th>
              <th className="py-3 px-3 text-right">% Serv.</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((u) => (
              <tr key={u.codigo_pdv} className="border-b border-gray-50 last:border-0 hover:bg-[#f7fafb]">
                <td className="py-3 px-3 font-black text-gray-700">{u.codigo_pdv}</td>
                <td className="py-3 px-3">
                  <p className="font-black text-gray-700 truncate max-w-[260px]">{u.cidade || '-'}</p>
                  <p className="text-[10px] text-gray-400 font-bold truncate max-w-[260px]">{u.nome_loja || '-'}</p>
                </td>
                <td className="py-3 px-3 text-right font-bold text-gray-600">{formatarMoeda(u.meta_faturamento)}</td>
                <td className="py-3 px-3 text-right font-black text-[#048187]">{formatarMoeda(u.realizado)}</td>
                <td className="py-3 px-3 text-right font-black text-[#7c1f31]">{formatarMoeda(u.deficit)}</td>
                <td className="py-3 px-3 text-right font-black" style={{ color: corPorFaixaMeta(u.percentual) }}>{formatarNumeroBR(u.percentual, 1)}%</td>
                <td className="py-3 px-3 text-right font-bold">{formatarMoeda(u.boleto_medio)}</td>
                <td className="py-3 px-3 text-right font-black" style={{ color: corPorFaixaMeta(calcPerc(u.boleto_medio || 0, u.meta_boleto_medio || 0)) }}>{formatarNumeroBR(calcPerc(u.boleto_medio || 0, u.meta_boleto_medio || 0), 1)}%</td>
                <td className="py-3 px-3 text-right font-bold">{formatarNumeroBR(u.itens_por_boleto, 2)}</td>
                <td className="py-3 px-3 text-right font-black" style={{ color: corPorFaixaMeta(calcPerc(u.itens_por_boleto || 0, u.meta_itens_boleto || 0)) }}>{formatarNumeroBR(calcPerc(u.itens_por_boleto || 0, u.meta_itens_boleto || 0), 1)}%</td>
                <td className="py-3 px-3 text-right font-bold text-[#048187]">{formatarMoeda(u.realizado_skin || 0)}</td>
                <td className="py-3 px-3 text-right font-black" style={{ color: corPorFaixaMeta(calcPerc(u.realizado_skin || 0, u.meta_skin || 0)) }}>{formatarNumeroBR(calcPerc(u.realizado_skin || 0, u.meta_skin || 0), 1)}%</td>
                <td className="py-3 px-3 text-right font-bold text-gray-600">{formatarNumeroBR(u.realizado_servicos_mes, 0)} / {formatarNumeroBR(u.meta_servicos_mes, 0)}</td>
                <td className="py-3 px-3 text-right font-black" style={{ color: corPorFaixaMeta(calcPerc(u.realizado_servicos_mes || 0, u.meta_servicos_mes || 0)) }}>{formatarNumeroBR(calcPerc(u.realizado_servicos_mes || 0, u.meta_servicos_mes || 0), 1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!lista.length && <div className="p-8 text-center text-gray-400 font-bold">Nenhuma unidade encontrada.</div>}
      </div>
    );

    const TabelaConsultoras = ({ lista = consultorasFiltradas }) => (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1450px] text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase text-gray-400 border-b border-gray-100 font-black">
              <th className="py-3 px-3">ID</th>
              <th className="py-3 px-3">Consultora</th>
              <th className="py-3 px-3">PDV oficial</th>
              <th className="py-3 px-3 text-right">Meta</th>
              <th className="py-3 px-3 text-right">Realizado consultora</th>
              <th className="py-3 px-3 text-right">Déficit</th>
              <th className="py-3 px-3 text-right">%</th>
              <th className="py-3 px-3 text-right">Boletos</th>
              <th className="py-3 px-3 text-right">Boleto médio</th>
              <th className="py-3 px-3 text-right">% Boleto</th>
              <th className="py-3 px-3 text-right">Itens/Boleto</th>
              <th className="py-3 px-3 text-right">% Itens</th>
              <th className="py-3 px-3 text-right">Skin</th>
              <th className="py-3 px-3 text-right">% Skin</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((c) => (
              <tr key={c.id_consultora} className="border-b border-gray-50 last:border-0 hover:bg-[#f7fafb]">
                <td className="py-3 px-3 font-black text-[#048187]">{c.id_consultora}</td>
                <td className="py-3 px-3">
                  <p className="font-black text-gray-700 truncate max-w-[280px]">{c.nome_consultora}</p>
                  <p className="text-[10px] text-gray-400 font-bold">Soma todos os PDVs vendidos.</p>
                </td>
                <td className="py-3 px-3 font-bold text-gray-500">{c.codigo_pdv_oficial || '-'}</td>
                <td className="py-3 px-3 text-right font-bold text-gray-600">{formatarMoeda(c.meta_faturamento)}</td>
                <td className="py-3 px-3 text-right font-black text-[#048187]">{formatarMoeda(c.realizado)}</td>
                <td className="py-3 px-3 text-right font-black text-[#7c1f31]">{formatarMoeda(c.deficit)}</td>
                <td className="py-3 px-3 text-right font-black" style={{ color: corPorFaixaMeta(c.percentual) }}>{formatarNumeroBR(c.percentual, 1)}%</td>
                <td className="py-3 px-3 text-right font-bold">{formatarNumeroBR(c.qtd_boletos, 0)}</td>
                <td className="py-3 px-3 text-right font-bold">{formatarMoeda(c.boleto_medio)}</td>
                <td className="py-3 px-3 text-right font-black" style={{ color: corPorFaixaMeta(calcPerc(c.boleto_medio || 0, c.meta_boleto_medio || 0)) }}>{formatarNumeroBR(calcPerc(c.boleto_medio || 0, c.meta_boleto_medio || 0), 1)}%</td>
                <td className="py-3 px-3 text-right font-bold">{formatarNumeroBR(c.itens_por_boleto, 2)}</td>
                <td className="py-3 px-3 text-right font-black" style={{ color: corPorFaixaMeta(calcPerc(c.itens_por_boleto || 0, c.meta_itens_boleto || 0)) }}>{formatarNumeroBR(calcPerc(c.itens_por_boleto || 0, c.meta_itens_boleto || 0), 1)}%</td>
                <td className="py-3 px-3 text-right font-bold text-[#048187]">{formatarMoeda(c.realizado_skin || 0)}</td>
                <td className="py-3 px-3 text-right font-black" style={{ color: corPorFaixaMeta(calcPerc(c.realizado_skin || 0, c.meta_skin || 0)) }}>{formatarNumeroBR(calcPerc(c.realizado_skin || 0, c.meta_skin || 0), 1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!lista.length && <div className="p-8 text-center text-gray-400 font-bold">Nenhuma consultora encontrada.</div>}
      </div>
    );

    const BlocoTabelaLoja = ({ titulo, subtitulo, tipo, children }) => (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 min-w-0">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-black text-gray-700">{titulo}</h2>
            {subtitulo && <p className="text-xs text-gray-400 font-bold mt-1">{subtitulo}</p>}
          </div>
          <button
            type="button"
            onClick={() => setTabelaLojaExpandida(tipo)}
            className="w-9 h-9 rounded-xl bg-[#e6f6f7] text-[#048187] hover:bg-[#d0f0f1] flex items-center justify-center shrink-0"
            title="Expandir resultados"
          >
            <Maximize2 size={17} />
          </button>
        </div>
        {children}
      </div>
    );



    const LojaHeader = () => (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-700">Visão Geral LOJA</h1>
            <p className="text-sm text-gray-400 font-bold mt-1">Acompanhamento por PDV e consultora.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={cicloLoja || resumo.ciclo || ''}
              onChange={(e) => { setCicloLoja(e.target.value); carregarDadosLoja(e.target.value); }}
              className="border border-gray-200 rounded-lg px-4 py-2 font-black text-gray-700 outline-none focus:border-[#048187] bg-white"
            >
              <option value="">Ciclo ativo</option>
              {ciclos.map((c) => <option key={c.id || c.ciclo} value={c.ciclo}>{c.ciclo}</option>)}
            </select>
            <button onClick={() => carregarDadosLoja()} disabled={carregandoLoja} className="bg-[#048187] text-white px-4 py-2 rounded-lg font-black hover:bg-[#036b70] disabled:opacity-60 inline-flex items-center gap-2"><RefreshCcw size={16} /> Atualizar</button>
          </div>
        </div>
      </div>
    );

    const AvisosLoja = () => (
      <>
        {erroLoja && <div className="rounded-xl border border-red-100 bg-red-50 text-red-700 px-4 py-3 font-bold text-sm">{erroLoja}</div>}
        {mensagemLoja && <div className="rounded-xl border border-green-100 bg-green-50 text-green-700 px-4 py-3 font-bold text-sm">{mensagemLoja}</div>}
      </>
    );

    const ModuloUploadLoja = ({ titulo, descricao, tipo, endpoint, usaCiclo = false, substituir = false, aceitar = '.csv,.xlsx,.xls', permiteSgi = false }) => (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-black text-gray-700">{titulo}</h2>
            <p className="text-sm text-gray-400 font-semibold mt-1 leading-relaxed">{descricao}</p>
          </div>
          <div className="w-11 h-11 rounded-full bg-[#e6f6f7] text-[#048187] flex items-center justify-center shrink-0"><Upload size={20} /></div>
        </div>

        <div className="rounded-2xl border border-dashed border-[#048187]/25 bg-[#fbfcfd] p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row gap-3">
            <label className="flex-1 border border-gray-200 rounded-lg px-4 py-3 bg-white text-gray-500 font-bold cursor-pointer hover:border-[#048187]/40 truncate">
              <input
                type="file"
                accept={aceitar}
                className="hidden"
                onChange={(e) => selecionarArquivoLojaUpload(tipo, e.target.files?.[0] || null)}
              />
              {arquivosLojaUpload?.[tipo]?.name || 'Escolher arquivo'}
            </label>

            <button
              type="button"
              disabled={carregandoLoja || !arquivosLojaUpload?.[tipo]}
              onClick={() => importarBaseLojaUpload(tipo, endpoint, titulo, { usaCiclo, substituir })}
              className="bg-[#048187] text-white px-5 py-3 rounded-lg font-black hover:bg-[#036b70] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Importar
            </button>
          </div>

          {permiteSgi && (
            <button
              type="button"
              disabled={carregandoLoja || sgiLojaExecutando}
              onClick={abrirModalAtualizacaoLojaSgi}
              className="mt-3 w-full bg-[#e6f6f7] text-[#048187] px-5 py-3 rounded-lg font-black hover:bg-[#d0f0f1] disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              <RefreshCcw size={17} />
              {sgiLojaExecutando ? 'Atualizando via SGI...' : 'Atualizar via SGI'}
            </button>
          )}

          {usaCiclo && <p className="text-xs text-gray-400 font-bold mt-3">Ciclo usado no upload: {cicloAtualLoja || '-'}</p>}
          {permiteSgi && <p className="text-[11px] text-gray-400 font-bold mt-2">Baixa o acumulado do ciclo e a venda diária, envia ao banco, apaga os CSVs e fecha a aba do SGI.</p>}
        </div>
      </div>
    );

    const CabecalhoSubCadastroLoja = ({ titulo, descricao }) => (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-8">
        <button
          type="button"
          onClick={() => setVisaoCadastroLoja('geral')}
          className="mb-4 inline-flex items-center gap-2 text-[#048187] font-black text-sm bg-[#e6f6f7] hover:bg-[#d0f0f1] rounded-lg px-4 py-2"
        >
          <ChevronLeft size={18} /> Voltar
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-700 mb-2">{titulo}</h1>
        <p className="text-sm text-gray-400 font-semibold">{descricao}</p>
      </div>
    );

    const ModalAtualizacaoSgiLoja = () => {
      if (!modalSgiLojaAberto) return null;

      return (
        <div className="fixed inset-0 z-[9999] bg-black/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-gray-100 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wide text-[#048187] mb-1">Atualização automática</p>
                <h2 className="text-xl font-black text-gray-700">Atualizar vendas LOJA via SGI</h2>
                <p className="text-sm text-gray-400 font-semibold mt-1 leading-relaxed">
                  Informe suas credenciais do SGI. Elas não serão salvas; serão usadas apenas nesta execução.
                </p>
              </div>
              <button
                type="button"
                disabled={sgiLojaExecutando}
                onClick={() => setModalSgiLojaAberto(false)}
                className="w-9 h-9 rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 flex items-center justify-center disabled:opacity-40"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={iniciarAtualizacaoLojaViaSgi} className="p-5 sm:p-6 space-y-4">
              <div className="rounded-xl bg-[#e6f6f7] border border-[#048187]/15 px-4 py-3 text-xs font-bold text-[#036b70] leading-relaxed">
                A automação vai baixar duas bases: acumulado do ciclo e venda diária. Depois vai enviar ao backend, apagar os arquivos baixados e fechar a aba do SGI.
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wide text-gray-400 mb-1.5">Usuário SGI</label>
                <input
                  ref={sgiLojaUsuarioRef}
                  type="text"
                  autoComplete="username"
                  defaultValue=""
                  disabled={sgiLojaExecutando}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-700 outline-none focus:border-[#048187] focus:ring-4 focus:ring-[#048187]/10 font-bold"
                  placeholder="Digite seu usuário do SGI"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wide text-gray-400 mb-1.5">Senha SGI</label>
                <input
                  ref={sgiLojaSenhaRef}
                  type="password"
                  autoComplete="current-password"
                  defaultValue=""
                  disabled={sgiLojaExecutando}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-700 outline-none focus:border-[#048187] focus:ring-4 focus:ring-[#048187]/10 font-bold"
                  placeholder="Digite sua senha do SGI"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold text-gray-500">
                <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                  <span className="block text-gray-400 uppercase text-[9px] mb-1">Ciclo</span>
                  {cicloAtualLoja || '-'}
                </div>
                <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                  <span className="block text-gray-400 uppercase text-[9px] mb-1">Destino</span>
                  Geral + diária
                </div>
              </div>

              {statusSgiLoja && (
                <div className={`rounded-xl px-4 py-3 text-xs font-bold leading-relaxed ${statusSgiLoja.toLowerCase().includes('erro') || statusSgiLoja.toLowerCase().includes('falh') ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                  {statusSgiLoja}
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={sgiLojaExecutando}
                  onClick={() => setModalSgiLojaAberto(false)}
                  className="border border-gray-200 text-gray-600 font-black px-5 py-3 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={sgiLojaExecutando}
                  className="bg-[#048187] text-white font-black px-5 py-3 rounded-lg hover:bg-[#036b70] disabled:opacity-60 inline-flex items-center justify-center gap-2"
                >
                  <RefreshCcw size={17} />
                  {sgiLojaExecutando ? 'Executando...' : 'Iniciar atualização'}
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    };

    const CadastroLoja = () => {
      const modulosCadastroLoja = [
        {
          chave: 'consultoras',
          titulo: 'Consultoras',
          descricao: 'Cadastre, edite e apague consultoras com ID e PDV oficial.',
          icone: Users,
          destaque: true
        },
        {
          chave: 'metas_consultora',
          titulo: 'Metas por consultora',
          descricao: 'Lance e edite meta individual, Skin, boleto médio e itens por boleto.',
          icone: BadgeDollarSign
        },
        {
          chave: 'metas_unidade',
          titulo: 'Metas por unidade',
          descricao: 'Lance e edite metas das lojas/PDVs.',
          icone: Target
        },
        {
          chave: 'unidades',
          titulo: 'Unidades',
          descricao: 'Cadastre, edite e apague PDV, cidade e nome da loja.',
          icone: IconeCanalLoja
        },
        {
          chave: 'bases',
          titulo: 'Bases de vendas e Skin',
          descricao: 'Apenas para atualizar realizado: GMV e Skin/Botik.',
          icone: FileSpreadsheet
        },
        {
          chave: 'servicos',
          titulo: 'Serviços',
          descricao: 'Lance serviços por unidade quando necessário.',
          icone: Sparkles
        }
      ];

      const inputBaseLoja = "w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-700 outline-none focus:border-[#048187] focus:ring-4 focus:ring-[#048187]/10 transition-all font-bold bg-white";

      const CampoLoja = ({ label, value, onChange, placeholder, type = 'text', disabled = false }) => (
        <div>
          <label className="block text-[10px] font-black uppercase tracking-wide text-gray-400 mb-1.5">{label}</label>
          <input
            type={type}
            inputMode={type === 'number' ? 'decimal' : undefined}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={`${inputBaseLoja} ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
          />
        </div>
      );

      const SelectLoja = ({ label, value, onChange, children }) => (
        <div>
          <label className="block text-[10px] font-black uppercase tracking-wide text-gray-400 mb-1.5">{label}</label>
          <select value={value} onChange={(e) => onChange(e.target.value)} className={inputBaseLoja}>
            {children}
          </select>
        </div>
      );

      const BotaoSalvarLoja = ({ children, carregando = false }) => (
        <button type="submit" disabled={carregando} className="bg-[#048187] text-white font-black px-5 py-3 rounded-lg hover:bg-[#036b70] disabled:opacity-60 inline-flex items-center justify-center gap-2">
          <Save size={17} /> {children}
        </button>
      );

      const BotaoLimparLoja = ({ onClick }) => (
        <button type="button" onClick={onClick} className="border border-gray-200 text-gray-600 font-black px-5 py-3 rounded-lg hover:bg-gray-50">
          Limpar
        </button>
      );

      if (visaoCadastroLoja === 'bases') {
        return (
          <div className="space-y-6 animate-fade-in">
            <CabecalhoSubCadastroLoja titulo="Bases de vendas e Skin" descricao="Use apenas para atualizar o realizado da LOJA. Cadastros e metas são lançados nas telas próprias." />
            <ModalAtualizacaoSgiLoja />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <ModuloUploadLoja
                titulo="Base de vendas / GMV"
                descricao="Sistema de vendas. Faturamento = coluna GMV-GMV. Boleto médio = GMV-Boleto médio. Itens/Boleto = GMV-Itens por boleto."
                tipo="vendas"
                endpoint="/loja/upload-gerencial"
                usaCiclo
                substituir
                permiteSgi
              />
              <ModuloUploadLoja
                titulo="Base Skin / Botik"
                descricao="Arquivo cuidados faciais. Use a aba CONSULTOR. Indicador = coluna RECEITA (R$). Linhas de total são ignoradas."
                tipo="skin"
                endpoint="/loja/upload-skin"
                usaCiclo
                substituir
              />
            </div>
          </div>
        );
      }

      if (visaoCadastroLoja === 'unidades') {
        return (
          <div className="space-y-6 animate-fade-in">
            <CabecalhoSubCadastroLoja titulo="Cadastro de unidades" descricao="Cadastre, edite ou apague lojas/PDVs." />

            <form onSubmit={salvarUnidadeLoja} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
              <h2 className="text-lg font-black text-gray-700 mb-4">Dados da unidade</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <CampoLojaCadastroLoja label="PDV" value={lojaUnidadeForm.codigo_pdv} onChange={(v) => setLojaUnidadeForm((f) => ({ ...f, codigo_pdv: v }))} placeholder="Ex.: 17322" />
                <CampoLojaCadastroLoja label="Cidade" value={lojaUnidadeForm.cidade} onChange={(v) => setLojaUnidadeForm((f) => ({ ...f, cidade: v }))} placeholder="Ex.: Pinheiro Centro" />
                <CampoLojaCadastroLoja label="Nome da loja" value={lojaUnidadeForm.nome_loja} onChange={(v) => setLojaUnidadeForm((f) => ({ ...f, nome_loja: v }))} placeholder="Nome completo da loja" />
                <SelectLojaCadastroLoja label="Status" value={lojaUnidadeForm.status_loja} onChange={(v) => setLojaUnidadeForm((f) => ({ ...f, status_loja: v }))}>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </SelectLojaCadastroLoja>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <BotaoSalvarLoja carregando={carregandoLoja}>Salvar unidade</BotaoSalvarLoja>
                <BotaoLimparLoja onClick={() => setLojaUnidadeForm({ codigo_pdv: '', cidade: '', nome_loja: '', status_loja: 'ativo' })} />
              </div>
            </form>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-black text-gray-700">Unidades cadastradas</h2>
                  <p className="text-xs font-bold text-gray-400 mt-1">{unidades.length} unidades</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-sm">
                  <thead className="bg-[#f3fbfb] text-[10px] uppercase text-gray-400 font-black">
                    <tr>
                      <th className="py-3 px-4 text-left">PDV</th>
                      <th className="py-3 px-4 text-left">Cidade</th>
                      <th className="py-3 px-4 text-left">Loja</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unidades.map((u) => (
                      <tr key={u.codigo_pdv} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-4 px-4 font-black text-gray-700">{u.codigo_pdv}</td>
                        <td className="py-4 px-4 font-bold text-gray-600">{u.cidade}</td>
                        <td className="py-4 px-4 font-bold text-gray-600">{u.nome_loja}</td>
                        <td className="py-4 px-4 text-center"><span className="rounded-full bg-[#e6f6f7] px-3 py-1 text-[10px] font-black text-[#048187]">{u.status_loja || 'ativo'}</span></td>
                        <td className="py-4 px-4 text-right">
                          <button type="button" onClick={() => editarUnidadeLoja(u)} className="text-[#048187] hover:text-[#036b70] mr-3" title="Editar"><Pencil size={17} /></button>
                          <button type="button" onClick={() => excluirUnidadeLoja(u.codigo_pdv)} className="text-red-500 hover:text-red-600" title="Apagar"><Trash2 size={17} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!unidades.length && <div className="p-8 text-center text-gray-400 font-bold">Nenhuma unidade cadastrada.</div>}
              </div>
            </div>
          </div>
        );
      }

      if (visaoCadastroLoja === 'consultoras') {
        return (
          <div className="space-y-6 animate-fade-in">
            <CabecalhoSubCadastroLoja titulo="Cadastro de consultoras" descricao="Cadastre, edite ou apague consultoras. O ID é o número antes do nome na base de vendas." />

            <form onSubmit={salvarConsultoraLoja} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
              <h2 className="text-lg font-black text-gray-700 mb-4">Dados da consultora</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <CampoLojaCadastroLoja label="ID consultora" value={lojaConsultoraForm.id_consultora} onChange={(v) => setLojaConsultoraForm((f) => ({ ...f, id_consultora: v }))} placeholder="Ex.: 83" />
                <CampoLojaCadastroLoja label="Nome" value={lojaConsultoraForm.nome_consultora} onChange={(v) => setLojaConsultoraForm((f) => ({ ...f, nome_consultora: v }))} placeholder="Nome da consultora" />
                <SelectLojaCadastroLoja label="PDV oficial" value={lojaConsultoraForm.codigo_pdv_oficial} onChange={(v) => setLojaConsultoraForm((f) => ({ ...f, codigo_pdv_oficial: v }))}>
                  <option value="">Selecione</option>
                  {unidades.map((u) => <option key={u.codigo_pdv} value={u.codigo_pdv}>{u.codigo_pdv} - {u.cidade || u.nome_loja}</option>)}
                </SelectLojaCadastroLoja>
                <SelectLojaCadastroLoja label="Status" value={lojaConsultoraForm.status_consultora} onChange={(v) => setLojaConsultoraForm((f) => ({ ...f, status_consultora: v }))}>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </SelectLojaCadastroLoja>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <BotaoSalvarLoja carregando={carregandoLoja}>Salvar consultora</BotaoSalvarLoja>
                <BotaoLimparLoja onClick={() => setLojaConsultoraForm({ id_consultora: '', nome_consultora: '', codigo_pdv_oficial: '', status_consultora: 'ativo' })} />
              </div>
            </form>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-black text-gray-700">Consultoras cadastradas</h2>
                  <p className="text-xs font-bold text-gray-400 mt-1">{consultoras.length} consultoras</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-sm">
                  <thead className="bg-[#f3fbfb] text-[10px] uppercase text-gray-400 font-black">
                    <tr>
                      <th className="py-3 px-4 text-left">ID</th>
                      <th className="py-3 px-4 text-left">Consultora</th>
                      <th className="py-3 px-4 text-left">PDV oficial</th>
                      <th className="py-3 px-4 text-right">Realizado</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consultoras.map((c) => (
                      <tr key={c.id_consultora} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-4 px-4 font-black text-[#048187]">{c.id_consultora}</td>
                        <td className="py-4 px-4 font-black text-gray-700">{c.nome_consultora}</td>
                        <td className="py-4 px-4 font-bold text-gray-500">{c.codigo_pdv_oficial}</td>
                        <td className="py-4 px-4 text-right font-black text-[#048187]">{formatarMoeda(c.realizado || 0)}</td>
                        <td className="py-4 px-4 text-center"><span className="rounded-full bg-[#e6f6f7] px-3 py-1 text-[10px] font-black text-[#048187]">{c.status_consultora || 'ativo'}</span></td>
                        <td className="py-4 px-4 text-right">
                          <button type="button" onClick={() => editarConsultoraLoja(c)} className="text-[#048187] hover:text-[#036b70] mr-3" title="Editar"><Pencil size={17} /></button>
                          <button type="button" onClick={() => excluirConsultoraLoja(c.id_consultora)} className="text-red-500 hover:text-red-600" title="Apagar"><Trash2 size={17} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!consultoras.length && <div className="p-8 text-center text-gray-400 font-bold">Nenhuma consultora cadastrada.</div>}
              </div>
            </div>
          </div>
        );
      }

      if (visaoCadastroLoja === 'metas_unidade') {
        return (
          <div className="space-y-6 animate-fade-in">
            <CabecalhoSubCadastroLoja titulo="Metas por unidade" descricao="Lance, edite ou apague metas das unidades no ciclo selecionado." />

            <form onSubmit={salvarMetaUnidadeLoja} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
              <h2 className="text-lg font-black text-gray-700 mb-4">Meta da unidade</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <CampoLojaCadastroLoja label="Ciclo" value={lojaMetaUnidadeForm.ciclo || cicloAtualLoja} onChange={(v) => setLojaMetaUnidadeForm((f) => ({ ...f, ciclo: v }))} placeholder="09/2026" />
                <SelectLojaCadastroLoja label="PDV" value={lojaMetaUnidadeForm.codigo_pdv} onChange={(v) => setLojaMetaUnidadeForm((f) => ({ ...f, codigo_pdv: v }))}>
                  <option value="">Selecione</option>
                  {unidades.map((u) => <option key={u.codigo_pdv} value={u.codigo_pdv}>{u.codigo_pdv} - {u.cidade || u.nome_loja}</option>)}
                </SelectLojaCadastroLoja>
                <CampoLojaCadastroLoja label="Meta faturamento" value={lojaMetaUnidadeForm.meta_faturamento} onChange={(v) => setLojaMetaUnidadeForm((f) => ({ ...f, meta_faturamento: v }))} placeholder="Ex.: 74037" />
                <CampoLojaCadastroLoja label="Meta Skin R$" value={lojaMetaUnidadeForm.meta_skin} onChange={(v) => setLojaMetaUnidadeForm((f) => ({ ...f, meta_skin: v }))} placeholder="Ex.: 1874" />
                <CampoLojaCadastroLoja label="Boleto médio" value={lojaMetaUnidadeForm.meta_boleto_medio} onChange={(v) => setLojaMetaUnidadeForm((f) => ({ ...f, meta_boleto_medio: v }))} placeholder="Ex.: 279" />
                <CampoLojaCadastroLoja label="Itens por boleto" value={lojaMetaUnidadeForm.meta_itens_boleto} onChange={(v) => setLojaMetaUnidadeForm((f) => ({ ...f, meta_itens_boleto: v }))} placeholder="4" />
                <CampoLojaCadastroLoja label="Meta serviços mês" value={lojaMetaUnidadeForm.meta_servicos_mes} onChange={(v) => setLojaMetaUnidadeForm((f) => ({ ...f, meta_servicos_mes: v }))} placeholder="Ex.: 25" />
                <CampoLojaCadastroLoja label="Meta serviços ano" value={lojaMetaUnidadeForm.meta_servicos_ano} onChange={(v) => setLojaMetaUnidadeForm((f) => ({ ...f, meta_servicos_ano: v }))} placeholder="Ex.: 300" />
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <BotaoSalvarLoja carregando={carregandoLoja}>Salvar meta unidade</BotaoSalvarLoja>
                <BotaoLimparLoja onClick={() => { setLojaMetaUnidadeForm({ ciclo: cicloLojaSelecionado(), codigo_pdv: '', meta_faturamento: '', meta_boleto_medio: '', meta_itens_boleto: 4, meta_skin: '', meta_servicos_mes: '', meta_servicos_ano: '' }); setLinhaMetaUnidadeLojaEditando(null); }} />
              </div>
            </form>

            <div className={`${tabelaCadastroLojaExpandida === 'metas_unidade' ? 'fixed inset-3 md:inset-5 z-[99999] bg-white rounded-xl shadow-2xl border border-[#d9eff0] overflow-auto' : 'bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden'}`}>
              <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-3 bg-white sticky top-0 z-10">
                <div>
                  <h2 className="text-lg font-black text-gray-700">Metas das unidades</h2>
                  <p className="text-xs font-bold text-gray-400 mt-1">{unidades.length} unidades cadastradas</p>
                </div>
                <button
                  type="button"
                  onClick={() => setTabelaCadastroLojaExpandida(tabelaCadastroLojaExpandida === 'metas_unidade' ? null : 'metas_unidade')}
                  className="h-9 px-3 rounded-xl bg-[#e6f6f7] text-[#048187] hover:bg-[#d0f0f1] inline-flex items-center gap-2 font-black text-xs shrink-0"
                  title={tabelaCadastroLojaExpandida === 'metas_unidade' ? 'Reduzir tabela' : 'Expandir tabela'}
                >
                  {tabelaCadastroLojaExpandida === 'metas_unidade' ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  {tabelaCadastroLojaExpandida === 'metas_unidade' ? 'Reduzir' : 'Expandir'}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px] text-sm">
                  <thead className="bg-[#f3fbfb] text-[10px] uppercase text-gray-400 font-black">
                    <tr>
                      <th className="py-3 px-4 text-left">PDV</th>
                      <th className="py-3 px-4 text-left">Unidade</th>
                      <th className="py-3 px-4 text-right">Meta fat.</th>
                      <th className="py-3 px-4 text-right">Realizado</th>
                      <th className="py-3 px-4 text-right">% Fat.</th>
                      <th className="py-3 px-4 text-right">Meta Skin</th>
                      <th className="py-3 px-4 text-right">Skin</th>
                      <th className="py-3 px-4 text-right">% Skin</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unidades.map((u) => {
                      const editando = linhaMetaUnidadeLojaEditando === String(u.codigo_pdv);
                      return (
                        <tr key={u.codigo_pdv} className={`border-b border-gray-50 hover:bg-gray-50 ${editando ? 'bg-[#f3fbfb]' : ''}`}>
                          <td className="py-4 px-4 font-black text-gray-700">{u.codigo_pdv}</td>
                          <td className="py-4 px-4 font-bold text-gray-600">{u.cidade || u.nome_loja}</td>
                          <td className="py-4 px-4 text-right font-black text-[#048187]">
                            {editando ? (
                              <input value={lojaMetaUnidadeForm.meta_faturamento} onChange={(e) => setLojaMetaUnidadeForm((f) => ({ ...f, meta_faturamento: e.target.value }))} className="w-28 text-right border border-gray-200 rounded-lg px-2 py-2 font-black outline-none focus:border-[#048187]" />
                            ) : formatarMoeda(u.meta_faturamento || 0)}
                          </td>
                          <td className="py-4 px-4 text-right font-black text-gray-700">{formatarMoeda(u.realizado || 0)}</td>
                          <td className="py-4 px-4 text-right font-black" style={{ color: corPorFaixaMeta(u.percentual || 0) }}>{formatarNumeroBR(u.percentual || 0, 1)}%</td>
                          <td className="py-4 px-4 text-right font-bold">
                            {editando ? (
                              <input value={lojaMetaUnidadeForm.meta_skin} onChange={(e) => setLojaMetaUnidadeForm((f) => ({ ...f, meta_skin: e.target.value }))} className="w-24 text-right border border-gray-200 rounded-lg px-2 py-2 font-black outline-none focus:border-[#048187]" />
                            ) : formatarMoeda(u.meta_skin || 0)}
                          </td>
                          <td className="py-4 px-4 text-right font-bold text-[#048187]">{formatarMoeda(u.realizado_skin || 0)}</td>
                          <td className="py-4 px-4 text-right font-black" style={{ color: corPorFaixaMeta(calcPerc(u.realizado_skin || 0, editando ? lojaMetaUnidadeForm.meta_skin : u.meta_skin || 0)) }}>{formatarNumeroBR(calcPerc(u.realizado_skin || 0, editando ? lojaMetaUnidadeForm.meta_skin : u.meta_skin || 0), 1)}%</td>
                          <td className="py-4 px-4 text-right whitespace-nowrap">
                            {editando ? (
                              <>
                                <button type="button" onClick={(e) => salvarMetaUnidadeLoja({ preventDefault: () => {} })} className="text-[#048187] hover:text-[#036b70] mr-3" title="Salvar"><Save size={17} /></button>
                                <button type="button" onClick={() => { setLinhaMetaUnidadeLojaEditando(null); setLojaMetaUnidadeForm({ ciclo: cicloLojaSelecionado(), codigo_pdv: '', meta_faturamento: '', meta_boleto_medio: '', meta_itens_boleto: 4, meta_skin: '', meta_servicos_mes: '', meta_servicos_ano: '' }); }} className="text-gray-400 hover:text-gray-600 mr-3" title="Cancelar"><X size={17} /></button>
                              </>
                            ) : (
                              <button type="button" onClick={() => editarMetaUnidadeLoja(u)} className="text-[#048187] hover:text-[#036b70] mr-3" title="Editar"><Pencil size={17} /></button>
                            )}
                            <button type="button" onClick={() => excluirMetaUnidadeLoja(u.codigo_pdv)} className="text-red-500 hover:text-red-600" title="Apagar meta"><Trash2 size={17} /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      }

      if (visaoCadastroLoja === 'metas_consultora') {
        return (
          <div className="space-y-6 animate-fade-in">
            <CabecalhoSubCadastroLoja titulo="Metas por consultora" descricao="Lance, edite ou apague metas individuais por consultora." />

            <form onSubmit={salvarMetaConsultoraLoja} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
              <h2 className="text-lg font-black text-gray-700 mb-4">Meta da consultora</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <CampoLojaCadastroLoja label="Ciclo" value={lojaMetaConsultoraForm.ciclo || cicloAtualLoja} onChange={(v) => setLojaMetaConsultoraForm((f) => ({ ...f, ciclo: v }))} placeholder="09/2026" />
                <SelectLojaCadastroLoja label="Consultora" value={lojaMetaConsultoraForm.id_consultora} onChange={(v) => {
                  const escolhida = consultoras.find((c) => String(c.id_consultora) === String(v));
                  setLojaMetaConsultoraForm((f) => ({ ...f, id_consultora: v, codigo_pdv_oficial: escolhida?.codigo_pdv_oficial || f.codigo_pdv_oficial }));
                }}>
                  <option value="">Selecione</option>
                  {consultoras.map((c) => <option key={c.id_consultora} value={c.id_consultora}>{c.id_consultora} - {c.nome_consultora}</option>)}
                </SelectLojaCadastroLoja>
                <SelectLojaCadastroLoja label="PDV oficial" value={lojaMetaConsultoraForm.codigo_pdv_oficial} onChange={(v) => setLojaMetaConsultoraForm((f) => ({ ...f, codigo_pdv_oficial: v }))}>
                  <option value="">Selecione</option>
                  {unidades.map((u) => <option key={u.codigo_pdv} value={u.codigo_pdv}>{u.codigo_pdv} - {u.cidade || u.nome_loja}</option>)}
                </SelectLojaCadastroLoja>
                <CampoLojaCadastroLoja label="Meta faturamento" value={lojaMetaConsultoraForm.meta_faturamento} onChange={(v) => setLojaMetaConsultoraForm((f) => ({ ...f, meta_faturamento: v }))} placeholder="Ex.: 24979" />
                <CampoLojaCadastroLoja label="Meta Skin R$" value={lojaMetaConsultoraForm.meta_skin} onChange={(v) => setLojaMetaConsultoraForm((f) => ({ ...f, meta_skin: v }))} placeholder="Ex.: 624" />
                <CampoLojaCadastroLoja label="Boleto médio" value={lojaMetaConsultoraForm.meta_boleto_medio} onChange={(v) => setLojaMetaConsultoraForm((f) => ({ ...f, meta_boleto_medio: v }))} placeholder="Ex.: 250" />
                <CampoLojaCadastroLoja label="Itens por boleto" value={lojaMetaConsultoraForm.meta_itens_boleto} onChange={(v) => setLojaMetaConsultoraForm((f) => ({ ...f, meta_itens_boleto: v }))} placeholder="4" />
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <BotaoSalvarLoja carregando={carregandoLoja}>Salvar meta consultora</BotaoSalvarLoja>
                <BotaoLimparLoja onClick={() => { setLojaMetaConsultoraForm({ ciclo: cicloLojaSelecionado(), id_consultora: '', codigo_pdv_oficial: '', meta_faturamento: '', meta_boleto_medio: '', meta_itens_boleto: 4, meta_skin: '' }); setLinhaMetaConsultoraLojaEditando(null); }} />
              </div>
            </form>

            <div className={`${tabelaCadastroLojaExpandida === 'metas_consultora' ? 'fixed inset-3 md:inset-5 z-[99999] bg-white rounded-xl shadow-2xl border border-[#d9eff0] overflow-auto' : 'bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden'}`}>
              <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-3 bg-white sticky top-0 z-10">
                <div>
                  <h2 className="text-lg font-black text-gray-700">Metas das consultoras</h2>
                  <p className="text-xs font-bold text-gray-400 mt-1">{consultoras.length} consultoras cadastradas</p>
                </div>
                <button
                  type="button"
                  onClick={() => setTabelaCadastroLojaExpandida(tabelaCadastroLojaExpandida === 'metas_consultora' ? null : 'metas_consultora')}
                  className="h-9 px-3 rounded-xl bg-[#e6f6f7] text-[#048187] hover:bg-[#d0f0f1] inline-flex items-center gap-2 font-black text-xs shrink-0"
                  title={tabelaCadastroLojaExpandida === 'metas_consultora' ? 'Reduzir tabela' : 'Expandir tabela'}
                >
                  {tabelaCadastroLojaExpandida === 'metas_consultora' ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  {tabelaCadastroLojaExpandida === 'metas_consultora' ? 'Reduzir' : 'Expandir'}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1250px] text-sm">
                  <thead className="bg-[#f3fbfb] text-[10px] uppercase text-gray-400 font-black">
                    <tr>
                      <th className="py-3 px-4 text-left">ID</th>
                      <th className="py-3 px-4 text-left">Consultora</th>
                      <th className="py-3 px-4 text-left">PDV</th>
                      <th className="py-3 px-4 text-right">Meta fat.</th>
                      <th className="py-3 px-4 text-right">Realizado</th>
                      <th className="py-3 px-4 text-right">% Fat.</th>
                      <th className="py-3 px-4 text-right">Meta Skin</th>
                      <th className="py-3 px-4 text-right">Skin</th>
                      <th className="py-3 px-4 text-right">% Skin</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consultoras.map((c) => {
                      const editando = linhaMetaConsultoraLojaEditando === String(c.id_consultora);
                      return (
                        <tr key={c.id_consultora} className={`border-b border-gray-50 hover:bg-gray-50 ${editando ? 'bg-[#f3fbfb]' : ''}`}>
                          <td className="py-4 px-4 font-black text-[#048187]">{c.id_consultora}</td>
                          <td className="py-4 px-4 font-black text-gray-700">{c.nome_consultora}</td>
                          <td className="py-4 px-4 font-bold text-gray-500">
                            {editando ? (
                              <select value={lojaMetaConsultoraForm.codigo_pdv_oficial} onChange={(e) => setLojaMetaConsultoraForm((f) => ({ ...f, codigo_pdv_oficial: e.target.value }))} className="w-32 border border-gray-200 rounded-lg px-2 py-2 font-black outline-none focus:border-[#048187]">
                                <option value="">Selecione</option>
                                {unidades.map((u) => <option key={u.codigo_pdv} value={u.codigo_pdv}>{u.codigo_pdv}</option>)}
                              </select>
                            ) : c.codigo_pdv_oficial}
                          </td>
                          <td className="py-4 px-4 text-right font-black text-[#048187]">
                            {editando ? (
                              <input value={lojaMetaConsultoraForm.meta_faturamento} onChange={(e) => setLojaMetaConsultoraForm((f) => ({ ...f, meta_faturamento: e.target.value }))} className="w-28 text-right border border-gray-200 rounded-lg px-2 py-2 font-black outline-none focus:border-[#048187]" />
                            ) : formatarMoeda(c.meta_faturamento || 0)}
                          </td>
                          <td className="py-4 px-4 text-right font-black text-gray-700">{formatarMoeda(c.realizado || 0)}</td>
                          <td className="py-4 px-4 text-right font-black" style={{ color: corPorFaixaMeta(calcPerc(c.realizado || 0, editando ? lojaMetaConsultoraForm.meta_faturamento : c.meta_faturamento || 0)) }}>{formatarNumeroBR(calcPerc(c.realizado || 0, editando ? lojaMetaConsultoraForm.meta_faturamento : c.meta_faturamento || 0), 1)}%</td>
                          <td className="py-4 px-4 text-right font-bold">
                            {editando ? (
                              <input value={lojaMetaConsultoraForm.meta_skin} onChange={(e) => setLojaMetaConsultoraForm((f) => ({ ...f, meta_skin: e.target.value }))} className="w-24 text-right border border-gray-200 rounded-lg px-2 py-2 font-black outline-none focus:border-[#048187]" />
                            ) : formatarMoeda(c.meta_skin || 0)}
                          </td>
                          <td className="py-4 px-4 text-right font-bold text-[#048187]">{formatarMoeda(c.realizado_skin || 0)}</td>
                          <td className="py-4 px-4 text-right font-black" style={{ color: corPorFaixaMeta(calcPerc(c.realizado_skin || 0, editando ? lojaMetaConsultoraForm.meta_skin : c.meta_skin || 0)) }}>{formatarNumeroBR(calcPerc(c.realizado_skin || 0, editando ? lojaMetaConsultoraForm.meta_skin : c.meta_skin || 0), 1)}%</td>
                          <td className="py-4 px-4 text-right whitespace-nowrap">
                            {editando ? (
                              <>
                                <button type="button" onClick={(e) => salvarMetaConsultoraLoja({ preventDefault: () => {} })} className="text-[#048187] hover:text-[#036b70] mr-3" title="Salvar"><Save size={17} /></button>
                                <button type="button" onClick={() => { setLinhaMetaConsultoraLojaEditando(null); setLojaMetaConsultoraForm({ ciclo: cicloLojaSelecionado(), id_consultora: '', codigo_pdv_oficial: '', meta_faturamento: '', meta_boleto_medio: '', meta_itens_boleto: 4, meta_skin: '' }); }} className="text-gray-400 hover:text-gray-600 mr-3" title="Cancelar"><X size={17} /></button>
                              </>
                            ) : (
                              <button type="button" onClick={() => editarMetaConsultoraLoja(c)} className="text-[#048187] hover:text-[#036b70] mr-3" title="Editar"><Pencil size={17} /></button>
                            )}
                            <button type="button" onClick={() => excluirMetaConsultoraLoja(c.id_consultora)} className="text-red-500 hover:text-red-600" title="Apagar meta"><Trash2 size={17} /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      }

      if (visaoCadastroLoja === 'servicos') {
        return (
          <div className="space-y-6 animate-fade-in">
            <CabecalhoSubCadastroLoja titulo="Serviços da LOJA" descricao="Por enquanto, serviços pode ser atualizado por upload até criarmos o lançamento manual detalhado." />
            <ModuloUploadLoja titulo="Upload de serviços" descricao="Meta e realizado de serviços por unidade." tipo="servicos" endpoint="/loja/upload-servicos" usaCiclo />
          </div>
        );
      }

      return (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-8">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-700 mb-2">Cadastro LOJA</h1>
                <p className="text-sm text-gray-400 font-semibold">Cadastre consultoras, unidades e metas manualmente, no mesmo padrão de trabalho da aba Cadastro do VD.</p>
              </div>
              <button type="button" onClick={fecharCicloHistoricoLoja} className="bg-[#048187] text-white px-5 py-3 rounded-lg font-black hover:bg-[#036b70] inline-flex items-center justify-center gap-2">
                <Save size={17} /> Salvar ciclo no histórico
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-8">
            <div className="mb-5 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-700">Módulos de cadastro</h2>
                <p className="text-sm text-gray-400 font-semibold mt-1">Escolha um módulo para cadastrar, editar, salvar ou apagar informações da LOJA.</p>
              </div>
              <div className="rounded-xl bg-[#e6f6f7] px-4 py-3 min-w-[150px]">
                <p className="text-[10px] font-black uppercase text-[#048187]">Ciclo</p>
                <p className="text-lg font-black text-[#048187]">{cicloAtualLoja || '-'}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {modulosCadastroLoja.map((modulo) => (
                <CardOpcaoCadastro
                  key={modulo.chave}
                  titulo={modulo.titulo}
                  descricao={modulo.descricao}
                  icone={modulo.icone}
                  destaque={Boolean(modulo.destaque)}
                  onClick={() => setVisaoCadastroLoja(modulo.chave)}
                />
              ))}
            </div>
          </div>
        </div>
      );
    };


    return (
      <div className="space-y-6 animate-fade-in">
        <AvisosLoja />

        {carregandoLoja && <DashboardSkeletons />}

        {!carregandoLoja && abaLoja === 'cadastro' && CadastroLoja()}

        {!carregandoLoja && abaLoja === 'unidades' && (
          <BlocoTabelaLoja titulo="Resultado por unidade/PDV" subtitulo="Somente vendas que aconteceram dentro do PDV entram no resultado da unidade." tipo="unidades">
            <TabelaUnidades />
          </BlocoTabelaLoja>
        )}

        {!carregandoLoja && abaLoja === 'consultoras' && (
          <BlocoTabelaLoja titulo="Resultado por consultora" subtitulo="Todas as vendas da consultora entram para a meta dela, mesmo em outro PDV." tipo="consultoras">
            <TabelaConsultoras />
          </BlocoTabelaLoja>
        )}

        {!carregandoLoja && abaLoja === 'ranking' && (() => {
          const rankingBaseLoja = visaoRanking === 'consultores'
            ? consultorasFiltradas.map((c) => ({
                id_colaborador: c.id_consultora,
                nome: c.nome_consultora,
                estrutura: `${c.codigo_pdv_oficial || '-'} • ${formatarNumeroBR(c.qtd_boletos || 0, 0)} boletos`,
                realizado: Number(c.realizado || 0),
                meta_faturamento: Number(c.meta_faturamento || 0),
                percentual_faturamento: Number(c.percentual || calcPerc(c.realizado || 0, c.meta_faturamento || 0)),
                realizado_skin: Number(c.realizado_skin || 0),
                meta_skin: Number(c.meta_skin || 0),
                percentual_skin: calcPerc(c.realizado_skin || 0, c.meta_skin || 0),
                boleto_medio: Number(c.boleto_medio || 0),
                meta_boleto_medio: Number(c.meta_boleto_medio || 0),
                percentual_boleto: calcPerc(c.boleto_medio || 0, c.meta_boleto_medio || 0),
                itens_por_boleto: Number(c.itens_por_boleto || 0),
                meta_itens_boleto: Number(c.meta_itens_boleto || 4),
                percentual_itens: calcPerc(c.itens_por_boleto || 0, c.meta_itens_boleto || 4)
              }))
            : unidadesFiltradas.map((u) => ({
                id_colaborador: u.codigo_pdv,
                nome: u.cidade || u.nome_loja || u.codigo_pdv,
                estrutura: `${u.codigo_pdv || '-'} • ${formatarNumeroBR(u.qtd_boletos || 0, 0)} boletos`,
                realizado: Number(u.realizado || 0),
                meta_faturamento: Number(u.meta_faturamento || 0),
                percentual_faturamento: Number(u.percentual || calcPerc(u.realizado || 0, u.meta_faturamento || 0)),
                realizado_skin: Number(u.realizado_skin || 0),
                meta_skin: Number(u.meta_skin || 0),
                percentual_skin: calcPerc(u.realizado_skin || 0, u.meta_skin || 0),
                boleto_medio: Number(u.boleto_medio || 0),
                meta_boleto_medio: Number(u.meta_boleto_medio || 0),
                percentual_boleto: calcPerc(u.boleto_medio || 0, u.meta_boleto_medio || 0),
                itens_por_boleto: Number(u.itens_por_boleto || 0),
                meta_itens_boleto: Number(u.meta_itens_boleto || 4),
                percentual_itens: calcPerc(u.itens_por_boleto || 0, u.meta_itens_boleto || 4),
                realizado_servicos_mes: Number(u.realizado_servicos_mes || 0),
                meta_servicos_mes: Number(u.meta_servicos_mes || 0),
                percentual_servicos: calcPerc(u.realizado_servicos_mes || 0, u.meta_servicos_mes || 0)
              }));

          const topFatLoja = [...rankingBaseLoja].sort((a, b) => Number(b.percentual_faturamento || 0) - Number(a.percentual_faturamento || 0));
          const podioLoja = [topFatLoja[1], topFatLoja[0], topFatLoja[2]];
          const tituloVisaoLoja = visaoRanking === 'consultores' ? 'Consultoras' : 'Unidades';

          const blocoPodioLoja = (item, posicao, classeAltura, classeBox) => (
            <div className="flex flex-col items-center justify-end min-w-0">
              {item && (
                <div className="mb-3 w-full rounded-2xl bg-white border border-gray-100 px-3 py-3 text-center min-h-[96px] flex flex-col items-center justify-center">
                  <span className="text-[10px] font-black uppercase tracking-wide" style={{ color: posicao === 1 ? '#f0b400' : posicao === 2 ? '#6b7280' : '#ff6f03' }}>{posicao}º lugar</span>
                  <p className="mt-1 text-sm font-black text-gray-700 leading-tight line-clamp-2" title={item.nome}>{item.nome}</p>
                  <p className="mt-1 text-lg font-black" style={{ color: corPorFaixaMeta(item.percentual_faturamento || 0) }}>{formatarNumeroBR(item.percentual_faturamento || 0, 1)}%</p>
                  <p className="text-[10px] font-bold text-gray-400">{formatarMoeda(item.realizado || 0)}</p>
                </div>
              )}
              <div className={`w-full rounded-t-xl shadow-inner flex items-start justify-center pt-5 text-white font-black text-2xl ${classeAltura} ${classeBox}`}>
                {posicao}º
              </div>
            </div>
          );

          return (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-yellow-500 text-white flex items-center justify-center shrink-0"><Trophy size={25}/></div>
                  <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-700 truncate">Ranking LOJA</h1>
                    <p className="text-sm text-gray-400 truncate">Separado por indicador, igual ao Ranking VD</p>
                  </div>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-lg shrink-0">
                  <button onClick={() => setVisaoRanking('consultores')} className={`p-2 px-3 sm:px-4 rounded-md transition-colors ${visaoRanking === 'consultores' ? 'bg-[#048187] text-white shadow' : 'text-gray-500 hover:text-gray-700'}`} title="Visão Consultoras"><User size={18} /></button>
                  <button onClick={() => setVisaoRanking('estruturas')} className={`p-2 px-3 sm:px-4 rounded-md transition-colors ${visaoRanking === 'estruturas' ? 'bg-[#048187] text-white shadow' : 'text-gray-500 hover:text-gray-700'}`} title="Visão Unidades"><IconeCanalLoja size={18} /></button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-7 min-h-[360px] overflow-hidden">
                <h2 className="text-base sm:text-lg font-black text-gray-700 mb-8 uppercase tracking-widest text-center">
                  Top 3 % de Faturamento ({tituloVisaoLoja})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 items-end justify-center w-full max-w-4xl mx-auto gap-5 sm:gap-6">
                  {blocoPodioLoja(podioLoja[0], 2, 'h-24 sm:h-32', 'bg-gradient-to-b from-slate-200 to-slate-300')}
                  {blocoPodioLoja(podioLoja[1], 1, 'h-32 sm:h-44', 'bg-gradient-to-b from-yellow-200 to-yellow-400')}
                  {blocoPodioLoja(podioLoja[2], 3, 'h-20 sm:h-28', 'bg-gradient-to-b from-orange-200 to-orange-400')}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                <CardTop5 titulo="Maior % Faturamento" dados={rankingBaseLoja} propValor="percentual_faturamento" formatter={(v) => `${formatarNumeroBR(v || 0, 1)}%`} corValor="#048187" propSubValor="realizado" subFormatter={(v) => formatarMoeda(v || 0)} subLabel="" />
                <CardTop5 titulo="Maior Faturamento" dados={rankingBaseLoja} propValor="realizado" formatter={(v) => formatarMoeda(v || 0)} corValor="#048187" propSubValor="percentual_faturamento" subFormatter={(v) => `${formatarNumeroBR(v || 0, 1)}%`} subLabel="" />
                <CardTop5 titulo="Melhor % Skin" dados={rankingBaseLoja} propValor="percentual_skin" formatter={(v) => `${formatarNumeroBR(v || 0, 1)}%`} corValor="#7c1f31" propSubValor="realizado_skin" subFormatter={(v) => formatarMoeda(v || 0)} subLabel="" />
                <CardTop5 titulo="Maior Skin" dados={rankingBaseLoja} propValor="realizado_skin" formatter={(v) => formatarMoeda(v || 0)} corValor="#7c1f31" propSubValor="percentual_skin" subFormatter={(v) => `${formatarNumeroBR(v || 0, 1)}%`} subLabel="" />
                <CardTop5 titulo="Maior Boleto Médio" dados={rankingBaseLoja} propValor="boleto_medio" formatter={(v) => formatarMoeda(v || 0)} corValor="#6366f1" propSubValor="percentual_boleto" subFormatter={(v) => `${formatarNumeroBR(v || 0, 1)}%`} subLabel="" />
                <CardTop5 titulo="Melhor Itens/Boleto" dados={rankingBaseLoja} propValor="itens_por_boleto" formatter={(v) => formatarNumeroBR(v || 0, 2)} corValor="#ff6f03" propSubValor="percentual_itens" subFormatter={(v) => `${formatarNumeroBR(v || 0, 1)}%`} subLabel="" />
                {visaoRanking !== 'consultores' && (
                  <CardTop5 titulo="Melhor % Serviços" dados={rankingBaseLoja} propValor="percentual_servicos" formatter={(v) => `${formatarNumeroBR(v || 0, 1)}%`} corValor="#048187" propSubValor="realizado_servicos_mes" subFormatter={(v) => formatarNumeroBR(v || 0, 0)} subLabel="" />
                )}
              </div>
            </div>
          );
        })()}

        {!carregandoLoja && abaLoja === 'geral' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4">
              <CardLoja
                titulo="Faturamento realizado"
                valor={formatarMoedaCompactaCard(resumoCardsLoja.faturamento_realizado)}
                meta={formatarMoedaCompactaCard(resumoCardsLoja.meta_faturamento)}
                percentual={resumoCardsLoja.percentual_faturamento}
                icone={BadgeDollarSign}
                subtitulo={`Falta para a meta: ${formatarMoedaCompactaCard(resumoCardsLoja.deficit_faturamento)}`}
                onDetalhes={() => abrirDetalheCardLoja('Faturamento LOJA', [
                  { label: 'Realizado', valor: formatarMoeda(resumoCardsLoja.faturamento_realizado || 0) },
                  { label: 'Meta ciclo', valor: formatarMoeda(resumoCardsLoja.meta_faturamento || 0) },
                  { label: '% da meta', valor: `${formatarNumeroBR(resumoCardsLoja.percentual_faturamento || 0, 1)}%` },
                  { label: 'Falta para a meta', valor: formatarMoeda(resumoCardsLoja.deficit_faturamento || 0) }
                ], 'Faturamento LOJA = soma da coluna GMV-GMV da base de vendas.')}
              />
              <CardLoja
                titulo="Venda diária"
                valor={formatarMoedaCompactaCard(resumoCardsLoja.realizado_diario || 0)}
                meta={formatarMoedaCompactaCard(resumoCardsLoja.meta_diaria || 0)}
                percentual={calcPerc(resumoCardsLoja.realizado_diario || 0, resumoCardsLoja.meta_diaria || 0)}
                icone={CalendarDays}
                subtitulo={`Hoje vs meta diária: ${formatarNumeroBR(calcPerc(resumoCardsLoja.realizado_diario || 0, resumoCardsLoja.meta_diaria || 0), 1)}%`}
                onDetalhes={() => abrirDetalheCardLoja('Venda diária LOJA', [
                  { label: 'Venda diária realizada', valor: formatarMoeda(resumoCardsLoja.realizado_diario || 0) },
                  { label: 'Meta diária', valor: formatarMoeda(resumoCardsLoja.meta_diaria || 0) },
                  { label: '% da meta diária', valor: `${formatarNumeroBR(calcPerc(resumoCardsLoja.realizado_diario || 0, resumoCardsLoja.meta_diaria || 0), 1)}%` },
                  { label: 'Data de referência', valor: formatarDataBR(resumoCardsLoja.data_referencia_diaria || new Date().toISOString().slice(0, 10)) }
                ], 'Venda diária = base diária baixada no SGI com período de hoje até hoje. Meta diária = valor calculado para o dia dentro do ciclo.')}
              />
              <CardLoja
                titulo="Tendência"
                valor={formatarMoedaCompactaCard(resumoCardsLoja.tendencia || 0)}
                meta={formatarMoedaCompactaCard(resumoCardsLoja.meta_faturamento || 0)}
                percentual={calcPerc(resumoCardsLoja.tendencia || 0, resumoCardsLoja.meta_faturamento || 0)}
                icone={TrendingUp}
                subtitulo={`Gap tendência: ${formatarMoedaCompactaCard(resumoCardsLoja.gap_tendencia || 0)}`}
                onDetalhes={() => abrirDetalheCardLoja('Tendência LOJA', [
                  { label: 'Tendência', valor: formatarMoeda(resumoCardsLoja.tendencia || 0) },
                  { label: 'Meta ciclo', valor: formatarMoeda(resumoCardsLoja.meta_faturamento || 0) },
                  { label: 'Gap tendência', valor: formatarMoeda(resumoCardsLoja.gap_tendencia || 0) },
                  { label: 'Dias passados', valor: formatarNumeroBR(resumoCardsLoja.dias_passados || 0, 0) },
                  { label: 'Dias do ciclo', valor: formatarNumeroBR(resumoCardsLoja.dias_total || 0, 0) }
                ], 'Tendência = média diária realizada × dias totais do ciclo.')}
              />
              <CardLoja
                titulo="Skin"
                valor={formatarMoedaCompactaCard(resumoCardsLoja.skin_realizado || 0)}
                meta={formatarMoedaCompactaCard(resumoCardsLoja.meta_skin || 0)}
                percentual={resumoCardsLoja.percentual_skin || 0}
                icone={Sparkles}
                subtitulo="Meta de Skin em R$ por loja/consultora."
                onDetalhes={() => abrirDetalheCardLoja('Skin LOJA', [
                  { label: 'Realizado Skin', valor: formatarMoeda(resumoCardsLoja.skin_realizado || 0) },
                  { label: 'Meta Skin', valor: formatarMoeda(resumoCardsLoja.meta_skin || 0) },
                  { label: '% Skin', valor: `${formatarNumeroBR(resumoCardsLoja.percentual_skin || 0, 1)}%` }
                ], 'Skin = soma da aba CONSULTOR, coluna RECEITA (R$), ignorando linhas de total.')}
              />
              <CardLoja
                titulo="Boleto médio"
                valor={formatarMoeda(resumoCardsLoja.boleto_medio || 0)}
                meta={formatarMoeda(resumoCardsLoja.meta_boleto_medio || 0)}
                percentual={calcPerc(resumoCardsLoja.boleto_medio || 0, resumoCardsLoja.meta_boleto_medio || 0)}
                icone={BadgeDollarSign}
                subtitulo={`Pedidos/boletos: ${formatarNumeroBR(resumoCardsLoja.pedidos || 0, 0)}`}
                onDetalhes={() => abrirDetalheCardLoja('Boleto médio LOJA', [
                  { label: 'Boleto médio', valor: formatarMoeda(resumoCardsLoja.boleto_medio || 0) },
                  { label: 'Meta boleto', valor: formatarMoeda(resumoCardsLoja.meta_boleto_medio || 0) },
                  { label: '% da meta', valor: `${formatarNumeroBR(calcPerc(resumoCardsLoja.boleto_medio || 0, resumoCardsLoja.meta_boleto_medio || 0), 1)}%` },
                  { label: 'Qtd de boletos/pedidos', valor: formatarNumeroBR(resumoCardsLoja.pedidos || 0, 0) }
                ], 'Boleto médio = GMV-GMV / GMV-Qtd de boletos.')}
              />
              <CardLoja
                titulo="Itens por boleto"
                valor={formatarNumeroBR(resumoCardsLoja.itens_por_boleto || 0, 2)}
                meta={formatarNumeroBR(resumoCardsLoja.meta_itens_boleto || 4, 1)}
                percentual={calcPerc(resumoCardsLoja.itens_por_boleto || 0, resumoCardsLoja.meta_itens_boleto || 4)}
                icone={Database}
                subtitulo="Indicador de itens médios por compra."
                onDetalhes={() => abrirDetalheCardLoja('Itens por boleto LOJA', [
                  { label: 'Itens por boleto', valor: formatarNumeroBR(resumoCardsLoja.itens_por_boleto || 0, 2) },
                  { label: 'Meta itens', valor: formatarNumeroBR(resumoCardsLoja.meta_itens_boleto || 4, 1) },
                  { label: '% da meta', valor: `${formatarNumeroBR(calcPerc(resumoCardsLoja.itens_por_boleto || 0, resumoCardsLoja.meta_itens_boleto || 4), 1)}%` },
                  { label: 'Regra', valor: 'Coluna GMV-Itens por boleto' }
                ], 'Itens/Boleto usa a coluna GMV-Itens por boleto da base de vendas.')}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 -mt-1">
              <p className="text-xs text-gray-400 font-bold">
                {temFiltroCardsLoja ? 'Cards calculados com os filtros aplicados.' : ''}
              </p>
              <p className="text-xs text-gray-400 font-bold">Última atualização (Bases Loja): {formatarDataHoraLoja(resumoCardsLoja.ultima_atualizacao)}</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <BlocoTabelaLoja titulo="Unidades" subtitulo="Resultado pelo PDV onde a venda aconteceu." tipo="unidades">
                <TabelaUnidades lista={unidadesFiltradas.slice(0, 8)} />
              </BlocoTabelaLoja>
              <BlocoTabelaLoja titulo="Consultoras" subtitulo="Resultado por ID da consultora, independente do PDV." tipo="consultoras">
                <TabelaConsultoras lista={consultorasFiltradas.slice(0, 8)} />
              </BlocoTabelaLoja>
            </div>
          </>
        )}
        {tabelaLojaExpandida && (
          <div className="fixed inset-0 z-[9999] bg-black/45 backdrop-blur-sm p-4 sm:p-6 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[96vw] h-[88vh] overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-gray-700">{tabelaLojaExpandida === 'unidades' ? 'Unidades - lista completa' : 'Consultoras - lista completa'}</h2>
                  <p className="text-xs text-gray-400 font-bold mt-1">Ciclo {cicloAtualLoja || '-'} • {tabelaLojaExpandida === 'unidades' ? unidadesFiltradas.length : consultorasFiltradas.length} registros</p>
                </div>
                <button
                  type="button"
                  onClick={() => setTabelaLojaExpandida(null)}
                  className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center"
                >
                  <Minimize2 size={18} />
                </button>
              </div>
              <div className="p-5 overflow-auto">
                {tabelaLojaExpandida === 'unidades'
                  ? <TabelaUnidades lista={unidadesFiltradas} />
                  : <TabelaConsultoras lista={consultorasFiltradas} />}
              </div>
            </div>
          </div>
        )}
      </div>

    );
  };

  const renderContent = () => {
    if (telaAtual === 'Dashboard') return renderTelaDashboard();
    if (telaAtual === 'Metas') return renderTelaMetas();
    if (telaAtual === 'N1') return <TelaGestaoNucleo nucleo="N1" />;
    if (telaAtual === 'N2') return <TelaGestaoNucleo nucleo="N2" />;
    if (telaAtual === 'N3') return <TelaGestaoNucleo nucleo="N3" />;
    if (telaAtual === 'Ranking') return renderTelaRanking();
    if (telaAtual === 'Comparativo') return renderTelaComparativo();
    if (telaAtual === 'Ações') return renderTelaAcoesCiclo();
    if (telaAtual === 'Histórico') return renderTelaHistorico();
    if (telaAtual === 'Revendedores') return renderTelaRevendedores();
    if (telaAtual === 'Base') return renderTelaBase();
    if (telaAtual === 'Cadastro') return renderTelaCadastro();
    if (telaEhLoja(telaAtual)) return renderTelaLoja();
    if (telaAtual === 'ADM') return renderTelaADM();
    if (telaAtual === 'Configurações') return renderTelaConfiguracoes();
    if (telaAtual === 'Perfil') return renderTelaPerfil();
    return null;
  };

  const cicloTopoAtual = telaEhLoja(telaAtual)
    ? (cicloLoja || dadosLoja?.resumo?.ciclo || dados?.ciclo_atual || ciclos?.find((c) => String(c.status_ciclo || '').toLowerCase() === 'ativo')?.ciclo || ciclos?.[0]?.ciclo || '')
    : (dados?.ciclo_atual
      || ciclos?.find((c) => String(c.status_ciclo || '').toLowerCase() === 'ativo')?.ciclo
      || ciclos?.[0]?.ciclo
      || '');

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
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        abrirModalRecuperacaoSenha();
                      }}
                      className="relative z-20 text-sm font-black text-[#048187] hover:text-[#036b70] underline underline-offset-4 cursor-pointer"
                    >
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

        {modalRecuperacaoSenhaAberto && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4 py-6">
            <div className="w-full max-w-[460px] bg-white rounded-3xl shadow-2xl border border-white/80 overflow-hidden">
              <div className="bg-[#048187] px-6 py-5 text-white flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black">Recuperar senha</h2>
                  <p className="text-sm text-white/80 mt-1">Registre a solicitação para o administrador resetar sua senha.</p>
                </div>
                <button
                  type="button"
                  onClick={fecharModalRecuperacaoSenha}
                  disabled={carregandoRecuperacaoSenha}
                  className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center disabled:opacity-60"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-6">
                <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-gray-100 p-1">
                  <button
                    type="button"
                    onClick={() => setEtapaRecuperacaoSenha('solicitar')}
                    className={`rounded-xl py-2 text-xs font-black uppercase transition-colors ${etapaRecuperacaoSenha === 'solicitar' ? 'bg-white text-[#048187] shadow-sm' : 'text-gray-400'}`}
                  >
                    Solicitar
                  </button>
                  <button
                    type="button"
                    onClick={() => setEtapaRecuperacaoSenha('redefinir')}
                    className={`rounded-xl py-2 text-xs font-black uppercase transition-colors ${etapaRecuperacaoSenha === 'redefinir' ? 'bg-white text-[#048187] shadow-sm' : 'text-gray-400'}`}
                  >
                    Admin
                  </button>
                </div>

                {erroRecuperacaoSenha && (
                  <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-600">
                    {erroRecuperacaoSenha}
                  </div>
                )}

                {mensagemRecuperacaoSenha && (
                  <div className="mb-4 rounded-xl border border-[#d0f0f1] bg-[#e6f6f7] p-3 text-sm font-bold text-[#048187]">
                    {mensagemRecuperacaoSenha}
                  </div>
                )}

                {etapaRecuperacaoSenha === 'redefinir' && (
                  <div className="mb-4 rounded-2xl border border-[#ccecee] bg-[#e6f6f7] p-4">
                    <p className="text-[11px] font-black uppercase tracking-wide text-[#048187]">Código enviado por e-mail</p>
                    <p className="mt-1 text-xs font-bold text-[#048187]/80">
                      Confira a caixa de entrada e o spam/lixo eletrônico do e-mail cadastrado. O código expira em 15 minutos.
                    </p>
                  </div>
                )}

                {etapaRecuperacaoSenha === 'solicitar' ? (
                  <form onSubmit={solicitarCodigoRecuperacaoSenha} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-600 mb-2">E-mail cadastrado</label>
                      <input
                        type="email"
                        value={formRecuperacaoSenha.email}
                        onChange={(e) => setFormRecuperacaoSenha((atual) => ({ ...atual, email: e.target.value }))}
                        placeholder="seuemail@mail.com"
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-700 outline-none focus:border-[#048187] focus:ring-4 focus:ring-[#048187]/10 transition-all"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={carregandoRecuperacaoSenha}
                      className="w-full bg-[#048187] text-white font-black py-3.5 rounded-lg hover:bg-[#036b70] disabled:opacity-60 transition-all shadow-lg shadow-[#048187]/20"
                    >
                      {carregandoRecuperacaoSenha ? 'Registrando solicitação...' : 'Solicitar reset ao administrador'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={redefinirSenhaRecuperacao} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-600 mb-2">E-mail</label>
                      <input
                        type="email"
                        value={formRecuperacaoSenha.email}
                        onChange={(e) => setFormRecuperacaoSenha((atual) => ({ ...atual, email: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-700 outline-none focus:border-[#048187] focus:ring-4 focus:ring-[#048187]/10 transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-600 mb-2">Código</label>
                      <input
                        value={formRecuperacaoSenha.codigo}
                        onChange={(e) => setFormRecuperacaoSenha((atual) => ({ ...atual, codigo: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                        placeholder="000000"
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-700 outline-none focus:border-[#048187] focus:ring-4 focus:ring-[#048187]/10 transition-all tracking-[0.18em] font-black"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-bold text-gray-600 mb-2">Nova senha</label>
                        <input
                          type="password"
                          value={formRecuperacaoSenha.nova_senha}
                          onChange={(e) => setFormRecuperacaoSenha((atual) => ({ ...atual, nova_senha: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-700 outline-none focus:border-[#048187] focus:ring-4 focus:ring-[#048187]/10 transition-all"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-600 mb-2">Confirmar</label>
                        <input
                          type="password"
                          value={formRecuperacaoSenha.confirmar_senha}
                          onChange={(e) => setFormRecuperacaoSenha((atual) => ({ ...atual, confirmar_senha: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-700 outline-none focus:border-[#048187] focus:ring-4 focus:ring-[#048187]/10 transition-all"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={carregandoRecuperacaoSenha}
                      className="w-full bg-[#048187] text-white font-black py-3.5 rounded-lg hover:bg-[#036b70] disabled:opacity-60 transition-all shadow-lg shadow-[#048187]/20"
                    >
                      {carregandoRecuperacaoSenha ? 'Salvando nova senha...' : 'Salvar nova senha'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
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
                        className={`${sidebarExpandida ? 'w-full justify-start gap-3 px-4 py-2.5 rounded-lg text-sm' : 'w-11 h-11 mx-auto justify-center rounded-xl'} flex items-center font-medium transition-colors ${ativo ? 'bg-[#5bb2b4] text-white shadow-lg shadow-[#5bb2b4]/20' : 'text-gray-300 hover:bg-white/10'}`}
                      >
                        <Icone size={sidebarExpandida ? 18 : 22} strokeWidth={sidebarExpandida ? 2 : 2.05} />
                        {sidebarExpandida && <span className="tracking-normal">{obterNomeAba(item.nome)}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {usuarioPodeAcessarLoja() && (
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
                    itensMenuLoja.filter((item) => usuarioPodeAcessar(item.nome)).map((item) => {
                      const Icone = item.icone;
                      const ativo = canalAtual === 'LOJA' && telaAtual === item.nome;
                      return (
                        <button
                          key={item.nome}
                          onClick={() => { setCanalAtual('LOJA'); setTelaAtual(item.nome); }}
                          title={obterNomeAba(item.nome)}
                          className={`${sidebarExpandida ? 'w-full justify-start gap-3 px-4 py-2.5 rounded-lg text-sm' : 'w-11 h-11 mx-auto justify-center rounded-xl'} flex items-center font-medium transition-colors ${ativo ? 'bg-[#5bb2b4] text-white shadow-lg shadow-[#5bb2b4]/20' : 'text-gray-300 hover:bg-white/10'}`}
                        >
                          <Icone size={sidebarExpandida ? 18 : 22} strokeWidth={sidebarExpandida ? 2 : 2.05} />
                          {sidebarExpandida && <span className="tracking-normal">{obterNomeAba(item.nome)}</span>}
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
            )}
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
            {usuarioPodeAcessar('ADM') && (
              <button
                onClick={() => { setCanalAtual('VD'); setTelaAtual('ADM'); }}
                title="Painel ADM"
                className={`${sidebarExpandida ? 'w-full justify-start gap-3 px-4 py-3 rounded-lg' : 'w-11 h-11 mx-auto justify-center rounded-xl'} flex items-center font-bold ${telaAtual === 'ADM' ? 'bg-[#5bb2b4] text-white shadow-lg shadow-[#5bb2b4]/20' : 'text-gray-300 hover:bg-white/10'}`}
              >
                <ShieldCheck size={sidebarExpandida ? 20 : 22} strokeWidth={sidebarExpandida ? 2 : 2.05} />
                {sidebarExpandida && <span>Painel ADM</span>}
              </button>
            )}
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
            {[...itensMenuVD, ...(usuarioPodeAcessarLoja() ? [{ nome: 'LojaVisaoGeral', icone: LayoutDashboard }] : []), { nome: 'ADM', icone: ShieldCheck }, { nome: 'Perfil', icone: User }].map((item) => {
              if (!usuarioPodeAcessar(item.nome)) return null;
              const Icone = item.icone; const ativo = telaAtual === item.nome;
              return (<button key={item.nome} onClick={() => item.nome === 'Loja' ? navegarParaLoja() : navegarParaTelaVD(item.nome)} className={`flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 min-w-0 flex-1 ${ativo ? 'bg-[#5bb2b4] text-white' : 'text-gray-300'}`}>{item.nome === 'Loja' ? <IconeCanalLoja size={18} /> : <Icone size={18} />}<span className="text-[10px] font-bold truncate max-w-full">{obterNomeAba(item.nome)}</span></button>);
            })}
          </div>
        </div>

        <div className={`fixed right-0 top-0 h-[100dvh] w-full sm:w-[28rem] bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${painelFiltrosAberto ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-5 border-b border-gray-100 bg-[#f7fafb] flex items-start justify-between shrink-0">
            <div><h3 className="text-xl font-bold text-gray-700">Filtros</h3><p className="text-sm text-gray-400">{telaEhLoja(telaAtual) ? 'Refine os dados da LOJA.' : telaAtual === 'Revendedores' ? 'Refine somente a aba Revendedores.' : 'Refine os dados do dashboard.'}</p></div>
            <button onClick={() => setPainelFiltrosAberto(false)} className="text-gray-400 hover:text-red-500 bg-white rounded-full p-2 shadow-sm"><X size={20} /></button>
          </div>
          {telaEhLoja(telaAtual) ? (
            <>
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                <div>
                  <h4 className="font-bold text-gray-600 mb-2 text-sm uppercase">Ciclo</h4>
                  <select
                    value={cicloLoja || dadosLoja?.resumo?.ciclo || ''}
                    onChange={(e) => { setCicloLoja(e.target.value); carregarDadosLoja(e.target.value); }}
                    className="w-full text-sm p-3 border border-gray-200 rounded-lg outline-none focus:border-[#048187] font-bold"
                  >
                    <option value="">Ciclo ativo</option>
                    {ciclos.map((c) => <option key={c.id || c.ciclo} value={c.ciclo}>{c.ciclo}</option>)}
                  </select>
                </div>

                <div>
                  <h4 className="font-bold text-gray-600 mb-2 text-sm uppercase">Unidade / PDV</h4>
                  <select
                    value={filtrosLoja.unidade}
                    onChange={(e) => setFiltrosLoja((atual) => ({ ...atual, unidade: e.target.value }))}
                    className="w-full text-sm p-3 border border-gray-200 rounded-lg outline-none focus:border-[#048187] font-bold"
                  >
                    <option value="">Todas as unidades</option>
                    {(dadosLoja?.unidades || []).map((u) => (
                      <option key={u.codigo_pdv} value={u.codigo_pdv}>{u.codigo_pdv} - {u.cidade || u.nome_loja}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <h4 className="font-bold text-gray-600 mb-2 text-sm uppercase">Consultora</h4>
                  <select
                    value={filtrosLoja.consultora}
                    onChange={(e) => setFiltrosLoja((atual) => ({ ...atual, consultora: e.target.value }))}
                    className="w-full text-sm p-3 border border-gray-200 rounded-lg outline-none focus:border-[#048187] font-bold"
                  >
                    <option value="">Todas as consultoras</option>
                    {(dadosLoja?.consultoras || []).map((c) => (
                      <option key={c.id_consultora} value={c.id_consultora}>{c.id_consultora} - {c.nome_consultora}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <h4 className="font-bold text-gray-600 mb-2 text-sm uppercase">Busca rápida</h4>
                  <input
                    value={buscaLoja}
                    onChange={(e) => setBuscaLoja(e.target.value)}
                    placeholder="Buscar PDV, cidade ou consultora"
                    className="w-full text-sm p-3 border border-gray-200 rounded-lg outline-none focus:border-[#048187] font-bold"
                  />
                </div>
              </div>
              <div className="p-5 border-t border-gray-100 bg-white shrink-0 space-y-3">
                <button onClick={() => setPainelFiltrosAberto(false)} className="w-full bg-[#048187] text-white font-bold py-3 rounded-lg hover:bg-[#036b70]">Aplicar Filtros</button>
                <button onClick={() => { setFiltrosLoja({ unidade: '', consultora: '' }); setBuscaLoja(''); setPainelFiltrosAberto(false); }} className="w-full border-2 border-red-500 text-red-500 font-bold py-2.5 rounded-lg hover:bg-red-50">Remover Todos</button>
              </div>
            </>
          ) : telaAtual === 'Revendedores' ? (
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
                <GrupoFiltro cat="nucleos" tit="Núcleo (N1, N2 e N3)" busca={buscaFiltros} setBusca={setBuscaFiltros} opc={opcoesFiltros} ativos={filtrosAtivos} toggle={toggleFiltroArray} />
                <GrupoFiltro cat="unidades" tit="Unidade" busca={buscaFiltros} setBusca={setBuscaFiltros} opc={opcoesFiltros} ativos={filtrosAtivos} toggle={toggleFiltroArray} />
                <GrupoFiltro cat="estruturas" tit="Estrutura" busca={buscaFiltros} setBusca={setBuscaFiltros} opc={opcoesFiltros} ativos={filtrosAtivos} toggle={toggleFiltroArray} />
                <GrupoFiltro cat="consultores" tit="Consultor" busca={buscaFiltros} setBusca={setBuscaFiltros} opc={opcoesFiltros} ativos={filtrosAtivos} toggle={toggleFiltroArray} />
                <GrupoFiltro cat="situacoes" tit="Situação Comercial" busca={buscaFiltros} setBusca={setBuscaFiltros} opc={opcoesFiltros} ativos={filtrosAtivos} toggle={toggleFiltroArray} />
                <GrupoFiltro cat="meios_captacao" tit="Meio de Captação" busca={buscaFiltros} setBusca={setBuscaFiltros} opc={opcoesFiltros} ativos={filtrosAtivos} toggle={toggleFiltroArray} />
                <GrupoFiltro cat="modelos_comerciais" tit="Modelo de Venda" busca={buscaFiltros} setBusca={setBuscaFiltros} opc={opcoesFiltros} ativos={filtrosAtivos} toggle={toggleFiltroArray} />
                <GrupoFiltro cat="canais_venda" tit="Canal de Venda" busca={buscaFiltros} setBusca={setBuscaFiltros} opc={opcoesFiltros} ativos={filtrosAtivos} toggle={toggleFiltroArray} />
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
                {(telaAtual === 'Dashboard' || telaAtual === 'Metas' || telaAtual === 'Ranking' || telaAtual === 'Comparativo' || telaAtual === 'Revendedores' || telaEhLoja(telaAtual)) && (
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
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center px-4"><div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"><div className="flex items-start justify-between p-6 border-b border-gray-100"><div><h2 className="text-xl font-bold text-gray-700">Editar ciclo</h2></div><button onClick={() => setModalEditarCicloAberto(false)} className="text-gray-400 hover:bg-gray-50 rounded-full p-2"><X size={20} /></button></div><div className="p-6"><form onSubmit={salvarEdicaoCiclo} className="space-y-4"><input type="text" value={cicloEditando.ciclo} onChange={e=>setCicloEditando({...cicloEditando, ciclo: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-[#048187]" required /><div className="grid grid-cols-2 gap-4"><input type="date" value={cicloEditando.data_inicio} onChange={e=>setCicloEditando({...cicloEditando, data_inicio: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-[#048187]" required /><input type="date" value={cicloEditando.data_fim} onChange={e=>setCicloEditando({...cicloEditando, data_fim: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-[#048187]" required /></div><div><select value={cicloEditando.status_ciclo} onChange={e=>setCicloEditando({...cicloEditando, status_ciclo: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-[#048187]"><option value="ativo">Ativo</option><option value="inativo">Inativo</option></select></div><div className="flex justify-end gap-3 pt-4"><button type="submit" className="bg-[#048187] text-white px-5 py-2 rounded-lg font-bold">Salvar alterações</button></div></form></div></div></div>
      )}

      {modalExcluirCicloAberto && cicloParaExcluir && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center px-4"><div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6"><h2 className="text-xl font-bold text-gray-700 mb-4">Excluir ciclo?</h2><p className="text-gray-600 mb-6">{cicloParaExcluir.ciclo}</p><div className="flex justify-end gap-3"><button onClick={() => setModalExcluirCicloAberto(false)} className="px-5 py-2 rounded-lg border border-gray-200 text-gray-500 font-bold hover:bg-gray-50">Cancelar</button><button onClick={confirmarExclusaoCiclo} className="bg-red-500 text-white px-5 py-2 rounded-lg font-bold hover:bg-red-600">Excluir</button></div></div></div>
      )}

      {modalPermissoesAberto && usuarioPermissoesEditando && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-700">Permissões do usuário</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Configure as abas liberadas somente para <strong>{usuarioPermissoesEditando.nome}</strong>.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="bg-[#e6f6f7] text-[#048187] px-3 py-1 rounded-full text-xs font-black uppercase">{usuarioPermissoesEditando.perfil}</span>
                  <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold">{usuarioPermissoesEditando.email}</span>
                </div>
              </div>
              <button onClick={() => { setModalPermissoesAberto(false); setUsuarioPermissoesEditando(null); }} className="text-gray-400 hover:bg-gray-50 rounded-full p-2">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 bg-[#fbfefe] border-b border-gray-100">
              <div className="rounded-xl bg-white border border-[#d9eff0] p-4 text-sm text-gray-500 font-semibold">
                Agora as permissões são salvas por pessoa. Alterar a Isabela não altera a Ellerne, Leonardo, Oseas ou qualquer outro gestor.
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ABAS_SISTEMA.map((aba) => {
                  const perfil = usuarioPermissoesEditando?.perfil || 'visualizador';
                  const travado = aba === 'Perfil' || (perfil === 'admin' && ['ADM', 'Configurações', 'Perfil'].includes(aba));
                  return (
                    <label key={aba} className={`flex items-center gap-3 p-3 rounded-lg border ${travado ? 'bg-gray-50 border-gray-100 cursor-not-allowed opacity-70' : 'bg-white border-gray-200 cursor-pointer hover:border-[#048187]'}`}>
                      <input
                        type="checkbox"
                        checked={Array.isArray(permissoesTemporarias) && permissoesTemporarias.includes(aba)}
                        onChange={() => togglePermissaoTemporaria(aba)}
                        disabled={travado}
                        className="w-4 h-4 accent-[#048187]"
                      />
                      <span className="text-sm font-bold text-gray-700">{obterNomeAba(aba)}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
              <button onClick={() => { setModalPermissoesAberto(false); setUsuarioPermissoesEditando(null); }} className="px-5 py-2 rounded-lg border border-gray-200 text-gray-500 font-bold hover:bg-gray-50">Cancelar</button>
              <button onClick={salvarPermissoes} className="px-5 py-2 rounded-lg bg-[#048187] text-white font-bold hover:bg-[#036b70]">Salvar permissões deste usuário</button>
            </div>
          </div>
        </div>
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