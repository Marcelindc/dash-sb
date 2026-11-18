// Relatório em imagem: sempre um PNG só, em 4K (3840 × 2160), no modelo do usuário (18/11/2026):
// cabeçalho com o logo do Grupo Monteiro num bloco inclinado + faixa "RELATÓRIO X" em degradê (verde → preto),
// cartões opcionais, tabela entre duas faixas em degradê e "RELATÓRIO GERADO POR" no rodapé.
// As colunas são as que a pessoa escolheu: a largura de cada uma sai da medida dos textos. Muitas linhas:
// a tabela se divide em 2 ou 3 colunas lado a lado (uma imagem só, legível).
import { COR } from './formatos';
import { corCelula, textoCelula } from './montarRelatorio';

export const LARGURA_RELATORIO = 3840;
export const ALTURA_RELATORIO = 2160;

const FONTE = '"Segoe UI", "Segoe UI Variable", system-ui, -apple-system, "Helvetica Neue", Roboto, Arial, sans-serif';
// Medidas do modelo (1280 × 720) multiplicadas por 3.
const MARGEM_X = 390;
const LARGURA_CONTEUDO = 3060;
const BORDA_TEXTO_DIREITA = 3420;
const FAIXA_TABELA = 21;
const LIMITE_TABELA = 1960;
const BASE_RODAPE = 2082;

const fonte = (peso, tamanho, italico = false) => `${italico ? 'italic ' : ''}${peso} ${Math.round(tamanho)}px ${FONTE}`;

// Diminui a fonte até caber; se nem no mínimo couber, corta com reticências. Deixa ctx.font no tamanho final.
const caber = (ctx, texto, larguraMaxima, { tamanho, peso = 700, minimo = 18, italico = false }) => {
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

// Melhor quebra do rótulo em 2 linhas (a mais equilibrada). ctx.font precisa estar na fonte do cabeçalho.
const quebrarRotulo = (ctx, texto) => {
  const palavras = String(texto || '').split(' ');
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

  poligono(ctx, [
    [57, topoFaixa], [esquerdaBloco(topoFaixa) - 30, topoFaixa],
    [esquerdaBloco(baseFaixa) - 30, baseFaixa], [57, baseFaixa],
  ], COR.verdeFaixa);

  const degrade = ctx.createLinearGradient(inicioFaixa(topoFaixa), 0, fimFaixa, 0);
  [[0, '#047f85'], [0.418, '#047f85'], [0.529, '#035b5f'], [0.639, '#034649'], [0.749, '#033134'], [0.86, '#021c1e'], [1, '#020202']]
    .forEach(([parada, cor]) => degrade.addColorStop(parada, cor));
  poligono(ctx, [
    [inicioFaixa(topoFaixa), topoFaixa], [fimFaixa, topoFaixa],
    [fimFaixa, baseFaixa], [inicioFaixa(baseFaixa), baseFaixa],
  ], degrade);

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
  const tituloFinal = caber(ctx, titulo, 2000, { tamanho: 66, peso: 700, minimo: 40 });
  ctx.fillText(tituloFinal, BORDA_TEXTO_DIREITA, (topoFaixa + baseFaixa) / 2 + 2);

  if (linhaInfo) {
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = COR.verde;
    const info = caber(ctx, linhaInfo, 2600, { tamanho: 36, peso: 600, minimo: 24 });
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
  const espaco = itens.length > 7 ? 48 : 75;
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
    const rotulo = caber(ctx, item.rotulo, largura - 36, { tamanho: 30, peso: 400, minimo: 18 });
    ctx.fillText(rotulo, x + largura / 2, y + altura * 0.27);
    ctx.fillStyle = item.cor || COR.cinza;
    const valor = caber(ctx, item.valor, largura - 36, { tamanho: 51, peso: 700, minimo: 26 });
    ctx.fillText(valor, x + largura / 2, y + altura * 0.66);
  });
};

// Larguras das colunas a partir da medida dos textos. Devolve null quando nem com cabeçalho em 2 linhas cabe.
const planejarLarguras = (ctx, { colunas, amostra, largura, tamanho, tamanhoCabecalho }) => {
  const recuo = Math.round(tamanho * 0.86);
  const espaco = Math.round(tamanho * 1.05);
  const util = largura - recuo * 2;
  const medir = (texto, peso, tam, italico = false) => {
    ctx.font = fonte(peso, tam, italico);
    return ctx.measureText(String(texto || '')).width;
  };
  const info = colunas.map((coluna) => {
    const ehTexto = coluna.tipo === 'texto';
    let valores = 0;
    amostra.forEach((linha) => {
      const texto = textoCelula(coluna, linha);
      if (texto) valores = Math.max(valores, medir(texto, ehTexto ? 800 : (coluna.peso || 700), tamanho * (coluna.escala || 1)));
      const sub = coluna.sub ? coluna.sub(linha) : '';
      if (sub) valores = Math.max(valores, medir(sub, 700, tamanho * 0.68));
    });
    const umaLinha = medir(coluna.rotulo, 600, tamanhoCabecalho);
    const partes = quebrarRotulo(ctx, coluna.rotulo);
    const duasLinhas = Math.max(...partes.map((parte) => ctx.measureText(parte).width));
    return { ehTexto, valores, umaLinha, partes, duasLinhas };
  });

  const tentar = (quebrar) => {
    const precisa = info.map((item) => (item.ehTexto ? 0 : Math.max(item.valores, quebrar && item.duasLinhas < item.umaLinha ? item.duasLinhas : item.umaLinha) + espaco));
    const naturalTexto = info.map((item) => (item.ehTexto ? Math.min(Math.max(item.valores, item.umaLinha) + espaco, util * 0.5) : 0));
    const minimoTexto = info.map((item) => (item.ehTexto ? Math.min(naturalTexto[info.indexOf(item)], Math.max(util * 0.14, item.umaLinha + espaco)) : 0));
    const somaNumeros = precisa.reduce((soma, valor) => soma + valor, 0);
    const somaMinTexto = minimoTexto.reduce((soma, valor) => soma + valor, 0);
    if (somaNumeros + somaMinTexto > util) return null;
    const larguras = info.map((item, indice) => (item.ehTexto ? naturalTexto[indice] : precisa[indice]));
    let sobra = util - larguras.reduce((soma, valor) => soma + valor, 0);
    if (sobra < 0) {
      // Texto não cabe inteiro: as colunas de texto dividem o que sobra (o texto encolhe/corta ao desenhar).
      const espacoTexto = util - somaNumeros;
      const somaNatural = naturalTexto.reduce((soma, valor) => soma + valor, 0) || 1;
      info.forEach((item, indice) => {
        if (item.ehTexto) larguras[indice] = Math.max(minimoTexto[indice], espacoTexto * (naturalTexto[indice] / somaNatural));
      });
      sobra = 0;
    } else {
      // Sobra: o nome ganha um pouco mais (como no modelo) e os números se espalham por igual.
      const pesos = info.map((item) => (item.ehTexto ? 1.25 : 1));
      const somaPesos = pesos.reduce((soma, valor) => soma + valor, 0) || 1;
      info.forEach((item, indice) => { larguras[indice] += sobra * (pesos[indice] / somaPesos); });
    }
    let cursor = recuo;
    return info.map((item, indice) => {
      const x0 = cursor;
      cursor += larguras[indice];
      const quebraCabecalho = !item.ehTexto && quebrar && item.umaLinha + espaco > larguras[indice] && item.partes.length > 1;
      return { x0, x1: cursor, largura: larguras[indice], partes: quebraCabecalho ? item.partes : [colunas[indice].rotulo], espaco };
    });
  };
  return tentar(false) || tentar(true);
};

const planejarTabela = (ctx, { colunas, amostra, largura, tamanho, tamanhoCabecalho }) => {
  let tam = tamanho;
  let tamCab = tamanhoCabecalho;
  for (let tentativa = 0; tentativa < 9; tentativa += 1) {
    const layout = planejarLarguras(ctx, { colunas, amostra, largura, tamanho: tam, tamanhoCabecalho: tamCab });
    if (layout) return { layout, tamanho: tam, tamanhoCabecalho: tamCab };
    tam *= 0.92;
    tamCab *= 0.92;
  }
  const layout = planejarLarguras(ctx, { colunas, amostra, largura: largura * 1.6, tamanho: tam, tamanhoCabecalho: tamCab })
    || colunas.map((coluna, indice) => ({ x0: (largura / colunas.length) * indice, x1: (largura / colunas.length) * (indice + 1), largura: largura / colunas.length, partes: [coluna.rotulo], espaco: 20 }));
  const escala = largura / Math.max(layout[layout.length - 1]?.x1 || largura, 1);
  return { layout: layout.map((item) => ({ ...item, x0: item.x0 * escala, x1: item.x1 * escala, largura: item.largura * escala })), tamanho: tam, tamanhoCabecalho: tamCab };
};

const COLUNAS_COM_COR_NO_TOTAL = new Set(['verde', 'roxo', 'faixa']);

const desenharCelulas = (ctx, { x, layout, colunas, linha, topo, altura, tamanho, ehTotal }) => {
  const meio = topo + altura / 2;
  colunas.forEach((coluna, indice) => {
    const posicao = layout[indice];
    const texto = textoCelula(coluna, linha);
    if (!texto) return;
    const ehTexto = coluna.tipo === 'texto';
    let cor = corCelula(coluna, linha);
    let peso = coluna.peso || (ehTexto ? 800 : 700);
    if (ehTotal) {
      peso = 800;
      if (!COLUNAS_COM_COR_NO_TOTAL.has(coluna.cor)) cor = COR.textoForte;
    }
    const italico = Boolean(linha?.semConsultor && ehTexto);
    if (italico) cor = COR.rotulo;
    ctx.fillStyle = cor;
    ctx.textBaseline = 'middle';
    if (!ehTexto) {
      ctx.textAlign = 'right';
      ctx.font = fonte(peso, tamanho);
      ctx.fillText(texto, x + posicao.x1, meio);
      return;
    }
    ctx.textAlign = 'left';
    // No total, o nome pode ocupar as colunas de texto seguintes que ficaram vazias.
    let larguraMaxima = posicao.largura - posicao.espaco * 0.6;
    for (let proxima = indice + 1; ehTotal && proxima < colunas.length && colunas[proxima].tipo === 'texto' && !textoCelula(colunas[proxima], linha); proxima += 1) {
      larguraMaxima += layout[proxima].largura;
    }
    const tamanhoColuna = tamanho * (coluna.escala || 1);
    const sub = coluna.sub ? coluna.sub(linha) : '';
    const tamanhoSub = Math.round(tamanhoColuna * 0.68);
    const principal = caber(ctx, texto, larguraMaxima, { tamanho: tamanhoColuna, peso, minimo: Math.round(tamanhoColuna * 0.7), italico });
    if (sub && altura >= tamanhoColuna * 2.25) {
      ctx.fillText(principal, x + posicao.x0, meio - tamanhoSub * 0.62);
      ctx.fillStyle = COR.cabecalho;
      const segunda = caber(ctx, sub, larguraMaxima, { tamanho: tamanhoSub, peso: 700, minimo: Math.round(tamanhoSub * 0.8), italico });
      ctx.fillText(segunda, x + posicao.x0, meio + tamanhoColuna * 0.58);
    } else {
      ctx.fillText(principal, x + posicao.x0, meio);
    }
  });
};

const desenharTabela = (ctx, { x, y, largura, colunas, plano, linhas, linhasVazias, alturaExtra, alturaCabecalho, alturaLinha, total, alturaTotal }) => {
  const { layout, tamanho, tamanhoCabecalho } = plano;
  faixaDegrade(ctx, x, y, largura, FAIXA_TABELA);
  let cursor = y + FAIXA_TABELA;

  ctx.fillStyle = COR.fundoCabecalho;
  ctx.fillRect(x, cursor, largura, alturaCabecalho);
  ctx.font = fonte(600, tamanhoCabecalho);
  ctx.fillStyle = COR.cabecalho;
  ctx.textBaseline = 'middle';
  const meioCabecalho = cursor + alturaCabecalho / 2;
  colunas.forEach((coluna, indice) => {
    const posicao = layout[indice];
    if (coluna.tipo === 'texto') {
      ctx.textAlign = 'left';
      ctx.fillText(caber(ctx, coluna.rotulo, posicao.largura - posicao.espaco * 0.5, { tamanho: tamanhoCabecalho, peso: 600, minimo: 16 }), x + posicao.x0, meioCabecalho);
      ctx.font = fonte(600, tamanhoCabecalho);
      return;
    }
    ctx.textAlign = 'right';
    const passo = tamanhoCabecalho * 1.15;
    posicao.partes.forEach((parte, linhaIndice) => {
      ctx.fillText(parte, x + posicao.x1, meioCabecalho + (linhaIndice - (posicao.partes.length - 1) / 2) * passo);
    });
  });
  cursor += alturaCabecalho;

  ctx.fillStyle = COR.branco;
  ctx.fillRect(x, cursor, largura, (linhas.length + linhasVazias) * alturaLinha + alturaExtra);
  linhas.forEach((linha, indice) => {
    const topo = cursor + indice * alturaLinha;
    if (linha?.semConsultor) {
      ctx.fillStyle = COR.fundoSemConsultor;
      ctx.fillRect(x, topo, largura, alturaLinha);
    }
    if (indice > 0) {
      ctx.fillStyle = COR.separador;
      ctx.fillRect(x, topo - 1, largura, 2);
    }
    desenharCelulas(ctx, { x, layout, colunas, linha, topo, altura: alturaLinha, tamanho });
  });
  cursor += (linhas.length + linhasVazias) * alturaLinha + alturaExtra;

  if (total) {
    ctx.fillStyle = COR.fundoTotal;
    ctx.fillRect(x, cursor, largura, alturaTotal);
    desenharCelulas(ctx, { x, layout, colunas, linha: total, topo: cursor, altura: alturaTotal, tamanho, ehTotal: true });
    cursor += alturaTotal;
  }
  faixaDegrade(ctx, x, cursor, largura, FAIXA_TABELA);
};

/**
 * conteudo = { titulo, ciclo, baseAtualizada, cartoes:[{rotulo, valor, cor}]|null, colunas, linhas, total }
 * extras = { logo, geradoPor, geradoEm }
 */
export const desenharRelatorio = (canvas, conteudo, { logo, geradoPor, geradoEm } = {}) => {
  canvas.width = LARGURA_RELATORIO;
  canvas.height = ALTURA_RELATORIO;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Seu navegador não permitiu criar a imagem.');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const info = [
    conteudo.ciclo ? `CICLO ${conteudo.ciclo}` : '',
    conteudo.baseAtualizada ? `BASE ATUALIZADA  ${conteudo.baseAtualizada}` : '',
  ].filter(Boolean).join('     •     ');
  desenharCabecalho(ctx, { titulo: conteudo.titulo, linhaInfo: info, logo });

  const temCartoes = Array.isArray(conteudo.cartoes) && conteudo.cartoes.length > 0;
  if (temCartoes) desenharCartoes(ctx, { y: 450, altura: 186, itens: conteudo.cartoes });

  const colunas = conteudo.colunas || [];
  const linhas = conteudo.linhas || [];
  const total = conteudo.total || null;
  const temSub = colunas.some((coluna) => coluna.sub && linhas.some((linha) => coluna.sub(linha)));
  const topo = temCartoes ? 720 : 549;
  const alturaMaxima = temSub ? 171 : 132;
  const cabecalhos = temCartoes ? [105, 118, 118] : [150, 126, 120];
  const minimos = temSub ? [64, 84, 60] : [84, 70, 40];
  const alturaTotalBase = total ? 129 : 0;

  let plano = null;
  const quantidade = Math.max(linhas.length, 1);
  for (let colunasLado = 1; colunasLado <= 3; colunasLado += 1) {
    const porColuna = Math.max(1, Math.ceil(quantidade / colunasLado));
    const area = LIMITE_TABELA - alturaTotalBase - (topo + FAIXA_TABELA + cabecalhos[colunasLado - 1]);
    const altura = Math.min(alturaMaxima, area / porColuna);
    if (altura >= minimos[colunasLado - 1] || colunasLado === 3) {
      plano = { colunasLado, porColuna, alturaLinha: Math.max(altura, 34), alturaCabecalho: cabecalhos[colunasLado - 1] };
      break;
    }
  }

  const espacoEntre = 66;
  const larguraTabela = (LARGURA_CONTEUDO - espacoEntre * (plano.colunasLado - 1)) / plano.colunasLado;
  const tamanhoBase = plano.colunasLado === 1
    ? (temSub ? Math.max(28, Math.min(39, plano.alturaLinha * 0.3)) : Math.max(26, Math.min(42, plano.alturaLinha * 0.318)))
    : Math.max(22, Math.min(plano.colunasLado === 2 ? 34 : 26, plano.alturaLinha * 0.3));
  const tamanhoCabecalho = plano.colunasLado === 1 ? (temCartoes ? 30 : 30) : plano.colunasLado === 2 ? 25 : 21;
  const amostra = total ? [...linhas, total] : linhas;
  const planoColunas = planejarTabela(ctx, { colunas, amostra, largura: larguraTabela, tamanho: tamanhoBase, tamanhoCabecalho });

  for (let indice = 0; indice < plano.colunasLado; indice += 1) {
    const parte = linhas.slice(indice * plano.porColuna, (indice + 1) * plano.porColuna);
    const ultima = indice === plano.colunasLado - 1;
    desenharTabela(ctx, {
      x: MARGEM_X + indice * (larguraTabela + espacoEntre),
      y: topo,
      largura: larguraTabela,
      colunas,
      plano: planoColunas,
      linhas: parte,
      linhasVazias: plano.porColuna - parte.length,
      alturaExtra: !ultima && total ? alturaTotalBase : 0,
      alturaCabecalho: plano.alturaCabecalho,
      alturaLinha: plano.alturaLinha,
      total: ultima ? total : null,
      alturaTotal: ultima ? alturaTotalBase : 0,
    });
  }

  desenharRodape(ctx, { geradoPor, geradoEm });
  return canvas;
};

export const canvasParaPng = (canvas) => new Promise((resolve, reject) => {
  canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Não foi possível criar a imagem PNG.'))), 'image/png');
});
