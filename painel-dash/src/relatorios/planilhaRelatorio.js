// Relatório em Excel no mesmo modelo da imagem (mesmas linhas, colunas, ordem e cores), feito no navegador:
// um .xlsx de verdade (zip "store" + XML do Office Open), sem biblioteca externa.
import { COR, FORMATO_EXCEL, temNumero } from './formatos';
import { corCelula, textoCelula, valorBruto } from './montarRelatorio';

const codificador = new TextEncoder();

const TABELA_CRC = (() => {
  const tabela = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    tabela[n] = c >>> 0;
  }
  return tabela;
})();

const crc32 = (bytes) => {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i += 1) c = TABELA_CRC[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
};

const compactar = (arquivos) => {
  const agora = new Date();
  const hora = ((agora.getHours() << 11) | (agora.getMinutes() << 5) | (agora.getSeconds() >> 1)) & 0xFFFF;
  const data = (((agora.getFullYear() - 1980) << 9) | ((agora.getMonth() + 1) << 5) | agora.getDate()) & 0xFFFF;
  const partes = [];
  const central = [];
  let deslocamento = 0;
  arquivos.forEach(({ nome, conteudo }) => {
    const dados = codificador.encode(conteudo);
    const nomeBytes = codificador.encode(nome);
    const crc = crc32(dados);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true);
    local.setUint16(8, 0, true);
    local.setUint16(10, hora, true);
    local.setUint16(12, data, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, dados.length, true);
    local.setUint32(22, dados.length, true);
    local.setUint16(26, nomeBytes.length, true);
    local.setUint16(28, 0, true);
    partes.push(new Uint8Array(local.buffer), nomeBytes, dados);
    const cabecalho = new DataView(new ArrayBuffer(46));
    cabecalho.setUint32(0, 0x02014b50, true);
    cabecalho.setUint16(4, 20, true);
    cabecalho.setUint16(6, 20, true);
    cabecalho.setUint16(8, 0x0800, true);
    cabecalho.setUint16(10, 0, true);
    cabecalho.setUint16(12, hora, true);
    cabecalho.setUint16(14, data, true);
    cabecalho.setUint32(16, crc, true);
    cabecalho.setUint32(20, dados.length, true);
    cabecalho.setUint32(24, dados.length, true);
    cabecalho.setUint16(28, nomeBytes.length, true);
    cabecalho.setUint16(30, 0, true);
    cabecalho.setUint16(32, 0, true);
    cabecalho.setUint16(34, 0, true);
    cabecalho.setUint16(36, 0, true);
    cabecalho.setUint32(38, 0, true);
    cabecalho.setUint32(42, deslocamento, true);
    central.push(new Uint8Array(cabecalho.buffer), nomeBytes);
    deslocamento += 30 + nomeBytes.length + dados.length;
  });
  const tamanhoCentral = central.reduce((soma, parte) => soma + parte.length, 0);
  const fim = new DataView(new ArrayBuffer(22));
  fim.setUint32(0, 0x06054b50, true);
  fim.setUint16(8, arquivos.length, true);
  fim.setUint16(10, arquivos.length, true);
  fim.setUint32(12, tamanhoCentral, true);
  fim.setUint32(16, deslocamento, true);
  return new Blob([...partes, ...central, new Uint8Array(fim.buffer)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
};

const xml = (texto) => String(texto ?? '')
  // eslint-disable-next-line no-control-regex
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const argb = (hex) => `FF${String(hex || '#000000').replace('#', '').toUpperCase().padStart(6, '0')}`;

// Estilos criados sob demanda: cada combinação vira um <xf> (índice usado no atributo s da célula).
const criarEstilos = () => {
  const fontes = ['<font><sz val="11"/><color rgb="FF111827"/><name val="Calibri"/><family val="2"/></font>'];
  const preenchimentos = ['<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>'];
  const formatos = [];
  const xfs = ['<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'];
  const indices = new Map();
  const indiceDe = (lista, item) => {
    const posicao = lista.indexOf(item);
    if (posicao >= 0) return posicao;
    lista.push(item);
    return lista.length - 1;
  };
  const idFormato = (codigo) => {
    if (!codigo) return 0;
    if (codigo === '#,##0') return 3;
    if (codigo === '0.00') return 2;
    const existente = formatos.find((item) => item.codigo === codigo);
    if (existente) return existente.id;
    const id = 164 + formatos.length;
    formatos.push({ id, codigo });
    return id;
  };
  const estilo = ({ negrito = false, italico = false, cor = COR.textoForte, tamanho = 11, fundo = null, formato = null, alinhar = null, quebrar = false, borda = false } = {}) => {
    const chave = JSON.stringify([negrito, italico, cor, tamanho, fundo, formato, alinhar, quebrar, borda]);
    if (indices.has(chave)) return indices.get(chave);
    const fonteXml = `<font>${negrito ? '<b/>' : ''}${italico ? '<i/>' : ''}<sz val="${tamanho}"/><color rgb="${argb(cor)}"/><name val="Calibri"/><family val="2"/></font>`;
    const idFonte = indiceDe(fontes, fonteXml);
    const idPreenchimento = fundo ? indiceDe(preenchimentos, `<fill><patternFill patternType="solid"><fgColor rgb="${argb(fundo)}"/><bgColor indexed="64"/></patternFill></fill>`) : 0;
    const numFmt = idFormato(formato);
    const alinhamento = `<alignment vertical="center"${alinhar ? ` horizontal="${alinhar}"` : ''}${quebrar ? ' wrapText="1"' : ''}/>`;
    xfs.push(`<xf numFmtId="${numFmt}" fontId="${idFonte}" fillId="${idPreenchimento}" borderId="${borda ? 1 : 0}" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">${alinhamento}</xf>`);
    const indice = xfs.length - 1;
    indices.set(chave, indice);
    return indice;
  };
  const gerarXml = () => [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
    formatos.length ? `<numFmts count="${formatos.length}">${formatos.map((item) => `<numFmt numFmtId="${item.id}" formatCode="${xml(item.codigo)}"/>`).join('')}</numFmts>` : '',
    `<fonts count="${fontes.length}">${fontes.join('')}</fonts>`,
    `<fills count="${preenchimentos.length}">${preenchimentos.join('')}</fills>`,
    '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top/><bottom style="thin"><color rgb="FFE5E7EB"/></bottom><diagonal/></border></borders>',
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>',
    `<cellXfs count="${xfs.length}">${xfs.join('')}</cellXfs>`,
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>',
    '</styleSheet>',
  ].join('');
  return { estilo, gerarXml };
};

const letraColuna = (indice) => {
  let numero = indice + 1;
  let letras = '';
  while (numero > 0) {
    const resto = (numero - 1) % 26;
    letras = String.fromCharCode(65 + resto) + letras;
    numero = Math.floor((numero - 1) / 26);
  }
  return letras;
};

/**
 * Gera o .xlsx do conteúdo (montarRelatorio.montarConteudo).
 * extras = { geradoPor, geradoEm }
 */
export const gerarPlanilhaRelatorio = (conteudo, { geradoPor, geradoEm } = {}) => {
  const { estilo, gerarXml } = criarEstilos();
  const linhasXml = [];
  const mesclas = [];
  const larguras = [];
  let numeroLinha = 0;

  // Colunas da planilha: cada coluna do relatório + a 2ª linha (ex.: ID do consultor) em coluna própria.
  const colunasPlanilha = [];
  (conteudo.colunas || []).forEach((coluna) => {
    colunasPlanilha.push({ coluna, tipo: 'principal' });
    if (coluna.sub && coluna.subRotulo) colunasPlanilha.push({ coluna, tipo: 'sub' });
  });
  const totalColunas = Math.max(colunasPlanilha.length, (conteudo.cartoes || []).length, 4);
  const ultimaLetra = letraColuna(totalColunas - 1);

  const adicionarLinha = (celulas, altura) => {
    numeroLinha += 1;
    const corpo = celulas.map((celula, indice) => {
      if (!celula) return '';
      const ref = `${letraColuna(indice)}${numeroLinha}`;
      if (celula.numero !== undefined && celula.numero !== null) return `<c r="${ref}" s="${celula.s || 0}"><v>${celula.numero}</v></c>`;
      if (celula.texto === undefined || celula.texto === null || celula.texto === '') return celula.s ? `<c r="${ref}" s="${celula.s}"/>` : '';
      return `<c r="${ref}" s="${celula.s || 0}" t="inlineStr"><is><t xml:space="preserve">${xml(celula.texto)}</t></is></c>`;
    }).join('');
    linhasXml.push(`<row r="${numeroLinha}"${altura ? ` ht="${altura}" customHeight="1"` : ''}>${corpo}</row>`);
    return numeroLinha;
  };
  const mesclarLinha = (linha) => mesclas.push(`A${linha}:${ultimaLetra}${linha}`);
  const registrarLargura = (indice, caracteres) => { larguras[indice] = Math.max(larguras[indice] || 0, caracteres); };

  mesclarLinha(adicionarLinha([{ texto: conteudo.titulo, s: estilo({ negrito: true, tamanho: 16, cor: COR.verde }) }], 26));
  const info = [conteudo.ciclo ? `Ciclo ${conteudo.ciclo}` : '', conteudo.baseAtualizada ? `Base atualizada ${conteudo.baseAtualizada}` : ''].filter(Boolean).join('  •  ');
  if (info) mesclarLinha(adicionarLinha([{ texto: info, s: estilo({ cor: COR.verde, negrito: true }) }]));
  if (conteudo.grupo) mesclarLinha(adicionarLinha([{ texto: conteudo.grupo, s: estilo({ negrito: true, tamanho: 12, cor: COR.texto }) }]));
  mesclarLinha(adicionarLinha([{ texto: `Relatório gerado por ${String(geradoPor || '-').toUpperCase()}${geradoEm ? ` - ${geradoEm}` : ''}`, s: estilo({ cor: COR.rotulo, italico: true }) }]));
  adicionarLinha([]);

  if (Array.isArray(conteudo.cartoes) && conteudo.cartoes.length) {
    adicionarLinha(conteudo.cartoes.map((cartao) => ({ texto: cartao.rotulo, s: estilo({ cor: COR.rotulo, tamanho: 9, alinhar: 'center', fundo: '#F3F4F7', quebrar: true }) })), 28);
    adicionarLinha(conteudo.cartoes.map((cartao) => ({ texto: cartao.valor, s: estilo({ negrito: true, tamanho: 13, cor: cartao.cor || COR.cinza, alinhar: 'center', fundo: '#F3F4F7' }) })), 24);
    adicionarLinha([]);
  }

  const estiloCabecalho = estilo({ negrito: true, cor: COR.branco, fundo: COR.verde, alinhar: 'center', quebrar: true });
  const linhaCabecalho = adicionarLinha(colunasPlanilha.map(({ coluna, tipo }, indice) => {
    const rotulo = tipo === 'sub' ? coluna.subRotulo : coluna.rotulo;
    registrarLargura(indice, Math.min(18, rotulo.length * 0.9));
    return { texto: rotulo, s: estiloCabecalho };
  }), 32);

  const celulasDaLinha = (linha, ehTotal) => colunasPlanilha.map(({ coluna, tipo }, indice) => {
    const fundo = ehTotal ? COR.fundoTotal : (linha?.semConsultor ? COR.fundoSemConsultor : null);
    if (tipo === 'sub') {
      const texto = coluna.sub(linha) || '';
      registrarLargura(indice, texto.length);
      return { texto: texto.replace(/^ID\s+/i, ''), s: estilo({ cor: COR.rotulo, fundo, borda: true }) };
    }
    const ehTexto = coluna.tipo === 'texto';
    const valor = valorBruto(coluna, linha);
    let cor = corCelula(coluna, linha);
    if (ehTotal && !['verde', 'roxo', 'faixa'].includes(coluna.cor)) cor = COR.textoForte;
    if (linha?.semConsultor && ehTexto) cor = COR.rotulo;
    const negrito = ehTotal || ehTexto || ['verde', 'roxo', 'faixa'].includes(coluna.cor) || coluna.peso >= 800;
    if (ehTexto) {
      const texto = textoCelula(coluna, linha);
      registrarLargura(indice, Math.min(60, texto.length * 1.05));
      return { texto, s: estilo({ negrito, italico: Boolean(linha?.semConsultor), cor, fundo, borda: true }) };
    }
    if (!temNumero(valor)) return { texto: '—', s: estilo({ cor: COR.cabecalho, fundo, alinhar: 'right', borda: true }) };
    let numero = Number(valor);
    if (coluna.tipo === 'percentual') numero /= 100;
    if (coluna.tipo === 'falta' || coluna.tipo === 'faltaInteiro') numero = Math.max(numero, 0);
    registrarLargura(indice, Math.min(22, textoCelula(coluna, linha).length + 2));
    return {
      numero: Math.round(numero * 1e6) / 1e6,
      s: estilo({ negrito, cor, fundo, formato: FORMATO_EXCEL[coluna.tipo] || '#,##0', alinhar: 'right', borda: true }),
    };
  });

  (conteudo.linhas || []).forEach((linha) => adicionarLinha(celulasDaLinha(linha, false), 20));
  if (conteudo.total) adicionarLinha(celulasDaLinha(conteudo.total, true), 22);

  const colsXml = Array.from({ length: totalColunas }, (_, indice) => {
    const largura = Math.max(12, Math.min(62, Math.round((larguras[indice] || 12) + 3)));
    return `<col min="${indice + 1}" max="${indice + 1}" width="${largura}" customWidth="1"/>`;
  }).join('');

  const planilha = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
    `<sheetViews><sheetView workbookViewId="0" showGridLines="0"><pane ySplit="${linhaCabecalho}" topLeftCell="A${linhaCabecalho + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>`,
    '<sheetFormatPr defaultRowHeight="15"/>',
    `<cols>${colsXml}</cols>`,
    `<sheetData>${linhasXml.join('')}</sheetData>`,
    mesclas.length ? `<mergeCells count="${mesclas.length}">${mesclas.map((ref) => `<mergeCell ref="${ref}"/>`).join('')}</mergeCells>` : '',
    '<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>',
    '</worksheet>',
  ].join('');

  const nomeAba = String(conteudo.titulo || 'Relatório').replace(/^RELATÓRIO\s+/i, '').replace(/[[\]:*?/\\]/g, ' ').slice(0, 31) || 'Relatório';
  return compactar([
    {
      nome: '[Content_Types].xml',
      conteudo: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>',
    },
    {
      nome: '_rels/.rels',
      conteudo: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    },
    {
      nome: 'xl/workbook.xml',
      conteudo: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${xml(nomeAba)}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    },
    {
      nome: 'xl/_rels/workbook.xml.rels',
      conteudo: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
    },
    { nome: 'xl/worksheets/sheet1.xml', conteudo: planilha },
    { nome: 'xl/styles.xml', conteudo: gerarXml() },
  ]);
};
