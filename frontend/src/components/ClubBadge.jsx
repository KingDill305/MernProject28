import { themeStyle } from '../themes.js';

export default function ClubBadge({ club, size = 'md' }) {
  return (
    <span className={`club-badge club-badge-${size}`} style={themeStyle(club.Theme)} aria-hidden="true">
      {club.Emoji || '⭐'}
    </span>
  );
}
