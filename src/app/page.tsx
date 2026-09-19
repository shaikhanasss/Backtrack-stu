import Link from 'next/link';

import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { FeatureCard } from '@/components/brand/feature-card';
import { Button } from '@/components/ui/button';
import { SearchBox } from '@/components/brand/search-box';
import { getPlatformStats } from '@/server/queries';
import { BRAND } from '@/lib/constants';

/**
 * Landing page — a Server Component so the content is present in the initial
 * HTML and can be indexed by search engines. The prototype rendered the same
 * markup client-side from a hardcoded array.
 */
export default async function LandingPage() {
  const stats = await getPlatformStats();

  const cards = [
    {
      icon: '📚',
      title: 'SSC Notes',
      description: 'Chapter-wise notes for Class 10',
      href: '/dashboard/notes',
    },
    {
      icon: '🎓',
      title: 'HSC Notes',
      description: 'Class 11 & 12, all streams',
      href: '/dashboard/notes',
    },
    {
      icon: '📝',
      title: 'PYQs',
      description: `${stats.pyqs} previous year papers`,
      href: '/dashboard/pyqs',
    },
    {
      icon: '🎮',
      title: 'Quiz',
      description: `${stats.quizzes} quizzes to challenge yourself`,
      href: '/dashboard/quiz',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <section className="animate-fade-up-slow px-6 py-24 text-center">
        <h1 className="text-4xl font-bold leading-tight text-white sm:text-6xl">
          {BRAND.tagline}
        </h1>
        <p className="mt-5 text-lg text-white/80 sm:text-xl">{BRAND.subtitle}</p>

        <div className="mt-8 flex justify-center">
          <SearchBox />
        </div>

        <Button asChild size="lg" className="mt-8">
          <Link href="/signup">Explore Now</Link>
        </Button>
      </section>

      <section className="grid gap-8 px-6 pb-20 sm:grid-cols-2 lg:grid-cols-4 lg:px-16">
        {cards.map((card) => (
          <FeatureCard key={card.title} {...card} />
        ))}
      </section>

      <SiteFooter />
    </div>
  );
}
