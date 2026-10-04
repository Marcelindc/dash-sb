import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { AlertCircle, CheckCircle, Download, KeyRound, Loader2, RefreshCw, Search, UserPlus } from 'lucide-react';

// Acessos da campanha (só o dono): cria o login dos consultores de ER e Loja (ou de quem
// mais for marcado) no padrão combinado e gera a planilha com login e senha para repassar.
// Quem entra com esse login vê só a Campanha Incentivo 2026, e só o próprio resultado.

const GRUPOS_PADRAO = ['ER', 'Loja'];
const SITUACAO = {
  novo: { texto: 'Novo', classe: 'bg-[#e3f3f3] text-[#036b70]' },
  ja_tem_acesso: { texto: 'Já tem acesso', classe: 'bg-green-50 text-green-700' },
  sem_id: { texto: 'Sem ID no cadastro', classe: 'bg-red-50 text-red-700' },
};

const semAcento = (texto) => String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function baixarPlanilha(linhas, nomeArquivo) {
  const cabecalho = ['Nome', 'Canal', 'Grupo', 'Unidade', 'ID', 'Login', 'Senha inicial'];
  const escapar = (valor) => `"${String(valor ?? '').replace(/"/g, '""')}"`;
  const corpo = linhas.map((l) => [l.nome, l.canal, l.grupo, l.unidade, l.id, l.login, l.senha].map(escapar).join(';'));
  const quebra = String.fromCharCode(13, 10);
  const conteudo = String.fromCharCode(0xFEFF) + [cabecalho.map(escapar).join(';'), ...corpo].join(quebra);
  const url = URL.createObjectURL(new Blob([conteudo], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function AcessosCampanha2026({ apiUrl }) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [grupos, setGrupos] = useState(() => new Set(GRUPOS_PADRAO));
  const [busca, setBusca] = useState('');
  const [marcados, setMarcados] = useState(() => new Set());
  const [criando, setCriando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const aplicar = useCallback((payload) => {
    setDados(payload);
    const novos = (payload?.candidatos || []).filter((c) => c.situacao === 'novo' && GRUPOS_PADRAO.includes(c.grupo));
    setMarcados(new Set(novos.map((c) => c.participante)));
  }, []);

  const recarregar = async () => {
    setCarregando(true);
    setErro('');
    try {
      const resposta = await axios.get(`${apiUrl}/campanha-incentivo-2026/acessos`, { params: { _t: Date.now() } });
      aplicar(resposta.data);
    } catch (e) {
      setErro(e?.response?.data?.detail || e?.message || 'Não foi possível carregar os consultores.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    let ativo = true;
    axios.get(`${apiUrl}/campanha-incentivo-2026/acessos`, { params: { _t: Date.now() } })
      .then((r) => { if (ativo) aplicar(r.data); })
      .catch((e) => { if (ativo) setErro(e?.response?.data?.detail || e?.message || 'Não foi possível carregar os consultores.'); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [apiUrl, aplicar]);

  const candidatos = useMemo(() => dados?.candidatos || [], [dados]);
  const todosGrupos = useMemo(() => Array.from(new Set(candidatos.map((c) => c.grupo))).sort((a, b) => {
    const ordem = ['ER', 'Loja', 'Força de vendas', 'Equipe de campo'];
    return (ordem.indexOf(a) + 1 || 99) - (ordem.indexOf(b) + 1 || 99);
  }), [candidatos]);
  const termo = semAcento(busca.trim());
  const visiveis = candidatos.filter((c) => grupos.has(c.grupo) && (!termo || semAcento(`${c.nome} ${c.unidade} ${c.login}`).includes(termo)));
  const novosVisiveis = visiveis.filter((c) => c.situacao === 'novo');
  const escolhidos = candidatos.filter((c) => marcados.has(c.participante) && c.situacao === 'novo');

  const alternarGrupo = (grupo) => setGrupos((atual) => {
    const novo = new Set(atual);
    if (novo.has(grupo)) novo.delete(grupo); else novo.add(grupo);
    return novo;
  });
  const alternarMarcado = (chave) => setMarcados((atual) => {
    const novo = new Set(atual);
    if (novo.has(chave)) novo.delete(chave); else novo.add(chave);
    return novo;
  });
  const marcarVisiveis = (marcar) => setMarcados((atual) => {
    const novo = new Set(atual);
    novosVisiveis.forEach((c) => (marcar ? novo.add(c.participante) : novo.delete(c.participante)));
    return novo;
  });

  const criar = async () => {
    if (!escolhidos.length) return;
    const ok = window.confirm(`Criar ${escolhidos.length} acesso(s) da campanha?\n\nCada consultor vai entrar com o login e a senha mostrados na lista e verá só a Campanha Incentivo 2026 (o próprio resultado e o total da unidade), quando a campanha estiver liberada.`);
    if (!ok) return;
    setCriando(true);
    setErro('');
    try {
      const resposta = await axios.post(`${apiUrl}/campanha-incentivo-2026/acessos/gerar`, { participantes: escolhidos.map((c) => c.participante) });
      setResultado(resposta.data);
      if (resposta.data?.criados?.length) baixarPlanilha(resposta.data.criados, `acessos-campanha-${new Date().toISOString().slice(0, 10)}.csv`);
      await recarregar();
    } catch (e) {
      setErro(e?.response?.data?.detail || e?.message || 'Não foi possível criar os acessos.');
    } finally {
      setCriando(false);
    }
  };

  if (carregando && !dados) {
    return (
      <div className="rounded-[24px] bg-white border border-gray-100 p-10 text-center shadow-sm">
        <Loader2 size={26} className="mx-auto animate-spin text-[#048187]" />
        <p className="mt-3 text-sm font-semibold text-gray-700">Carregando consultores da campanha...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[24px] bg-white border border-gray-100 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 flex items-center gap-2"><KeyRound size={16} className="text-[#048187]" /> Acessos dos consultores à campanha</p>
            <p className="mt-1 text-xs text-slate-500 max-w-3xl">
              Quem entrar com esses logins vê <strong className="font-semibold text-slate-700">só a Campanha Incentivo 2026</strong> (Visão Geral, Resultado Geral e o próprio resultado com o total da unidade), e só depois que você liberar a campanha.
            </p>
            {dados?.padrao && <p className="mt-1.5 text-[11px] text-slate-400">{dados.padrao}</p>}
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button type="button" onClick={() => baixarPlanilha(visiveis.filter((c) => c.login), `logins-campanha-${new Date().toISOString().slice(0, 10)}.csv`)} disabled={!visiveis.some((c) => c.login)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:border-[#048187] hover:text-[#048187] disabled:opacity-50">
              <Download size={14} /> Baixar planilha da lista
            </button>
            <button type="button" onClick={recarregar} disabled={carregando}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:border-[#048187] hover:text-[#048187] disabled:opacity-50">
              <RefreshCw size={14} className={carregando ? 'animate-spin' : ''} /> Atualizar
            </button>
          </div>
        </div>
        {erro && <p className="mt-3 text-xs font-medium text-[#b42335] flex items-center gap-1.5"><AlertCircle size={14} /> {erro}</p>}
        {resultado && (
          <div className="mt-3 rounded-xl border border-green-100 bg-green-50 px-3 py-2.5 text-xs text-green-800 flex flex-wrap items-center gap-2">
            <CheckCircle size={15} />
            <span><strong className="font-semibold">{resultado.criados?.length || 0} acesso(s) criado(s).</strong> A planilha com login e senha foi baixada.{resultado.ignorados?.length ? ` ${resultado.ignorados.length} já tinham acesso.` : ''}</span>
            {resultado.criados?.length > 0 && (
              <button type="button" onClick={() => baixarPlanilha(resultado.criados, `acessos-campanha-${new Date().toISOString().slice(0, 10)}.csv`)} className="ml-auto inline-flex items-center gap-1 rounded-lg bg-white border border-green-200 px-2.5 py-1 font-medium hover:bg-green-100">
                <Download size={13} /> Baixar de novo
              </button>
            )}
          </div>
        )}
      </section>

      <section className="rounded-[24px] bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex flex-wrap gap-1.5">
            {todosGrupos.map((g) => {
              const total = candidatos.filter((c) => c.grupo === g).length;
              const ativo = grupos.has(g);
              return (
                <button key={g} type="button" onClick={() => alternarGrupo(g)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${ativo ? 'bg-[#048187] border-[#048187] text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-[#048187]'}`}>
                  {g} ({total})
                </button>
              );
            })}
          </div>
          <label className="relative lg:ml-auto lg:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar nome, unidade ou login" className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#048187]/25" />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-[13px]">
            <thead className="bg-[#f7faf9] text-[11px] uppercase tracking-[0.04em] text-slate-400">
              <tr>
                <th className="px-4 py-2.5 text-left w-10">
                  <input type="checkbox" aria-label="Marcar todos os novos da lista" checked={novosVisiveis.length > 0 && novosVisiveis.every((c) => marcados.has(c.participante))} onChange={(e) => marcarVisiveis(e.target.checked)} className="accent-[#048187]" />
                </th>
                <th className="px-3 py-2.5 text-left font-medium">Consultor</th>
                <th className="px-3 py-2.5 text-left font-medium">Grupo • unidade</th>
                <th className="px-3 py-2.5 text-left font-medium">Login</th>
                <th className="px-3 py-2.5 text-left font-medium">Senha inicial</th>
                <th className="px-3 py-2.5 text-left font-medium">Situação</th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((c) => {
                const situacao = SITUACAO[c.situacao] || SITUACAO.novo;
                const marcavel = c.situacao === 'novo';
                return (
                  <tr key={c.participante} className="border-t border-slate-100 hover:bg-[#fafcfc]">
                    <td className="px-4 py-2.5">
                      <input type="checkbox" disabled={!marcavel} checked={marcavel && marcados.has(c.participante)} onChange={() => alternarMarcado(c.participante)} aria-label={`Marcar ${c.nome}`} className="accent-[#048187] disabled:opacity-30" />
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-slate-700">{c.nome}</p>
                      <p className="text-[11px] text-slate-400">ID {c.id || '—'}{c.outro_login ? ` • já entra no DASH como ${c.outro_login}` : ''}</p>
                    </td>
                    <td className="px-3 py-2.5 text-slate-500"><span className="font-medium text-slate-600">{c.grupo}</span> • {c.unidade}</td>
                    <td className="px-3 py-2.5 font-mono text-[12px] text-slate-700">{c.login || '—'}</td>
                    <td className="px-3 py-2.5 font-mono text-[12px] text-slate-700">{c.senha || '—'}</td>
                    <td className="px-3 py-2.5"><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${situacao.classe}`}>{situacao.texto}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!visiveis.length && <p className="p-8 text-center text-sm text-slate-400">Ninguém na lista com esses filtros.</p>}
        </div>

        <div className="sticky bottom-0 flex flex-col sm:flex-row sm:items-center gap-2 justify-between border-t border-slate-100 bg-white/95 backdrop-blur px-4 sm:px-5 py-3">
          <p className="text-xs text-slate-500">{escolhidos.length ? `${escolhidos.length} consultor(es) marcado(s) para receber acesso.` : 'Marque quem deve receber acesso.'}</p>
          <button type="button" onClick={criar} disabled={!escolhidos.length || criando}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#048187] px-4 py-2 text-xs font-medium text-white hover:bg-[#036b70] disabled:opacity-50">
            {criando ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />} Criar {escolhidos.length || ''} acesso(s) e baixar planilha
          </button>
        </div>
      </section>
    </div>
  );
}
