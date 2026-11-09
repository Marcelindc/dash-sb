import { Eye } from 'lucide-react';

// Cards do topo da Visão Geral VD e do Acompanhamento VD.
// Só desenham: cores, percentuais e textos chegam prontos do App (regra de cores fica em corPorFaixaMeta).

const formatarPercentual = (valor) => `${Number(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
const limitarPercentual = (valor) => Math.min(Math.max(Number(valor || 0), 0), 100);

// Ícones Flaticon UIcons (fi-sr-blush, fi-ss-hairdryer, fi-sr-boxes, fi-sr-population), contorno tirado da fonte
// oficial para não carregar a biblioteca inteira. Licença gratuita do Flaticon pede crédito: "Uicons by Flaticon".
const ICONES_INDICADOR = {
  make: 'M38 75Q31 75 29 69L22 53L6 46Q0 43 0 37Q0 31 6 28L22 22L29 6Q31 0 37.5 0Q44 0 46 6L53 22L69 29Q75 31 75 37.5Q75 44 69 46L53 53L46 69Q44 75 37 75ZM273 125H189L191 150H271ZM276 100 298 54Q301 46 299.5 37.5Q298 29 291 23Q280 13 263.5 6.5Q247 0 231.5 0Q216 0 199 6.5Q182 13 171 23Q165 29 163 37.5Q161 46 164 54L187 100ZM193 175 201 272Q202 284 210.5 292Q219 300 231 300Q243 300 252 292Q261 284 262 272L269 175ZM162 103Q136 88 106.5 87.5Q77 87 53 101.5Q29 116 14.5 140.5Q0 165 0 194Q0 223 14.5 247Q29 271 53 285.5Q77 300 106 300Q126 300 144 293Q162 286 176 274ZM145 188 131 194 126 208Q124 212 118.5 212Q113 212 112 208L106 194L92 188Q87 186 87.5 180.5Q88 175 93 174L106 168L112 155Q113 150 118.5 150Q124 150 126 155L131 169L145 174Q150 176 150 181.5Q150 187 145 188Z',
  cabelo: 'M200 145Q162 160 137 167Q108 175 88 175Q64 175 44 163Q24 151 12 131Q0 111 0 87.5Q0 64 12 44Q24 24 44 12Q64 0 88 0Q128 0 200 27ZM225 28V145L300 167V9ZM135 193Q108 200 88 200Q75 200 62 197L95 278Q101 292 114 297.5Q127 303 140.5 297.5Q154 292 159.5 278.5Q165 265 159 252Z',
  multi: 'M138 162H38Q22 162 11 173Q0 184 0 200V262Q0 278 11 289Q22 300 38 300H138ZM44 212Q44 207 47.5 203.5Q51 200 56 200H81Q86 200 90 203.5Q94 207 94 212Q94 218 90 221.5Q86 225 81 225H56Q51 225 47.5 221.5Q44 218 44 213ZM263 162H163V300H263Q278 300 289 289Q300 278 300 262V200Q300 184 289 173.5Q278 163 262 163ZM244 225H219Q214 225 210 221.5Q206 218 206 213Q206 207 210 203.5Q214 200 219 200H244Q249 200 252.5 203.5Q256 207 256 212Q256 218 252.5 221.5Q249 225 244 225ZM188 0H113Q97 0 86 11Q75 22 75 38V137H225V37Q225 22 214 11Q203 0 187 0ZM163 62H138Q132 63 128.5 59Q125 55 125 50Q125 45 128.5 41Q132 37 137 37H163Q168 37 171.5 41Q175 45 175 50Q175 55 171.5 58.5Q168 62 162 62Z',
  atividade: 'M188 119Q187 132 178 141Q169 150 156 150Q143 150 134 141Q125 132 125 119Q125 106 134 96.5Q143 87 156 87.5Q169 88 178.5 97Q188 106 188 119ZM250 125Q263 125 272 116Q281 107 281 94Q281 81 272 71.5Q263 62 250 62Q237 62 228 71.5Q219 81 219 94Q219 107 228 116Q237 125 250 125ZM300 187V212Q300 223 295 231.5Q290 240 281 245V287Q281 293 277.5 296.5Q274 300 269 300Q264 300 260 296.5Q256 293 256 287V250H244V287Q244 293 240 296.5Q236 300 231 300Q226 300 222.5 296.5Q219 293 219 287V245Q210 240 205 231.5Q200 223 200 212V187Q200 167 214.5 152Q229 137 250 137Q271 137 285.5 152Q300 167 300 188ZM69 112Q56 112 47 121.5Q38 131 38 144Q38 157 47 166Q56 175 69 175Q82 175 91 166Q100 157 100 144Q100 131 91 121.5Q82 112 69 112ZM150 62Q150 68 153.5 71.5Q157 75 162.5 75Q168 75 171.5 71.5Q175 68 175 63V19Q175 11 169.5 5.5Q164 0 156 0H113Q107 0 103.5 3.5Q100 7 100 12.5Q100 18 103.5 21.5Q107 25 113 25H132L92 63Q91 64 89 63L80 53Q72 45 61 45Q50 45 42 53L4 91Q0 95 0 100Q0 105 3.5 109Q7 113 12.5 113Q18 113 21 109L59 71Q60 70 61 70Q62 70 62 71L72 80Q79 88 90.5 88Q102 88 110 81L150 42ZM88 225V212Q88 206 88.5 200.5Q89 195 86 191Q83 187 77 187H69Q51 187 38 200Q25 213 25 231V237Q25 250 32 259.5Q39 269 50 273V287Q50 293 53.5 296.5Q57 300 62.5 300Q68 300 71.5 296.5Q75 293 75 287V275H82Q90 275 94.5 268Q99 261 95 254Q87 240 88 225ZM185 243Q185 243 185 243Q180 236 177.5 228Q175 220 175 212V180Q176 172 170.5 167Q165 162 157 163Q146 164 138 169Q125 176 119 187.5Q113 199 113 213V225Q113 237 119.5 246.5Q126 256 138 260V287Q138 293 141.5 296.5Q145 300 150 300Q155 300 159 296.5Q163 293 163 287V262H175Q180 262 184 258.5Q188 255 188 250.5Q188 246 185 243Z',
};

export const IconeIndicador = ({ nome, tamanho = 18, cor = '#545454' }) => (
  <svg viewBox="0 0 300 300" width={tamanho} height={tamanho} aria-hidden="true" className="shrink-0">
    <path fill={cor} d={ICONES_INDICADOR[nome]} />
  </svg>
);

const BotaoOlho = ({ titulo, onClick }) => (
  <button
    type="button"
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className="kpi-topo-olho shrink-0 w-[22px] h-[22px] rounded-full inline-flex items-center justify-center text-white cursor-pointer"
    title={titulo}
  >
    <Eye size={13} />
  </button>
);

const Casca = ({ titulo, onAbrir, tituloOlho, className = '', children }) => (
  <article className={`kpi-topo-card ${className}`}>
    <header className="kpi-topo-cabecalho">
      <h3 className="text-[10px] font-black uppercase tracking-[.04em] text-white truncate" title={titulo}>{titulo}</h3>
      {onAbrir ? <BotaoOlho titulo={tituloOlho || `Ver detalhes de ${titulo}`} onClick={onAbrir} /> : null}
    </header>
    {children}
  </article>
);

// Em card estreito o rodapé vira duas linhas (CSS); "emLinha" mantém numa linha só (rótulo curto).
const Rodape = ({ label, valor, cor = '#334155', onClick, tituloClique, emLinha = false }) => (
  <div className={`kpi-topo-rodape ${emLinha ? 'kpi-topo-rodape-linha' : ''}`}>
    <span className="max-w-full text-[9px] font-bold uppercase text-[#94a3b8] truncate" title={label}>{label}</span>
    {onClick ? (
      <button type="button" onClick={onClick} title={tituloClique} className="inline-flex items-center gap-1 text-[11px] font-black whitespace-nowrap shrink-0 cursor-pointer hover:underline" style={{ color: cor }}>
        {valor} <Eye size={12} className="shrink-0" />
      </button>
    ) : (
      <span className="max-w-full text-[11px] font-black truncate shrink-0" style={{ color: cor }} title={String(valor ?? '')}>{valor}</span>
    )}
  </div>
);

// Grade dos cards: o layout segue a largura da área (não da janela), então funciona com ou sem menu lateral.
// variante: '' = 7 cards do VD (Indicadores mais largo) · 'cinco' = Metas por Estruturas
//           'iguais' = 7 cards do mesmo tamanho (LOJA Geral) · 'quatro' = 4 por linha (Histórico)
export const GradeCardsTopo = ({ children, variante = '' }) => (
  <div className="dash-kpis-topo-area">
    <div className={`dash-kpis-topo ${variante ? `dash-kpis-topo-${variante}` : ''}`}>{children}</div>
  </div>
);

// Realizado Total / Diário / Eudora: valor, barra até a meta e a meta no rodapé.
// Sem percentual (cards do Histórico sem meta), fica só o valor.
export const CardKpi = ({ titulo, valor, cor = '#048187', percentual = null, labelMeta, valorMeta, onAbrir }) => (
  <Casca titulo={titulo} onAbrir={onAbrir}>
    <div className="kpi-topo-corpo">
      {/* Valor por extenso (Histórico: R$ 10.412.330,55) usa letra menor para caber no celular. */}
      <p className={`kpi-topo-valor ${String(valor ?? '').length > 13 ? 'kpi-topo-valor-longo' : ''}`} style={{ color: cor }} title={valor}>{valor}</p>
      {percentual !== null && percentual !== undefined ? (
        <div className="mt-2.5 flex items-center gap-2 min-w-0">
          <div className="flex-1 h-1.5 rounded-full bg-[#edf2f3] overflow-hidden">
            <div className="kpi-topo-barra h-full rounded-full" style={{ width: `${limitarPercentual(percentual)}%`, backgroundColor: cor }} />
          </div>
          <span className="text-[10px] font-black shrink-0" style={{ color: cor }}>{formatarPercentual(percentual)}</span>
        </div>
      ) : null}
    </div>
    <Rodape label={labelMeta} valor={valorMeta} />
  </Casca>
);

export const CardTendencia = ({ valor, cor, positiva, icone: Icone, status, labelGap, valorGap, onAbrir }) => (
  <Casca titulo="Tendência" onAbrir={onAbrir}>
    <div className="kpi-topo-corpo items-center">
      <div className="flex items-center justify-center gap-1.5 min-w-0 max-w-full">
        <p className="kpi-topo-valor" style={{ color: cor }} title={valor}>{valor}</p>
        {Icone ? <Icone size={17} className="shrink-0" style={{ color: cor }} /> : null}
      </div>
      <span
        className="mt-2 max-w-full inline-flex items-center rounded-full px-2.5 py-0.5 text-[9.5px] font-bold truncate"
        style={{ color: cor, backgroundColor: positiva ? '#16a34a14' : '#ef444414' }}
      >
        {status}
      </span>
    </div>
    <Rodape label={labelGap} valor={valorGap} />
  </Casca>
);

const NumeroPedidos = ({ label, valor, onClick, titulo }) => {
  const conteudo = (
    <>
      <span className="block text-[8.5px] font-bold uppercase tracking-wide text-[#94a3b8] truncate">{label}</span>
      <span className="block mt-0.5 text-[19px] leading-none font-black text-[#048187] truncate">{valor}</span>
    </>
  );
  if (!onClick) return <div className="text-center min-w-0">{conteudo}</div>;
  return (
    <button type="button" onClick={onClick} title={titulo} className="w-full text-center min-w-0 rounded-lg py-0.5 hover:bg-[#f3f8f8] transition-colors cursor-pointer">
      {conteudo}
    </button>
  );
};

export const CardPedidos = ({ totalPedidos, ativados, cancelados, onAbrirAtivados, onAbrirCancelados }) => (
  <Casca titulo="Pedidos" onAbrir={onAbrirAtivados} tituloOlho="Ver revendedores ativados">
    <div className="kpi-topo-corpo gap-1.5">
      <NumeroPedidos label="Total de pedidos" valor={totalPedidos} />
      <div className="mx-3 h-px bg-[#eef2f3]" />
      <NumeroPedidos label="Rev. ativados" valor={ativados} onClick={onAbrirAtivados} titulo="Ver revendedores ativados" />
    </div>
    <Rodape label="Cancelados" valor={cancelados} cor="#7c1f31" onClick={onAbrirCancelados} tituloClique="Ver pedidos cancelados" emLinha />
  </Casca>
);

const AnelIndicador = ({ atingimento, cor, children }) => {
  const tamanho = 46;
  const espessura = 4.5;
  const raio = (tamanho - espessura) / 2;
  const circunferencia = 2 * Math.PI * raio;
  return (
    <span className="relative inline-flex items-center justify-center shrink-0" style={{ width: tamanho, height: tamanho }}>
      <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`} className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx={tamanho / 2} cy={tamanho / 2} r={raio} fill="none" stroke="#edf2f3" strokeWidth={espessura} />
        <circle
          className="kpi-topo-anel"
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={raio}
          fill="none"
          stroke={cor}
          strokeWidth={espessura}
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          strokeDashoffset={circunferencia * (1 - limitarPercentual(atingimento) / 100)}
        />
      </svg>
      {children}
    </span>
  );
};

// itens: [{ id, nome, icone, valor (% do indicador), meta, atingimento, cor, onClick }]
// No celular e no tablet ocupa 2 colunas (kpi-topo-largo) para os 4 anéis caberem.
export const CardIndicadores = ({ itens, onAbrir }) => (
  <Casca titulo="Indicadores" onAbrir={onAbrir} tituloOlho="Ver resumo dos indicadores" className="kpi-topo-largo">
    <div className="kpi-topo-corpo">
      <div className="grid grid-cols-4 gap-1">
      {itens.map(({ id, nome, icone, valor, meta, atingimento, cor, onClick }) => (
        <button
          key={id}
          type="button"
          onClick={onClick}
          className="group flex flex-col items-center gap-1 min-w-0 rounded-xl py-1 hover:bg-[#f3f8f8] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#048187]/30"
          title={`${nome}: ${formatarPercentual(valor)}${meta ? ` (meta ${formatarPercentual(meta)})` : ''} — abrir detalhamento`}
        >
          <span className="max-w-full text-[8.5px] font-bold uppercase tracking-wide text-[#64748b] truncate">{nome}</span>
          <AnelIndicador atingimento={atingimento} cor={cor}>
            <IconeIndicador nome={icone} />
          </AnelIndicador>
          <span className="text-[11px] leading-none font-black" style={{ color: cor }}>{formatarPercentual(valor)}</span>
        </button>
      ))}
      </div>
    </div>
  </Casca>
);

// itens: [{ nome, valor (texto pronto), cor, onClick }]
export const CardDesempenho = ({ itens, onAbrir }) => (
  <Casca titulo="Desempenho" onAbrir={onAbrir} tituloOlho="Ver desempenho detalhado">
    <div className="kpi-topo-corpo gap-1.5">
      {itens.map(({ nome, valor, cor, onClick }) => {
        const Linha = onClick ? 'button' : 'div';
        return (
          <Linha
            key={nome}
            {...(onClick ? { type: 'button', onClick, title: `Ver detalhes de ${nome}` } : {})}
            className={`w-full rounded-[10px] border border-[#edf2f3] bg-[#f8fafa] px-2 py-[5px] flex items-center justify-between gap-1.5 min-w-0 transition-colors ${onClick ? 'cursor-pointer hover:bg-[#e6f6f7]' : ''}`}
          >
            <span className="text-[9px] font-bold uppercase text-[#64748b] truncate">{nome}</span>
            <span className="text-[11px] font-black whitespace-nowrap shrink-0" style={{ color: cor }}>{valor}</span>
          </Linha>
        );
      })}
    </div>
  </Casca>
);
