import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { BRAND } from '@/lib/constants';

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s | ${BRAND.name}`,
  },
  description:
    'A centralized academic study platform for SSC and HSC students — chapter-wise notes, previous year question papers, and quizzes.',
  keywords: ['SSC', 'HSC', 'notes', 'PYQ', 'quiz', 'study', 'board exam'],
};

export const viewport: Viewport = {
  themeColor: BRAND.colors.navy,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
