import { Link } from 'react-router-dom';
import Poster from './Poster.jsx';

const STATUS_LABEL = { going: 'Going', maybe: 'Maybe', no: 'Can’t go' };

export function EventGrid({ events, level = 3 }) {
  return (
    <ul className="event-grid">
      {events.map((ev) => <li key={ev.Code}><EventTile ev={ev} level={level} /></li>)}
    </ul>
  );
}

export default function EventTile({ ev, level = 3 }) {
  return (
    <Link to={`/e/${ev.Code}`} className="tile">
      <Poster event={ev} size="sm" level={level} />
      <div className="tile-meta">
        <span className="tile-club">{ev.ClubName}</span>
        <span className="tile-where">{ev.Location || 'Location to be announced'}</span>
        <span className="tile-row">
          {ev.MyStatus && <span className={`pill pill-${ev.MyStatus}`}>{STATUS_LABEL[ev.MyStatus]}</span>}
          <span className="tile-count">{ev.GoingCount ?? 0} going</span>
        </span>
      </div>
    </Link>
  );
}
