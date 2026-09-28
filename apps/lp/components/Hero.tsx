import Seal from '@/components/Seal';
import { FIN_URL, PAY_URL } from '@/lib/links';

const balanceBars = [38, 52, 44, 66, 58, 74, 90];

function PayReceipt({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`flex w-[222px] items-center gap-3 rounded-xl bg-ink p-3 sm:w-[240px] sm:p-3.5 text-white shadow-[0_18px_40px_-16px_rgba(17,17,17,.55)] ${className}`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange text-lg leading-none font-black text-ink">
        ✓
      </span>

      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="text-sm leading-none font-bold">Cobrança paga</span>
        <span className="font-mono text-[11px] leading-none whitespace-nowrap text-white/60">R$ 149,90 · via Stripe</span>
      </div>
    </div>
  );
}

function FinBalance({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`flex w-[190px] flex-col gap-2.5 rounded-xl border border-ink/10 bg-white p-3.5 sm:w-[220px] sm:gap-3 sm:p-4 shadow-[0_18px_40px_-16px_rgba(17,17,17,.35)] ${className}`}
    >
      <span className="font-mono text-[11px] leading-none tracking-[.08em] text-ink/55 uppercase">Saldo do mês</span>
      <span className="text-xl leading-none font-black tracking-[-0.03em] sm:text-2xl">+ R$ 2.340,00</span>

      <div className="flex h-10 items-end gap-1.5">
        {balanceBars.map((height, index) => (
          <span
            key={index}
            style={{ height: `${height}%` }}
            className={`flex-1 rounded-sm ${index === balanceBars.length - 1 ? 'bg-orange' : 'bg-ink/15'}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="mx-auto grid max-w-[1200px] items-center gap-12 px-4 pt-14 pb-16 sm:px-7 md:pt-20 md:pb-20 lg:grid-cols-12 lg:gap-8">
      <div className="flex flex-col gap-7 lg:col-span-7">
        <p className="font-mono text-xs leading-none font-semibold tracking-[.12em] text-ink/60 uppercase">
          Pay · Finanças · <span className="text-orange-deep">uma conta só</span>
        </p>

        <h1 className="text-[clamp(42px,5.6vw,76px)] leading-[0.98] font-black tracking-[-0.04em] text-balance">
          Produtos financeiros para{' '}
          <span className="rounded-[.14em] bg-ink px-[.14em] text-cream [box-decoration-break:clone]">empresas</span> e{' '}
          <span className="rounded-[.14em] bg-orange px-[.14em] [box-decoration-break:clone]">pessoas</span>.
        </h1>

        <p className="max-w-[540px] text-[19px] leading-[1.55] text-ink/70 text-pretty">
          A ContaGorda reúne soluções para receber pagamentos e organizar suas finanças. Selecione o produto que deseja
          acessar.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href={PAY_URL}
            className="flex items-center justify-center gap-2.5 rounded-lg bg-ink px-[22px] py-4 text-base leading-none font-semibold text-white transition-colors hover:bg-ink-hover hover:text-white"
          >
            Acessar o Pay
            <span className="text-orange">→</span>
          </a>

          <a
            href={FIN_URL}
            className="flex items-center justify-center gap-2.5 rounded-lg border-2 border-ink bg-orange px-5 py-3.5 text-base leading-none font-semibold transition-colors hover:bg-orange-hover"
          >
            Acessar Finanças
            <span>→</span>
          </a>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-[360px] py-12 sm:max-w-[440px] lg:col-span-5 lg:max-w-none lg:py-10">
        <Seal id="hero" spin className="mx-auto w-full max-w-[220px] sm:max-w-[300px] lg:max-w-[340px]" />

        <PayReceipt className="absolute top-2 left-0 -rotate-3 lg:-left-6" />
        <FinBalance className="absolute right-0 bottom-0 rotate-2 lg:-bottom-2" />
      </div>
    </section>
  );
}
