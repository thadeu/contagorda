import Link from 'next/link';

import Seal from '@/components/Seal';
import { FIN_URL, PAY_URL } from '@/lib/links';

const links = [
  { label: 'Pay', href: PAY_URL },
  { label: 'Finanças', href: FIN_URL },
  { label: 'Termos de uso', href: '/terms/' },
  { label: 'Privacidade', href: '/privacy/' },
];

export default function Footer() {
  return (
    <footer className="border-t border-ink/12 bg-cream pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-7 px-4 py-10 sm:px-7 md:flex-row md:items-center">
        <Seal id="footer" size={64} />

        <nav className="flex flex-1 flex-wrap gap-x-6 gap-y-4 text-sm leading-none font-medium">
          {links.map(link => (
            <Link key={link.label} href={link.href} className="hover:text-orange-deep">
              {link.label}
            </Link>
          ))}
        </nav>

        <span className="text-[13px] leading-none text-ink/60">© {new Date().getFullYear()} ContaGorda</span>
      </div>
    </footer>
  );
}
