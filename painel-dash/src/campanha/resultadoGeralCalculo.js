// Contas do Resultado Geral da Campanha (as mesmas da tela atual): quanto falta, ritmo por ciclo e projeção até o C17.

export const ULTIMO_CICLO = 17;
export const COR_VD = '#048187';
export const COR_LOJA = '#7fd0d3';
export const COR_106 = '#048187';
export const COR_109 = '#7c1f31';

export const emMilhoes = (valor, casas = 2) => `R$ ${(Number(valor || 0) / 1e6).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })} Mi`;
export const emPercentual = (valor) => `${Number(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
export const limitar = (valor) => Math.max(0, Math.min(Number(valor || 0), 100));
export const dataCurtaBR = (iso) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '');
export const rotuloCicloRG = (numero) => `C${String(numero).padStart(2, '0')}`;

export function montarPainel(ciclosAno, calendario, meta106, meta109) {
  const ciclos = [...(ciclosAno || [])]
    .map((c) => ({ ...c, numero: Number(c.numero), vd: Number(c.vd || 0), loja: Number(c.loja || 0), total: Number(c.total || 0) }))
    .filter((c) => c.numero >= 1 && c.numero <= ULTIMO_CICLO)
    .sort((a, b) => a.numero - b.numero);
  const cal = calendario || [];
  const emAndamento = cal.find((i) => i.status === 'em_andamento');
  const todosEncerrados = cal.length > 0 && cal.every((i) => i.status === 'encerrado');
  const numeroAtual = emAndamento ? emAndamento.numero : todosEncerrados ? ULTIMO_CICLO + 1 : (cal.find((i) => i.status === 'futuro')?.numero ?? 14);

  const total = ciclos.reduce((s, c) => s + c.total, 0);
  const fechados = ciclos.filter((c) => c.numero < numeroAtual);
  const restantes = ciclos.filter((c) => c.numero >= numeroAtual);
  const totalFechados = fechados.reduce((s, c) => s + c.total, 0);
  const ultimos = fechados.filter((c) => c.total > 0).slice(-3);
  const media = ultimos.length ? ultimos.reduce((s, c) => s + c.total, 0) / ultimos.length : 0;
  const tendenciaAtual = emAndamento && emAndamento.dias_passados >= 3
    ? (ciclos.find((c) => c.numero === emAndamento.numero)?.total || 0) / emAndamento.dias_passados * emAndamento.dias_total
    : null;
  const esperado = (c) => Math.max(c.total, c.numero === numeroAtual && tendenciaAtual !== null ? tendenciaAtual : media);
  const projecao = totalFechados + restantes.reduce((s, c) => s + esperado(c), 0);
  const semResultado = fechados.filter((c) => c.fonte_vd === 'sem_dados' && c.fonte_loja === 'sem_dados').map((c) => c.numero);
  // Ciclos fechados sem o resultado de algum canal (VD ou Loja): o acumulado fica menor que o real.
  const pendencias = fechados
    .map((c) => ({ numero: c.numero, canais: [c.fonte_vd === 'sem_dados' && 'VD', c.fonte_loja === 'sem_dados' && 'Loja'].filter(Boolean) }))
    .filter((c) => c.canais.length);

  const alvo = (meta) => {
    const falta = Math.max(meta - total, 0);
    return { meta, falta, porCiclo: restantes.length ? falta / restantes.length : 0, batida: total >= meta, projetaBater: projecao >= meta };
  };

  let acumulado = 0;
  const grafico = ciclos.map((c) => {
    acumulado += c.numero <= numeroAtual ? c.total : 0;
    return {
      rotulo: rotuloCicloRG(c.numero),
      numero: c.numero,
      vd: c.vd,
      loja: c.loja,
      total: c.total,
      parcial: c.numero === numeroAtual,
      futuro: c.numero > numeroAtual,
      semResultado: semResultado.includes(c.numero),
      acumulado: c.numero <= numeroAtual ? acumulado : null,
    };
  });
  // Projeção: parte do último ciclo fechado e soma o esperado de cada ciclo que falta.
  let acumuladoProjecao = totalFechados;
  for (const ponto of grafico) {
    if (ponto.numero === numeroAtual - 1) ponto.projecao = totalFechados;
    if (ponto.numero >= numeroAtual) {
      acumuladoProjecao += esperado(ciclos.find((c) => c.numero === ponto.numero));
      ponto.projecao = acumuladoProjecao;
    }
  }

  return {
    ciclos, numeroAtual, emAndamento, total, media, mediaCiclos: ultimos.map((c) => c.numero), projecao, restantes,
    semResultado, pendencias, grafico, tendenciaAtual, a106: alvo(meta106), a109: alvo(meta109),
  };
}

