import { BRAND } from '@/lib/constants';

/** Port of `Footer.jsx`. */
export function SiteFooter() {
  return (
    <footer className="glass mt-auto px-6 py-6 text-center text-sm text-white/75">
      <p>
        &copy; {new Date().getFullYear()} {BRAND.name} | {BRAND.tagline}
      </p>
    </footer>
  );
}
