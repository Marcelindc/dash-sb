// Cadastro > Estruturas por código: liga a tela (EstruturasPorCodigo.jsx) às rotas do servidor.
// Só admin e gestor alteram o cadastro; os demais continuam com a tela antiga (telaAntiga).
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { TelaEstruturasPorCodigo } from './EstruturasPorCodigo';

export default function CadastroEstruturasPorCodigo({ apiUrl, onAtualizacao, telaAntiga = null }) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [semPermissao, setSemPermissao] = useState(false);

  const buscar = useCallback(() => axios.get(`${apiUrl}/cadastro-v2/estruturas-por-codigo`)
    .then(({ data }) => { setDados(data); setErro(''); })
    .catch((err) => {
      if (err.response?.status === 403) setSemPermissao(true);
      else setErro(err.response?.data?.detail || 'Erro ao carregar as estruturas.');
    })
    .finally(() => setCarregando(false)), [apiUrl]);

  useEffect(() => { buscar(); }, [buscar]);

  const carregar = () => buscar();

  const depoisDeSalvar = async (texto) => {
    setErro('');
    setMensagem(texto);
    await carregar();
    if (onAtualizacao) onAtualizacao();
  };

  const executar = async (acao) => {
    setSalvando(true);
    setErro('');
    setMensagem('');
    try {
      const { data } = await acao();
      await depoisDeSalvar(data?.mensagem || 'Salvo.');
      return true;
    } catch (err) {
      setErro(err.response?.data?.detail || 'Não foi possível salvar.');
      return false;
    } finally {
      setSalvando(false);
    }
  };

  const aoSalvarEstrutura = (estrutura, form) => {
    const corpo = {
      nome: form.nome,
      nucleo: form.nucleo,
      tipo: form.tipo,
      status: form.status,
      lider: form.lider,
      usuario_id: form.usuario_id ? Number(form.usuario_id) : null,
      codigos: form.codigos.map((c) => c.cod),
    };
    if (estrutura?.id) {
      const renomeou = String(estrutura.nome || '').trim() !== String(form.nome || '').trim();
      const trocouNucleo = estrutura.nucleo !== form.nucleo;
      if ((renomeou || trocouNucleo) && !window.confirm(
        `${renomeou ? `Trocar o nome para ${form.nome}` : ''}${renomeou && trocouNucleo ? ' e ' : ''}${trocouNucleo ? `mudar para o ${form.nucleo.replace('NUCLEO ', 'N')}` : ''} `
        + `a partir do ciclo ${dados?.ciclo_atual || 'atual'}? Os ciclos fechados continuam como eram.`,
      )) return false;
      return executar(() => axios.put(`${apiUrl}/cadastro-v2/estruturas-por-codigo/${estrutura.id}`, corpo));
    }
    return executar(() => axios.post(`${apiUrl}/cadastro-v2/estruturas-por-codigo`, corpo));
  };

  const aoLigarCodigo = (codigo, equipeId) => {
    const estrutura = (dados?.estruturas || []).find((e) => Number(e.id) === Number(equipeId));
    if (!estrutura || !window.confirm(`Ligar o código ${codigo.cod_exibicao} (${codigo.nome_sgi}) à ${estrutura.nome}? As vendas desse código passam a contar para ela do ciclo atual em diante.`)) return;
    executar(() => axios.put(`${apiUrl}/cadastro-v2/codigos-estrutura/${codigo.cod}`, { equipe_id: Number(equipeId), nome_oficial: codigo.nome_sgi || '' }))
      .then((ok) => ok && setMensagem(`Código ${codigo.cod_exibicao} ligado à ${estrutura.nome}.`));
  };

  const situacao = (codigo, acao, pergunta) => {
    if (!window.confirm(pergunta)) return;
    executar(() => axios.post(`${apiUrl}/cadastro-v2/estruturas-por-codigo/codigo/${codigo.cod}`, { acao, nome_sgi: codigo.nome_sgi || '' }));
  };

  // Consultores dentro da estrutura: cada ação salva na hora e a mensagem aparece no próprio painel.
  const acaoConsultor = async (requisicao) => {
    try {
      const { data } = await requisicao();
      await carregar();
      if (onAtualizacao) onAtualizacao();
      return { ok: true, mensagem: data?.mensagem || 'Salvo.' };
    } catch (err) {
      return { ok: false, erro: err.response?.data?.detail || 'Não foi possível salvar.' };
    }
  };
  const rotaConsultores = (estrutura) => `${apiUrl}/cadastro-v2/estruturas-por-codigo/${estrutura.id}/consultores`;
  const acoesConsultores = {
    incluir: (estrutura, corpo) => acaoConsultor(() => axios.post(rotaConsultores(estrutura), corpo)),
    editar: (estrutura, idColaborador, corpo) => acaoConsultor(() => axios.put(`${rotaConsultores(estrutura)}/${encodeURIComponent(idColaborador)}`, corpo)),
    remover: (estrutura, consultor) => acaoConsultor(() => axios.delete(`${rotaConsultores(estrutura)}/${encodeURIComponent(consultor.id_colaborador)}`)),
  };

  if (semPermissao) {
    return telaAntiga || <div className="rounded-2xl bg-white p-8 text-center text-sm text-gray-500">Somente administradores e gestores alteram o cadastro de estruturas.</div>;
  }

  return (
    <TelaEstruturasPorCodigo
      dados={dados}
      carregando={carregando && !dados}
      erro={erro}
      mensagem={mensagem}
      salvando={salvando}
      aoSalvarEstrutura={aoSalvarEstrutura}
      aoLigarCodigo={aoLigarCodigo}
      aoMarcarFora={(c) => situacao(c, 'fora', `Deixar ${c.cod_exibicao} (${c.nome_sgi}) fora dos núcleos? Ele continua no total da VD, mas não entra em núcleo, meta nem ranking.`)}
      aoInativarCodigo={(c) => situacao(c, 'inativar', `Inativar o código ${c.cod_exibicao} (${c.nome_sgi}) a partir do ciclo ${dados?.ciclo_atual || 'atual'}? Os ciclos anteriores ficam como eram.`)}
      acoesConsultores={acoesConsultores}
    />
  );
}
