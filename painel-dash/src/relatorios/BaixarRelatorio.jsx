// Nuvem de download das janelas dos indicadores (pedido do usuário, 18/11/2026).
// Imagem PNG 4K (todos) e Excel no mesmo modelo (VD; a LOJA é só imagem). A janela de escolha permite:
// modo (por estruturas/unidades ou uma estrutura/unidade e seus consultores), quais linhas entram
// (com atalhos "batendo a meta" / "abaixo da meta"), quais colunas e a ordem (maior → menor por padrão).
// Tudo sai dos dados que a própria janela já mostra para o acesso da pessoa.
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Check, CloudDownload, FileSpreadsheet, ImageDown, LayoutList, Loader2, UsersRound, X } from 'lucide-react';
import logoMonteiroHd from '../assets/logo-monteiro-branca-hd.png';
import { abaixoMeta, batendoMeta } from './formatos';
import { colunasPadrao, modoDaDefinicao, montarConteudo, nomeArquivo } from './montarRelatorio';
import { canvasParaPng, desenharRelatorio } from './desenhoRelatorio';
import { gerarPlanilhaRelatorio } from './planilhaRelatorio';

const agoraTexto = () => {
  const partes = Object.fromEntries(new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Fortaleza',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(new Date()).map((parte) => [parte.type, parte.value]));
  return `${partes.day}/${partes.month}/${partes.year} às ${partes.hour}:${partes.minute}`;
};

const baixarArquivo = (blob, nome) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
};

const OpcaoMenu = ({ icone: Icone, titulo, descricao, onClick, desabilitado, carregando }) => (
  <button
    type="button"
    role="menuitem"
    onClick={onClick}
    disabled={desabilitado}
    className="w-full flex items-start gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-[#f0f9f9] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
  >
    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e6f6f7] text-[#048187]">
      {carregando ? <Loader2 size={18} className="animate-spin" /> : <Icone size={18} />}
    </span>
    <span className="min-w-0">
      <span className="block text-sm font-black text-gray-700">{titulo}</span>
      <span className="block text-xs font-semibold text-gray-400 leading-snug">{descricao}</span>
    </span>
  </button>
);

const CaixaMarcar = ({ marcado, parcial }) => (
  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${marcado || parcial ? 'border-[#048187] bg-[#048187] text-white' : 'border-gray-300 bg-white'}`}>
    {marcado ? <Check size={13} strokeWidth={3.5} /> : parcial ? <span className="block h-0.5 w-2.5 rounded bg-white" /> : null}
  </span>
);

const Secao = ({ titulo, direita, children }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between gap-2">
      <p className="text-[11px] font-black uppercase tracking-wide text-gray-400">{titulo}</p>
      {direita}
    </div>
    {children}
  </div>
);

// Atalhos de seleção: Todas · Batendo a meta · Abaixo da meta · Nenhuma.
const AtalhosMeta = ({ linhas, marcadas, aoMarcar, feminino }) => {
  const batendo = linhas.filter((linha) => batendoMeta(linha.pctMeta));
  const abaixo = linhas.filter((linha) => abaixoMeta(linha.pctMeta));
  const igual = (lista) => lista.length === marcadas.size && lista.every((linha) => marcadas.has(linha.chave));
  const atalhos = [
    { id: 'todas', rotulo: feminino ? 'Todas' : 'Todos', lista: linhas },
    { id: 'batendo', rotulo: `Batendo a meta (${batendo.length})`, lista: batendo, cor: 'text-[#048187]' },
    { id: 'abaixo', rotulo: `Abaixo da meta (${abaixo.length})`, lista: abaixo, cor: 'text-[#c2410c]' },
    { id: 'nenhuma', rotulo: feminino ? 'Nenhuma' : 'Nenhum', lista: [] },
  ];
  return (
    <div className="flex flex-wrap gap-1.5">
      {atalhos.map((atalho) => {
        const ativo = atalho.id === 'nenhuma' ? marcadas.size === 0 : atalho.lista.length > 0 && igual(atalho.lista);
        const semMeta = (atalho.id === 'batendo' || atalho.id === 'abaixo') && atalho.lista.length === 0;
        return (
          <button
            key={atalho.id}
            type="button"
            disabled={semMeta}
            onClick={() => aoMarcar(new Set(atalho.lista.map((linha) => linha.chave)))}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-black transition-colors disabled:opacity-40 ${ativo ? 'border-[#048187] bg-[#e6f6f7] text-[#048187]' : `border-gray-200 bg-white hover:bg-gray-50 ${atalho.cor || 'text-gray-500'}`}`}
          >
            {atalho.rotulo}
          </button>
        );
      })}
    </div>
  );
};

// Lista de escolha no mesmo ranking do relatório: % da meta do maior para o menor (sem meta no fim).
const porRanking = (linhas) => [...linhas].sort((a, b) => {
  if (a.semConsultor !== b.semConsultor) return a.semConsultor ? 1 : -1;
  const temA = a.pctMeta !== null && a.pctMeta !== undefined;
  const temB = b.pctMeta !== null && b.pctMeta !== undefined;
  if (temA && temB && Number(a.pctMeta) !== Number(b.pctMeta)) return Number(b.pctMeta) - Number(a.pctMeta);
  if (temA !== temB) return temA ? -1 : 1;
  return String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR');
});

const ListaMarcavel = ({ linhas, marcadas, alternar, agrupar = true }) => {
  const grupos = useMemo(() => {
    if (!agrupar || !linhas.some((linha) => linha.grupoLista)) return [{ nome: '', linhas: porRanking(linhas) }];
    const mapa = new Map();
    linhas.forEach((linha) => mapa.set(linha.grupoLista || 'OUTRAS', [...(mapa.get(linha.grupoLista || 'OUTRAS') || []), linha]));
    return Array.from(mapa.entries()).map(([nome, itens]) => ({ nome, linhas: porRanking(itens) }));
  }, [linhas, agrupar]);
  return (
    <div className="max-h-[34dvh] lg:max-h-[30dvh] space-y-2 overflow-y-auto pr-1">
      {grupos.map((grupo) => {
        const quantos = grupo.linhas.filter((linha) => marcadas.has(linha.chave)).length;
        return (
          <div key={grupo.nome || 'lista'} className="overflow-hidden rounded-xl border border-gray-100">
            {grupo.nome && (
              <button type="button" onClick={() => alternar(grupo.linhas, quantos !== grupo.linhas.length)} className="flex w-full items-center gap-2.5 bg-[#dff4f5] px-3 py-1.5 text-left">
                <CaixaMarcar marcado={quantos === grupo.linhas.length} parcial={quantos > 0 && quantos < grupo.linhas.length} />
                <span className="text-xs font-black text-[#048187]">{grupo.nome}</span>
                <span className="ml-auto text-[11px] font-black text-[#048187]">{quantos}/{grupo.linhas.length}</span>
              </button>
            )}
            <div className="divide-y divide-gray-50">
              {grupo.linhas.map((linha) => (
                <button key={linha.chave} type="button" onClick={() => alternar([linha], !marcadas.has(linha.chave))} className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left hover:bg-[#fbfefe]">
                  <CaixaMarcar marcado={marcadas.has(linha.chave)} />
                  <span className={`min-w-0 flex-1 truncate text-[13px] font-bold ${linha.semConsultor ? 'italic text-gray-400' : 'text-gray-700'}`}>{linha.nome}</span>
                  {linha.pctMeta !== null && linha.pctMeta !== undefined && (
                    <span className={`shrink-0 text-[11px] font-black ${batendoMeta(linha.pctMeta) ? 'text-[#048187]' : Number(linha.pctMeta) >= 80 ? 'text-[#c2410c]' : 'text-[#7c1f31]'}`}>
                      {Number(linha.pctMeta).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const OPCOES_VAZIAS = { colunas: new Set(), ordem: {} };

const estadoInicial = (definicao) => {
  const modo = definicao.modos[0];
  const porModo = {};
  definicao.modos.forEach((item) => {
    porModo[item.id] = { colunas: colunasPadrao(item), ordem: { coluna: item.ordem, direcao: 'desc' } };
  });
  const itensModo = modoDaDefinicao(definicao, 'itens');
  const comDados = (itensModo?.linhas || []).filter((linha) => linha.temDados !== false);
  const grupoInicial = modoDaDefinicao(definicao, 'grupo')?.grupos?.[0];
  return {
    modo: modo?.id,
    porModo,
    itens: new Set((comDados.length ? comDados : (itensModo?.linhas || [])).map((linha) => linha.chave)),
    grupo: grupoInicial?.chave || '',
    pessoas: new Set([...(grupoInicial?.pessoas || []), ...(grupoInicial?.extras || [])].map((linha) => linha.chave)),
  };
};

const JanelaRelatorio = ({ definicao, formatoInicial, geradoPor, onFechar }) => {
  const [estado, setEstado] = useState(() => estadoInicial(definicao));
  const [logo, setLogo] = useState(null);
  const [baixando, setBaixando] = useState('');
  const [erro, setErro] = useState('');
  const refCanvas = useRef(null);
  const formatos = definicao.formatos || ['png'];

  useEffect(() => {
    const imagem = new Image();
    imagem.onload = () => setLogo(imagem);
    imagem.onerror = () => setLogo(false);
    imagem.src = logoMonteiroHd;
  }, []);

  useEffect(() => {
    const fechar = (evento) => { if (evento.key === 'Escape') onFechar(); };
    document.addEventListener('keydown', fechar);
    return () => document.removeEventListener('keydown', fechar);
  }, [onFechar]);

  const modo = modoDaDefinicao(definicao, estado.modo);
  const opcoesModo = estado.porModo[modo?.id] || OPCOES_VAZIAS;
  const grupoAtual = modo?.id === 'grupo' ? (modo.grupos.find((grupo) => grupo.chave === estado.grupo) || modo.grupos[0]) : null;
  const pessoasDoGrupo = grupoAtual ? [...grupoAtual.pessoas, ...(grupoAtual.extras || [])] : [];

  const estadoConteudo = useMemo(() => ({
    modo: modo?.id,
    itens: estado.itens,
    grupo: grupoAtual?.chave,
    pessoas: estado.pessoas,
    colunas: opcoesModo.colunas,
    ordem: opcoesModo.ordem,
  }), [modo, estado.itens, grupoAtual, estado.pessoas, opcoesModo]);
  const conteudo = useMemo(() => montarConteudo(definicao, estadoConteudo), [definicao, estadoConteudo]);
  const vazio = !conteudo || !conteudo.linhas.length;

  useEffect(() => {
    if (logo === null || !refCanvas.current || vazio) return undefined;
    const quadro = requestAnimationFrame(() => {
      try {
        desenharRelatorio(refCanvas.current, conteudo, { logo: logo || null, geradoPor, geradoEm: agoraTexto() });
        setErro('');
      } catch (falha) {
        setErro(falha?.message || 'Não foi possível montar a prévia.');
      }
    });
    return () => cancelAnimationFrame(quadro);
  }, [conteudo, logo, vazio, geradoPor]);

  const atualizarModo = (alteracao) => setEstado((atual) => ({
    ...atual,
    porModo: { ...atual.porModo, [modo.id]: { ...atual.porModo[modo.id], ...alteracao } },
  }));
  const alternarItens = (linhas, marcar) => setEstado((atual) => {
    const itens = new Set(atual.itens);
    linhas.forEach((linha) => (marcar ? itens.add(linha.chave) : itens.delete(linha.chave)));
    return { ...atual, itens };
  });
  const alternarPessoas = (linhas, marcar) => setEstado((atual) => {
    const pessoas = new Set(atual.pessoas);
    linhas.forEach((linha) => (marcar ? pessoas.add(linha.chave) : pessoas.delete(linha.chave)));
    return { ...atual, pessoas };
  });
  const escolherGrupo = (grupo) => setEstado((atual) => ({
    ...atual,
    grupo: grupo.chave,
    pessoas: new Set([...grupo.pessoas, ...(grupo.extras || [])].map((linha) => linha.chave)),
  }));
  const alternarColuna = (id) => {
    const colunas = new Set(opcoesModo.colunas);
    if (colunas.has(id)) colunas.delete(id); else colunas.add(id);
    atualizarModo({ colunas });
  };

  const baixar = async (formato) => {
    if (vazio || baixando) return;
    setBaixando(formato);
    setErro('');
    try {
      const extras = { logo: logo || null, geradoPor, geradoEm: agoraTexto() };
      if (formato === 'excel') {
        baixarArquivo(gerarPlanilhaRelatorio(conteudo, extras), nomeArquivo(definicao, conteudo, 'xlsx'));
      } else {
        const canvas = document.createElement('canvas');
        desenharRelatorio(canvas, conteudo, extras);
        baixarArquivo(await canvasParaPng(canvas), nomeArquivo(definicao, conteudo, 'png'));
      }
    } catch (falha) {
      setErro(falha?.message || 'Não foi possível gerar o arquivo.');
    } finally {
      setBaixando('');
    }
  };

  const colunasOpcionais = (modo?.colunas || []).filter((coluna) => !coluna.fixa);
  const colunasOrdenaveis = (modo?.colunas || []).filter((coluna) => coluna.fixa || coluna.tipo !== 'texto');
  const linhasItens = modo?.id === 'itens' ? modo.linhas : [];
  const feminino = ['unidade', 'estrutura'].includes(modo?.item);
  const formatoPrincipal = formatos.includes(formatoInicial) ? formatoInicial : formatos[0];
  const formatosBotoes = [...formatos.filter((formato) => formato !== formatoPrincipal), formatoPrincipal];

  return createPortal(
    <div className="fixed inset-0 z-[100050] flex items-center justify-center bg-black/50 p-2 sm:p-4" onMouseDown={(evento) => { if (evento.target === evento.currentTarget) onFechar(); }}>
      <div role="dialog" aria-modal="true" aria-label="Relatório" className="flex max-h-[96dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl font-black text-gray-700">Relatório · {definicao.titulo}</h3>
            <p className="mt-0.5 text-xs font-bold text-gray-400">
              {definicao.ciclo ? `Ciclo ${definicao.ciclo} · ` : ''}PNG 4K (3840 × 2160){formatos.includes('excel') ? ' ou Excel' : ''}, sempre em um arquivo só
            </p>
          </div>
          <button type="button" onClick={onFechar} aria-label="Fechar" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-50"><X size={20} /></button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 overflow-y-auto p-4 sm:p-6 lg:grid-cols-[minmax(320px,380px)_1fr]">
          <div className="min-w-0 space-y-4">
            {definicao.modos.length > 1 && (
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1">
                {definicao.modos.map((item) => {
                  const Icone = item.id === 'grupo' ? UsersRound : LayoutList;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setEstado((atual) => ({ ...atual, modo: item.id }))}
                      className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs sm:text-sm font-black ${modo?.id === item.id ? 'bg-white text-[#048187] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      <Icone size={16} className="shrink-0" />
                      <span className="leading-tight">{item.rotulo}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {modo?.id === 'itens' && (
              <Secao titulo={`${estado.itens.size} de ${linhasItens.length} ${modo.itens}`}>
                <AtalhosMeta linhas={linhasItens} marcadas={estado.itens} feminino={feminino} aoMarcar={(itens) => setEstado((atual) => ({ ...atual, itens }))} />
                <ListaMarcavel linhas={linhasItens} marcadas={estado.itens} alternar={alternarItens} />
              </Secao>
            )}

            {modo?.id === 'grupo' && (
              <>
                <Secao titulo={`Escolha a ${modo.item}`}>
                  <div className="max-h-[22dvh] lg:max-h-[20dvh] space-y-1.5 overflow-y-auto pr-1">
                    {modo.grupos.map((grupo) => {
                      const ativo = grupoAtual?.chave === grupo.chave;
                      return (
                        <button
                          key={grupo.chave}
                          type="button"
                          onClick={() => escolherGrupo(grupo)}
                          className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left ${ativo ? 'border-[#048187] bg-[#f0f9f9]' : 'border-gray-100 hover:bg-gray-50'}`}
                        >
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${ativo ? 'border-[#048187]' : 'border-gray-300'}`}>
                            {ativo ? <span className="h-2.5 w-2.5 rounded-full bg-[#048187]" /> : null}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-bold text-gray-700">{grupo.nome}</span>
                            <span className="block truncate text-[11px] font-bold text-gray-400">{grupo.resumoLista}{grupo.grupoLista ? ` · ${grupo.grupoLista}` : ''}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </Secao>
                <Secao titulo={`${modo.pessoas} (${estado.pessoas.size} de ${pessoasDoGrupo.length})`}>
                  <AtalhosMeta linhas={pessoasDoGrupo} marcadas={estado.pessoas} feminino={modo.pessoa === 'consultora'} aoMarcar={(pessoas) => setEstado((atual) => ({ ...atual, pessoas }))} />
                  <ListaMarcavel linhas={pessoasDoGrupo} marcadas={estado.pessoas} alternar={alternarPessoas} agrupar={false} />
                </Secao>
              </>
            )}

            <Secao titulo="Colunas">
              <div className="flex flex-wrap gap-1.5">
                {colunasOpcionais.map((coluna) => {
                  const ativa = opcoesModo.colunas.has(coluna.id);
                  return (
                    <button
                      key={coluna.id}
                      type="button"
                      onClick={() => alternarColuna(coluna.id)}
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-black ${ativa ? 'border-[#048187] bg-[#048187] text-white' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}
                    >
                      {ativa && <Check size={12} strokeWidth={3.5} />}
                      {coluna.rotulo}
                    </button>
                  );
                })}
              </div>
            </Secao>

            <Secao titulo="Ordem do ranking">
              <div className="flex gap-2">
                <select
                  value={opcoesModo.ordem?.coluna || ''}
                  onChange={(evento) => {
                    const escolhida = (modo?.colunas || []).find((coluna) => coluna.id === evento.target.value);
                    atualizarModo({ ordem: { coluna: evento.target.value, direcao: escolhida?.tipo === 'texto' ? 'asc' : 'desc' } });
                  }}
                  className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[13px] font-bold text-gray-700"
                >
                  {colunasOrdenaveis.map((coluna) => (
                    <option key={coluna.id} value={coluna.id}>{coluna.rotulo}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => atualizarModo({ ordem: { ...opcoesModo.ordem, direcao: opcoesModo.ordem?.direcao === 'asc' ? 'desc' : 'asc' } })}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-black text-gray-600 hover:bg-gray-50"
                  title="Inverter a ordem"
                >
                  {opcoesModo.ordem?.direcao === 'asc' ? <ArrowUpNarrowWide size={16} /> : <ArrowDownWideNarrow size={16} />}
                  {(modo?.colunas || []).find((coluna) => coluna.id === opcoesModo.ordem?.coluna)?.tipo === 'texto'
                    ? (opcoesModo.ordem?.direcao === 'asc' ? 'A → Z' : 'Z → A')
                    : (opcoesModo.ordem?.direcao === 'asc' ? 'Menor → maior' : 'Maior → menor')}
                </button>
              </div>
            </Secao>
          </div>

          <div className="min-w-0 space-y-2">
            <p className="text-[11px] font-black uppercase tracking-wide text-gray-400">Prévia{formatos.includes('excel') ? ' (o Excel sai com as mesmas linhas e colunas)' : ''}</p>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-[#f3f4f7] shadow-sm">
              {vazio ? (
                <div className="flex aspect-video items-center justify-center p-6 text-center text-sm font-bold text-gray-400">
                  Marque pelo menos uma linha para montar o relatório.
                </div>
              ) : (
                <canvas ref={refCanvas} className="block h-auto w-full" aria-label="Prévia do relatório" />
              )}
            </div>
            <p className="text-[11px] font-semibold text-gray-400">Cores do % da meta: verde 100% ou mais · laranja 80% a 99% · vermelho até 79%.</p>
            {erro && <p className="text-xs font-bold text-red-600">{erro}</p>}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:px-6">
          <button type="button" onClick={onFechar} className="rounded-xl px-4 py-2.5 text-sm font-black text-gray-500 hover:bg-gray-50">Cancelar</button>
          {formatosBotoes.map((formato) => {
            const principal = formato === formatoPrincipal;
            const Icone = formato === 'excel' ? FileSpreadsheet : ImageDown;
            return (
              <button
                key={formato}
                type="button"
                onClick={() => baixar(formato)}
                disabled={vazio || Boolean(baixando) || (formato === 'png' && logo === null)}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black shadow-sm disabled:cursor-not-allowed disabled:opacity-60 ${principal ? 'bg-[#048187] text-white hover:bg-[#036b70]' : 'border border-[#048187] bg-white text-[#048187] hover:bg-[#f0f9f9]'}`}
              >
                {baixando === formato ? <Loader2 size={17} className="animate-spin" /> : <Icone size={17} />}
                {baixando === formato ? 'Gerando...' : formato === 'excel' ? 'Baixar Excel' : 'Baixar PNG'}
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
};

/**
 * definicao: objeto (definicoes.js) ou função que o devolve (chamada ao abrir).
 * excelExtra: { titulo, descricao, baixar, baixando, erro } — planilha que já existia (ex.: revendedoras MAKE/CABELO).
 */
export default function BaixarRelatorio({ definicao, excelExtra = null, geradoPor = '', className = '' }) {
  const [menuAberto, setMenuAberto] = useState(false);
  const [posicaoMenu, setPosicaoMenu] = useState(null);
  const [janela, setJanela] = useState(null);
  const [definicaoAberta, setDefinicaoAberta] = useState(null);
  const refMenu = useRef(null);
  const refLista = useRef(null);

  // O menu é desenhado fora da janela (portal, posição fixa) para nunca ficar cortado por ela.
  useEffect(() => {
    if (!menuAberto) return undefined;
    const fora = (evento) => {
      if (refMenu.current?.contains(evento.target) || refLista.current?.contains(evento.target)) return;
      setMenuAberto(false);
    };
    const esc = (evento) => { if (evento.key === 'Escape') setMenuAberto(false); };
    const reposicionar = () => setPosicaoMenu(calcularPosicao());
    document.addEventListener('mousedown', fora);
    document.addEventListener('touchstart', fora, { passive: true });
    document.addEventListener('keydown', esc);
    window.addEventListener('resize', reposicionar);
    return () => {
      document.removeEventListener('mousedown', fora);
      document.removeEventListener('touchstart', fora);
      document.removeEventListener('keydown', esc);
      window.removeEventListener('resize', reposicionar);
    };
  }, [menuAberto]);

  function calcularPosicao() {
    const retangulo = refMenu.current?.getBoundingClientRect();
    if (!retangulo) return null;
    const largura = Math.min(300, window.innerWidth - 24);
    return { top: retangulo.bottom + 6, left: Math.max(12, Math.min(retangulo.left - 6, window.innerWidth - largura - 12)), width: largura };
  }

  const obterDefinicao = () => {
    try {
      const valor = typeof definicao === 'function' ? definicao() : definicao;
      return valor && Array.isArray(valor.modos) && valor.modos.length ? valor : null;
    } catch (falha) {
      console.warn('Relatório indisponível:', falha);
      return null;
    }
  };
  const abrir = (formato) => {
    setMenuAberto(false);
    const valor = obterDefinicao();
    if (!valor) return;
    setDefinicaoAberta(valor);
    setJanela(formato);
  };

  const previa = useMemo(() => (menuAberto ? obterDefinicao() : null), [menuAberto]); // eslint-disable-line react-hooks/exhaustive-deps
  const formatos = previa?.formatos || [];
  const temExcel = formatos.includes('excel');

  const clicarNuvem = () => {
    // Só imagem (LOJA) e sem planilha extra: abre direto a janela de escolha.
    const valor = obterDefinicao();
    if (valor && !(valor.formatos || []).includes('excel') && !excelExtra) {
      setDefinicaoAberta(valor);
      setJanela('png');
      return;
    }
    setPosicaoMenu(calcularPosicao());
    setMenuAberto((aberto) => !aberto);
  };

  return (
    <div className={`relative inline-flex flex-col items-start ${className}`} ref={refMenu}>
      <button
        type="button"
        onClick={clicarNuvem}
        aria-haspopup="menu"
        aria-expanded={menuAberto}
        aria-label="Baixar relatório"
        title="Baixar relatório"
        className={`-ml-1.5 flex h-9 w-9 items-center justify-center rounded-full text-[#048187] transition-colors hover:bg-[#e6f6f7] ${menuAberto ? 'bg-[#e6f6f7]' : ''}`}
      >
        {excelExtra?.baixando ? <Loader2 size={21} className="animate-spin" /> : <CloudDownload size={23} strokeWidth={2.1} />}
      </button>

      {menuAberto && posicaoMenu && createPortal(
        <div
          ref={refLista}
          role="menu"
          style={{ position: 'fixed', top: posicaoMenu.top, left: posicaoMenu.left, width: posicaoMenu.width }}
          className="z-[100040] rounded-2xl border border-gray-100 bg-white p-1.5 shadow-xl"
        >
          <OpcaoMenu
            icone={ImageDown}
            titulo="Imagem PNG (4K)"
            descricao={previa ? 'Relatório no padrão do Grupo Monteiro, pronto para compartilhar' : 'Sem dados para montar o relatório'}
            desabilitado={!previa}
            onClick={() => abrir('png')}
          />
          {temExcel && (
            <OpcaoMenu
              icone={FileSpreadsheet}
              titulo="Planilha Excel"
              descricao="O mesmo relatório (linhas, colunas e ordem) em planilha"
              onClick={() => abrir('excel')}
            />
          )}
          {excelExtra && (
            <OpcaoMenu
              icone={FileSpreadsheet}
              titulo={excelExtra.titulo || 'Planilha detalhada'}
              descricao={excelExtra.descricao || ''}
              desabilitado={excelExtra.baixando}
              carregando={excelExtra.baixando}
              onClick={() => { setMenuAberto(false); excelExtra.baixar?.(); }}
            />
          )}
        </div>,
        document.body,
      )}

      {excelExtra?.erro && <p className="mt-1 max-w-xs text-xs font-bold text-red-600">{excelExtra.erro}</p>}

      {janela && definicaoAberta && (
        <JanelaRelatorio
          definicao={definicaoAberta}
          formatoInicial={janela}
          geradoPor={geradoPor}
          onFechar={() => { setJanela(null); setDefinicaoAberta(null); }}
        />
      )}
    </div>
  );
}
