import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Database, FileSpreadsheet, Users, Target, Sparkles, Upload, Scissors, CalendarDays, RefreshCcw, Save, Pencil, Trash2, X, AlertTriangle } from 'lucide-react';

const formatarData = (data) => { if (!data) return '-'; const p = String(data).split('-'); return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : data; };
const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor || 0));

export default function TelaBase({ API_URL, onAtualizacao }) {
  const [arqPedidos, setArqPedidos] = useState(null); const [arqMetas, setArqMetas] = useState(null); const [arqConsultores, setArqConsultores] = useState(null); const [arqBaseAtiva, setArqBaseAtiva] = useState(null); const [arqSkus, setArqSkus] = useState(null); const [arqsMake, setArqsMake] = useState([]); const [arqsCabelo, setArqsCabelo] = useState([]);
  const [msgUpload, setMsgUpload] = useState(''); const [erroUpload, setErroUpload] = useState(''); const [carregandoUp, setCarregandoUp] = useState(false);
  const [ciclos, setCiclos] = useState([]); const [formCiclo, setFormCiclo] = useState({ ciclo: '', data_inicio: '', data_fim: '', meta_ciclo: '', status_ciclo: 'ativo' });
  const [cicloEditando, setCicloEditando] = useState(null); const [modalEditCiclo, setModalEditCiclo] = useState(false); const [cicloExcluir, setCicloExcluir] = useState(null); const [modalExcCiclo, setModalExcCiclo] = useState(false);
  const [msgCiclo, setMsgCiclo] = useState(''); const [erroCiclo, setErroCiclo] = useState(''); const [carregandoCiclos, setCarregandoCiclos] = useState(false);

  const carregarCiclos = async () => {
    setCarregandoCiclos(true); setErroCiclo('');
    try { const res = await axios.get(`${API_URL}/ciclos`); setCiclos(res.data.ciclos || []); } catch (e) { setErroCiclo('Erro ao carregar ciclos.'); } finally { setCarregandoCiclos(false); }
  };

  useEffect(() => { carregarCiclos(); }, []);

  const enviar = async (tipo) => {
    let endpoint = ''; let arq = null; let arqs = null;
    if (tipo === 'pedidos') { endpoint = '/upload/pedidos'; arq = arqPedidos; } if (tipo === 'metas') { endpoint = '/upload/metas'; arq = arqMetas; } if (tipo === 'consultores') { endpoint = '/upload/consultores'; arq = arqConsultores; } if (tipo === 'baseAtiva') { endpoint = '/upload/base-ativa'; arq = arqBaseAtiva; } if (tipo === 'skusIaf') { endpoint = '/upload/skus-iaf'; arq = arqSkus; } if (tipo === 'vendasMake') { endpoint = '/upload/vendas-make'; arqs = arqsMake; } if (tipo === 'vendasCabelo') { endpoint = '/upload/vendas-cabelo'; arqs = arqsCabelo; }
    if (!arq && (!arqs || arqs.length === 0)) { setErroUpload('Selecione um arquivo.'); return; }
    const form = new FormData(); if (arqs?.length > 0) arqs.forEach(a => form.append('arquivos', a)); else form.append('arquivo', arq);
    setCarregandoUp(true); setErroUpload(''); setMsgUpload('');
    try { const res = await axios.post(`${API_URL}${endpoint}`, form); setMsgUpload(res.data.mensagem || 'Enviado.'); if (onAtualizacao) onAtualizacao(); } catch (e) { setErroUpload(e.response?.data?.detail || 'Erro no envio.'); } finally { setCarregandoUp(false); }
  };

  const salvarCiclo = async (e) => {
    e.preventDefault(); setErroCiclo(''); setMsgCiclo('');
    try { await axios.post(`${API_URL}/ciclos`, formCiclo); setMsgCiclo('Cadastrado.'); setFormCiclo({ ciclo: '', data_inicio: '', data_fim: '', meta_ciclo: '', status_ciclo: 'ativo' }); carregarCiclos(); if (onAtualizacao) onAtualizacao(); } catch (e) { setErroCiclo('Erro ao salvar ciclo.'); }
  };

  const editarCiclo = async (e) => {
    e.preventDefault(); setErroCiclo(''); setMsgCiclo('');
    try { await axios.put(`${API_URL}/ciclos/${cicloEditando.id}`, cicloEditando); setModalEditCiclo(false); setMsgCiclo('Atualizado.'); carregarCiclos(); if (onAtualizacao) onAtualizacao(); } catch (e) { setErroCiclo('Erro ao editar.'); }
  };

  const excluirCiclo = async () => {
    setErroCiclo(''); setMsgCiclo('');
    try { await axios.delete(`${API_URL}/ciclos/${cicloExcluir.id}`); setModalExcCiclo(false); setMsgCiclo('Excluído.'); carregarCiclos(); if (onAtualizacao) onAtualizacao(); } catch (e) { setErroCiclo('Erro ao excluir.'); }
  };

  const UpBox = ({ titulo, desc, arq, arqs, setA, mult, ico: Ico, tipo }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6"><div className="flex items-center gap-3 mb-4"><div className="w-11 h-11 rounded-full bg-[#e6f6f7] text-[#048187] flex items-center justify-center"><Ico size={22} /></div><div><h3 className="font-bold text-gray-700">{titulo}</h3><p className="text-xs text-gray-400">{desc}</p></div></div><input type="file" accept=".xlsx,.xls,.csv" multiple={mult} onChange={(e) => { mult ? setA(Array.from(e.target.files)) : setA(e.target.files[0]) }} className="w-full border rounded-lg p-2 text-sm mb-4" />{(!mult && arq) && <p className="text-xs mb-3 truncate">{arq.name}</p>}{(mult && arqs?.length > 0) && <p className="text-xs mb-3">{arqs.length} selecionados</p>}<button onClick={() => enviar(tipo)} disabled={carregandoUp} className="w-full bg-[#048187] text-white font-bold py-2 rounded-lg hover:bg-[#036b70] disabled:opacity-50">Enviar</button></div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-8"><h1 className="text-xl sm:text-2xl font-bold text-gray-700 mb-2">Base de dados</h1><p className="text-sm text-gray-400">Faça o upload das planilhas.</p></div>
      {(msgUpload || erroUpload) && (<div className={`rounded-xl p-4 font-bold text-sm ${msgUpload ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{msgUpload || erroUpload}</div>)}
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 xl:gap-6">
        <UpBox titulo="Pedidos" desc="Base principal" arq={arqPedidos} setA={setArqPedidos} tipo="pedidos" ico={Database} />
        <UpBox titulo="Metas" desc="Estruturas e Valores" arq={arqMetas} setA={setArqMetas} tipo="metas" ico={FileSpreadsheet} />
        <UpBox titulo="Consultores" desc="Equipe de vendas" arq={arqConsultores} setA={setArqConsultores} tipo="consultores" ico={Users} />
        <UpBox titulo="Base Ativa" desc="Base de revendedores" arq={arqBaseAtiva} setA={setArqBaseAtiva} tipo="baseAtiva" ico={Target} />
        <UpBox titulo="SKUS IAF" desc="Abas MAKE e CABELO" arq={arqSkus} setA={setArqSkus} tipo="skusIaf" ico={Sparkles} />
        <UpBox titulo="Vendas MAKE" desc="Boticário, Eudora, QDB" arqs={arqsMake} setA={setArqsMake} mult tipo="vendasMake" ico={Upload} />
        <UpBox titulo="Vendas CABELO" desc="Planilhas Cabelo" arqs={arqsCabelo} setA={setArqsCabelo} mult tipo="vendasCabelo" ico={Scissors} />
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-8">
        <div className="flex items-center gap-3 mb-6"><div className="w-11 h-11 rounded-full bg-[#e6f6f7] text-[#048187] flex items-center justify-center"><CalendarDays size={22} /></div><div><h2 className="text-lg font-bold text-gray-700">Ciclos</h2></div></div>
        {(msgCiclo || erroCiclo) && (<div className={`rounded-xl p-4 font-bold text-sm mb-5 ${msgCiclo ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{msgCiclo || erroCiclo}</div>)}
        <form onSubmit={salvarCiclo} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4"><input type="text" placeholder="Ciclo" value={formCiclo.ciclo} onChange={e => setFormCiclo({...formCiclo, ciclo: e.target.value})} className="border rounded-lg px-4 py-2" required /><input type="date" value={formCiclo.data_inicio} onChange={e => setFormCiclo({...formCiclo, data_inicio: e.target.value})} className="border rounded-lg px-4 py-2" required /><input type="date" value={formCiclo.data_fim} onChange={e => setFormCiclo({...formCiclo, data_fim: e.target.value})} className="border rounded-lg px-4 py-2" required /><input type="number" placeholder="Meta" value={formCiclo.meta_ciclo} onChange={e => setFormCiclo({...formCiclo, meta_ciclo: e.target.value})} className="border rounded-lg px-4 py-2" required /><select value={formCiclo.status_ciclo} onChange={e => setFormCiclo({...formCiclo, status_ciclo: e.target.value})} className="border rounded-lg px-4 py-2"><option value="ativo">Ativo</option><option value="inativo">Inativo</option></select><button type="submit" className="bg-[#048187] text-white font-bold rounded-lg py-2">Salvar</button></form>
        <div className="mt-8">
          <table className="w-full text-sm">
            <thead className="border-b"><tr className="text-left text-gray-500"><th className="py-2">Ciclo</th><th>Início</th><th>Fim</th><th>Meta</th><th>Status</th><th className="text-right">Ação</th></tr></thead>
            <tbody>
              {ciclos.map(c => (
                <tr key={c.id} className="border-b"><td className="py-3 font-bold text-gray-700">{c.ciclo}</td><td>{formatarData(c.data_inicio)}</td><td>{formatarData(c.data_fim)}</td><td className="text-[#048187] font-bold">{formatarMoeda(c.meta_ciclo)}</td><td>{c.status_ciclo}</td><td className="text-right"><button onClick={() => {setCicloEditando({...c, data_inicio: String(c.data_inicio).slice(0,10), data_fim: String(c.data_fim).slice(0,10)}); setModalEditCiclo(true);}} className="text-[#048187] mr-3"><Pencil size={16}/></button><button onClick={() => {setCicloExcluir(c); setModalExcCiclo(true);}} className="text-red-500"><Trash2 size={16}/></button></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modais de Ciclo simplificados para caberem */}
      {modalEditCiclo && cicloEditando && (
        <div className="fixed inset-0 bg-black/40 z-[90] flex items-center justify-center p-4"><div className="bg-white p-6 rounded-xl w-full max-w-4xl"><h2 className="text-xl font-bold mb-4">Editar Ciclo</h2><form onSubmit={editarCiclo} className="grid grid-cols-2 gap-4"><input type="text" value={cicloEditando.ciclo} onChange={e=>setCicloEditando({...cicloEditando, ciclo: e.target.value})} className="border p-2 rounded" /><input type="date" value={cicloEditando.data_inicio} onChange={e=>setCicloEditando({...cicloEditando, data_inicio: e.target.value})} className="border p-2 rounded" /><input type="date" value={cicloEditando.data_fim} onChange={e=>setCicloEditando({...cicloEditando, data_fim: e.target.value})} className="border p-2 rounded" /><input type="number" value={cicloEditando.meta_ciclo} onChange={e=>setCicloEditando({...cicloEditando, meta_ciclo: e.target.value})} className="border p-2 rounded" /><div className="col-span-2 flex justify-end gap-3 mt-4"><button type="button" onClick={()=>setModalEditCiclo(false)} className="border px-4 py-2 rounded">Cancelar</button><button type="submit" className="bg-[#048187] text-white px-4 py-2 rounded">Salvar</button></div></form></div></div>
      )}
      {modalExcCiclo && cicloExcluir && (
        <div className="fixed inset-0 bg-black/40 z-[90] flex items-center justify-center p-4"><div className="bg-white p-6 rounded-xl w-full max-w-sm"><h2 className="text-xl font-bold mb-4">Excluir {cicloExcluir.ciclo}?</h2><div className="flex justify-end gap-3"><button onClick={()=>setModalExcCiclo(false)} className="border px-4 py-2 rounded">Cancelar</button><button onClick={excluirCiclo} className="bg-red-500 text-white px-4 py-2 rounded">Excluir</button></div></div></div>
      )}
    </div>
  );
}