// Cadastro > Estruturas por código (16/11/2026).
// O Cód Estrutura do SGI é a identidade; o nome no DASH pode ser trocado quando precisar
// (vale do ciclo atual em diante; ciclos fechados mantêm o nome da época).
import { useMemo, useState } from 'react';
import {
  Ban, Check, ChevronDown, ClipboardPaste, History, Info, Link2, Pencil, Plus, Save, Search, Store, TriangleAlert, UserRound, Users, X,
} from 'lucide-react';

import {
  NUCLEOS, TIPOS, calcularPendencias, compararListaSgi, formatarCodigo, nomeComparavel, nucleoCurto, somenteDigitos, tipoCurto,
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

function LinhaEstrutura({ estrutura, usuarios, aoEditar }) {
  const usuario = usuarios.find((u) => Number(u.id) === Number(estrutura.usuario_id));
  const semResponsavel = !estrutura.lider && !usuario;
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
            <p className="truncate text-gray-600"><span className="text-gray-400">No DASH:</span> {usuario?.nome || '—'}</p>
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5 lg:flex-col lg:items-start">
        {estrutura.status !== 'ativo' ? <Etiqueta>Inativa</Etiqueta> : estrutura.tem_meta_ciclo ? <Etiqueta tom="verde"><Check size={11} />Meta no ciclo</Etiqueta> : <Etiqueta tom="ambar">Sem meta no ciclo</Etiqueta>}
        <span className="text-[11px] text-gray-400">{estrutura.consultores_ativos || 0} consultor(es)</span>
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

function PainelPendencias({ pendencias, estruturas, aoLigarCodigo, aoMarcarFora, aoInativarCodigo, aoEditar }) {
  const [aberto, setAberto] = useState(true);
  const [ligar, setLigar] = useState({});
  const total = pendencias.semEstrutura.length + pendencias.naoVieram.length + pendencias.semCodigo.length + pendencias.semResponsavel.length + pendencias.semMeta.length;
  if (!total) return null;
  const ativas = estruturas.filter((e) => e.status === 'ativo');
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

export function EditorEstrutura({ estrutura, dados, aoFechar, aoSalvar, salvando, formInicial }) {
  const nova = !estrutura?.id;
  const ciclo = dados?.ciclo_atual || '';
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
                {(dados?.usuarios || []).map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
            </Campo>
          </div>
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

export function TelaEstruturasPorCodigo({ dados, carregando, erro, mensagem, salvando, aoSalvarEstrutura, aoLigarCodigo, aoMarcarFora, aoInativarCodigo, inicial = {} }) {
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

      {!carregando && <PainelPendencias pendencias={pendencias} estruturas={estruturas} aoLigarCodigo={aoLigarCodigo} aoMarcarFora={aoMarcarFora} aoInativarCodigo={aoInativarCodigo} aoEditar={setEditando} />}

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

      {editando && <EditorEstrutura estrutura={editando} dados={dados} formInicial={inicial.editar === editando.id ? inicial.form : undefined} salvando={salvando} aoFechar={() => setEditando(null)} aoSalvar={async (form) => { const ok = await aoSalvarEstrutura?.(editando, form); if (ok !== false) setEditando(null); }} />}
      {colando && <ColarListaSgi dados={dados} textoInicial={inicial.textoColado || ''} aoFechar={() => setColando(false)} />}
    </div>
  );
}
