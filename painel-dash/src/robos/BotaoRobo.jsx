import { useEffect, useState } from 'react';
import { CheckCircle, RefreshCcw } from 'lucide-react';

// Botão "Ligar Robô VD/LOJA" com o estado que a extensão manda a cada 5 s.
// Antes esse estado ficava no App: cada mensagem (duas extensões, a cada ~2,5 s) redesenhava o
// DASH inteiro e os gráficos repetiam a animação ("piscando"). Agora só este botão se atualiza,
// e só quando o estado muda de verdade.

// Último estado de cada extensão, guardado fora do React: o botão já abre com ele (sem esperar 5 s).
const ultimoEstado = new Map();
const inscritos = new Set();

if (typeof window !== 'undefined') {
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    const data = event.data || {};
    const chave = `${data.source}|${data.acao}`;
    if (data.acao !== 'ROBO_VD_STATUS' && data.acao !== 'ROBO_LOJA_STATUS') return;
    const novo = data.estado || null;
    if (JSON.stringify(ultimoEstado.get(chave) ?? null) === JSON.stringify(novo)) return;
    ultimoEstado.set(chave, novo);
    inscritos.forEach((avisar) => avisar(chave, novo));
  });
}

function useEstadoExtensao(origem, acao) {
  const chave = `${origem}|${acao}`;
  const [estado, setEstado] = useState(() => ultimoEstado.get(chave) ?? null);
  useEffect(() => {
    const avisar = (c, novo) => { if (c === chave) setEstado(novo); };
    inscritos.add(avisar);
    return () => { inscritos.delete(avisar); };
  }, [chave]);
  return estado;
}

export default function BotaoRobo({ nome, origem, acaoStatus, campoProxima, textoProxima, textoPadrao, ligando, podeLigar, aoLigar, larguraClasse }) {
  const estado = useEstadoExtensao(origem, acaoStatus);
  const ligado = Boolean(estado?.ativa);
  const rodando = estado?.rodando;
  const proxima = estado?.[campoProxima];
  const detalhe = estado?.recarregar
    ? 'A extensão foi recarregada: aperte F5.'
    : !estado
      ? `Extensão ${nome} não detectada neste Chrome.`
      : rodando
        ? `${rodando.rotulo}${rodando.etapa ? ` — ${rodando.etapa}` : ''}`
        : ligado
          ? `Ligado hoje${proxima ? ` • ${textoProxima} às ${new Date(proxima).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : ''}`
          : textoPadrao;
  return (
    <div className={larguraClasse}>
      <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">{nome}</label>
      <button
        type="button"
        onClick={aoLigar}
        disabled={ligando || ligado || !podeLigar}
        title={detalhe}
        className={`w-full px-4 py-3 rounded-lg font-black inline-flex items-center justify-center gap-2 disabled:cursor-default ${ligado ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-[#048187] text-white hover:bg-[#036b70] disabled:opacity-60'}`}
      >
        {ligado && !rodando ? <CheckCircle size={16} /> : <RefreshCcw size={16} className={rodando || ligando ? 'animate-spin' : ''} />}
        {ligando ? 'Ligando...' : rodando ? `${nome} rodando` : ligado ? `${nome} ligado` : `Ligar ${nome}`}
      </button>
      <p className="text-[10px] font-bold text-gray-400 mt-1 truncate" title={detalhe}>{detalhe}</p>
    </div>
  );
}
