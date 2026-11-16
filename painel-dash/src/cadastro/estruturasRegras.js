// Regras puras do Cadastro > Estruturas por código (sem tela: dá para testar sozinhas).

export const NUCLEOS = ['NUCLEO 1', 'NUCLEO 2', 'NUCLEO 3'];
export const TIPOS = [
  { valor: 'FORÇA DE VENDAS', curto: 'Força de Vendas' },
  { valor: 'ESPAÇO DO REVENDEDOR', curto: 'ER' },
  { valor: 'EQUIPE DE CAMPO', curto: 'Equipe de Campo' },
];

export const nucleoCurto = (n) => String(n || '').replace(/N[ÚU]CLEO\s*/i, 'N');
export const somenteDigitos = (v) => String(v || '').replace(/\D/g, '').replace(/^0+/, '');
export const formatarCodigo = (v) => { const d = somenteDigitos(v); return d ? Number(d).toLocaleString('pt-BR') : ''; };
export const nomeComparavel = (v) => String(v || '').replace(/\s+/g, ' ').trim().toUpperCase();
export const tipoCurto = (t) => TIPOS.find((x) => x.valor === t)?.curto || t || 'Força de Vendas';

// ---------- regras puras (testáveis sem tela) ----------

export function calcularPendencias(dados) {
  const estruturas = (dados?.estruturas || []).filter((e) => e.status === 'ativo');
  const naoVieram = [];
  for (const e of estruturas) {
    for (const c of e.codigos || []) if (!c.veio_no_ciclo && !c.inativo) naoVieram.push({ ...c, estrutura_id: e.id, estrutura_nome: e.nome });
  }
  for (const c of dados?.codigos_soltos || []) naoVieram.push({ ...c, estrutura_id: null, estrutura_nome: '' });
  return {
    semEstrutura: dados?.sem_estrutura || [],
    naoVieram,
    semCodigo: estruturas.filter((e) => !(e.codigos || []).some((c) => !c.inativo)),
    semResponsavel: estruturas.filter((e) => !e.lider && !e.usuario_id),
    semMeta: estruturas.filter((e) => !e.tem_meta_ciclo && (e.codigos || []).some((c) => c.veio_no_ciclo)),
  };
}

/** Lê a lista colada do SGI ("Cód Estrutura <tab> Estrutura") e compara com o cadastro. */
export function compararListaSgi(texto, dados) {
  const lidos = [];
  for (const linha of String(texto || '').split(/\r?\n/)) {
    const m = linha.match(/^\s*(\d{1,3}(?:\.\d{3})+|\d+)\s+(.+?)\s*$/);
    if (m) lidos.push({ cod: somenteDigitos(m[1]), nome_sgi: m[2].replace(/\s+/g, ' ').trim() });
  }
  const noCadastro = new Map();
  for (const e of dados?.estruturas || []) for (const c of e.codigos || []) noCadastro.set(c.cod, { ...c, estrutura: e });
  const fora = new Map((dados?.fora_nucleos || []).map((c) => [c.cod, c]));
  const semEstrutura = new Map((dados?.sem_estrutura || []).map((c) => [c.cod, c]));
  const vistos = new Set();
  const linhas = lidos.map((l) => {
    vistos.add(l.cod);
    const cad = noCadastro.get(l.cod);
    if (cad) {
      const mudou = nomeComparavel(cad.nome_sgi) !== nomeComparavel(l.nome_sgi);
      return { ...l, situacao: mudou ? 'nome_mudou' : 'igual', nome_antes: cad.nome_sgi, estrutura: cad.estrutura };
    }
    if (fora.has(l.cod)) return { ...l, situacao: 'fora' };
    return { ...l, situacao: 'sem_estrutura', registros: semEstrutura.get(l.cod)?.registros || 0 };
  });
  const faltaram = [];
  for (const [cod, c] of noCadastro) if (!vistos.has(cod)) faltaram.push({ cod, cod_exibicao: c.cod_exibicao, nome_sgi: c.nome_sgi, estrutura: c.estrutura });
  for (const e of (dados?.estruturas || []).filter((x) => x.status === 'ativo' && !(x.codigos || []).length)) faltaram.push({ cod: '', cod_exibicao: 'sem código', nome_sgi: '', estrutura: e });
  const conta = (s) => linhas.filter((l) => l.situacao === s).length;
  return { linhas, faltaram, total: lidos.length, iguais: conta('igual') + conta('fora'), mudaram: conta('nome_mudou'), novos: conta('sem_estrutura') };
}
