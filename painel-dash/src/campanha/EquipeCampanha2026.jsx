import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronRight, Crown, Flame, Medal, Plane, Search, Store, Target, Trophy, Users, X } from 'lucide-react';
import { FONTE } from '../celebracao/efeitos';
import JornadaCampanha2026 from './JornadaCampanha2026';
import { capitalizar, compararRanking, nomeCurto, numeroNucleo, resumoEntidade, rotuloCiclo } from './jornadaComum';

// Campanha Incentivo 2026 gamificada, por tipo de acesso (pedido de 07/10/2026):
// - total (gestor geral e gestores de núcleo): placar da campanha, ranking das unidades e dos consultores.
//   Gestor de núcleo vê tudo (regra de 05/10), mas a tela abre filtrada no(s) núcleo(s) dele.
// - unidade (gestor de unidade ER/LOJA): a jornada da unidade e o ranking dos consultores dela.
// - consultor: a própria jornada e o resumo da sua unidade.
// Tocar numa pessoa/unidade abre a jornada dela numa folha por cima da tela.

const CORES_AVATAR = ['#048187', '#7c1f31', '#b8860b', '#6d28d9', '#0e7490', '#c2410c', '#be185d', '#15803d'];
const corAvatar = (nome) => CORES_AVATAR[[...String(nome || '')].reduce((s, l) => s + l.charCodeAt(0), 0) % CORES_AVATAR.length];
const iniciais = (nome) => {
  const partes = String(nome || '').trim().split(/\s+/);
  return `${partes[0]?.[0] || ''}${partes.length > 1 ? partes[partes.length - 1][0] : ''}`.toUpperCase();
};

const COR_CICLO = {
  bateu: '#f2c14e', nao_bateu: '#cbd5e1', sem_dados: '#e2e8f0', batendo: '#22c55e', em_andamento: '#0f9aa1', futuro: '#eef2f6',
};

/** Quatro bolinhas C14→C17 (a trilha em miniatura). */
function MiniTrilha({ ciclos }) {
  return (
    <span className="inline-flex items-center gap-1" aria-hidden="true">
      {(ciclos || []).map((c, i) => (
        <span key={c.numero} className="inline-flex items-center gap-1">
          {i > 0 && <span className="w-2 h-[2px] rounded-full bg-slate-200" />}
          <span className={`w-3.5 h-3.5 rounded-full ${c.situacao_ciclo === 'em_andamento' ? 'ring-2 ring-offset-1 ring-teal-300' : ''}`}
            style={{ background: COR_CICLO[c.status] || COR_CICLO.futuro }} title={`${rotuloCiclo(c.numero)}`} />
        </span>
      ))}
    </span>
  );
}

function Avatar({ nome, tamanho = 44, unidade = false }) {
  return (
    <span className="shrink-0 rounded-2xl flex items-center justify-center text-white font-extrabold"
      style={{ width: tamanho, height: tamanho, background: unidade ? 'linear-gradient(160deg,#0f9aa1,#036b70)' : corAvatar(nome), fontSize: tamanho * 0.36, boxShadow: '0 4px 0 rgba(0,0,0,.12)' }}>
      {unidade ? <Users size={tamanho * 0.48} /> : iniciais(nome)}
    </span>
  );
}

function Posicao({ n }) {
  if (n <= 3) {
    const cor = ['#f2c14e', '#b8c2cf', '#cd7f32'][n - 1];
    return <span className="w-8 shrink-0 flex justify-center"><Crown size={22} color={cor} fill={cor} /></span>;
  }
  return <span className="w-8 shrink-0 text-center text-[15px] font-extrabold text-slate-400 tabular-nums">{n}</span>;
}

function SeloViagem({ texto }) {
  const estilo = texto === 'Garantida' ? 'bg-amber-50 text-amber-700 border-amber-200' : texto === 'Fora' ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-teal-50 text-teal-700 border-teal-200';
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${estilo}`}><Plane size={11} /> {texto}</span>;
}

/** Linha do ranking (pessoa ou unidade). */
function LinhaRanking({ item, posicao, aoAbrir, mostrarUnidade = true }) {
  const { e, r } = item;
  const unidade = e.tipo === 'unidade';
  return (
    <button type="button" onClick={() => aoAbrir(e)}
      className="w-full flex items-center gap-2.5 sm:gap-3 rounded-2xl border-2 border-slate-100 bg-white px-2.5 sm:px-3.5 py-3 text-left transition-all hover:border-teal-200 hover:-translate-y-0.5 active:translate-y-0">
      {posicao != null && <Posicao n={posicao} />}
      <Avatar nome={e.nome} unidade={unidade} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-[14px] font-extrabold text-slate-800 truncate">{nomeCurto(e)}</span>
          {r.tudo && <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-green-500 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-white"><Flame size={10} fill="#fff" /> tudo</span>}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold text-slate-400">
          {mostrarUnidade && !unidade && e.unidade && <span className="truncate max-w-[160px]">{capitalizar(e.unidade)}</span>}
          {unidade && <span>{e.canal === 'LOJA' ? 'LOJA' : 'VD'}{numeroNucleo(e.nucleo) ? ` • N${numeroNucleo(e.nucleo)}` : ''}</span>}
          <MiniTrilha ciclos={e.ciclos} />
        </span>
        <span className="mt-1.5 flex items-center gap-2">
          <span className="h-2 flex-1 max-w-[180px] rounded-full bg-slate-100 overflow-hidden">
            <span className="block h-full rounded-full" style={{ width: `${r.fracao * 100}%`, background: r.tudo ? '#22c55e' : 'linear-gradient(90deg,#0f9aa1,#2dd4bf)' }} />
          </span>
          <span className="text-[11px] font-extrabold text-slate-600 tabular-nums">{r.batidos}/{r.total} missões</span>
        </span>
      </span>
      <span className="hidden sm:flex flex-col items-end gap-1 shrink-0">
        <span className="inline-flex items-center gap-1 text-[12px] font-extrabold text-amber-700"><Medal size={14} /> {r.selos}{r.emJogo ? <span className="text-teal-600 font-bold">+{r.emJogo}</span> : null}</span>
        <SeloViagem texto={r.viagem} />
      </span>
      <ChevronRight size={18} className="shrink-0 text-slate-300" />
    </button>
  );
}

function CartaoNumero({ icone: Icone, cor, valor, rotulo }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl bg-white/95 px-3 py-2.5 shadow-[0_4px_0_rgba(0,0,0,.08)]">
      <span className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center" style={{ background: `${cor}1f` }}><Icone size={20} color={cor} strokeWidth={2.5} /></span>
      <span className="min-w-0">
        <span className="block text-[18px] font-extrabold leading-none text-slate-800">{valor}</span>
        <span className="block mt-1 text-[10px] font-bold uppercase tracking-wide leading-tight text-slate-400">{rotulo}</span>
      </span>
    </div>
  );
}

/** Folha por cima da tela com a jornada de alguém (no celular ocupa a tela toda). */
function Folha({ aberta, aoVoltar, aoFechar, titulo, children }) {
  const caixa = useRef(null);
  // Cada jornada aberta começa do topo (senão herdava a rolagem da unidade).
  useEffect(() => { caixa.current?.scrollTo?.(0, 0); }, [titulo]);
  useEffect(() => {
    if (!aberta) return undefined;
    const aoTecla = (ev) => { if (ev.key === 'Escape') aoVoltar(); };
    window.addEventListener('keydown', aoTecla);
    return () => window.removeEventListener('keydown', aoTecla);
  }, [aberta, aoVoltar]);
  if (!aberta) return null;
  return (
    <div ref={caixa} className="fixed inset-0 z-[90] bg-slate-950/50 backdrop-blur-[2px] flex items-stretch sm:items-start justify-center sm:p-6 overflow-y-auto" style={{ margin: 0 }}
      onMouseDown={(ev) => { if (ev.target === ev.currentTarget) aoFechar(); }} role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="relative w-full sm:max-w-6xl min-h-full sm:min-h-0 bg-[#f3f7f8] sm:rounded-[30px] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center gap-2 bg-[#f3f7f8]/95 backdrop-blur px-3 sm:px-5 py-3 sm:rounded-t-[30px] border-b border-slate-200/70">
          <button type="button" onClick={aoVoltar} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50" aria-label="Voltar">
            <ArrowLeft size={18} />
          </button>
          <p className="min-w-0 flex-1 truncate text-[15px] font-extrabold text-slate-800">{titulo}</p>
          <button type="button" onClick={aoFechar} className="hidden sm:flex w-10 h-10 rounded-full bg-white border border-slate-200 items-center justify-center text-slate-600 hover:bg-slate-50" aria-label="Fechar"><X size={18} /></button>
        </div>
        <div className="p-3 sm:p-5">{children}</div>
      </div>
    </div>
  );
}

function Chips({ opcoes, valor, aoEscolher }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {opcoes.map(([id, rotulo]) => (
        <button key={id} type="button" onClick={() => aoEscolher(id)}
          className={`rounded-full px-3 py-1.5 text-[12px] font-extrabold transition-colors ${valor === id ? 'bg-[#048187] text-white shadow-[0_3px_0_#036b70]' : 'bg-white text-slate-500 border border-slate-200 hover:border-teal-300'}`}>
          {rotulo}
        </button>
      ))}
    </div>
  );
}

/** Ranking dos consultores de uma lista (com "ver todos"). */
function RankingConsultores({ pessoas, aoAbrir, titulo, subtitulo, mostrarUnidade = true, limite = 10 }) {
  const [todos, setTodos] = useState(false);
  const lista = pessoas.slice(0, todos ? pessoas.length : limite);
  return (
    <section className="rounded-[26px] border-2 border-slate-100 bg-white p-3.5 sm:p-5">
      <div className="flex items-start justify-between gap-3 px-1">
        <div>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 inline-flex items-center gap-2"><Trophy size={20} className="text-[#d4a017]" /> {titulo}</h3>
          {subtitulo && <p className="mt-0.5 text-[12px] font-semibold text-slate-400">{subtitulo}</p>}
        </div>
        <span className="shrink-0 rounded-full bg-slate-50 border border-slate-100 px-3 py-1 text-[12px] font-extrabold text-slate-500">{pessoas.length}</span>
      </div>
      <div className="mt-3 space-y-2">
        {lista.map((item, i) => <LinhaRanking key={item.e.participante} item={item} posicao={i + 1} aoAbrir={aoAbrir} mostrarUnidade={mostrarUnidade} />)}
        {!pessoas.length && <p className="py-8 text-center text-sm font-bold text-slate-400">Nenhum consultor neste filtro.</p>}
      </div>
      {pessoas.length > limite && (
        <button type="button" onClick={() => setTodos((v) => !v)} className="mt-3 w-full rounded-2xl border-2 border-slate-100 py-2.5 text-[13px] font-extrabold text-[#048187] hover:bg-teal-50">
          {todos ? 'Mostrar só o top 10' : `Ver todos (${pessoas.length})`}
        </button>
      )}
    </section>
  );
}

/** Unidade aberta: a jornada dela + o ranking da equipe. */
function VisaoUnidade({ unidade, pessoas, calendario, aoAbrirPessoa, visitante, mostrarEquipe = true }) {
  const equipe = useMemo(() => pessoas
    .filter((p) => p.unidade_chave === unidade.participante)
    .map((e) => ({ e, r: resumoEntidade(e) }))
    .sort(compararRanking), [pessoas, unidade]);
  const batendo = equipe.filter((i) => i.r.tudo).length;
  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Unidade sem resultado próprio (sem meta da unidade): mostra só a equipe. */}
      {!unidade.sem_resultado_proprio && <JornadaCampanha2026 pessoa={unidade} calendario={calendario} visitante={visitante} />}
      {mostrarEquipe && <RankingConsultores pessoas={equipe} aoAbrir={aoAbrirPessoa} mostrarUnidade={false} limite={50}
        titulo={unidade.canal === 'LOJA' ? 'Consultoras da loja' : 'Consultores da unidade'}
        subtitulo={`${batendo} de ${equipe.length} batendo todas as missões do ${rotuloCiclo(resumoEntidade(unidade).ciclo?.numero || 14)}. Toque para ver a jornada.`} />}
    </div>
  );
}

export default function EquipeCampanha2026({ nivel, pessoas = [], unidades = [], calendario = [], nucleosDoGestor = [], nomeGestor = '' }) {
  // Pilha do que está aberto: unidade → consultor; "voltar" desempilha, o X fecha tudo.
  const [pilha, setPilha] = useState([]);
  const aberto = pilha[pilha.length - 1] || null; // { tipo: 'pessoa'|'unidade', chave }
  const [canal, setCanal] = useState('todos');
  const [nucleo, setNucleo] = useState(nucleosDoGestor.length ? 'meus' : 'todos');
  const [busca, setBusca] = useState('');

  const pessoaAberta = aberto?.tipo === 'pessoa' ? pessoas.find((p) => p.participante === aberto.chave) : null;
  const unidadeAberta = aberto?.tipo === 'unidade' ? unidades.find((u) => u.participante === aberto.chave) : null;
  const abrir = (e) => setPilha((atual) => [...atual, { tipo: e.tipo === 'unidade' ? 'unidade' : 'pessoa', chave: e.participante }]);
  const voltar = () => setPilha((atual) => atual.slice(0, -1));
  const fechar = () => setPilha([]);

  const passaFiltro = (e) => {
    if (canal !== 'todos' && (e.canal === 'LOJA' ? 'loja' : 'vd') !== canal) return false;
    const n = numeroNucleo(e.nucleo);
    if (nucleo === 'meus' && !nucleosDoGestor.map(numeroNucleo).includes(n)) return false;
    if (!['todos', 'meus'].includes(nucleo) && n !== nucleo) return false;
    const termo = busca.trim().toLowerCase();
    return !termo || `${e.nome} ${e.unidade || ''}`.toLowerCase().includes(termo);
  };

  // Quem não tem nenhuma missão no ciclo (sem meta cadastrada) fica fora do ranking, com aviso.
  const rankingPessoas = useMemo(() => pessoas.map((e) => ({ e, r: resumoEntidade(e) })).filter((i) => i.r.total > 0).sort(compararRanking), [pessoas]);
  const rankingUnidades = useMemo(() => unidades.map((e) => ({ e, r: resumoEntidade(e) })).filter((i) => i.r.total > 0).sort(compararRanking), [unidades]);
  const foraDoRanking = unidades.length - rankingUnidades.length;

  const folha = (
    <Folha aberta={Boolean(pessoaAberta || unidadeAberta)} aoVoltar={voltar} aoFechar={fechar} titulo={pessoaAberta ? nomeCurto(pessoaAberta) : unidadeAberta ? nomeCurto(unidadeAberta) : ''}>
      {pessoaAberta && <JornadaCampanha2026 key={pessoaAberta.participante} pessoa={pessoaAberta} calendario={calendario} visitante />}
      {/* Consultor vê só o total da unidade: sem a lista dos colegas. */}
      {unidadeAberta && <VisaoUnidade key={unidadeAberta.participante} unidade={unidadeAberta} pessoas={pessoas} calendario={calendario} aoAbrirPessoa={abrir} visitante mostrarEquipe={nivel !== 'consultor'} />}
    </Folha>
  );

  // Consultor: a própria jornada + a unidade dele (só o total da unidade).
  if (nivel === 'consultor') {
    const eu = pessoas[0];
    const minhaUnidade = unidades[0];
    const ru = minhaUnidade ? resumoEntidade(minhaUnidade) : null;
    if (!eu) {
      // Sem meta própria na campanha (ex.: consultora de ER): vê só o resultado da unidade.
      return (
        <div className="space-y-4 sm:space-y-5" style={{ fontFamily: FONTE }}>
          {minhaUnidade
            ? <JornadaCampanha2026 pessoa={minhaUnidade} calendario={calendario} visitante />
            : <p className="rounded-[24px] bg-white border-2 border-slate-100 p-8 text-center text-sm font-bold text-slate-400">Seu resultado aparece aqui quando você tiver meta cadastrada ou venda no ciclo.</p>}
        </div>
      );
    }
    return (
      <div className="space-y-4 sm:space-y-5" style={{ fontFamily: FONTE }}>
        <JornadaCampanha2026 pessoa={eu} calendario={calendario} />
        {minhaUnidade && (
          <section className="rounded-[26px] border-2 border-slate-100 bg-white p-4 sm:p-5">
            <h3 className="text-lg font-extrabold text-slate-800 inline-flex items-center gap-2"><Users size={20} className="text-[#048187]" /> Sua unidade</h3>
            <div className="mt-3"><LinhaRanking item={{ e: minhaUnidade, r: ru }} aoAbrir={abrir} /></div>
          </section>
        )}
        {folha}
      </div>
    );
  }

  // Gestor de unidade: jornada da(s) unidade(s) dele + ranking da equipe.
  if (nivel === 'unidade') {
    return (
      <div className="space-y-6" style={{ fontFamily: FONTE }}>
        {unidades.map((u) => <VisaoUnidade key={u.participante} unidade={u} pessoas={pessoas} calendario={calendario} aoAbrirPessoa={abrir} visitante={false} />)}
        {folha}
      </div>
    );
  }

  // Gestor geral e gestores de núcleo.
  const pessoasFiltradas = rankingPessoas.filter((i) => passaFiltro(i.e));
  const unidadesFiltradas = rankingUnidades.filter((i) => passaFiltro(i.e));
  const cicloAtual = calendario.find((c) => c.status === 'em_andamento');
  const naDisputa = pessoasFiltradas.filter((i) => i.e.status_106 !== 'fora').length;
  const batendoTudo = pessoasFiltradas.filter((i) => i.r.tudo).length;
  const selos = pessoasFiltradas.reduce((s, i) => s + i.r.selos, 0);
  const opcoesNucleo = [
    ...(nucleosDoGestor.length ? [['meus', `Seu núcleo: ${nucleosDoGestor.map((n) => `N${numeroNucleo(n)}`).join(' + ')}`]] : []),
    ['todos', 'Todos os núcleos'], ['1', 'N1'], ['2', 'N2'], ['3', 'N3'],
  ];
  return (
    <div className="space-y-4 sm:space-y-5" style={{ fontFamily: FONTE }}>
      <header className="relative overflow-hidden rounded-[28px] px-4 pt-5 pb-4 sm:px-6 sm:pt-6 sm:pb-5 text-white" style={{ background: 'linear-gradient(135deg,#3b0a14 0%,#7c1f31 50%,#d4a017 140%)' }}>
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 w-64 h-64 rounded-full bg-white/10" />
        <div className="relative flex items-end justify-between gap-3">
          <div className="min-w-0 pb-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">Painel da campanha{cicloAtual ? ` • ${rotuloCiclo(cicloAtual.numero)}` : ''}</p>
            <h2 className="mt-1.5 text-[26px] sm:text-[34px] font-extrabold leading-[1.05] tracking-[-0.02em]">{nomeGestor ? `Olá, ${nomeGestor}!` : 'Placar da equipe'}</h2>
            <p className="mt-1.5 text-[13px] font-semibold text-white/80">Quem está batendo as missões, quem precisa de um empurrão e os selos de cada um.</p>
          </div>
          <img src="/campanha-incentivo-2026/mascotes/ele-comemorando.webp" alt="" aria-hidden="true" className="shrink-0 w-auto max-h-[130px] sm:max-h-[170px] -mb-4 drop-shadow-[0_14px_20px_rgba(0,0,0,.35)]" />
        </div>
        <div className="relative mt-1 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <CartaoNumero icone={Users} cor="#0f9aa1" valor={pessoasFiltradas.length} rotulo="consultores" />
          <CartaoNumero icone={Plane} cor="#7c1f31" valor={naDisputa} rotulo="na disputa da viagem" />
          <CartaoNumero icone={Flame} cor="#f97316" valor={batendoTudo} rotulo="batendo tudo no ciclo" />
          <CartaoNumero icone={Medal} cor="#d4a017" valor={selos} rotulo="selos conquistados" />
        </div>
      </header>

      <section className="rounded-[22px] border-2 border-slate-100 bg-white p-3 sm:p-4 space-y-2.5">
        <div className="relative">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={busca} onChange={(ev) => setBusca(ev.target.value)} placeholder="Buscar consultor ou unidade..."
            className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 py-2.5 pl-10 pr-3 text-sm font-semibold outline-none focus:border-teal-300" />
        </div>
        <Chips opcoes={[['todos', 'VD + LOJA'], ['vd', 'VD'], ['loja', 'LOJA']]} valor={canal} aoEscolher={setCanal} />
        <Chips opcoes={opcoesNucleo} valor={nucleo} aoEscolher={setNucleo} />
      </section>

      <div className="grid gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start">
        <section className="rounded-[26px] border-2 border-slate-100 bg-white p-3.5 sm:p-5">
          <div className="flex items-start justify-between gap-3 px-1">
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 inline-flex items-center gap-2"><Store size={20} className="text-[#048187]" /> Ranking das unidades</h3>
              <p className="mt-0.5 text-[12px] font-semibold text-slate-400">Toque numa unidade para ver a jornada dela e a equipe.</p>
            </div>
            <span className="shrink-0 rounded-full bg-slate-50 border border-slate-100 px-3 py-1 text-[12px] font-extrabold text-slate-500">{unidadesFiltradas.length}</span>
          </div>
          <div className="mt-3 space-y-2">
            {unidadesFiltradas.map((item, i) => <LinhaRanking key={item.e.participante} item={item} posicao={i + 1} aoAbrir={abrir} />)}
            {!unidadesFiltradas.length && <p className="py-8 text-center text-sm font-bold text-slate-400 inline-flex items-center gap-2 w-full justify-center"><Target size={16} /> Nenhuma unidade neste filtro.</p>}
          </div>
          {foraDoRanking > 0 && <p className="mt-3 px-1 text-[11px] font-semibold text-slate-400">{foraDoRanking} {foraDoRanking === 1 ? 'unidade sem meta cadastrada no ciclo ficou' : 'unidades sem meta cadastrada no ciclo ficaram'} fora do ranking.</p>}
        </section>
        <RankingConsultores pessoas={pessoasFiltradas} aoAbrir={abrir} titulo="Ranking dos consultores" subtitulo="Ordem: missões do ciclo, depois selos e receita somada." />
      </div>
      {folha}
    </div>
  );
}
