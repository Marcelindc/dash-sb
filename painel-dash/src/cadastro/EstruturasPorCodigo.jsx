// Cadastro > Estruturas por código (16/11/2026).
// O Cód Estrutura do SGI é a identidade; o nome no DASH pode ser trocado quando precisar
// (vale do ciclo atual em diante; ciclos fechados mantêm o nome da época).
import { useMemo, useState } from 'react';
import {
  ArrowRightLeft, Ban, Check, ChevronDown, ClipboardPaste, Eye, History, Info, Link2, Pencil, Plus, Save, Search, Sparkles, Store, Trash2,
  TriangleAlert, UserPlus, UserRound, Users, X,
} from 'lucide-react';

import {
  FUNCOES_CONSULTOR, NUCLEOS, STATUS_CONSULTOR, TIPOS, calcularPendencias, compararListaSgi, consultorEmOutraEstrutura, formatarCodigo,
  formatarIdConsultor, idsDiferentesDaEstrutura, mesmoIdConsultor, nomeComparavel, nucleoCurto, somenteDigitos, tipoCurto,
} from './estruturasRegras';

// ---------- peças visuais ----------

const Etiqueta = ({ tom = 'cinza', children, titulo }) => {
  const tons = {
    cinza: 'bg-gray-100 text-gray-600',
    teal: 'bg-[#e6f6f7] text-[#036b70]',
    ambar: 'bg-amber-50 text-amber-700',
    verde: 'bg-green-50 text-green-700',
    vermelho: 'bg-red-50 text-red-600',
  };
  return <span title={titulo} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${tons[tom]}`}>{children}</span>;
};

const ChipCodigo = ({ codigo, aoRemover }) => (
  <span
    title={(codigo.nomes_vistos || []).length > 1 ? `Também veio como: ${codigo.nomes_vistos.filter((n) => n !== codigo.nome_sgi).join(' | ')}` : 'Nome que o SGI manda hoje'}
    className={`inline-flex max-w-full items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold ${codigo.veio_no_ciclo && !codigo.inativo ? 'bg-[#e6f6f7] text-[#036b70]' : 'bg-gray-100 text-gray-500'}`}
  >
    <b className="shrink-0">{codigo.cod_exibicao}</b>
    <span className="truncate font-medium opacity-80">{codigo.nome_sgi}</span>
    {codigo.inativo ? <span className="shrink-0 text-[10px] font-semibold text-gray-400">· inativo{codigo.inativo_desde ? ` desde ${codigo.inativo_desde}` : ''}</span>
      : !codigo.veio_no_ciclo && <span className="shrink-0 text-[10px] font-semibold text-amber-600">· não veio no ciclo</span>}
    {aoRemover && (
      <button type="button" onClick={aoRemover} className="shrink-0 opacity-50 hover:text-red-500 hover:opacity-100" aria-label={`Tirar o código ${codigo.cod_exibicao}`}><X size={12} /></button>
    )}
  </span>
);

const Bloco = ({ titulo, qtd, ajuda, children }) => (qtd ? (
  <div className="px-4 py-3">
    <p className="text-[12.5px] font-bold text-gray-700">{titulo} <span className="text-amber-600">({qtd})</span></p>
    {ajuda && <p className="mb-2 text-[11px] text-gray-400">{ajuda}</p>}
    <div className="space-y-2">{children}</div>
  </div>
) : null);

const Campo = ({ rotulo, ajuda, children }) => (
  <div><label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">{rotulo}</label>{children}{ajuda && <p className="mt-1 text-[11px] leading-4 text-gray-400">{ajuda}</p>}</div>
);
const Opcoes = ({ valor, opcoes, aoMudar }) => (
  <div className="flex flex-wrap gap-1.5">
    {opcoes.map((o) => (
      <button key={o.valor} type="button" onClick={() => aoMudar(o.valor)} className={`rounded-xl border px-3 py-2 text-[13px] font-semibold ${valor === o.valor ? 'border-[#048187] bg-[#e6f6f7] text-[#036b70]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{o.rotulo}</button>
    ))}
  </div>
);

// Corrige o ID do consultor para o que o SGI usa (mantém nome, função e situação do cadastro).
function corrigirIdConsultor(estrutura, item, acoes) {
  const consultor = (estrutura?.consultores || []).find((c) => mesmoIdConsultor(c.id_colaborador, item.id_cadastro));
  if (!consultor || !acoes?.editar) return Promise.resolve({ ok: false, erro: 'Consultor não encontrado nesta estrutura.' });
  if (!window.confirm(
    `Corrigir o ID de ${consultor.nome_exibicao || consultor.nome}: de ${formatarIdConsultor(item.id_cadastro)} para ${formatarIdConsultor(item.id_colaborador)} (como vem no SGI)?\n\n`
    + 'Os pedidos que o SGI fecha com esse ID passam a contar para essa pessoa.',
  )) return Promise.resolve(null);
  return acoes.editar(estrutura, consultor.id_colaborador, {
    nome: consultor.nome, nome_social: consultor.nome_social || '', funcao: consultor.funcao, status: consultor.status,
    novo_id_colaborador: item.id_colaborador,
  });
}

const TomFuncao = ({ funcao }) => (funcao === 'SUPERVISOR' ? <Etiqueta tom="teal">Supervisor</Etiqueta> : <Etiqueta>Consultor</Etiqueta>);
const TomStatus = ({ status }) => (status === 'ativo' ? null : <Etiqueta tom="ambar">{STATUS_CONSULTOR.find((s) => s.valor === status)?.rotulo || status}</Etiqueta>);

const CONSULTOR_VAZIO = { id_colaborador: '', nome: '', nome_social: '', funcao: 'CONSULTOR', status: 'ativo' };

function SecaoConsultores({ estrutura, dados, acoes }) {
  const [aviso, setAviso] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [novo, setNovo] = useState(null);
  const [editandoId, setEditandoId] = useState('');
  const [edicao, setEdicao] = useState(CONSULTOR_VAZIO);
  if (!estrutura?.id) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-[12.5px] text-gray-500">
        <p className="mb-1 flex items-center gap-1.5 font-bold text-gray-700"><Users size={15} className="text-[#048187]" />Consultores</p>
        Cadastre a estrutura primeiro; depois os consultores entram aqui mesmo.
      </div>
    );
  }
  const consultores = estrutura.consultores || [];
  const ativos = consultores.filter((c) => c.status === 'ativo').length;
  const idsErrados = idsDiferentesDaEstrutura(estrutura);
  const sugestoes = (estrutura.sugestoes_consultores || []).filter((s) => !idsErrados.some((x) => x.id_colaborador === s.id_colaborador));
  const jaAqui = novo && consultores.some((c) => mesmoIdConsultor(c.id_colaborador, novo.id_colaborador));
  const outra = novo && !jaAqui ? consultorEmOutraEstrutura(dados, novo.id_colaborador, estrutura.id) : null;

  const rodar = async (promessa, depois) => {
    setOcupado(true);
    setAviso(null);
    const r = await promessa;
    setOcupado(false);
    if (!r) return;
    setAviso(r.ok ? { tom: 'ok', texto: r.mensagem } : { tom: 'erro', texto: r.erro });
    if (r.ok && depois) depois();
  };
  const incluir = () => {
    if (!somenteDigitos(novo.id_colaborador) || (!outra && !novo.nome.trim())) {
      setAviso({ tom: 'erro', texto: 'Informe o ID do SGI e o nome.' });
      return;
    }
    rodar(acoes.incluir(estrutura, { ...novo, mover: Boolean(outra) }), () => setNovo(null));
  };
  const abrirEdicao = (c) => {
    setNovo(null);
    setEditandoId(c.id_colaborador);
    setEdicao({ id_colaborador: c.id_colaborador, nome: c.nome, nome_social: c.nome_social || '', funcao: c.funcao, status: c.status });
  };
  const salvarEdicao = (c) => {
    const corpo = { nome: edicao.nome, nome_social: edicao.nome_social, funcao: edicao.funcao, status: edicao.status };
    if (!mesmoIdConsultor(edicao.id_colaborador, c.id_colaborador)) corpo.novo_id_colaborador = edicao.id_colaborador;
    rodar(acoes.editar(estrutura, c.id_colaborador, corpo), () => setEditandoId(''));
  };
  const remover = (c) => {
    if (!window.confirm(`Tirar ${c.nome_exibicao || c.nome} da ${estrutura.nome}? O histórico dos ciclos anteriores continua.`)) return;
    rodar(acoes.remover(estrutura, c));
  };
  const campo = 'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#048187]';
  // O painel inteiro é um formulário: Enter aqui não pode salvar a estrutura.
  const enterFaz = (acao) => (e) => { if (e.key === 'Enter') { e.preventDefault(); acao?.(); } };

  return (
    <div className="space-y-3 rounded-2xl border border-gray-100 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[12.5px] font-bold text-gray-700"><Users size={15} className="text-[#048187]" />Consultores</p>
          <p className="mt-0.5 text-[11px] leading-4 text-gray-400">Quem tem resultado individual nesta estrutura. Cada mudança aqui é salva na hora.</p>
        </div>
        <span className="shrink-0 rounded-full bg-[#e6f6f7] px-2 py-0.5 text-[11px] font-semibold text-[#036b70]">{ativos} ativo(s)</span>
      </div>

      {aviso && <div className={`rounded-xl px-3 py-2 text-[12px] font-semibold ${aviso.tom === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{aviso.texto}</div>}

      {idsErrados.map((s) => (
        <div key={s.id_colaborador} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] text-amber-800">
          <p className="font-semibold"><TriangleAlert size={13} className="mr-1 inline -translate-y-px" />{s.nome}: o SGI fecha os pedidos com o ID {formatarIdConsultor(s.id_colaborador)}, mas no cadastro está {formatarIdConsultor(s.id_cadastro)}.</p>
          <p className="mt-0.5 text-[11px] text-amber-700/80">{s.pedidos} pedido(s) no ciclo não estão contando para essa pessoa.</p>
          <button type="button" disabled={ocupado} onClick={() => rodar(corrigirIdConsultor(estrutura, s, acoes))} className="mt-2 inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"><Check size={13} />Corrigir ID</button>
        </div>
      ))}

      <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100">
        {!consultores.length && <p className="px-3 py-3 text-[12px] text-gray-400">Nenhum consultor cadastrado. Sem consultor, o ranking individual mostra a estrutura inteira.</p>}
        {consultores.map((c) => (editandoId === c.id_colaborador ? (
          <div key={c.id_colaborador} className="space-y-2.5 bg-[#f7fbfb] px-3 py-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_150px]">
              <Campo rotulo="Nome"><input value={edicao.nome} onKeyDown={enterFaz()} onChange={(e) => setEdicao({ ...edicao, nome: e.target.value })} className={campo} /></Campo>
              <Campo rotulo="ID no SGI"><input value={edicao.id_colaborador} inputMode="numeric" onKeyDown={enterFaz()} onChange={(e) => setEdicao({ ...edicao, id_colaborador: e.target.value })} className={campo} /></Campo>
            </div>
            <Campo rotulo="Como aparece no DASH (opcional)"><input value={edicao.nome_social} onKeyDown={enterFaz()} onChange={(e) => setEdicao({ ...edicao, nome_social: e.target.value })} placeholder="Ex.: apelido ou nome social" className={campo} /></Campo>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <Campo rotulo="Função"><Opcoes valor={edicao.funcao} opcoes={FUNCOES_CONSULTOR} aoMudar={(v) => setEdicao({ ...edicao, funcao: v })} /></Campo>
              <Campo rotulo="Situação"><Opcoes valor={edicao.status} opcoes={STATUS_CONSULTOR} aoMudar={(v) => setEdicao({ ...edicao, status: v })} /></Campo>
            </div>
            {!mesmoIdConsultor(edicao.id_colaborador, c.id_colaborador) && <p className="text-[11px] text-amber-700">O ID muda de {formatarIdConsultor(c.id_colaborador)} para {formatarIdConsultor(edicao.id_colaborador) || '—'}; a divisão da meta acompanha.</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditandoId('')} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600">Cancelar</button>
              <button type="button" disabled={ocupado || !edicao.nome.trim() || !somenteDigitos(edicao.id_colaborador)} onClick={() => salvarEdicao(c)} className="inline-flex items-center gap-1 rounded-lg bg-[#048187] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"><Save size={13} />Salvar</button>
            </div>
          </div>
        ) : (
          <div key={c.id_colaborador} className={`flex items-center gap-2 px-3 py-2.5 ${c.status === 'ativo' ? '' : 'opacity-70'}`}>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-gray-700">{c.nome_exibicao || c.nome}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-gray-400">
                <span>ID {formatarIdConsultor(c.id_colaborador)}</span>
                <TomFuncao funcao={c.funcao} />
                <TomStatus status={c.status} />
              </div>
            </div>
            <button type="button" onClick={() => abrirEdicao(c)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#048187] hover:bg-[#e6f6f7]" aria-label={`Editar ${c.nome}`}><Pencil size={14} /></button>
            <button type="button" disabled={ocupado} onClick={() => remover(c)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500" aria-label={`Tirar ${c.nome}`}><Trash2 size={14} /></button>
          </div>
        )))}
      </div>

      {novo ? (
        <div className="space-y-2.5 rounded-xl border border-[#048187]/25 bg-[#f7fbfb] p-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[150px_minmax(0,1fr)]">
            <Campo rotulo="ID no SGI"><input autoFocus value={novo.id_colaborador} inputMode="numeric" onKeyDown={enterFaz()} onChange={(e) => {
              const id = e.target.value;
              const sugerida = (estrutura.sugestoes_consultores || []).find((s) => mesmoIdConsultor(s.id_colaborador, id));
              setNovo((n) => ({ ...n, id_colaborador: id, nome: n.nome || sugerida?.nome || '' }));
            }} placeholder="Ex.: 21944216" className={campo} /></Campo>
            <Campo rotulo="Nome"><input value={novo.nome} onKeyDown={enterFaz()} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} placeholder={outra ? outra.nome : 'Nome completo'} className={campo} /></Campo>
          </div>
          <Campo rotulo="Função"><Opcoes valor={novo.funcao} opcoes={FUNCOES_CONSULTOR} aoMudar={(v) => setNovo({ ...novo, funcao: v })} /></Campo>
          {jaAqui && <p className="text-[11px] font-semibold text-amber-700">Essa pessoa já está nesta estrutura.</p>}
          {outra && <p className="flex items-start gap-1 text-[11px] font-semibold text-amber-700"><ArrowRightLeft size={13} className="mt-px shrink-0" />{outra.nome_exibicao || outra.nome} está na {outra.estrutura_nome}. Incluir aqui tira de lá.</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setNovo(null)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600">Cancelar</button>
            <button type="button" disabled={ocupado || jaAqui} onClick={incluir} className="inline-flex items-center gap-1 rounded-lg bg-[#048187] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">{outra ? <><ArrowRightLeft size={13} />Trazer para esta estrutura</> : <><UserPlus size={13} />Incluir</>}</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => { setEditandoId(''); setAviso(null); setNovo({ ...CONSULTOR_VAZIO }); }} className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-[#048187]/50 px-3 py-2 text-xs font-semibold text-[#048187]"><UserPlus size={14} />Incluir consultor</button>
      )}

      {sugestoes.length > 0 && (
        <div className="rounded-xl bg-gray-50 px-3 py-2.5">
          <p className="mb-1.5 flex items-center gap-1 text-[11.5px] font-bold text-gray-600"><Sparkles size={13} className="text-[#048187]" />Fecharam pedidos desta estrutura no ciclo e não estão no cadastro (SGI)</p>
          <div className="space-y-1.5">
            {sugestoes.map((s) => (
              <div key={s.id_colaborador} className="flex flex-wrap items-center justify-between gap-2">
                <p className="min-w-0 text-[12px] text-gray-600"><b className="text-gray-700">{s.nome || `ID ${formatarIdConsultor(s.id_colaborador)}`}</b> · ID {formatarIdConsultor(s.id_colaborador)} · {s.pedidos} pedidos</p>
                <button type="button" onClick={() => { setEditandoId(''); setAviso(null); setNovo({ ...CONSULTOR_VAZIO, id_colaborador: s.id_colaborador, nome: s.nome || '' }); }} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#048187]/40 bg-white px-2.5 py-1 text-[11.5px] font-semibold text-[#048187]"><Plus size={12} />Cadastrar</button>
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="text-[11px] leading-4 text-gray-400">A divisão da Meta Receita entre os consultores continua em Metas por Estruturas.</p>
    </div>
  );
}

function LinhaEstrutura({ estrutura, usuarios, aoEditar }) {
  const usuario = usuarios.find((u) => Number(u.id) === Number(estrutura.usuario_id));
  const semResponsavel = !estrutura.lider && !usuario;
  const veem = estrutura.acessos_dash || [];
  const idsErrados = idsDiferentesDaEstrutura(estrutura);
  const nomesConsultores = (estrutura.consultores || []).filter((c) => c.status === 'ativo').map((c) => c.nome_exibicao || c.nome).join(', ');
  return (
    <div className="grid grid-cols-1 gap-3 px-4 py-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,.6fr)_auto] lg:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-bold text-gray-700">{estrutura.nome}</p>
          <Etiqueta tom={estrutura.tipo === 'ESPAÇO DO REVENDEDOR' ? 'teal' : 'cinza'}>{estrutura.tipo === 'ESPAÇO DO REVENDEDOR' && <Store size={11} />}{tipoCurto(estrutura.tipo)}</Etiqueta>
          {(estrutura.nomes_anteriores || []).length > 0 && (
            <Etiqueta tom="cinza" titulo={estrutura.nomes_anteriores.map((n) => `até ${n.ate}: ${n.nome}`).join(' | ')}><History size={11} />antes: {estrutura.nomes_anteriores.at(-1).nome}</Etiqueta>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(estrutura.codigos || []).map((c) => <ChipCodigo key={c.cod} codigo={c} />)}
          {!(estrutura.codigos || []).length && <span className="text-[11px] font-semibold text-amber-600">Sem código do SGI</span>}
        </div>
      </div>
      <div className="min-w-0 text-[12.5px] leading-5">
        {semResponsavel ? (
          <span className="inline-flex items-center gap-1 font-semibold text-amber-600"><TriangleAlert size={13} />Sem responsável</span>
        ) : (
          <>
            <p className="truncate text-gray-600"><span className="text-gray-400">Líder:</span> {estrutura.lider || '—'}</p>
            {usuario || !veem.length ? (
              <p className="truncate text-gray-600"><span className="text-gray-400">No DASH:</span> {usuario?.nome || '—'}</p>
            ) : (
              <p className="truncate text-gray-500" title={veem.map((u) => u.nome).join(', ')}><span className="text-gray-400">Veem no DASH:</span> {veem[0].nome}{veem.length > 1 ? ` +${veem.length - 1}` : ''}</p>
            )}
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5 lg:flex-col lg:items-start">
        {estrutura.status !== 'ativo' ? <Etiqueta>Inativa</Etiqueta> : estrutura.tem_meta_ciclo ? <Etiqueta tom="verde"><Check size={11} />Meta no ciclo</Etiqueta> : <Etiqueta tom="ambar">Sem meta no ciclo</Etiqueta>}
        <span className="text-[11px] text-gray-400" title={nomesConsultores || undefined}>{estrutura.consultores_ativos || 0} consultor(es)</span>
        {idsErrados.length > 0 && <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600"><TriangleAlert size={12} />ID diferente do SGI</span>}
      </div>
      <div className="flex justify-end">
        <button type="button" onClick={() => aoEditar(estrutura)} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-[#048187] hover:bg-[#e6f6f7]"><Pencil size={14} />Editar</button>
      </div>
    </div>
  );
}

// "13476 - EQUIPE MOISES" -> nome EQUIPE MOISES; "N3 - EQUIPE DARLENE" -> N3.
function novaComCodigo(c) {
  const nome = String(c.nome_sgi || '').replace(/^\s*(?:\d[\d.]*|N\s*[123])\s*-\s*/i, '').trim();
  const nucleo = (String(c.nome_sgi || '').match(/^\s*N\s*([123])\s*-/i) || [])[1];
  return { nome, nucleo: nucleo ? `NUCLEO ${nucleo}` : 'NUCLEO 2', lideres_sgi: c.lider_sgi ? [c.lider_sgi] : [], codigos: [{ ...c, veio_no_ciclo: true }] };
}

function PainelPendencias({ pendencias, estruturas, aoLigarCodigo, aoMarcarFora, aoInativarCodigo, aoEditar, acoesConsultores }) {
  const [aberto, setAberto] = useState(true);
  const [ligar, setLigar] = useState({});
  const [avisoId, setAvisoId] = useState(null);
  const idsDiferentes = pendencias.idsDiferentes || [];
  const total = pendencias.semEstrutura.length + pendencias.naoVieram.length + pendencias.semCodigo.length + pendencias.semResponsavel.length + pendencias.semMeta.length + idsDiferentes.length;
  if (!total) return null;
  const ativas = estruturas.filter((e) => e.status === 'ativo');
  const corrigir = async (item) => {
    const r = await corrigirIdConsultor(estruturas.find((e) => Number(e.id) === Number(item.estrutura_id)), item, acoesConsultores);
    if (r) setAvisoId(r.ok ? { tom: 'ok', texto: r.mensagem } : { tom: 'erro', texto: r.erro });
  };
  return (
    <div className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm">
      <button type="button" onClick={() => setAberto((v) => !v)} className="flex w-full items-center justify-between gap-3 bg-amber-50 px-4 py-3 text-left">
        <span className="flex items-center gap-2"><TriangleAlert size={17} className="shrink-0 text-amber-600" /><span><span className="block text-sm font-bold text-amber-800">Pendências do cadastro ({total})</span><span className="block text-[11px] text-amber-700/80">Nada muda sozinho: você decide cada uma.</span></span></span>
        <ChevronDown size={18} className={`shrink-0 text-amber-700 transition-transform ${aberto ? 'rotate-180' : ''}`} />
      </button>
      {aberto && (
        <div className="divide-y divide-gray-100">
          <Bloco titulo="Códigos que chegaram nos relatórios sem estrutura" qtd={pendencias.semEstrutura.length} ajuda="Ligue o código a uma estrutura ou marque como fora dos núcleos (não entra em núcleo, meta nem ranking).">
            {pendencias.semEstrutura.map((c) => (
              <div key={c.cod} className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                <div className="min-w-0"><p className="text-sm font-semibold text-gray-700"><b>{c.cod_exibicao}</b> · {c.nome_sgi}</p><p className="text-[11px] text-gray-400">{c.registros || 0} registro(s) nos relatórios do ciclo{c.lider_sgi ? ` · líder no SGI: ${c.lider_sgi}` : ''}</p></div>
                <div className="flex flex-wrap items-center gap-2">
                  <select value={ligar[c.cod] || ''} onChange={(e) => setLigar((a) => ({ ...a, [c.cod]: e.target.value }))} className="min-w-0 max-w-[230px] flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm">
                    <option value="">Ligar a…</option>
                    <option value="nova">+ Nova estrutura com este código</option>
                    {ativas.map((e) => <option key={e.id} value={e.id}>{nucleoCurto(e.nucleo)} · {e.nome}</option>)}
                  </select>
                  <button type="button" disabled={!ligar[c.cod]} onClick={() => (ligar[c.cod] === 'nova' ? aoEditar(novaComCodigo(c)) : aoLigarCodigo?.(c, ligar[c.cod]))} className="inline-flex items-center gap-1 rounded-lg bg-[#048187] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"><Link2 size={13} />Ligar</button>
                  <button type="button" onClick={() => aoMarcarFora?.(c)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">Fora dos núcleos</button>
                </div>
              </div>
            ))}
          </Bloco>
          <Bloco titulo="Não vieram nos relatórios do ciclo atual" qtd={pendencias.naoVieram.length + pendencias.semCodigo.length} ajuda="Podem ter sido extintas no SGI. Inativar tira do ciclo atual em diante; os ciclos anteriores ficam com os números da época.">
            {pendencias.naoVieram.map((c) => (
              <div key={c.cod} className="flex flex-wrap items-center justify-between gap-2">
                <p className="min-w-0 text-sm text-gray-600"><b className="text-gray-700">{c.cod_exibicao}</b> · {c.nome_sgi}{c.estrutura_nome ? <span className="text-gray-400"> — em {c.estrutura_nome}</span> : <span className="text-gray-400"> — sem estrutura</span>}{c.ultimo_ciclo ? <span className="text-gray-400"> · último ciclo: {c.ultimo_ciclo}</span> : null}</p>
                <button type="button" onClick={() => aoInativarCodigo?.(c)} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"><Ban size={13} />Inativar código</button>
              </div>
            ))}
            {pendencias.semCodigo.map((e) => (
              <div key={e.id} className="flex flex-wrap items-center justify-between gap-2">
                <p className="min-w-0 text-sm text-gray-600"><b className="text-gray-700">{e.nome}</b> <span className="text-gray-400">— estrutura sem código do SGI</span></p>
                <button type="button" onClick={() => aoEditar(e)} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"><Pencil size={13} />Abrir</button>
              </div>
            ))}
          </Bloco>
          <Bloco titulo="Consultor com ID diferente do SGI" qtd={idsDiferentes.length} ajuda="O SGI fecha os pedidos dessa pessoa com outro ID, então o resultado individual dela não aparece. Corrigir o ID resolve do ciclo atual em diante e nos anteriores.">
            {avisoId && <div className={`rounded-lg px-3 py-2 text-[12px] font-semibold ${avisoId.tom === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{avisoId.texto}</div>}
            {idsDiferentes.map((s) => (
              <div key={`${s.estrutura_id}-${s.id_colaborador}`} className="flex flex-wrap items-center justify-between gap-2">
                <p className="min-w-0 text-sm text-gray-600"><b className="text-gray-700">{s.nome}</b> <span className="text-gray-400">— {s.estrutura_nome} · no cadastro {formatarIdConsultor(s.id_cadastro)}, no SGI {formatarIdConsultor(s.id_colaborador)} ({s.pedidos} pedidos no ciclo)</span></p>
                <button type="button" onClick={() => corrigir(s)} className="inline-flex items-center gap-1 rounded-lg bg-[#048187] px-3 py-1.5 text-xs font-semibold text-white"><Check size={13} />Corrigir ID</button>
              </div>
            ))}
          </Bloco>
          <Bloco titulo="Sem responsável" qtd={pendencias.semResponsavel.length}>
            <div className="flex flex-wrap gap-1.5">{pendencias.semResponsavel.map((e) => <button key={e.id} type="button" onClick={() => aoEditar(e)} className="rounded-lg border border-dashed border-amber-300 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50">{e.nome}</button>)}</div>
          </Bloco>
          <Bloco titulo="Sem meta no ciclo atual" qtd={pendencias.semMeta.length} ajuda="Vendem no ciclo, mas não têm meta cadastrada em Metas por Estruturas.">
            <div className="flex flex-wrap gap-1.5">{pendencias.semMeta.map((e) => <span key={e.id} className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">{e.nome}</span>)}</div>
          </Bloco>
        </div>
      )}
    </div>
  );
}

export function EditorEstrutura({ estrutura, dados, aoFechar, aoSalvar, salvando, formInicial, acoesConsultores }) {
  const nova = !estrutura?.id;
  const ciclo = dados?.ciclo_atual || '';
  // Consultores e acessos salvam na hora: lê a versão mais nova da estrutura depois de cada recarga.
  const atual = (!nova && (dados?.estruturas || []).find((e) => Number(e.id) === Number(estrutura.id))) || estrutura || {};
  const veem = atual.acessos_dash || [];
  const usuariosDash = dados?.usuarios || [];
  const idsVeem = new Set(veem.map((u) => Number(u.id)));
  const [form, setForm] = useState(() => ({
    nome: estrutura?.nome || '',
    nucleo: estrutura?.nucleo || 'NUCLEO 2',
    tipo: estrutura?.tipo || 'FORÇA DE VENDAS',
    status: estrutura?.status || 'ativo',
    lider: estrutura?.lider_origem === 'manual' ? estrutura.lider : '',
    usuario_id: estrutura?.usuario_id || '',
    codigos: estrutura?.codigos || [],
    ...(formInicial || {}),
  }));
  const [novoCodigo, setNovoCodigo] = useState('');
  const disponiveis = [...(dados?.sem_estrutura || []), ...(dados?.fora_nucleos || [])].filter((c) => !form.codigos.some((x) => x.cod === c.cod));
  const renomeou = !nova && nomeComparavel(form.nome) !== nomeComparavel(estrutura.nome);
  const trocouNucleo = !nova && form.nucleo !== estrutura.nucleo;
  const lideresSgi = [...new Set([...(estrutura?.lideres_sgi || []), ...form.codigos.map((c) => c.lider_sgi).filter(Boolean)])];
  const incluirCodigo = () => {
    const escolhido = disponiveis.find((c) => c.cod === novoCodigo);
    const digitos = somenteDigitos(novoCodigo);
    if (!escolhido && !digitos) return;
    setForm((f) => ({ ...f, codigos: [...f.codigos, escolhido ? { ...escolhido, veio_no_ciclo: true } : { cod: digitos, cod_exibicao: formatarCodigo(digitos), nome_sgi: '(ainda não veio nos relatórios)', veio_no_ciclo: false }] }));
    setNovoCodigo('');
  };
  return (
    <div className="fixed inset-0 z-[9999] flex justify-end bg-black/40" onClick={aoFechar}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); aoSalvar?.(form); }} className="flex h-full w-full max-w-[560px] flex-col bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 p-5">
          <div className="min-w-0"><h3 className="text-lg font-bold text-gray-700">{nova ? 'Nova estrutura' : 'Editar estrutura'}</h3><p className="mt-0.5 truncate text-xs text-gray-400">{nova ? 'Comece pelo código do SGI.' : `${nucleoCurto(estrutura.nucleo)} · ${(estrutura.codigos || []).map((c) => c.cod_exibicao).join(' + ') || 'sem código'}`}</p></div>
          <button type="button" onClick={aoFechar} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500" aria-label="Fechar"><X size={18} /></button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <Campo rotulo="Códigos do SGI" ajuda="O código é a identidade: os nomes que o SGI mandar com ele entram sozinhos nesta estrutura.">
            <div className="flex flex-wrap gap-1.5">
              {form.codigos.map((c) => <ChipCodigo key={c.cod} codigo={c} aoRemover={() => setForm((f) => ({ ...f, codigos: f.codigos.filter((x) => x.cod !== c.cod) }))} />)}
              {!form.codigos.length && <span className="text-xs font-semibold text-amber-600">Nenhum código ainda</span>}
            </div>
            <div className="mt-2 flex gap-2">
              <input list="codigos-disponiveis" value={novoCodigo} onChange={(e) => setNovoCodigo(e.target.value)} placeholder="Código (ex.: 15.044)" className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#048187]" />
              <datalist id="codigos-disponiveis">{disponiveis.map((c) => <option key={c.cod} value={c.cod}>{`${c.cod_exibicao} · ${c.nome_sgi}`}</option>)}</datalist>
              <button type="button" onClick={incluirCodigo} className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-dashed border-[#048187]/50 px-3 py-2 text-xs font-semibold text-[#048187]"><Plus size={14} />Incluir</button>
            </div>
          </Campo>
          <Campo rotulo="Nome no DASH" ajuda={nova ? 'Como a estrutura aparece nas telas, rankings e metas.' : `Pode trocar quando precisar. Vale do ciclo ${ciclo} em diante; os ciclos fechados mantêm o nome da época.`}>
            <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required className="w-full rounded-xl border border-gray-200 px-4 py-2.5 font-semibold text-gray-700 outline-none focus:border-[#048187]" />
          </Campo>
          {(estrutura?.nomes_anteriores || []).length > 0 && (
            <div className="rounded-xl bg-gray-50 px-3 py-2 text-[12px] text-gray-500"><p className="mb-1 flex items-center gap-1 font-semibold text-gray-600"><History size={13} />Nomes anteriores</p>{estrutura.nomes_anteriores.map((n) => <p key={n.ate}>até o ciclo {n.ate}: <b className="text-gray-600">{n.nome}</b></p>)}</div>
          )}
          <Campo rotulo="Núcleo" ajuda={trocouNucleo ? `Muda do ciclo ${ciclo} em diante; os ciclos anteriores continuam no ${nucleoCurto(estrutura.nucleo)}.` : null}>
            <Opcoes valor={form.nucleo} opcoes={NUCLEOS.map((n) => ({ valor: n, rotulo: nucleoCurto(n) }))} aoMudar={(v) => setForm({ ...form, nucleo: v })} />
          </Campo>
          <Campo rotulo="Tipo">
            <Opcoes valor={form.tipo} opcoes={TIPOS.map((t) => ({ valor: t.valor, rotulo: t.curto === 'ER' ? 'ER (Espaço do Revendedor)' : t.curto }))} aoMudar={(v) => setForm({ ...form, tipo: v })} />
          </Campo>
          <div className="space-y-3 rounded-2xl border border-gray-100 p-4">
            <p className="flex items-center gap-1.5 text-[12.5px] font-bold text-gray-700"><UserRound size={15} className="text-[#048187]" />Responsável</p>
            <Campo rotulo="Líder da estrutura" ajuda="Em branco, vale o que vem na coluna Responsável Estrutura da Consulta Pedidos. Digite só se estiver diferente.">
              <input list="lideres-sgi" value={form.lider} onChange={(e) => setForm({ ...form, lider: e.target.value })} placeholder={lideresSgi[0] ? `Do SGI: ${lideresSgi[0]}` : 'Nome do líder'} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#048187]" />
              <datalist id="lideres-sgi">{lideresSgi.map((n) => <option key={n} value={n} />)}</datalist>
            </Campo>
            <Campo rotulo="Usuário do DASH" ajuda="Quem gerencia. O acesso dele a esta estrutura é criado e mantido sozinho (inclusive quando você trocar o nome).">
              <select value={form.usuario_id} onChange={(e) => setForm({ ...form, usuario_id: e.target.value })} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm">
                <option value="">Ninguém</option>
                {veem.length > 0 && (
                  <optgroup label="Já veem esta estrutura">
                    {usuariosDash.filter((u) => idsVeem.has(Number(u.id))).map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
                  </optgroup>
                )}
                <optgroup label={veem.length ? 'Outros usuários' : 'Usuários'}>
                  {usuariosDash.filter((u) => !idsVeem.has(Number(u.id))).map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
                </optgroup>
              </select>
            </Campo>
            {!nova && (
              <div>
                <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500"><Eye size={12} />Já veem esta estrutura no DASH</p>
                {veem.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {veem.map((u) => {
                      const escolhido = Number(form.usuario_id) === Number(u.id);
                      const podeEscolher = usuariosDash.some((x) => Number(x.id) === Number(u.id));
                      return (
                        <button key={u.id} type="button" disabled={!podeEscolher || escolhido} onClick={() => setForm({ ...form, usuario_id: String(u.id) })} title={podeEscolher && !escolhido ? 'Usar como responsável no DASH' : undefined}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11.5px] font-semibold ${escolhido ? 'bg-[#048187] text-white' : 'bg-gray-100 text-gray-600 hover:bg-[#e6f6f7] hover:text-[#036b70]'}`}>
                          {escolhido && <Check size={12} />}{u.nome}{u.perfil === 'gestor' ? <span className="font-normal opacity-70">· gestor</span> : null}
                        </button>
                      );
                    })}
                  </div>
                ) : <p className="text-[11px] text-gray-400">Ninguém com acesso só a esta estrutura (admins e gestores sem restrição veem tudo).</p>}
              </div>
            )}
          </div>
          <SecaoConsultores estrutura={nova ? null : atual} dados={dados} acoes={acoesConsultores} />
          <Campo rotulo="Situação">
            <Opcoes valor={form.status} opcoes={[{ valor: 'ativo', rotulo: 'Ativa' }, { valor: 'inativo', rotulo: `Inativa a partir do ${ciclo}` }]} aoMudar={(v) => setForm({ ...form, status: v })} />
          </Campo>
          {(renomeou || trocouNucleo) && (
            <div className="rounded-2xl border border-[#048187]/20 bg-[#f2fafa] p-4 text-[12.5px] leading-5 text-[#036b70]">
              <p className="mb-1 flex items-center gap-1.5 font-bold"><Info size={14} />Ao salvar, o DASH ajusta sozinho:</p>
              <ul className="list-disc space-y-0.5 pl-5">
                {renomeou && <li>o nome nas telas, rankings e na meta do ciclo {ciclo} (e dos próximos);</li>}
                {renomeou && <li>o nome no acesso de quem vê esta estrutura (o acesso continua o mesmo);</li>}
                {trocouNucleo && <li>o núcleo da estrutura do ciclo {ciclo} em diante;</li>}
                <li>ciclos fechados, Histórico e campanha ficam como eram.</li>
              </ul>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 p-4">
          <button type="button" onClick={aoFechar} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600">Cancelar</button>
          <button type="submit" disabled={salvando || !form.nome.trim() || !form.codigos.length} className="inline-flex items-center gap-2 rounded-xl bg-[#048187] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Save size={16} />{salvando ? 'Salvando…' : nova ? 'Cadastrar' : 'Salvar alterações'}</button>
        </div>
      </form>
    </div>
  );
}

export function ColarListaSgi({ dados, aoFechar, textoInicial = '' }) {
  const [texto, setTexto] = useState(textoInicial);
  const resultado = useMemo(() => (texto.trim() ? compararListaSgi(texto, dados) : null), [texto, dados]);
  const destaque = resultado ? resultado.linhas.filter((l) => l.situacao !== 'igual' && l.situacao !== 'fora') : [];
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-3" onClick={aoFechar}>
      <div onClick={(e) => e.stopPropagation()} className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 p-5">
          <div><h3 className="text-lg font-bold text-gray-700">Conferir com a lista do SGI</h3><p className="mt-0.5 text-xs text-gray-400">Cole as colunas Cód Estrutura e Estrutura (do Excel ou do SGI). Nada é gravado sem você confirmar.</p></div>
          <button type="button" onClick={aoFechar} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500" aria-label="Fechar"><X size={18} /></button>
        </div>
        <div className="space-y-4 overflow-y-auto p-5">
          <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={resultado ? 3 : 9} placeholder={'Cód Estrutura\tEstrutura\n11.195\t13476 - EQUIPE ELISEU\n15.044\t13476 - EQUIPE MOISES'} className="w-full rounded-xl border border-gray-200 px-3 py-2 font-mono text-[12px] outline-none focus:border-[#048187]" />
          {resultado && (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[['Códigos lidos', resultado.total, 'text-gray-700'], ['Iguais ao cadastro', resultado.iguais, 'text-green-700'], ['Nome mudou no SGI', resultado.mudaram, 'text-[#036b70]'], ['Sem estrutura', resultado.novos, 'text-amber-700']].map(([r, v, cor]) => (
                  <div key={r} className="rounded-xl bg-gray-50 px-3 py-2"><p className={`text-xl font-bold ${cor}`}>{v}</p><p className="text-[11px] text-gray-500">{r}</p></div>
                ))}
              </div>
              {destaque.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-gray-100">
                  <div className="divide-y divide-gray-100">
                    {destaque.map((l) => (
                      <div key={l.cod} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-[13px]">
                        <div className="min-w-0">
                          <p className="text-gray-700"><b>{formatarCodigo(l.cod)}</b> · {l.nome_sgi}</p>
                          {l.situacao === 'nome_mudou' && <p className="text-[11px] text-gray-400">nos relatórios até agora: {l.nome_antes} — em <b className="text-gray-500">{l.estrutura.nome}</b>. O código continua ligado; o nome novo entra sozinho quando chegar nos relatórios.</p>}
                          {l.situacao === 'sem_estrutura' && <p className="text-[11px] text-amber-600">sem estrutura no DASH{l.registros ? ` · ${l.registros} registro(s) no ciclo` : ''}</p>}
                        </div>
                        {l.situacao === 'nome_mudou' ? <Etiqueta tom="teal">nome novo do SGI</Etiqueta> : <Etiqueta tom="ambar">resolver nas pendências</Etiqueta>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {resultado.faltaram.length > 0 && (
                <div className="rounded-xl border border-gray-100 px-3 py-2.5">
                  <p className="mb-1.5 text-[12.5px] font-bold text-gray-700">No DASH, mas fora da lista ({resultado.faltaram.length})</p>
                  <div className="flex flex-wrap gap-1.5">{resultado.faltaram.map((f) => <span key={`${f.cod}-${f.estrutura.id}`} className="rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-600">{f.cod_exibicao}{f.nome_sgi ? ` · ${f.nome_sgi}` : ''} — {f.estrutura.nome}</span>)}</div>
                  <p className="mt-1.5 text-[11px] text-gray-400">Aparecem em Pendências para você inativar, se não existirem mais.</p>
                </div>
              )}
            </>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 p-4">
          <button type="button" onClick={aoFechar} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600">Fechar</button>
        </div>
      </div>
    </div>
  );
}

export function TelaEstruturasPorCodigo({ dados, carregando, erro, mensagem, salvando, aoSalvarEstrutura, aoLigarCodigo, aoMarcarFora, aoInativarCodigo, acoesConsultores, inicial = {} }) {
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('todas');
  const [editando, setEditando] = useState(inicial.editar ? (dados?.estruturas || []).find((e) => e.id === inicial.editar) || null : null);
  const [colando, setColando] = useState(Boolean(inicial.colar));
  const estruturas = dados?.estruturas || [];
  const usuarios = dados?.usuarios || [];
  const pendencias = useMemo(() => calcularPendencias(dados), [dados]);
  const termo = nomeComparavel(busca);
  const digitos = somenteDigitos(busca);
  const visiveis = estruturas.filter((e) => {
    if (filtro === 'inativas' ? e.status === 'ativo' : e.status !== 'ativo') return false;
    if (!termo) return true;
    return nomeComparavel(e.nome).includes(termo) || (e.codigos || []).some((c) => (digitos && c.cod.includes(digitos)) || nomeComparavel(c.nome_sgi).includes(termo));
  });
  const filtros = [['todas', 'Todas'], ...NUCLEOS.map((n) => [n, nucleoCurto(n)]), ['fora', 'Fora dos núcleos'], ['inativas', 'Inativas']];
  const secoes = filtro === 'fora' ? [] : (filtro === 'todas' || filtro === 'inativas' ? NUCLEOS : [filtro]);
  const mostrarFora = (filtro === 'todas' || filtro === 'fora') && (dados?.fora_nucleos || []).length > 0;
  const abrirNova = () => setEditando({});

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-gray-700">Estruturas</h2>
          <p className="mt-1 text-sm text-gray-400">O código do SGI é a identidade da estrutura. O nome no DASH você troca quando precisar.</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button type="button" onClick={() => setColando(true)} className="inline-flex items-center gap-2 rounded-xl border border-[#048187]/30 px-4 py-2.5 text-sm font-semibold text-[#048187] hover:bg-[#e6f6f7]"><ClipboardPaste size={16} />Conferir com a lista do SGI</button>
          <button type="button" onClick={abrirNova} className="inline-flex items-center gap-2 rounded-xl bg-[#048187] px-4 py-2.5 text-sm font-semibold text-white"><Plus size={16} />Nova estrutura</button>
        </div>
      </div>

      {(erro || mensagem) && <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${erro ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>{erro || mensagem}</div>}

      {!carregando && <PainelPendencias pendencias={pendencias} estruturas={estruturas} aoLigarCodigo={aoLigarCodigo} aoMarcarFora={aoMarcarFora} aoInativarCodigo={aoInativarCodigo} aoEditar={setEditando} acoesConsultores={acoesConsultores} />}

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative md:w-80">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou código" className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#048187]" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {filtros.map(([v, r]) => <button key={v} type="button" onClick={() => setFiltro(v)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${filtro === v ? 'bg-[#048187] text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'}`}>{r}</button>)}
        </div>
      </div>

      {carregando ? <div className="rounded-2xl bg-white p-10 text-center text-[#048187]">Carregando…</div> : (
        <div className="space-y-4">
          {secoes.map((n) => {
            const itens = visiveis.filter((e) => e.nucleo === n);
            if (!itens.length) return null;
            return (
              <div key={n} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center justify-between bg-[#e6f6f7] px-4 py-3"><span className="font-bold text-[#048187]">{n.replace('NUCLEO', 'NÚCLEO')}</span><span className="text-xs font-semibold text-[#048187]">{itens.length} estrutura(s)</span></div>
                <div className="hidden grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,.6fr)_auto] gap-3 border-b border-gray-100 px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400 lg:grid"><span>Estrutura e códigos do SGI</span><span>Responsável</span><span>Ciclo atual</span><span className="w-[74px]" /></div>
                <div className="divide-y divide-gray-100">{itens.map((e) => <LinhaEstrutura key={e.id} estrutura={e} usuarios={usuarios} aoEditar={setEditando} />)}</div>
              </div>
            );
          })}
          {mostrarFora && (
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="flex items-center justify-between bg-gray-50 px-4 py-3"><span className="font-bold text-gray-600">FORA DOS NÚCLEOS</span><span className="text-xs font-semibold text-gray-500">{dados.fora_nucleos.length} código(s)</span></div>
              <div className="px-4 py-3">
                <p className="mb-2 text-[11px] text-gray-400">Entram no total da VD, mas não em núcleo, meta nem ranking.</p>
                <div className="flex flex-wrap gap-1.5">{dados.fora_nucleos.map((c) => <ChipCodigo key={c.cod} codigo={{ ...c, veio_no_ciclo: true }} />)}</div>
              </div>
            </div>
          )}
          {!visiveis.length && !mostrarFora && <div className="rounded-2xl bg-white p-8 text-center text-sm text-gray-400"><Users size={20} className="mx-auto mb-2" />Nenhuma estrutura encontrada.</div>}
        </div>
      )}

      {editando && <EditorEstrutura estrutura={editando} dados={dados} acoesConsultores={acoesConsultores} formInicial={inicial.editar === editando.id ? inicial.form : undefined} salvando={salvando} aoFechar={() => setEditando(null)} aoSalvar={async (form) => { const ok = await aoSalvarEstrutura?.(editando, form); if (ok !== false) setEditando(null); }} />}
      {colando && <ColarListaSgi dados={dados} textoInicial={inicial.textoColado || ''} aoFechar={() => setColando(false)} />}
    </div>
  );
}
