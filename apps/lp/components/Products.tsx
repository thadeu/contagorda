import Snout from '@/components/Snout';
import { FIN_URL, PAY_URL } from '@/lib/links';

const products = [
  {
    href: PAY_URL,
    tag: 'pay',
    kicker: 'Pagamentos',
    title: 'ContaGorda Pay',
    description:
      'Receba pagamentos pelo gateway de sua escolha. Seu aplicativo se comunica apenas com a ContaGorda, que direciona cada cobrança ao gateway configurado.',
    cta: 'Acessar o Pay',
    card: 'bg-ink text-white hover:text-white',
    badge: 'bg-ink-soft border-white/10',
    snout: { fill: '#1d1d1d', stroke: '#FF5B1F' },
    kickerColor: 'text-white/55',
    body: 'text-white/70',
    ctaColor: 'text-orange',
  },
  {
    href: FIN_URL,
    tag: 'fin',
    kicker: 'Finanças pessoais',
    title: 'ContaGorda Finanças',
    description:
      'Registre receitas e despesas e acompanhe o saldo do mês em um único lugar, no navegador ou instalado no celular.',
    cta: 'Acessar Finanças',
    card: 'bg-orange text-ink hover:text-ink',
    badge: 'bg-orange-soft border-ink/10',
    snout: { fill: '#FF6F39', stroke: '#111' },
    kickerColor: 'text-ink/70',
    body: 'text-ink',
    ctaColor: 'text-ink',
  },
];

export default function Products() {
  return (
    <section id="produtos" className="mx-auto max-w-[1200px] px-4 pb-24 sm:px-7">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {products.map(product => (
          <a
            key={product.tag}
            href={product.href}
            className={`flex min-h-[420px] flex-col justify-between gap-12 rounded-[14px] p-6 transition-transform duration-200 hover:-translate-y-0.5 sm:p-9 ${product.card}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div
                className={`flex h-[76px] w-[76px] flex-col items-start justify-center gap-1 rounded-[18px] border pl-[13px] ${product.badge}`}
              >
                <Snout fill={product.snout.fill} stroke={product.snout.stroke} />
                <span className="text-[21px] leading-none font-black tracking-[-0.03em]">{product.tag}</span>
              </div>

              <span
                className={`font-mono text-xs leading-none font-medium tracking-[.08em] uppercase ${product.kickerColor}`}
              >
                {product.kicker}
              </span>
            </div>

            <div className="flex flex-col gap-4">
              <h2 className="text-[clamp(34px,5vw,44px)] leading-none font-black tracking-[-0.035em]">
                {product.title}
              </h2>

              <p className={`max-w-[440px] text-[17px] leading-[1.55] text-pretty ${product.body}`}>
                {product.description}
              </p>

              <div
                className={`mt-2 flex items-center gap-2.5 text-base leading-none font-semibold ${product.ctaColor}`}
              >
                {product.cta} <span>→</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
