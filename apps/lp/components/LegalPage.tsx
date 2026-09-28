import SiteShell from '@/components/SiteShell';

type LegalPageProps = {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
};

export default function LegalPage({ title, updatedAt, children }: LegalPageProps) {
  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-7 md:py-24">
        <p className="mb-4 font-mono text-xs leading-none font-semibold tracking-[.12em] text-ink/60 uppercase">
          Atualizado em {updatedAt}
        </p>

        <h1 className="mb-12 text-[clamp(36px,5vw,56px)] leading-none font-black tracking-[-0.035em]">{title}</h1>

        <div className="flex flex-col gap-4 text-[17px] leading-[1.6] text-ink/75 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:tracking-[-0.02em] [&_h2]:text-ink [&_li]:mb-2 [&_ul]:list-disc [&_ul]:pl-6">
          {children}
        </div>
      </article>
    </SiteShell>
  );
}
