import { useEffect } from 'react';

import { useLocation } from 'src/routes/hooks';

import { BackToTop } from 'src/components/animate/back-to-top';
import { ScrollProgress, useScrollProgress } from 'src/components/animate/scroll-progress';

import { HomeCta } from '../home-cta';
import { HomeHero } from '../home-hero';
import { HomeAbout } from '../home-about';
import { HomeStats } from '../home-stats';
import { HomePricing } from '../home-pricing';
import { HomeFeatures } from '../home-features';
import { HomeHowItWorks } from '../home-how-it-works';
import { HomeTestimonials } from '../home-testimonials';

// ----------------------------------------------------------------------

export function HomeView() {
  const pageProgress = useScrollProgress();
  const { hash } = useLocation();

  // Scroll to section when URL hash is present (e.g. from top nav anchor links)
  useEffect(() => {
    const id = hash ? hash.replace('#', '') : '';
    if (!id) return;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [hash]);

  return (
    <>
      <ScrollProgress
        variant="linear"
        progress={pageProgress.scrollYProgress}
        sx={{ position: 'fixed', zIndex: 9999 }}
      />

      <BackToTop />

      {/* 1. Hero */}
      <HomeHero />

      {/* 2. Social proof stats */}
      <HomeStats />

      {/* 3. Features */}
      <HomeFeatures />

      {/* 4. How it works */}
      <HomeHowItWorks />

      {/* 5. Pricing */}
      <HomePricing />

      {/* 6. Testimonials */}
      <HomeTestimonials />

      {/* 7. About */}
      <HomeAbout />

      {/* 8. Final CTA + Contact */}
      <HomeCta />
    </>
  );
}
