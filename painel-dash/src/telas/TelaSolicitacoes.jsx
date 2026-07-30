import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Download,
  FileText,
  Inbox,
  LifeBuoy,
  Loader2,
  MessageSquare,
  Paperclip,
  Plus,
  RefreshCcw,
  Search,
  Send,
  ShieldCheck,
  Upload,
  User,
  X,
} from 'lucide-react';

const STATUS = {
  aberto: { label: 'Aberto', cls: 'bg-blue-50 text-blue-700 border-blue-100' },
  em_analise: { label: 'Em Análise', cls: 'bg-amber-50 text-amber-700 border-amber-100' },
  aguardando_usuario: { label: 'Aguardando usuário', cls: 'bg-purple-50 text-purple-700 border-purple-100' },
  concluido: { label: 'Concluído', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  cancelado: { label: 'Cancelado', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
};

const PRIORIDADES = {
  baixa: { label: 'Baixa', cls: 'text-gray-500 bg-gray-50' },
  normal: { label: 'Normal', cls: 'text-[#048187] bg-[#e6f6f7]' },
  alta: { label: 'Alta', cls: 'text-orange-700 bg-orange-50' },
  urgente: { label: 'Urgente', cls: 'text-red-700 bg-red-50' },
};

const CATEGORIAS = {
  erro: 'Erro',
  duvida: 'Dúvida',
  ajuste: 'Ajuste',
  acesso: 'Acesso',
  base_dados: 'Base de dados',
  melhoria: 'Melhoria',
  outros: 'Outros',
};

const FORM_INICIAL = {
  assunto: '',
  categoria: 'erro',
  descricao: '',
  prioridade: 'normal',
  area: 'VD',
  anexo: null,
};

const formatarDataHora = (valor) => {
  if (!valor) return '-';
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(valor));
  } catch {
    return String(valor);
  }
};

const formatarTamanho = (bytes) => {
  const n = Number(bytes || 0);
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
};

const obterIdNotificacao = () => {
  try {
    const valor = sessionStorage.getItem('dashSbSolicitacaoAbrirId');
    sessionStorage.removeItem('dashSbSolicitacaoAbrirId');
    return valor ? Number(valor) : null;
  } catch {
    return null;
  }
};

const BadgeStatus = ({ status }) => {
  const cfg = STATUS[status] || STATUS.aberto;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-black uppercase whitespace-nowrap ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

const CardResumo = ({ titulo, valor, icone: Icone, destaque = false, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`text-left bg-white rounded-2xl border p-4 sm:p-5 shadow-sm transition-all hover:shadow-md ${destaque ? 'border-[#048187]/30 ring-2 ring-[#048187]/5' : 'border-gray-100'}`}
  >
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[10px] uppercase font-black tracking-wide text-gray-400 truncate">{titulo}</p>
        <p className={`text-2xl sm:text-3xl font-black mt-1 ${destaque ? 'text-[#048187]' : 'text-gray-700'}`}>{Number(valor || 0).toLocaleString('pt-BR')}</p>
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${destaque ? 'bg-[#e6f6f7] text-[#048187]' : 'bg-gray-50 text-gray-500'}`}>
        <Icone size={21} />
      </div>
    </div>
  </button>
);

export default function TelaSolicitacoes({ API_URL, usuarioLogado, onNotificacoesAtualizadas }) {
  const admin = String(usuarioLogado?.perfil || '').toLowerCase() === 'admin';
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [resumo, setResumo] = useState({ contagens: {}, total: 0, mensagens_nao_lidas: 0 });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [modalNovaAberto, setModalNovaAberto] = useState(false);
  const [form, setForm] = useState(() => ({
    ...FORM_INICIAL,
    area: String(usuarioLogado?.area_gestao || '').toUpperCase() === 'LOJA' ? 'LOJA' : 'VD',
  }));
  const [salvandoNova, setSalvandoNova] = useState(false);
  const [filtros, setFiltros] = useState({ status: '', categoria: '', prioridade: '', area: '', busca: '' });
  const [ticketSelecionado, setTicketSelecionado] = useState(null);
  const [detalhe, setDetalhe] = useState(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const [mensagemChat, setMensagemChat] = useState('');
  const [anexoChat, setAnexoChat] = useState(null);
  const [enviandoMensagem, setEnviandoMensagem] = useState(false);
  const [alterandoStatus, setAlterandoStatus] = useState(false);
  const [baixandoAnexo, setBaixandoAnexo] = useState(null);
  const arquivoNovaRef = useRef(null);
  const arquivoChatRef = useRef(null);
  const chatFinalRef = useRef(null);
  const ticketNotificacaoInicialRef = useRef(obterIdNotificacao());

  const paramsListagem = useMemo(() => {
    const params = { limite: 200 };
    Object.entries(filtros).forEach(([chave, valor]) => {
      if (String(valor || '').trim()) params[chave] = String(valor).trim();
    });
    return params;
  }, [filtros]);

  const carregarResumo = async () => {
    const { data } = await axios.get(`${API_URL}/solicitacoes/resumo`);
    setResumo(data || { contagens: {}, total: 0, mensagens_nao_lidas: 0 });
  };

  const carregarLista = async (silencioso = false) => {
    if (!silencioso) setCarregando(true);
    setErro('');
    try {
      const [{ data }] = await Promise.all([
        axios.get(`${API_URL}/solicitacoes`, { params: paramsListagem }),
        carregarResumo(),
      ]);
      setSolicitacoes(Array.isArray(data?.solicitacoes) ? data.solicitacoes : []);
    } catch (e) {
      if (!silencioso) setErro(e.response?.data?.detail || 'Não foi possível carregar as solicitações.');
    } finally {
      if (!silencioso) setCarregando(false);
    }
  };

  const abrirTicket = async (ticketOuId, silencioso = false) => {
    const id = Number(ticketOuId?.id || ticketOuId);
    if (!id) return;
    setTicketSelecionado(id);
    if (!silencioso) setCarregandoDetalhe(true);
    setErro('');
    try {
      const { data } = await axios.get(`${API_URL}/solicitacoes/${id}`);
      setDetalhe(data || null);
      await axios.post(`${API_URL}/solicitacoes/${id}/marcar-lida`).catch(() => null);
      setSolicitacoes((lista) => lista.map((item) => Number(item.id) === id ? { ...item, mensagens_nao_lidas: 0 } : item));
      carregarResumo().catch(() => null);
      onNotificacoesAtualizadas?.();
      window.setTimeout(() => chatFinalRef.current?.scrollIntoView({ behavior: 'smooth' }), 120);
    } catch (e) {
      setErro(e.response?.data?.detail || 'Não foi possível abrir a solicitação.');
    } finally {
      if (!silencioso) setCarregandoDetalhe(false);
    }
  };

  useEffect(() => {
    carregarLista(false).then(() => {
      const id = ticketNotificacaoInicialRef.current;
      if (id) abrirTicket(id, false);
      ticketNotificacaoInicialRef.current = null;
    });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => carregarLista(false), 250);
    return () => window.clearTimeout(timer);
  }, [paramsListagem]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      carregarLista(true);
      if (ticketSelecionado) abrirTicket(ticketSelecionado, true);
    }, 20000);
    return () => window.clearInterval(timer);
  }, [ticketSelecionado, paramsListagem]);

  const criarSolicitacao = async (e) => {
    e.preventDefault();
    setSalvandoNova(true);
    setErro('');
    setMensagemSucesso('');
    try {
      const dados = new FormData();
      dados.append('assunto', form.assunto);
      dados.append('categoria', form.categoria);
      dados.append('descricao', form.descricao);
      dados.append('prioridade', form.prioridade);
      dados.append('area', form.area);
      if (form.anexo) dados.append('anexo', form.anexo);
      const { data } = await axios.post(`${API_URL}/solicitacoes`, dados);
      setModalNovaAberto(false);
      setForm({ ...FORM_INICIAL, area: form.area });
      if (arquivoNovaRef.current) arquivoNovaRef.current.value = '';
      setMensagemSucesso(`${data?.numero_ticket || 'Solicitação'} criada com sucesso.`);
      await carregarLista(false);
      if (data?.solicitacao_id) await abrirTicket(data.solicitacao_id, false);
      onNotificacoesAtualizadas?.();
    } catch (e2) {
      setErro(e2.response?.data?.detail || 'Não foi possível criar a solicitação.');
    } finally {
      setSalvandoNova(false);
    }
  };

  const enviarMensagem = async (e) => {
    e.preventDefault();
    if (!ticketSelecionado || (!mensagemChat.trim() && !anexoChat)) return;
    setEnviandoMensagem(true);
    setErro('');
    try {
      const dados = new FormData();
      dados.append('mensagem', mensagemChat.trim());
      if (anexoChat) dados.append('anexo', anexoChat);
      await axios.post(`${API_URL}/solicitacoes/${ticketSelecionado}/mensagens`, dados);
      setMensagemChat('');
      setAnexoChat(null);
      if (arquivoChatRef.current) arquivoChatRef.current.value = '';
      await abrirTicket(ticketSelecionado, true);
      await carregarLista(true);
      onNotificacoesAtualizadas?.();
    } catch (e2) {
      setErro(e2.response?.data?.detail || 'Não foi possível enviar a mensagem.');
    } finally {
      setEnviandoMensagem(false);
    }
  };

  const alterarStatus = async (status) => {
    if (!admin || !ticketSelecionado) return;
    setAlterandoStatus(true);
    setErro('');
    try {
      await axios.put(`${API_URL}/solicitacoes/${ticketSelecionado}/status`, { status });
      await Promise.all([abrirTicket(ticketSelecionado, true), carregarLista(true)]);
      onNotificacoesAtualizadas?.();
    } catch (e) {
      setErro(e.response?.data?.detail || 'Não foi possível alterar o status.');
    } finally {
      setAlterandoStatus(false);
    }
  };

  const alterarPrioridade = async (prioridade) => {
    if (!admin || !ticketSelecionado) return;
    setErro('');
    try {
      await axios.put(`${API_URL}/solicitacoes/${ticketSelecionado}/prioridade`, { prioridade });
      await Promise.all([abrirTicket(ticketSelecionado, true), carregarLista(true)]);
    } catch (e) {
      setErro(e.response?.data?.detail || 'Não foi possível alterar a prioridade.');
    }
  };

  const baixarAnexo = async (anexo) => {
    setBaixandoAnexo(anexo.id);
    try {
      const resposta = await axios.get(`${API_URL}${anexo.url_download}`, { responseType: 'blob' });
      const url = URL.createObjectURL(resposta.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = anexo.nome_arquivo || 'anexo';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErro(e.response?.data?.detail || 'Não foi possível baixar o anexo.');
    } finally {
      setBaixandoAnexo(null);
    }
  };

  const ticketAtual = detalhe?.solicitacao || null;
  const mensagens = Array.isArray(detalhe?.mensagens) ? detalhe.mensagens : [];

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#048187] text-white flex items-center justify-center shrink-0">
              <LifeBuoy size={25} />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-700">Solicitações</h1>
              <p className="text-sm text-gray-400 font-semibold mt-1">
                {admin ? 'Painel geral de chamados, conversas e acompanhamento dos usuários.' : 'Abra chamados, converse com o administrador e acompanhe cada etapa.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => carregarLista(false)} className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-black text-sm hover:bg-gray-50">
              <RefreshCcw size={17} /> Atualizar
            </button>
            <button type="button" onClick={() => setModalNovaAberto(true)} className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-[#048187] text-white font-black text-sm hover:bg-[#036b70] shadow-sm">
              <Plus size={18} /> Nova solicitação
            </button>
          </div>
        </div>
      </section>

      {(erro || mensagemSucesso) && (
        <div className={`rounded-xl px-4 py-3 text-sm font-bold flex items-start gap-2 ${erro ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
          {erro ? <AlertCircle size={18} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={18} className="shrink-0 mt-0.5" />}
          <span>{erro || mensagemSucesso}</span>
          <button type="button" onClick={() => { setErro(''); setMensagemSucesso(''); }} className="ml-auto"><X size={16} /></button>
        </div>
      )}

      <section className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <CardResumo titulo="Todos" valor={resumo.total} icone={Inbox} destaque={!filtros.status} onClick={() => setFiltros((f) => ({ ...f, status: '' }))} />
        <CardResumo titulo="Abertos" valor={resumo.contagens?.aberto} icone={AlertCircle} destaque={filtros.status === 'aberto'} onClick={() => setFiltros((f) => ({ ...f, status: 'aberto' }))} />
        <CardResumo titulo="Em análise" valor={resumo.contagens?.em_analise} icone={Clock} destaque={filtros.status === 'em_analise'} onClick={() => setFiltros((f) => ({ ...f, status: 'em_analise' }))} />
        <CardResumo titulo="Aguardando" valor={resumo.contagens?.aguardando_usuario} icone={MessageSquare} destaque={filtros.status === 'aguardando_usuario'} onClick={() => setFiltros((f) => ({ ...f, status: 'aguardando_usuario' }))} />
        <CardResumo titulo="Concluídos" valor={resumo.contagens?.concluido} icone={CheckCircle2} destaque={filtros.status === 'concluido'} onClick={() => setFiltros((f) => ({ ...f, status: 'concluido' }))} />
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 bg-[#fbfdfd]">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
            <div className="xl:col-span-2 relative">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={filtros.busca} onChange={(e) => setFiltros((f) => ({ ...f, busca: e.target.value }))} placeholder="Buscar ticket, assunto ou solicitante..." className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-3 text-sm outline-none focus:border-[#048187]" />
            </div>
            <select value={filtros.status} onChange={(e) => setFiltros((f) => ({ ...f, status: e.target.value }))} className="border border-gray-200 rounded-xl px-3 py-3 text-sm font-bold text-gray-600 outline-none focus:border-[#048187]">
              <option value="">Todos os status</option>
              {Object.entries(STATUS).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}
            </select>
            <select value={filtros.categoria} onChange={(e) => setFiltros((f) => ({ ...f, categoria: e.target.value }))} className="border border-gray-200 rounded-xl px-3 py-3 text-sm font-bold text-gray-600 outline-none focus:border-[#048187]">
              <option value="">Todas as categorias</option>
              {Object.entries(CATEGORIAS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
            <select value={filtros.prioridade} onChange={(e) => setFiltros((f) => ({ ...f, prioridade: e.target.value }))} className="border border-gray-200 rounded-xl px-3 py-3 text-sm font-bold text-gray-600 outline-none focus:border-[#048187]">
              <option value="">Todas as prioridades</option>
              {Object.entries(PRIORIDADES).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}
            </select>
            {admin ? (
              <select value={filtros.area} onChange={(e) => setFiltros((f) => ({ ...f, area: e.target.value }))} className="border border-gray-200 rounded-xl px-3 py-3 text-sm font-bold text-gray-600 outline-none focus:border-[#048187]">
                <option value="">VD + LOJA</option>
                <option value="VD">VD</option>
                <option value="LOJA">LOJA</option>
              </select>
            ) : <div />}
          </div>
        </div>

        {carregando ? (
          <div className="p-12 flex items-center justify-center gap-3 text-gray-400 font-black"><Loader2 size={22} className="animate-spin" /> Carregando solicitações...</div>
        ) : solicitacoes.length === 0 ? (
          <div className="p-14 text-center"><Inbox size={42} className="mx-auto text-gray-300" /><h3 className="font-black text-gray-600 mt-4">Nenhuma solicitação encontrada</h3><p className="text-sm text-gray-400 font-semibold mt-1">Abra uma nova solicitação ou ajuste os filtros.</p></div>
        ) : (
          <div className="divide-y divide-gray-100">
            {solicitacoes.map((item) => (
              <button key={item.id} type="button" onClick={() => abrirTicket(item)} className="w-full text-left p-4 sm:p-5 hover:bg-[#f7fcfc] transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-[#048187] text-sm">{item.numero_ticket}</span>
                      <BadgeStatus status={item.status} />
                      <span className={`px-2 py-1 rounded-full text-[9px] uppercase font-black ${PRIORIDADES[item.prioridade]?.cls || PRIORIDADES.normal.cls}`}>{item.prioridade_label || PRIORIDADES[item.prioridade]?.label}</span>
                      <span className="px-2 py-1 rounded-full text-[9px] uppercase font-black bg-gray-100 text-gray-500">{item.area}</span>
                      {Number(item.mensagens_nao_lidas || 0) > 0 && <span className="min-w-6 h-6 px-1.5 rounded-full bg-[#7c1f31] text-white text-[10px] font-black inline-flex items-center justify-center">{item.mensagens_nao_lidas}</span>}
                    </div>
                    <h3 className="font-black text-gray-700 mt-2 truncate">{item.assunto}</h3>
                    <p className="text-xs text-gray-400 font-semibold mt-1 truncate">{item.categoria_label} {admin ? `• ${item.solicitante_nome} • ${item.solicitante_email}` : ''}</p>
                  </div>
                  <div className="lg:text-right shrink-0">
                    <p className="text-[10px] uppercase font-black text-gray-400">Última atualização</p>
                    <p className="text-xs font-black text-gray-600 mt-1">{formatarDataHora(item.atualizado_em)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {ticketSelecionado && (
        <div className="fixed inset-0 z-[10050] bg-black/40 backdrop-blur-[1px] flex items-end sm:items-center justify-center p-0 sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) { setTicketSelecionado(null); setDetalhe(null); } }}>
          <div className="bg-white w-full sm:max-w-6xl h-[96dvh] sm:h-[90dvh] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <header className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-white flex items-start justify-between gap-3 shrink-0">
              <div className="flex items-start gap-3 min-w-0">
                <button type="button" onClick={() => { setTicketSelecionado(null); setDetalhe(null); }} className="w-10 h-10 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 flex items-center justify-center shrink-0"><ChevronLeft size={20} /></button>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[#048187] font-black text-sm">{ticketAtual?.numero_ticket || 'Solicitação'}</span>
                    {ticketAtual && <BadgeStatus status={ticketAtual.status} />}
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-gray-700 mt-1 truncate">{ticketAtual?.assunto || 'Carregando...'}</h2>
                  {ticketAtual && <p className="text-xs text-gray-400 font-semibold mt-1">{ticketAtual.solicitante_nome} • {ticketAtual.area} • Criado em {formatarDataHora(ticketAtual.criado_em)}</p>}
                </div>
              </div>
              <button type="button" onClick={() => { setTicketSelecionado(null); setDetalhe(null); }} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 shrink-0"><X size={20} /></button>
            </header>

            {carregandoDetalhe || !ticketAtual ? (
              <div className="flex-1 flex items-center justify-center gap-3 text-gray-400 font-black"><Loader2 size={22} className="animate-spin" /> Abrindo solicitação...</div>
            ) : (
              <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[290px_1fr]">
                <aside className="border-r border-gray-100 bg-[#fafcfc] p-4 sm:p-5 overflow-y-auto">
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                      <p className="text-[10px] uppercase font-black text-gray-400">Status</p>
                      {admin ? (
                        <select disabled={alterandoStatus} value={ticketAtual.status} onChange={(e) => alterarStatus(e.target.value)} className="w-full mt-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-black text-gray-700 outline-none focus:border-[#048187] disabled:opacity-50">
                          {Object.entries(STATUS).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}
                        </select>
                      ) : <div className="mt-2"><BadgeStatus status={ticketAtual.status} /></div>}
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                      <p className="text-[10px] uppercase font-black text-gray-400">Prioridade</p>
                      {admin ? (
                        <select value={ticketAtual.prioridade} onChange={(e) => alterarPrioridade(e.target.value)} className="w-full mt-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-black text-gray-700 outline-none focus:border-[#048187]">
                          {Object.entries(PRIORIDADES).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}
                        </select>
                      ) : <span className={`inline-flex mt-2 px-2.5 py-1 rounded-full text-[10px] uppercase font-black ${PRIORIDADES[ticketAtual.prioridade]?.cls}`}>{ticketAtual.prioridade_label}</span>}
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
                      <div><p className="text-[10px] uppercase font-black text-gray-400">Categoria</p><p className="text-sm font-black text-gray-700 mt-1">{ticketAtual.categoria_label}</p></div>
                      <div><p className="text-[10px] uppercase font-black text-gray-400">Solicitante</p><p className="text-sm font-black text-gray-700 mt-1 break-words">{ticketAtual.solicitante_nome}</p><p className="text-xs text-gray-400 font-semibold break-all">{ticketAtual.solicitante_email}</p></div>
                      <div><p className="text-[10px] uppercase font-black text-gray-400">Atualizado</p><p className="text-xs font-black text-gray-600 mt-1">{formatarDataHora(ticketAtual.atualizado_em)}</p></div>
                    </div>
                    {admin && <div className="rounded-xl bg-[#e6f6f7] text-[#048187] p-4 text-xs font-bold leading-relaxed flex gap-2"><ShieldCheck size={18} className="shrink-0" />Somente administradores podem alterar status e prioridade.</div>}
                  </div>
                </aside>

                <main className="min-h-0 flex flex-col bg-[#f7fafb]">
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                    {mensagens.map((item) => {
                      const minhaMensagem = Number(item.usuario_id) === Number(usuarioLogado?.id);
                      const sistema = item.tipo === 'status';
                      if (sistema) {
                        return <div key={item.id} className="flex justify-center"><div className="px-4 py-2 rounded-full bg-gray-100 text-gray-500 text-xs font-black text-center">{item.mensagem} • {formatarDataHora(item.criado_em)}</div></div>;
                      }
                      return (
                        <div key={item.id} className={`flex ${minhaMensagem ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[92%] sm:max-w-[78%] rounded-2xl p-4 shadow-sm border ${minhaMensagem ? 'bg-[#048187] text-white border-[#048187]' : 'bg-white text-gray-700 border-gray-100'}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${minhaMensagem ? 'bg-white/15' : 'bg-[#e6f6f7] text-[#048187]'}`}><User size={14} /></div>
                              <div className="min-w-0"><p className="text-xs font-black truncate">{item.nome_usuario}</p><p className={`text-[9px] font-bold uppercase ${minhaMensagem ? 'text-white/70' : 'text-gray-400'}`}>{item.perfil_usuario === 'admin' ? 'Administrador' : 'Usuário'} • {formatarDataHora(item.criado_em)}</p></div>
                            </div>
                            <p className="text-sm font-medium whitespace-pre-wrap break-words leading-relaxed">{item.mensagem}</p>
                            {Array.isArray(item.anexos) && item.anexos.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {item.anexos.map((anexo) => (
                                  <button key={anexo.id} type="button" onClick={() => baixarAnexo(anexo)} className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left ${minhaMensagem ? 'bg-white/10 hover:bg-white/15' : 'bg-gray-50 hover:bg-gray-100'}`}>
                                    {baixandoAnexo === anexo.id ? <Loader2 size={17} className="animate-spin shrink-0" /> : <FileText size={17} className="shrink-0" />}
                                    <div className="min-w-0 flex-1"><p className="text-xs font-black truncate">{anexo.nome_arquivo}</p><p className={`text-[9px] font-bold ${minhaMensagem ? 'text-white/70' : 'text-gray-400'}`}>{formatarTamanho(anexo.tamanho)}</p></div>
                                    <Download size={16} className="shrink-0" />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatFinalRef} />
                  </div>

                  <form onSubmit={enviarMensagem} className="p-3 sm:p-4 bg-white border-t border-gray-100 shrink-0">
                    {anexoChat && <div className="mb-2 inline-flex items-center gap-2 bg-[#e6f6f7] text-[#048187] px-3 py-2 rounded-xl text-xs font-black max-w-full"><Paperclip size={15} className="shrink-0" /><span className="truncate">{anexoChat.name}</span><button type="button" onClick={() => { setAnexoChat(null); if (arquivoChatRef.current) arquivoChatRef.current.value = ''; }}><X size={15} /></button></div>}
                    <div className="flex items-end gap-2">
                      <label className="w-11 h-11 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 flex items-center justify-center cursor-pointer shrink-0" title="Anexar arquivo"><Paperclip size={19} /><input ref={arquivoChatRef} type="file" accept=".png,.jpg,.jpeg,.webp,.pdf,.xlsx,.xls,.txt" className="hidden" onChange={(e) => setAnexoChat(e.target.files?.[0] || null)} /></label>
                      <textarea value={mensagemChat} onChange={(e) => setMensagemChat(e.target.value)} placeholder="Digite sua mensagem..." rows={2} maxLength={6000} className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#048187]" />
                      <button disabled={enviandoMensagem || (!mensagemChat.trim() && !anexoChat)} type="submit" className="w-11 h-11 rounded-xl bg-[#048187] text-white hover:bg-[#036b70] flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">{enviandoMensagem ? <Loader2 size={19} className="animate-spin" /> : <Send size={19} />}</button>
                    </div>
                  </form>
                </main>
              </div>
            )}
          </div>
        </div>
      )}

      {modalNovaAberto && (
        <div className="fixed inset-0 z-[10060] bg-black/40 flex items-center justify-center p-4" onMouseDown={(e) => { if (e.target === e.currentTarget && !salvandoNova) setModalNovaAberto(false); }}>
          <form onSubmit={criarSolicitacao} className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92dvh] overflow-y-auto">
            <header className="px-5 sm:px-6 py-5 border-b border-gray-100 flex items-center justify-between gap-3 sticky top-0 bg-white z-10">
              <div><h2 className="text-xl font-black text-gray-700">Nova solicitação</h2><p className="text-xs text-gray-400 font-semibold mt-1">O solicitante e a data serão registrados automaticamente.</p></div>
              <button type="button" onClick={() => setModalNovaAberto(false)} disabled={salvandoNova} className="w-10 h-10 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center"><X size={20} /></button>
            </header>
            <div className="p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2"><label className="text-[10px] uppercase font-black text-gray-400">Assunto</label><input required minLength={4} maxLength={180} value={form.assunto} onChange={(e) => setForm((f) => ({ ...f, assunto: e.target.value }))} placeholder="Ex.: Erro na meta da minha estrutura" className="w-full mt-2 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#048187]" /></div>
                <div><label className="text-[10px] uppercase font-black text-gray-400">Categoria</label><select value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))} className="w-full mt-2 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-600 outline-none focus:border-[#048187]">{Object.entries(CATEGORIAS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></div>
                <div><label className="text-[10px] uppercase font-black text-gray-400">Prioridade</label><select value={form.prioridade} onChange={(e) => setForm((f) => ({ ...f, prioridade: e.target.value }))} className="w-full mt-2 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-600 outline-none focus:border-[#048187]">{Object.entries(PRIORIDADES).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}</select></div>
                <div><label className="text-[10px] uppercase font-black text-gray-400">Área</label><select value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))} className="w-full mt-2 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-600 outline-none focus:border-[#048187]"><option value="VD">VD</option><option value="LOJA">LOJA</option></select></div>
                <div><label className="text-[10px] uppercase font-black text-gray-400">Solicitante</label><div className="mt-2 border border-gray-100 bg-gray-50 rounded-xl px-4 py-3"><p className="text-sm font-black text-gray-700 truncate">{usuarioLogado?.nome}</p><p className="text-xs text-gray-400 truncate">{usuarioLogado?.email}</p></div></div>
                <div className="sm:col-span-2"><label className="text-[10px] uppercase font-black text-gray-400">Descrição</label><textarea required minLength={5} maxLength={6000} rows={6} value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} placeholder="Explique o que aconteceu, em qual tela e qual resultado você esperava..." className="w-full mt-2 resize-y border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#048187]" /></div>
                <div className="sm:col-span-2"><label className="text-[10px] uppercase font-black text-gray-400">Anexo opcional</label><label className="mt-2 border-2 border-dashed border-gray-200 hover:border-[#5bb2b4] rounded-xl p-5 flex items-center gap-3 cursor-pointer"><div className="w-11 h-11 bg-[#e6f6f7] text-[#048187] rounded-xl flex items-center justify-center"><Upload size={20} /></div><div className="min-w-0"><p className="text-sm font-black text-gray-700 truncate">{form.anexo?.name || 'Selecionar print ou documento'}</p><p className="text-xs text-gray-400 font-semibold mt-0.5">PNG, JPG, WEBP, PDF, XLSX, XLS ou TXT — até 8 MB</p></div><input ref={arquivoNovaRef} type="file" accept=".png,.jpg,.jpeg,.webp,.pdf,.xlsx,.xls,.txt" className="hidden" onChange={(e) => setForm((f) => ({ ...f, anexo: e.target.files?.[0] || null }))} /></label></div>
              </div>
            </div>
            <footer className="px-5 sm:px-6 py-4 border-t border-gray-100 flex justify-end gap-2 sticky bottom-0 bg-white"><button type="button" onClick={() => setModalNovaAberto(false)} disabled={salvandoNova} className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-black text-sm">Cancelar</button><button type="submit" disabled={salvandoNova} className="px-5 py-3 rounded-xl bg-[#048187] text-white font-black text-sm inline-flex items-center gap-2 disabled:opacity-60">{salvandoNova ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} Criar solicitação</button></footer>
          </form>
        </div>
      )}
    </div>
  );
}
