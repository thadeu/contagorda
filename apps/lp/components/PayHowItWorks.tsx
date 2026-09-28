import { PAY_URL } from '@/lib/links';

const gateways = [
  { name: 'Stripe', status: 'Ativo', active: true },
  { name: 'Asaas', status: 'Em breve', active: false },
  { name: 'AbacatePay', status: 'Em breve', active: false },
];

const flow = ['Seu aplicativo', 'ContaGorda', 'Gateway configurado'];

function Step({ number, title, text, children }: { number: number; title: string; text: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-[22px] rounded-[14px] border border-white/12 bg-ink-card p-6 sm:p-8">
      <span className="text-[64px] leading-none font-black tracking-[-0.04em] text-orange">{number}</span>

      <div className="flex flex-col gap-2.5">
        <h3 className="text-[22px] leading-[1.2] font-bold">{title}</h3>
        <p className="text-base leading-[1.55] text-white/65 text-pretty">{text}</p>
      </div>

      <div className="mt-auto">{children}</div>
    </div>
  );
}

export default function PayHowItWorks() {
  return (
    <section id="pay" className="bg-ink text-white">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-14 px-4 py-24 sm:px-7">
        <div className="flex max-w-[760px] flex-col gap-[18px]">
          <p className="font-mono text-xs leading-none font-medium tracking-[.12em] text-orange uppercase">
            ContaGorda Pay · Como funciona
          </p>

          <h2 className="text-[clamp(36px,4.6vw,56px)] leading-none font-black tracking-[-0.035em] text-balance">
            Três etapas entre o seu aplicativo e o pagamento.
          </h2>

          <p className="text-lg leading-[1.55] text-white/70 text-pretty">
            A integração é feita uma única vez. Para trocar de gateway, basta alterar a configuração no painel; o código
            do seu aplicativo permanece o mesmo.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Step
            number={1}
            title="Configure o gateway"
            text="No painel, selecione o gateway e informe as credenciais da sua conta."
          >
            <ul className="flex flex-col gap-2">
              {gateways.map(gateway => (
                <li
                  key={gateway.name}
                  className={`flex items-center justify-between rounded-lg border px-3.5 py-3 text-sm leading-none font-medium ${
                    gateway.active ? 'border-orange' : 'border-white/14 text-white/60'
                  }`}
                >
                  <span>{gateway.name}</span>
                  <span className={`font-mono text-[11px] uppercase ${gateway.active ? 'text-orange' : ''}`}>
                    {gateway.status}
                  </span>
                </li>
              ))}
            </ul>
          </Step>

          <Step
            number={2}
            title="Adicione o botão ao seu aplicativo"
            text="Insira o botão de pagamento com uma linha de código."
          >
            <div className="flex flex-col gap-3">
              <code className="block overflow-x-auto rounded-lg border border-white/10 bg-ink-code p-3.5 font-mono text-[12.5px] leading-[1.6] whitespace-nowrap text-white/80">
                {'<a href="https://pay.contagorda.com/c/…">'}
              </code>

              <div className="flex items-center justify-center gap-2.5 rounded-lg bg-orange px-[18px] py-3.5 text-[15px] leading-none font-semibold text-ink">
                <span>Pagar com</span>
                <svg width="26" height="18" viewBox="0 0 64 44" aria-hidden="true">
                  <rect x="3" y="3" width="58" height="38" rx="19" fill="#FF5B1F" stroke="#111" strokeWidth="6" />
                  <rect x="20" y="13" width="7" height="18" rx="3.5" fill="#111" />
                  <rect x="37" y="13" width="7" height="18" rx="3.5" fill="#111" />
                </svg>
                <span className="text-base font-black tracking-[-0.03em]">contagorda</span>
              </div>
            </div>
          </Step>

          <Step
            number={3}
            title="Direcione para o pagamento"
            text="O cliente é encaminhado ao gateway ativo e o resultado retorna assinado ao seu aplicativo."
          >
            <ol className="flex flex-col gap-1.5 font-mono text-[13px] leading-none font-medium">
              {flow.map((item, index) => (
                <li key={item} className="flex flex-col gap-1.5">
                  {index > 0 && (
                    <span className="pl-[18px] text-white/40" aria-hidden="true">
                      ↓
                    </span>
                  )}

                  <span
                    className={`rounded-lg px-3.5 py-3 ${
                      item === 'ContaGorda' ? 'bg-orange text-ink' : 'border border-white/14 text-white/80'
                    }`}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ol>
          </Step>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href={PAY_URL}
            className="flex items-center justify-center gap-2.5 rounded-lg bg-orange px-[22px] py-4 text-base leading-none font-semibold text-ink transition-colors hover:bg-orange-hover"
          >
            Criar conta no Pay
            <span>→</span>
          </a>

          <a
            href={PAY_URL}
            className="flex items-center justify-center gap-2.5 rounded-lg border-2 border-white/30 px-5 py-3.5 text-base leading-none font-semibold text-white transition-colors hover:border-white"
          >
            Ver a documentação
          </a>
        </div>
      </div>
    </section>
  );
}
