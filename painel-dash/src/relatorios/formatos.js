// Formatos e cores dos relatórios (imagem PNG e Excel) e dos cartões da janela dos indicadores.
// Regra de cor do usuário (18/11/2026), só nos relatórios: 100% da meta ou mais = verde,
// 80% a 99% = laranja, até 79% = vermelho. (As telas do DASH seguem com corPorFaixaMeta.)

export const COR = {
  fundo: '#f3f4f7',
  verde: '#048187',
  verdeFaixa: '#047f85',
  laranja: '#ff6f03',
  vermelho: '#7c1f31',
  texto: '#374151',
  textoForte: '#111827',
  cinza: '#4b5563',
  rotulo: '#6b7280',
  cabecalho: '#9ca3af',
  roxo: '#5c4b8a',
  fundoCabecalho: '#f9fafb',
  separador: '#eef0f3',
  fundoTotal: '#f7f5fc',
  fundoSemConsultor: '#fbfbfd',
  cartao: '#fdfdfd',
  branco: '#ffffff',
};

export const numero = (valor, casas = 0) => Number(valor || 0).toLocaleString('pt-BR', {
  minimumFractionDigits: casas,
  maximumFractionDigits: casas,
});
export const percentual = (valor) => `${numero(valor, 1)}%`;
export const moeda = (valor) => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(Number(valor || 0));
export const metaCartao = (valor) => {
  const meta = Number(valor || 0);
  return `${numero(meta, Math.abs(meta - Math.round(meta)) < 0.05 ? 0 : 1)}%`;
};
export const textoSaldo = (valor) => {
  const saldo = Math.round(Number(valor || 0));
  return `${saldo > 0 ? '+' : ''}${numero(saldo, 0)}`;
};

export const temNumero = (valor) => valor !== null && valor !== undefined && valor !== '' && Number.isFinite(Number(valor));

// Faixa da meta: verde (100%+), laranja (80–99%), vermelho (até 79%). Sem meta: cinza.
export const corFaixa = (pctMeta) => {
  if (!temNumero(pctMeta)) return COR.cabecalho;
  const valor = Number(pctMeta);
  if (valor >= 100) return COR.verde;
  if (valor >= 80) return COR.laranja;
  return COR.vermelho;
};
export const batendoMeta = (pctMeta) => temNumero(pctMeta) && Number(pctMeta) >= 100;
export const abaixoMeta = (pctMeta) => temNumero(pctMeta) && Number(pctMeta) < 100;

// Texto de uma célula pelo tipo da coluna. null/undefined/'' viram "—".
export const formatarValor = (tipo, valor) => {
  if (tipo === 'texto') return String(valor ?? '').trim();
  if (!temNumero(valor)) return typeof valor === 'string' && valor.trim() ? valor : '—';
  const n = Number(valor);
  switch (tipo) {
    case 'inteiro': return numero(n, 0);
    case 'moeda': return moeda(n);
    case 'percentual': return percentual(n);
    case 'decimal1': return numero(n, 1);
    case 'decimal2': return numero(n, 2);
    case 'saldo': return textoSaldo(n);
    case 'falta': return n > 0.004 ? moeda(n) : 'Batida';
    case 'faltaInteiro': return n > 0 ? numero(n, 0) : 'Batida';
    default: return numero(n, 0);
  }
};

// Formato numérico do Excel para cada tipo (o percentual vai como fração: 41,4% = 0,414).
export const FORMATO_EXCEL = {
  inteiro: '#,##0',
  moeda: '"R$" #,##0.00',
  percentual: '0.0%',
  decimal1: '0.0',
  decimal2: '0.00',
  saldo: '+#,##0;-#,##0;0',
  // Falta zerada aparece como "Batida", igual à imagem.
  falta: '"R$" #,##0.00;-"R$" #,##0.00;"Batida"',
  faltaInteiro: '#,##0;-#,##0;"Batida"',
};
