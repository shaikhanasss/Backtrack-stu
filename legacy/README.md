# Legacy Vite prototype

The original React + Vite prototype, kept verbatim for reference and for the
"before / after" comparison in the project report. **Nothing here is compiled
or imported** — it sits outside `src/` so Next.js never picks it up, and it is
excluded from `tsconfig.json` and ESLint.

Everything useful was ported into the Next.js app:

| Legacy file | Ported to |
|---|---|
| `App.css` | `tailwind.config.ts` + `src/app/globals.css` (gradient, gold, glass, fade animation) |
| `components/Card.jsx` | `src/components/brand/feature-card.tsx` — now actually navigates |
| `components/Header.jsx` | `src/components/layout/site-header.tsx` — now session-aware |
| `components/Footer.jsx` | `src/components/layout/site-footer.tsx` |
| `components/ProgressSection.jsx` | `src/components/brand/progress-panel.tsx` — real data |
| `components/NotesSection.jsx` | folded into `src/app/dashboard/notes/page.tsx` |
| `components/ProtectedRoute.jsx` | `src/middleware.ts` + server-side layout guards |
| `context/AuthContext.jsx` | `src/lib/auth.ts` (Auth.js) — the fake boolean is gone |
| `data/cardsData.js` | `prisma/seed.ts` — the same subjects, now database rows |
| `pages/*.jsx` | `src/app/**` routes |

Safe to delete once the report is written.
