import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Calculator,
  CheckCircle2,
  Database,
  Eye,
  RefreshCcw,
  Save,
  Search,
  Target,
  UsersRound,
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

export default function TelaAdicoes({ apiUrl, ciclo, perfil = 'visualizador', nucleos = [], refreshToken = 0 }) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [metasEdicao, setMetasEdicao] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [detalhe, setDetalhe] = useState(null);
  const podeEditar = String(perfil || '').toLowerCase() === 'admin';

  const carregar = async () => {
    setCarregando(true);
    setErro('');
    try {
      const params = {};
      if (String(ciclo || '').trim()) params.ciclo = String(ciclo).trim();
      const resposta = await axios.get(`${apiUrl}/adicoes/resumo`, { params });
      const payload = resposta.data || {};
      setDados(payload);
      const novasMetas = {};
      (payload.estruturas || []).forEach((item) => {
        novasMetas[String(item.cod_estrutura || '')] = String(Number(item.meta_adicoes || 0));
      });
      setMetasEdicao(novasMetas);
    } catch (e) {
      setErro(e?.response?.data?.detail || e?.message || 'Não foi possível carregar Adições.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    void carregar();
  }, [ciclo, refreshToken]);

  const estruturasFiltradas = useMemo(() => {
    const termo = normalizar(busca);
    const filtrosNucleo = (nucleos || []).map((n) => String(n || '').toUpperCase()).filter(Boolean);
    return (dados?.estruturas || []).filter((item) => {
      const estrutura = String(item.estrutura || '');
      const bateBusca = !termo || normalizar(estrutura).includes(termo) || normalizar(item.cod_estrutura).includes(termo);
      const nucleo = inferirNucleo(estrutura);
      const bateNucleo = !filtrosNucleo.length || filtrosNucleo.includes(nucleo);
      return bateBusca && bateNucleo;
    });
  }, [dados, busca, nucleos]);

  const salvarMetas = async () => {
    if (!podeEditar || !dados?.ciclo) return;
    setSalvando(true);
    setErro('');
    setMensagem('');
    try {
      const metas = (dados.estruturas || []).map((item) => ({
        cod_estrutura: String(item.cod_estrutura || ''),
        estrutura: String(item.estrutura || ''),
        meta_adicoes: Math.max(parseInt(metasEdicao[String(item.cod_estrutura || '')] || '0', 10) || 0, 0),
      }));
      await axios.put(`${apiUrl}/adicoes/metas`, { ciclo: dados.ciclo, metas });
      setMensagem('Metas de Adições salvas com sucesso.');
      await carregar();
    } catch (e) {
      setErro(e?.response?.data?.detail || e?.message || 'Não foi possível salvar as metas.');
    } finally {
      setSalvando(false);
    }
  };

  const recalcular = async () => {
    if (!podeEditar) return;
    setCarregando(true);
    setErro('');
    setMensagem('');
    try {
      await axios.post(`${apiUrl}/adicoes/recalcular`, null, { params: { ciclo: dados?.ciclo || ciclo || '' } });
      setMensagem('Adições recalculadas com a Base de Revendedores mais recente.');
      await carregar();
    } catch (e) {
      setErro(e?.response?.data?.detail || e?.message || 'Não foi possível recalcular Adições.');
    } finally {
      setCarregando(false);
    }
  };

  const totais = dados?.totais || {};
  const corAdicoes = Number(totais.adicoes || 0) < 0 ? '#7c1f31' : '#048187';
  const corMeta = corFaixa(totais.percentual_meta || 0);

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#e6f6f7] text-[#048187] flex items-center justify-center"><UsersRound size={22} /></div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-700">Adições</h2>
                <p className="text-xs sm:text-sm font-semibold text-gray-400 mt-0.5">Acompanhamento de Base Total, Base Ativa, Inícios e Reinícios por estrutura.</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#f2f7f8] px-3 py-2 text-[11px] font-black text-[#567174]">Ciclo {dados?.ciclo || ciclo || '-'}</span>
            {podeEditar && (
              <button type="button" onClick={recalcular} className="rounded-xl border border-[#cfe5e7] bg-white px-3 py-2 text-[11px] font-black text-[#048187] hover:bg-[#eef8f8] flex items-center gap-2">
                <RefreshCcw size={14} /> Recalcular
              </button>
            )}
            {podeEditar && (
              <button type="button" onClick={salvarMetas} disabled={salvando} className="rounded-xl bg-[#048187] px-4 py-2 text-[11px] font-black text-white hover:bg-[#036b70] disabled:opacity-50 flex items-center gap-2">
                <Save size={14} /> {salvando ? 'Salvando...' : 'Salvar metas'}
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-[#dcecee] bg-[#f7fbfb] p-4">
            <div className="flex items-center gap-2 text-[#048187]"><Calculator size={16} /><span className="text-[10px] font-black uppercase tracking-wide">Base Ativa</span></div>
            <p className="mt-2 text-sm font-black text-gray-700">BA = A0 + A1 + A2 + A3 + I4 + I5 + I6</p>
          </div>
          <div className="rounded-2xl border border-[#dcecee] bg-[#f7fbfb] p-4">
            <div className="flex items-center gap-2 text-[#048187]"><Calculator size={16} /><span className="text-[10px] font-black uppercase tracking-wide">Base Total</span></div>
            <p className="mt-2 text-sm font-black text-gray-700">BT = BA + I + R</p>
          </div>
          <div className="rounded-2xl border border-[#f0d7dc] bg-[#fffafb] p-4">
            <div className="flex items-center gap-2 text-[#7c1f31]"><Target size={16} /><span className="text-[10px] font-black uppercase tracking-wide">Adições</span></div>
            <p className="mt-2 text-sm font-black text-gray-700">Adições = (I + R) - I6</p>
          </div>
        </div>
      </section>

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
            <p className="mt-1 text-xs font-semibold text-gray-400">Fonte: {dados?.fonte || 'Base de Revendedores'} • Atualização automática junto da Consulta Pedidos.</p>
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
                  const cod = String(item.cod_estrutura || '');
                  const meta = Math.max(parseInt(metasEdicao[cod] || '0', 10) || 0, 0);
                  const percentual = meta > 0 ? (Number(item.adicoes || 0) / meta) * 100 : 0;
                  const falta = meta > 0 ? Math.max(meta - Number(item.adicoes || 0), 0) : 0;
                  const cor = corFaixa(percentual);
                  return (
                    <tr key={`${cod}-${item.estrutura}`} className="border-t border-gray-100 hover:bg-[#fbfefe]">
                      <td className="px-4 py-3">
                        <p className="font-black text-gray-700">{item.estrutura}</p>
                        <p className="text-[10px] font-bold text-gray-400">Cód. {cod} • {inferirNucleo(item.estrutura)}</p>
                      </td>
                      <td className="px-3 py-3 text-center font-black text-gray-700">{formatarInteiro(item.bt)}</td>
                      <td className="px-3 py-3 text-center font-black text-[#048187]">{formatarInteiro(item.ba)}</td>
                      <td className="px-3 py-3 text-center font-bold text-gray-700">{formatarInteiro(item.inicios)}</td>
                      <td className="px-3 py-3 text-center font-bold text-gray-700">{formatarInteiro(item.reinicios)}</td>
                      <td className="px-3 py-3 text-center font-bold text-[#7c1f31]">{formatarInteiro(item.i6)}</td>
                      <td className="px-3 py-3 text-center"><span className="inline-flex min-w-[48px] justify-center rounded-full px-2.5 py-1 font-black" style={{ color: Number(item.adicoes || 0) < 0 ? '#7c1f31' : '#048187', backgroundColor: Number(item.adicoes || 0) < 0 ? '#fff2f5' : '#e9f7f7' }}>{formatarInteiro(item.adicoes)}</span></td>
                      <td className="px-3 py-3 text-center">
                        {podeEditar ? (
                          <input type="number" min="0" step="1" value={metasEdicao[cod] ?? '0'} onChange={(e) => setMetasEdicao((a) => ({ ...a, [cod]: e.target.value }))} className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-center font-black text-gray-700 outline-none focus:border-[#048187]" />
                        ) : <span className="font-black text-gray-700">{formatarInteiro(item.meta_adicoes)}</span>}
                      </td>
                      <td className="px-3 py-3 text-center font-black" style={{ color: cor }}>{formatarPercentual(percentual)}</td>
                      <td className="px-3 py-3 text-center font-black text-gray-600">{formatarInteiro(falta)}</td>
                      <td className="px-3 py-3 text-center"><button type="button" onClick={() => setDetalhe({ ...item, meta_adicoes: meta, percentual_meta: percentual, falta_meta: falta })} className="w-8 h-8 rounded-lg bg-[#e6f6f7] text-[#048187] inline-flex items-center justify-center hover:bg-[#d7f0f1]" title="Ver cálculo"><Eye size={14} /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {detalhe && (
        <div className="fixed inset-0 z-[100] bg-black/35 flex items-center justify-center p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setDetalhe(null); }}>
          <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-4">
              <div><p className="text-[10px] font-black uppercase tracking-wider text-[#048187]">Detalhamento de Adições</p><h3 className="mt-1 text-xl font-black text-gray-700">{detalhe.estrutura}</h3><p className="text-xs font-bold text-gray-400 mt-1">Cód. {detalhe.cod_estrutura}</p></div>
              <button type="button" onClick={() => setDetalhe(null)} className="w-9 h-9 rounded-xl bg-[#fff3f5] text-[#7c1f31] flex items-center justify-center"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {[['BT', detalhe.bt], ['BA', detalhe.ba], ['I', detalhe.inicios], ['R', detalhe.reinicios], ['I6', detalhe.i6], ['Adições', detalhe.adicoes]].map(([rotulo, valor]) => <div key={rotulo} className="rounded-2xl bg-[#f7fafb] border border-gray-100 p-3"><p className="text-[9px] font-black uppercase text-gray-400">{rotulo}</p><p className="mt-1 text-xl font-black text-gray-700">{formatarInteiro(valor)}</p></div>)}
              </div>
              <div className="rounded-2xl border border-[#f0d7dc] bg-[#fffafb] p-4"><p className="text-[10px] font-black uppercase tracking-wide text-[#7c1f31]">Cálculo</p><p className="mt-2 text-lg font-black text-gray-700">({formatarInteiro(detalhe.inicios)} + {formatarInteiro(detalhe.reinicios)}) - {formatarInteiro(detalhe.i6)} = <span className={Number(detalhe.adicoes || 0) < 0 ? 'text-[#7c1f31]' : 'text-[#048187]'}>{formatarInteiro(detalhe.adicoes)}</span></p><p className="mt-1 text-xs font-semibold text-gray-400">Adições = (Inícios + Reinícios) - I6</p></div>
              <div className="grid grid-cols-3 gap-2"><div className="rounded-2xl border border-gray-100 p-3"><p className="text-[9px] font-black uppercase text-gray-400">Meta</p><p className="mt-1 text-lg font-black text-gray-700">{formatarInteiro(detalhe.meta_adicoes)}</p></div><div className="rounded-2xl border border-gray-100 p-3"><p className="text-[9px] font-black uppercase text-gray-400">% Meta</p><p className="mt-1 text-lg font-black" style={{ color: corFaixa(detalhe.percentual_meta) }}>{formatarPercentual(detalhe.percentual_meta)}</p></div><div className="rounded-2xl border border-gray-100 p-3"><p className="text-[9px] font-black uppercase text-gray-400">Falta</p><p className="mt-1 text-lg font-black text-gray-700">{formatarInteiro(detalhe.falta_meta)}</p></div></div>
              {Number(detalhe.meta_adicoes || 0) > 0 && Number(detalhe.falta_meta || 0) === 0 ? <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-emerald-700 font-black text-sm flex items-center gap-2"><CheckCircle2 size={17} /> Meta de Adições atingida.</div> : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
