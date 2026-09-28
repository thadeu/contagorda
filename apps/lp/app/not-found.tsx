import Link from 'next/link';

import Seal from '@/components/Seal';

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-cream px-4 pt-[env(safe-area-inset-top)] text-center">
      <Seal id="not-found" size={120} className="mb-10" />

      <p className="mb-4 text-8xl leading-none font-black tracking-[-0.04em] text-orange">404</p>

      <h1 className="mb-3 text-2xl font-black tracking-[-0.03em] md:text-3xl">Página não encontrada</h1>

      <p className="mb-10 max-w-md text-base text-ink/60">A página que você procura não existe ou mudou de endereço.</p>

      <Link
        href="/"
        className="flex items-center gap-2.5 rounded-lg bg-ink px-[22px] py-4 text-base leading-none font-semibold text-white hover:bg-ink-hover"
      >
        Voltar ao início
        <span className="text-orange">→</span>
      </Link>
    </main>
  );
}
