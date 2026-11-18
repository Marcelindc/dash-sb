// Relatório em imagem dos indicadores MAKE, CABELO, MULTIMARCAS e ATIVIDADE (janela aberta pelo card Indicadores).
// Sempre um PNG só, em 4K (3840 × 2160), no modelo do usuário (18/11/2026):
// - cabeçalho: logo do Grupo Monteiro num bloco inclinado + faixa "RELATÓRIO X" em degradê (verde → preto);
// - "estruturas": tabela das estruturas escolhidas (sem cartões), igual ao modelo 3;
// - "consultores": cartões com o resultado oficial da estrutura + tabela dos consultores + total, igual ao modelo 4.
// Muitas linhas: a tabela se divide em 2 ou 3 colunas para continuar legível numa imagem só.
// Os números vêm prontos da própria janela (mesma resposta da API); aqui só se desenha.

export const LARGURA_RELATORIO = 3840;
export const ALTURA_RELATORIO = 2160;

const FONTE = '"Segoe UI", "Segoe UI Variable", system-ui, -apple-system, "Helvetica Neue", Roboto, Arial, sans-serif';

const COR = {
  fundo: '#f3f4f7',
  verde: '#048187',
  verdeFaixa: '#047f85',
  texto: '#374151',
  textoForte: '#111827',
  cinza: '#4b5563',
  rotulo: '#6b7280',
  cabecalho: '#9ca3af',
  vinho: '#7c1f31',
  roxo: '#5c4b8a',
  fundoCabecalho: '#f9fafb',
  separador: '#eef0f3',
  fundoTotal: '#f7f5fc',
  fundoSemConsultor: '#fbfbfd',
  cartao: '#fdfdfd',
  branco: '#ffffff',
};

// Medidas do modelo (1280 × 720) multiplicadas por 3.
const MARGEM_X = 390;
const LARGURA_CONTEUDO = 3060;
const BORDA_TEXTO_DIREITA = 3420;
const FAIXA_TABELA = 21;
const LIMITE_TABELA = 1960; // a faixa de baixo termina no máximo em 1981; o rodapé fica em 2082
const BASE_RODAPE = 2082;

// ---------- números (também usados nos cartões da janela) ----------
export const numero = (valor, casas = 0) => Number(valor || 0).toLocaleString('pt-BR', {
  minimumFractionDigits: casas,
  maximumFractionDigits: casas,
});
export const percentual = (valor) => `${numero(valor, 1)}%`;
export const metaCartao = (valor) => {
  const meta = Number(valor || 0);
  return `${numero(meta, Math.abs(meta - Math.round(meta)) < 0.05 ? 0 : 1)}%`;
};
export const textoSaldo = (valor) => {
  const saldo = Math.round(Number(valor || 0));
  return `${saldo > 0 ? '+' : ''}${numero(saldo, 0)}`;
};
const corSaldo = (valor) => (Number(valor || 0) < 0 ? COR.vinho : COR.verde);
const arredondarExcel = (valor) => Math.floor(Math.max(Number(valor || 0), 0) + 0.5);

// Mesma conta do backend (_linha_resultado_iaf), usada só quando a soma dos consultores vira o total.
export const linhaResultado = (com, ativos, meta) => {
  const pct = ativos > 0 ? (com / ativos) * 100 : 0;
  const ideal = arredondarExcel((ativos * meta) / 100);
  return {
    com_indicador: com,
    ativos,
    percentual_ativacao: Math.round(pct * 100) / 100,
    meta_percentual: meta,
    percentual_meta: meta > 0 ? Math.round(((pct / meta) * 100) * 100) / 100 : 0,
    ativacao_ideal: ideal,
    saldo_meta: com - ideal,
  };
};

// ---------- nomes ----------
const semAcento = (texto) => String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
const chaveExata = (texto) => semAcento(texto).toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
// "17325 - EQUIPE PINHEIRO", "N1 - EQUIPE PINHEIRO" e "EQUIPE PINHEIRO" viram a mesma chave.
const chaveSemPrefixo = (texto) => chaveExata(String(texto || '').replace(/^\s*(?:N\s*\d+|\d+)\s*-\s*/i, ''));

export const rotulosIndicador = (dados) => {
  const modoAtividade = Boolean(dados?.modo_atividade);
  const indicador = modoAtividade ? 'ATIVIDADE' : String(dados?.indicador || '').toUpperCase() || 'INDICADOR';
  return modoAtividade
    ? { indicador, modoAtividade, com: 'ATIVOS', comCartao: 'ATIVOS', ativos: 'BASE ATIVA TOTAL' }
    : { indicador, modoAtividade, com: `ATIVOS COM ${indicador}`, comCartao: `ATIVOS C/ ${indicador}`, ativos: 'ATIVOS NO CICLO' };
};

// Estruturas e consultores da resposta da janela, já casados (consultor → estrutura).
export const prepararRelatorioIndicador = (dados, { soComDados = false } = {}) => {
  const estruturas = [];
  (dados?.por_estrutura || []).forEach((grupo) => {
    (grupo?.estruturas || []).forEach((item) => {
      const nome = String(item?.estrutura || item?.nome || '').trim();
      if (!nome) return;
      estruturas.push({
        ...item,
        chave: `${grupo?.nucleo || ''}|${nome}`,
        nome,
        nucleo: String(grupo?.nucleo || item?.nucleo || 'A DEFINIR'),
        temDados: Number(item?.ativos || 0) > 0 || Number(item?.com_indicador || 0) > 0,
        consultores: [],
      });
    });
  });

  const porChaveExata = new Map();
  const porChaveSemPrefixo = new Map();
  estruturas.forEach((estrutura) => {
    porChaveExata.set(chaveExata(estrutura.nome), estrutura);
    const curta = chaveSemPrefixo(estrutura.nome);
    porChaveSemPrefixo.set(curta, [...(porChaveSemPrefixo.get(curta) || []), estrutura]);
  });
  const acharEstrutura = (consultor) => {
    // "grupo" = nome do bloco que o backend resolveu pelo vínculo (vale também para vínculo com outro nome).
    if (consultor?.grupo) {
      const exata = porChaveExata.get(chaveExata(consultor.grupo));
      if (exata) return exata;
    }
    const candidatas = porChaveSemPrefixo.get(chaveSemPrefixo(consultor?.grupo || consultor?.estrutura)) || [];
    if (candidatas.length === 1) return candidatas[0];
    const doNucleo = candidatas.filter((item) => item.nucleo === consultor?.nucleo);
    return doNucleo.length === 1 ? doNucleo[0] : null;
  };

  if (dados?.permite_consultor !== false) {
    (dados?.por_consultor || []).forEach((grupo) => {
      (grupo?.consultores || []).forEach((consultor) => {
        const estrutura = acharEstrutura(consultor);
        if (estrutura) estrutura.consultores.push(consultor);
      });
    });
  }

  const visiveis = soComDados ? estruturas.filter((item) => item.temDados) : estruturas;
  return {
    ...rotulosIndicador(dados),
    estruturas: visiveis,
    comConsultores: visiveis.filter((item) => item.consultores.length > 0),
  };
};

// Linhas da tabela "uma estrutura e seus consultores". Quem ativou pelo APP/VD Checkout ou por alguém fora
// do Cadastro de Consultores conta só para a estrutura: vira a linha "SEM CONSULTOR" e o TOTAL fecha com
// os cartões (resultado oficial da estrutura).
export const linhasConsultoresDaEstrutura = (estrutura) => {
  const consultores = [...(estrutura?.consultores || [])].sort(
    (a, b) => Number(b.com_indicador || 0) - Number(a.com_indicador || 0)
      || Number(b.ativos || 0) - Number(a.ativos || 0)
      || String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR'),
  );
  const soma = consultores.reduce((acc, item) => ({
    com: acc.com + Number(item.com_indicador || 0),
    ativos: acc.ativos + Number(item.ativos || 0),
    metaPonderada: acc.metaPonderada + Number(item.ativos || 0) * Number(item.meta_percentual || 0),
  }), { com: 0, ativos: 0, metaPonderada: 0 });
  const difCom = Number(estrutura?.com_indicador || 0) - soma.com;
  const difAtivos = Number(estrutura?.ativos || 0) - soma.ativos;
  const fechaComEstrutura = difCom >= 0 && difAtivos >= 0;
  const semConsultor = fechaComEstrutura && (difCom > 0 || difAtivos > 0)
    ? {
        semConsultor: true,
        nome: 'SEM CONSULTOR',
        detalhe: 'APP, VD Checkout ou fora do cadastro',
        com_indicador: difCom,
        ativos: difAtivos,
        percentual_ativacao: difAtivos > 0 ? (difCom / difAtivos) * 100 : 0,
      }
    : null;
  const metaSoma = soma.ativos > 0 ? soma.metaPonderada / soma.ativos : Number(estrutura?.meta_percentual || 0);
  const total = fechaComEstrutura
    ? { ...estrutura }
    : linhaResultado(soma.com, soma.ativos, metaSoma);
  return {
    linhas: semConsultor ? [...consultores, semConsultor] : consultores,
    total: { ...total, ehTotal: true, id_colaborador: '', nome: `TOTAL ${String(estrutura?.nome || '').toUpperCase()}`.trim() },
  };
};

// ---------- desenho ----------
const fonte = (peso, tamanho, italico = false) => `${italico ? 'italic ' : ''}${peso} ${Math.round(tamanho)}px ${FONTE}`;

// Diminui a fonte até caber; se nem no mínimo couber, corta com reticências. Deixa ctx.font no tamanho final.
const caber = (ctx, texto, larguraMaxima, { tamanho, peso = 700, minimo = 20, italico = false }) => {
  const valor = String(texto ?? '');
  let atual = Math.round(tamanho);
  ctx.font = fonte(peso, atual, italico);
  while (atual > minimo && ctx.measureText(valor).width > larguraMaxima) {
    atual -= 1;
    ctx.font = fonte(peso, atual, italico);
  }
  if (ctx.measureText(valor).width <= larguraMaxima) return valor;
  let corte = valor;
  while (corte.length > 1 && ctx.measureText(`${corte}…`).width > larguraMaxima) corte = corte.slice(0, -1);
  return `${corte.trimEnd()}…`;
};

const poligono = (ctx, pontos, preenchimento) => {
  ctx.beginPath();
  pontos.forEach(([x, y], indice) => (indice ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fillStyle = preenchimento;
  ctx.fill();
};

const retanguloArredondado = (ctx, x, y, largura, altura, raio) => {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, largura, altura, raio);
    return;
  }
  ctx.moveTo(x + raio, y);
  ctx.arcTo(x + largura, y, x + largura, y + altura, raio);
  ctx.arcTo(x + largura, y + altura, x, y + altura, raio);
  ctx.arcTo(x, y + altura, x, y, raio);
  ctx.arcTo(x, y, x + largura, y, raio);
  ctx.closePath();
};

const faixaDegrade = (ctx, x, y, largura, altura) => {
  const degrade = ctx.createLinearGradient(x, 0, x + largura, 0);
  degrade.addColorStop(0, '#048187');
  degrade.addColorStop(0.5, '#034144');
  degrade.addColorStop(0.85, '#021415');
  degrade.addColorStop(1, '#020203');
  ctx.fillStyle = degrade;
  ctx.fillRect(x, y, largura, altura);
};

const quebrarRotulo = (ctx, texto, larguraMaxima) => {
  if (ctx.measureText(texto).width <= larguraMaxima) return [texto];
  const palavras = texto.split(' ');
  if (palavras.length < 2) return [texto];
  let melhor = null;
  for (let corte = 1; corte < palavras.length; corte += 1) {
    const linhas = [palavras.slice(0, corte).join(' '), palavras.slice(corte).join(' ')];
    const maior = Math.max(...linhas.map((linha) => ctx.measureText(linha).width));
    if (!melhor || maior < melhor.maior) melhor = { linhas, maior };
  }
  return melhor.linhas;
};

const desenharCabecalho = (ctx, { titulo, linhaInfo, logo }) => {
  ctx.fillStyle = COR.fundo;
  ctx.fillRect(0, 0, LARGURA_RELATORIO, ALTURA_RELATORIO);

  const inclinacao = 0.49;
  const topoBloco = 39;
  const baseBloco = 279;
  const topoFaixa = 87;
  const baseFaixa = 228;
  const esquerdaBloco = (y) => 96 + inclinacao * (y - topoBloco);
  const direitaBloco = (y) => 906 + inclinacao * (y - topoBloco);
  const inicioFaixa = (y) => direitaBloco(y) + 34;
  const fimFaixa = 3681;

  // Pedacinho à esquerda do bloco do logo.
  poligono(ctx, [
    [57, topoFaixa], [esquerdaBloco(topoFaixa) - 30, topoFaixa],
    [esquerdaBloco(baseFaixa) - 30, baseFaixa], [57, baseFaixa],
  ], COR.verdeFaixa);

  // Faixa do título: verde até a metade e escurece até o preto.
  const degrade = ctx.createLinearGradient(inicioFaixa(topoFaixa), 0, fimFaixa, 0);
  [[0, '#047f85'], [0.418, '#047f85'], [0.529, '#035b5f'], [0.639, '#034649'], [0.749, '#033134'], [0.86, '#021c1e'], [1, '#020202']]
    .forEach(([parada, cor]) => degrade.addColorStop(parada, cor));
  poligono(ctx, [
    [inicioFaixa(topoFaixa), topoFaixa], [fimFaixa, topoFaixa],
    [fimFaixa, baseFaixa], [inicioFaixa(baseFaixa), baseFaixa],
  ], degrade);

  // Bloco inclinado com o logo.
  poligono(ctx, [
    [esquerdaBloco(topoBloco), topoBloco], [direitaBloco(topoBloco), topoBloco],
    [direitaBloco(baseBloco), baseBloco], [esquerdaBloco(baseBloco), baseBloco],
  ], COR.verde);
  const centroY = (topoBloco + baseBloco) / 2;
  const centroX = (esquerdaBloco(centroY) + direitaBloco(centroY)) / 2;
  if (logo && logo.naturalWidth) {
    const alturaLogo = 150;
    const larguraLogo = alturaLogo * (logo.naturalWidth / logo.naturalHeight);
    ctx.drawImage(logo, centroX - larguraLogo / 2, centroY - alturaLogo / 2, larguraLogo, alturaLogo);
  } else {
    ctx.fillStyle = COR.branco;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = fonte(800, 92);
    ctx.fillText('SB monteiro', centroX, centroY);
  }

  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COR.branco;
  const tituloFinal = caber(ctx, titulo, 2000, { tamanho: 66, peso: 700, minimo: 44 });
  ctx.fillText(tituloFinal, BORDA_TEXTO_DIREITA, (topoFaixa + baseFaixa) / 2 + 2);

  if (linhaInfo) {
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = COR.verde;
    const info = caber(ctx, linhaInfo, 2400, { tamanho: 36, peso: 600, minimo: 26 });
    ctx.fillText(info, BORDA_TEXTO_DIREITA, 300);
  }
};

const desenharRodape = (ctx, { geradoPor, geradoEm }) => {
  const inicio = 'RELATÓRIO GERADO POR ';
  const resto = [String(geradoPor || '').trim().toUpperCase(), geradoEm].filter(Boolean).join(' - ');
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = COR.verde;
  ctx.font = fonte(400, 39);
  ctx.fillText(inicio, MARGEM_X, BASE_RODAPE);
  const largura = ctx.measureText(inicio).width;
  ctx.font = fonte(700, 39);
  ctx.fillText(resto || '-', MARGEM_X + largura, BASE_RODAPE);
};

const desenharCartoes = (ctx, { y, altura, itens }) => {
  const espaco = 75;
  const largura = (LARGURA_CONTEUDO - espaco * (itens.length - 1)) / itens.length;
  itens.forEach((item, indice) => {
    const x = MARGEM_X + indice * (largura + espaco);
    ctx.save();
    ctx.shadowColor = 'rgba(15, 23, 42, 0.07)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 8;
    retanguloArredondado(ctx, x, y, largura, altura, 18);
    ctx.fillStyle = COR.cartao;
    ctx.fill();
    ctx.restore();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COR.rotulo;
    const rotulo = caber(ctx, item.rotulo, largura - 36, { tamanho: 30, peso: 400, minimo: 20 });
    ctx.fillText(rotulo, x + largura / 2, y + altura * 0.27);
    ctx.fillStyle = item.cor;
    const valor = caber(ctx, item.valor, largura - 36, { tamanho: 51, peso: 700, minimo: 30 });
    ctx.fillText(valor, x + largura / 2, y + altura * 0.66);
  });
};

// Uma célula de texto à esquerda (com 2ª linha opcional) ou número à direita.
const desenharCelulas = (ctx, { x, largura, topo, altura, colunas, linha, tamanho, ehTotal }) => {
  const meio = topo + altura / 2;
  colunas.forEach((coluna) => {
    const valor = coluna.texto(linha);
    if (valor === null || valor === undefined || valor === '') return;
    const borda = x + coluna.x * largura;
    const peso = ehTotal ? 800 : (coluna.peso || 600);
    const corBase = typeof coluna.cor === 'function' ? coluna.cor(linha) : coluna.cor;
    const cor = ehTotal && !coluna.corNoTotal ? COR.textoForte : (corBase || COR.texto);
    const italico = Boolean(linha?.semConsultor && coluna.alinhar === 'left');
    ctx.fillStyle = (linha?.semConsultor && coluna.alinhar === 'left') || valor === '—' ? COR.rotulo : cor;
    ctx.textBaseline = 'middle';
    if (coluna.alinhar === 'left') {
      ctx.textAlign = 'left';
      const limite = ehTotal && coluna.limiteTotal ? coluna.limiteTotal : coluna.limite;
      const larguraMaxima = (limite - coluna.x) * largura;
      const tamanhoColuna = tamanho * (coluna.escala || 1);
      const sub = coluna.sub ? coluna.sub(linha) : '';
      const tamanhoSub = Math.round(tamanhoColuna * 0.68);
      if (sub && altura >= tamanhoColuna * 2.25) {
        const principal = caber(ctx, valor, larguraMaxima, { tamanho: tamanhoColuna, peso: coluna.pesoTexto || peso, minimo: Math.round(tamanhoColuna * 0.72), italico });
        ctx.fillText(principal, borda, meio - tamanhoSub * 0.62);
        ctx.fillStyle = COR.cabecalho;
        const segunda = caber(ctx, sub, larguraMaxima, { tamanho: tamanhoSub, peso: 700, minimo: Math.round(tamanhoSub * 0.8), italico });
        ctx.fillText(segunda, borda, meio + tamanhoColuna * 0.58);
      } else {
        const principal = caber(ctx, valor, larguraMaxima, { tamanho: tamanhoColuna, peso: coluna.pesoTexto || peso, minimo: Math.round(tamanhoColuna * 0.72), italico });
        ctx.fillText(principal, borda, meio);
      }
      return;
    }
    ctx.textAlign = 'right';
    ctx.font = fonte(peso, tamanho);
    ctx.fillText(valor, borda, meio);
  });
};

const desenharTabela = (ctx, { x, y, largura, colunas, linhas, linhasVazias, alturaExtra = 0, alturaCabecalho, alturaLinha, total, alturaTotal, tamanho, tamanhoCabecalho }) => {
  faixaDegrade(ctx, x, y, largura, FAIXA_TABELA);
  let cursor = y + FAIXA_TABELA;

  ctx.fillStyle = COR.fundoCabecalho;
  ctx.fillRect(x, cursor, largura, alturaCabecalho);
  ctx.font = fonte(600, tamanhoCabecalho);
  ctx.fillStyle = COR.cabecalho;
  ctx.textBaseline = 'middle';
  const meioCabecalho = cursor + alturaCabecalho / 2;
  let fimRotuloAnterior = x;
  colunas.forEach((coluna) => {
    const borda = x + coluna.x * largura;
    if (coluna.alinhar === 'left') {
      ctx.textAlign = 'left';
      ctx.fillText(coluna.rotulo, borda, meioCabecalho);
      fimRotuloAnterior = borda + ctx.measureText(coluna.rotulo).width;
      return;
    }
    const partes = quebrarRotulo(ctx, coluna.rotulo, borda - fimRotuloAnterior - tamanhoCabecalho);
    ctx.textAlign = 'right';
    const passo = tamanhoCabecalho * 1.15;
    partes.forEach((parte, indice) => ctx.fillText(parte, borda, meioCabecalho + (indice - (partes.length - 1) / 2) * passo));
    fimRotuloAnterior = borda;
  });
  cursor += alturaCabecalho;

  ctx.fillStyle = COR.branco;
  ctx.fillRect(x, cursor, largura, (linhas.length + linhasVazias) * alturaLinha + alturaExtra);
  linhas.forEach((linha, indice) => {
    const topo = cursor + indice * alturaLinha;
    if (linha.semConsultor) {
      ctx.fillStyle = COR.fundoSemConsultor;
      ctx.fillRect(x, topo, largura, alturaLinha);
    }
    if (indice > 0) {
      ctx.fillStyle = COR.separador;
      ctx.fillRect(x, topo - 1, largura, 2);
    }
    desenharCelulas(ctx, { x, largura, topo, altura: alturaLinha, colunas, linha, tamanho });
  });
  cursor += (linhas.length + linhasVazias) * alturaLinha + alturaExtra;

  if (total) {
    ctx.fillStyle = COR.fundoTotal;
    ctx.fillRect(x, cursor, largura, alturaTotal);
    desenharCelulas(ctx, { x, largura, topo: cursor, altura: alturaTotal, colunas, linha: total, tamanho, ehTotal: true });
    cursor += alturaTotal;
  }
  faixaDegrade(ctx, x, cursor, largura, FAIXA_TABELA);
  return cursor + FAIXA_TABELA;
};

// Decide em quantas colunas a lista cabe, mantendo as linhas legíveis.
const planejarColunas = ({ quantidade, topo, alturaCabecalho, alturaMaxima, minimos, extraAbaixo = 0 }) => {
  for (let colunas = 1; colunas <= minimos.length; colunas += 1) {
    const porColuna = Math.max(1, Math.ceil(quantidade / colunas));
    const area = LIMITE_TABELA - extraAbaixo - (topo + FAIXA_TABELA + alturaCabecalho[colunas - 1]);
    const altura = Math.min(alturaMaxima, area / porColuna);
    if (altura >= minimos[colunas - 1] || colunas === minimos.length) {
      return { colunas, porColuna, alturaLinha: Math.max(altura, 36), alturaCabecalho: alturaCabecalho[colunas - 1] };
    }
  }
  return null;
};

const colunasEstruturas = (rotulos) => [
  { rotulo: 'ESTRUTURA', alinhar: 'left', x: 0.012, limite: 0.31, texto: (l) => String(l.nome || '').toUpperCase(), cor: COR.texto, peso: 800 },
  { rotulo: rotulos.com, alinhar: 'right', x: 0.389, texto: (l) => numero(l.com_indicador), cor: COR.verde, peso: 800, corNoTotal: true },
  { rotulo: rotulos.ativos, alinhar: 'right', x: 0.549, texto: (l) => numero(l.ativos), cor: COR.cinza, peso: 600 },
  { rotulo: '% ATIVAÇÃO', alinhar: 'right', x: 0.676, texto: (l) => percentual(l.percentual_ativacao), cor: COR.texto, peso: 800 },
  { rotulo: 'META', alinhar: 'right', x: 0.778, texto: (l) => percentual(l.meta_percentual), cor: COR.cinza, peso: 600 },
  { rotulo: 'ATIVAÇÃO IDEAL', alinhar: 'right', x: 0.9, texto: (l) => numero(l.ativacao_ideal), cor: COR.cinza, peso: 600 },
  { rotulo: 'SALDO', alinhar: 'right', x: 0.988, texto: (l) => textoSaldo(l.saldo_meta), cor: (l) => corSaldo(l.saldo_meta), peso: 800, corNoTotal: true },
];

const colunasConsultores = (rotulos, { comEstrutura }) => {
  const traco = (l, texto) => (l.semConsultor ? '—' : texto);
  const nome = {
    rotulo: 'CONSULTOR', alinhar: 'left', x: comEstrutura ? 0.0098 : 0.012, limite: comEstrutura ? 0.255 : 0.4, limiteTotal: comEstrutura ? 0.5 : 0.4,
    texto: (l) => String(l.nome || '').toUpperCase(),
    sub: (l) => (l.semConsultor ? l.detalhe : (l.id_colaborador ? `ID ${l.id_colaborador}` : '')),
    cor: COR.texto, peso: 800,
  };
  const numeros = comEstrutura
    ? [0.5176, 0.6176, 0.698, 0.7627, 0.8373, 0.9392, 0.9882]
    : [0.5, 0.6, 0.685, 0.755, 0.835, 0.925, 0.988];
  return [
    nome,
    ...(comEstrutura ? [{ rotulo: 'ESTRUTURA', alinhar: 'left', x: 0.2686, limite: 0.425, texto: (l) => (l.semConsultor || l.ehTotal ? '' : String(l.estrutura || '').toUpperCase()), cor: COR.rotulo, peso: 400, escala: 0.97 }] : []),
    { rotulo: rotulos.com, alinhar: 'right', x: numeros[0], texto: (l) => numero(l.com_indicador), cor: COR.roxo, peso: 800, corNoTotal: true },
    { rotulo: rotulos.ativos, alinhar: 'right', x: numeros[1], texto: (l) => numero(l.ativos), cor: COR.cinza, peso: 600 },
    { rotulo: '% ATIVAÇÃO', alinhar: 'right', x: numeros[2], texto: (l) => percentual(l.percentual_ativacao), cor: COR.texto, peso: 800 },
    { rotulo: 'META', alinhar: 'right', x: numeros[3], texto: (l) => traco(l, percentual(l.meta_percentual)), cor: COR.cinza, peso: 600 },
    { rotulo: '% DA META', alinhar: 'right', x: numeros[4], texto: (l) => traco(l, percentual(l.percentual_meta)), cor: COR.texto, peso: 800 },
    { rotulo: 'ATIVAÇÃO IDEAL', alinhar: 'right', x: numeros[5], texto: (l) => traco(l, numero(l.ativacao_ideal)), cor: COR.cinza, peso: 600 },
    { rotulo: 'SALDO', alinhar: 'right', x: numeros[6], texto: (l) => traco(l, textoSaldo(l.saldo_meta)), cor: (l) => (l.semConsultor ? COR.cabecalho : corSaldo(l.saldo_meta)), peso: 800, corNoTotal: true },
  ];
};

// Desenha as linhas em 1, 2 ou 3 tabelas lado a lado (a última recebe o total).
const desenharEmColunas = (ctx, { topo, plano, linhas, colunas, total, alturaTotal, tamanho, tamanhoCabecalho }) => {
  const espaco = 66;
  const largura = (LARGURA_CONTEUDO - espaco * (plano.colunas - 1)) / plano.colunas;
  for (let indice = 0; indice < plano.colunas; indice += 1) {
    const parte = linhas.slice(indice * plano.porColuna, (indice + 1) * plano.porColuna);
    const ultima = indice === plano.colunas - 1;
    desenharTabela(ctx, {
      x: MARGEM_X + indice * (largura + espaco),
      y: topo,
      largura,
      colunas: colunas(plano.colunas),
      linhas: parte,
      linhasVazias: plano.porColuna - parte.length,
      // Só a última coluna tem o total; nas outras o espaço fica em branco para as faixas de baixo alinharem.
      alturaExtra: !ultima && total ? alturaTotal : 0,
      alturaCabecalho: plano.alturaCabecalho,
      alturaLinha: plano.alturaLinha,
      total: ultima ? total : null,
      alturaTotal: ultima ? alturaTotal : 0,
      tamanho,
      tamanhoCabecalho,
    });
  }
};

/**
 * Desenha o relatório no canvas (redimensiona para 3840 × 2160).
 * cfg = { tipo: 'estruturas' | 'consultores', rotulos, estruturas (tipo estruturas), estrutura (tipo consultores),
 *         ciclo, baseAtualizada, geradoPor, geradoEm, logo }
 */
export const desenharRelatorioIndicador = (canvas, cfg) => {
  canvas.width = LARGURA_RELATORIO;
  canvas.height = ALTURA_RELATORIO;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Seu navegador não permitiu criar a imagem.');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const rotulos = cfg.rotulos || rotulosIndicador({});
  const info = [
    cfg.ciclo ? `CICLO ${cfg.ciclo}` : '',
    cfg.baseAtualizada ? `BASE ATUALIZADA  ${cfg.baseAtualizada}` : '',
  ].filter(Boolean).join('     •     ');
  desenharCabecalho(ctx, { titulo: `RELATÓRIO ${rotulos.indicador}`, linhaInfo: info, logo: cfg.logo });

  if (cfg.tipo === 'consultores') {
    const estrutura = cfg.estrutura || {};
    desenharCartoes(ctx, {
      y: 450,
      altura: 186,
      itens: [
        { rotulo: rotulos.comCartao, valor: numero(estrutura.com_indicador), cor: COR.verde },
        { rotulo: rotulos.ativos, valor: numero(estrutura.ativos), cor: COR.cinza },
        { rotulo: '%ATIVAÇÃO', valor: percentual(estrutura.percentual_ativacao), cor: COR.verde },
        { rotulo: 'META', valor: metaCartao(estrutura.meta_percentual), cor: COR.cinza },
        { rotulo: '% DA META', valor: percentual(estrutura.percentual_meta), cor: COR.verde },
        { rotulo: 'ATIVAÇÃO IDEAL', valor: numero(estrutura.ativacao_ideal), cor: COR.cinza },
        { rotulo: 'SALDO', valor: textoSaldo(estrutura.saldo_meta), cor: corSaldo(estrutura.saldo_meta) },
      ],
    });
    const { linhas, total } = linhasConsultoresDaEstrutura(estrutura);
    const topo = 720;
    const alturaTotal = 129;
    const plano = planejarColunas({
      quantidade: Math.max(linhas.length, 1),
      topo,
      alturaCabecalho: [105, 120, 120],
      alturaMaxima: 171,
      minimos: [64, 84, 64],
      extraAbaixo: alturaTotal,
    });
    const tamanho = plano.colunas === 1
      ? Math.max(28, Math.min(39, plano.alturaLinha * 0.3))
      : Math.max(24, Math.min(32, plano.alturaLinha * 0.28));
    desenharEmColunas(ctx, {
      topo,
      plano,
      linhas,
      colunas: (quantidadeColunas) => colunasConsultores(rotulos, { comEstrutura: quantidadeColunas === 1 }),
      total,
      alturaTotal,
      tamanho,
      tamanhoCabecalho: plano.colunas === 1 ? 30 : 25,
    });
  } else {
    const linhas = [...(cfg.estruturas || [])].sort(
      (a, b) => Number(b.com_indicador || 0) - Number(a.com_indicador || 0)
        || Number(b.percentual_ativacao || 0) - Number(a.percentual_ativacao || 0)
        || String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR'),
    );
    const topo = 549;
    const plano = planejarColunas({
      quantidade: Math.max(linhas.length, 1),
      topo,
      alturaCabecalho: [150, 126, 120],
      alturaMaxima: 132,
      minimos: [84, 70, 40],
    });
    const tamanho = plano.colunas === 1
      ? Math.max(26, Math.min(42, plano.alturaLinha * 0.318))
      : Math.max(22, Math.min(plano.colunas === 2 ? 34 : 26, plano.alturaLinha * 0.3));
    desenharEmColunas(ctx, {
      topo,
      plano,
      linhas,
      colunas: () => colunasEstruturas(rotulos),
      total: null,
      alturaTotal: 0,
      tamanho,
      tamanhoCabecalho: plano.colunas === 1 ? 30 : plano.colunas === 2 ? 25 : 21,
    });
  }

  desenharRodape(ctx, { geradoPor: cfg.geradoPor, geradoEm: cfg.geradoEm });
  return canvas;
};

export const canvasParaPng = (canvas) => new Promise((resolve, reject) => {
  canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Não foi possível criar a imagem PNG.'))), 'image/png');
});

const slug = (texto) => semAcento(texto).replace(/[^0-9A-Za-z]+/g, '_').replace(/^_+|_+$/g, '') || 'relatorio';

export const nomeArquivoRelatorio = ({ indicador, tipo, estrutura, ciclo }) => {
  const recorte = tipo === 'consultores' ? slug(estrutura?.nome || 'Estrutura') : 'Estruturas';
  return `Relatorio_${slug(indicador)}_${recorte}_Ciclo_${slug(String(ciclo || '').replace('/', '-'))}.png`;
};
