// Each event picks one theme; it colors that event's poster and page.
// Every pair below meets WCAG AA contrast for normal text.
export const THEMES = [
  { id: 'confetti', name: 'Confetti', bg: '#5B2EFF', fg: '#FFFFFF' },
  { id: 'citrus', name: 'Citrus', bg: '#FFB020', fg: '#1B1530' },
  { id: 'lagoon', name: 'Lagoon', bg: '#00727D', fg: '#FFFFFF' },
  { id: 'bubblegum', name: 'Bubblegum', bg: '#C2255C', fg: '#FFFFFF' },
  { id: 'moss', name: 'Moss', bg: '#2F6B3A', fg: '#FFFFFF' },
  { id: 'midnight', name: 'Midnight', bg: '#1B1530', fg: '#FFFFFF' },
];

export const themeOf = (id) => THEMES.find((t) => t.id === id) || THEMES[0];

export const EMOJIS = ['🎉', '🎂', '🍕', '🎶', '🏀', '🎮', '📚', '🌮', '🏕️', '🎬', '☕', '🪩'];

export const themeStyle = (id) => {
  const t = themeOf(id);
  return { '--theme-bg': t.bg, '--theme-fg': t.fg };
};
