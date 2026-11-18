// Cartões do topo da janela MAKE / CABELO / MULTIMARCAS / ATIVIDADE (modelo do usuário, 18/11/2026):
// rótulo em cima e número embaixo, centralizados, sem o quadro grande de "% ativação".
// Os mesmos rótulos e formatos saem no relatório em imagem/Excel (src/relatorios/definicoes.js).
import { metaCartao, numero, percentual, textoSaldo } from '../relatorios/formatos';
import { rotulosIaf } from '../relatorios/definicoes';

export const ResumoIndicadorIaf = ({ dados }) => {
  const resumo = dados?.resumo || {};
  const rotulos = rotulosIaf(dados);
  const saldo = Math.round(Number(resumo.saldo_meta || 0));
  const itens = [
    { rotulo: rotulos.comCartao, valor: numero(resumo.com_indicador), cor: 'text-[#048187]' },
    { rotulo: rotulos.ativos, valor: numero(resumo.ativos), cor: 'text-gray-600' },
    { rotulo: '%Ativação', valor: percentual(resumo.percentual_ativacao), cor: 'text-[#048187]' },
    { rotulo: 'Meta', valor: metaCartao(resumo.meta_percentual), cor: 'text-gray-600' },
    { rotulo: '% da meta', valor: percentual(resumo.percentual_meta), cor: 'text-[#048187]' },
    { rotulo: 'Ativação ideal', valor: numero(resumo.ativacao_ideal), cor: 'text-gray-600' },
    { rotulo: 'Saldo', valor: textoSaldo(saldo), cor: saldo < 0 ? 'text-[#7c1f31]' : 'text-[#048187]' },
  ];
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3 lg:grid-cols-7">
      {itens.map((item, indice) => (
        <div
          key={item.rotulo}
          className={`min-w-0 rounded-xl border border-gray-100 bg-[#f8f9fa] px-2.5 py-3 text-center ${indice === itens.length - 1 ? 'col-span-2 sm:col-span-1' : ''}`}
        >
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase leading-tight tracking-wide text-gray-500">{item.rotulo}</p>
          <p className={`mt-1.5 text-lg sm:text-xl font-extrabold leading-none ${item.cor}`}>{item.valor}</p>
        </div>
      ))}
    </div>
  );
};

export default ResumoIndicadorIaf;
