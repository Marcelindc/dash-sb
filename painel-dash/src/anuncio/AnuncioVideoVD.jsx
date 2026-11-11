import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { CircleCheck, LoaderCircle, Pause, Play, RotateCcw, Volume2, VolumeX, X } from 'lucide-react';
import { FONTE } from '../celebracao/efeitos';

// Vídeo-anúncio do canal VD: abre no meio da tela, como um anúncio, uma vez por dia.
// Quem decide se a pessoa vê e quando é o backend (/anuncios/video/pendente). Aqui só se
// toca o vídeo e se avisa o que aconteceu (/anuncios/video/evento):
//   inicio    = começou a tocar;
//   progresso = a cada 15 s (se a pessoa fechar a página no meio, o relatório mostra até onde viu);
//   concluiu  = chegou ao fim;
//   pulou     = clicou em Pular/X (ou apertou Esc).
// Sem controles nativos: não dá para adiantar o vídeo até o fim. Se a pessoa trocar de aba,
// o vídeo pausa e volta quando ela retorna. Na prévia do Painel ADM nada é gravado.

const CANAL_ABAS = 'dash-anuncio-video';
const INTERVALO_PROGRESSO_MS = 15000;

const ESTILO = `
  @keyframes anuncioSurgir {
    from { opacity: 0; transform: translateY(14px) scale(.97); }
    to { opacity: 1; transform: none; }
  }
  @keyframes anuncioFundo { from { opacity: 0; } to { opacity: 1; } }
  .anuncio-fundo { animation: anuncioFundo .35s ease-out both; }
  .anuncio-quadro {
    aspect-ratio: 9 / 16;
    height: min(88vh, calc((100vw - 24px) * 16 / 9));
    height: min(88dvh, calc((100vw - 24px) * 16 / 9));
    animation: anuncioSurgir .55s cubic-bezier(.4,0,.2,1) both;
  }
  .anuncio-vidro {
    background: rgba(255,255,255,.16);
    -webkit-backdrop-filter: blur(8px) saturate(160%);
    backdrop-filter: blur(8px) saturate(160%);
    border: 1px solid rgba(255,255,255,.22);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.14), 0 1px 2px rgba(0,0,0,.25);
  }
  .anuncio-vidro:hover { background: rgba(255,255,255,.26); }
  @media (prefers-reduced-motion: reduce) {
    .anuncio-fundo, .anuncio-quadro { animation: none; }
  }
`;

function formatarTempo(segundos) {
  const total = Math.max(0, Math.round(Number(segundos) || 0));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function dispositivoAtual() {
  try {
    return window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768 ? 'celular' : 'computador';
  } catch {
    return '';
  }
}

export default function AnuncioVideoVD({ anuncio, simulacao = false, apiUrl, aoFechar }) {
  const videoRef = useRef(null);
  const janelaRef = useRef(null);
  const iniciou = useRef(false);
  const encerrado = useRef(false);
  const pausadoPelaAba = useRef(false);
  const [estado, setEstado] = useState('carregando'); // carregando | tocando | pausado | fim | erro
  const [mudo, setMudo] = useState(false);
  const [somBloqueado, setSomBloqueado] = useState(false);
  const [tempo, setTempo] = useState(0);
  const [duracao, setDuracao] = useState(0);
  // O App redesenha muito: guardar o aoFechar num ref evita religar os efeitos a cada redesenho.
  const aoFecharRef = useRef(aoFechar);
  useEffect(() => { aoFecharRef.current = aoFechar; });
  const fecharPor = useCallback((motivo) => aoFecharRef.current?.(motivo), []);

  const enviar = useCallback((tipo) => {
    if (simulacao || !anuncio?.id) return;
    const video = videoRef.current;
    const segundos = Number(video?.currentTime);
    const total = Number(video?.duration);
    axios.post(`${apiUrl}/anuncios/video/evento`, {
      anuncio_id: anuncio.id,
      dia: anuncio.dia,
      tipo,
      segundos: Number.isFinite(segundos) ? segundos : 0,
      duracao: Number.isFinite(total) ? total : 0,
      som: video ? !(video.muted || video.volume === 0) : null,
      dispositivo: dispositivoAtual(),
    }).catch(() => {});
  }, [anuncio, apiUrl, simulacao]);

  const avisarOutrasAbas = useCallback(() => {
    if (simulacao) return;
    try {
      const canal = new BroadcastChannel(CANAL_ABAS);
      canal.postMessage({ id: anuncio.id, dia: anuncio.dia });
      canal.close();
    } catch {
      // Navegador sem BroadcastChannel: cada aba resolve sozinha.
    }
  }, [anuncio, simulacao]);

  const tocar = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const tentativa = video.play();
    if (tentativa?.catch) tentativa.catch(() => setEstado('pausado'));
  }, []);

  // Começa sozinho com som; se o navegador não deixar, começa mudo e pede um toque para o som.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    const tentativa = video.play();
    if (tentativa?.catch) {
      tentativa.catch(() => {
        // A recusa pode chegar atrasada: se o vídeo já acabou ou foi pulado, não recomeça.
        if (encerrado.current || video.ended) return;
        video.muted = true;
        setMudo(true);
        setSomBloqueado(true);
        video.play().catch(() => setEstado('pausado'));
      });
    }
  }, []);

  // O foco vai para a janela (o Tab chega no Pular) sem deixar o botão com cara de selecionado.
  useEffect(() => { janelaRef.current?.focus({ preventScroll: true }); }, []);

  // Progresso a cada 15 s enquanto toca.
  useEffect(() => {
    if (estado !== 'tocando' || simulacao) return undefined;
    const intervalo = window.setInterval(() => enviar('progresso'), INTERVALO_PROGRESSO_MS);
    return () => window.clearInterval(intervalo);
  }, [estado, enviar, simulacao]);

  // Trocou de aba: pausa; voltou: continua.
  useEffect(() => {
    const aoMudarVisibilidade = () => {
      const video = videoRef.current;
      if (!video || encerrado.current) return;
      if (document.hidden) {
        if (!video.paused) {
          pausadoPelaAba.current = true;
          video.pause();
          enviar('progresso');
        }
      } else if (pausadoPelaAba.current) {
        pausadoPelaAba.current = false;
        tocar();
      }
    };
    document.addEventListener('visibilitychange', aoMudarVisibilidade);
    return () => document.removeEventListener('visibilitychange', aoMudarVisibilidade);
  }, [enviar, tocar]);

  // Se a pessoa já resolveu o vídeo em outra aba, esta fecha sozinha.
  useEffect(() => {
    if (simulacao) return undefined;
    let canal;
    try {
      canal = new BroadcastChannel(CANAL_ABAS);
      canal.onmessage = (evento) => {
        if (evento?.data?.id === anuncio.id && evento?.data?.dia === anuncio.dia && !encerrado.current) {
          encerrado.current = true;
          videoRef.current?.pause();
          fecharPor('outra_aba');
        }
      };
    } catch {
      canal = null;
    }
    return () => canal?.close();
  }, [anuncio, fecharPor, simulacao]);

  const pular = useCallback(() => {
    if (encerrado.current) return;
    encerrado.current = true;
    videoRef.current?.pause();
    enviar('pulou');
    avisarOutrasAbas();
    fecharPor('pulou');
  }, [avisarOutrasAbas, enviar, fecharPor]);

  const fecharDepoisDoFim = useCallback(() => fecharPor('concluiu'), [fecharPor]);

  useEffect(() => {
    const aoTecla = (evento) => {
      if (evento.key !== 'Escape') return;
      if (estado === 'fim') fecharDepoisDoFim();
      else if (estado === 'erro') fecharPor('erro');
      else pular();
    };
    window.addEventListener('keydown', aoTecla);
    return () => window.removeEventListener('keydown', aoTecla);
  }, [estado, fecharDepoisDoFim, fecharPor, pular]);

  const alternarPlay = () => {
    const video = videoRef.current;
    if (!video || estado === 'fim' || estado === 'erro') return;
    if (video.paused) tocar();
    else video.pause();
  };

  const alternarSom = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    if (!video.muted && video.volume === 0) video.volume = 1;
    setMudo(video.muted);
    setSomBloqueado(false);
    if (video.paused && estado !== 'fim') tocar();
  };

  const assistirDeNovo = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    setTempo(0);
    setEstado('carregando');
    tocar();
  };

  // Chamado pelo 'ended' e, por garantia, quando faltam menos de 0,3 s (alguns navegadores
  // param no último quadro sem avisar o fim). Só grava 'concluiu' uma vez.
  const aoTerminar = () => {
    setEstado('fim');
    setTempo(duracao);
    if (encerrado.current) return;
    encerrado.current = true;
    enviar('concluiu');
    avisarOutrasAbas();
  };

  const percentual = estado === 'fim' ? 100 : (duracao > 0 ? Math.min(100, (tempo / duracao) * 100) : 0);
  const mostrarPlayGrande = estado === 'pausado';
  const mostrarPedidoSom = somBloqueado && mudo && estado === 'tocando';

  return (
    <div
      ref={janelaRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={`Vídeo: ${anuncio?.titulo || 'Canal VD'}`}
      className="anuncio-fundo fixed inset-0 z-[170] flex items-center justify-center bg-[#020c0d]/80 p-3 outline-none backdrop-blur-[6px] sm:p-6"
      style={{ fontFamily: FONTE }}
    >
      <style>{ESTILO}</style>
      <div className="anuncio-quadro relative max-w-full overflow-hidden rounded-[26px] bg-black shadow-[0_40px_90px_-30px_rgba(0,0,0,.85)] ring-1 ring-white/10">
        <video
          ref={videoRef}
          src={anuncio?.video_url}
          playsInline
          preload="auto"
          disablePictureInPicture
          controlsList="nodownload noplaybackrate noremoteplayback"
          onContextMenu={(e) => e.preventDefault()}
          onClick={alternarPlay}
          onLoadedMetadata={(e) => setDuracao(Number(e.currentTarget.duration) || 0)}
          onDurationChange={(e) => setDuracao(Number(e.currentTarget.duration) || 0)}
          onTimeUpdate={(e) => {
            const agora = Number(e.currentTarget.currentTime) || 0;
            const total = Number(e.currentTarget.duration) || 0;
            setTempo(agora);
            if (total > 0 && agora >= total - 0.3 && estado !== 'fim') aoTerminar();
          }}
          onWaiting={() => setEstado((atual) => (atual === 'tocando' ? 'carregando' : atual))}
          onPlaying={() => {
            setEstado((atual) => (atual === 'fim' ? atual : 'tocando'));
            if (!iniciou.current) {
              iniciou.current = true;
              enviar('inicio');
            }
          }}
          onPause={() => setEstado((atual) => (atual === 'fim' || atual === 'erro' ? atual : 'pausado'))}
          onEnded={aoTerminar}
          onError={() => setEstado('erro')}
          className="absolute inset-0 h-full w-full cursor-pointer bg-black object-contain"
        />

        {/* topo: selo e Pular */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/65 to-transparent" />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 sm:p-4">
          <span className="anuncio-vidro rounded-full px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-white">
            {simulacao ? 'Prévia · não conta' : 'Vídeo do dia · Canal VD'}
          </span>
          {estado !== 'fim' && (
            <button
              type="button"
              onClick={estado === 'erro' ? () => fecharPor('erro') : pular}
              className="anuncio-vidro flex items-center gap-1.5 rounded-full py-1.5 pl-3.5 pr-2.5 text-[13px] font-bold text-white outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/70"
              aria-label={estado === 'erro' ? 'Fechar' : 'Pular o vídeo'}
            >
              {estado === 'erro' ? 'Fechar' : 'Pular'}
              <X size={16} strokeWidth={2.6} />
            </button>
          )}
        </div>

        {/* centro: carregando / play / pedir som */}
        {estado === 'carregando' && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <LoaderCircle size={44} className="animate-spin text-white/85" />
          </div>
        )}
        {mostrarPlayGrande && (
          <button
            type="button"
            onClick={tocar}
            className="anuncio-vidro absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white"
            aria-label="Assistir"
          >
            <Play size={34} fill="currentColor" className="ml-1" />
          </button>
        )}
        {mostrarPedidoSom && (
          <button
            type="button"
            onClick={alternarSom}
            className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-[#048187] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_30px_-8px_rgba(0,0,0,.6)]"
          >
            <Volume2 size={19} />
            Toque para ouvir
          </button>
        )}

        {/* rodapé: controles e tempo (o vídeo já traz a legenda logo acima, então a faixa é baixa) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={alternarPlay}
              disabled={estado === 'fim' || estado === 'erro'}
              className="anuncio-vidro flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-50"
              aria-label={estado === 'tocando' || estado === 'carregando' ? 'Pausar' : 'Continuar'}
            >
              {estado === 'tocando' || estado === 'carregando' ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
            </button>
            <button
              type="button"
              onClick={alternarSom}
              className="anuncio-vidro flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
              aria-label={mudo ? 'Ligar o som' : 'Tirar o som'}
            >
              {mudo ? <VolumeX size={17} /> : <Volume2 size={17} />}
            </button>
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/25" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percentual)} aria-label="Andamento do vídeo">
              <div className="h-full rounded-full bg-[#35d7df] transition-[width] duration-300 ease-linear" style={{ width: `${percentual}%` }} />
            </div>
            <span className="w-10 shrink-0 text-right text-[11.5px] font-bold tabular-nums text-white/90">
              {estado === 'fim' ? '0:00' : (duracao > 0 ? formatarTempo(duracao - tempo) : '--:--')}
            </span>
          </div>
        </div>

        {estado === 'fim' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 p-6 text-center">
            <CircleCheck size={54} className="text-[#35d7df]" strokeWidth={2.2} />
            <p className="mt-3 text-xl font-extrabold text-white">Obrigado por assistir!</p>
            <p className="mt-1 text-sm font-semibold text-white/70">Boas vendas neste último período.</p>
            <button
              type="button"
              onClick={fecharDepoisDoFim}
              className="mt-6 rounded-full bg-[#048187] px-6 py-2.5 text-sm font-bold text-white shadow-[0_12px_30px_-10px_rgba(4,129,135,.9)] hover:bg-[#036e73]"
            >
              Voltar ao DASH
            </button>
            <button type="button" onClick={assistirDeNovo} className="mt-3 flex items-center gap-1.5 text-xs font-bold text-white/70 hover:text-white">
              <RotateCcw size={13} /> Assistir de novo
            </button>
          </div>
        )}

        {estado === 'erro' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6 text-center">
            <p className="text-base font-bold text-white">Não foi possível carregar o vídeo agora.</p>
            <p className="mt-1 text-sm text-white/70">Ele volta a aparecer na próxima vez que você entrar.</p>
            <button
              type="button"
              onClick={() => fecharPor('erro')}
              className="mt-5 rounded-full bg-[#048187] px-6 py-2.5 text-sm font-bold text-white"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
