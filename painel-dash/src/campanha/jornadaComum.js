// Regras e formatos compartilhados da Campanha Incentivo 2026 gamificada (jornada, equipe e resultado geral).
import { Coins, Droplets, Flower2, Gem, Layers, Palette, Plane, Receipt, Scissors, ShoppingBag, Star, Target, UserCheck } from 'lucide-react';

export const INDICADORES = {
  receita: { nome: 'Receita', cor: '#d4a017', escura: '#9a7400', icone: Coins },
  atividade: { nome: 'Atividade', cor: '#0f9aa1', escura: '#036b70', icone: UserCheck },
  make: { nome: 'MAKE', cor: '#e0458f', escura: '#a3195b', icone: Palette },
  cabelo: { nome: 'CABELO', cor: '#8b5cf6', escura: '#5b21b6', icone: Scissors },
  multimarcas: { nome: 'Multimarcas', cor: '#3b82f6', escura: '#1d4ed8', icone: Layers },
  boleto_medio: { nome: 'Boleto médio', cor: '#14b8a6', escura: '#0f766e', icone: Receipt },
  itens_boleto: { nome: 'Itens por boleto', cor: '#f97316', escura: '#c2410c', icone: ShoppingBag },
  skin: { nome: 'Skin', cor: '#06b6d4', escura: '#0e7490', icone: Droplets },
  eudora: { nome: 'Eudora', cor: '#c026d3', escura: '#701a75', icone: Flower2 },
};
export const INDICADOR_PADRAO = { nome: 'Indicador', cor: '#64748b', escura: '#334155', icone: Target };

export const NIVEIS = [
  null,
  { nome: 'Bronze', borda: 'linear-gradient(145deg,#f3c79b,#b4703a 55%,#7a4420)' },
  { nome: 'Prata', borda: 'linear-gradient(145deg,#ffffff,#b8c2cf 50%,#7b8798)' },
  { nome: 'Ouro', borda: 'linear-gradient(145deg,#fff1b8,#f2c14e 45%,#b8860b)' },
  { nome: 'Diamante', borda: 'linear-gradient(145deg,#e0fbff,#67e8f9 40%,#7c3aed)' },
];

export const QUANTIDADES = {
  atividade: ['ativação', 'ativações'],
  make: ['revendedora com MAKE', 'revendedoras com MAKE'],
  cabelo: ['revendedora com CABELO', 'revendedoras com CABELO'],
  multimarcas: ['revendedora multimarcas', 'revendedoras multimarcas'],
};

export const meta = (chave) => INDICADORES[chave] || INDICADOR_PADRAO;

/** Indicadores que valem como missão: os "sem meta" ficam de fora (igual aos avisos do servidor). */
export const criteriosValidos = (ciclo) => (ciclo?.criterios || []).filter((c) => !c.sem_meta);
export const rotuloCiclo = (n) => `C${String(n).padStart(2, '0')}`;
export const dataCurta = (iso) => (iso ? String(iso).slice(0, 10).split('-').reverse().slice(0, 2).join('/') : '');

export function emValor(valor, formato) {
  const n = Number(valor || 0);
  if (formato === 'percentual') return `${n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
  if (formato === 'numero') return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (Math.abs(n) >= 1e6) return `R$ ${(n / 1e6).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Mi`;
  if (Math.abs(n) >= 1e3) return `R$ ${(n / 1e3).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mil`;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

export const percentualCriterio = (c) => {
  if (c?.percentual_meta != null) return Number(c.percentual_meta) || 0;
  const m = Number(c?.meta || 0);
  return m > 0 ? (Number(c?.valor || 0) / m) * 100 : 0;
};

/** Texto da missão: o que falta (ou o que já foi), na unidade que faz sentido. */
export function textoMissao(c) {
  const nomes = QUANTIDADES[c.chave];
  if (c.formato === 'percentual' && nomes && Number(c.den) > 0) {
    const alvo = Math.ceil((Number(c.meta) / 100) * Number(c.den) - 1e-9);
    const feito = Number(c.num || 0);
    const falta = Math.max(alvo - feito, 0);
    return {
      progresso: `${feito} de ${alvo}`,
      falta: falta > 0 ? `Faltam ${falta} ${falta === 1 ? nomes[0] : nomes[1]}` : 'Missão cumprida!',
    };
  }
  const falta = Math.max(Number(c.meta || 0) - Number(c.valor || 0), 0);
  return {
    progresso: `${emValor(c.valor, c.formato)} de ${emValor(c.meta, c.formato)}`,
    falta: falta > 0 ? `Faltam ${emValor(falta, c.formato)}` : 'Missão cumprida!',
  };
}

/** Selos por indicador (nível = ciclos encerrados batidos) + especiais. */
export function montarSelos(pessoa) {
  const ciclos = pessoa?.ciclos || [];
  const encerrados = ciclos.filter((c) => c.situacao_ciclo === 'encerrado');
  const atual = ciclos.find((c) => c.situacao_ciclo === 'em_andamento');
  const chaves = [];
  ciclos.forEach((c) => criteriosValidos(c).forEach((cr) => { if (!chaves.includes(cr.chave)) chaves.push(cr.chave); }));
  const porIndicador = chaves.map((chave) => {
    const conquistas = encerrados.filter((c) => (c.criterios || []).some((cr) => cr.chave === chave && cr.ok)).length;
    const crAtual = (atual?.criterios || []).find((cr) => cr.chave === chave);
    return {
      id: chave, chave, nome: meta(chave).nome, nivel: Math.min(conquistas, 4), emJogo: Boolean(crAtual?.ok),
      dica: conquistas ? `${conquistas} ${conquistas === 1 ? 'ciclo batido' : 'ciclos batidos'}` : `Bata ${meta(chave).nome} em um ciclo`,
    };
  });
  const perfeitos = encerrados.filter((c) => c.status === 'bateu').length;
  const especiais = [
    { id: 'perfeito', especial: Star, nome: 'Ciclo perfeito', cor: '#f2c14e', escura: '#b8860b', nivel: Math.min(perfeitos, 4), emJogo: atual?.status === 'batendo', dica: perfeitos ? `${perfeitos} ${perfeitos === 1 ? 'ciclo' : 'ciclos'} com tudo batido` : 'Bata todos os indicadores de um ciclo' },
    { id: 'superacao', especial: Gem, nome: 'Superação 120%', cor: '#7c1f31', escura: '#4c0f1c', nivel: pessoa?.superacao?.ok ? 4 : 0, emJogo: false, dica: pessoa?.superacao?.ok ? 'Receita acima de 120%' : 'Receita somada ≥ 120% da meta' },
    { id: 'viagem', especial: Plane, nome: 'Santo Amaro', cor: '#0f9aa1', escura: '#036b70', nivel: pessoa?.status_106 === 'classificado' ? 4 : 0, emJogo: false, dica: pessoa?.status_106 === 'classificado' ? 'Viagem garantida!' : 'Bata tudo do C14 ao C17' },
  ];
  return { porIndicador, especiais };
}


export const capitalizar = (texto) => String(texto || '').toLowerCase().replace(/(^|\s)\S/g, (l) => l.toUpperCase());

/** "ADRIA THAMYRES LIMA COELHO" → "Adria Coelho"; unidade fica com o nome inteiro. */
export function nomeCurto(entidade) {
  if (entidade?.tipo === 'unidade') return capitalizar(entidade?.nome);
  const partes = String(entidade?.nome || '').trim().split(/\s+/);
  return capitalizar([partes[0], partes.length > 1 ? partes[partes.length - 1] : ''].join(' ').trim());
}

export const numeroNucleo = (valor) => String(valor || '').match(/\d/)?.[0] || '';

/** Placar resumido de uma pessoa/unidade para listas e rankings (ciclo em andamento ou o último com dados). */
export function resumoEntidade(entidade) {
  const ciclos = entidade?.ciclos || [];
  const atual = ciclos.find((c) => c.situacao_ciclo === 'em_andamento') || [...ciclos].reverse().find((c) => (c.criterios || []).length);
  const criterios = criteriosValidos(atual);
  const batidos = criterios.filter((c) => c.ok).length;
  const selos = montarSelos(entidade);
  const todos = [...selos.porIndicador, ...selos.especiais];
  return {
    ciclo: atual,
    batidos,
    total: criterios.length,
    fracao: criterios.length ? batidos / criterios.length : 0,
    tudo: criterios.length > 0 && batidos === criterios.length,
    selos: todos.filter((s) => s.nivel > 0).length,
    niveisSelos: todos.reduce((soma, s) => soma + s.nivel, 0),
    emJogo: todos.filter((s) => s.nivel === 0 && s.emJogo).length,
    receitaPct: Number(entidade?.superacao?.percentual || 0),
    viagem: entidade?.status_106 === 'classificado' ? 'Garantida' : entidade?.status_106 === 'fora' ? 'Fora' : 'Na disputa',
  };
}

/** Ordem do ranking: mais missões cumpridas no ciclo, depois mais selos, depois receita somada. */
export const compararRanking = (a, b) => (b.r.fracao - a.r.fracao) || (b.r.niveisSelos - a.r.niveisSelos) || (b.r.receitaPct - a.r.receitaPct);
