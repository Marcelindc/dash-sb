// Ordem das linhas nas janelas de detalhe (23/11/2026): do maior para o menor % da meta.
// percentualDe devolve null quando a linha não tem meta — essas vão para o fim. Empate (e as sem meta entre si)
// fica pelo valor, também do maior para o menor. Infinity serve para "meta batida" sem percentual (vai para o topo).
const percentualOuNulo = (percentual) => (percentual == null || Number.isNaN(Number(percentual)) ? null : Number(percentual));

export const ordenarPorPercentualMeta = (lista = [], percentualDe, valorDe = () => 0) => [...(lista || [])].sort((a, b) => {
  const pa = percentualOuNulo(percentualDe(a));
  const pb = percentualOuNulo(percentualDe(b));
  if (pa == null && pb != null) return 1;
  if (pb == null && pa != null) return -1;
  if (pa != null && pb != null && pa !== pb) return pb > pa ? 1 : -1;
  return Number(valorDe(b) || 0) - Number(valorDe(a) || 0);
});
