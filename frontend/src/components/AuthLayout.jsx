import Poster from './Poster.jsx';

const nextFriday = (() => {
  const d = new Date();
  d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7));
  d.setHours(18, 30, 0, 0);
  return d;
})();

const SAMPLE = {
  Title: 'Robot battle night',
  Emoji: '🤖',
  Theme: 'confetti',
  Start: nextFriday,
  End: new Date(nextFriday.getTime() + 2.5 * 60 * 60 * 1000),
};

export default function AuthLayout({ title, intro, children }) {
  return (
    <div className="auth">
      <section className="auth-showcase" aria-hidden="true">
        <p className="brand brand-on-dark">Quad</p>
        <div className="showcase-poster">
          <Poster event={SAMPLE} size="sm">
            <p className="showcase-rsvp"><span className="dot" />Robotics Club, 38 going</p>
          </Poster>
        </div>
        <p className="showcase-caption">Find your clubs and see what’s happening on campus this week.</p>
      </section>
      <main className="auth-panel">
        <p className="brand auth-brand-mobile">Quad</p>
        <h1 className="auth-title">{title}</h1>
        {intro && <p className="auth-intro">{intro}</p>}
        {children}
      </main>
    </div>
  );
}
