export default function About() {
  return (
    <section id="sobre" className="mx-auto grid max-w-[1200px] items-start gap-8 px-4 py-24 sm:px-7 md:grid-cols-2 md:gap-12">
      <h2 className="text-[clamp(32px,4vw,48px)] leading-[1.02] font-black tracking-[-0.035em] text-balance">
        Uma empresa, diferentes produtos.
      </h2>

      <p className="text-lg leading-[1.6] text-ink/70 text-pretty">
        A ContaGorda desenvolve produtos para a vida financeira de empresas e pessoas. Cada produto opera de forma
        independente e compartilha a mesma conta de acesso.
      </p>
    </section>
  );
}
