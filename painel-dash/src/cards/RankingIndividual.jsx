// Ranking individual dos consultores da VD: cards de cada consultor e as janelas do olho (Faturamento, Eudora,
// Atividade, MAKE, Cabelo, RPA, Ticket, UPA). Fonte única: a tela Metas (detalhe da estrutura) e o
// Acompanhamento do gestor de unidade usam este mesmo componente, então qualquer ajuste aqui vale para todos
// os acessos.
//
// obterDetalhe(consultor) devolve a estrutura do consultor no formato de /metas/estrutura
// ({ base_ativa, meta: { atividade, make, cabelo, eudora, rpa, tkt_medio, upa } }). Deve devolver sempre o
// mesmo objeto para a mesma estrutura: é por ele que se conta quantos consultores dividem o peso.
import { Eye, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';

const formatarMoeda = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(Number(v || 0));
const formatarNumeroBR = (v, casas = 0) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
const formatarAbrev = (v) => {
  const a = Math.abs(Number(v || 0)); const s = Number(v || 0) < 0 ? '-' : '';
  if (a >= 1000000) return `${s}R$${(a / 1000000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} Mi`;
  if (a >= 1000) return `${s}R$${(a / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} Mil`;
  return `${s}R$${a.toLocaleString('pt-BR')}`;
};
const calcPerc = (r, m) => {
  const meta = Number(m || 0);
  if (!meta || meta <= 0) return 0;
  return (Number(r || 0) / meta) * 100;
};
const calcularUpa = (totalItens, atividadeRealizada) => {
  const atividade = Number(atividadeRealizada || 0);
  return atividade > 0 ? Number(totalItens || 0) / atividade : 0;
};
const calcularQtdMetaAtividade = (baseAtiva, metaPercentual) => {
  const base = Number(baseAtiva || 0);
  const meta = Number(metaPercentual || 0);
  if (!base || base <= 0 || !meta || meta <= 0) return 0;
  return Math.ceil((base * meta) / 100);
};
const calcularMetaDistribuida = (metaTotal, peso) => Math.round(Number(metaTotal || 0) * (Number(peso || 0) / 100));
const obterNomeExibicaoConsultor = (item) => item?.nome_exibicao || item?.nome_social || item?.nome || '-';
const obterTendenciaVisual = (idStr) => {
  const hash = idStr ? String(idStr).split('').reduce((a, b) => a + b.charCodeAt(0), 0) : 0;
  if (hash % 3 === 0) return { up: true, val: (hash % 5) + 1 };
  if (hash % 5 === 0) return { up: false, val: (hash % 3) + 1 };
  return { up: true, val: 0 };
};
const obterCorDesempenho = (percentual) => {
  const valor = Number(percentual || 0);
  if (valor < 70) return '#7c1f31';
  if (valor < 91) return '#ff6f03';
  return '#048187';
};

const DETALHE_VAZIO = {};

const CardIndicadorRanking = ({ titulo, meta, realizado, percentualMeta, onClickExpandir }) => {
  const percentualSeguro = Number(percentualMeta || 0);
  const percentualBarra = Math.max(0, Math.min(percentualSeguro, 100));
  const faltaPercentual = Math.max(100 - percentualSeguro, 0);
  const corDesempenho = obterCorDesempenho(percentualSeguro);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] uppercase font-semibold tracking-wide text-gray-500">{titulo}:</p>
        <button
          type="button"
          onClick={onClickExpandir}
          className="text-[#048187] hover:text-[#026a6e] transition-colors"
          title={`Ver detalhes de ${titulo}`}
        >
          <Eye size={16} />
        </button>
      </div>
      <div className="mt-3 space-y-2">
        <div>
          <p className="text-[11px] uppercase font-semibold text-gray-400">Meta:</p>
          <p className="text-[13px] sm:text-[14px] font-semibold text-gray-700 mt-0.5 break-words leading-tight">{meta}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase font-semibold text-gray-400">Realizado:</p>
          <p className="text-[13px] sm:text-[14px] font-semibold mt-0.5 break-words leading-tight" style={{ color: corDesempenho }}>{realizado}</p>
        </div>
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between gap-3 text-[11px] font-semibold flex-wrap">
          <span style={{ color: corDesempenho }}>{formatarNumeroBR(percentualSeguro, 1)}% da meta</span>
          <span style={{ color: corDesempenho }}>{percentualSeguro >= 100 ? 'Meta batida' : `Falta ${formatarNumeroBR(faltaPercentual, 1)}%`}</span>
        </div>
        <div className="mt-1.5 h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${percentualBarra}%`, backgroundColor: corDesempenho }} />
        </div>
      </div>
    </div>
  );
};

const CartaoConsultor = ({ c, idx, detalhe, qtdConsultoresDetalhe, abrirModalValExp }) => {
  const abrirModal = typeof abrirModalValExp === 'function' ? abrirModalValExp : () => {};
  const metaDetalhe = detalhe?.meta || {};
  const baseAtivaDetalhe = Number(detalhe?.base_ativa || 0);
  const metaAtividadeDetalhePercentual = Number(metaDetalhe.atividade || 0);
  const qtdMetaAtividadeDetalhe = calcularQtdMetaAtividade(baseAtivaDetalhe, metaAtividadeDetalhePercentual);
  const metaMakeDetalhePercentual = Number(metaDetalhe.make || 0);
  const metaCabeloDetalhePercentual = Number(metaDetalhe.cabelo || 0);
  const metaEudoraDetalhePercentual = Number(metaDetalhe.eudora || 20);

  const trend = obterTendenciaVisual(c.id_colaborador);
  const pesoInformado = Number(c?.peso_meta || 0);
  const pesoConsultor = pesoInformado > 0 ? pesoInformado : (qtdConsultoresDetalhe > 0 ? 100 / qtdConsultoresDetalhe : 100);
  const faturamentoRealizado = Number(c.realizado || 0);
  const faturamentoMeta = Number(c.meta_individual || 0);
  const atividadeRealizadaItem = Number(c.atividade_realizada || 0);
  const percentualAtividadeItem = Number(c.percentual_atividade || 0);
  const metaAtividadeItem = c.tipo_fallback_estrutura ? qtdMetaAtividadeDetalhe : calcularMetaDistribuida(qtdMetaAtividadeDetalhe, pesoConsultor);
  const percentualMetaAtividadeItem = metaAtividadeDetalhePercentual;
  const makeRealizadoItem = Number(c.make_realizado || 0);
  const percentualMakeItem = Number(c.percentual_make || 0);
  const percentualMetaMakeItem = metaMakeDetalhePercentual;
  const atividadeMakeBaseItem = Number(c.atividade_make_base || atividadeRealizadaItem);
  const metaMakeItem = Math.ceil((atividadeMakeBaseItem * percentualMetaMakeItem) / 100);
  const cabeloRealizadoItem = Number(c.cabelo_realizado || 0);
  const percentualCabeloItem = Number(c.percentual_cabelo || 0);
  const percentualMetaCabeloItem = metaCabeloDetalhePercentual;
  const atividadeCabeloBaseItem = Number(c.atividade_cabelo_base || atividadeRealizadaItem);
  const metaCabeloItem = Math.ceil((atividadeCabeloBaseItem * percentualMetaCabeloItem) / 100);
  const rpaRealizadoItem = atividadeRealizadaItem > 0 ? faturamentoRealizado / atividadeRealizadaItem : 0;
  const ticketRealizadoItem = Number(c.quantidade_pedidos || 0) > 0 ? faturamentoRealizado / Number(c.quantidade_pedidos || 0) : 0;
  const upaRealizadoItem = calcularUpa(Number(c.total_itens || 0), atividadeRealizadaItem);
  const percentualFaturamentoItem = calcPerc(faturamentoRealizado, faturamentoMeta);
  const faltaFaturamentoItem = Math.max(faturamentoMeta - faturamentoRealizado, 0);
  const percentualMetaAtividadeAtingido = calcPerc(percentualAtividadeItem, percentualMetaAtividadeItem);
  const faltamAtivarItem = Math.max(metaAtividadeItem - atividadeRealizadaItem, 0);
  const percentualMetaMakeAtingido = calcPerc(makeRealizadoItem, metaMakeItem);
  const faltamMakeItem = Math.max(metaMakeItem - makeRealizadoItem, 0);
  const percentualMetaCabeloAtingido = calcPerc(cabeloRealizadoItem, metaCabeloItem);
  const faltamCabeloItem = Math.max(metaCabeloItem - cabeloRealizadoItem, 0);
  const metaEudoraPercentualItem = Number(c.meta_eudora || metaEudoraDetalhePercentual || 20);
  const metaEudoraValorItem = Number(c.meta_eudora_valor || (faturamentoMeta * metaEudoraPercentualItem / 100));
  const eudoraRealizadoItem = Number(c.eudora_realizado || 0);
  const percentualMetaEudoraAtingido = Number(c.percentual_eudora || calcPerc(eudoraRealizadoItem, metaEudoraValorItem));
  const faltamEudoraItem = Math.max(metaEudoraValorItem - eudoraRealizadoItem, 0);
  const pedidosEudoraItem = Number(c.pedidos_eudora || 0);
  const metaRpaItem = Number(metaDetalhe.rpa || 0);
  const percentualMetaRpaAtingido = calcPerc(rpaRealizadoItem, metaRpaItem);
  const faturamentoNecessarioRpaItem = metaRpaItem * atividadeRealizadaItem;
  const faltamFaturarRpaItem = Math.max(faturamentoNecessarioRpaItem - faturamentoRealizado, 0);
  const metaTicketItem = Number(metaDetalhe.tkt_medio || 0);
  const percentualMetaTicketAtingido = calcPerc(ticketRealizadoItem, metaTicketItem);
  const faturamentoNecessarioTicketItem = metaTicketItem * Number(c.quantidade_pedidos || 0);
  const faltamFaturarTicketItem = Math.max(faturamentoNecessarioTicketItem - faturamentoRealizado, 0);
  const metaUpaItem = Number(metaDetalhe.upa || 0);
  const percentualMetaUpaAtingido = calcPerc(upaRealizadoItem, metaUpaItem);
  const itensNecessariosUpaItem = metaUpaItem * atividadeRealizadaItem;
  const faltamItensUpaItem = Math.max(itensNecessariosUpaItem - Number(c.total_itens || 0), 0);
  const percentualConsultor = Number(c.percentual || 0) > 0 ? Number(c.percentual) : percentualFaturamentoItem;
  const nomeConsultor = obterNomeExibicaoConsultor(c);

  const abrirDetalheFaturamentoRanking = () => abrirModal(
    `Faturamento ${nomeConsultor}`,
    formatarMoeda(faturamentoRealizado),
    'Detalhamento do faturamento realizado versus a meta individual.',
    [
      { label: 'Meta faturamento', valor: formatarMoeda(faturamentoMeta) },
      { label: 'Realizado', valor: formatarMoeda(faturamentoRealizado) },
      { label: '% realizado da meta', valor: `${formatarNumeroBR(percentualFaturamentoItem, 1)}%` },
      { label: 'Falta para a meta', valor: faltaFaturamentoItem > 0 ? formatarMoeda(faltaFaturamentoItem) : 'Meta batida' },
    ],
    `${formatarMoeda(faturamentoRealizado)} ÷ ${formatarMoeda(faturamentoMeta)} = ${formatarNumeroBR(percentualFaturamentoItem, 1)}% da meta`
  );

  const abrirDetalheAtividadeRanking = () => abrirModal(
    `Atividade ${nomeConsultor}`,
    `${formatarNumeroBR(percentualAtividadeItem, 1)}%`,
    'Atividade calculada com base na meta percentual, na base ativa da estrutura e na distribuição individual pelo peso do consultor quando aplicável.',
    [
      { label: 'Base ativa da estrutura', valor: formatarNumeroBR(baseAtivaDetalhe, 0) },
      { label: 'Meta atividade da estrutura', valor: `${formatarNumeroBR(metaAtividadeDetalhePercentual, 1)}%` },
      { label: 'Meta em revendedores da estrutura', valor: formatarNumeroBR(qtdMetaAtividadeDetalhe, 0) },
      { label: c.tipo_fallback_estrutura ? 'Meta da equipe' : 'Peso do consultor', valor: c.tipo_fallback_estrutura ? '100,00%' : `${formatarNumeroBR(pesoConsultor, 2)}%` },
      { label: 'Meta individual em revendedores', valor: formatarNumeroBR(metaAtividadeItem, 0) },
      { label: 'Revendedores ativados', valor: formatarNumeroBR(atividadeRealizadaItem, 0) },
      { label: '% atividade realizado', valor: `${formatarNumeroBR(percentualAtividadeItem, 1)}%` },
      { label: '% realizado da meta', valor: `${formatarNumeroBR(percentualMetaAtividadeAtingido, 1)}%` },
      { label: 'Falta para a meta', valor: faltamAtivarItem > 0 ? `${formatarNumeroBR(faltamAtivarItem, 0)} revendedores` : 'Meta batida' },
    ],
    c.tipo_fallback_estrutura
      ? `${formatarNumeroBR(baseAtivaDetalhe, 0)} × ${formatarNumeroBR(metaAtividadeDetalhePercentual, 1)}% = ${formatarNumeroBR(qtdMetaAtividadeDetalhe, 0)} revendedores necessários`
      : `Meta individual: ${formatarNumeroBR(qtdMetaAtividadeDetalhe, 0)} × ${formatarNumeroBR(pesoConsultor, 2)}% = ${formatarNumeroBR(metaAtividadeItem, 0)} revendedores`
  );

  const abrirDetalheMakeRanking = () => abrirModal(
    `MAKE ${nomeConsultor}`,
    `${formatarNumeroBR(percentualMakeItem, 1)}%`,
    'MAKE calculado sobre a atividade do próprio consultor: revendedores ativados pelo consultor × meta percentual de MAKE.',
    [
      { label: 'Revendedores ativados pelo consultor', valor: formatarNumeroBR(atividadeRealizadaItem, 0) },
      { label: 'Meta MAKE (%)', valor: `${formatarNumeroBR(percentualMetaMakeItem, 1)}%` },
      { label: 'Meta individual com MAKE', valor: formatarNumeroBR(metaMakeItem, 0) },
      { label: 'Revendedores com MAKE', valor: formatarNumeroBR(makeRealizadoItem, 0) },
      { label: '% MAKE realizado', valor: `${formatarNumeroBR(percentualMakeItem, 1)}%` },
      { label: '% realizado da meta', valor: `${formatarNumeroBR(percentualMetaMakeAtingido, 1)}%` },
      { label: 'Falta para a meta MAKE', valor: faltamMakeItem > 0 ? `${formatarNumeroBR(faltamMakeItem, 0)} revendedores` : 'Meta batida' },
    ],
    `${formatarNumeroBR(atividadeRealizadaItem, 0)} ativados × ${formatarNumeroBR(percentualMetaMakeItem, 1)}% = ${formatarNumeroBR(metaMakeItem, 0)} revendedores necessários com MAKE`
  );

  const abrirDetalheCabeloRanking = () => abrirModal(
    `CABELO ${nomeConsultor}`,
    `${formatarNumeroBR(percentualCabeloItem, 1)}%`,
    'CABELO calculado sobre a atividade do próprio consultor: revendedores ativados pelo consultor × meta percentual de CABELO.',
    [
      { label: 'Revendedores ativados pelo consultor', valor: formatarNumeroBR(atividadeRealizadaItem, 0) },
      { label: 'Meta CABELO (%)', valor: `${formatarNumeroBR(percentualMetaCabeloItem, 1)}%` },
      { label: 'Meta individual com CABELO', valor: formatarNumeroBR(metaCabeloItem, 0) },
      { label: 'Revendedores com CABELO', valor: formatarNumeroBR(cabeloRealizadoItem, 0) },
      { label: '% CABELO realizado', valor: `${formatarNumeroBR(percentualCabeloItem, 1)}%` },
      { label: '% realizado da meta', valor: `${formatarNumeroBR(percentualMetaCabeloAtingido, 1)}%` },
      { label: 'Falta para a meta CABELO', valor: faltamCabeloItem > 0 ? `${formatarNumeroBR(faltamCabeloItem, 0)} revendedores` : 'Meta batida' },
    ],
    `${formatarNumeroBR(atividadeRealizadaItem, 0)} ativados × ${formatarNumeroBR(percentualMetaCabeloItem, 1)}% = ${formatarNumeroBR(metaCabeloItem, 0)} revendedores necessários com CABELO`
  );

  const abrirDetalheEudoraRanking = () => abrirModal(
    `Eudora ${nomeConsultor}`,
    formatarMoeda(eudoraRealizadoItem),
    '',
    [
      { label: 'Meta Eudora (% do faturamento)', valor: `${formatarNumeroBR(metaEudoraPercentualItem, 1)}%` },
      { label: 'Meta Eudora', valor: formatarMoeda(metaEudoraValorItem) },
      { label: 'Realizado Eudora', valor: formatarMoeda(eudoraRealizadoItem) },
      { label: '% da meta', valor: `${formatarNumeroBR(percentualMetaEudoraAtingido, 1)}%` },
      { label: 'Pedidos Eudora', valor: formatarNumeroBR(pedidosEudoraItem, 0) },
      { label: 'Falta para a meta', valor: faltamEudoraItem > 0 ? formatarMoeda(faltamEudoraItem) : 'Meta batida' },
    ]
  );

  const abrirDetalheRpaRanking = () => abrirModal(
    `RPA ${nomeConsultor}`,
    formatarMoeda(rpaRealizadoItem),
    'RPA calculado pelo faturamento realizado dividido pelos revendedores ativados.',
    [
      { label: 'Meta RPA', valor: formatarMoeda(metaRpaItem) },
      { label: 'RPA realizado', valor: formatarMoeda(rpaRealizadoItem) },
      { label: '% realizado da meta', valor: `${formatarNumeroBR(percentualMetaRpaAtingido, 1)}%` },
      { label: 'Faturamento realizado', valor: formatarMoeda(faturamentoRealizado) },
      { label: 'Revendedores ativados', valor: formatarNumeroBR(atividadeRealizadaItem, 0) },
      { label: 'Receita necessária para a meta', valor: formatarMoeda(faturamentoNecessarioRpaItem) },
      { label: 'Falta para a meta', valor: faltamFaturarRpaItem > 0 ? formatarMoeda(faltamFaturarRpaItem) : 'Meta batida' },
    ],
    `${formatarMoeda(faturamentoRealizado)} ÷ ${formatarNumeroBR(atividadeRealizadaItem, 0)} = ${formatarMoeda(rpaRealizadoItem)} | Meta: ${formatarNumeroBR(atividadeRealizadaItem, 0)} × ${formatarMoeda(metaRpaItem)} = ${formatarMoeda(faturamentoNecessarioRpaItem)}`
  );

  const abrirDetalheTicketRanking = () => abrirModal(
    `Ticket Médio ${nomeConsultor}`,
    formatarMoeda(ticketRealizadoItem),
    'Ticket médio calculado pelo faturamento realizado dividido pela quantidade de pedidos.',
    [
      { label: 'Meta ticket médio', valor: formatarMoeda(metaTicketItem) },
      { label: 'Ticket médio realizado', valor: formatarMoeda(ticketRealizadoItem) },
      { label: '% realizado da meta', valor: `${formatarNumeroBR(percentualMetaTicketAtingido, 1)}%` },
      { label: 'Faturamento realizado', valor: formatarMoeda(faturamentoRealizado) },
      { label: 'Quantidade de pedidos', valor: formatarNumeroBR(Number(c.quantidade_pedidos || 0), 0) },
      { label: 'Receita necessária para a meta', valor: formatarMoeda(faturamentoNecessarioTicketItem) },
      { label: 'Falta para a meta', valor: faltamFaturarTicketItem > 0 ? formatarMoeda(faltamFaturarTicketItem) : 'Meta batida' },
    ],
    `${formatarMoeda(faturamentoRealizado)} ÷ ${formatarNumeroBR(Number(c.quantidade_pedidos || 0), 0)} = ${formatarMoeda(ticketRealizadoItem)} | Meta: ${formatarNumeroBR(Number(c.quantidade_pedidos || 0), 0)} × ${formatarMoeda(metaTicketItem)} = ${formatarMoeda(faturamentoNecessarioTicketItem)}`
  );

  const abrirDetalheUpaRanking = () => abrirModal(
    `UPA ${nomeConsultor}`,
    formatarNumeroBR(upaRealizadoItem, 1),
    'UPA calculado pelo total de itens vendidos dividido pelos revendedores ativados.',
    [
      { label: 'Meta UPA', valor: formatarNumeroBR(metaUpaItem, 1) },
      { label: 'UPA realizado', valor: formatarNumeroBR(upaRealizadoItem, 1) },
      { label: '% realizado da meta', valor: `${formatarNumeroBR(percentualMetaUpaAtingido, 1)}%` },
      { label: 'Itens vendidos', valor: formatarNumeroBR(Number(c.total_itens || 0), 0) },
      { label: 'Revendedores ativados', valor: formatarNumeroBR(atividadeRealizadaItem, 0) },
      { label: 'Itens necessários', valor: formatarNumeroBR(itensNecessariosUpaItem, 0) },
      { label: 'Falta para a meta', valor: faltamItensUpaItem > 0 ? formatarNumeroBR(faltamItensUpaItem, 0) : 'Meta batida' },
    ],
    `${formatarNumeroBR(Number(c.total_itens || 0), 0)} ÷ ${formatarNumeroBR(atividadeRealizadaItem, 0)} = ${formatarNumeroBR(upaRealizadoItem, 1)} | Meta: ${formatarNumeroBR(atividadeRealizadaItem, 0)} × ${formatarNumeroBR(metaUpaItem, 1)} = ${formatarNumeroBR(itensNecessariosUpaItem, 0)} itens`
  );

  return (
    <div className="border border-gray-100 rounded-xl p-4 bg-[#fcfbf7] min-w-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-7 h-7 rounded-full bg-[#048187] text-white text-xs font-medium flex items-center justify-center shrink-0">{idx + 1}</span>
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-gray-700 truncate">{nomeConsultor}</h3>
            <p className="text-xs text-gray-400 truncate">
              {c.tipo_fallback_estrutura
                ? `Resultado consolidado da equipe • Pedidos: ${formatarNumeroBR(c.quantidade_pedidos, 0)}`
                : `ID: ${c.id_colaborador || '-'} • Peso: ${formatarNumeroBR(pesoConsultor, 2)}% • Pedidos: ${formatarNumeroBR(c.quantidade_pedidos, 0)}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <p className="text-lg font-medium text-[#048187] whitespace-nowrap">{formatarNumeroBR(percentualConsultor, 2)}%</p>
          {!c.tipo_fallback_estrutura && trend.val > 0 && (trend.up ? <ArrowUpRight size={18} className="text-green-500" /> : <ArrowDownRight size={18} className="text-red-500" />)}
        </div>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
        <CardIndicadorRanking
          titulo="Faturamento"
          meta={formatarAbrev(faturamentoMeta)}
          realizado={formatarAbrev(faturamentoRealizado)}
          percentualMeta={percentualFaturamentoItem}
          onClickExpandir={abrirDetalheFaturamentoRanking}
        />
        <CardIndicadorRanking
          titulo="Eudora"
          meta={formatarMoeda(metaEudoraValorItem)}
          realizado={formatarMoeda(eudoraRealizadoItem)}
          percentualMeta={percentualMetaEudoraAtingido}
          onClickExpandir={abrirDetalheEudoraRanking}
        />
        <CardIndicadorRanking
          titulo="Atividade"
          meta={`${formatarNumeroBR(metaAtividadeItem, 0)} rev. • ${formatarNumeroBR(percentualMetaAtividadeItem, 1)}%`}
          realizado={`${formatarNumeroBR(atividadeRealizadaItem, 0)} rev. • ${formatarNumeroBR(percentualAtividadeItem, 1)}%`}
          percentualMeta={percentualMetaAtividadeAtingido}
          onClickExpandir={abrirDetalheAtividadeRanking}
        />
        <CardIndicadorRanking
          titulo="MAKE"
          meta={`${formatarNumeroBR(metaMakeItem, 0)} rev. • ${formatarNumeroBR(percentualMetaMakeItem, 1)}%`}
          realizado={`${formatarNumeroBR(makeRealizadoItem, 0)} rev. • ${formatarNumeroBR(percentualMakeItem, 1)}%`}
          percentualMeta={percentualMetaMakeAtingido}
          onClickExpandir={abrirDetalheMakeRanking}
        />
        <CardIndicadorRanking
          titulo="Cabelo"
          meta={`${formatarNumeroBR(metaCabeloItem, 0)} rev. • ${formatarNumeroBR(percentualMetaCabeloItem, 1)}%`}
          realizado={`${formatarNumeroBR(cabeloRealizadoItem, 0)} rev. • ${formatarNumeroBR(percentualCabeloItem, 1)}%`}
          percentualMeta={percentualMetaCabeloAtingido}
          onClickExpandir={abrirDetalheCabeloRanking}
        />
        <CardIndicadorRanking
          titulo="RPA"
          meta={formatarMoeda(metaRpaItem)}
          realizado={formatarMoeda(rpaRealizadoItem)}
          percentualMeta={percentualMetaRpaAtingido}
          onClickExpandir={abrirDetalheRpaRanking}
        />
        <CardIndicadorRanking
          titulo="Ticket Médio"
          meta={formatarMoeda(metaTicketItem)}
          realizado={formatarMoeda(ticketRealizadoItem)}
          percentualMeta={percentualMetaTicketAtingido}
          onClickExpandir={abrirDetalheTicketRanking}
        />
        <CardIndicadorRanking
          titulo="UPA"
          meta={formatarNumeroBR(metaUpaItem, 1)}
          realizado={formatarNumeroBR(upaRealizadoItem, 1)}
          percentualMeta={percentualMetaUpaAtingido}
          onClickExpandir={abrirDetalheUpaRanking}
        />
      </div>
    </div>
  );
};

// Quadro "Ranking individual" completo (título + estados de carregando/vazio + um cartão por consultor).
export function RankingIndividualConsultores({ consultores = [], obterDetalhe, abrirModalValExp, carregando = false, mensagemVazia = 'Nenhum consultor encontrado.' }) {
  const lista = Array.isArray(consultores) ? consultores : [];
  const detalheDe = (c) => (typeof obterDetalhe === 'function' ? obterDetalhe(c) : null) || DETALHE_VAZIO;
  const qtdPorDetalhe = new Map();
  lista.forEach((c) => {
    const detalhe = detalheDe(c);
    qtdPorDetalhe.set(detalhe, (qtdPorDetalhe.get(detalhe) || 0) + 1);
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
      <h2 className="text-lg font-medium text-gray-700 text-center mb-4 border-b border-gray-100 pb-3">Ranking individual</h2>
      {carregando ? (
        <div className="py-12 flex items-center justify-center gap-3 text-[#048187] font-semibold">
          <Loader2 size={20} className="animate-spin" /> Atualizando ranking...
        </div>
      ) : !lista.length ? (
        <div className="py-12 text-center text-sm font-semibold text-gray-400">{mensagemVazia}</div>
      ) : (
        <div className="space-y-4">
          {lista.map((c, idx) => {
            const detalhe = detalheDe(c);
            return (
              <CartaoConsultor
                key={`${c?.id_colaborador || c?.nome || 'consultor'}-${idx}`}
                c={c}
                idx={idx}
                detalhe={detalhe}
                qtdConsultoresDetalhe={qtdPorDetalhe.get(detalhe) || 0}
                abrirModalValExp={abrirModalValExp}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RankingIndividualConsultores;
