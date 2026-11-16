// Colors match the web app (frontend/src/styles.css and themes.js).
export const C = {
  ink: '#1B1530',
  paper: '#F6F5FB',
  surface: '#FFFFFF',
  line: '#DEDAEA',
  muted: '#5A5470',
  accent: '#5B2EFF',
  danger: '#B3261E',
  going: '#1E7A4C',
  maybe: '#8A5A00',
};

const THEMES = {
  confetti: { bg: '#5B2EFF', fg: '#FFFFFF' },
  citrus: { bg: '#FFB020', fg: '#1B1530' },
  lagoon: { bg: '#00727D', fg: '#FFFFFF' },
  bubblegum: { bg: '#C2255C', fg: '#FFFFFF' },
  moss: { bg: '#2F6B3A', fg: '#FFFFFF' },
  midnight: { bg: '#1B1530', fg: '#FFFFFF' },
};
export const themeOf = (id) => THEMES[id] || THEMES.confetti;

const pad = (n) => String(n).padStart(2, '0');
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "Fri, Nov 20 · 6:30 PM"
export function formatWhen(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const h = d.getHours();
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()} · ${h % 12 || 12}:${pad(d.getMinutes())} ${h < 12 ? 'AM' : 'PM'}`;
}
