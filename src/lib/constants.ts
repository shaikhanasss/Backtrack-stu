/** Brand tokens carried over from the original prototype's App.css. */
export const BRAND = {
  name: 'BackTrack',
  tagline: 'Learn Smart, Score Better',
  subtitle: 'SSC • HSC • PYQs • Quiz',
  colors: {
    navy: '#0f172a',
    blue: '#2563eb',
    gold: '#ffd700',
    error: '#ff6b6b',
  },
} as const;

export const ROUTES = {
  home: '/',
  login: '/login',
  signup: '/signup',
  dashboard: '/dashboard',
  notes: '/dashboard/notes',
  pyqs: '/dashboard/pyqs',
  quiz: '/dashboard/quiz',
  calendar: '/dashboard/calendar',
  profile: '/dashboard/profile',
  search: '/dashboard/search',
  admin: '/admin',
} as const;
