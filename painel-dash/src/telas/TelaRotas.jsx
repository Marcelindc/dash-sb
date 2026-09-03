import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  ExternalLink,
  Loader2,
  MapPin,
  PackageCheck,
  RefreshCcw,
  Route,
  Search,
  Truck,
  UserRound,
  X,
} from 'lucide-react';

const FILTROS_INICIAIS = {
  motorista: '',
  cidade: '',
  estrutura: '',
  status: '',
  busca: '',
};

const normalizar = (valor) => String(valor || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

const formatarMoeda = (valor) => Number(valor || 0).toLocaleString('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const formatarDataHora = (valor) => {
  if (!valor) return 'Ainda não atualizado';
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return String(valor);
  return data.toLocaleString('pt-BR');
};

const statusClasses = (status) => {
  const s = normalizar(status);
  if (s === 'entregue') return 'bg-[#e6f6f7] text-[#048187] border-[#cbe8ea]';
  if (s === 'em transito') return 'bg-blue-50 text-blue-700 border-blue-100';
  if (s.includes('aguardando motorista')) return 'bg-amber-50 text-amber-700 border-amber-100';
  if (s.includes('aguardando geracao de rota')) return 'bg-violet-50 text-violet-700 border-violet-100';
  return 'bg-red-50 text-[#7c1f31] border-red-100';
};

const BadgeStatus = ({ status }) => (
  <span className={`inline-flex max-w-[190px] items-center rounded-full border px-2.5 py-1 text-[10px] font-black leading-tight ${statusClasses(status)}`}>
    <span className="truncate" title={status || 'Sem status'}>{status || 'Sem status'}</span>
  </span>
);

const CardStatus = ({ titulo, valor, icone: Icone, detalhe, ativo = false, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!onClick}
    className={`rounded-xl border p-4 text-left transition-all ${ativo ? 'border-[#048187] bg-[#f1fbfb] shadow-sm' : 'border-gray-100 bg-white'} ${onClick ? 'hover:border-[#9fd3d5] hover:-translate-y-0.5' : 'cursor-default'}`}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-wide text-gray-400 truncate">{titulo}</p>
        <p className="mt-1 text-2xl font-black tracking-tight text-gray-700">{Number(valor || 0).toLocaleString('pt-BR')}</p>
        <p className="mt-1 text-[10px] font-bold text-gray-400 truncate">{detalhe}</p>
      </div>
      <span className="w-10 h-10 rounded-xl bg-[#e6f6f7] text-[#048187] flex items-center justify-center shrink-0">
        <Icone size={19} />
      </span>
    </div>
  </button>
);

const Info = ({ label, valor, mono = false }) => (
  <div className="min-w-0">
    <p className="text-[10px] font-black uppercase tracking-wide text-gray-400 mb-1">{label}</p>
    <p className={`text-sm font-bold text-gray-700 break-words ${mono ? 'font-mono' : ''}`}>{valor === null || valor === undefined || valor === '' ? '—' : String(valor)}</p>
  </div>
);

const SecaoDetalhe = ({ titulo, children }) => (
  <section className="rounded-xl border border-gray-100 bg-white overflow-hidden">
    <div className="px-4 py-3 border-b border-gray-100 bg-[#f8fbfb]">
      <h3 className="text-xs font-black uppercase tracking-wide text-[#048187]">{titulo}</h3>
    </div>
    <div className="p-4">{children}</div>
  </section>
);

export default function TelaRotas({ API_URL }) {
  const [filtros, setFiltros] = useState(FILTROS_INICIAIS);
  const [dados, setDados] = useState({
    resumo: {},
    pedidos: [],
    opcoes: { motoristas: [], cidades: [], estruturas: [], status: [] },
    total_filtrado: 0,
    total_paginas: 1,
    pagina: 1,
    base: {},
  });
  const [pagina, setPagina] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [detalhe, setDetalhe] = useState(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const [erroDetalhe, setErroDetalhe] = useState('');
  const [diagnosticoAberto, setDiagnosticoAberto] = useState(false);
  const [carregandoDiagnostico, setCarregandoDiagnostico] = useState(false);
  const [erroDiagnostico, setErroDiagnostico] = useState('');
  const [diagnostico, setDiagnostico] = useState({
    total: 0,
    pedido_erp_encontrado: 0,
    nao_localizados: 0,
    conciliados_por_zeros_esquerda: 0,
    itens: [],
  });

  const carregar = async (paginaDesejada = 1, mostrarLoading = true) => {
    if (mostrarLoading) setCarregando(true);
    setErro('');
    try {
      const resposta = await axios.get(`${API_URL}/rotas/resumo`, {
        params: {
          motorista: filtros.motorista || undefined,
          cidade: filtros.cidade || undefined,
          estrutura: filtros.estrutura || undefined,
          status_filtro: filtros.status || undefined,
          busca: filtros.busca || undefined,
          pagina: paginaDesejada,
          por_pagina: 50,
        },
      });
      const payload = resposta.data || {};
      setDados({
        resumo: payload.resumo || {},
        pedidos: Array.isArray(payload.pedidos) ? payload.pedidos : [],
        opcoes: payload.opcoes || { motoristas: [], cidades: [], estruturas: [], status: [] },
        total_filtrado: Number(payload.total_filtrado || 0),
        total_escopo: Number(payload.total_escopo || 0),
        total_paginas: Number(payload.total_paginas || 1),
        pagina: Number(payload.pagina || 1),
        base: payload.base || {},
      });
      setPagina(Number(payload.pagina || 1));
    } catch (e) {
      setErro(e.response?.data?.detail || 'Não foi possível carregar os pedidos de Rotas.');
    } finally {
      if (mostrarLoading) setCarregando(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void carregar(1, true);
    }, filtros.busca ? 250 : 50);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.motorista, filtros.cidade, filtros.estrutura, filtros.status, filtros.busca]);

  const alterarFiltro = (campo, valor) => {
    setPagina(1);
    setFiltros((atual) => ({ ...atual, [campo]: valor }));
  };

  const limparFiltros = () => {
    setPagina(1);
    setFiltros(FILTROS_INICIAIS);
  };

  const abrirPedido = async (pedido) => {
    if (!pedido) return;
    setDetalhe(null);
    setErroDetalhe('');
    setCarregandoDetalhe(true);
    try {
      const resposta = await axios.get(`${API_URL}/rotas/pedido/${encodeURIComponent(pedido)}`);
      setDetalhe(resposta.data || null);
    } catch (e) {
      setErroDetalhe(e.response?.data?.detail || 'Não foi possível carregar os detalhes deste pedido.');
      setDetalhe({ pedido });
    } finally {
      setCarregandoDetalhe(false);
    }
  };

  const abrirDiagnosticoConciliacao = async () => {
    setDiagnosticoAberto(true);
    setCarregandoDiagnostico(true);
    setErroDiagnostico('');
    try {
      const resposta = await axios.get(`${API_URL}/rotas/nao-conciliados`, {
        params: {
          motorista: filtros.motorista || undefined,
          cidade: filtros.cidade || undefined,
          estrutura: filtros.estrutura || undefined,
          busca: filtros.busca || undefined,
        },
      });
      const payload = resposta.data || {};
      setDiagnostico({
        total: Number(payload.total || 0),
        pedido_erp_encontrado: Number(payload.pedido_erp_encontrado || 0),
        nao_localizados: Number(payload.nao_localizados || 0),
        conciliados_por_zeros_esquerda: Number(payload.conciliados_por_zeros_esquerda || 0),
        itens: Array.isArray(payload.itens) ? payload.itens : [],
      });
    } catch (e) {
      setErroDiagnostico(e.response?.data?.detail || 'Não foi possível carregar o diagnóstico de conciliação.');
    } finally {
      setCarregandoDiagnostico(false);
    }
  };

  const baixarNaoConciliados = () => {
    const itens = Array.isArray(diagnostico.itens) ? diagnostico.itens : [];
    if (!itens.length) return;
    const colunas = [
      ['pedido_original', 'Pedido recebido'],
      ['pedido_normalizado', 'Chave normalizada'],
      ['pedido_erp', 'Pedido ERP'],
      ['data_criacao', 'Data criação'],
      ['status', 'Status'],
      ['nome_revendedor', 'Nome revendedor'],
      ['cidade', 'Cidade'],
      ['motorista', 'Motorista'],
      ['motivo', 'Diagnóstico'],
    ];
    const escapar = (valor) => {
      const texto = String(valor ?? '').replace(/"/g, '""');
      return `"${texto}"`;
    };
    const linhas = [
      colunas.map(([, titulo]) => escapar(titulo)).join(';'),
      ...itens.map((item) => colunas.map(([chave]) => escapar(item[chave])).join(';')),
    ];
    const blob = new Blob([`\ufeff${linhas.join('\r\n')}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rotas_aguardando_conciliacao_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resumo = dados.resumo || {};
  const base = dados.base || {};
  const opcoes = dados.opcoes || {};
  const periodoRelatorio = base.data_inicio_relatorio && base.data_fim_relatorio
    ? `${base.data_inicio_relatorio.split('-').reverse().join('/')} a ${base.data_fim_relatorio.split('-').reverse().join('/')}`
    : 'janela móvel dos últimos 30 dias';

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-1.5 bg-[#048187]" />
        <div className="p-5 sm:p-7 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-[#e6f6f7] text-[#048187] flex items-center justify-center shrink-0">
              <Route size={24} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-black text-gray-700">Rotas</h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold text-gray-400">
                <span>Período: <strong className="text-gray-600">{periodoRelatorio}</strong></span>
                <span>Última atualização: <strong className="text-gray-600">{formatarDataHora(base.ultima_atualizacao)}</strong></span>
                <span>Conciliados: <strong className="text-[#048187]">{Number(base.conciliados || 0).toLocaleString('pt-BR')}</strong> / {Number(base.linhas || 0).toLocaleString('pt-BR')}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => carregar(pagina, true)}
            disabled={carregando}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#e6f6f7] text-[#048187] font-black text-sm hover:bg-[#d8f0f1] disabled:opacity-50"
          >
            <RefreshCcw size={17} className={carregando ? 'animate-spin' : ''} />
            Atualizar tela
          </button>
        </div>
      </div>

      {erro && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 flex items-center gap-2">
          <AlertTriangle size={18} /> {erro}
        </div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-6 gap-3">
        <CardStatus titulo="Total" valor={resumo.total} detalhe="No filtro atual" icone={Truck} ativo={!filtros.status} onClick={() => alterarFiltro('status', '')} />
        <CardStatus titulo="Entregues" valor={resumo.entregues} detalhe="Finalizados" icone={PackageCheck} ativo={normalizar(filtros.status) === 'entregue'} onClick={() => alterarFiltro('status', 'Entregue')} />
        <CardStatus titulo="Em trânsito" valor={resumo.em_transito} detalhe="Em deslocamento" icone={Truck} ativo={normalizar(filtros.status) === 'em transito'} onClick={() => alterarFiltro('status', 'Em transito')} />
        <CardStatus titulo="Aguard. motorista" valor={resumo.aguardando_motorista} detalhe="Sem motorista" icone={UserRound} ativo={normalizar(filtros.status) === 'aguardando motorista'} onClick={() => alterarFiltro('status', 'Aguardando motorista')} />
        <CardStatus titulo="Aguard. rota" valor={resumo.aguardando_rota} detalhe="Sem rota gerada" icone={Clock3} ativo={normalizar(filtros.status) === 'aguardando geracao de rota'} onClick={() => alterarFiltro('status', 'Aguardando geracao de rota')} />
        <CardStatus titulo="Com ocorrência" valor={resumo.com_ocorrencia} detalhe="Ocorrência logística" icone={AlertTriangle} />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wide text-gray-400 mb-1.5">Motorista</label>
            <select value={filtros.motorista} onChange={(e) => alterarFiltro('motorista', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-bold text-gray-600 bg-white outline-none focus:border-[#048187]">
              <option value="">Todos os motoristas</option>
              {(opcoes.motoristas || []).map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wide text-gray-400 mb-1.5">Cidade</label>
            <select value={filtros.cidade} onChange={(e) => alterarFiltro('cidade', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-bold text-gray-600 bg-white outline-none focus:border-[#048187]">
              <option value="">Todas as cidades</option>
              {(opcoes.cidades || []).map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wide text-gray-400 mb-1.5">Estrutura</label>
            <select value={filtros.estrutura} onChange={(e) => alterarFiltro('estrutura', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-bold text-gray-600 bg-white outline-none focus:border-[#048187]">
              <option value="">Todas as estruturas</option>
              {(opcoes.estruturas || []).map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wide text-gray-400 mb-1.5">Status</label>
            <select value={filtros.status} onChange={(e) => alterarFiltro('status', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-bold text-gray-600 bg-white outline-none focus:border-[#048187]">
              <option value="">Todos os status</option>
              {(opcoes.status || []).map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wide text-gray-400 mb-1.5">Buscar</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={filtros.busca} onChange={(e) => alterarFiltro('busca', e.target.value)} placeholder="Pedido, revendedor..." className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm font-bold text-gray-600 outline-none focus:border-[#048187]" />
            </div>
          </div>
        </div>
        {Object.values(filtros).some(Boolean) && (
          <div className="mt-3 flex justify-end">
            <button type="button" onClick={limparFiltros} className="text-xs font-black text-[#7c1f31] hover:underline">Limpar filtros</button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="font-black text-gray-700">Pedidos</h2>
            <p className="text-xs font-bold text-gray-400 mt-0.5">{Number(dados.total_filtrado || 0).toLocaleString('pt-BR')} pedido(s) encontrado(s)</p>
          </div>
          {Number(resumo.nao_conciliados || 0) > 0 && (
            <button
              type="button"
              onClick={abrirDiagnosticoConciliacao}
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-100 px-3 py-1.5 text-[10px] font-black text-amber-700 hover:bg-amber-100 transition-colors"
              title="Clique para ver quais pedidos ainda não foram conciliados e o diagnóstico de cada um"
            >
              <AlertTriangle size={13} /> {Number(resumo.nao_conciliados || 0).toLocaleString('pt-BR')} aguardando conciliação
              <ChevronRight size={12} />
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1500px] w-full text-left">
            <thead className="bg-[#f8fbfb] border-b border-gray-100">
              <tr className="text-[10px] uppercase tracking-wide text-gray-400">
                <th className="px-4 py-3 font-black">Status</th>
                <th className="px-4 py-3 font-black">Nº Pedido</th>
                <th className="px-4 py-3 font-black">Cód Revendedor</th>
                <th className="px-4 py-3 font-black">Nome Revendedor</th>
                <th className="px-4 py-3 font-black">Cidade</th>
                <th className="px-4 py-3 font-black">Endereço</th>
                <th className="px-4 py-3 font-black">Estrutura Comercial</th>
                <th className="px-4 py-3 font-black text-right">Valor Líquido</th>
                <th className="px-4 py-3 font-black">Forma de Pagamento</th>
                <th className="px-4 py-3 font-black">Meio de Captação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {carregando ? (
                <tr><td colSpan={10} className="px-4 py-16 text-center"><Loader2 size={25} className="animate-spin text-[#048187] mx-auto mb-2" /><p className="text-sm font-bold text-gray-400">Carregando Rotas...</p></td></tr>
              ) : dados.pedidos.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-16 text-center text-sm font-bold text-gray-400">Nenhum pedido encontrado para os filtros selecionados.</td></tr>
              ) : dados.pedidos.map((item) => (
                <tr key={item.pedido} className="hover:bg-[#fbfefe] transition-colors align-top">
                  <td className="px-4 py-3.5"><BadgeStatus status={item.status} /></td>
                  <td className="px-4 py-3.5">
                    <button type="button" onClick={() => abrirPedido(item.pedido)} className="font-black text-[#048187] hover:underline inline-flex items-center gap-1">
                      {item.pedido || '—'} <ChevronRight size={14} />
                    </button>
                    {!item.encontrado_consulta && <p className="text-[9px] font-black text-amber-600 mt-1">Não conciliado</p>}
                  </td>
                  <td className="px-4 py-3.5 text-xs font-bold text-gray-600">{item.codigo_revendedor || '—'}</td>
                  <td className="px-4 py-3.5 text-xs font-bold text-gray-700 max-w-[230px]"><span className="line-clamp-2" title={item.nome_revendedor || ''}>{item.nome_revendedor || '—'}</span></td>
                  <td className="px-4 py-3.5 text-xs font-bold text-gray-600"><span className="inline-flex items-center gap-1"><MapPin size={13} className="text-[#048187]" />{item.cidade || '—'}</span></td>
                  <td className="px-4 py-3.5 text-xs font-semibold text-gray-500 max-w-[280px]"><span className="line-clamp-2" title={item.endereco_completo || ''}>{item.endereco_completo || '—'}</span></td>
                  <td className="px-4 py-3.5 text-xs font-bold text-gray-600 max-w-[240px]"><span className="line-clamp-2" title={item.estrutura_comercial || ''}>{item.estrutura_comercial || '—'}</span></td>
                  <td className="px-4 py-3.5 text-xs font-black text-gray-700 text-right whitespace-nowrap">{formatarMoeda(item.valor_liquido_num)}</td>
                  <td className="px-4 py-3.5 text-xs font-semibold text-gray-600 max-w-[220px]"><span className="line-clamp-2" title={item.forma_pagamento || ''}>{item.forma_pagamento || '—'}</span></td>
                  <td className="px-4 py-3.5 text-xs font-semibold text-gray-600 max-w-[180px]"><span className="line-clamp-2" title={item.meio_captacao || ''}>{item.meio_captacao || '—'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 sm:px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-4">
          <p className="text-[11px] font-bold text-gray-400">Página {pagina} de {Math.max(1, Number(dados.total_paginas || 1))}</p>
          <div className="flex gap-2">
            <button type="button" disabled={pagina <= 1 || carregando} onClick={() => carregar(pagina - 1, true)} className="w-9 h-9 rounded-lg border border-gray-200 text-gray-500 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40"><ChevronLeft size={17} /></button>
            <button type="button" disabled={pagina >= Number(dados.total_paginas || 1) || carregando} onClick={() => carregar(pagina + 1, true)} className="w-9 h-9 rounded-lg border border-gray-200 text-gray-500 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40"><ChevronRight size={17} /></button>
          </div>
        </div>
      </div>

      {diagnosticoAberto && (
        <div className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-3 sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget && !carregandoDiagnostico) setDiagnosticoAberto(false); }}>
          <div className="w-full max-w-7xl max-h-[88vh] rounded-2xl bg-[#f7fafb] shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-white border-b border-gray-100 px-5 sm:px-6 py-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wide text-amber-600">Diagnóstico de conciliação</p>
                <h2 className="text-lg sm:text-xl font-black text-gray-700 mt-0.5">Pedidos aguardando conciliação</h2>
                <p className="text-xs font-semibold text-gray-400 mt-1 max-w-4xl">
                  O DASH já verifica automaticamente pontuação, espaços, sufixo .0, notação científica e equivalência segura de zeros à esquerda antes de considerar um pedido não encontrado.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={baixarNaoConciliados}
                  disabled={carregandoDiagnostico || !diagnostico.itens?.length}
                  className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#e6f6f7] text-[#048187] text-xs font-black hover:bg-[#d8f0f1] disabled:opacity-40"
                >
                  <Download size={15} /> Baixar CSV
                </button>
                <button type="button" onClick={() => setDiagnosticoAberto(false)} className="w-9 h-9 rounded-xl bg-gray-50 text-gray-400 hover:text-gray-600 flex items-center justify-center"><X size={18} /></button>
              </div>
            </div>

            <div className="p-4 sm:p-5 border-b border-gray-100 bg-white">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                  <p className="text-[9px] font-black uppercase tracking-wide text-amber-600">Aguardando</p>
                  <p className="text-xl font-black text-gray-700 mt-1">{Number(diagnostico.total || 0).toLocaleString('pt-BR')}</p>
                </div>
                <div className="rounded-xl border border-violet-100 bg-violet-50 px-4 py-3">
                  <p className="text-[9px] font-black uppercase tracking-wide text-violet-600">Pedido ERP encontrado</p>
                  <p className="text-xl font-black text-gray-700 mt-1">{Number(diagnostico.pedido_erp_encontrado || 0).toLocaleString('pt-BR')}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="text-[9px] font-black uppercase tracking-wide text-gray-500">Não localizados</p>
                  <p className="text-xl font-black text-gray-700 mt-1">{Number(diagnostico.nao_localizados || 0).toLocaleString('pt-BR')}</p>
                </div>
                <div className="rounded-xl border border-[#cbe8ea] bg-[#f1fbfb] px-4 py-3">
                  <p className="text-[9px] font-black uppercase tracking-wide text-[#048187]">Corrigidos por zero à esquerda</p>
                  <p className="text-xl font-black text-gray-700 mt-1">{Number(diagnostico.conciliados_por_zeros_esquerda || 0).toLocaleString('pt-BR')}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={baixarNaoConciliados}
                disabled={carregandoDiagnostico || !diagnostico.itens?.length}
                className="sm:hidden mt-3 w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#e6f6f7] text-[#048187] text-xs font-black disabled:opacity-40"
              >
                <Download size={15} /> Baixar relação em CSV
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-auto bg-white">
              {carregandoDiagnostico ? (
                <div className="py-20 text-center"><Loader2 size={28} className="animate-spin text-[#048187] mx-auto mb-3" /><p className="text-sm font-bold text-gray-400">Verificando as chaves dos pedidos...</p></div>
              ) : erroDiagnostico ? (
                <div className="m-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{erroDiagnostico}</div>
              ) : !diagnostico.itens?.length ? (
                <div className="py-20 text-center"><CheckCircle size={28} className="text-[#048187] mx-auto mb-3" /><p className="text-sm font-black text-gray-600">Todos os pedidos foram conciliados.</p></div>
              ) : (
                <table className="min-w-[1350px] w-full text-left">
                  <thead className="sticky top-0 bg-[#f8fbfb] border-b border-gray-100 z-10">
                    <tr className="text-[9px] uppercase tracking-wide text-gray-400">
                      <th className="px-4 py-3 font-black">Pedido recebido</th>
                      <th className="px-4 py-3 font-black">Chave usada</th>
                      <th className="px-4 py-3 font-black">Pedido ERP</th>
                      <th className="px-4 py-3 font-black">Data criação</th>
                      <th className="px-4 py-3 font-black">Status</th>
                      <th className="px-4 py-3 font-black">Revendedor</th>
                      <th className="px-4 py-3 font-black">Cidade</th>
                      <th className="px-4 py-3 font-black">Diagnóstico</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {diagnostico.itens.map((item, indice) => (
                      <tr key={`${item.pedido_normalizado || item.pedido_original}-${indice}`} className="align-top hover:bg-[#fbfefe]">
                        <td className="px-4 py-3 text-xs font-bold text-gray-700 max-w-[170px] break-all">{item.pedido_original || '—'}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => { setDiagnosticoAberto(false); void abrirPedido(item.pedido_normalizado); }}
                            className="text-xs font-black text-[#048187] hover:underline inline-flex items-center gap-1"
                          >
                            {item.pedido_normalizado || '—'} <ChevronRight size={13} />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-gray-600 max-w-[170px] break-all">
                          {item.pedido_erp || '—'}
                          {item.pedido_erp_encontrado_consulta && <span className="block mt-1 text-[9px] font-black text-violet-600">Existe na ConsultaPedidos</span>}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{item.data_criacao || '—'}</td>
                        <td className="px-4 py-3"><BadgeStatus status={item.status} /></td>
                        <td className="px-4 py-3 text-xs font-bold text-gray-600 max-w-[220px]">{item.nome_revendedor || '—'}</td>
                        <td className="px-4 py-3 text-xs font-bold text-gray-600 max-w-[170px]">{item.cidade || '—'}</td>
                        <td className="px-4 py-3 text-[11px] font-semibold text-gray-500 max-w-[360px]">{item.motivo || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {(detalhe || carregandoDetalhe) && (
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-[1px] flex justify-end" onMouseDown={(e) => { if (e.target === e.currentTarget && !carregandoDetalhe) setDetalhe(null); }}>
          <div className="h-full w-full max-w-3xl bg-[#f7fafb] shadow-2xl flex flex-col">
            <div className="bg-white border-b border-gray-100 px-5 sm:px-6 py-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wide text-[#048187]">Detalhe completo</p>
                <h2 className="text-lg font-black text-gray-700 truncate">Pedido {detalhe?.pedido || ''}</h2>
              </div>
              <button type="button" onClick={() => { setDetalhe(null); setErroDetalhe(''); }} className="w-9 h-9 rounded-xl bg-gray-50 text-gray-400 hover:text-gray-600 flex items-center justify-center"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {carregandoDetalhe ? (
                <div className="py-20 text-center"><Loader2 size={28} className="animate-spin text-[#048187] mx-auto mb-3" /><p className="text-sm font-bold text-gray-400">Carregando todas as informações do pedido...</p></div>
              ) : erroDetalhe ? (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{erroDetalhe}</div>
              ) : detalhe && (
                <>
                  <SecaoDetalhe titulo="Status da entrega">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div>
                        <BadgeStatus status={detalhe.resumo_logistico?.status} />
                        <p className="text-sm font-bold text-gray-600 mt-3">{detalhe.resumo_logistico?.status_detalhe || 'Sem detalhe de status.'}</p>
                      </div>
                      {detalhe.resumo_logistico?.rastreio && (
                        <a href={detalhe.resumo_logistico.rastreio} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#048187] text-white text-xs font-black whitespace-nowrap">
                          Abrir rastreio <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </SecaoDetalhe>

                  <SecaoDetalhe titulo="Informações comerciais">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-5">
                      <Info label="Nº Pedido" valor={detalhe.dados_comerciais?.pedido} mono />
                      <Info label="Cód Revendedor" valor={detalhe.dados_comerciais?.codigo_revendedor} mono />
                      <Info label="Nome Revendedor" valor={detalhe.dados_comerciais?.nome_revendedor} />
                      <Info label="Ciclo de Captação" valor={detalhe.dados_comerciais?.ciclo_captacao} />
                      <Info label="Usuário de Finalização" valor={detalhe.dados_comerciais?.usuario_finalizacao} />
                      <Info label="Valor Líquido" valor={formatarMoeda(detalhe.dados_comerciais?.valor_liquido)} />
                      <Info label="Forma de Pagamento" valor={detalhe.dados_comerciais?.forma_pagamento} />
                      <Info label="Meio de Captação" valor={detalhe.dados_comerciais?.meio_captacao} />
                      <Info label="Estrutura Comercial" valor={detalhe.dados_comerciais?.estrutura_comercial} />
                      <Info label="Responsável pela Estrutura" valor={detalhe.dados_comerciais?.responsavel_estrutura} />
                      <Info label="Telefone do Responsável" valor={detalhe.dados_comerciais?.telefone_responsavel} mono />
                      <Info label="Cruzamento ConsultaPedidos" valor={detalhe.dados_comerciais?.encontrado_consulta ? 'Encontrado' : 'Ainda não encontrado'} />
                    </div>
                  </SecaoDetalhe>

                  <SecaoDetalhe titulo="Operação logística">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-5">
                      <Info label="Motorista" valor={detalhe.resumo_logistico?.motorista} />
                      <Info label="Telefone Motorista" valor={detalhe.resumo_logistico?.telefone_motorista} mono />
                      <Info label="Rota" valor={detalhe.resumo_logistico?.rota} mono />
                      <Info label="Placa" valor={detalhe.resumo_logistico?.placa} mono />
                      <Info label="Transportadora" valor={detalhe.resumo_logistico?.transportadora} />
                      <Info label="Prazo Cliente" valor={detalhe.resumo_logistico?.prazo_cliente} />
                      <Info label="Data de Coleta" valor={detalhe.resumo_logistico?.data_coleta} />
                      <Info label="Data de Criação" valor={detalhe.resumo_logistico?.data_criacao} />
                      <Info label="Data de Aprovação" valor={detalhe.resumo_logistico?.data_aprovacao} />
                      <Info label="Ocorrências" valor={`${detalhe.resumo_logistico?.existem_ocorrencias || 'Não'} • ${detalhe.resumo_logistico?.quantidade_ocorrencias || '0'}`} />
                      <Info label="Última Ocorrência" valor={detalhe.resumo_logistico?.ultima_ocorrencia_status} />
                      <Info label="Mensagem da Ocorrência" valor={detalhe.resumo_logistico?.ultima_ocorrencia_mensagem} />
                    </div>
                  </SecaoDetalhe>

                  <SecaoDetalhe titulo="Destino">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <Info label="Endereço" valor={detalhe.resumo_logistico?.endereco_completo} />
                      <Info label="Cidade / UF" valor={[detalhe.resumo_logistico?.cidade, detalhe.resumo_logistico?.uf].filter(Boolean).join(' - ')} />
                      <Info label="CEP" valor={detalhe.resumo_logistico?.cep} mono />
                    </div>
                  </SecaoDetalhe>

                  <SecaoDetalhe titulo="Relatório logístico completo">
                    <p className="text-xs font-semibold text-gray-400 mb-4">Todos os campos recebidos no arquivo da plataforma logística são preservados abaixo.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 divide-y sm:divide-y-0">
                      {Object.entries(detalhe.dados_logistica || {}).map(([chave, valor]) => (
                        <div key={chave} className="py-3 border-b border-gray-100 min-w-0">
                          <Info label={chave} valor={valor} />
                        </div>
                      ))}
                    </div>
                  </SecaoDetalhe>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
