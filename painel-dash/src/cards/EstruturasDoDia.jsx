// Janela do Realizado Diário (VD): estruturas com a meta do dia e, no "+", os consultores de cada uma.
// Os números vêm prontos do servidor (/dashboard/realizado-diario-rapido → meta_diaria_por_estrutura):
// meta do dia = (meta do ciclo − vendido até ontem) ÷ dias úteis que faltam, só segunda a sexta.
// Sábado e domingo não têm meta: o que vende neles é bônus e baixa a meta dos próximos dias úteis.
import { Fragment, useState } from 'react';
import { Minus, Plus } from 'lucide-react';

const formatarMoeda = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(Number(v || 0));
const formatarNumeroBR = (v, casas = 0) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
const calcPerc = (r, m) => (Number(m || 0) > 0 ? (Number(r || 0) / Number(m)) * 100 : 0);
const corPercentual = (percentual) => (percentual >= 100 ? 'text-[#15803d]' : 'text-[#7c1f31]');

function CelulasMeta({ item, diaUtil }) {
  const meta = Number(item?.meta_hoje || 0);
  const vendido = Number(item?.vendido_hoje || 0);
  if (!diaUtil) {
    return (
      <>
        <td className="px-4 py-3 text-right font-bold text-gray-400">—</td>
        <td className="px-4 py-3 text-right font-bold text-gray-400">—</td>
        <td className="px-4 py-3 text-right font-black text-[#15803d]">{vendido > 0 ? 'Bônus' : '—'}</td>
      </>
    );
  }
  if (meta <= 0) {
    return (
      <>
        <td className="px-4 py-3 text-right font-bold text-gray-400">{item?.sem_meta || item?.sem_meta_individual ? 'Sem meta' : 'Meta batida'}</td>
        <td className="px-4 py-3 text-right font-bold text-gray-400">—</td>
        <td className="px-4 py-3 text-right font-bold text-gray-400">—</td>
      </>
    );
  }
  const percentual = calcPerc(vendido, meta);
  const falta = Math.max(meta - vendido, 0);
  return (
    <>
      <td className="px-4 py-3 text-right font-black text-gray-700">{formatarMoeda(meta)}</td>
      <td className={`px-4 py-3 text-right font-black ${corPercentual(percentual)}`}>{formatarNumeroBR(percentual, 1)}%</td>
      <td className="px-4 py-3 text-right font-black text-[#7c1f31]">{falta > 0 ? formatarMoeda(falta) : 'Batida'}</td>
    </>
  );
}

// Celular: um cartão por estrutura (a tabela larga escondia número e "+" fora da tela).
function ResumoLinhaCelular({ item, diaUtil }) {
  const meta = Number(item?.meta_hoje || 0);
  const vendido = Number(item?.vendido_hoje || 0);
  const percentual = calcPerc(vendido, meta);
  let rotulo = 'Sem meta';
  if (!diaUtil) rotulo = vendido > 0 ? 'Bônus de fim de semana' : '—';
  else if (meta > 0) rotulo = `Meta ${formatarMoeda(meta)}`;
  else if (!(item?.sem_meta || item?.sem_meta_individual)) rotulo = 'Meta batida';
  return (
    <div className="mt-1.5">
      <div className="flex items-baseline justify-between gap-2 text-[12px]">
        <span className="font-black text-[#257B9C]">{formatarMoeda(vendido)}</span>
        <span className={`font-bold ${!diaUtil && vendido > 0 ? 'text-[#15803d]' : 'text-gray-500'}`}>{rotulo}</span>
      </div>
      {diaUtil && meta > 0 && (
        <div className="mt-1.5 flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-[#edf2f3] overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${Math.min(percentual, 100)}%`, backgroundColor: percentual >= 100 ? '#15803d' : '#257B9C' }} />
          </div>
          <span className={`text-[11px] font-black ${corPercentual(percentual)}`}>{formatarNumeroBR(percentual, 1)}%</span>
          <span className="text-[11px] font-bold text-[#7c1f31]">{meta - vendido > 0 ? `falta ${formatarMoeda(meta - vendido)}` : 'batida'}</span>
        </div>
      )}
    </div>
  );
}

export default function EstruturasDoDia({ estruturas = [], diaUtil = true, abertasIniciais = [] }) {
  const [abertas, setAbertas] = useState(() => new Set(abertasIniciais));
  const alternar = (chave) => setAbertas((atual) => {
    const proximo = new Set(atual);
    if (proximo.has(chave)) proximo.delete(chave);
    else proximo.add(chave);
    return proximo;
  });

  const metaTotal = estruturas.reduce((soma, item) => soma + Number(item?.meta_hoje || 0), 0);
  const totalVendido = estruturas.reduce((soma, item) => soma + Number(item?.vendido_hoje || 0), 0);
  const percentualTotal = calcPerc(totalVendido, metaTotal);

  return (
    <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="px-5 py-4 bg-[#e9f4f8] flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-black text-[#257B9C]">Vendas por estrutura</h3>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            {diaUtil
              ? 'Meta do dia = o que falta da meta do ciclo até ontem ÷ dias úteis restantes (seg–sex). Clique no + para ver os consultores.'
              : 'Fim de semana: não há meta do dia. O que vender hoje é bônus e baixa a meta dos próximos dias úteis.'}
          </p>
        </div>
        <span className="text-xs font-black text-[#257B9C]">{estruturas.length} estrutura(s)</span>
      </div>

      <ul className="sm:hidden divide-y divide-gray-100">
        {estruturas.map((item, indice) => {
          const chave = `${item?.meta_id ?? ''}-${item?.estrutura || indice}`;
          const aberta = abertas.has(chave);
          const consultores = Array.isArray(item?.consultores) ? item.consultores : [];
          return (
            <li key={`celular-${chave}`} className={aberta ? 'bg-[#f5fafd]' : ''}>
              <button
                type="button"
                onClick={() => consultores.length && alternar(chave)}
                aria-expanded={aberta}
                aria-label={`${aberta ? 'Esconder' : 'Ver'} consultores de ${item?.estrutura || 'estrutura'}`}
                className="w-full text-left px-4 py-3 flex items-start gap-3"
              >
                <span className={`mt-0.5 w-7 h-7 shrink-0 rounded-full inline-flex items-center justify-center bg-[#e9f4f8] text-[#257B9C] ${consultores.length ? '' : 'opacity-30'}`}>
                  {aberta ? <Minus size={15} strokeWidth={3} /> : <Plus size={15} strokeWidth={3} />}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-baseline gap-2 min-w-0">
                    <span className="text-[12px] font-black text-[#257B9C] shrink-0">{item?.posicao || indice + 1}º</span>
                    <span className="text-[13px] font-black text-gray-700 truncate">{item?.estrutura || 'Não informada'}</span>
                    {item?.nucleo && item.nucleo !== 'SEM META' && <span className="text-[10px] font-black text-gray-400 shrink-0">{item.nucleo}</span>}
                  </span>
                  <ResumoLinhaCelular item={item} diaUtil={diaUtil} />
                </span>
              </button>
              {aberta && (
                <ul className="mx-4 mb-3 rounded-xl border border-[#d6ebf3] bg-white divide-y divide-gray-100">
                  {consultores.map((consultor, posicao) => (
                    <li key={`celular-${chave}-${consultor?.id_consultor || posicao}`} className="px-3 py-2.5">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="text-[12px] font-bold text-gray-700 truncate">{consultor?.consultor || 'Não identificado'}</span>
                        {consultor?.sem_meta_individual && <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-black text-gray-500">sem meta</span>}
                      </span>
                      <ResumoLinhaCelular item={consultor} diaUtil={diaUtil} />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
        <li className="px-4 py-3 bg-[#f5fafd]">
          <p className="text-[11px] font-black text-gray-600">TOTAL DAS ESTRUTURAS</p>
          <ResumoLinhaCelular item={{ meta_hoje: metaTotal, vendido_hoje: totalVendido }} diaUtil={diaUtil} />
        </li>
      </ul>

      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-gray-50 text-[10px] uppercase text-gray-400 font-black">
            <tr>
              <th className="pl-4 pr-1 py-3 w-10" aria-label="Ver consultores" />
              <th className="px-2 py-3 text-left">Posição</th>
              <th className="px-4 py-3 text-left">Estrutura</th>
              <th className="px-4 py-3 text-right">Pedidos</th>
              <th className="px-4 py-3 text-right">Vendido hoje</th>
              <th className="px-4 py-3 text-right">Meta do dia</th>
              <th className="px-4 py-3 text-right">% da meta</th>
              <th className="px-4 py-3 text-right">Falta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {estruturas.map((item, indice) => {
              const chave = `${item?.meta_id ?? ''}-${item?.estrutura || indice}`;
              const aberta = abertas.has(chave);
              const consultores = Array.isArray(item?.consultores) ? item.consultores : [];
              return (
                <Fragment key={chave}>
                  <tr className={aberta ? 'bg-[#f5fafd]' : 'hover:bg-[#f8fcfc]'}>
                    <td className="pl-4 pr-1 py-2">
                      <button
                        type="button"
                        onClick={() => alternar(chave)}
                        disabled={!consultores.length}
                        aria-expanded={aberta}
                        aria-label={`${aberta ? 'Esconder' : 'Ver'} consultores de ${item?.estrutura || 'estrutura'}`}
                        title={consultores.length ? (aberta ? 'Esconder consultores' : 'Ver consultores') : 'Sem consultores com meta ou venda hoje'}
                        className="w-7 h-7 rounded-full inline-flex items-center justify-center bg-[#e9f4f8] text-[#257B9C] hover:bg-[#d6ebf3] disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        {aberta ? <Minus size={15} strokeWidth={3} /> : <Plus size={15} strokeWidth={3} />}
                      </button>
                    </td>
                    <td className="px-2 py-3 font-black text-[#257B9C]">{item?.posicao || indice + 1}º</td>
                    <td className="px-4 py-3 font-black text-gray-700">
                      {item?.estrutura || 'Não informada'}
                      {item?.nucleo && item.nucleo !== 'SEM META' && (
                        <span className="ml-2 text-[10px] font-black text-gray-400">{item.nucleo}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-600">{formatarNumeroBR(item?.pedidos || 0)}</td>
                    <td className="px-4 py-3 text-right font-black text-[#257B9C]">{formatarMoeda(item?.vendido_hoje || 0)}</td>
                    <CelulasMeta item={item} diaUtil={diaUtil} />
                  </tr>
                  {aberta && (
                    <tr className="bg-[#f5fafd]">
                      <td colSpan={8} className="px-4 pb-4 pt-1">
                        <div className="rounded-xl border border-[#d6ebf3] bg-white overflow-hidden">
                          <table className="w-full text-[13px]">
                            <thead className="bg-[#f1eef8] text-[10px] uppercase text-[#5c4b8a] font-black">
                              <tr>
                                <th className="px-4 py-2 text-left">Consultor</th>
                                <th className="px-4 py-2 text-right">Pedidos</th>
                                <th className="px-4 py-2 text-right">Vendido hoje</th>
                                <th className="px-4 py-2 text-right">Meta do dia</th>
                                <th className="px-4 py-2 text-right">% da meta</th>
                                <th className="px-4 py-2 text-right">Falta</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {consultores.map((consultor, posicao) => (
                                <tr key={`${chave}-${consultor?.id_consultor || posicao}`}>
                                  <td className="px-4 py-2 font-bold text-gray-700">
                                    {consultor?.consultor || 'Não identificado'}
                                    {consultor?.sem_meta_individual && (
                                      <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-black text-gray-500">sem meta individual</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-2 text-right font-bold text-gray-600">{formatarNumeroBR(consultor?.pedidos || 0)}</td>
                                  <td className="px-4 py-2 text-right font-black text-[#5c4b8a]">{formatarMoeda(consultor?.vendido_hoje || 0)}</td>
                                  <CelulasMeta item={consultor} diaUtil={diaUtil} />
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {!estruturas.length && (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-gray-400 font-semibold">Nenhuma estrutura com meta ou venda no dia.</td>
              </tr>
            )}
          </tbody>
          <tfoot className="bg-[#f5fafd]">
            <tr>
              <td colSpan={4} className="px-4 py-4 font-black text-gray-600">TOTAL DAS ESTRUTURAS</td>
              <td className="px-4 py-4 text-right font-black text-[#257B9C]">{formatarMoeda(totalVendido)}</td>
              {diaUtil ? (
                <>
                  <td className="px-4 py-4 text-right font-black text-gray-700">{formatarMoeda(metaTotal)}</td>
                  <td className={`px-4 py-4 text-right font-black ${corPercentual(percentualTotal)}`}>{formatarNumeroBR(percentualTotal, 1)}%</td>
                  <td className="px-4 py-4 text-right font-black text-[#7c1f31]">{metaTotal - totalVendido > 0 ? formatarMoeda(metaTotal - totalVendido) : 'Batida'}</td>
                </>
              ) : (
                <td colSpan={3} className="px-4 py-4 text-right font-black text-[#15803d]">Bônus de fim de semana</td>
              )}
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
