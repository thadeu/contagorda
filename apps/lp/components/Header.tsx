'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import Wordmark from '@/components/Wordmark';
import { FIN_URL, navLinks } from '@/lib/links';

export default function Header() {
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastScrollY = useRef(0);

  const onScroll = useCallback(() => {
    const y = window.scrollY;

    setHidden(y > 64 && y > lastScrollY.current);

    lastScrollY.current = y;
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => window.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 bg-ink pt-[env(safe-area-inset-top)] transition-transform duration-300 ${
          hidden && !menuOpen ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        <div className="border-b border-ink/10 bg-cream/95 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-8 px-4 sm:px-7">
            <Wordmark />

            <nav className="hidden flex-1 gap-6 text-[15px] leading-none font-medium md:flex">
              {navLinks.map(item => (
                <a key={item.href} href={item.href} className="hover:text-orange-deep">
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-3 md:ml-0">
              <a
                href={FIN_URL}
                className="rounded-lg bg-ink px-4 py-[11px] text-sm leading-none font-semibold text-white transition-colors hover:bg-ink-hover"
              >
                Entrar
              </a>

              <button
                type="button"
                onClick={() => setMenuOpen(open => !open)}
                className="relative flex h-9 w-9 flex-col items-center justify-center gap-[5px] md:hidden"
                aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
                aria-expanded={menuOpen}
              >
                <span
                  className={`block h-0.5 w-5 bg-ink transition-all duration-300 ${menuOpen ? 'translate-y-[7px] rotate-45' : ''}`}
                />
                <span className={`block h-0.5 w-5 bg-ink transition-all duration-300 ${menuOpen ? 'scale-0 opacity-0' : ''}`} />
                <span
                  className={`block h-0.5 w-5 bg-ink transition-all duration-300 ${menuOpen ? '-translate-y-[7px] -rotate-45' : ''}`}
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-40 bg-cream transition-opacity duration-300 md:hidden ${
          menuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <nav
          className={`flex h-full flex-col items-center justify-center gap-8 transition-transform duration-300 ${
            menuOpen ? 'translate-y-0' : '-translate-y-8'
          }`}
        >
          {navLinks.map(item => (
            <a
              key={item.href}
              href={item.href}
              onClick={closeMenu}
              className="text-2xl font-black tracking-[-0.03em] hover:text-orange-deep"
            >
              {item.label}
            </a>
          ))}

          <div className="h-px w-12 bg-ink/15" />

          <a
            href={FIN_URL}
            onClick={closeMenu}
            className="rounded-lg bg-ink px-8 py-4 text-base font-semibold text-white hover:bg-ink-hover"
          >
            Entrar
          </a>
        </nav>
      </div>
    </>
  );
}
