import About from '@/components/About';
import Hero from '@/components/Hero';
import PayHowItWorks from '@/components/PayHowItWorks';
import Products from '@/components/Products';
import SiteShell from '@/components/SiteShell';

export default function Home() {
  return (
    <SiteShell>
      <Hero />
      <Products />
      <PayHowItWorks />
      <About />
    </SiteShell>
  );
}
