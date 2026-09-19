import { Logo } from '@/components/brand/logo';

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <Logo className="mb-8" />
      {children}
    </main>
  );
}
