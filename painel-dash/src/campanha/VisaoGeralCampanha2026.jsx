import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Pause, Play, CheckCircle, CalendarDays } from 'lucide-react';

// Visão Geral da Campanha Incentivo 2026 (layout do PDF "Geral" de 01/10/2026):
// abertura com o resultado combinado, Ação 1 com o slide dos Lençóis e Ação 2 com o bônus.

const PASTA = '/campanha-incentivo-2026/web';

export const SLIDES_LENCOIS = [
  { src: `${PASTA}/mascotes-lencois.webp`, titulo: 'Santo Amaro te espera', legenda: 'A Expedição 106 leva quem bater a meta para os Lençóis Maranhenses.' },
  { src: `${PASTA}/lencois-01.webp`, titulo: 'Lagoas entre as dunas', legenda: 'Os Lençóis Maranhenses vistos do alto.' },
  { src: `${PASTA}/lencois-02.webp`, titulo: 'Dunas brancas, água cristalina', legenda: 'Um cenário que só existe no Maranhão.' },
  { src: `${PASTA}/lencois-03.webp`, titulo: 'Um mar de dunas', legenda: 'Paisagem a perder de vista em Santo Amaro.' },
  { src: `${PASTA}/lencois-04.webp`, titulo: 'Lagoa azul ao pé da duna', legenda: 'Um banho de lagoa depois da conquista.' },
  { src: `${PASTA}/lencois-05.webp`, titulo: 'Fim de tarde nas dunas', legenda: 'O pôr do sol pintando a areia de dourado.' },
  { src: `${PASTA}/lencois-06.webp`, titulo: 'Pôr do sol na lagoa', legenda: 'A recompensa de quem chega mais longe.' }
];

const ESTILO = `
  .campanha-vg .vg-progresso-slide { animation-name: vgProgressoSlide; animation-timing-function: linear; animation-fill-mode: forwards; }
  @keyframes vgProgressoSlide { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  .campanha-vg .vg-legenda { animation: vgLegenda .7s ease-out both; }
  @keyframes vgLegenda { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
  .campanha-vg .vg-flutuar { animation: vgFlutuar 6s ease-in-out infinite; }
  @keyframes vgFlutuar { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
  @media (prefers-reduced-motion: reduce) {
    .campanha-vg .vg-flutuar, .campanha-vg .vg-legenda { animation: none; }
  }
`;

const emMilhoes = (valor) => `R$ ${(Number(valor || 0) / 1e6).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Mi`;
const emPercentual = (valor) => `${Number(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
const limitar = (valor) => Math.max(0, Math.min(Number(valor || 0), 100));

function prefereMenosMovimento() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_) { return false; }
}

function SliderLencois({ slides, intervaloMs = 5500 }) {
  const [atual, setAtual] = useState(0);
  const [pausadoUsuario, setPausadoUsuario] = useState(false);
  const [emFoco, setEmFoco] = useState(false);
  const [abaOculta, setAbaOculta] = useState(() => typeof document !== 'undefined' && document.hidden);
  const [poucoMovimento] = useState(prefereMenosMovimento);
  const toqueInicio = useRef(null);
  const total = slides.length;
  const parado = pausadoUsuario || emFoco || abaOculta || poucoMovimento || total < 2;

  const irPara = useCallback((indice) => setAtual(((indice % total) + total) % total), [total]);

  useEffect(() => {
    if (parado) return undefined;
    const timer = setTimeout(() => setAtual((a) => (a + 1) % total), intervaloMs);
    return () => clearTimeout(timer);
  }, [atual, parado, total, intervaloMs]);

  useEffect(() => {
    const aoMudar = () => setAbaOculta(document.hidden);
    document.addEventListener('visibilitychange', aoMudar);
    return () => document.removeEventListener('visibilitychange', aoMudar);
  }, []);

  const aoTecla = (evento) => {
    if (evento.key === 'ArrowLeft') { evento.preventDefault(); irPara(atual - 1); }
    if (evento.key === 'ArrowRight') { evento.preventDefault(); irPara(atual + 1); }
  };
  const aoTocar = (evento) => { toqueInicio.current = evento.touches?.[0]?.clientX ?? null; };
  const aoSoltar = (evento) => {
    if (toqueInicio.current === null) return;
    const distancia = (evento.changedTouches?.[0]?.clientX ?? toqueInicio.current) - toqueInicio.current;
    if (Math.abs(distancia) > 40) irPara(atual + (distancia < 0 ? 1 : -1));
    toqueInicio.current = null;
  };

  const slide = slides[atual];
  const botaoSeta = 'absolute top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/20 hover:bg-white/35 backdrop-blur-md border border-white/30 text-white hidden sm:flex items-center justify-center transition-all sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white';

  return (
    <div
      role="region"
      aria-roledescription="carrossel"
      aria-label="Fotos dos Lençóis Maranhenses, em Santo Amaro"
      tabIndex={0}
      onKeyDown={aoTecla}
      onMouseEnter={() => setEmFoco(true)}
      onMouseLeave={() => setEmFoco(false)}
      onTouchStart={aoTocar}
      onTouchEnd={aoSoltar}
      className="group relative h-full min-h-[360px] sm:min-h-[420px] xl:min-h-[480px] overflow-hidden rounded-[28px] bg-[#022325] shadow-[0_24px_60px_-28px_rgba(2,35,37,.55)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#048187]/40"
    >
      {slides.map((item, indice) => {
        const ativo = indice === atual;
        return (
          <figure key={item.src} aria-hidden={!ativo} className={`absolute inset-0 m-0 transition-opacity duration-[1200ms] ease-out ${ativo ? 'opacity-100' : 'opacity-0'}`}>
            <img
              src={item.src}
              alt={item.titulo}
              loading={indice < 2 ? 'eager' : 'lazy'}
              decoding="async"
              draggable={false}
              className="h-full w-full object-cover select-none"
              style={poucoMovimento ? undefined : (ativo
                ? { transform: 'scale(1.08)', transition: `transform ${intervaloMs + 1500}ms ease-out` }
                : { transform: 'scale(1)', transition: 'transform 0ms linear 1300ms' })}
            />
          </figure>
        );
      })}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#011c1e]/85 via-[#011c1e]/15 to-transparent" />

      <div className="absolute left-4 top-4 sm:left-6 sm:top-6 z-20 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-black/25 backdrop-blur-md border border-white/20 px-3 py-1.5 text-[11px] font-black text-white tracking-wide">
          <MapPin size={13} /> Santo Amaro • MA
        </span>
        <button
          type="button"
          onClick={() => setPausadoUsuario((p) => !p)}
          aria-label={pausadoUsuario ? 'Continuar apresentação' : 'Pausar apresentação'}
          className="w-8 h-8 rounded-full bg-black/25 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          {pausadoUsuario ? <Play size={13} /> : <Pause size={13} />}
        </button>
      </div>
      <span className="absolute right-4 top-4 sm:right-6 sm:top-6 z-20 rounded-full bg-black/25 backdrop-blur-md border border-white/20 px-3 py-1.5 text-[11px] font-black text-white tabular-nums">
        {String(atual + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </span>

      <button type="button" aria-label="Foto anterior" onClick={() => irPara(atual - 1)} className={`${botaoSeta} left-3 sm:left-5`}><ChevronLeft size={20} /></button>
      <button type="button" aria-label="Próxima foto" onClick={() => irPara(atual + 1)} className={`${botaoSeta} right-3 sm:right-5`}><ChevronRight size={20} /></button>

      <div className="absolute inset-x-0 bottom-0 z-10 p-5 sm:p-7 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div key={atual} className="vg-legenda max-w-xl text-white" aria-live="polite">
          <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.18em] text-white/70">Lençóis Maranhenses</p>
          <h3 className="mt-1 text-xl sm:text-2xl xl:text-3xl font-black leading-tight">{slide.titulo}</h3>
          <p className="mt-1.5 text-[13px] sm:text-[15px] text-white/80 font-medium">{slide.legenda}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0" role="tablist" aria-label="Escolher foto">
          {slides.map((item, indice) => {
            const ativo = indice === atual;
            return (
              <button
                key={item.src}
                type="button"
                role="tab"
                aria-selected={ativo}
                aria-label={`Foto ${indice + 1}: ${item.titulo}`}
                onClick={() => irPara(indice)}
                className={`relative h-1.5 rounded-full overflow-hidden transition-all duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${ativo ? 'w-10 bg-white/35' : 'w-4 bg-white/45 hover:bg-white/70'}`}
              >
                {ativo && (
                  parado
                    ? <span className="absolute inset-0 bg-white" />
                    : <span key={`p-${atual}`} className="vg-progresso-slide absolute inset-0 origin-left bg-white" style={{ animationDuration: `${intervaloMs}ms` }} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AndamentoMeta({ realizado, meta, cor, rotulo }) {
  const percentual = meta > 0 ? (realizado / meta) * 100 : 0;
  const habilitada = meta > 0 && realizado >= meta;
  const falta = Math.max(meta - realizado, 0);
  return (
    <div className="mt-6 rounded-2xl border border-black/5 bg-white/80 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">{rotulo}</span>
        {habilitada ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-2.5 py-1 text-[11px] font-black text-green-700"><CheckCircle size={13} /> Ação habilitada</span>
        ) : (
          <span className="text-[11px] font-black text-gray-500">Faltam <span style={{ color: cor }}>{emMilhoes(falta)}</span></span>
        )}
      </div>
      <div className="mt-3 h-2.5 rounded-full bg-gray-100 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(limitar(percentual))} aria-label={rotulo}>
        <div className="h-full rounded-full transition-[width] duration-1000 ease-out" style={{ width: `${limitar(percentual)}%`, background: cor }} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs font-bold text-gray-500">
        <span>{emMilhoes(realizado)} de {emMilhoes(meta)}</span>
        <span className="tabular-nums" style={{ color: cor }}>{emPercentual(percentual)}</span>
      </div>
    </div>
  );
}

function Selo({ children, destaque = false }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-[13px] font-black ${destaque ? 'bg-[#e3f3f3] text-[#036b70]' : 'bg-[#eef3f3] text-gray-600'}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export default function VisaoGeralCampanha2026({ realizado = {}, metas = {}, atualizadoEm = null, carregando = false }) {
  const total = Number(realizado?.total || 0);
  const vd = Number(realizado?.vd || 0);
  const loja = Number(realizado?.loja || 0);
  const meta106 = Number(metas?.meta_principal || 106000000);
  const meta109 = Number(metas?.meta_superacao || 109000000);
  const partVD = total > 0 ? (vd / total) * 100 : 0;
  const partLoja = total > 0 ? (loja / total) * 100 : 0;
  const semDados = carregando && !total;
  const atualizado = atualizadoEm
    ? new Date(atualizadoEm).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : null;
  const valor = (texto, classe = '') => (semDados ? <span className={`inline-block rounded-lg bg-white/25 animate-pulse text-transparent ${classe}`}>R$ 00,00 Mi</span> : texto);

  return (
    <div className="campanha-vg space-y-6 sm:space-y-8">
      <style>{ESTILO}</style>

      {/* Abertura: título, mascotes e resultado combinado */}
      <section className="relative overflow-hidden rounded-[28px] sm:rounded-[32px] bg-[linear-gradient(115deg,#010d0e_0%,#033c3f_38%,#05767b_72%,#13a7ad_100%)] text-white shadow-[0_30px_70px_-35px_rgba(1,40,44,.8)]">
        <div className="pointer-events-none absolute -left-24 -top-24 w-80 h-80 rounded-full bg-[#0aa3a9]/20 blur-3xl" />
        <div className="pointer-events-none absolute right-[-120px] bottom-[-160px] w-[420px] h-[420px] rounded-full bg-white/10 blur-3xl" />
        <div className="relative grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)_minmax(340px,440px)] items-center gap-6 xl:gap-4 p-6 sm:p-9 xl:p-10">
          <div className="text-center xl:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1.5 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.16em] text-white/80">
              <CalendarDays size={13} /> Ciclos 14 • 15 • 16 • 17
            </span>
            <h1 className="mt-4 text-[2.6rem] leading-[1.02] sm:text-6xl xl:text-[clamp(2.6rem,3.4vw,3.9rem)] font-black tracking-tight">
              Campanha<br /><span className="sm:whitespace-nowrap">Incentivo 2026</span>
            </h1>
            <p className="mt-4 text-sm sm:text-base text-white/75 font-medium max-w-md mx-auto xl:mx-0">
              Venda Direta + Loja juntas rumo aos <strong className="text-white">R$ 106</strong> e <strong className="text-white">R$ 109 milhões</strong>.
            </p>
          </div>

          <div className="relative flex justify-center xl:self-end xl:-mb-10">
            <img
              src={`${PASTA}/mascotes-premio.webp`}
              alt="Mascotes da campanha comemorando com uma mala de dinheiro"
              className="vg-flutuar w-full max-w-[340px] sm:max-w-[420px] xl:max-w-[460px] drop-shadow-[0_30px_40px_rgba(0,0,0,.35)]"
              decoding="async"
            />
          </div>

          <div className="rounded-[26px] bg-white/[0.14] backdrop-blur-md border border-white/25 p-5 sm:p-7 shadow-[inset_0_1px_0_rgba(255,255,255,.25)]">
            <p className="text-[11px] sm:text-xs font-black uppercase tracking-[0.14em] text-[#bff3f2]">Resultado combinado 2026 até C17</p>
            <p className="mt-2 text-4xl sm:text-5xl font-black tracking-tight tabular-nums">{valor(emMilhoes(total))}</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[#04676b] border border-white/10 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-white/70">Venda Direta</p>
                <p className="mt-1.5 text-base sm:text-2xl font-black tabular-nums whitespace-nowrap">{valor(emMilhoes(vd))}</p>
                <div className="mt-3 h-2 rounded-full bg-white/20 overflow-hidden"><div className="h-full rounded-full bg-white transition-[width] duration-1000 ease-out" style={{ width: `${limitar(partVD)}%` }} /></div>
                <p className="mt-1.5 text-[10px] font-bold text-white/65">{emPercentual(partVD)} do resultado</p>
              </div>
              <div className="rounded-2xl bg-white/85 border border-white/40 p-4 text-[#035f63]">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#047c81]">Loja</p>
                <p className="mt-1.5 text-base sm:text-2xl font-black tabular-nums whitespace-nowrap">{valor(emMilhoes(loja))}</p>
                <div className="mt-3 h-2 rounded-full bg-[#048187]/15 overflow-hidden"><div className="h-full rounded-full bg-[#048187] transition-[width] duration-1000 ease-out" style={{ width: `${limitar(partLoja)}%` }} /></div>
                <p className="mt-1.5 text-[10px] font-bold text-[#047c81]/80">{emPercentual(partLoja)} do resultado</p>
              </div>
            </div>
            {atualizado && <p className="mt-4 text-[11px] font-semibold text-white/60">Atualizado em {atualizado}</p>}
          </div>
        </div>
      </section>

      {/* Ação 1: Expedição 106 */}
      <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] gap-5 sm:gap-6 items-stretch">
        <SliderLencois slides={SLIDES_LENCOIS} />
        <article className="rounded-[28px] bg-[#f8f7f2] border border-[#ebe8de] p-6 sm:p-9 xl:p-10 flex flex-col justify-center">
          <p className="text-xs sm:text-sm font-black uppercase tracking-[0.16em] text-[#048187]">Ação 1 • Expedição 106</p>
          <h2 className="mt-3 sm:mt-4 text-3xl sm:text-4xl font-black tracking-tight text-[#7c1f31] leading-tight">Viagem para Santo Amaro</h2>
          <p className="mt-4 sm:mt-5 text-base sm:text-lg text-gray-600 leading-relaxed">
            Os consultores elegíveis precisam bater as metas completas de <strong className="text-gray-800">receita + indicadores</strong> nos ciclos <strong className="text-gray-800">14, 15, 16 e 17</strong>. A ação é habilitada quando o CP alcançar <strong className="text-[#048187]">R$ 106 milhões</strong>.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Selo destaque>Receita + indicadores</Selo>
            <Selo>Meta corporativa 106 MM</Selo>
          </div>
          <AndamentoMeta realizado={total} meta={meta106} cor="#048187" rotulo="Andamento do CP até 106 MM" />
        </article>
      </section>

      {/* Ação 2: Expedição 109 */}
      <section className="relative overflow-hidden rounded-[28px] sm:rounded-[32px] bg-[linear-gradient(135deg,#036468_0%,#048187_55%,#0a959b_100%)] px-4 py-5 sm:p-8 xl:px-12 xl:py-14">
        <div className="pointer-events-none absolute -right-32 -top-32 w-[420px] h-[420px] rounded-full bg-white/10 blur-3xl" />
        <div className="relative grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-6 xl:gap-10">
          <article className="rounded-[26px] bg-white p-6 sm:p-9 xl:p-10 shadow-[0_30px_60px_-30px_rgba(0,0,0,.45)]">
            <p className="text-xs sm:text-sm font-black uppercase tracking-[0.16em] text-[#048187]">Ação 2 • Expedição 109</p>
            <h2 className="mt-3 sm:mt-4 text-3xl sm:text-4xl font-black tracking-tight text-[#7c1f31] leading-tight">Bônus de R$ 50 mil</h2>
            <p className="mt-4 sm:mt-5 text-base sm:text-lg text-gray-600 leading-relaxed">
              O pool de <strong className="text-[#048187]">R$ 50.000</strong> será dividido proporcionalmente entre os elegíveis que alcançarem <strong className="text-[#048187]">120% da meta individual</strong> do C14 ao C17 e cumprirem os indicadores <span className="text-[#048187] font-semibold">IAF aplicáveis</span>. A ação é habilitada quando o CP atingir <strong className="text-[#048187]">R$ 109 milhões</strong>.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Selo destaque>120% da meta individual</Selo>
              <Selo>Meta corporativa 109 MM</Selo>
            </div>
            <AndamentoMeta realizado={total} meta={meta109} cor="#7c1f31" rotulo="Andamento do CP até 109 MM" />
          </article>
          <div className="flex justify-center">
            <img
              src={`${PASTA}/mascotes-premio.webp`}
              alt="Mascotes da campanha com o bônus em dinheiro"
              loading="lazy"
              decoding="async"
              className="vg-flutuar w-full max-w-[360px] sm:max-w-[520px] drop-shadow-[0_30px_40px_rgba(0,0,0,.35)]"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
