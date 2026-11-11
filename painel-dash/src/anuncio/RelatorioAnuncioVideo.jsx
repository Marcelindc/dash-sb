import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  CircleCheck, Clock, Download, EyeOff, LogOut, MonitorPlay, Play, RefreshCw, Search, SkipForward, Smartphone, Laptop,
} from 'lucide-react';

// Painel ADM: resultado do vídeo-anúncio do canal VD (/auditoria/anuncio-video).
// Mostra, por dia, quem assistiu até o final, quem pulou (e em que segundo), quem saiu no
// meio (fechou a página) e quem ainda não abriu. Atualiza sozinho a cada 30 s.

const TIPO_ACESSO = {
  admin: 'Admin',
  campanha: 'Campanha',
  consultor: 'Consultor FV',
  unidade: 'Gestor de unidade',
  gestor: 'Gestor',
  visualizador: 'Visualizador',
  loja: 'LOJA',
};

const SITUACOES = {
  concluiu: { rotulo: 'Assistiu até o final', icone: CircleCheck, classe: 'bg-[#e3f5f2] text-[#04746f]' },
  pulou: { rotulo: 'Pulou', icone: SkipForward, classe: 'bg-[#fff1dc] text-[#9a5300]' },
  saiu: { rotulo: 'Saiu no meio', icone: LogOut, classe: 'bg-[#eef1f5] text-[#4a5a68]' },
  assistindo: { rotulo: 'Assistindo agora', icone: Play, classe: 'bg-[#e6f6f7] text-[#048187] ring-1 ring-[#048187]/30' },
  nao_abriu: { rotulo: 'Não abriu', icone: EyeOff, classe: 'bg-[#f3f4f5] text-[#7b858a]' },
  aguardando: { rotulo: 'Ainda não abriu o horário', icone: Clock, classe: 'bg-[#f3f4f5] text-[#7b858a]' },
};

const FILTROS = [
  { id: 'todos', rotulo: 'Todos' },
  { id: 'concluiu', rotulo: 'Até o final' },
  { id: 'pulou', rotulo: 'Pularam' },
  { id: 'saiu', rotulo: 'Saíram no meio' },
  { id: 'nao_abriu', rotulo: 'Não abriram' },
];

const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

function formatarTempo(segundos) {
  const total = Math.max(0, Math.round(Number(segundos) || 0));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function rotuloDia(iso) {
  const [ano, mes, dia] = String(iso || '').split('-').map(Number);
  if (!ano) return '';
  const data = new Date(ano, mes - 1, dia);
  return { data: `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`, semana: DIAS_SEMANA[data.getDay()] };
}

function horaDe(iso) {
  if (!iso) return '';
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '';
  return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
}

function textoSituacao(pessoa, puloRapido) {
  if (pessoa.situacao === 'pulou') {
    return pessoa.segundos <= puloRapido ? `Pulou logo · ${formatarTempo(pessoa.segundos)}` : `Pulou aos ${formatarTempo(pessoa.segundos)}`;
  }
  if (pessoa.situacao === 'saiu') return `Saiu aos ${formatarTempo(pessoa.segundos)}`;
  return SITUACOES[pessoa.situacao]?.rotulo || pessoa.situacao;
}

function SeloSituacao({ pessoa, puloRapido }) {
  const info = SITUACOES[pessoa.situacao] || SITUACOES.nao_abriu;
  const Icone = info.icone;
  const rapido = pessoa.situacao === 'pulou' && pessoa.segundos <= puloRapido;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${rapido ? 'bg-[#ffe3cf] text-[#a8410a]' : info.classe}`}>
      <Icone size={13} strokeWidth={2.4} />
      {textoSituacao(pessoa, puloRapido)}
    </span>
  );
}

function Indicador({ titulo, valor, detalhe, icone: Icone, ativo, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-0 rounded-2xl border p-4 text-left transition-colors ${ativo ? 'border-[#048187] bg-[#f2fafa]' : 'border-gray-100 bg-white hover:border-[#b9dfe1]'}`}
    >
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.06em] text-gray-400">
        <Icone size={14} className="shrink-0 text-[#048187]" strokeWidth={2.4} />
        <span className="truncate">{titulo}</span>
      </div>
      <p className="mt-2 text-[26px] font-black leading-none text-[#2f3a3d] tabular-nums">{valor}</p>
      <p className="mt-1.5 min-h-[16px] text-[11px] font-semibold text-gray-400">{detalhe}</p>
    </button>
  );
}

function ChipsPeriodo({ periodo }) {
  const itens = [
    { chave: 'concluiu', icone: CircleCheck, titulo: 'dias em que assistiu até o final', classe: 'text-[#04746f]' },
    { chave: 'pulou', icone: SkipForward, titulo: 'dias em que pulou', classe: 'text-[#9a5300]' },
    { chave: 'saiu', icone: LogOut, titulo: 'dias em que saiu no meio', classe: 'text-[#4a5a68]' },
    { chave: 'nao_abriu', icone: EyeOff, titulo: 'dias em que não abriu', classe: 'text-[#9aa3a7]' },
  ];
  return (
    <div className="flex items-center gap-2.5">
      {itens.map(({ chave, icone: Icone, titulo, classe }) => (
        <span key={chave} title={`${periodo?.[chave] || 0} ${titulo}`} className={`inline-flex items-center gap-1 text-[11px] font-bold tabular-nums ${classe}`}>
          <Icone size={12} strokeWidth={2.4} />
          {periodo?.[chave] || 0}
        </span>
      ))}
    </div>
  );
}

function baixarPlanilha(dados) {
  const colunas = ['Nome', 'E-mail', 'Acesso', 'Situação', 'Segundos assistidos', '% do vídeo', 'Abriu às', 'Terminou às', 'Dias até o final', 'Dias que pulou', 'Dias que saiu no meio', 'Dias sem abrir'];
  const escapar = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const linhas = (dados.pessoas || []).map((p) => [
    p.nome, p.email, TIPO_ACESSO[p.tipo_acesso] || p.tipo_acesso, textoSituacao(p, dados.pulo_rapido_segundos),
    Math.round(p.segundos || 0), p.percentual == null ? '' : String(p.percentual).replace('.', ','),
    horaDe(p.aberto_em), horaDe(p.finalizado_em),
    p.periodo?.concluiu || 0, p.periodo?.pulou || 0, p.periodo?.saiu || 0, p.periodo?.nao_abriu || 0,
  ].map(escapar).join(';'));
  const quebra = String.fromCharCode(10);
  const marcaUtf8 = String.fromCharCode(0xfeff); // faz o Excel abrir os acentos certos
  const csv = marcaUtf8 + [colunas.map(escapar).join(';'), ...linhas].join(quebra);
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `video-vd-${dados.dia}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

export default function RelatorioAnuncioVideo({ apiUrl, aoVerPrevia }) {
  const [dia, setDia] = useState('');
  const [versao, setVersao] = useState(0);
  const [resposta, setResposta] = useState({ chave: '', dados: null, erro: '' });
  const [filtro, setFiltro] = useState('todos');
  const [busca, setBusca] = useState('');
  const chave = `${dia}|${versao}`;

  // Busca ao abrir, ao trocar o dia, no Atualizar e a cada 30 s (só com a aba visível).
  useEffect(() => {
    let ativo = true;
    const buscar = () => axios.get(`${apiUrl}/auditoria/anuncio-video`, { params: { dia, _t: Date.now() } })
      .then(({ data }) => { if (ativo) setResposta({ chave, dados: data, erro: '' }); })
      .catch((e) => {
        if (ativo) setResposta((atual) => ({ chave, dados: atual.dados, erro: e?.response?.data?.detail || 'Não foi possível carregar o resultado do vídeo.' }));
      });
    buscar();
    const intervalo = window.setInterval(() => { if (!document.hidden) buscar(); }, 30000);
    return () => {
      ativo = false;
      window.clearInterval(intervalo);
    };
  }, [apiUrl, dia, chave]);

  const { dados, erro } = resposta;
  const carregando = resposta.chave !== chave;

  const puloRapido = Number(dados?.pulo_rapido_segundos || 10);
  const resumo = dados?.resumo || {};
  const publico = Number(resumo.publico || 0);
  const pct = (n) => (publico ? `${Math.round((Number(n || 0) / publico) * 100)}% do público` : '');

  const pessoas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const ordem = { assistindo: 0, pulou: 1, saiu: 2, concluiu: 3, nao_abriu: 4, aguardando: 5 };
    return (dados?.pessoas || [])
      .filter((p) => filtro === 'todos' || p.situacao === filtro || (filtro === 'saiu' && p.situacao === 'assistindo'))
      .filter((p) => !termo || `${p.nome} ${p.email}`.toLowerCase().includes(termo))
      .sort((a, b) => (ordem[a.situacao] ?? 9) - (ordem[b.situacao] ?? 9) || (a.situacao === 'pulou' ? a.segundos - b.segundos : 0) || a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [dados, filtro, busca]);

  const anuncio = dados?.anuncio;
  const inicio = rotuloDia(anuncio?.inicio);
  const fim = rotuloDia(anuncio?.fim);
  const diaAtual = dados?.dia;
  const horarioDia = dados?.horario_dia;
  const horarioEspecial = horarioDia && anuncio?.hora && horarioDia !== anuncio.hora;

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e6f6f7] text-[#048187]">
            <MonitorPlay size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-gray-400">Vídeo do canal VD</p>
            <h3 className="text-base font-black leading-tight text-[#404446] sm:text-lg">{anuncio?.titulo || 'Vídeo do canal VD'}</h3>
            {anuncio && (
              <p className="mt-0.5 text-xs font-semibold text-gray-400">
                Abre 1x por dia às {anuncio.hora} de {inicio.data} a {fim.data}, para todos os acessos da VD
                {horarioEspecial ? ` · neste dia, às ${horarioDia}` : ''}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {anuncio && (
            <button
              type="button"
              onClick={() => aoVerPrevia?.({ id: anuncio.id, titulo: anuncio.titulo, video_url: anuncio.video_url, dia: anuncio.dia })}
              className="flex items-center gap-1.5 rounded-full bg-[#048187] px-4 py-2 text-xs font-bold text-white hover:bg-[#036e73]"
            >
              <Play size={14} fill="currentColor" /> Ver prévia
            </button>
          )}
          <button
            type="button"
            onClick={() => setVersao((v) => v + 1)}
            disabled={carregando}
            className="flex items-center gap-1.5 rounded-full border border-gray-200 px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw size={14} className={carregando ? 'animate-spin' : ''} /> Atualizar
          </button>
        </div>
      </div>

      {erro && <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{erro}</div>}

      {dados && (
        <>
          {dados.dias?.length > 1 && (
            <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1">
              {dados.dias.map((d) => {
                const r = rotuloDia(d.dia);
                const ativo = d.dia === diaAtual;
                return (
                  <button
                    key={d.dia}
                    type="button"
                    onClick={() => setDia(d.dia)}
                    className={`shrink-0 rounded-xl border px-3 py-1.5 text-center transition-colors ${ativo ? 'border-[#048187] bg-[#048187] text-white' : 'border-gray-100 bg-[#f7fafb] text-gray-500 hover:border-[#b9dfe1]'}`}
                  >
                    <span className="block text-xs font-black">{r.data}</span>
                    <span className={`block text-[10px] font-bold ${ativo ? 'text-white/80' : 'text-gray-400'}`}>
                      {d.aberto ? `${d.concluiu} até o final` : `abre ${d.horario}`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {!dados.aberto && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#f2fafa] px-4 py-3 text-sm font-bold text-[#048187]">
              <Clock size={16} /> Hoje o vídeo abre às {horarioDia}. Até lá a lista mostra só quem vai receber.
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
            <div className="col-span-2 grid lg:col-span-1">
              <Indicador titulo="Público VD" valor={publico} detalhe="acessos ativos da VD" icone={MonitorPlay} ativo={filtro === 'todos'} onClick={() => setFiltro('todos')} />
            </div>
            <Indicador titulo="Até o final" valor={resumo.concluiu || 0} detalhe={pct(resumo.concluiu)} icone={CircleCheck} ativo={filtro === 'concluiu'} onClick={() => setFiltro('concluiu')} />
            <Indicador
              titulo="Pularam"
              valor={resumo.pulou || 0}
              detalhe={resumo.pulou ? `${resumo.pulou_rapido || 0} nos primeiros ${puloRapido} s` : pct(0)}
              icone={SkipForward}
              ativo={filtro === 'pulou'}
              onClick={() => setFiltro('pulou')}
            />
            <Indicador
              titulo="Saíram no meio"
              valor={(resumo.saiu || 0) + (resumo.assistindo || 0)}
              detalhe={resumo.assistindo ? `${resumo.assistindo} assistindo agora` : 'fecharam a página'}
              icone={LogOut}
              ativo={filtro === 'saiu'}
              onClick={() => setFiltro('saiu')}
            />
            <Indicador
              titulo="Não abriram"
              valor={dados.aberto ? resumo.nao_abriu || 0 : resumo.aguardando || 0}
              detalhe={dados.aberto ? 'não entraram no DASH' : `abre às ${horarioDia}`}
              icone={EyeOff}
              ativo={filtro === 'nao_abriu'}
              onClick={() => setFiltro('nao_abriu')}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {FILTROS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltro(f.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${filtro === f.id ? 'bg-[#048187] text-white' : 'bg-[#f7fafb] text-gray-500 hover:bg-[#e6f6f7] hover:text-[#048187]'}`}
              >
                {f.rotulo}
              </button>
            ))}
            <div className="ml-auto flex w-full items-center gap-2 sm:w-auto">
              <label className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 sm:w-56 sm:flex-none">
                <Search size={14} className="shrink-0 text-gray-400" />
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar pessoa"
                  className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-gray-600 outline-none placeholder:text-gray-400"
                />
              </label>
              <button
                type="button"
                onClick={() => baixarPlanilha(dados)}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200 px-3.5 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-50"
                title="Baixar a lista deste dia (abre no Excel)"
              >
                <Download size={14} /> Planilha
              </button>
            </div>
          </div>

          {/* celular: cartões */}
          <div className="mt-3 space-y-2 sm:hidden">
            {pessoas.map((p) => (
              <div key={p.usuario_id} className="rounded-xl border border-gray-100 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-gray-700">{p.nome || '-'}</p>
                    <p className="truncate text-[11px] font-semibold text-gray-400">{TIPO_ACESSO[p.tipo_acesso] || p.tipo_acesso}</p>
                  </div>
                  <SeloSituacao pessoa={p} puloRapido={puloRapido} />
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 text-[11px] font-semibold text-gray-500">
                  <span className="tabular-nums">
                    {p.percentual == null ? 'Não viu' : `${formatarTempo(p.segundos)} de ${formatarTempo(p.duracao)}`}
                    {p.aberto_em ? ` · ${horaDe(p.aberto_em)}` : ''}
                  </span>
                  <ChipsPeriodo periodo={p.periodo} />
                </div>
              </div>
            ))}
            {!pessoas.length && <p className="py-8 text-center text-sm font-bold text-gray-400">Ninguém nesta situação.</p>}
          </div>

          <div className="mt-3 hidden overflow-x-auto rounded-xl border border-gray-100 sm:block">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-[#f7fafb] text-[10.5px] font-bold uppercase tracking-[0.06em] text-gray-400">
                <tr>
                  <th className="px-4 py-2.5">Pessoa</th>
                  <th className="px-3 py-2.5">Acesso</th>
                  <th className="px-3 py-2.5">Situação {rotuloDia(diaAtual).data}</th>
                  <th className="px-3 py-2.5">Quanto viu</th>
                  <th className="px-3 py-2.5">Horário</th>
                  <th className="px-3 py-2.5" title="Dias até o final · pulou · saiu no meio · não abriu">No período</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pessoas.map((p) => (
                  <tr key={p.usuario_id} className="text-sm">
                    <td className="max-w-[260px] px-4 py-2.5">
                      <p className="truncate font-bold text-gray-700">{p.nome || '-'}</p>
                      <p className="truncate text-[10.5px] font-semibold text-gray-400">{p.email}</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold text-gray-500">
                      {TIPO_ACESSO[p.tipo_acesso] || p.tipo_acesso}
                      {!p.ativo && <span className="ml-1 text-[10px] text-gray-400">(inativo)</span>}
                    </td>
                    <td className="px-3 py-2.5"><SeloSituacao pessoa={p} puloRapido={puloRapido} /></td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold text-gray-500">
                      {p.percentual == null ? '—' : (
                        <span className="inline-flex items-center gap-2">
                          <span className="h-1.5 w-14 overflow-hidden rounded-full bg-gray-100">
                            <span className="block h-full rounded-full bg-[#048187]" style={{ width: `${p.percentual}%` }} />
                          </span>
                          <span className="tabular-nums">{formatarTempo(p.segundos)} de {formatarTempo(p.duracao)}</span>
                          {p.som_ativo === false && <span className="text-[10px] text-gray-400">sem som</span>}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold text-gray-500">
                      {p.aberto_em ? (
                        <span className="inline-flex items-center gap-1.5">
                          {p.dispositivo === 'celular' ? <Smartphone size={13} className="text-gray-400" /> : <Laptop size={13} className="text-gray-400" />}
                          {horaDe(p.aberto_em)}{p.finalizado_em ? ` → ${horaDe(p.finalizado_em)}` : ''}
                          {p.aberturas > 1 && <span className="text-[10px] text-gray-400">({p.aberturas}x)</span>}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-2.5"><ChipsPeriodo periodo={p.periodo} /></td>
                  </tr>
                ))}
                {!pessoas.length && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-sm font-bold text-gray-400">Ninguém nesta situação.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] font-semibold text-gray-400">
            <span>No período, em dias:</span>
            <span className="inline-flex items-center gap-1"><CircleCheck size={11} className="text-[#04746f]" /> até o final</span>
            <span className="inline-flex items-center gap-1"><SkipForward size={11} className="text-[#9a5300]" /> pulou</span>
            <span className="inline-flex items-center gap-1"><LogOut size={11} className="text-[#4a5a68]" /> saiu no meio</span>
            <span className="inline-flex items-center gap-1"><EyeOff size={11} className="text-[#9aa3a7]" /> não abriu</span>
            <span>· &quot;Pulou logo&quot; = nos primeiros {puloRapido} s</span>
          </p>
        </>
      )}
    </section>
  );
}
