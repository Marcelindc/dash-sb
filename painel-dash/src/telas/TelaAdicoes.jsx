import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Database,
  Eye,
  Search,
  X,
} from 'lucide-react';

const corFaixa = (percentual) => {
  const valor = Number(percentual || 0);
  if (valor >= 91) return '#048187';
  if (valor >= 70) return '#ff6f03';
  return '#7c1f31';
};

const formatarInteiro = (valor) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(Number(valor || 0));
const formatarPercentual = (valor) => `${Number(valor || 0).toFixed(1).replace('.', ',')}%`;
const formatarDataHora = (valor) => {
  // O backend manda microssegundos (.219426); o Safari só aceita até milissegundos.
  const data = valor ? new Date(String(valor).replace(/(\.\d{3})\d+/, '$1')) : null;
  if (!data || Number.isNaN(data.getTime())) return '';
  return data.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
};

const normalizar = (valor) => String(valor || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toUpperCase();

const inferirNucleo = (estrutura) => {
  const texto = normalizar(estrutura);
  if (/(^|\W)N1(\W|$)/.test(texto) || texto.includes('NUCLEO 1')) return 'N1';
  if (/(^|\W)N2(\W|$)/.test(texto) || texto.includes('NUCLEO 2')) return 'N2';
  if (/(^|\W)N3(\W|$)/.test(texto) || texto.includes('NUCLEO 3')) return 'N3';
  return 'OUTROS';
};

const CardNumero = ({ titulo, valor, destaque = '#048187', subtitulo = '' }) => (
  <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm min-w-0">
    <p className="text-[10px] font-black uppercase tracking-wide text-gray-400 truncate">{titulo}</p>
    <p className="mt-2 text-[24px] font-black leading-none truncate" style={{ color: destaque }}>{formatarInteiro(valor)}</p>
    {subtitulo ? <p className="mt-2 text-[10px] font-bold text-gray-400 truncate">{subtitulo}</p> : null}
  </div>
);

export default function TelaAdicoes({ apiUrl, ciclo, nucleos = [], estruturas = [], refreshToken = 0 }) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [detalhe, setDetalhe] = useState(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);

  const carregar = async () => {
    setCarregando(true);
    setErro('');
    try {
      const params = {};
      if (String(ciclo || '').trim()) params.ciclo = String(ciclo).trim();
      const resposta = await axios.get(`${apiUrl}/adicoes/resumo`, { params });
      setDados(resposta.data || {});
    } catch (e) {
      setErro(e?.response?.data?.detail || e?.message || 'Não foi possível carregar Adições.');
    } finally {
      setCarregando(false);
    }
  };

  const abrirDetalhe = async (item) => {
    setCarregandoDetalhe(true);
    setErro('');
    try {
      const params = { ciclo: dados?.ciclo || ciclo || '' };
      if (item?.meta_id) params.meta_id = Number(item.meta_id);
      if (item?.cod_estrutura) params.cod_estrutura = String(item.cod_estrutura);
      else params.estrutura = String(item?.estrutura || '');
      const resposta = await axios.get(`${apiUrl}/adicoes/detalhe`, { params });
      setDetalhe(resposta.data || null);
    } catch (e) {
      setErro(e?.response?.data?.detail || e?.message || 'Não foi possível carregar o detalhamento da estrutura.');
    } finally {
      setCarregandoDetalhe(false);
    }
  };

  useEffect(() => {
    void carregar();
  }, [ciclo, refreshToken]);

  const estruturasFiltradas = useMemo(() => {
    const termo = normalizar(busca);
    const normalizarNucleoFiltro = (valor) => {
      const texto = normalizar(valor);
      const match = texto.match(/(\d+)/);
      return match ? `N${match[1]}` : texto;
    };
    const filtrosNucleo = (nucleos || []).map(normalizarNucleoFiltro).filter(Boolean);
    const filtrosEstrutura = (estruturas || []).map(normalizar).filter(Boolean);

    const estruturaCorresponde = (item) => {
      if (!filtrosEstrutura.length) return true;
      const candidatos = [
        item?.estrutura,
        item?.cod_estrutura,
        ...(Array.isArray(item?.estruturas_vinculadas) ? item.estruturas_vinculadas : []),
        ...(Array.isArray(item?.codigos_vinculados) ? item.codigos_vinculados : []),
      ].map(normalizar).filter(Boolean);
      return filtrosEstrutura.some((filtro) => candidatos.some((candidato) => (
        candidato === filtro || candidato.includes(filtro) || filtro.includes(candidato)
      )));
    };

    return (dados?.estruturas || []).filter((item) => {
      const estrutura = String(item.estrutura || '');
      const bateBusca = !termo || normalizar(estrutura).includes(termo) || normalizar(item.cod_estrutura).includes(termo);
      const nucleoApi = normalizarNucleoFiltro(item?.nucleo);
      const nucleo = ['N1', 'N2', 'N3'].includes(nucleoApi) ? nucleoApi : inferirNucleo(estrutura);
      const bateNucleo = !filtrosNucleo.length || filtrosNucleo.includes(nucleo);
      return bateBusca && bateNucleo && estruturaCorresponde(item);
    });
  }, [dados, busca, nucleos, estruturas]);

  const totais = useMemo(() => {
    const base = estruturasFiltradas.reduce((acc, item) => {
      acc.bt += Number(item?.bt || 0);
      acc.ba += Number(item?.ba || 0);
      acc.inicios += Number(item?.inicios || 0);
      acc.reinicios += Number(item?.reinicios || 0);
      acc.i6 += Number(item?.i6 || 0);
      acc.adicoes += Number(item?.adicoes || 0);
      acc.meta_adicoes += Number(item?.meta_adicoes || 0);
      return acc;
    }, { bt: 0, ba: 0, inicios: 0, reinicios: 0, i6: 0, adicoes: 0, meta_adicoes: 0 });
    base.percentual_meta = base.meta_adicoes > 0 ? (base.adicoes / base.meta_adicoes) * 100 : 0;
    base.falta_meta = base.meta_adicoes > 0 ? Math.max(base.meta_adicoes - base.adicoes, 0) : 0;
    return base;
  }, [estruturasFiltradas]);
  const corAdicoes = Number(totais.adicoes || 0) < 0 ? '#7c1f31' : '#048187';
  const corMeta = corFaixa(totais.percentual_meta || 0);
  const detalheEstrutura = detalhe?.estrutura || {};
  const revendedoresDetalhe = Array.isArray(detalhe?.revendedores) ? detalhe.revendedores : [];

  return (
    <div className="space-y-4">
      {erro ? <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{erro}</div> : null}
      {mensagem ? <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{mensagem}</div> : null}

      <section className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        <CardNumero titulo="Base Total (BT)" valor={totais.bt} />
        <CardNumero titulo="Base Ativa (BA)" valor={totais.ba} />
        <CardNumero titulo="Inícios (I)" valor={totais.inicios} />
        <CardNumero titulo="Reinícios (R)" valor={totais.reinicios} />
        <CardNumero titulo="I6" valor={totais.i6} destaque="#7c1f31" subtitulo="Subtraído das Adições" />
        <CardNumero titulo="Adições" valor={totais.adicoes} destaque={corAdicoes} />
        <CardNumero titulo="Meta Adições" valor={totais.meta_adicoes} destaque="#465a5d" />
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm min-w-0">
          <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">% da Meta</p>
          <p className="mt-2 text-[24px] font-black leading-none" style={{ color: corMeta }}>{formatarPercentual(totais.percentual_meta)}</p>
          <div className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(Number(totais.percentual_meta || 0), 100))}%`, backgroundColor: corMeta }} /></div>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-gray-700">Adições por estrutura</h3>
            <p className="mt-1 text-xs font-semibold text-gray-400">Base inicial do ciclo + Consulta Pedidos • Com pedido válido: A0–I6 vira A0, C7+ vira Reinício e quem não estava na base vira Início.</p>
            {formatarDataHora(dados?.ultima_atualizacao) ? <p className="mt-1 text-[11px] font-black text-[#048187]">Atualizado em {formatarDataHora(dados.ultima_atualizacao)}</p> : null}
          </div>
          <div className="relative w-full lg:w-[320px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar estrutura ou código" className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2.5 text-sm outline-none focus:border-[#048187]" />
          </div>
        </div>

        {carregando ? (
          <div className="py-16 text-center text-[#048187] font-black">Carregando Adições...</div>
        ) : estruturasFiltradas.length === 0 ? (
          <div className="py-16 text-center">
            <Database size={34} className="mx-auto text-gray-300" />
            <p className="mt-3 text-sm font-black text-gray-500">Nenhuma estrutura encontrada.</p>
            <p className="mt-1 text-xs font-semibold text-gray-400">Confira se a Base de Revendedores já foi atualizada.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1220px] text-[12px]">
              <thead className="bg-[#f7fafb] text-[10px] uppercase text-gray-400">
                <tr>
                  <th className="px-4 py-3 text-left">Estrutura</th>
                  <th className="px-3 py-3 text-center">BT</th>
                  <th className="px-3 py-3 text-center">BA</th>
                  <th className="px-3 py-3 text-center">I</th>
                  <th className="px-3 py-3 text-center">R</th>
                  <th className="px-3 py-3 text-center">I6</th>
                  <th className="px-3 py-3 text-center">Adições</th>
                  <th className="px-3 py-3 text-center">Meta</th>
                  <th className="px-3 py-3 text-center">% Meta</th>
                  <th className="px-3 py-3 text-center">Falta</th>
                  <th className="px-3 py-3 text-center">Detalhe</th>
                </tr>
              </thead>
              <tbody>
                {estruturasFiltradas.map((item) => {
                  const percentual = Number(item.percentual_meta || 0);
                  const falta = Number(item.falta_meta || 0);
                  const cor = corFaixa(percentual);
                  const cod = String(item.cod_estrutura || '');
                  return (
                    <tr key={`${cod}-${item.estrutura}`} className="border-t border-gray-100 hover:bg-[#fbfefe]">
                      <td className="px-4 py-3">
                        <p className="font-black text-gray-700">{item.estrutura}</p>
                        <p className="text-[10px] font-bold text-gray-400">Cód. {cod} • {(['N1','N2','N3'].includes(normalizar(item?.nucleo).replace('NUCLEO ', 'N')) ? normalizar(item?.nucleo).replace('NUCLEO ', 'N') : inferirNucleo(item.estrutura))}</p>
                      </td>
                      <td className="px-3 py-3 text-center font-black text-gray-700">{formatarInteiro(item.bt)}</td>
                      <td className="px-3 py-3 text-center font-black text-[#048187]">{formatarInteiro(item.ba)}</td>
                      <td className="px-3 py-3 text-center font-bold text-gray-700">{formatarInteiro(item.inicios)}</td>
                      <td className="px-3 py-3 text-center font-bold text-gray-700">{formatarInteiro(item.reinicios)}</td>
                      <td className="px-3 py-3 text-center font-bold text-[#7c1f31]">{formatarInteiro(item.i6)}</td>
                      <td className="px-3 py-3 text-center"><span className="inline-flex min-w-[48px] justify-center rounded-full px-2.5 py-1 font-black" style={{ color: Number(item.adicoes || 0) < 0 ? '#7c1f31' : '#048187', backgroundColor: Number(item.adicoes || 0) < 0 ? '#fff2f5' : '#e9f7f7' }}>{formatarInteiro(item.adicoes)}</span></td>
                      <td className="px-3 py-3 text-center font-black text-gray-700">{formatarInteiro(item.meta_adicoes)}</td>
                      <td className="px-3 py-3 text-center font-black" style={{ color: cor }}>{formatarPercentual(percentual)}</td>
                      <td className="px-3 py-3 text-center font-black text-gray-600">{formatarInteiro(falta)}</td>
                      <td className="px-3 py-3 text-center"><button type="button" onClick={() => abrirDetalhe(item)} className="w-8 h-8 rounded-lg bg-[#e6f6f7] text-[#048187] inline-flex items-center justify-center hover:bg-[#d7f0f1]" title="Ver revendedores"><Eye size={14} /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {(detalhe || carregandoDetalhe) && (
        <div className="fixed inset-0 z-[100] bg-black/35 flex items-center justify-center p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) { setDetalhe(null); setCarregandoDetalhe(false); } }}>
          <div className="w-full max-w-5xl rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-[#048187]">Detalhamento de Adições</p>
                <h3 className="mt-1 text-xl font-black text-gray-700">{detalheEstrutura.estrutura || 'Carregando...'}</h3>
                <p className="text-xs font-bold text-gray-400 mt-1">Cód. {detalheEstrutura.cod_estrutura || '-'}</p>
              </div>
              <button type="button" onClick={() => setDetalhe(null)} className="w-9 h-9 rounded-xl bg-[#fff3f5] text-[#7c1f31] flex items-center justify-center"><X size={18} /></button>
            </div>
            {carregandoDetalhe ? (
              <div className="p-10 text-center text-[#048187] font-black">Carregando detalhamento...</div>
            ) : (
              <div className="p-5 space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[['BT', detalheEstrutura.bt], ['BA', detalheEstrutura.ba], ['I', detalheEstrutura.inicios], ['R', detalheEstrutura.reinicios], ['I6', detalheEstrutura.i6]].map(([rotulo, valor]) => (
                    <div key={rotulo} className="rounded-2xl bg-[#f7fafb] border border-gray-100 p-3">
                      <p className="text-[9px] font-black uppercase text-gray-400">{rotulo}</p>
                      <p className="mt-1 text-xl font-black text-gray-700">{formatarInteiro(valor)}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="rounded-2xl border border-[#dcecee] bg-[#f7fbfb] p-4">
                    <p className="text-[10px] font-black uppercase tracking-wide text-[#048187]">Adições</p>
                    <p className="mt-2 text-2xl font-black" style={{ color: Number(detalheEstrutura.adicoes || 0) < 0 ? '#7c1f31' : '#048187' }}>{formatarInteiro(detalheEstrutura.adicoes)}</p>
                    <p className="mt-2 text-xs font-semibold text-gray-400">(I + R) - I6</p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">Meta</p>
                    <p className="mt-2 text-2xl font-black text-gray-700">{formatarInteiro(detalheEstrutura.meta_adicoes)}</p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">% Meta</p>
                    <p className="mt-2 text-2xl font-black" style={{ color: corFaixa(detalheEstrutura.percentual_meta) }}>{formatarPercentual(detalheEstrutura.percentual_meta)}</p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">Falta</p>
                    <p className="mt-2 text-2xl font-black text-gray-700">{formatarInteiro(detalheEstrutura.falta_meta)}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#f0d7dc] bg-[#fffafb] p-4">
                  <p className="text-[10px] font-black uppercase tracking-wide text-[#7c1f31]">Cálculo</p>
                  <p className="mt-2 text-lg font-black text-gray-700">({formatarInteiro(detalheEstrutura.inicios)} + {formatarInteiro(detalheEstrutura.reinicios)}) - {formatarInteiro(detalheEstrutura.i6)} = <span className={Number(detalheEstrutura.adicoes || 0) < 0 ? 'text-[#7c1f31]' : 'text-[#048187]'}>{formatarInteiro(detalheEstrutura.adicoes)}</span></p>
                  <p className="mt-1 text-xs font-semibold text-gray-400">Adições = (Inícios + Reinícios) - I6</p>
                </div>

                <div className="rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 bg-[#f9fbfb]">
                    <h4 className="text-sm font-black text-gray-700">Revendedores da estrutura</h4>
                    <p className="mt-1 text-xs font-semibold text-gray-400">A atividade base vem da planilha inicial. A atividade atual considera os pedidos válidos do ciclo; "Fora da base" é quem comprou sem estar na planilha inicial.</p>
                  </div>
                  {revendedoresDetalhe.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm font-bold text-gray-400">Nenhum revendedor encontrado para esta estrutura.</div>
                  ) : (
                    <div className="max-h-[420px] overflow-auto">
                      <table className="w-full min-w-[760px] text-[12px]">
                        <thead className="sticky top-0 bg-[#f7fafb] text-[10px] uppercase text-gray-400">
                          <tr>
                            <th className="px-4 py-3 text-left">Cód. Revendedor</th>
                            <th className="px-4 py-3 text-left">Nome</th>
                            <th className="px-4 py-3 text-left">Atividade Base</th>
                            <th className="px-4 py-3 text-left">Atividade Atual</th>
                          </tr>
                        </thead>
                        <tbody>
                          {revendedoresDetalhe.map((rev, idx) => (
                            <tr key={`${rev.cod_revendedor || 'rev'}-${idx}`} className="border-t border-gray-100 hover:bg-[#fbfefe]">
                              <td className="px-4 py-3 font-black text-gray-700">{rev.cod_revendedor || '-'}</td>
                              <td className="px-4 py-3 font-semibold text-gray-700">{rev.nome_revendedor || '-'}</td>
                              <td className="px-4 py-3 font-semibold text-gray-500">{rev.origem === 'pedido' ? 'Fora da base' : (rev.atividade_base || rev.atividade || '-')}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-1 font-black ${rev.ativou_no_ciclo && rev.atividade !== rev.atividade_base ? 'bg-[#e6f6f7] text-[#048187]' : 'bg-gray-100 text-gray-600'}`}>
                                  {rev.atividade || '-'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
