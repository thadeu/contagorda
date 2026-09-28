import Footer from '@/components/Footer';
import Header from '@/components/Header';

export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-cream pt-[calc(4rem+env(safe-area-inset-top))]">
      <Header />

      <main className="flex-1">{children}</main>

      <Footer />
    </div>
  );
}
