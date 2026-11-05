const dayFmt = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const longDayFmt = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });

export const formatDay = (d, long = false) => (long ? longDayFmt : dayFmt).format(new Date(d));
export const formatTime = (d) => timeFmt.format(new Date(d));

export function formatWhen(start, end, long = false) {
  const s = new Date(start);
  let out = `${formatDay(s, long)}, ${formatTime(s)}`;
  if (end) {
    const e = new Date(end);
    out += s.toDateString() === e.toDateString() ? `–${formatTime(e)}` : ` to ${formatDay(e, long)}, ${formatTime(e)}`;
  }
  return out;
}

// <input type="date"> and <input type="time"> work in local time.
const pad = (n) => String(n).padStart(2, '0');
export const toDateInput = (d) => { const x = new Date(d); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; };
export const toTimeInput = (d) => { const x = new Date(d); return `${pad(x.getHours())}:${pad(x.getMinutes())}`; };
export const fromInputs = (date, time) => (date && time ? new Date(`${date}T${time}`) : null);

// ---- Calendar export ----
const utcStamp = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const defaultEnd = (start) => new Date(new Date(start).getTime() + 2 * 60 * 60 * 1000);

export function googleCalendarUrl(ev) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: ev.Title,
    dates: `${utcStamp(ev.Start)}/${utcStamp(ev.End || defaultEnd(ev.Start))}`,
    details: `${ev.Description || ''}\n\n${window.location.href}`.trim(),
    location: ev.Location || '',
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export function downloadIcs(ev) {
  const esc = (s = '') => String(s).replace(/[\\;,]/g, (m) => `\\${m}`).replace(/\n/g, '\\n');
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Quad//EN', 'BEGIN:VEVENT',
    `UID:${ev.Code}@quad`,
    `DTSTAMP:${utcStamp(new Date())}`,
    `DTSTART:${utcStamp(ev.Start)}`,
    `DTEND:${utcStamp(ev.End || defaultEnd(ev.Start))}`,
    `SUMMARY:${esc(ev.Title)}`,
    `LOCATION:${esc(ev.Location)}`,
    `DESCRIPTION:${esc(`${ev.Description || ''}\n${window.location.href}`)}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: `${ev.Title.replace(/[^\w]+/g, '-').toLowerCase() || 'event'}.ics` });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
