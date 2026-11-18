// Nuvem de download da janela MAKE / CABELO / MULTIMARCAS / ATIVIDADE (pedido do usuário, 18/11/2026).
// Oferece a imagem PNG 4K (relatorioIndicadorPng.js) e a planilha Excel que já existia (só MAKE e CABELO).
// A imagem só usa o que a própria janela mostra para o acesso da pessoa:
// - quem vê o "Acompanhamento por estrutura" (admin, gestor, coordenador...) escolhe entre
//   "Por estruturas" (marca quais) e "Estrutura e consultores";
// - gestor de unidade (não vê a lista de estruturas) fica com a(s) própria(s) estrutura(s).
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, CloudDownload, FileSpreadsheet, ImageDown, LayoutList, Loader2, UsersRound, X } from 'lucide-react';
import logoMonteiroHd from '../assets/logo-monteiro-branca-hd.png';
import {
  canvasParaPng,
  desenharRelatorioIndicador,
  linhasConsultoresDaEstrutura,
  nomeArquivoRelatorio,
  numero,
  percentual,
  prepararRelatorioIndicador,
} from './relatorioIndicadorPng';

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

const JanelaRelatorioPng = ({ preparado, ciclo, podeEstruturas, podeConsultores, modoInicial, baseAtualizada, geradoPor, onFechar }) => {
  const [modo, setModo] = useState(modoInicial);
  const [selecionadas, setSelecionadas] = useState(() => {
    const comDados = preparado.estruturas.filter((item) => item.temDados);
    return new Set((comDados.length ? comDados : preparado.estruturas).map((item) => item.chave));
  });
  const [chaveConsultores, setChaveConsultores] = useState(() => preparado.comConsultores[0]?.chave || '');
  const [logo, setLogo] = useState(null);
  const [baixando, setBaixando] = useState(false);
  const [erro, setErro] = useState('');
  const refCanvas = useRef(null);

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

  const nucleos = useMemo(() => {
    const mapa = new Map();
    preparado.estruturas.forEach((item) => mapa.set(item.nucleo, [...(mapa.get(item.nucleo) || []), item]));
    return Array.from(mapa.entries()).map(([nucleo, itens]) => ({
      nucleo,
      itens: [...itens].sort((a, b) => Number(b.com_indicador || 0) - Number(a.com_indicador || 0) || a.nome.localeCompare(b.nome, 'pt-BR')),
    }));
  }, [preparado]);

  const estruturaConsultores = preparado.comConsultores.find((item) => item.chave === chaveConsultores) || preparado.comConsultores[0] || null;
  const escolhidas = preparado.estruturas.filter((item) => selecionadas.has(item.chave));
  const semEscolha = modo === 'estruturas' ? escolhidas.length === 0 : !estruturaConsultores;

  const configuracao = useMemo(() => ({
    tipo: modo,
    rotulos: preparado,
    estruturas: preparado.estruturas.filter((item) => selecionadas.has(item.chave)),
    estrutura: estruturaConsultores,
    ciclo,
    baseAtualizada,
    geradoPor,
  }), [modo, preparado, selecionadas, estruturaConsultores, ciclo, baseAtualizada, geradoPor]);

  useEffect(() => {
    if (logo === null || !refCanvas.current || semEscolha) return undefined;
    const quadro = requestAnimationFrame(() => {
      try {
        desenharRelatorioIndicador(refCanvas.current, { ...configuracao, geradoEm: agoraTexto(), logo: logo || null });
        setErro('');
      } catch (falha) {
        setErro(falha?.message || 'Não foi possível montar a prévia.');
      }
    });
    return () => cancelAnimationFrame(quadro);
  }, [configuracao, logo, semEscolha]);

  const alternar = (chave) => setSelecionadas((atual) => {
    const novo = new Set(atual);
    if (novo.has(chave)) novo.delete(chave); else novo.add(chave);
    return novo;
  });
  const alternarNucleo = (itens) => setSelecionadas((atual) => {
    const novo = new Set(atual);
    const todos = itens.every((item) => novo.has(item.chave));
    itens.forEach((item) => (todos ? novo.delete(item.chave) : novo.add(item.chave)));
    return novo;
  });

  const baixar = async () => {
    if (semEscolha || baixando) return;
    setBaixando(true);
    setErro('');
    try {
      const canvas = document.createElement('canvas');
      desenharRelatorioIndicador(canvas, { ...configuracao, geradoEm: agoraTexto(), logo: logo || null });
      const blob = await canvasParaPng(canvas);
      baixarArquivo(blob, nomeArquivoRelatorio({ indicador: preparado.indicador, tipo: modo, estrutura: estruturaConsultores, ciclo }));
    } catch (falha) {
      setErro(falha?.message || 'Não foi possível gerar a imagem.');
    } finally {
      setBaixando(false);
    }
  };

  const resumoConsultores = estruturaConsultores ? linhasConsultoresDaEstrutura(estruturaConsultores) : null;

  return createPortal(
    <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/50 p-2 sm:p-4" onMouseDown={(evento) => { if (evento.target === evento.currentTarget) onFechar(); }}>
      <div role="dialog" aria-modal="true" aria-label="Relatório em imagem" className="flex max-h-[96dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl font-black text-gray-700">Relatório em imagem · {preparado.indicador}</h3>
            <p className="mt-0.5 text-xs font-bold text-gray-400">Ciclo {ciclo || '-'} · PNG 4K (3840 × 2160), sempre em uma imagem só</p>
          </div>
          <button type="button" onClick={onFechar} aria-label="Fechar" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-50"><X size={20} /></button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 overflow-y-auto p-4 sm:p-6 lg:grid-cols-[minmax(300px,360px)_1fr]">
          <div className="min-w-0 space-y-4">
            {podeEstruturas && podeConsultores && (
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1">
                {[
                  { id: 'estruturas', rotulo: 'Por estruturas', icone: LayoutList },
                  { id: 'consultores', rotulo: 'Estrutura e consultores', icone: UsersRound },
                ].map(({ id, rotulo, icone: Icone }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setModo(id)}
                    className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs sm:text-sm font-black ${modo === id ? 'bg-white text-[#048187] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <Icone size={16} className="shrink-0" />
                    <span className="leading-tight">{rotulo}</span>
                  </button>
                ))}
              </div>
            )}

            {modo === 'estruturas' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-black uppercase tracking-wide text-gray-400">{escolhidas.length} de {preparado.estruturas.length} estruturas</p>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setSelecionadas(new Set(preparado.estruturas.map((item) => item.chave)))} className="rounded-lg px-2.5 py-1 text-xs font-black text-[#048187] hover:bg-[#e6f6f7]">Todas</button>
                    <button type="button" onClick={() => setSelecionadas(new Set())} className="rounded-lg px-2.5 py-1 text-xs font-black text-gray-500 hover:bg-gray-100">Nenhuma</button>
                  </div>
                </div>
                <div className="max-h-[38dvh] lg:max-h-[52dvh] space-y-3 overflow-y-auto pr-1">
                  {nucleos.map(({ nucleo, itens }) => {
                    const marcados = itens.filter((item) => selecionadas.has(item.chave)).length;
                    return (
                      <div key={nucleo} className="overflow-hidden rounded-xl border border-gray-100">
                        <button type="button" onClick={() => alternarNucleo(itens)} className="flex w-full items-center gap-2.5 bg-[#dff4f5] px-3 py-2 text-left">
                          <CaixaMarcar marcado={marcados === itens.length} parcial={marcados > 0 && marcados < itens.length} />
                          <span className="text-sm font-black text-[#048187]">{nucleo}</span>
                          <span className="ml-auto text-[11px] font-black text-[#048187]">{marcados}/{itens.length}</span>
                        </button>
                        <div className="divide-y divide-gray-50">
                          {itens.map((item) => (
                            <button key={item.chave} type="button" onClick={() => alternar(item.chave)} className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-[#fbfefe]">
                              <CaixaMarcar marcado={selecionadas.has(item.chave)} />
                              <span className="min-w-0 flex-1 truncate text-sm font-bold text-gray-700">{item.nome}</span>
                              <span className="shrink-0 text-[11px] font-bold text-gray-400">{numero(item.com_indicador)}/{numero(item.ativos)} · {percentual(item.percentual_ativacao)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-wide text-gray-400">Escolha a estrutura</p>
                <div className="max-h-[38dvh] lg:max-h-[52dvh] space-y-1.5 overflow-y-auto pr-1">
                  {preparado.comConsultores.map((item) => {
                    const ativo = estruturaConsultores?.chave === item.chave;
                    return (
                      <button
                        key={item.chave}
                        type="button"
                        onClick={() => setChaveConsultores(item.chave)}
                        className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left ${ativo ? 'border-[#048187] bg-[#f0f9f9]' : 'border-gray-100 hover:bg-gray-50'}`}
                      >
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${ativo ? 'border-[#048187]' : 'border-gray-300'}`}>
                          {ativo ? <span className="h-2.5 w-2.5 rounded-full bg-[#048187]" /> : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-gray-700">{item.nome}</span>
                          <span className="block text-[11px] font-bold text-gray-400">{item.consultores.length} {item.consultores.length === 1 ? 'consultor' : 'consultores'} · {item.nucleo}</span>
                        </span>
                        <span className="shrink-0 text-[11px] font-bold text-gray-400">{numero(item.com_indicador)}/{numero(item.ativos)}</span>
                      </button>
                    );
                  })}
                </div>
                {resumoConsultores?.linhas.some((linha) => linha.semConsultor) && (
                  <p className="rounded-xl bg-[#f7f5fc] px-3 py-2 text-[11px] font-semibold leading-snug text-[#5c4b8a]">
                    A linha <b>SEM CONSULTOR</b> junta quem ativou pelo APP/VD Checkout ou por alguém fora do Cadastro de Consultores. Assim o total fecha com os cartões da estrutura.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-2">
            <p className="text-xs font-black uppercase tracking-wide text-gray-400">Prévia</p>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-[#f3f4f7] shadow-sm">
              {semEscolha ? (
                <div className="flex aspect-video items-center justify-center p-6 text-center text-sm font-bold text-gray-400">
                  {modo === 'estruturas' ? 'Marque pelo menos uma estrutura.' : 'Nenhuma estrutura com consultores.'}
                </div>
              ) : (
                <canvas ref={refCanvas} className="block h-auto w-full" aria-label="Prévia do relatório em imagem" />
              )}
            </div>
            {erro && <p className="text-xs font-bold text-red-600">{erro}</p>}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:px-6">
          <button type="button" onClick={onFechar} className="rounded-xl px-4 py-2.5 text-sm font-black text-gray-500 hover:bg-gray-50">Cancelar</button>
          <button
            type="button"
            onClick={baixar}
            disabled={semEscolha || baixando || logo === null}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#048187] px-5 py-2.5 text-sm font-black text-white shadow-sm hover:bg-[#036b70] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {baixando ? <Loader2 size={17} className="animate-spin" /> : <ImageDown size={17} />}
            {baixando ? 'Gerando imagem...' : 'Baixar PNG'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

/**
 * dados: resposta da janela (indicadorIaf). mostrarEstruturas: a pessoa vê o "Acompanhamento por estrutura".
 * acessoCompleto: admin/gestor/visualizador geral (lista todas as estruturas, inclusive zeradas).
 * excel: { disponivel, baixando, erro, baixar } — planilha que já existia (MAKE e CABELO).
 */
export default function BaixarRelatorioIndicador({ dados, mostrarEstruturas = true, acessoCompleto = true, baseAtualizada = '', geradoPor = '', excel = null }) {
  const [menuAberto, setMenuAberto] = useState(false);
  const [janelaAberta, setJanelaAberta] = useState(false);
  const refMenu = useRef(null);

  const preparado = useMemo(
    () => prepararRelatorioIndicador(dados, { soComDados: !acessoCompleto || !mostrarEstruturas }),
    [dados, acessoCompleto, mostrarEstruturas],
  );
  const podeConsultores = preparado.comConsultores.length > 0;
  const podeEstruturas = preparado.estruturas.length > 0 && (mostrarEstruturas || !podeConsultores);
  const podePng = podeConsultores || podeEstruturas;

  useEffect(() => {
    if (!menuAberto) return undefined;
    const fora = (evento) => { if (refMenu.current && !refMenu.current.contains(evento.target)) setMenuAberto(false); };
    const esc = (evento) => { if (evento.key === 'Escape') setMenuAberto(false); };
    document.addEventListener('mousedown', fora);
    document.addEventListener('touchstart', fora, { passive: true });
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', fora);
      document.removeEventListener('touchstart', fora);
      document.removeEventListener('keydown', esc);
    };
  }, [menuAberto]);

  return (
    <div className="relative inline-flex flex-col items-start" ref={refMenu}>
      <button
        type="button"
        onClick={() => setMenuAberto((aberto) => !aberto)}
        aria-haspopup="menu"
        aria-expanded={menuAberto}
        aria-label="Baixar relatório"
        title="Baixar relatório"
        className={`-ml-1.5 flex h-9 w-9 items-center justify-center rounded-full text-[#048187] transition-colors hover:bg-[#e6f6f7] ${menuAberto ? 'bg-[#e6f6f7]' : ''}`}
      >
        {excel?.baixando ? <Loader2 size={21} className="animate-spin" /> : <CloudDownload size={23} strokeWidth={2.1} />}
      </button>

      {menuAberto && (
        <div role="menu" className="absolute left-0 top-full z-40 mt-1.5 w-[min(290px,calc(100vw-3rem))] rounded-2xl border border-gray-100 bg-white p-1.5 shadow-xl">
          <OpcaoMenu
            icone={ImageDown}
            titulo="Imagem PNG (4K)"
            descricao={podePng ? 'Relatório no padrão do Grupo Monteiro, pronto para compartilhar' : 'Sem estruturas com resultado neste recorte'}
            desabilitado={!podePng}
            onClick={() => { setMenuAberto(false); setJanelaAberta(true); }}
          />
          <OpcaoMenu
            icone={FileSpreadsheet}
            titulo="Planilha Excel"
            descricao={excel?.disponivel ? 'Todas as revendedoras desta contagem' : 'Por enquanto só em MAKE e CABELO'}
            desabilitado={!excel?.disponivel || excel?.baixando}
            carregando={excel?.baixando}
            onClick={() => { setMenuAberto(false); excel?.baixar?.(); }}
          />
        </div>
      )}

      {excel?.erro && <p className="mt-1 max-w-xs text-xs font-bold text-red-600">{excel.erro}</p>}

      {janelaAberta && (
        <JanelaRelatorioPng
          preparado={preparado}
          ciclo={dados?.ciclo}
          podeEstruturas={podeEstruturas}
          podeConsultores={podeConsultores}
          modoInicial={podeEstruturas && mostrarEstruturas ? 'estruturas' : (podeConsultores ? 'consultores' : 'estruturas')}
          baseAtualizada={baseAtualizada}
          geradoPor={geradoPor}
          onFechar={() => setJanelaAberta(false)}
        />
      )}
    </div>
  );
}
