import { themeStyle } from '../themes.js';
import { formatWhen } from '../dates.js';

// The event's "flyer": its theme color, emoji and title set big.
// size="lg" on the event page and editor preview, "sm" on dashboard tiles.
export default function Poster({ event, size = 'lg', level, as: Tag = 'div', children }) {
  const { Title, Emoji, Theme, Start, End, Cancelled } = event;
  const TitleTag = `h${level || (size === 'lg' ? 1 : 3)}`;
  return (
    <Tag className={`poster poster-${size}${Cancelled ? ' is-cancelled' : ''}`} style={themeStyle(Theme)}>
      <span className="poster-emoji" aria-hidden="true">{Emoji || '🎉'}</span>
      <TitleTag className="poster-title">{Title || 'Untitled event'}</TitleTag>
      {Start && <p className="poster-when">{formatWhen(Start, End, size === 'lg')}</p>}
      {Cancelled && <p className="poster-flag">Cancelled</p>}
      {children}
    </Tag>
  );
}
