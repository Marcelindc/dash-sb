// Janelas de detalhe dos cards: quadros do topo (Meta, Realizado, % da meta em meia-lua, Falta) e tabela "Acumulado por".
// Só desenham: textos, percentuais e cores chegam prontos do App (regra de cores fica em corPorFaixaMeta).
// Tamanhos em classes próprias (dashboard-refinado.css) porque algumas janelas abrem dentro de .dash-visual-standard,
// que reescreve text-* e font-*.

const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(Number(valor || 0));
const formatarPercentual = (valor) => `${Number(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
const limitarPercentual = (valor) => Math.min(Math.max(Number(valor || 0), 0), 100);

// Fonte do valor pelo tamanho do texto: o maior que cabe no quadro, até 26px (dígito ≈ 0,62 da fonte).
const estiloValor = (valor) => {
  const caracteres = Math.max(String(valor ?? '').length, 6);
  return { fontSize: `clamp(13px, ${(100 / (0.62 * caracteres)).toFixed(2)}cqi, 26px)` };
};

const COMPRIMENTO_ARCO = Math.PI * 50;

const MedidorMeta = ({ percentual, cor, texto }) => (
  <span className="resumo-detalhe-medidor">
    <svg viewBox="0 0 120 62" aria-hidden="true">
      <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="#e2e5e7" strokeWidth="17" />
      <path
        className="resumo-detalhe-medidor-arco"
        d="M10 60 A50 50 0 0 1 110 60"
        fill="none"
        stroke={cor}
        strokeWidth="17"
        strokeDasharray={COMPRIMENTO_ARCO}
        strokeDashoffset={COMPRIMENTO_ARCO * (1 - limitarPercentual(percentual) / 100)}
      />
    </svg>
    <span className="resumo-detalhe-medidor-texto" style={{ color: cor }}>{texto}</span>
  </span>
);

// itens: [{ label, valor, medidor?, percentual?, cor?, nota?, corNota? }] — medidor = % da meta desenhado em meia-lua.
// Colunas: todos numa linha até 5 quadros; mais que isso, 4 por linha. No celular, 2 por linha.
export const ResumoDetalhe = ({ itens = [] }) => {
  const total = itens.length;
  const colunas = total <= 5 ? Math.max(total, 1) : 4;
  return (
    <div className="resumo-detalhe-area">
      <div className="resumo-detalhe" style={{ '--resumo-colunas': colunas, '--resumo-colunas-medio': Math.min(colunas, 4) }}>
        {itens.map((item) => (item.medidor ? (
          <div key={item.label} className="resumo-detalhe-card resumo-detalhe-card-medidor">
            <p className="resumo-detalhe-rotulo">{item.label}</p>
            <MedidorMeta percentual={item.percentual} cor={item.cor} texto={item.valor} />
          </div>
        ) : (
          <div key={item.label} className="resumo-detalhe-card">
            <p className="resumo-detalhe-rotulo">{item.label}</p>
            <p className="resumo-detalhe-valor" style={{ ...estiloValor(item.valor), ...(item.cor ? { color: item.cor } : {}) }} title={String(item.valor ?? '')}>
              {item.valor}
            </p>
            {item.nota ? <p className="resumo-detalhe-nota" style={{ color: item.corNota }}>{item.nota}</p> : null}
          </div>
        )))}
      </div>
    </div>
  );
};

// secao: { titulo, cor, totalRotulo, linhas: [{ posicao, nome, valor, percentual, meta?, percentualMeta?, corMeta? }],
//          mostrarMeta, carregandoMeta, totalMeta, percentualMetaTotal, corMetaTotal }
// mostrarMeta acrescenta a coluna Meta entre Nome e Valor acumulado e troca "% do realizado" por "% da meta"
// (valor da linha sobre a meta da própria estrutura/unidade). Sem meta, "—".
export const TabelaAcumulado = ({ secao }) => {
  const linhas = secao.linhas || [];
  const totalSecao = linhas.reduce((acc, item) => acc + Number(item.valor || 0), 0);
  const colunas = secao.mostrarMeta ? 5 : 4;
  const semMeta = <span className="text-gray-300" title="Sem meta cadastrada">—</span>;
  const carregando = <span className="text-gray-300">carregando…</span>;
  const textoMeta = (meta) => {
    if (secao.carregandoMeta) return carregando;
    return Number(meta || 0) > 0 ? formatarMoeda(meta) : semMeta;
  };
  const textoPercentualMeta = (percentualMeta, cor) => {
    if (secao.carregandoMeta) return carregando;
    return percentualMeta == null ? semMeta : <span style={{ color: cor }}>{formatarPercentual(percentualMeta)}</span>;
  };
  return (
    <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-black text-gray-700">{secao.titulo}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className={`w-full ${secao.mostrarMeta ? 'min-w-[860px]' : 'min-w-[720px]'} text-sm`}>
          <thead className="bg-gray-50 text-[10px] uppercase text-gray-400 font-black">
            <tr>
              <th className="px-5 py-3 text-left">Posição</th>
              <th className="px-5 py-3 text-left">Nome</th>
              {secao.mostrarMeta ? <th className="px-5 py-3 text-right">Meta</th> : null}
              <th className="px-5 py-3 text-right">Valor acumulado</th>
              <th className="px-5 py-3 text-right">{secao.mostrarMeta ? '% da meta' : '% do realizado'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {linhas.map((item) => (
              <tr key={`${secao.titulo}-${item.posicao}-${item.nome}`} className="hover:bg-[#f8fcfc]">
                <td className="px-5 py-3 font-black" style={{ color: secao.cor }}>{item.posicao}º</td>
                <td className="px-5 py-3 font-black text-gray-700">{item.nome}</td>
                {secao.mostrarMeta ? <td className="px-5 py-3 text-right font-black text-gray-500">{textoMeta(item.meta)}</td> : null}
                <td className="px-5 py-3 text-right font-black" style={{ color: secao.cor }}>{formatarMoeda(item.valor || 0)}</td>
                <td className="px-5 py-3 text-right font-black text-gray-600">
                  {secao.mostrarMeta ? textoPercentualMeta(item.percentualMeta, item.corMeta) : formatarPercentual(item.percentual)}
                </td>
              </tr>
            ))}
            {!linhas.length && (
              <tr>
                <td colSpan={colunas} className="px-5 py-10 text-center text-gray-400 font-semibold">Nenhum dado disponível.</td>
              </tr>
            )}
          </tbody>
          <tfoot className="bg-[#f7fafb]">
            <tr>
              <td colSpan="2" className="px-5 py-4 font-black text-gray-600">{secao.totalRotulo}</td>
              {secao.mostrarMeta ? <td className="px-5 py-4 text-right font-black text-gray-500">{textoMeta(secao.totalMeta)}</td> : null}
              <td className="px-5 py-4 text-right font-black" style={{ color: secao.cor }}>{formatarMoeda(totalSecao)}</td>
              <td className="px-5 py-4 text-right font-black text-gray-600">
                {secao.mostrarMeta ? textoPercentualMeta(secao.percentualMetaTotal, secao.corMetaTotal) : '100,0%'}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
};
