import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, RefreshCcw, Pencil, Trash2, X, Save, AlertTriangle } from 'lucide-react';

const consultorVazio = { id_colaborador: '', nome: '', estrutura: '', canal: 'ESPAÇO DO REVENDEDOR', status_consultor: 'ativo', peso_meta: 0 };

export default function TelaConsultores({ API_URL, onAtualizacao }) {
  const [listaConsultores, setListaConsultores] = useState([]);
  const [carregandoLista, setCarregandoLista] = useState(false);
  const [buscaConsultor, setBuscaConsultor] = useState('');
  const [novoConsultor, setNovoConsultor] = useState(consultorVazio);
  const [modalCriarAberto, setModalCriarAberto] = useState(false);
  const [consultorEditando, setConsultorEditando] = useState(null);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [consultorParaExcluir, setConsultorParaExcluir] = useState(null);
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  const carregarLista = async () => {
    setCarregandoLista(true);
    setErro('');
    try {
      const resposta = await axios.get(`${API_URL}/consultores/listar`);
      setListaConsultores(resposta.data.consultores || []);
    } catch (e) {
      setErro(e.response?.data?.detail || 'Erro ao carregar consultores.');
    } finally {
      setCarregandoLista(false);
    }
  };

  useEffect(() => {
    carregarLista();
  }, []);

  const salvarNovo = async (e) => {
    e.preventDefault();
    setErro(''); setMensagem('');
    try {
      await axios.post(`${API_URL}/consultores`, novoConsultor);
      setModalCriarAberto(false);
      setNovoConsultor(consultorVazio);
      setMensagem('Consultor criado com sucesso.');
      if (onAtualizacao) onAtualizacao();
      await carregarLista();
    } catch (e) { setErro(e.response?.data?.detail || 'Erro ao criar consultor.'); }
  };

  const salvarEdicao = async (e) => {
    e.preventDefault();
    setErro(''); setMensagem('');
    try {
      await axios.put(`${API_URL}/consultores/${consultorEditando.id}`, consultorEditando);
      setModalEditarAberto(false);
      setMensagem('Consultor atualizado com sucesso.');
      if (onAtualizacao) onAtualizacao();
      await carregarLista();
    } catch (e) { setErro(e.response?.data?.detail || 'Erro ao atualizar consultor.'); }
  };

  const confirmarExclusao = async () => {
    if (!consultorParaExcluir) return;
    setErro(''); setMensagem('');
    try {
      await axios.delete(`${API_URL}/consultores/${consultorParaExcluir.id}`);
      setModalExcluirAberto(false);
      setConsultorParaExcluir(null);
      setMensagem('Consultor excluído com sucesso.');
      if (onAtualizacao) onAtualizacao();
      await carregarLista();
    } catch (e) { setErro(e.response?.data?.detail || 'Erro ao excluir consultor.'); }
  };

  const consultoresFiltrados = listaConsultores.filter(c => 
    c.nome.toLowerCase().includes(buscaConsultor.toLowerCase()) || String(c.id_colaborador).includes(buscaConsultor)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-700">Gestão de Consultores</h1>
          <div className="flex gap-2">
            <button onClick={() => setModalCriarAberto(true)} className="bg-[#048187] text-white font-bold px-4 py-2 rounded-lg hover:bg-[#036b70] transition-colors flex items-center gap-2 text-sm">
              <Plus size={16} /> Novo Consultor
            </button>
            <button onClick={carregarLista} className="bg-[#e6f6f7] text-[#048187] font-bold px-4 py-2 rounded-lg hover:bg-[#d0f0f1] transition-colors flex items-center gap-2 text-sm">
              <RefreshCcw size={16} /> Atualizar Lista
            </button>
          </div>
        </div>
        <p className="text-sm sm:text-base text-gray-400">Visualize, crie e edite os dados dos consultores de forma individual.</p>
      </div>

      {(mensagem || erro) && (
        <div className={`rounded-xl p-4 font-bold text-sm ${mensagem ? 'bg-green-50 border border-green-100 text-green-700' : 'bg-red-50 border border-red-100 text-red-600'}`}>
          {mensagem || erro}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-96">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar por nome ou ID..." value={buscaConsultor} onChange={(e) => setBuscaConsultor(e.target.value)} className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#048187]" />
          </div>
          <div className="text-sm font-bold text-[#048187] bg-[#e6f6f7] px-3 py-1.5 rounded-full">{consultoresFiltrados.length} Registros</div>
        </div>

        {carregandoLista ? (
          <div className="py-10 text-center text-[#048187] font-bold">Carregando consultores...</div>
        ) : (
          <div className="overflow-x-auto">
            <div className="max-h-[600px] overflow-y-auto pr-2">
              <table className="w-full text-sm min-w-[900px]">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="text-left text-gray-500 border-b border-gray-200">
                    <th className="py-3 px-2">ID</th><th className="py-3 px-2">Nome</th><th className="py-3 px-2">Estrutura</th><th className="py-3 px-2">Canal</th><th className="py-3 px-2">Status</th><th className="py-3 px-2 text-right">Peso Meta</th><th className="py-3 px-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {consultoresFiltrados.map((c) => (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-2 font-medium text-gray-500">{c.id_colaborador}</td><td className="py-3 px-2 font-bold text-gray-700">{c.nome}</td><td className="py-3 px-2 text-gray-600">{c.estrutura}</td><td className="py-3 px-2 text-gray-600">{c.canal}</td>
                      <td className="py-3 px-2"><span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${c.status_consultor === 'ativo' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{c.status_consultor}</span></td>
                      <td className="py-3 px-2 text-right font-bold text-[#048187]">{Number(c.peso_meta || 0).toFixed(2)}%</td>
                      <td className="py-3 px-2 text-right whitespace-nowrap">
                        <button onClick={() => { setConsultorEditando({ ...c }); setModalEditarAberto(true); }} className="text-[#048187] hover:text-[#036b70] mr-3"><Pencil size={17} /></button>
                        <button onClick={() => { setConsultorParaExcluir(c); setModalExcluirAberto(true); }} className="text-red-500 hover:text-red-600"><Trash2 size={17} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {modalCriarAberto && (
        <div className="fixed inset-0 bg-black/40 z-[90] flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between p-6 border-b border-gray-100">
              <div><h2 className="text-xl font-bold text-gray-700">Novo consultor</h2></div>
              <button onClick={() => setModalCriarAberto(false)} className="text-gray-400 hover:bg-gray-50 rounded-full p-2"><X size={20} /></button>
            </div>
            <form onSubmit={salvarNovo} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">ID</label><input type="text" value={novoConsultor.id_colaborador} onChange={(e) => setNovoConsultor({...novoConsultor, id_colaborador: e.target.value})} className="w-full border rounded-lg px-4 py-2" required /></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Nome</label><input type="text" value={novoConsultor.nome} onChange={(e) => setNovoConsultor({...novoConsultor, nome: e.target.value})} className="w-full border rounded-lg px-4 py-2" required /></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Estrutura</label><input type="text" value={novoConsultor.estrutura} onChange={(e) => setNovoConsultor({...novoConsultor, estrutura: e.target.value})} className="w-full border rounded-lg px-4 py-2" required /></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Canal</label><input type="text" value={novoConsultor.canal} onChange={(e) => setNovoConsultor({...novoConsultor, canal: e.target.value})} className="w-full border rounded-lg px-4 py-2" /></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Status</label><select value={novoConsultor.status_consultor} onChange={(e) => setNovoConsultor({...novoConsultor, status_consultor: e.target.value})} className="w-full border rounded-lg px-4 py-2"><option value="ativo">Ativo</option><option value="inativo">Inativo</option><option value="ferias">Férias</option></select></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Peso Meta (%)</label><input type="number" step="0.01" value={novoConsultor.peso_meta} onChange={(e) => setNovoConsultor({...novoConsultor, peso_meta: e.target.value})} className="w-full border rounded-lg px-4 py-2" /></div>
              </div>
              <div className="flex justify-end gap-3 pt-4"><button type="submit" className="bg-[#048187] text-white px-5 py-2 rounded-lg font-bold">Criar Consultor</button></div>
            </form>
          </div>
        </div>
      )}

      {modalEditarAberto && consultorEditando && (
        <div className="fixed inset-0 bg-black/40 z-[90] flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between p-6 border-b border-gray-100">
              <div><h2 className="text-xl font-bold text-gray-700">Editar consultor</h2></div>
              <button onClick={() => setModalEditarAberto(false)} className="text-gray-400 hover:bg-gray-50 rounded-full p-2"><X size={20} /></button>
            </div>
            <form onSubmit={salvarEdicao} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">ID</label><input type="text" value={consultorEditando.id_colaborador} disabled className="w-full border rounded-lg px-4 py-2 bg-gray-50 text-gray-400 cursor-not-allowed" /></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Nome</label><input type="text" value={consultorEditando.nome} onChange={(e) => setConsultorEditando({...consultorEditando, nome: e.target.value})} className="w-full border rounded-lg px-4 py-2" required /></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Estrutura</label><input type="text" value={consultorEditando.estrutura} onChange={(e) => setConsultorEditando({...consultorEditando, estrutura: e.target.value})} className="w-full border rounded-lg px-4 py-2" required /></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Canal</label><input type="text" value={consultorEditando.canal} onChange={(e) => setConsultorEditando({...consultorEditando, canal: e.target.value})} className="w-full border rounded-lg px-4 py-2" /></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Status</label><select value={consultorEditando.status_consultor} onChange={(e) => setConsultorEditando({...consultorEditando, status_consultor: e.target.value})} className="w-full border rounded-lg px-4 py-2"><option value="ativo">Ativo</option><option value="inativo">Inativo</option><option value="ferias">Férias</option></select></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Peso Meta (%)</label><input type="number" step="0.01" value={consultorEditando.peso_meta} onChange={(e) => setConsultorEditando({...consultorEditando, peso_meta: e.target.value})} className="w-full border rounded-lg px-4 py-2" /></div>
              </div>
              <div className="flex justify-end gap-3 pt-4"><button type="submit" className="bg-[#048187] text-white px-5 py-2 rounded-lg font-bold">Salvar alterações</button></div>
            </form>
          </div>
        </div>
      )}

      {modalExcluirAberto && consultorParaExcluir && (
        <div className="fixed inset-0 bg-black/40 z-[90] flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
            <h2 className="text-xl font-bold text-gray-700 mb-4">Excluir consultor?</h2>
            <p className="text-gray-600 mb-6">{consultorParaExcluir.nome}</p>
            <div className="flex justify-end gap-3"><button onClick={() => setModalExcluirAberto(false)} className="px-5 py-2 rounded-lg border">Cancelar</button><button onClick={confirmarExclusao} className="bg-red-500 text-white px-5 py-2 rounded-lg font-bold">Excluir</button></div>
          </div>
        </div>
      )}
    </div>
  );
}