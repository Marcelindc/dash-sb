import { useEffect, useRef } from 'react';
import axios from 'axios';

// Atualização automática (pedido de 13/11/2026), para todos os usuários:
// 1) Base nova (VD ou LOJA): a tela atual se atualiza sozinha, como no botão "Atualizar".
//    O backend diz o último envio de cada área (/dados/versao). Cada painel espera um tempo
//    aleatório (20–80 s) para todos não pedirem ao servidor no mesmo segundo.
// 2) Versão nova do site (Vercel): o painel recarrega sozinho (F5), mas só quando é seguro:
//    aba em segundo plano ou pessoa parada há 2 min, sem janela aberta, sem campo em edição e
//    sem filtros aplicados (o F5 apagaria os filtros). Quem não cair nisso recebe a versão nova
//    na próxima vez que abrir o DASH.

const INTERVALO_VERSAO_DADOS_MS = 60 * 1000;
const ESPERA_MINIMA_ATUALIZAR_MS = 20 * 1000;
const ESPERA_EXTRA_ATUALIZAR_MS = 60 * 1000;
const INTERVALO_VERSAO_SITE_MS = 3 * 60 * 1000;
const PARADO_PARA_RECARREGAR_MS = 2 * 60 * 1000;
const CHAVE_RECARGA = 'dashSbRecarregadoParaVersao';

// Na atualização automática o servidor já limpou o cache dele no envio da base: não precisa
// mandar recalcular tudo (X-Force-Refresh), o que pesaria com todos atualizando juntos.
let pedidosSemForcar = 0;
axios.interceptors.request.use((config) => {
  if (pedidosSemForcar > 0 && config?.headers) {
    try {
      if (typeof config.headers.delete === 'function') config.headers.delete('X-Force-Refresh');
      else delete config.headers['X-Force-Refresh'];
    } catch {
      // sem ação
    }
  }
  return config;
});

export async function semForcarOServidor(acao) {
  pedidosSemForcar += 1;
  try {
    return await acao();
  } finally {
    pedidosSemForcar -= 1;
  }
}

/**
 * area: 'vd' | 'loja' | 'ambos' (a área da tela aberta) ou '' (tela sem atualização automática).
 * atualizar: função que atualiza a tela atual (a mesma do botão "Atualizar").
 */
export function useAtualizarComBaseNova({ ativo, apiUrl, area, atualizar }) {
  const atualizarRef = useRef(atualizar);
  const areaRef = useRef(area);
  const versaoVistaRef = useRef(null); // { vd, loja } da última vez que a tela foi atualizada
  const pendenteRef = useRef({ vd: false, loja: false });
  const timerRef = useRef(null);
  useEffect(() => { atualizarRef.current = atualizar; });

  const temPendente = (alvo) => (alvo === 'ambos' ? pendenteRef.current.vd || pendenteRef.current.loja : Boolean(alvo && pendenteRef.current[alvo]));

  const agendarRef = useRef(() => {});
  useEffect(() => {
    agendarRef.current = (esperaMs) => {
      if (timerRef.current || !temPendente(areaRef.current)) return;
      timerRef.current = window.setTimeout(async () => {
        timerRef.current = null;
        const alvo = areaRef.current;
        if (!temPendente(alvo)) return;
        if (document.hidden) return; // atualiza quando a pessoa voltar para a aba
        if (alvo === 'ambos') pendenteRef.current = { vd: false, loja: false };
        else pendenteRef.current = { ...pendenteRef.current, [alvo]: false };
        try {
          await semForcarOServidor(() => atualizarRef.current?.());
        } catch {
          // a próxima base nova tenta de novo
        }
      }, esperaMs);
    };
  });

  // Trocou de tela: se chegou base da área dela enquanto a pessoa estava em outra, atualiza.
  useEffect(() => {
    areaRef.current = area;
    if (area && temPendente(area)) agendarRef.current(3000);
  }, [area]);

  useEffect(() => {
    if (!ativo) return undefined;
    let vivo = true;
    let ultimaBusca = 0;
    const verificar = async () => {
      if (!vivo || document.hidden) return;
      ultimaBusca = Date.now();
      try {
        const { data } = await axios.get(`${apiUrl}/dados/versao`, { params: { _t: Date.now() } });
        if (!vivo || !data) return;
        const nova = { vd: String(data.vd ?? ''), loja: String(data.loja ?? '') };
        const vista = versaoVistaRef.current;
        versaoVistaRef.current = nova;
        if (!vista) return; // primeira leitura: a tela acabou de carregar com estes dados
        let mudou = false;
        for (const chave of ['vd', 'loja']) {
          if (nova[chave] && nova[chave] !== vista[chave]) { pendenteRef.current[chave] = true; mudou = true; }
        }
        if (mudou) agendarRef.current(ESPERA_MINIMA_ATUALIZAR_MS + Math.random() * ESPERA_EXTRA_ATUALIZAR_MS);
      } catch {
        // a checagem é um extra: se falhar, o DASH segue normalmente
      }
    };
    const aoVoltar = () => {
      if (document.hidden) return;
      if (temPendente(areaRef.current)) agendarRef.current(2000 + Math.random() * 8000);
      if (Date.now() - ultimaBusca > 30000) verificar();
    };
    const inicial = window.setTimeout(verificar, 8000);
    const intervalo = window.setInterval(verificar, INTERVALO_VERSAO_DADOS_MS);
    document.addEventListener('visibilitychange', aoVoltar);
    return () => {
      vivo = false;
      window.clearTimeout(inicial);
      window.clearInterval(intervalo);
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
      document.removeEventListener('visibilitychange', aoVoltar);
    };
  }, [ativo, apiUrl]);
}

const lerScriptPrincipal = (html) => (String(html || '').match(/\/assets\/index-[\w-]+\.js/) || [])[0] || '';

function scriptCarregado() {
  const script = Array.from(document.querySelectorAll('script[type="module"][src]'))
    .map((s) => s.getAttribute('src') || '')
    .find((src) => /\/assets\/index-[\w-]+\.js/.test(src));
  return script ? lerScriptPrincipal(script) : '';
}

function campoEmEdicao() {
  const el = document.activeElement;
  if (!el) return false;
  const tag = String(el.tagName || '').toUpperCase();
  return tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
    || (tag === 'INPUT' && !['button', 'submit', 'checkbox', 'radio', 'range', 'reset'].includes(String(el.type || '').toLowerCase()));
}

// Janelas do DASH (detalhes, edição, vídeo, comunicado) cobrem a tela com "fixed inset-0".
// Só contam as visíveis (um elemento escondido com display:none não tem retângulo).
const janelaAberta = () => Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0'))
  .some((el) => el.getClientRects().length > 0);

/** podeRecarregar(): o App diz se não há filtros aplicados (o F5 os apagaria). */
export function useRecarregarComVersaoNova({ podeRecarregar }) {
  const podeRef = useRef(podeRecarregar);
  useEffect(() => { podeRef.current = podeRecarregar; });

  useEffect(() => {
    const atual = scriptCarregado();
    if (!atual) return undefined; // em desenvolvimento (vite) não há arquivo com versão
    let vivo = true;
    let versaoNova = '';
    let ultimaAtividade = Date.now();
    let ultimaBusca = 0;
    const marcarAtividade = () => { ultimaAtividade = Date.now(); };
    const eventos = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'mousemove', 'scroll'];
    eventos.forEach((nome) => window.addEventListener(nome, marcarAtividade, { passive: true, capture: true }));

    const tentarRecarregar = () => {
      if (!vivo || !versaoNova) return;
      const parado = document.hidden || Date.now() - ultimaAtividade >= PARADO_PARA_RECARREGAR_MS;
      if (!parado || campoEmEdicao() || janelaAberta() || !podeRef.current?.()) return;
      // Evita recarregar em laço se a Vercel ainda entregar a versão antiga por alguns minutos.
      try {
        const anterior = JSON.parse(sessionStorage.getItem(CHAVE_RECARGA) || 'null');
        if (anterior?.versao === versaoNova && Date.now() - Number(anterior.em || 0) < 10 * 60 * 1000) return;
        sessionStorage.setItem(CHAVE_RECARGA, JSON.stringify({ versao: versaoNova, em: Date.now() }));
      } catch {
        // sem sessionStorage: recarrega mesmo assim
      }
      window.location.reload();
    };

    const verificar = async () => {
      if (!vivo || versaoNova) return;
      ultimaBusca = Date.now();
      try {
        const resposta = await fetch(`${window.location.origin}/?_v=${Date.now()}`, { cache: 'no-store', credentials: 'same-origin' });
        if (!resposta.ok) return;
        const publicado = lerScriptPrincipal(await resposta.text());
        if (publicado && publicado !== atual) versaoNova = publicado;
      } catch {
        // sem rede agora: tenta na próxima
      }
    };
    const aoVoltar = () => {
      if (!document.hidden && Date.now() - ultimaBusca > 60000) verificar();
      if (document.hidden) tentarRecarregar();
    };

    const inicial = window.setTimeout(verificar, 20000);
    const intervalo = window.setInterval(verificar, INTERVALO_VERSAO_SITE_MS);
    const vigia = window.setInterval(tentarRecarregar, 15000);
    document.addEventListener('visibilitychange', aoVoltar);
    return () => {
      vivo = false;
      window.clearTimeout(inicial);
      window.clearInterval(intervalo);
      window.clearInterval(vigia);
      document.removeEventListener('visibilitychange', aoVoltar);
      eventos.forEach((nome) => window.removeEventListener(nome, marcarAtividade, { capture: true }));
    };
  }, []);
}
