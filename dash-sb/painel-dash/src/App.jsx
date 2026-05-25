import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Tooltip,
  CartesianGrid,
  LabelList
} from 'recharts';
import {
  Eye,
  UserCircle,
  LayoutDashboard,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
  BarChart2,
  Users,
  Database,
  Settings,
  LogOut
} from 'lucide-react';
import logoEmpresa from './assets/LOGO VERDE SB.png';

export default function App() {
  const [sidebarExpandida, setSidebarExpandida] = useState(true);
  const [painelFiltrosAberto, setPainelFiltrosAberto] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [dados, setDados] = useState(null);
  const [modalDetalhes, setModalDetalhes] = useState(null);

  const [opcoesFiltros, setOpcoesFiltros] = useState({
    unidades: [],
    estruturas: [],
    consultores: [],
    situacoes: []
  });

  const filtroVazio = {
    unidades: [],
    estruturas: [],
    consultores: [],
    situacoes: [],
    data_inicio: '',
    data_fim: ''
  };

  const [filtrosAtivos, setFiltrosAtivos] = useState(filtroVazio);

  const CORES_GRAFICO = ['#048187', '#712231', '#F97316', '#FACC15', '#A3E635'];
  const CORES_CAPTACAO = ['#048187', '#257B9C', '#336190', '#56549E', '#7D449B', '#A3E635'];

  const META_FATURAMENTO = 3850000;
  const META_DIARIA = 140000;

  const itensMenuTopo = [
    {
      nome: 'Dashboard',
      icone: LayoutDashboard,
      ativo: true
    },
    {
      nome: 'Metas',
      icone: BarChart2,
      ativo: false
    },
    {
      nome: 'Consultores',
      icone: Users,
      ativo: false
    },
    {
      nome: 'Base',
      icone: Database,
      ativo: false
    }
  ];

  const carregarDashboard = async (filtros) => {
    setCarregando(true);

    try {
      const [resDados, resOpcoes] = await Promise.all([
        axios.post('http://127.0.0.1:8001/dashboard/dados', filtros),
        axios.get('http://127.0.0.1:8001/dashboard/opcoes-filtros')
      ]);

      setDados(resDados.data);
      setOpcoesFiltros(resOpcoes.data);
    } catch (erro) {
      console.error('Erro ao buscar dados:', erro);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDashboard(filtrosAtivos);
  }, []);

  const handleAplicarFiltros = () => {
    carregarDashboard(filtrosAtivos);
    setPainelFiltrosAberto(false);
  };

  const handleRemoverFiltros = () => {
    setFiltrosAtivos(filtroVazio);
    carregarDashboard(filtroVazio);
    setPainelFiltrosAberto(false);
  };

  const toggleFiltroArray = (categoria, valor) => {
    setFiltrosAtivos((prev) => {
      const arrayAtual = prev[categoria];

      if (arrayAtual.includes(valor)) {
        return {
          ...prev,
          [categoria]: arrayAtual.filter((item) => item !== valor)
        };
      }

      return {
        ...prev,
        [categoria]: [...arrayAtual, valor]
      };
    });
  };

  const formatarValorAbreviado = (valor) => {
    const numero = Number(valor || 0);

    if (numero >= 1000000) {
      return `R$${(numero / 1000000).toLocaleString('pt-BR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 2
      })} Mi`;
    }

    if (numero >= 1000) {
      return `R$${(numero / 1000).toLocaleString('pt-BR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 2
      })} Mil`;
    }

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numero);
  };

  const formatarMoedaCompleta = (valor) => {
    const numero = Number(valor || 0);

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numero);
  };

  const calcularPercentualMeta = (realizado, meta) => {
    if (!meta || meta <= 0) return 0;
    return Math.min((Number(realizado || 0) / meta) * 100, 100);
  };

  const calcularValorFaltante = (realizado, meta) => {
    return Math.max(Number(meta || 0) - Number(realizado || 0), 0);
  };

  const abrirModalRealizadoTotal = () => {
    setModalDetalhes({
      titulo: 'Detalhes do Realizado Total',
      subtitulo: 'Valor completo considerando apenas: Aprovado, Transporte, Separação, Entregue e Pendente.',
      itens: [
        {
          label: 'Realizado Total',
          valor: formatarMoedaCompleta(dados.valor_total)
        },
        {
          label: 'Meta Faturamento',
          valor: formatarMoedaCompleta(META_FATURAMENTO)
        },
        {
          label: 'Percentual da Meta',
          valor: `${calcularPercentualMeta(dados.valor_total, META_FATURAMENTO).toFixed(2)}%`
        },
        {
          label: 'Valor Faltante',
          valor: formatarMoedaCompleta(calcularValorFaltante(dados.valor_total, META_FATURAMENTO))
        }
      ]
    });
  };

  const abrirModalRealizadoDiario = () => {
    setModalDetalhes({
      titulo: 'Detalhes do Realizado Diário',
      subtitulo: 'Valor completo do último dia com venda válida dentro dos filtros aplicados.',
      itens: [
        {
          label: 'Realizado Diário',
          valor: formatarMoedaCompleta(dados.realizado_diario || 0)
        },
        {
          label: 'Meta Diária',
          valor: formatarMoedaCompleta(META_DIARIA)
        },
        {
          label: 'Percentual da Meta',
          valor: `${calcularPercentualMeta(dados.realizado_diario || 0, META_DIARIA).toFixed(2)}%`
        },
        {
          label: 'Valor Faltante',
          valor: formatarMoedaCompleta(calcularValorFaltante(dados.realizado_diario || 0, META_DIARIA))
        }
      ]
    });
  };

  const abrirModalCancelados = () => {
    setModalDetalhes({
      titulo: 'Detalhes dos Pedidos Cancelados',
      subtitulo: 'Informações considerando somente pedidos com Situação Comercial igual a Cancelado.',
      itens: [
        {
          label: 'Quantidade de Pedidos Cancelados',
          valor: dados.total_cancelados
        },
        {
          label: 'Valor Líquido dos Cancelados',
          valor: formatarMoedaCompleta(dados.valor_cancelados_liquido || 0)
        }
      ]
    });
  };

  if (!dados && carregando) {
    return (
      <div className="flex h-screen items-center justify-center text-[#048187] font-bold text-xl">
        Carregando Dashboard...
      </div>
    );
  }

  if (!dados) {
    return (
      <div className="flex h-screen items-center justify-center text-red-500 font-bold text-xl">
        Não foi possível carregar os dados.
      </div>
    );
  }

  const meiosCaptacao = dados.meios_captacao || [];
  const realizadoPorMarca = dados.realizado_por_marca || [];

  const totalCaptacao = meiosCaptacao.reduce((acc, curr) => acc + Number(curr.value || 0), 0);
  const totalMarca = realizadoPorMarca.reduce((acc, curr) => acc + Number(curr.value || 0), 0);

  const meiosCaptacaoOrdenados = [...meiosCaptacao].sort(
    (a, b) => Number(b.value || 0) - Number(a.value || 0)
  );

  const realizadoPorMarcaOrdenado = [...realizadoPorMarca].sort(
    (a, b) => Number(b.value || 0) - Number(a.value || 0)
  );

  const PorcentagemLabel = (props) => {
    const { x, y, width, height, value } = props;
    const porcentagem = totalCaptacao > 0 ? ((Number(value || 0) / totalCaptacao) * 100).toFixed(1) : 0;

    return (
      <text
        x={x + width + 8}
        y={y + height / 2 + 4}
        fill="#475569"
        fontSize={12}
        fontWeight="bold"
      >
        {porcentagem}%
      </text>
    );
  };

  const LabelMarca = (props) => {
    const { name, percent } = props;
    const percentual = percent ? (percent * 100).toFixed(1) : '0.0';

    return `${name} ${percentual}%`;
  };

  return (
    <div className="flex h-screen bg-[#fcfbf7] font-sans overflow-hidden relative">

      <aside
        className={`bg-[#111111] text-gray-300 flex flex-col justify-between z-20 shadow-2xl transition-all duration-300 relative ${
          sidebarExpandida ? 'w-64' : 'w-20'
        }`}
      >
        <button
          onClick={() => setSidebarExpandida(!sidebarExpandida)}
          className="absolute -right-3 top-10 bg-[#62ccd1] text-white p-1 rounded-full shadow-lg hover:bg-[#5bb2b4] transition-colors z-30"
        >
          {sidebarExpandida ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        <div>
          <div
            className={`h-32 flex items-center justify-center border-b border-gray-800 transition-all ${
              sidebarExpandida ? 'p-6' : 'p-2'
            }`}
          >
            <img
              src={logoEmpresa}
              alt="Logo SB"
              className={`object-contain transition-all duration-300 ${
                sidebarExpandida ? 'max-h-20 w-auto' : 'max-h-10 w-10'
              }`}
            />
          </div>

          <nav className="p-4 space-y-4 mt-4 overflow-hidden">
            {itensMenuTopo.map((item) => {
              const Icone = item.icone;

              return (
                <a
                  key={item.nome}
                  href="#"
                  className={`flex items-center p-3 rounded-md transition-colors font-medium ${
                    sidebarExpandida ? 'gap-3' : 'justify-center'
                  } ${
                    item.ativo
                      ? 'bg-[#62ccd1] text-white'
                      : 'bg-[#242424] text-white hover:bg-[#333333]'
                  }`}
                >
                  <Icone size={20} className="min-w-[20px]" />
                  {sidebarExpandida && <span>{item.nome}</span>}
                </a>
              );
            })}
          </nav>
        </div>

        <div className="p-4 space-y-6">
          <div className="border-t border-gray-800 pt-6">
            <a
              href="#"
              className={`flex items-center p-3 rounded-md transition-colors font-medium bg-[#242424] text-white hover:bg-[#333333] ${
                sidebarExpandida ? 'gap-3' : 'justify-center'
              }`}
            >
              <Settings size={20} className="min-w-[20px]" />
              {sidebarExpandida && <span>Configurações</span>}
            </a>
          </div>

          <a
            href="#"
            className={`flex items-center p-3 rounded-md transition-colors font-medium bg-[#4a4a4a] text-white hover:bg-[#5a5a5a] ${
              sidebarExpandida ? 'gap-3 justify-center' : 'justify-center'
            }`}
          >
            <LogOut size={20} className="min-w-[20px]" />
            {sidebarExpandida && <span>Logout</span>}
          </a>
        </div>
      </aside>

      <div
        className={`fixed inset-y-0 right-0 w-[22rem] bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${
          painelFiltrosAberto ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2 text-[#048187] font-bold text-lg">
            <Filter size={20} />
            Filtros
          </div>

          <button
            onClick={() => setPainelFiltrosAberto(false)}
            className="text-gray-400 hover:text-red-500 bg-white rounded-full p-1 shadow-sm"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          <div>
            <h4 className="font-bold text-gray-600 mb-2 text-sm uppercase">
              Data de Captação
            </h4>

            <div className="flex gap-2">
              <input
                type="date"
                value={filtrosAtivos.data_inicio}
                onChange={(e) => setFiltrosAtivos({ ...filtrosAtivos, data_inicio: e.target.value })}
                className="w-full text-xs p-2 border border-gray-200 rounded-md outline-none focus:border-[#048187]"
                title="Data Inicial"
              />

              <input
                type="date"
                value={filtrosAtivos.data_fim}
                onChange={(e) => setFiltrosAtivos({ ...filtrosAtivos, data_fim: e.target.value })}
                className="w-full text-xs p-2 border border-gray-200 rounded-md outline-none focus:border-[#048187]"
                title="Data Final"
              />
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-600 mb-2 text-sm uppercase">
              Unidade
            </h4>

            <div className="max-h-32 overflow-y-auto bg-gray-50 border border-gray-100 rounded-md p-2 space-y-1">
              {opcoesFiltros.unidades.map((unidade) => (
                <label
                  key={unidade}
                  className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer hover:bg-gray-100 p-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={filtrosAtivos.unidades.includes(unidade)}
                    onChange={() => toggleFiltroArray('unidades', unidade)}
                    className="accent-[#048187]"
                  />
                  {unidade}
                </label>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-600 mb-2 text-sm uppercase">
              Estrutura
            </h4>

            <div className="max-h-32 overflow-y-auto bg-gray-50 border border-gray-100 rounded-md p-2 space-y-1">
              {opcoesFiltros.estruturas.map((estrutura) => (
                <label
                  key={estrutura}
                  className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer hover:bg-gray-100 p-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={filtrosAtivos.estruturas.includes(estrutura)}
                    onChange={() => toggleFiltroArray('estruturas', estrutura)}
                    className="accent-[#048187]"
                  />
                  {estrutura}
                </label>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-600 mb-2 text-sm uppercase">
              Consultor
            </h4>

            <div className="max-h-32 overflow-y-auto bg-gray-50 border border-gray-100 rounded-md p-2 space-y-1">
              {opcoesFiltros.consultores.map((consultor) => (
                <label
                  key={consultor}
                  className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer hover:bg-gray-100 p-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={filtrosAtivos.consultores.includes(consultor)}
                    onChange={() => toggleFiltroArray('consultores', consultor)}
                    className="accent-[#048187]"
                  />
                  {consultor}
                </label>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-600 mb-2 text-sm uppercase">
              Situação Comercial
            </h4>

            <div className="max-h-32 overflow-y-auto bg-gray-50 border border-gray-100 rounded-md p-2 space-y-1">
              {opcoesFiltros.situacoes.map((situacao) => (
                <label
                  key={situacao}
                  className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer hover:bg-gray-100 p-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={filtrosAtivos.situacoes.includes(situacao)}
                    onChange={() => toggleFiltroArray('situacoes', situacao)}
                    className="accent-[#048187]"
                  />
                  {situacao}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-white space-y-3">
          <button
            onClick={handleAplicarFiltros}
            className="w-full bg-[#048187] text-white font-bold py-3 rounded-lg hover:bg-[#5bb2b4] transition-colors shadow-sm"
          >
            Aplicar Filtros
          </button>

          <button
            onClick={handleRemoverFiltros}
            className="w-full border-2 border-red-500 text-red-500 font-bold py-2.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            Remover Todos
          </button>
        </div>
      </div>

      <main
        className={`flex-1 p-8 overflow-y-auto relative transition-all duration-300 ${
          painelFiltrosAberto ? 'opacity-50' : 'opacity-100'
        }`}
      >

        <header className="mb-8">
          <div className="w-full bg-[#5bb2b4] h-12 rounded-full flex justify-end items-center px-6 text-white shadow-sm gap-4">
            <button
              onClick={() => setPainelFiltrosAberto(true)}
              className="flex items-center gap-2 hover:bg-[#4a9394] px-3 py-1.5 rounded-full transition-colors font-medium"
            >
              <SlidersHorizontal size={18} />
              Filtros
            </button>

            <div className="w-px h-6 bg-[#4a9394]"></div>

            <UserCircle
              size={26}
              className="cursor-pointer hover:text-gray-200 transition-colors"
              strokeWidth={1.5}
            />
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-3">
              <h3 className="text-sm font-bold text-gray-600">Realizado Total</h3>

              <button
                onClick={abrirModalRealizadoTotal}
                className="text-[#048187] hover:text-[#036b70] transition-colors"
                title="Ver detalhes do realizado total"
              >
                <Eye size={15} />
              </button>
            </div>

            <p className="text-4xl font-bold text-[#048187] tracking-tight truncate">
              {formatarValorAbreviado(dados.valor_total)}
            </p>

            <p className="text-sm font-bold text-[#048187] mt-1">
              {calcularPercentualMeta(dados.valor_total, META_FATURAMENTO).toFixed(0)}%
              <span className="text-gray-400 font-medium ml-1">da meta</span>
            </p>

            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 mb-3">
              <div
                className="bg-[#048187] h-1.5 rounded-full"
                style={{
                  width: `${calcularPercentualMeta(dados.valor_total, META_FATURAMENTO)}%`
                }}
              ></div>
            </div>

            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase">
                  Meta faturamento:
                </p>

                <p className="text-2xl font-bold text-gray-500">
                  {formatarValorAbreviado(META_FATURAMENTO)}
                </p>
              </div>

              <p className="text-xs text-red-500 font-medium">
                Falta {Math.max(100 - calcularPercentualMeta(dados.valor_total, META_FATURAMENTO), 0).toFixed(0)}%
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-3">
              <h3 className="text-sm font-bold text-gray-600">Realizado Diário</h3>

              <button
                onClick={abrirModalRealizadoDiario}
                className="text-[#048187] hover:text-[#036b70] transition-colors"
                title="Ver detalhes do realizado diário"
              >
                <Eye size={15} />
              </button>
            </div>

            <p className="text-4xl font-bold text-[#048187] tracking-tight truncate">
              {formatarValorAbreviado(dados.realizado_diario || 0)}
            </p>

            <p className="text-sm font-bold text-[#048187] mt-1">
              {calcularPercentualMeta(dados.realizado_diario || 0, META_DIARIA).toFixed(0)}%
              <span className="text-gray-400 font-medium ml-1">da meta</span>
            </p>

            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 mb-3">
              <div
                className="bg-[#048187] h-1.5 rounded-full"
                style={{
                  width: `${calcularPercentualMeta(dados.realizado_diario || 0, META_DIARIA)}%`
                }}
              ></div>
            </div>

            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase">
                  Meta faturamento:
                </p>

                <p className="text-2xl font-bold text-gray-500">
                  {formatarValorAbreviado(META_DIARIA)}
                </p>
              </div>

              <p className="text-xs text-red-500 font-medium">
                Falta {Math.max(100 - calcularPercentualMeta(dados.realizado_diario || 0, META_DIARIA), 0).toFixed(0)}%
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-600 mb-3 border-b border-gray-100 pb-2">
              Total de pedidos
            </h3>

            <p className="text-4xl font-bold text-[#048187] tracking-tight">
              {dados.total_pedidos}
            </p>

            <p className="text-sm font-bold text-gray-600 mt-3">
              Total de pedidos cancelados
            </p>

            <div className="flex items-center gap-2 mt-1">
              <p className="text-4xl font-bold text-[#048187] tracking-tight">
                {dados.total_cancelados}
              </p>

              <button
                onClick={abrirModalCancelados}
                className="text-[#048187] hover:text-[#036b70] transition-colors"
                title="Ver detalhes dos pedidos cancelados"
              >
                <Eye size={15} />
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-600 mb-3 border-b border-gray-100 pb-2">
              Indicadores
            </h3>

            <div className="space-y-3 mt-4">
              <div className="bg-[#048187] text-white rounded-md px-4 py-1.5 flex justify-between items-center">
                <span className="text-sm font-bold">MAKE</span>
                <span className="text-sm font-bold">45%</span>
              </div>

              <div className="bg-[#712231] text-white rounded-md px-4 py-1.5 flex justify-between items-center">
                <span className="text-sm font-bold">CABELO</span>
                <span className="text-sm font-bold">41%</span>
              </div>

              <div className="bg-[#F97316] text-white rounded-md px-4 py-1.5 flex justify-between items-center">
                <span className="text-sm font-bold">ATIVIDADE</span>
                <span className="text-sm font-bold">88%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 col-span-1 lg:col-span-2 h-[24rem] flex flex-col">
            <h3 className="text-sm font-bold text-gray-600 text-center mb-6 border-b border-gray-100 pb-2">
              Vendas por dia de Captação
            </h3>

            <div className="flex-1 min-h-0 w-full">
              {dados.vendas_por_dia && dados.vendas_por_dia.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={dados.vendas_por_dia}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="corVendas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#048187" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#048187" stopOpacity={0} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />

                    <XAxis
                      dataKey="Data Captação"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickFormatter={(valor) => `R$${valor / 1000}k`}
                    />

                    <Tooltip
                      formatter={(value) => formatarMoedaCompleta(value)}
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />

                    <Area
                      type="monotone"
                      dataKey="ValorPraticado"
                      stroke="#048187"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#corVendas)"
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  Nenhuma venda neste filtro
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[24rem] flex flex-col">
            <h3 className="text-sm font-bold text-gray-600 text-center mb-4 border-b border-gray-100 pb-2">
              Realizado por Marca
            </h3>

            <div className="flex-1 min-h-0 relative flex flex-col">
              <div className="flex-1 min-h-0">
                {realizadoPorMarcaOrdenado.length > 0 && totalMarca > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={realizadoPorMarcaOrdenado}
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        stroke="none"
                        label={LabelMarca}
                        labelLine={true}
                      >
                        {realizadoPorMarcaOrdenado.map((entry, index) => (
                          <Cell
                            key={`cell-marca-${index}`}
                            fill={CORES_GRAFICO[index % CORES_GRAFICO.length]}
                          />
                        ))}
                      </Pie>

                      <Tooltip
                        formatter={(value, name) => [
                          formatarMoedaCompleta(value),
                          name
                        ]}
                        contentStyle={{
                          borderRadius: '8px',
                          border: 'none',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                    Nenhuma marca neste filtro
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[24rem] flex flex-col">
            <h3 className="text-sm font-bold text-gray-600 text-center mb-6 border-b border-gray-100 pb-2">
              Meios de Captação
            </h3>

            <div className="flex-1 min-h-0 w-full pr-6">
              {meiosCaptacaoOrdenados.length > 0 && totalCaptacao > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={meiosCaptacaoOrdenados}
                    margin={{ top: 10, right: 20, bottom: 0, left: 10 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={true}
                      vertical={true}
                      stroke="#f0f0f0"
                    />

                    <XAxis
                      type="number"
                      orientation="top"
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(valor) =>
                        totalCaptacao > 0 ? `${((valor / totalCaptacao) * 100).toFixed(0)}%` : '0%'
                      }
                      tick={{ fontSize: 11, fill: '#64748b' }}
                    />

                    <YAxis
                      dataKey="MeioCaptacao"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 11,
                        fill: '#334155',
                        fontWeight: 600
                      }}
                      width={90}
                    />

                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      formatter={(value) => [value, 'Pedidos']}
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none'
                      }}
                    />

                    <Bar dataKey="value" barSize={32} radius={[0, 4, 4, 0]}>
                      {meiosCaptacaoOrdenados.map((entry, index) => (
                        <Cell
                          key={`cell-captacao-${index}`}
                          fill={CORES_CAPTACAO[index % CORES_CAPTACAO.length]}
                        />
                      ))}

                      <LabelList dataKey="value" content={<PorcentagemLabel />} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  Nenhuma captação neste filtro
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {painelFiltrosAberto && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setPainelFiltrosAberto(false)}
        ></div>
      )}

      {modalDetalhes && (
        <div className="fixed inset-0 bg-black/40 z-[80] flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-700">
                  {modalDetalhes.titulo}
                </h2>

                <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                  {modalDetalhes.subtitulo}
                </p>
              </div>

              <button
                onClick={() => setModalDetalhes(null)}
                className="text-gray-400 hover:text-red-500 transition-colors bg-gray-50 rounded-full p-2"
                title="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {modalDetalhes.itens.map((item) => (
                <div
                  key={item.label}
                  className="bg-[#fcfbf7] border border-gray-100 rounded-xl p-4"
                >
                  <p className="text-xs font-bold uppercase text-gray-400 mb-1">
                    {item.label}
                  </p>

                  <p className="text-2xl font-bold text-[#048187]">
                    {item.valor}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-6 pt-0">
              <button
                onClick={() => setModalDetalhes(null)}
                className="w-full bg-[#048187] text-white font-bold py-3 rounded-xl hover:bg-[#036b70] transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}