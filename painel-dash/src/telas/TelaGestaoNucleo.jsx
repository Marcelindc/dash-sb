import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import {
  AlertCircle,
  Building2,
  Calculator,
  ChevronRight,
  Eye,
  Loader2,
  RefreshCw,
  Save,
  Search,
  Settings,
  Target,
  Users,
  X,
} from "lucide-react";

const API_BASE =
  import.meta.env?.VITE_API_URL ||
  (import.meta.env?.DEV
    ? "http://127.0.0.1:8001"
    : "https://xc3lin-dash-sb-api.hf.space");
const COR_PRINCIPAL = "#048187";
const COR_DARK = "#036b70";

const normalizarNucleo = (valor) => {
  const texto = String(valor || "N1").toUpperCase().trim();
  return texto.includes("2") ? "N2" : "N1";
};

const numeroSeguro = (valor) => {
  if (valor === null || valor === undefined || valor === "") return 0;
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;

  const texto = String(valor)
    .replace(/R\$/gi, "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : 0;
};

const arredondar = (valor, casas = 2) => {
  const fator = Math.pow(10, casas);
  return Math.round((numeroSeguro(valor) + Number.EPSILON) * fator) / fator;
};

const formatarMoeda = (valor) => {
  const numero = numeroSeguro(valor);
  const sinal = numero < 0 ? "-" : "";
  const abs = Math.abs(numero);

  if (abs >= 999_500) {
    return `${sinal}R$${(abs / 1_000_000).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} Mi`;
  }

  if (abs >= 1_000) {
    return `${sinal}R$${(abs / 1_000).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} Mil`;
  }

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatarMoedaCompleta = (valor) =>
  numeroSeguro(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatarPercentual = (valor) =>
  `${numeroSeguro(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;


const dataLocalSegura = (valor) => {
  if (!valor) return null;
  const texto = String(valor).slice(0, 10);
  const partes = texto.split("-");
  if (partes.length !== 3) return null;
  const [ano, mes, dia] = partes.map(Number);
  if (!ano || !mes || !dia) return null;
  const data = new Date(ano, mes - 1, dia);
  return Number.isNaN(data.getTime()) ? null : data;
};

const diferencaDiasInclusiva = (inicio, fim) => {
  if (!inicio || !fim) return 0;
  const umDia = 24 * 60 * 60 * 1000;
  const ini = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate()).getTime();
  const f = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate()).getTime();
  return Math.max(0, Math.floor((f - ini) / umDia) + 1);
};

const calcularTendenciaGerencial = ({ realizado, metaGerencial, infoCiclo, dados }) => {
  const valorBackend = numeroSeguro(
    dados?.cards?.tendencia_gerencial ??
      dados?.cards?.tendencia ??
      dados?.tendencia_gerencial ??
      dados?.tendencia
  );

  const meta = numeroSeguro(metaGerencial);
  const realizadoAtual = numeroSeguro(realizado);
  const inicio = dataLocalSegura(
    infoCiclo?.data_inicio ||
      infoCiclo?.inicio_ciclo ||
      infoCiclo?.inicio ||
      dados?.inicio_ciclo ||
      dados?.data_inicio
  );
  const fim = dataLocalSegura(
    infoCiclo?.data_fim ||
      infoCiclo?.fim_ciclo ||
      infoCiclo?.fim ||
      dados?.fim_ciclo ||
      dados?.data_fim
  );

  let valor = valorBackend;
  let diasDecorridos = 0;
  let diasTotais = 0;

  if (!valor && inicio && fim && realizadoAtual > 0) {
    const hoje = new Date();
    const hojeBase = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const dataReferencia = hojeBase < inicio ? inicio : hojeBase > fim ? fim : hojeBase;
    diasDecorridos = diferencaDiasInclusiva(inicio, dataReferencia);
    diasTotais = diferencaDiasInclusiva(inicio, fim);
    valor = diasDecorridos > 0 && diasTotais > 0 ? (realizadoAtual / diasDecorridos) * diasTotais : realizadoAtual;
  }

  if (!valor) valor = realizadoAtual;

  const gap = valor - meta;
  const percentual = meta > 0 ? (valor / meta) * 100 : 0;
  const risco = meta > 0 && valor < meta;

  return {
    valor,
    gap,
    percentual,
    risco,
    status: meta <= 0 ? "Sem meta cadastrada" : risco ? "Risco de não bater" : "Tendência positiva",
    diasDecorridos,
    diasTotais,
  };
};

const moedaParaInput = (valor) => {
  const numero = numeroSeguro(valor);
  if (!numero) return "";
  return String(arredondar(numero, 2)).replace(".", ",");
};

const percentualParaInput = (valor) => {
  const numero = numeroSeguro(valor);
  if (!numero) return "";
  return String(arredondar(numero, 2)).replace(".", ",");
};

const inputParaNumero = (valor) => numeroSeguro(valor);

const nomeConsultor = (item) => {
  const nome = item?.consultor || item?.nome || item?.nome_consultor || item?.vendedor || "";
  return String(nome || "").trim() || "Consultor sem nome";
};

const montarId = (...partes) =>
  partes
    .filter(Boolean)
    .map((p) =>
      String(p)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase()
    )
    .join("-");

function BarraProgresso({ percentual, danger = false }) {
  const valor = Math.max(0, Math.min(100, numeroSeguro(percentual)));
  return (
    <div className="mt-2 h-1.5 rounded-full bg-gray-100">
      <div
        className={`h-1.5 rounded-full transition-all ${danger ? "bg-red-500" : "bg-[#048187]"}`}
        style={{ width: `${valor}%` }}
      />
    </div>
  );
}

function CardResumo({ titulo, valor, subtitulo, percentual, labelMeta, valorMeta, destaque = "normal" }) {
  const corValor = destaque === "erro" ? "text-red-500" : destaque === "alerta" ? "text-orange-500" : "text-[#048187]";

  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-full min-w-0 transition-all hover:shadow-md">
      <div className="min-w-0">
        <div className="flex items-center justify-between mb-1 min-w-0">
          <h3 className="text-[10px] sm:text-[11px] font-bold uppercase text-gray-400 truncate pr-1 tracking-wide">
            {titulo}
          </h3>
        </div>
        <p className={`text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tighter truncate leading-tight mt-1 ${corValor}`}>
          {valor}
        </p>
        {percentual !== undefined ? (
          <div className="mt-2">
            <p className={`text-[10px] sm:text-[11px] font-bold truncate mb-1.5 ${destaque === "erro" ? "text-red-500" : "text-[#048187]"}`}>
              {Number(percentual || 0).toFixed(1)}% <span className="text-gray-400 font-medium">da meta</span>
            </p>
            <BarraProgresso percentual={percentual} danger={destaque === "erro"} />
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between min-w-0 gap-2 border-t border-gray-50 pt-3">
        <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase truncate">
          {labelMeta || subtitulo || ""}
        </p>
        {valorMeta ? <p className="text-xs sm:text-sm font-bold text-gray-700 truncate">{valorMeta}</p> : null}
      </div>
    </div>
  );
}

function Botao({ children, variant = "primary", className = "", ...props }) {
  const classes = {
    primary: "bg-[#048187] text-white hover:bg-[#036b70] shadow-sm",
    secondary: "bg-[#e6f6f7] text-[#048187] hover:bg-[#d8f0f1]",
    ghost: "bg-transparent text-gray-500 hover:bg-gray-100",
    danger: "bg-white text-red-500 border border-red-200 hover:bg-red-50",
  };

  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${classes[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function InputNumerico({ value, onChange, prefixo, sufixo, className = "", ...props }) {
  return (
    <div className={`flex items-center rounded-lg border border-gray-200 bg-white px-3 py-2 focus-within:border-[#048187] focus-within:ring-2 focus-within:ring-[#048187]/10 ${className}`}>
      {prefixo ? <span className="mr-2 text-xs font-bold text-gray-400">{prefixo}</span> : null}
      <input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 flex-1 bg-transparent text-sm font-medium text-gray-700 outline-none"
        inputMode="decimal"
        {...props}
      />
      {sufixo ? <span className="ml-2 text-xs font-bold text-gray-400">{sufixo}</span> : null}
    </div>
  );
}

function ModalConfiguracao({
  aberto,
  nucleo,
  dados,
  estruturasEditaveis,
  setEstruturasEditaveis,
  consultoresEditaveis,
  setConsultoresEditaveis,
  salvando,
  onFechar,
  onSalvar,
  onRedistribuir,
}) {
  const [aba, setAba] = useState("estruturas");
  const [buscaEstrutura, setBuscaEstrutura] = useState("");
  const [estruturaSelecionada, setEstruturaSelecionada] = useState(null);

  useEffect(() => {
    if (!aberto) return undefined;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflowAnterior;
    };
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    setAba("estruturas");
    setBuscaEstrutura("");
    setEstruturaSelecionada(estruturasEditaveis?.[0]?.estrutura || null);
  }, [aberto, estruturasEditaveis]);

  const estruturasFiltradas = useMemo(() => {
    const termo = buscaEstrutura.trim().toLowerCase();
    if (!termo) return estruturasEditaveis || [];
    return (estruturasEditaveis || []).filter((item) => String(item.estrutura || "").toLowerCase().includes(termo));
  }, [buscaEstrutura, estruturasEditaveis]);

  const consultoresDaEstrutura = useMemo(() => {
    if (!estruturaSelecionada) return [];
    return (consultoresEditaveis || []).filter((item) => item.estrutura === estruturaSelecionada);
  }, [consultoresEditaveis, estruturaSelecionada]);

  const resumo = useMemo(() => {
    const metaOficial = (estruturasEditaveis || []).reduce((acc, item) => acc + numeroSeguro(item.meta_oficial), 0);
    const metaGerencial = (estruturasEditaveis || []).reduce((acc, item) => acc + numeroSeguro(item.meta_gerencial), 0);
    const pesoEstruturas = (estruturasEditaveis || []).reduce((acc, item) => acc + numeroSeguro(item.peso), 0);
    const realizado = numeroSeguro(dados?.cards?.realizado || dados?.realizado || 0);
    return { metaOficial, metaGerencial, pesoEstruturas, realizado };
  }, [dados, estruturasEditaveis]);

  const metaEstruturaSelecionada = useMemo(() => {
    return (estruturasEditaveis || []).find((item) => item.estrutura === estruturaSelecionada) || null;
  }, [estruturasEditaveis, estruturaSelecionada]);

  const somaPesoConsultores = useMemo(
    () => consultoresDaEstrutura.reduce((acc, item) => acc + numeroSeguro(item.peso), 0),
    [consultoresDaEstrutura]
  );

  const atualizarEstrutura = (estrutura, campo, valor) => {
    setEstruturasEditaveis((lista) =>
      (lista || []).map((item) => {
        if (item.estrutura !== estrutura) return item;
        const numero = inputParaNumero(valor);
        return { ...item, [campo]: numero, [`${campo}_input`]: valor };
      })
    );
  };

  const atualizarConsultor = (idLinha, campo, valor) => {
    setConsultoresEditaveis((lista) =>
      (lista || []).map((item) => {
        const id = montarId(item.estrutura, item.id_colaborador, nomeConsultor(item));
        if (id !== idLinha) return item;
        const numero = inputParaNumero(valor);
        return { ...item, [campo]: numero, [`${campo}_input`]: valor };
      })
    );
  };

  const redistribuirConsultores = () => {
    if (!estruturaSelecionada || !metaEstruturaSelecionada || !consultoresDaEstrutura.length) return;
    const qtd = consultoresDaEstrutura.length;
    const pesoBase = qtd ? 100 / qtd : 0;
    const metaBase = qtd ? numeroSeguro(metaEstruturaSelecionada.meta_gerencial) / qtd : 0;

    setConsultoresEditaveis((lista) =>
      (lista || []).map((item) => {
        if (item.estrutura !== estruturaSelecionada) return item;
        return {
          ...item,
          peso: arredondar(pesoBase, 2),
          peso_input: percentualParaInput(pesoBase),
          meta_gerencial: arredondar(metaBase, 2),
          meta_gerencial_input: moedaParaInput(metaBase),
        };
      })
    );
  };

  if (!aberto) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "rgba(15, 23, 42, 0.68)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          width: "min(1280px, calc(100vw - 48px))",
          height: "min(820px, calc(100vh - 48px))",
          maxHeight: "calc(100vh - 48px)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: "20px",
          background: "#f8fafc",
          boxShadow: "0 28px 80px rgba(15, 23, 42, 0.38)",
          border: "1px solid rgba(255,255,255,0.6)",
        }}
      >
        <div className="shrink-0 border-b border-gray-100 bg-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e6f6f7] text-[#048187]">
                <Settings size={21} />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-700 truncate">Configurar Meta Gerencial {nucleo}</h2>
                <p className="mt-1 text-sm text-gray-400">Cadastre a meta do núcleo, distribua por estrutura e divida cada estrutura entre os consultores.</p>
              </div>
            </div>
            <button type="button" onClick={onFechar} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700">
              <X size={21} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <CardResumo titulo="Meta oficial" valor={formatarMoeda(resumo.metaOficial)} subtitulo="Meta real do núcleo" />
            <CardResumo titulo="Meta gerencial" valor={formatarMoeda(resumo.metaGerencial)} subtitulo="Soma das estruturas" />
            <CardResumo titulo="Realizado" valor={formatarMoeda(resumo.realizado)} subtitulo="Resultado atual" />
            <CardResumo
              titulo="Peso estruturas"
              valor={formatarPercentual(resumo.pesoEstruturas)}
              subtitulo={Math.abs(resumo.pesoEstruturas - 100) <= 0.2 ? "Distribuição ok" : "Ajuste para 100%"}
              destaque={Math.abs(resumo.pesoEstruturas - 100) <= 0.2 ? "normal" : "alerta"}
            />
          </div>

          <div className="mt-5 rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex gap-2 rounded-lg bg-gray-100 p-1">
                <button type="button" onClick={() => setAba("estruturas")} className={`rounded-md px-4 py-2 text-xs font-black transition ${aba === "estruturas" ? "bg-[#048187] text-white shadow" : "text-[#048187] hover:bg-white"}`}>Metas por estrutura</button>
                <button type="button" onClick={() => setAba("consultores")} className={`rounded-md px-4 py-2 text-xs font-black transition ${aba === "consultores" ? "bg-[#048187] text-white shadow" : "text-[#048187] hover:bg-white"}`}>Divisão por consultores</button>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative min-w-[260px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                  <input value={buscaEstrutura} onChange={(e) => setBuscaEstrutura(e.target.value)} placeholder="Buscar estrutura..." className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-10 pr-3 text-sm text-gray-600 outline-none focus:border-[#048187]" />
                </div>

                {aba === "estruturas" ? (
                  <Botao variant="secondary" onClick={onRedistribuir}>
                    <Calculator size={17} /> Redistribuir estruturas
                  </Botao>
                ) : (
                  <Botao variant="secondary" onClick={redistribuirConsultores} disabled={!estruturaSelecionada}>
                    <Users size={17} /> Dividir consultores
                  </Botao>
                )}
              </div>
            </div>

            {aba === "estruturas" ? (
              <div className="max-h-[430px] overflow-auto px-5 pb-5">
                <table className="w-full min-w-[1050px] text-sm">
                  <thead className="sticky top-0 z-10 bg-white">
                    <tr className="border-b border-gray-100 text-left text-[11px] font-bold uppercase text-gray-400">
                      <th className="px-2 py-4">Estrutura</th>
                      <th className="px-2 py-4">Peso %</th>
                      <th className="px-2 py-4 text-right">Meta Oficial</th>
                      <th className="px-2 py-4">Meta Gerencial</th>
                      <th className="px-2 py-4 text-right">Realizado</th>
                      <th className="px-2 py-4 text-right">% Ger.</th>
                      <th className="px-2 py-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {estruturasFiltradas.map((item) => {
                      const percentual = numeroSeguro(item.meta_gerencial) ? (numeroSeguro(item.realizado) / numeroSeguro(item.meta_gerencial)) * 100 : 0;
                      return (
                        <tr key={item.estrutura} className="text-gray-700 hover:bg-[#e6f6f7]/60">
                          <td className="px-2 py-3 font-bold text-gray-700">{item.estrutura}</td>
                          <td className="px-2 py-3"><InputNumerico value={item.peso_input ?? percentualParaInput(item.peso)} onChange={(valor) => atualizarEstrutura(item.estrutura, "peso", valor)} sufixo="%" /></td>
                          <td className="px-2 py-3 text-right font-bold text-gray-500">{formatarMoedaCompleta(item.meta_oficial)}</td>
                          <td className="px-2 py-3"><InputNumerico value={item.meta_gerencial_input ?? moedaParaInput(item.meta_gerencial)} onChange={(valor) => atualizarEstrutura(item.estrutura, "meta_gerencial", valor)} prefixo="R$" /></td>
                          <td className="px-2 py-3 text-right font-bold text-[#048187]">{formatarMoeda(item.realizado)}</td>
                          <td className="px-2 py-3 text-right font-bold text-[#048187]">{formatarPercentual(percentual)}<BarraProgresso percentual={percentual} /></td>
                          <td className="px-2 py-3 text-right"><button type="button" onClick={() => { setEstruturaSelecionada(item.estrutura); setAba("consultores"); }} className="inline-flex items-center gap-1 rounded-lg bg-[#048187] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#036b70]">Consultores <ChevronRight size={14} /></button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid min-h-[360px] grid-cols-1 lg:grid-cols-[290px_1fr]">
                <div className="border-b border-gray-100 bg-gray-50/70 p-4 lg:border-b-0 lg:border-r">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-gray-400">Escolha uma estrutura</p>
                  <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                    {estruturasFiltradas.map((item) => (
                      <button key={item.estrutura} type="button" onClick={() => setEstruturaSelecionada(item.estrutura)} className={`w-full rounded-xl border px-3 py-3 text-left transition ${estruturaSelecionada === item.estrutura ? "border-[#048187] bg-[#e6f6f7] text-[#048187]" : "border-gray-100 bg-white text-gray-600 hover:border-gray-200"}`}>
                        <p className="text-sm font-bold truncate">{item.estrutura}</p>
                        <p className="mt-1 text-xs text-gray-400">Meta: {formatarMoeda(item.meta_gerencial)}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="min-w-0 p-4">
                  {estruturaSelecionada ? (
                    <>
                      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                        <CardResumo titulo="Estrutura" valor={estruturaSelecionada.replace(/^\d+\s*-\s*/i, "")} subtitulo={estruturaSelecionada} />
                        <CardResumo titulo="Meta estrutura" valor={formatarMoeda(metaEstruturaSelecionada?.meta_gerencial || 0)} subtitulo="Meta gerencial" />
                        <CardResumo titulo="Peso consultores" valor={formatarPercentual(somaPesoConsultores)} subtitulo={Math.abs(somaPesoConsultores - 100) <= 0.2 ? "Distribuição ok" : "Ajuste para 100%"} destaque={Math.abs(somaPesoConsultores - 100) <= 0.2 ? "normal" : "alerta"} />
                      </div>

                      <div className="max-h-[310px] overflow-auto rounded-xl border border-gray-100">
                        <table className="w-full min-w-[900px] text-sm">
                          <thead className="sticky top-0 z-10 bg-white">
                            <tr className="border-b border-gray-100 text-left text-[11px] font-bold uppercase text-gray-400">
                              <th className="px-4 py-4">Consultor</th>
                              <th className="px-4 py-4">ID</th>
                              <th className="px-4 py-4">Peso %</th>
                              <th className="px-4 py-4">Meta Gerencial</th>
                              <th className="px-4 py-4 text-right">Realizado</th>
                              <th className="px-4 py-4 text-right">% Ger.</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 bg-white">
                            {consultoresDaEstrutura.map((item) => {
                              const idLinha = montarId(item.estrutura, item.id_colaborador, nomeConsultor(item));
                              const percentual = numeroSeguro(item.meta_gerencial) ? (numeroSeguro(item.realizado) / numeroSeguro(item.meta_gerencial)) * 100 : 0;
                              return (
                                <tr key={idLinha} className="hover:bg-[#e6f6f7]/60">
                                  <td className="px-4 py-3 font-bold text-gray-700">{nomeConsultor(item)}</td>
                                  <td className="px-4 py-3 text-xs font-bold text-gray-400">{item.id_colaborador || "-"}</td>
                                  <td className="px-4 py-3"><InputNumerico value={item.peso_input ?? percentualParaInput(item.peso)} onChange={(valor) => atualizarConsultor(idLinha, "peso", valor)} sufixo="%" /></td>
                                  <td className="px-4 py-3"><InputNumerico value={item.meta_gerencial_input ?? moedaParaInput(item.meta_gerencial)} onChange={(valor) => atualizarConsultor(idLinha, "meta_gerencial", valor)} prefixo="R$" /></td>
                                  <td className="px-4 py-3 text-right font-bold text-[#048187]">{formatarMoeda(item.realizado)}</td>
                                  <td className="px-4 py-3 text-right font-bold text-[#048187]">{formatarPercentual(percentual)}<BarraProgresso percentual={percentual} /></td>
                                </tr>
                              );
                            })}
                            {!consultoresDaEstrutura.length ? (
                              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm font-bold text-gray-400">Nenhum consultor encontrado para essa estrutura.</td></tr>
                            ) : null}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full min-h-[280px] items-center justify-center rounded-xl border border-dashed border-gray-200 text-center">
                      <div>
                        <Users className="mx-auto text-gray-300" size={42} />
                        <p className="mt-3 text-sm font-bold text-gray-500">Selecione uma estrutura</p>
                        <p className="mt-1 text-xs text-gray-400">Depois divida a meta gerencial entre os consultores.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-t border-gray-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <AlertCircle size={16} />
            Ao salvar, a meta gerencial do núcleo será a soma das metas cadastradas nas estruturas.
          </div>
          <div className="flex gap-3">
            <Botao variant="ghost" onClick={onFechar} disabled={salvando}>Cancelar</Botao>
            <Botao onClick={onSalvar} disabled={salvando}>{salvando ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />} Salvar metas</Botao>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function CampoConsultor({ label, valor, cor = "text-gray-700" }) {
  return (
    <div className="min-w-0 rounded-lg bg-gray-50/70 px-3 py-2">
      <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-gray-400 truncate leading-none">{label}</p>
      <p className={`mt-1.5 text-[11px] sm:text-xs font-bold truncate leading-tight ${cor}`}>{valor}</p>
    </div>
  );
}


function CardIndicador({ titulo, valor, subtitulo, percentual, cor = "normal" }) {
  const classeValor = cor === "vermelho" ? "text-[#7f1d2d]" : cor === "laranja" ? "text-orange-600" : "text-[#048187]";
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 min-w-0 transition-all hover:shadow-md">
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 truncate">{titulo}</p>
      <p className={`mt-2 text-xl sm:text-2xl font-extrabold tracking-tight truncate ${classeValor}`}>{valor}</p>
      {percentual !== undefined ? <BarraProgresso percentual={percentual} danger={cor === "vermelho"} /> : null}
      {subtitulo ? <p className="mt-3 border-t border-gray-50 pt-2 text-[10px] font-bold uppercase text-gray-400 truncate">{subtitulo}</p> : null}
    </div>
  );
}

const somaLista = (lista, campo) => (lista || []).reduce((acc, item) => acc + numeroSeguro(item?.[campo]), 0);
const mediaPonderada = (lista, campo, pesoCampo = "quantidade_pedidos") => {
  const pesoTotal = somaLista(lista, pesoCampo) || somaLista(lista, "pedidos");
  if (!pesoTotal) return 0;
  return (lista || []).reduce((acc, item) => acc + numeroSeguro(item?.[campo]) * numeroSeguro(item?.[pesoCampo] ?? item?.pedidos), 0) / pesoTotal;
};

const calcularIndicadores = ({ listaEstruturas = [], itemEstrutura = null, cards = {} }) => {
  const lista = itemEstrutura ? [itemEstrutura] : listaEstruturas;
  const metaOficial = itemEstrutura ? numeroSeguro(itemEstrutura.meta_oficial) : numeroSeguro(cards.meta_oficial || somaLista(lista, "meta_oficial"));
  const metaGerencial = itemEstrutura ? numeroSeguro(itemEstrutura.meta_gerencial) : numeroSeguro(cards.meta_gerencial || somaLista(lista, "meta_gerencial"));
  const realizado = itemEstrutura ? numeroSeguro(itemEstrutura.realizado) : numeroSeguro(cards.realizado || somaLista(lista, "realizado"));
  const pedidos = itemEstrutura ? numeroSeguro(itemEstrutura.quantidade_pedidos ?? itemEstrutura.pedidos) : somaLista(lista, "quantidade_pedidos") || somaLista(lista, "pedidos");
  const baseAtiva = itemEstrutura ? numeroSeguro(itemEstrutura.base_ativa) : somaLista(lista, "base_ativa");
  const atividade = itemEstrutura ? numeroSeguro(itemEstrutura.atividade_realizada) : somaLista(lista, "atividade_realizada");
  const make = itemEstrutura ? numeroSeguro(itemEstrutura.make_realizado) : somaLista(lista, "make_realizado");
  const cabelo = itemEstrutura ? numeroSeguro(itemEstrutura.cabelo_realizado) : somaLista(lista, "cabelo_realizado");
  const rpa = atividade > 0 ? realizado / atividade : 0;
  const tktMedio = pedidos > 0 ? realizado / pedidos : 0;
  const upa = itemEstrutura ? numeroSeguro(itemEstrutura.upa) : mediaPonderada(lista, "upa", "quantidade_pedidos");

  return {
    percentual_rec: metaGerencial > 0 ? (realizado / metaGerencial) * 100 : 0,
    atividade,
    percentual_atividade: baseAtiva > 0 ? (atividade / baseAtiva) * 100 : 0,
    rpa,
    tkt_medio: tktMedio,
    upa,
    make_realizado: make,
    percentual_make: atividade > 0 ? (make / atividade) * 100 : 0,
    cabelo_realizado: cabelo,
    percentual_cabelo: atividade > 0 ? (cabelo / atividade) * 100 : 0,
    meta_oficial: metaOficial,
    meta_gerencial: metaGerencial,
    realizado,
    pedidos,
    base_ativa: baseAtiva,
  };
};
function GridIndicadores({ titulo, subtitulo, indicadores }) {
  const itens = [
    { titulo: "% Rec.", valor: formatarPercentual(indicadores.percentual_rec), subtitulo: "Meta gerencial", percentual: indicadores.percentual_rec },
    { titulo: "Ativ.", valor: numeroSeguro(indicadores.atividade).toLocaleString("pt-BR"), subtitulo: "Revendedores ativos" },
    { titulo: "% Ativ.", valor: formatarPercentual(indicadores.percentual_atividade), subtitulo: "Ativos / base", percentual: indicadores.percentual_atividade, cor: "laranja" },
    { titulo: "RPA", valor: formatarMoedaCompleta(indicadores.rpa), subtitulo: "Receita por ativo" },
    { titulo: "Tkt Méd.", valor: formatarMoedaCompleta(indicadores.tkt_medio), subtitulo: "Receita por pedido" },
    { titulo: "UPA", valor: numeroSeguro(indicadores.upa).toLocaleString("pt-BR", { maximumFractionDigits: 1 }), subtitulo: "Unid. por pedido" },
    { titulo: "MAKE", valor: numeroSeguro(indicadores.make_realizado).toLocaleString("pt-BR"), subtitulo: "Realizado Make" },
    { titulo: "% Make", valor: formatarPercentual(indicadores.percentual_make), subtitulo: "Make / ativos", percentual: indicadores.percentual_make, cor: "laranja" },
    { titulo: "CABELO", valor: numeroSeguro(indicadores.cabelo_realizado).toLocaleString("pt-BR"), subtitulo: "Realizado Cabelo", cor: "vermelho" },
    { titulo: "% Cab.", valor: formatarPercentual(indicadores.percentual_cabelo), subtitulo: "Cabelo / ativos", percentual: indicadores.percentual_cabelo, cor: "vermelho" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg sm:text-xl font-bold text-gray-700">{titulo}</h2>
        {subtitulo ? <p className="text-sm text-gray-400">{subtitulo}</p> : null}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {itens.map((item) => <CardIndicador key={item.titulo} {...item} />)}
      </div>
    </div>
  );
}

export default function TelaGestaoNucleo({ nucleo = "N1", cicloAtivo = "08/2026", apiBase = API_BASE }) {
  const nucleoNormalizado = normalizarNucleo(nucleo);
  const [dados, setDados] = useState(null);
  const [infoCiclo, setInfoCiclo] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [estruturasEditaveis, setEstruturasEditaveis] = useState([]);
  const [consultoresEditaveis, setConsultoresEditaveis] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [estruturaPainel, setEstruturaPainel] = useState(null);

  const carregarResumo = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const { data } = await axios.get(`${apiBase}/gestao-nucleos/${nucleoNormalizado}/resumo`, {
        params: { ciclo: cicloAtivo },
      });
      setDados(data || {});

      try {
        const respostaCiclos = await axios.get(`${apiBase}/ciclos`);
        const listaCiclos = respostaCiclos?.data?.ciclos || [];
        const cicloEncontrado = listaCiclos.find((item) => String(item?.ciclo || "").trim() === String(cicloAtivo || "").trim());
        setInfoCiclo(cicloEncontrado || null);
      } catch (_) {
        setInfoCiclo(null);
      }

      const primeira = data?.estruturas?.[0]?.estrutura || null;
      setEstruturaPainel((atual) => atual || primeira);
    } catch (error) {
      const mensagem = error?.response?.data?.detail || error?.response?.data?.message || error?.message || "Erro ao carregar gestão do núcleo.";
      setErro(mensagem);
    } finally {
      setCarregando(false);
    }
  }, [apiBase, cicloAtivo, nucleoNormalizado]);

  useEffect(() => {
    carregarResumo();
  }, [carregarResumo]);

  const abrirConfiguracao = () => {
    const estruturas = (dados?.estruturas || []).map((item) => ({
      ...item,
      peso_input: percentualParaInput(item.peso),
      meta_gerencial_input: moedaParaInput(item.meta_gerencial),
    }));

    const consultores = (dados?.consultores || dados?.consultores_por_estrutura || []).map((item) => ({
      ...item,
      peso_input: percentualParaInput(item.peso),
      meta_gerencial_input: moedaParaInput(item.meta_gerencial),
    }));

    setEstruturasEditaveis(estruturas);
    setConsultoresEditaveis(consultores);
    setModalAberto(true);
  };

  const redistribuirEstruturas = () => {
    const somaOficial = (estruturasEditaveis || []).reduce((acc, item) => acc + numeroSeguro(item.meta_oficial), 0);
    const somaGerencialAtual = (estruturasEditaveis || []).reduce((acc, item) => acc + numeroSeguro(item.meta_gerencial), 0);
    const metaBase = somaGerencialAtual || somaOficial;

    setEstruturasEditaveis((lista) =>
      (lista || []).map((item) => {
        const peso = somaOficial ? (numeroSeguro(item.meta_oficial) / somaOficial) * 100 : lista.length ? 100 / lista.length : 0;
        const meta = metaBase * (peso / 100);
        return {
          ...item,
          peso: arredondar(peso, 2),
          peso_input: percentualParaInput(peso),
          meta_gerencial: arredondar(meta, 2),
          meta_gerencial_input: moedaParaInput(meta),
        };
      })
    );
  };

  const salvarConfiguracao = async () => {
    setSalvando(true);
    setErro("");
    try {
      const metaGerencialNucleo = (estruturasEditaveis || []).reduce(
        (acc, item) => acc + numeroSeguro(item.meta_gerencial),
        0
      );

      const payload = {
        ciclo: cicloAtivo,
        nucleo: nucleoNormalizado,
        meta_gerencial_nucleo: metaGerencialNucleo,
        observacao: `Meta gerencial ${nucleoNormalizado} - ${cicloAtivo}`,
        estruturas: (estruturasEditaveis || []).map((item) => ({
          estrutura: item.estrutura,
          peso: numeroSeguro(item.peso),
          meta_oficial: numeroSeguro(item.meta_oficial),
          meta_gerencial: numeroSeguro(item.meta_gerencial),
        })),
        consultores: (consultoresEditaveis || []).map((item) => ({
          estrutura: item.estrutura,
          id_colaborador: item.id_colaborador,
          consultor: nomeConsultor(item),
          peso: numeroSeguro(item.peso),
          meta_gerencial: numeroSeguro(item.meta_gerencial),
        })),
      };

      await axios.post(`${apiBase}/gestao-nucleos/${nucleoNormalizado}/salvar`, payload);
      setModalAberto(false);
      await carregarResumo();
    } catch (error) {
      const detalhe = error?.response?.data?.detail || error?.response?.data?.message || error?.message;
      const mensagem = Array.isArray(detalhe)
        ? detalhe.map((item) => item?.msg || JSON.stringify(item)).join(" | ")
        : typeof detalhe === "object" && detalhe !== null
          ? JSON.stringify(detalhe)
          : detalhe || "Erro ao salvar metas gerenciais.";
      setErro(mensagem);
    } finally {
      setSalvando(false);
    }
  };

  const consultoresTodos = useMemo(() => dados?.consultores || dados?.consultores_por_estrutura || [], [dados]);

  const estruturasComIndicadores = useMemo(() => {
    return (dados?.estruturas || []).map((estrutura) => {
      const consultoresEstrutura = consultoresTodos.filter((consultor) => consultor.estrutura === estrutura.estrutura);
      const makeConsultores = somaLista(consultoresEstrutura, "make_realizado");
      const cabeloConsultores = somaLista(consultoresEstrutura, "cabelo_realizado");
      const atividade = numeroSeguro(estrutura.atividade_realizada);
      const makeFinal = numeroSeguro(estrutura.make_realizado) || makeConsultores;
      const cabeloFinal = numeroSeguro(estrutura.cabelo_realizado) || cabeloConsultores;

      return {
        ...estrutura,
        make_realizado: makeFinal,
        cabelo_realizado: cabeloFinal,
        percentual_make: numeroSeguro(estrutura.percentual_make) || (atividade > 0 ? (makeFinal / atividade) * 100 : 0),
        percentual_cabelo: numeroSeguro(estrutura.percentual_cabelo) || (atividade > 0 ? (cabeloFinal / atividade) * 100 : 0),
      };
    });
  }, [dados, consultoresTodos]);

  const estruturasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const lista = estruturasComIndicadores || [];
    if (!termo) return lista;
    return lista.filter((item) => String(item.estrutura || "").toLowerCase().includes(termo));
  }, [busca, estruturasComIndicadores]);

  const consultoresPainel = useMemo(() => {
    if (!estruturaPainel) return [];
    return consultoresTodos.filter((item) => item.estrutura === estruturaPainel);
  }, [consultoresTodos, estruturaPainel]);

  const estruturaSelecionada = useMemo(() => {
    return (estruturasComIndicadores || []).find((item) => item.estrutura === estruturaPainel) || null;
  }, [estruturasComIndicadores, estruturaPainel]);

  const cards = dados?.cards || {
    meta_oficial: dados?.meta_oficial_nucleo || 0,
    meta_gerencial: dados?.meta_gerencial_nucleo || 0,
    realizado: dados?.realizado_total || 0,
    percentual_gerencial: dados?.percentual_gerencial || 0,
    gap_gerencial: dados?.gap_gerencial || 0,
  };

  const tendenciaGerencial = useMemo(
    () => calcularTendenciaGerencial({ realizado: cards.realizado, metaGerencial: cards.meta_gerencial, infoCiclo, dados }),
    [cards.realizado, cards.meta_gerencial, infoCiclo, dados]
  );

  const indicadoresGerais = useMemo(() => calcularIndicadores({ listaEstruturas: estruturasComIndicadores, cards }), [estruturasComIndicadores, cards]);
  const indicadoresEstruturaSelecionada = useMemo(
    () => calcularIndicadores({ itemEstrutura: estruturaSelecionada || {}, cards }),
    [estruturaSelecionada, cards]
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-full bg-[#048187] text-white flex items-center justify-center shadow-sm shrink-0">
              <Target size={22} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-700 tracking-tight truncate">Meta Gerencial {nucleoNormalizado}</h1>
              <p className="text-sm text-gray-400 truncate">Gestão estratégica do Núcleo {nucleoNormalizado.replace("N", "")}: meta gerencial por estrutura e por consultor.</p>
            </div>
          </div>

          <div className="flex gap-3 shrink-0">
            <Botao variant="secondary" onClick={abrirConfiguracao}><Settings size={17} /> Configurar metas</Botao>
            <Botao onClick={carregarResumo} disabled={carregando}>{carregando ? <Loader2 className="animate-spin" size={17} /> : <RefreshCw size={17} />} Atualizar</Botao>
          </div>
        </div>
      </div>

      {erro ? <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-600">{erro}</div> : null}

      {carregando ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="text-center">
            <Loader2 className="mx-auto animate-spin text-[#048187]" size={36} />
            <p className="mt-3 text-sm font-bold text-gray-400">Carregando dados do núcleo...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <CardResumo
              titulo="Meta gerencial"
              valor={formatarMoeda(cards.meta_gerencial)}
              subtitulo="Meta gerencial definida para o núcleo"
              labelMeta="Meta gerencial"
              valorMeta={formatarMoeda(cards.meta_gerencial)}
            />
            <CardResumo
              titulo="Realizado"
              valor={formatarMoeda(cards.realizado)}
              subtitulo="Resultado atual"
              percentual={cards.percentual_gerencial}
              labelMeta="% da meta"
              valorMeta={formatarPercentual(cards.percentual_gerencial)}
            />
            <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-full min-w-0 transition-all hover:shadow-md">
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[10px] sm:text-[11px] font-bold uppercase text-gray-400 truncate tracking-wide">Tendência</h3>
                  <Eye size={15} className="text-[#048187]" />
                </div>
                <div className="mt-2 flex items-center gap-2 min-w-0">
                  <p className={`text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tighter truncate leading-tight ${tendenciaGerencial.risco ? "text-red-500" : "text-[#048187]"}`}>
                    {formatarMoeda(tendenciaGerencial.valor)}
                  </p>
                  <span className={`text-lg font-black ${tendenciaGerencial.risco ? "text-red-500" : "text-[#048187]"}`}>
                    {tendenciaGerencial.risco ? "⌁" : "↗"}
                  </span>
                </div>
                <p className={`mt-1 text-[10px] sm:text-[11px] font-bold ${tendenciaGerencial.risco ? "text-red-500" : "text-[#048187]"}`}>
                  {tendenciaGerencial.status}
                </p>
                <BarraProgresso percentual={tendenciaGerencial.percentual} danger={tendenciaGerencial.risco} />
              </div>
              <div className="mt-4 flex items-center justify-between min-w-0 gap-2 border-t border-gray-50 pt-3">
                <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase truncate">Gap tendência:</p>
                <p className={`text-xs sm:text-sm font-bold truncate ${tendenciaGerencial.gap < 0 ? "text-gray-700" : "text-[#048187]"}`}>
                  {formatarMoeda(tendenciaGerencial.gap)}
                </p>
              </div>
            </div>
          </div>

          <GridIndicadores
            titulo={`Indicadores gerais do ${nucleoNormalizado}`}
            subtitulo="Resumo consolidado do núcleo com base nas estruturas e consultores."
            indicadores={indicadoresGerais}
          />

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-700">Estruturas do {nucleoNormalizado}</h2>
                <p className="text-sm text-gray-400">Acompanhamento da meta gerencial distribuída por estrutura.</p>
              </div>
              <div className="relative min-w-[280px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar estrutura..." className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-10 pr-3 text-sm text-gray-600 outline-none focus:border-[#048187]" />
              </div>
            </div>

            <div className="max-h-[520px] overflow-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="sticky top-0 z-10 bg-white">
                  <tr className="border-b border-gray-100 text-left text-[11px] font-bold uppercase text-gray-400">
                    <th className="px-2 py-4">Estrutura</th>
                    <th className="px-2 py-4 text-right">Meta Gerencial</th>
                    <th className="px-2 py-4 text-right">Realizado</th>
                    <th className="px-2 py-4 text-right">% Ger.</th>
                    <th className="px-2 py-4 text-right">Gap</th>
                    <th className="px-2 py-4 text-right">Pedidos</th>
                    <th className="px-2 py-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {estruturasFiltradas.map((item) => {
                    const selecionada = item.estrutura === estruturaPainel;
                    return (
                      <tr key={item.estrutura} className={`${selecionada ? "bg-[#e6f6f7]" : "hover:bg-gray-50"} transition-colors`}>
                        <td className="px-2 py-4 font-bold text-gray-700">{item.estrutura}</td>
                        <td className="px-2 py-4 text-right font-bold text-gray-700">{formatarMoeda(item.meta_gerencial)}</td>
                        <td className="px-2 py-4 text-right font-bold text-[#048187]">{formatarMoeda(item.realizado)}</td>
                        <td className="px-2 py-4 text-right font-bold text-[#048187]">{formatarPercentual(item.percentual_gerencial)}</td>
                        <td className={`px-2 py-4 text-right font-bold ${numeroSeguro(item.gap_gerencial) > 0 ? "text-red-500" : "text-[#048187]"}`}>{formatarMoeda(item.gap_gerencial)}</td>
                        <td className="px-2 py-4 text-right font-bold text-gray-700">{numeroSeguro(item.pedidos ?? item.quantidade_pedidos).toLocaleString("pt-BR")}</td>
                        <td className="px-2 py-4 text-right"><button type="button" onClick={() => setEstruturaPainel(item.estrutura)} className="inline-flex items-center gap-1 rounded-lg bg-[#048187] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#036b70]">Ver <ChevronRight size={14} /></button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {estruturaSelecionada ? (
            <GridIndicadores
              titulo={`Indicadores da estrutura`}
              subtitulo={estruturaSelecionada.estrutura}
              indicadores={indicadoresEstruturaSelecionada}
            />
          ) : null}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
            <div className="mb-5 flex flex-col gap-3 border-b border-gray-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e6f6f7] text-[#048187] shrink-0"><Users size={20} /></div>
                <div>
                  <h2 className="text-xl font-bold text-gray-700">Ranking individual</h2>
                  <p className="text-sm text-gray-400">{estruturaSelecionada?.estrutura || "Selecione uma estrutura"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:min-w-[420px]">
                <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                  <p className="text-[10px] font-bold uppercase text-gray-400">Meta estrutura</p>
                  <p className="mt-1 text-xl font-extrabold text-[#048187] tracking-tight">{formatarMoeda(estruturaSelecionada?.meta_gerencial || 0)}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                  <p className="text-[10px] font-bold uppercase text-gray-400">Realizado</p>
                  <p className="mt-1 text-xl font-extrabold text-[#048187] tracking-tight">{formatarMoeda(estruturaSelecionada?.realizado || 0)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {consultoresPainel.map((item, index) => {
                const percentualGerencial = numeroSeguro(item.percentual_gerencial);
                return (
                  <div key={montarId(item.estrutura, item.id_colaborador, nomeConsultor(item))} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#048187] text-xs font-bold text-white">{index + 1}</div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold uppercase tracking-tight text-gray-700">{nomeConsultor(item)}</p>
                          <p className="mt-1 text-xs text-gray-400">
                            ID: {item.id_colaborador || "-"} • Peso: {formatarPercentual(item.peso)} • Pedidos: {numeroSeguro(item.quantidade_pedidos ?? item.pedidos).toLocaleString("pt-BR")}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xl font-extrabold text-[#048187] leading-none">{formatarPercentual(percentualGerencial)}</p>
                        <p className="mt-1 text-[9px] font-bold uppercase text-gray-400">da meta gerencial</p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-50 pt-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-11">
                      <CampoConsultor label="Meta Ger." valor={formatarMoeda(item.meta_gerencial)} />
                      <CampoConsultor label="Realizado" valor={formatarMoeda(item.realizado)} cor="text-[#048187]" />
                      <CampoConsultor label="Atividade" valor={numeroSeguro(item.atividade_realizada).toLocaleString("pt-BR")} cor="text-[#048187]" />
                      <CampoConsultor label="% Ativ." valor={formatarPercentual(item.percentual_atividade)} cor="text-orange-600" />
                      <CampoConsultor label="RPA" valor={formatarMoedaCompleta(item.rpa)} />
                      <CampoConsultor label="Tkt Médio" valor={formatarMoedaCompleta(item.tkt_medio)} />
                      <CampoConsultor label="UPA" valor={numeroSeguro(item.upa).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} />
                      <CampoConsultor label="MAKE" valor={numeroSeguro(item.make_realizado).toLocaleString("pt-BR")} cor="text-[#048187]" />
                      <CampoConsultor label="% MAKE" valor={formatarPercentual(item.percentual_make)} cor="text-orange-600" />
                      <CampoConsultor label="CABELO" valor={numeroSeguro(item.cabelo_realizado).toLocaleString("pt-BR")} cor="text-[#7f1d2d]" />
                      <CampoConsultor label="% Cabelo" valor={formatarPercentual(item.percentual_cabelo)} cor="text-[#7f1d2d]" />
                    </div>
                  </div>
                );
              })}

              {!consultoresPainel.length ? (
                <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm font-bold text-gray-400">Nenhum consultor encontrado para essa estrutura.</div>
              ) : null}
            </div>
          </div>
        </>
      )}

      <ModalConfiguracao aberto={modalAberto} nucleo={nucleoNormalizado} dados={dados} estruturasEditaveis={estruturasEditaveis} setEstruturasEditaveis={setEstruturasEditaveis} consultoresEditaveis={consultoresEditaveis} setConsultoresEditaveis={setConsultoresEditaveis} salvando={salvando} onFechar={() => setModalAberto(false)} onSalvar={salvarConfiguracao} onRedistribuir={redistribuirEstruturas} />
    </div>
  );
}
