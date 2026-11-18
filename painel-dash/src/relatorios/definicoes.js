// Definições dos relatórios (imagem/Excel) de cada indicador, montadas com os dados que a própria janela
// já mostra para o acesso da pessoa. Formato em montarRelatorio.js.
import { COR, corFaixa, metaCartao, moeda, numero, percentual, temNumero, textoSaldo } from './formatos';

const coluna = (id, rotulo, tipo, opcoes = {}) => ({ id, rotulo, tipo, cor: 'cinza', peso: 600, padrao: true, ...opcoes });
// Coluna a mais de um indicador (pedidos, boletos, receita...): o valor vem em linha[id].
export const colunaExtra = coluna;
const colunaNome = (rotulo, opcoes = {}) => coluna('nome', rotulo, 'texto', { fixa: true, cor: 'texto', peso: 800, ...opcoes });
const pctMetaDe = (valor, meta) => (temNumero(meta) && Number(meta) > 0 ? (Number(valor || 0) / Number(meta)) * 100 : null);

// "NUCLEO 1", "N1 - ..." → "N1" (para agrupar a lista de escolha por núcleo).
export const nucleoCurto = (valor) => {
  const texto = String(valor || '').toUpperCase();
  if (!texto.trim()) return '';
  if (texto.includes('3')) return 'N3';
  if (texto.includes('2')) return 'N2';
  if (texto.includes('1')) return 'N1';
  return '';
};

const semAcento = (texto) => String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
const chaveExata = (texto) => semAcento(texto).toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
// "17325 - EQUIPE PINHEIRO", "N1 - EQUIPE PINHEIRO" e "EQUIPE PINHEIRO" viram a mesma chave.
export const chaveSemPrefixo = (texto) => chaveExata(String(texto || '').replace(/^\s*(?:N\s*\d+|\d+)\s*-\s*/i, ''));

// Casa nomes (pessoa → item) pela chave exata ou sem prefixo; ambíguo usa o núcleo.
export const criarCasador = (itens) => {
  const exata = new Map();
  const curta = new Map();
  itens.forEach((item) => {
    [item.nome, ...(item.aliases || [])].filter(Boolean).forEach((nome) => {
      exata.set(chaveExata(nome), item);
      const chave = chaveSemPrefixo(nome);
      const lista = curta.get(chave) || [];
      if (!lista.includes(item)) lista.push(item);
      curta.set(chave, lista);
    });
  });
  return (nome, nucleo) => {
    const direto = exata.get(chaveExata(nome));
    if (direto) return direto;
    const candidatos = curta.get(chaveSemPrefixo(nome)) || [];
    if (candidatos.length === 1) return candidatos[0];
    const doNucleo = candidatos.filter((item) => item.grupoLista && item.grupoLista === nucleo);
    return doNucleo.length === 1 ? doNucleo[0] : null;
  };
};

// ---------------------------------------------------------------------------------------------
// MAKE / CABELO / MULTIMARCAS / ATIVIDADE (janela do card Indicadores)
// ---------------------------------------------------------------------------------------------
export const rotulosIaf = (dados) => {
  const modoAtividade = Boolean(dados?.modo_atividade);
  const indicador = modoAtividade ? 'ATIVIDADE' : String(dados?.indicador || '').toUpperCase() || 'INDICADOR';
  return modoAtividade
    ? { indicador, modoAtividade, com: 'ATIVOS', comCartao: 'ATIVOS', ativos: 'BASE ATIVA TOTAL' }
    : { indicador, modoAtividade, com: `ATIVOS COM ${indicador}`, comCartao: `ATIVOS C/ ${indicador}`, ativos: 'ATIVOS NO CICLO' };
};

const linhaIaf = (item, extra = {}) => ({
  ...extra,
  com: Number(item?.com_indicador || 0),
  ativos: Number(item?.ativos || 0),
  pct: Number(item?.percentual_ativacao || 0),
  meta: Number(item?.meta_percentual || 0),
  pctMeta: temNumero(item?.percentual_meta) ? Number(item.percentual_meta) : null,
  ideal: Number(item?.ativacao_ideal || 0),
  saldo: Number(item?.saldo_meta || 0),
});

export const cartoesIaf = (rotulos, linha) => [
  { rotulo: rotulos.comCartao, valor: numero(linha.com), cor: COR.verde },
  { rotulo: rotulos.ativos, valor: numero(linha.ativos), cor: COR.cinza },
  { rotulo: '%ATIVAÇÃO', valor: percentual(linha.pct), cor: corFaixa(linha.pctMeta) },
  { rotulo: 'META', valor: metaCartao(linha.meta), cor: COR.cinza },
  { rotulo: '% DA META', valor: percentual(linha.pctMeta), cor: corFaixa(linha.pctMeta) },
  { rotulo: 'ATIVAÇÃO IDEAL', valor: numero(linha.ideal), cor: COR.cinza },
  { rotulo: 'SALDO', valor: textoSaldo(linha.saldo), cor: corFaixa(linha.pctMeta) },
];

/**
 * dados: resposta da janela (indicadorIaf). mostrarEstruturas: a pessoa vê o "Acompanhamento por estrutura".
 * acessoCompleto: admin/gestor/visualizador geral (lista também estruturas zeradas).
 */
export const definicaoIaf = (dados, { mostrarEstruturas = true, acessoCompleto = true, baseAtualizada = '' } = {}) => {
  const rotulos = rotulosIaf(dados);
  const soComDados = !acessoCompleto || !mostrarEstruturas;
  const estruturas = [];
  (dados?.por_estrutura || []).forEach((grupo) => {
    (grupo?.estruturas || []).forEach((item) => {
      const nome = String(item?.estrutura || item?.nome || '').trim();
      if (!nome) return;
      const linha = linhaIaf(item, { chave: `${grupo?.nucleo || ''}|${nome}`, nome, grupoLista: String(grupo?.nucleo || 'A DEFINIR') });
      linha.temDados = linha.ativos > 0 || linha.com > 0;
      linha.resumoLista = `${numero(linha.com)}/${numero(linha.ativos)} · ${percentual(linha.pct)}`;
      estruturas.push(linha);
    });
  });
  const visiveis = soComDados ? estruturas.filter((item) => item.temDados) : estruturas;

  // Consultor → estrutura pelo "grupo" do backend (nome do bloco); reserva pelo nome sem o código.
  const casar = criarCasador(visiveis);
  const pessoasPorEstrutura = new Map();
  if (dados?.permite_consultor !== false) {
    (dados?.por_consultor || []).forEach((grupo) => {
      (grupo?.consultores || []).forEach((consultor) => {
        const estrutura = (consultor?.grupo && casar(consultor.grupo, consultor?.nucleo)) || casar(consultor?.estrutura, consultor?.nucleo);
        if (!estrutura) return;
        const lista = pessoasPorEstrutura.get(estrutura.chave) || [];
        lista.push(linhaIaf(consultor, {
          chave: `c:${consultor?.id_colaborador || consultor?.nome}`,
          nome: String(consultor?.nome || '').toUpperCase(),
          id_colaborador: consultor?.id_colaborador || '',
          estrutura: String(consultor?.estrutura || '').toUpperCase(),
        }));
        pessoasPorEstrutura.set(estrutura.chave, lista);
      });
    });
  }
  const grupos = visiveis.filter((item) => pessoasPorEstrutura.has(item.chave)).map((item) => {
    const pessoas = pessoasPorEstrutura.get(item.chave);
    const somaCom = pessoas.reduce((soma, pessoa) => soma + pessoa.com, 0);
    const somaAtivos = pessoas.reduce((soma, pessoa) => soma + pessoa.ativos, 0);
    const difCom = item.com - somaCom;
    const difAtivos = item.ativos - somaAtivos;
    // Quem ativou pelo APP/VD Checkout ou por alguém fora do Cadastro de Consultores conta só para a estrutura.
    const extras = difCom >= 0 && difAtivos >= 0 && (difCom > 0 || difAtivos > 0)
      ? [{ chave: 'sem-consultor', semConsultor: true, nome: 'SEM CONSULTOR', detalhe: 'APP, VD Checkout ou fora do cadastro', com: difCom, ativos: difAtivos, pct: difAtivos > 0 ? (difCom / difAtivos) * 100 : 0, meta: null, pctMeta: null, ideal: null, saldo: null }]
      : [];
    return {
      chave: item.chave,
      nome: item.nome,
      grupoLista: item.grupoLista,
      resumoLista: `${pessoas.length} ${pessoas.length === 1 ? 'consultor' : 'consultores'} · ${numero(item.com)}/${numero(item.ativos)}`,
      linha: item,
      pessoas,
      extras,
    };
  });

  const colunasNumeros = (corCom) => [
    coluna('com', rotulos.com, 'inteiro', { cor: corCom, peso: 800 }),
    coluna('ativos', rotulos.ativos, 'inteiro'),
    coluna('pct', '% ATIVAÇÃO', 'percentual', { cor: 'texto', peso: 800 }),
    coluna('meta', 'META', 'percentual'),
    coluna('pctMeta', '% DA META', 'percentual', { cor: 'faixa', peso: 800 }),
    coluna('ideal', 'ATIVAÇÃO IDEAL', 'inteiro'),
    coluna('saldo', 'SALDO', 'saldo', { cor: 'faixa', peso: 800 }),
  ];
  const modos = [];
  if (visiveis.length && (mostrarEstruturas || !grupos.length)) {
    modos.push({
      id: 'itens',
      rotulo: 'Por estruturas',
      item: 'estrutura',
      itens: 'estruturas',
      linhas: visiveis,
      colunas: [colunaNome('ESTRUTURA'), ...colunasNumeros('verde')],
      ordem: 'pctMeta',
    });
  }
  if (grupos.length) {
    modos.push({
      id: 'grupo',
      rotulo: 'Estrutura e consultores',
      item: 'estrutura',
      pessoa: 'consultor',
      pessoas: 'consultores',
      grupos,
      colunas: [
        colunaNome('CONSULTOR', { sub: (linha) => (linha.semConsultor ? linha.detalhe : (linha.id_colaborador ? `ID ${linha.id_colaborador}` : '')), subRotulo: 'ID' }),
        coluna('estrutura', 'ESTRUTURA', 'texto', { cor: 'rotulo', peso: 400, escala: 0.97, valor: (linha) => (linha.semConsultor || linha.ehTotal ? '' : linha.estrutura) }),
        ...colunasNumeros('roxo'),
      ],
      ordem: 'pctMeta',
      cartoes: (grupo) => cartoesIaf(rotulos, grupo.linha),
      total: (grupo) => ({ ...grupo.linha, ehTotal: true, nome: `TOTAL ${grupo.nome}`.toUpperCase() }),
    });
  }
  return {
    titulo: rotulos.indicador,
    arquivo: rotulos.indicador,
    ciclo: dados?.ciclo || '',
    baseAtualizada,
    formatos: ['png', 'excel'],
    modos,
  };
};

// ---------------------------------------------------------------------------------------------
// Indicadores "valor × meta": Realizado Total, Realizado Diário, Eudora, Desempenho (RPA/TKT/UPA) e LOJA.
// ---------------------------------------------------------------------------------------------
/**
 * cfg = {
 *   titulo, arquivo, ciclo, baseAtualizada, formatos,
 *   tipoValor: 'moeda' | 'inteiro' | 'decimal2',
 *   rotulos: { item, itens, pessoa, pessoas, modoItens, modoGrupo, colunaItem, colunaPessoa, valor, meta, falta },
 *   itens: [{ chave, nome, grupoLista?, valor, meta, extras? }],
 *   grupos: [{ chave (= chave do item), pessoas: [{ chave, nome, sub?, estrutura?, valor, meta, extras? }] }],
 *   colunasExtras: [coluna] (valores em linha[id]),
 *   somavel: true (valor e meta somam: total e "sem consultor"), mostrarFalta: true, semConsultor: true,
 *   participacao: true, cartoesExtras: (linha) => [cartão],
 * }
 */
export const definicaoValorMeta = (cfg) => {
  const r = {
    item: 'estrutura', itens: 'estruturas', pessoa: 'consultor', pessoas: 'consultores',
    modoItens: 'Por estruturas', modoGrupo: 'Estrutura e consultores',
    colunaItem: 'ESTRUTURA', colunaPessoa: 'CONSULTOR', valor: 'REALIZADO', meta: 'META', falta: 'FALTA',
    ...(cfg.rotulos || {}),
  };
  const tipoValor = cfg.tipoValor || 'moeda';
  const tipoFalta = tipoValor === 'moeda' ? 'falta' : tipoValor === 'inteiro' ? 'faltaInteiro' : tipoValor;
  const somavel = cfg.somavel !== false;
  const mostrarFalta = cfg.mostrarFalta !== false;
  const extrasColunas = cfg.colunasExtras || [];
  const formatarValor = (valor) => (tipoValor === 'moeda' ? moeda(valor) : tipoValor === 'decimal2' ? numero(valor, 2) : numero(valor, 0));

  const montarLinha = (base, totalValor) => {
    const valor = Number(base?.valor || 0);
    const meta = temNumero(base?.meta) && Number(base.meta) > 0 ? Number(base.meta) : null;
    const pctMeta = pctMetaDe(valor, meta);
    return {
      ...(base?.extras || {}),
      ...base,
      valor,
      meta,
      pctMeta,
      falta: meta === null ? null : Math.max(meta - valor, 0),
      participacao: totalValor > 0 ? (valor / totalValor) * 100 : null,
    };
  };

  const totalItens = (cfg.itens || []).reduce((soma, item) => soma + Number(item?.valor || 0), 0);
  const itens = (cfg.itens || []).map((item) => {
    const linha = montarLinha(item, totalItens);
    linha.temDados = item.temDados !== undefined ? item.temDados : (linha.valor !== 0 || linha.meta !== null);
    linha.resumoLista = item.resumoLista || `${formatarValor(linha.valor)}${linha.pctMeta !== null ? ` · ${percentual(linha.pctMeta)}` : ''}`;
    return linha;
  });
  const itensPorChave = new Map(itens.map((item) => [item.chave, item]));

  const grupos = (cfg.grupos || []).map((grupo) => {
    const item = itensPorChave.get(grupo.chave);
    if (!item || !(grupo.pessoas || []).length) return null;
    const totalPessoas = (grupo.pessoas || []).reduce((soma, pessoa) => soma + Number(pessoa?.valor || 0), 0);
    const pessoas = grupo.pessoas.map((pessoa) => montarLinha(pessoa, item.valor || totalPessoas));
    const diferenca = item.valor - totalPessoas;
    const tolerancia = tipoValor === 'moeda' ? 0.5 : 0.5;
    const extras = cfg.semConsultor !== false && somavel && diferenca > tolerancia
      ? [{
          ...montarLinha({ chave: 'sem-consultor', nome: `SEM ${r.colunaPessoa}`, valor: diferenca, meta: null }, item.valor),
          semConsultor: true,
          detalhe: cfg.detalheSemPessoa || 'APP, VD Checkout ou fora do cadastro',
          ...(cfg.extrasSemPessoa ? cfg.extrasSemPessoa(item, grupo.pessoas) : {}),
        }]
      : [];
    return {
      chave: item.chave,
      nome: item.nome,
      grupoLista: item.grupoLista,
      resumoLista: `${pessoas.length} ${pessoas.length === 1 ? r.pessoa : r.pessoas} · ${formatarValor(item.valor)}`,
      linha: item,
      pessoas,
      extras,
    };
  }).filter(Boolean);

  // comMeta = false: ninguém da lista tem meta (ex.: consultores da Eudora) → colunas de meta desmarcadas por padrão.
  const colunasValor = (corValor, comMeta = true) => [
    coluna('valor', r.valor, tipoValor, { cor: corValor, peso: 800 }),
    coluna('meta', r.meta, tipoValor, { padrao: comMeta }),
    coluna('pctMeta', '% DA META', 'percentual', { cor: 'faixa', peso: 800, padrao: comMeta }),
    ...(mostrarFalta ? [coluna('falta', r.falta, tipoFalta, { cor: 'faixa', peso: 700, padrao: comMeta })] : []),
  ];
  const colunasParticipacao = cfg.participacao === false || !somavel ? [] : [coluna('participacao', 'PARTICIPAÇÃO', 'percentual', { padrao: false })];
  const temMeta = itens.some((item) => item.pctMeta !== null);

  const cartoes = (linha) => [
    { rotulo: r.valor, valor: formatarValor(linha.valor), cor: COR.verde },
    { rotulo: r.meta, valor: linha.meta === null ? '—' : formatarValor(linha.meta), cor: COR.cinza },
    { rotulo: '% DA META', valor: linha.pctMeta === null ? '—' : percentual(linha.pctMeta), cor: corFaixa(linha.pctMeta) },
    ...(mostrarFalta ? [{ rotulo: r.falta, valor: linha.meta === null ? '—' : (linha.falta > 0.004 ? formatarValor(linha.falta) : 'Batida'), cor: corFaixa(linha.pctMeta) }] : []),
    ...(cfg.cartoesExtras ? cfg.cartoesExtras(linha) : []),
  ];

  const somar = (linhas, nome) => {
    const valor = linhas.reduce((soma, linha) => soma + Number(linha.valor || 0), 0);
    const comMeta = linhas.filter((linha) => linha.meta !== null);
    const meta = comMeta.length ? comMeta.reduce((soma, linha) => soma + linha.meta, 0) : null;
    const valorComMeta = comMeta.reduce((soma, linha) => soma + Number(linha.valor || 0), 0);
    const extras = {};
    extrasColunas.forEach((extra) => {
      if (extra.somavel !== false && ['inteiro', 'moeda'].includes(extra.tipo)) extras[extra.id] = linhas.reduce((soma, linha) => soma + Number(linha[extra.id] || 0), 0);
    });
    return {
      ...extras,
      ehTotal: true,
      nome,
      valor,
      meta,
      pctMeta: meta ? (valorComMeta / meta) * 100 : null,
      falta: meta ? Math.max(meta - valorComMeta, 0) : null,
      participacao: null,
    };
  };

  const modos = [];
  if (itens.length) {
    modos.push({
      id: 'itens',
      rotulo: r.modoItens,
      item: r.item,
      itens: r.itens,
      linhas: itens,
      colunas: [colunaNome(r.colunaItem), ...extrasColunas.filter((extra) => extra.antes), ...colunasValor('verde'), ...extrasColunas.filter((extra) => !extra.antes), ...colunasParticipacao],
      ordem: temMeta ? 'pctMeta' : 'valor',
      total: somavel ? (linhas) => somar(linhas, `TOTAL (${linhas.length} ${linhas.length === 1 ? r.item : r.itens})`.toUpperCase()) : null,
    });
  }
  if (grupos.length) {
    const pessoasComMeta = grupos.some((grupo) => grupo.pessoas.some((pessoa) => pessoa.pctMeta !== null));
    modos.push({
      id: 'grupo',
      rotulo: r.modoGrupo,
      item: r.item,
      pessoa: r.pessoa,
      pessoas: r.pessoas,
      grupos,
      colunas: [
        colunaNome(r.colunaPessoa, { sub: (linha) => (linha.semConsultor ? linha.detalhe : (linha.sub || '')), subRotulo: cfg.subRotulo || 'ID' }),
        ...(cfg.colunaEstruturaPessoa === false ? [] : [coluna('estrutura', r.colunaItem, 'texto', { cor: 'rotulo', peso: 400, escala: 0.97, valor: (linha) => (linha.semConsultor || linha.ehTotal ? '' : (linha.estrutura || '')) })]),
        ...extrasColunas.filter((extra) => extra.antes),
        ...colunasValor('roxo', pessoasComMeta),
        ...extrasColunas.filter((extra) => !extra.antes),
        ...(somavel && cfg.participacao !== false ? [coluna('participacao', 'PARTICIPAÇÃO', 'percentual', { padrao: !pessoasComMeta })] : []),
      ],
      ordem: pessoasComMeta ? 'pctMeta' : 'valor',
      cartoes: (grupo) => cartoes(grupo.linha),
      total: (grupo) => ({ ...grupo.linha, ehTotal: true, nome: `TOTAL ${grupo.nome}`.toUpperCase(), participacao: null }),
    });
  }
  return {
    titulo: cfg.titulo,
    arquivo: cfg.arquivo || cfg.titulo,
    recorte: cfg.recorte || (r.itens === 'unidades' ? 'Unidades' : 'Estruturas'),
    ciclo: cfg.ciclo || '',
    baseAtualizada: cfg.baseAtualizada || '',
    formatos: cfg.formatos || ['png', 'excel'],
    modos,
  };
};

// Rótulos da LOJA (unidades e consultoras).
export const ROTULOS_LOJA = {
  item: 'unidade', itens: 'unidades', pessoa: 'consultora', pessoas: 'consultoras',
  modoItens: 'Por unidades', modoGrupo: 'Unidade e consultoras', colunaItem: 'UNIDADE', colunaPessoa: 'CONSULTORA',
};

// Estruturas/unidades do dia (Realizado Diário VD e Venda diária LOJA) → itens e grupos.
export const dadosDoDia = (estruturas = [], { diaUtil = true, chavePessoa = 'id_consultor' } = {}) => {
  const itens = [];
  const grupos = [];
  estruturas.forEach((item, indice) => {
    const nome = String(item?.estrutura || 'Não informada').trim();
    const chave = `${item?.meta_id ?? ''}|${nome}|${indice}`;
    const meta = diaUtil && Number(item?.meta_hoje || 0) > 0 ? Number(item.meta_hoje) : null;
    itens.push({
      chave,
      nome: nome.toUpperCase(),
      grupoLista: item?.nucleo && item.nucleo !== 'SEM META' ? item.nucleo : '',
      valor: Number(item?.vendido_hoje || 0),
      meta,
      pedidos: Number(item?.pedidos || 0),
      temDados: Number(item?.vendido_hoje || 0) > 0 || meta !== null,
    });
    const consultores = Array.isArray(item?.consultores) ? item.consultores : [];
    if (consultores.length) {
      grupos.push({
        chave,
        pessoas: consultores.map((pessoa, posicao) => ({
          chave: `p:${pessoa?.[chavePessoa] || pessoa?.consultor || posicao}`,
          nome: String(pessoa?.consultor || 'Não identificado').toUpperCase(),
          sub: pessoa?.[chavePessoa] ? `ID ${pessoa[chavePessoa]}` : '',
          estrutura: nome.toUpperCase(),
          valor: Number(pessoa?.vendido_hoje || 0),
          meta: diaUtil && Number(pessoa?.meta_hoje || 0) > 0 ? Number(pessoa.meta_hoje) : null,
          pedidos: Number(pessoa?.pedidos || 0),
        })),
      });
    }
  });
  return { itens, grupos };
};
