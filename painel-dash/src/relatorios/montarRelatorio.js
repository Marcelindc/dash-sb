// Aplica as escolhas da janela de relatório (modo, linhas marcadas, colunas, ordem) a uma definição
// (definicoes.js) e devolve o conteúdo pronto para a imagem (desenhoRelatorio.js) e o Excel (planilhaRelatorio.js).
//
// definicao = { titulo, ciclo, baseAtualizada, arquivo, formatos: ['png','excel'], modos: [modo] }
// modo 'itens'  = { id:'itens', rotulo, item, itens, linhas:[linha], colunas:[coluna], ordem, cartoes?(linhas), total?(linhas) }
// modo 'grupo'  = { id:'grupo', rotulo, item, pessoa, pessoas, grupos:[{ chave, nome, grupoLista, resumoLista, linha,
//                   pessoas:[linha], extras:[linha] }], colunas, ordem, cartoes(grupo), total(grupo) }
// linha  = { chave, nome, pctMeta (% da meta; null = sem meta), grupoLista?, resumoLista?, semConsultor?, ...valores }
// coluna = { id, rotulo, tipo, valor?(linha), cor ('verde'|'roxo'|'cinza'|'texto'|'rotulo'|'faixa'|fn), peso?,
//            sub?(linha), subRotulo?, padrao, fixa }
import { COR, corFaixa, formatarValor, temNumero } from './formatos';

export const valorBruto = (coluna, linha) => (typeof coluna?.valor === 'function' ? coluna.valor(linha) : linha?.[coluna?.id]);

export const textoCelula = (coluna, linha) => {
  const valor = valorBruto(coluna, linha);
  return coluna.tipo === 'texto' ? String(valor ?? '').trim() : formatarValor(coluna.tipo, valor);
};

const CORES_NOMEADAS = { verde: COR.verde, roxo: COR.roxo, cinza: COR.cinza, texto: COR.texto, rotulo: COR.rotulo };

export const corCelula = (coluna, linha) => {
  const valor = valorBruto(coluna, linha);
  if (coluna.tipo !== 'texto' && !temNumero(valor)) return COR.cabecalho;
  if (typeof coluna.cor === 'function') return coluna.cor(linha);
  if (coluna.cor === 'faixa') return corFaixa(linha?.pctMeta);
  return CORES_NOMEADAS[coluna.cor] || COR.texto;
};

export const modoDaDefinicao = (definicao, id) => (definicao?.modos || []).find((modo) => modo.id === id) || definicao?.modos?.[0] || null;

// Maior → menor por padrão; sem valor vai para o fim; empate pelo nome.
export const ordenarLinhas = (linhas, coluna, direcao = 'desc') => {
  const fator = direcao === 'asc' ? 1 : -1;
  return [...linhas].sort((a, b) => {
    if (coluna && coluna.tipo !== 'texto') {
      const va = valorBruto(coluna, a);
      const vb = valorBruto(coluna, b);
      const temA = temNumero(va);
      const temB = temNumero(vb);
      if (temA && temB && Number(va) !== Number(vb)) return (Number(va) - Number(vb)) * fator;
      if (temA !== temB) return temA ? -1 : 1;
    } else if (coluna) {
      const comparacao = String(valorBruto(coluna, a) ?? '').localeCompare(String(valorBruto(coluna, b) ?? ''), 'pt-BR');
      if (comparacao) return direcao === 'desc' ? -comparacao : comparacao;
    }
    return String(a?.nome || '').localeCompare(String(b?.nome || ''), 'pt-BR');
  });
};

export const colunasPadrao = (modo) => new Set((modo?.colunas || []).filter((coluna) => coluna.fixa || coluna.padrao !== false).map((coluna) => coluna.id));

// estado = { modo, itens:Set, grupo, pessoas:Set, colunas:Set, ordem:{ coluna, direcao } }
export const montarConteudo = (definicao, estado) => {
  const modo = modoDaDefinicao(definicao, estado?.modo);
  if (!modo) return null;
  const colunas = modo.colunas.filter((coluna) => coluna.fixa || estado?.colunas?.has(coluna.id));
  const colunaOrdem = modo.colunas.find((coluna) => coluna.id === estado?.ordem?.coluna)
    || modo.colunas.find((coluna) => coluna.id === modo.ordem)
    || null;
  const direcao = estado?.ordem?.direcao || 'desc';
  const base = {
    titulo: `RELATÓRIO ${definicao.titulo}`,
    ciclo: definicao.ciclo,
    baseAtualizada: definicao.baseAtualizada,
    colunas,
  };
  if (modo.id === 'grupo') {
    const grupo = modo.grupos.find((item) => item.chave === estado?.grupo) || modo.grupos[0];
    if (!grupo) return { ...base, cartoes: null, linhas: [], total: null };
    const marcadas = estado?.pessoas || new Set();
    const pessoas = ordenarLinhas((grupo.pessoas || []).filter((linha) => marcadas.has(linha.chave)), colunaOrdem, direcao);
    const extras = (grupo.extras || []).filter((linha) => marcadas.has(linha.chave));
    return {
      ...base,
      grupo: grupo.nome,
      cartoes: modo.cartoes ? modo.cartoes(grupo) : null,
      linhas: [...pessoas, ...extras],
      total: modo.total ? modo.total(grupo) : null,
    };
  }
  const marcadas = estado?.itens || new Set();
  const linhas = ordenarLinhas(modo.linhas.filter((linha) => marcadas.has(linha.chave)), colunaOrdem, direcao);
  return {
    ...base,
    cartoes: modo.cartoes ? modo.cartoes(linhas) : null,
    linhas,
    total: modo.total ? modo.total(linhas) : null,
  };
};

const semAcento = (texto) => String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
const slug = (texto) => semAcento(texto).replace(/[^0-9A-Za-z]+/g, '_').replace(/^_+|_+$/g, '') || 'relatorio';

export const nomeArquivo = (definicao, conteudo, extensao) => {
  const recorte = conteudo?.grupo ? slug(conteudo.grupo) : (definicao?.recorte || 'Estruturas');
  const ciclo = slug(String(definicao?.ciclo || '').replace('/', '-'));
  return `Relatorio_${slug(definicao?.arquivo || definicao?.titulo)}_${recorte}${ciclo ? `_Ciclo_${ciclo}` : ''}.${extensao}`;
};
