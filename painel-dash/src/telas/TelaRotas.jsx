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
  // Data do pedido (aprovação), AAAA-MM-DD.
  data_inicio: '',
  data_fim: '',
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

const dataBR = (iso) => (iso ? String(iso).slice(0, 10).split('-').reverse().join('/') : '');

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
  // Rastreio aberto em tela cheia: { pedido, url, nome, status } (url vazia enquanto busca).
  const [rastreio, setRastreio] = useState(null);
  const [erroRastreio, setErroRastreio] = useState('');
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
          data_inicio: filtros.data_inicio || undefined,
          data_fim: filtros.data_fim || undefined,
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
  }, [filtros.motorista, filtros.cidade, filtros.estrutura, filtros.status, filtros.busca, filtros.data_inicio, filtros.data_fim]);

  // Esc fecha o rastreio e volta para a lista.
  useEffect(() => {
    if (!rastreio) return undefined;
    const aoTecla = (evento) => { if (evento.key === 'Escape') setRastreio(null); };
    window.addEventListener('keydown', aoTecla);
    return () => window.removeEventListener('keydown', aoTecla);
  }, [rastreio]);

  const alterarFiltro = (campo, valor) => {
    setPagina(1);
    setFiltros((atual) => ({ ...atual, [campo]: valor }));
  };

  const limparFiltros = () => {
    setPagina(1);
    setFiltros(FILTROS_INICIAIS);
  };

  /** Abre o acompanhamento oficial do pedido em tela cheia. A lista já traz o link; senão busca o pedido. */
  const abrirPedido = async (item) => {
    const pedido = typeof item === 'string' ? item : item?.pedido;
    if (!pedido) return;
    setErroRastreio('');
    const conhecido = typeof item === 'object' ? item : {};
    setRastreio({ pedido, url: conhecido.rastreio || '', nome: conhecido.nome_revendedor || '', status: conhecido.status || '' });
    if (conhecido.rastreio) return;
    try {
      const resposta = await axios.get(`${API_URL}/rotas/pedido/${encodeURIComponent(pedido)}`);
      const dados = resposta.data || {};
      const url = dados.resumo_logistico?.rastreio || '';
      setRastreio((atual) => (atual?.pedido === pedido ? {
        ...atual,
        url,
        nome: atual.nome || dados.dados_comerciais?.nome_revendedor || '',
        status: atual.status || dados.resumo_logistico?.status || '',
      } : atual));
      if (!url) setErroRastreio('Este pedido ainda não tem link de rastreio na Plataforma Logística.');
    } catch (e) {
      setErroRastreio(e.response?.data?.detail || 'Não foi possível abrir o rastreio deste pedido.');
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
          data_inicio: filtros.data_inicio || undefined,
          data_fim: filtros.data_fim || undefined,
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
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
          <div className="xl:col-span-2">
            <label className="block text-[10px] font-black uppercase tracking-wide text-gray-400 mb-1.5">Data do pedido (aprovação)</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-gray-400">De</span>
                <input
                  type="date"
                  value={filtros.data_inicio}
                  min={base.data_inicio_relatorio || undefined}
                  max={filtros.data_fim || base.data_fim_relatorio || undefined}
                  onChange={(e) => alterarFiltro('data_inicio', e.target.value)}
                  aria-label="Data do pedido: de"
                  className="w-full border border-gray-200 rounded-lg pl-10 pr-2 py-2.5 text-sm font-bold text-gray-600 bg-white outline-none focus:border-[#048187]"
                />
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-gray-400">Até</span>
                <input
                  type="date"
                  value={filtros.data_fim}
                  min={filtros.data_inicio || base.data_inicio_relatorio || undefined}
                  max={base.data_fim_relatorio || undefined}
                  onChange={(e) => alterarFiltro('data_fim', e.target.value)}
                  aria-label="Data do pedido: até"
                  className="w-full border border-gray-200 rounded-lg pl-11 pr-2 py-2.5 text-sm font-bold text-gray-600 bg-white outline-none focus:border-[#048187]"
                />
              </div>
            </div>
          </div>
          <div className="xl:col-span-2">
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
            <p className="text-xs font-bold text-gray-400 mt-0.5">
              {Number(dados.total_filtrado || 0).toLocaleString('pt-BR')} pedido(s) encontrado(s)
              {(filtros.data_inicio || filtros.data_fim) && (
                <span className="text-[#048187]">
                  {' · '}
                  {filtros.data_inicio && filtros.data_fim
                    ? (filtros.data_inicio === filtros.data_fim ? `pedidos de ${dataBR(filtros.data_inicio)}` : `pedidos de ${dataBR(filtros.data_inicio)} a ${dataBR(filtros.data_fim)}`)
                    : filtros.data_inicio ? `pedidos a partir de ${dataBR(filtros.data_inicio)}` : `pedidos até ${dataBR(filtros.data_fim)}`}
                </span>
              )}
            </p>
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
                    <button type="button" onClick={() => abrirPedido(item)} title="Abrir o acompanhamento do pedido" className="font-black text-[#048187] hover:underline inline-flex items-center gap-1">
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
        <div className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-3 sm:p-6" style={{ margin: 0 }} onMouseDown={(e) => { if (e.target === e.currentTarget && !carregandoDiagnostico) setDiagnosticoAberto(false); }}>
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

      {rastreio && (
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col" style={{ margin: 0 }} role="dialog" aria-modal="true" aria-labelledby="rastreio-titulo">
          {/* DASH_SB_ROTAS_RASTREIO_EMBUTIDO_V2: só o acompanhamento oficial, em tela cheia, com X para voltar.
              margin 0: o space-y-5 da tela empurrava a camada fixa 20 px para baixo. */}
          <div className="shrink-0 border-b border-gray-100 px-3 sm:px-6 py-3 flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => setRastreio(null)}
              title="Voltar para a lista (Esc)"
              aria-label="Fechar o acompanhamento e voltar para a lista"
              className="w-10 h-10 rounded-xl bg-gray-50 text-gray-500 hover:bg-[#fff3f5] hover:text-[#7c1f31] flex items-center justify-center shrink-0 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-wide text-[#048187]">Rastreio oficial</p>
              <h2 id="rastreio-titulo" className="text-base sm:text-lg font-black text-gray-700 truncate"><span className="hidden sm:inline">Acompanhamento do pedido</span><span className="sm:hidden">Pedido</span> {rastreio.pedido}</h2>
              {(rastreio.nome || rastreio.status) && (
                <div className="mt-0.5 flex items-center gap-2 min-w-0">
                  {rastreio.status && <BadgeStatus status={rastreio.status} />}
                  {rastreio.nome && <span className="text-[11px] font-bold text-gray-400 truncate">{rastreio.nome}</span>}
                </div>
              )}
            </div>
            {rastreio.url && (
              <a
                href={rastreio.url}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl border border-[#cbe8ea] bg-[#f1fbfb] text-[#048187] text-xs font-black hover:bg-[#e6f6f7]"
              >
                <span className="hidden sm:inline">Abrir em nova guia</span> <ExternalLink size={14} />
              </a>
            )}
          </div>
          <div className="relative flex-1 min-h-0 bg-white">
            {rastreio.url ? (
              <iframe
                key={rastreio.url}
                src={rastreio.url}
                title={`Rastreio oficial do pedido ${rastreio.pedido}`}
                className="absolute inset-0 h-full w-full border-0 bg-white"
                loading="eager"
              />
            ) : erroRastreio ? (
              <div className="h-full flex items-center justify-center p-6">
                <div className="max-w-md text-center">
                  <AlertTriangle size={28} className="text-amber-500 mx-auto mb-3" />
                  <p className="text-sm font-bold text-gray-600">{erroRastreio}</p>
                  <button type="button" onClick={() => setRastreio(null)} className="mt-4 px-4 py-2.5 rounded-xl bg-[#e6f6f7] text-[#048187] text-xs font-black hover:bg-[#d8f0f1]">Voltar para a lista</button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center"><Loader2 size={28} className="animate-spin text-[#048187]" /></div>
            )}
          </div>
          {rastreio.url && (
            <div className="shrink-0 border-t border-gray-100 bg-[#f8fbfb] px-4 sm:px-6 py-2 flex items-center justify-between gap-4">
              <p className="text-[10px] font-semibold text-gray-400">Se o portal não carregar aqui dentro, use “Abrir em nova guia”.</p>
              <span className="hidden sm:inline text-[9px] font-black uppercase tracking-wide text-[#048187] whitespace-nowrap">Grupo Boticário</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
