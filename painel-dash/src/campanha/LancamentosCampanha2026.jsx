import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { AlertCircle, CheckCircle, Loader2, RotateCcw, Save, ClipboardPaste } from 'lucide-react';

// Lançamento dos resultados de 2026 que o DASH não tem (C01 a C13), por canal.
// Sem lançamento, o ciclo usa o que o DASH já tem; do C14 em diante tudo é automático.

const CANAIS = [
  { chave: 'vd', rotulo: 'Venda Direta' },
  { chave: 'loja', rotulo: 'Loja' }
];

const emReais = (valor) => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const emMilhoes = (valor) => `R$ ${(Number(valor || 0) / 1e6).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Mi`;
const paraTexto = (valor) => (valor === null || valor === undefined ? '' : Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

/** Lê "1.234.567,89", "R$ 1.234.567,89" ou "1234567.89". Vazio = null; inválido = NaN. */
function lerValor(texto) {
  const t = String(texto ?? '').replace(/R\$|\s/g, '');
  if (!t) return null;
  let numero;
  if (t.includes(',')) numero = Number(t.replace(/\./g, '').replace(',', '.'));
  else if ((t.match(/\./g) || []).length > 1 || /^\d{1,3}(\.\d{3})+$/.test(t)) numero = Number(t.replace(/\./g, ''));
  else numero = Number(t);
  return Number.isFinite(numero) && numero >= 0 ? numero : NaN;
}

const ORIGEM = {
  lancado: { texto: 'Lançado', classe: 'bg-[#e3f3f3] text-[#036b70]' },
  dash: { texto: 'Do DASH', classe: 'bg-[#eef2ff] text-[#3446a8]' },
  historico: { texto: 'Fechamento do ciclo', classe: 'bg-[#f3eefc] text-[#6b3fa0]' },
  sem_dados: { texto: 'Faltando', classe: 'bg-[#fff1f2] text-[#b42335]' }
};

export default function LancamentosCampanha2026({ apiUrl, aoSalvar }) {
  const [dados, setDados] = useState(null);
  const [edicao, setEdicao] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  const preencher = (payload) => {
    setDados(payload);
    const inicial = {};
    for (const linha of payload?.linhas || []) {
      inicial[linha.numero] = { vd: paraTexto(linha.vd_lancado), loja: paraTexto(linha.loja_lancado) };
    }
    setEdicao(inicial);
  };

  useEffect(() => {
    let ativo = true;
    axios.get(`${apiUrl}/campanha-incentivo-2026/lancamentos`, { params: { _t: Date.now() } })
      .then((r) => { if (ativo) preencher(r.data); })
      .catch((e) => { if (ativo) setErro(e?.response?.data?.detail || e?.message || 'Não foi possível carregar os lançamentos.'); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [apiUrl]);

  const linhas = useMemo(() => dados?.linhas || [], [dados]);

  // Estado de cada célula: valor digitado, valor lançado salvo e valor efetivo (o que entra na conta).
  const celulas = useMemo(() => {
    const mapa = {};
    for (const linha of linhas) {
      mapa[linha.numero] = {};
      for (const { chave } of CANAIS) {
        const texto = edicao[linha.numero]?.[chave] ?? '';
        const valor = lerValor(texto);
        const salvo = linha[`${chave}_lancado`];
        const dash = linha[`${chave}_dash`];
        const invalido = Number.isNaN(valor);
        const alterado = !invalido && (valor === null ? salvo !== null : salvo === null || Math.abs(valor - salvo) >= 0.005);
        const efetivo = invalido ? null : valor !== null ? valor : (dash ?? 0);
        const origem = invalido ? 'sem_dados' : valor !== null ? 'lancado' : dash ? (chave === 'vd' ? (linha.fonte_vd_dash || 'dash') : 'dash') : 'sem_dados';
        mapa[linha.numero][chave] = { texto, valor, salvo, dash, invalido, alterado, efetivo: efetivo ?? 0, origem };
      }
    }
    return mapa;
  }, [linhas, edicao]);

  const totais = useMemo(() => {
    let vd = 0;
    let loja = 0;
    let faltando = 0;
    for (const linha of linhas) {
      const c = celulas[linha.numero];
      if (!c) continue;
      vd += c.vd.efetivo;
      loja += c.loja.efetivo;
      if (c.vd.origem === 'sem_dados' || c.loja.origem === 'sem_dados') faltando += 1;
    }
    return { vd, loja, total: vd + loja, faltando };
  }, [linhas, celulas]);

  const alteracoes = linhas.filter((l) => CANAIS.some(({ chave }) => celulas[l.numero]?.[chave]?.alterado)).length;
  const temInvalido = linhas.some((l) => CANAIS.some(({ chave }) => celulas[l.numero]?.[chave]?.invalido));
  const campanha = Number(dados?.campanha_c14_c17?.total || 0);

  const mudar = (numero, chave, texto) => {
    setMensagem('');
    setEdicao((atual) => ({ ...atual, [numero]: { ...(atual[numero] || {}), [chave]: texto } }));
  };

  const formatarAoSair = (numero, chave) => {
    const valor = lerValor(edicao[numero]?.[chave]);
    if (valor !== null && !Number.isNaN(valor)) mudar(numero, chave, paraTexto(valor));
  };

  /** Colar do Excel: várias linhas descem pelos ciclos; duas colunas preenchem Venda Direta e Loja. */
  const colar = (evento, numero, chave) => {
    const texto = evento.clipboardData?.getData('text') || '';
    if (!/[\t\n]/.test(texto.trim())) return;
    evento.preventDefault();
    const linhasColadas = texto.replace(/\r/g, '').split('\n').filter((l, i, arr) => l.trim() !== '' || i < arr.length - 1);
    const colunaInicial = CANAIS.findIndex((c) => c.chave === chave);
    setMensagem('');
    setEdicao((atual) => {
      const novo = { ...atual };
      linhasColadas.forEach((linhaTexto, deslocamento) => {
        const alvo = numero + deslocamento;
        if (alvo > 13) return;
        linhaTexto.split('\t').forEach((celula, indiceColuna) => {
          const canal = CANAIS[colunaInicial + indiceColuna];
          if (!canal) return;
          const valor = lerValor(celula);
          novo[alvo] = { ...(novo[alvo] || {}), [canal.chave]: valor === null || Number.isNaN(valor) ? celula.trim() : paraTexto(valor) };
        });
      });
      return novo;
    });
  };

  const salvar = async () => {
    setSalvando(true);
    setErro('');
    setMensagem('');
    try {
      const itens = linhas
        .filter((l) => CANAIS.some(({ chave }) => celulas[l.numero]?.[chave]?.alterado))
        .map((l) => ({ ciclo: l.numero, vd: celulas[l.numero].vd.valor, loja: celulas[l.numero].loja.valor }));
      const r = await axios.put(`${apiUrl}/campanha-incentivo-2026/lancamentos`, { itens });
      preencher(r.data);
      setMensagem(r.data?.mensagem || 'Lançamentos salvos.');
      aoSalvar?.();
    } catch (e) {
      setErro(e?.response?.data?.detail || e?.message || 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  };

  const desfazer = () => preencher(dados);

  if (carregando && !dados) {
    return <div className="bg-white rounded-[24px] border border-gray-100 p-12 text-center shadow-sm"><Loader2 className="mx-auto animate-spin text-[#048187]" size={28} /><p className="mt-3 text-sm font-semibold text-gray-400">Carregando os resultados de 2026...</p></div>;
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-5 sm:p-7">
        <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
          <div className="max-w-3xl">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.06em] text-[#048187]">Acumulado de 2026</p>
            <h2 className="mt-1 text-xl sm:text-2xl font-bold text-gray-800">Resultados do C01 ao C13</h2>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              Lance a <strong className="text-gray-700">Venda Direta</strong> e a <strong className="text-gray-700">Loja</strong> de cada ciclo. Onde você não lançar, vale o que o DASH já tem.
              Do <strong className="text-gray-700">C14 ao C17</strong> o DASH calcula sozinho pelas regras da campanha. Dica: copie uma coluna do Excel e cole no primeiro ciclo.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 xl:min-w-[560px]">
            {[
              { rotulo: 'C01–C13', valor: emMilhoes(totais.total), cor: 'text-gray-800' },
              { rotulo: 'C14–C17 (automático)', valor: emMilhoes(campanha), cor: 'text-gray-800' },
              { rotulo: 'Total 2026 até C17', valor: emMilhoes(totais.total + campanha), cor: 'text-[#048187]' },
              { rotulo: 'Ciclos faltando', valor: totais.faltando ? String(totais.faltando) : 'nenhum', cor: totais.faltando ? 'text-[#b42335]' : 'text-green-700' }
            ].map((item) => (
              <div key={item.rotulo} className="rounded-2xl bg-[#f7fbfb] border border-[#e1efef] px-3.5 py-3">
                <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-gray-400">{item.rotulo}</p>
                <p className={`mt-1 text-[15px] sm:text-base 2xl:text-lg font-bold tabular-nums whitespace-nowrap ${item.cor}`}>{item.valor}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {erro && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 flex items-center gap-2"><AlertCircle size={17} /> {erro}</div>}
      {mensagem && <div className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 flex items-center gap-2"><CheckCircle size={17} /> {mensagem}</div>}

      <section className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="hidden md:grid grid-cols-[110px_1fr_1fr_170px] gap-4 px-6 py-3 bg-[#048187] text-white text-[11px] font-semibold uppercase tracking-wide">
          <span>Ciclo</span>
          <span>Venda Direta</span>
          <span>Loja</span>
          <span className="text-right">Total do ciclo</span>
        </div>
        <div className="divide-y divide-gray-100">
          {linhas.map((linha) => {
            const c = celulas[linha.numero];
            if (!c) return null;
            return (
              <div key={linha.numero} className="grid grid-cols-2 md:grid-cols-[110px_1fr_1fr_170px] gap-3 md:gap-4 px-4 sm:px-6 py-4 items-start hover:bg-[#fafcfc]">
                <div className="col-span-2 md:col-span-1 flex md:block items-center justify-between">
                  <p className="text-base font-semibold text-gray-800">C{String(linha.numero).padStart(2, '0')}</p>
                  {linha.atualizado_em && <p className="text-[10px] font-semibold text-gray-400 md:mt-1">lançado {new Date(linha.atualizado_em).toLocaleDateString('pt-BR')}</p>}
                </div>
                {CANAIS.map(({ chave, rotulo }) => {
                  const celula = c[chave];
                  const origem = ORIGEM[celula.origem];
                  return (
                    <div key={chave} className="min-w-0">
                      <label className="md:hidden block text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">{rotulo}</label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">R$</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={celula.texto}
                          onChange={(e) => mudar(linha.numero, chave, e.target.value)}
                          onBlur={() => formatarAoSair(linha.numero, chave)}
                          onPaste={(e) => colar(e, linha.numero, chave)}
                          placeholder={celula.dash ? paraTexto(celula.dash) : '0,00'}
                          aria-label={`${rotulo} do ciclo ${linha.numero}`}
                          className={`w-full rounded-xl border pl-9 pr-3 py-2.5 text-sm font-semibold tabular-nums text-gray-800 outline-none transition placeholder:text-gray-300 focus:ring-4 ${celula.invalido ? 'border-red-300 bg-red-50 focus:ring-red-100' : celula.alterado ? 'border-amber-300 bg-amber-50/60 focus:ring-amber-100' : 'border-gray-200 bg-white focus:border-[#048187] focus:ring-[#048187]/10'}`}
                        />
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${origem.classe}`}>{celula.invalido ? 'Valor inválido' : origem.texto}</span>
                        {celula.valor === null && celula.dash ? <span className="text-[10px] font-semibold text-gray-400">{emReais(celula.dash)}</span> : null}
                        {celula.valor !== null && celula.dash ? <span className="text-[10px] font-semibold text-gray-400">DASH: {emReais(celula.dash)}</span> : null}
                      </div>
                    </div>
                  );
                })}
                <div className="col-span-2 md:col-span-1 md:text-right">
                  <p className="md:hidden text-[10px] font-semibold uppercase tracking-wide text-gray-400">Total do ciclo</p>
                  <p className="text-base font-semibold tabular-nums text-gray-800">{emReais(c.vd.efetivo + c.loja.efetivo)}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-[110px_1fr_1fr_170px] gap-3 md:gap-4 px-4 sm:px-6 py-4 bg-[#f7fbfb] border-t border-[#e1efef] text-sm font-semibold text-gray-800">
          <span className="col-span-2 md:col-span-1">C01–C13</span>
          <span className="tabular-nums"><span className="md:hidden text-[10px] text-gray-400 block">Venda Direta</span>{emReais(totais.vd)}</span>
          <span className="tabular-nums"><span className="md:hidden text-[10px] text-gray-400 block">Loja</span>{emReais(totais.loja)}</span>
          <span className="col-span-2 md:col-span-1 md:text-right tabular-nums text-[#048187]">{emReais(totais.total)}</span>
        </div>
      </section>

      <div className="sticky bottom-3 z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-gray-100 bg-white/95 backdrop-blur px-4 py-3 shadow-[0_18px_40px_-20px_rgba(0,0,0,.35)]">
        <p className="text-xs font-semibold text-gray-500 flex items-center gap-2">
          <ClipboardPaste size={15} className="text-[#048187]" />
          {temInvalido ? <span className="text-red-600">Corrija os valores em vermelho para salvar.</span> : alteracoes ? `${alteracoes} ciclo(s) com alteração ainda não salva.` : 'Tudo salvo. Apague um valor para voltar a usar o do DASH.'}
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={desfazer} disabled={!alteracoes || salvando} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40"><RotateCcw size={15} /> Desfazer</button>
          <button type="button" onClick={salvar} disabled={!alteracoes || temInvalido || salvando} className="inline-flex items-center gap-2 rounded-xl bg-[#048187] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#036b70] disabled:opacity-50">
            {salvando ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} {salvando ? 'Salvando...' : 'Salvar lançamentos'}
          </button>
        </div>
      </div>
    </div>
  );
}
