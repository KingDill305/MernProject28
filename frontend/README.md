# Quad — school clubs and events (web frontend)

React 19 + Vite client for the Express/MongoDB API in `../server`. Every server
call is an async `fetch` with JSON bodies (`src/api.js`).

## Run it

```bash
# terminal 1 – API (needs MONGO_URI in server/.env)
cd server && npm install && node server.js      # :5000

# terminal 2 – web app
cd frontend && npm install && npm run dev       # http://localhost:5173
```

In dev, Vite forwards `/api/*` to `http://localhost:5000`. Override with
`VITE_API_PROXY` (dev) or `VITE_API_URL` (production build).

`npm run build` writes static files to `dist/`. Whatever serves them should
gzip responses (e.g. the `compression` middleware in Express) and send
`index.html` for unknown paths so links like `/e/abc123` work on refresh.

## Pages

| Route | Who | What it does |
|---|---|---|
| `/login`, `/register` | everyone | Log in / create an account |
| `/verify-email?token=` | everyone | Landing page for the verification email link |
| `/forgot-password`, `/reset-password?token=` | everyone | Password recovery |
| `/events` | logged in | Event feed with tabs: All campus, My clubs, Going, Past |
| `/clubs` | logged in | Browse and search clubs by name and category; join |
| `/clubs/new`, `/clubs/:id/edit` | logged in / officers | Start a club (you become its officer) or edit it |
| `/clubs/:id` | logged in | Club page: about, upcoming events, members; officers can promote members and post events |
| `/events/new?club=` , `/e/:code/edit` | officers | Post or edit an event for a club, with a live preview |
| `/e/:code` | anyone with the link | Event page: details, RSVP (Going / Maybe / Can’t go, +1s), guest list, comments, Google Calendar and .ics |

Logged-in user `{ id, FirstName, LastName }` is kept in `localStorage` (`quad.user`).

## Data model (MongoDB collections)

- **users**: FirstName, LastName, Email, Login (unique), Password (bcrypt hash)
- **clubs**: Name, Description, Category, Emoji, Theme, CreatedBy, Members `[{ UserId, Role: officer|member, JoinedAt }]`
- **events**: Code (unique share id), ClubId, CreatedBy, Title, Emoji, Theme, Start, End, Location, Description, Cancelled
- **rsvps**: EventId, UserId (unique together), Status `going|maybe|no`, PlusOnes 0–5
- **comments**: EventId, UserId, Text

## API

All bodies are JSON. Requests that act for a user include `UserId` in the body
(or `userId` in the query for GETs).

| Method | Path | Notes |
|---|---|---|
| POST | `/api/register` | `{ FirstName, LastName, Email, Login, Password }` → 201, 409 if Login taken |
| POST | `/api/login` | `{ Login, Password }` → `{ id, FirstName, LastName }`, 401 if wrong |
| GET | `/api/clubs?userId&search&category&mine=member\|officer` | List clubs with `MemberCount`, `MyRole` |
| GET | `/api/clubs/:id?userId` | Club + `Members [{UserId, Name, Role}]` + upcoming `Events` |
| POST | `/api/clubs` | Create; creator becomes officer |
| PUT | `/api/clubs/:id` | Officers only |
| DELETE | `/api/clubs/:id` | Officers only; removes its events, RSVPs, comments |
| POST | `/api/clubs/:id/join` · `/leave` | Last officer can’t leave |
| POST | `/api/clubs/:id/role` | `{ UserId, MemberId, Role }`, officers only; a club keeps at least one officer |
| GET | `/api/events?userId&view=all\|clubs\|going\|past` | Event summaries: `ClubName`, `MyStatus`, `GoingCount`, `CanEdit` |
| GET | `/api/events/:code?userId` | Full event + `MyRsvp`, `Counts`, `Guests` |
| POST | `/api/events` | `{ UserId, ClubId, Title, Start, End?, Emoji, Theme, Location, Description }`; officers of that club only |
| PUT | `/api/events/:code` | Officers of the hosting club |
| DELETE | `/api/events/:code` | Cancels (page stays, shows Cancelled) |
| POST | `/api/events/:code/rsvp` | `{ UserId, Status, PlusOnes }` |
| GET/POST | `/api/events/:code/comments` | List / add `{ UserId, Text }` |

**Still needed on the server** for the rubric (the frontend already calls them):
`POST /api/verify-email { token }`, `POST /api/resend-verification { Email }`,
`POST /api/forgot-password { Email }` (always 200), `POST /api/reset-password { token, Password }`,
and `/api/login` returning **403** for unverified accounts.

## Lighthouse

Production build, gzip on: desktop 100 / 100 / 100 / 100 (performance,
accessibility, best practices, SEO) on login, register and event pages;
mobile 97–100 performance and 100 for the rest. Logged-in pages pass axe
(WCAG 2 A/AA) with no violations. Fonts are bundled via `@fontsource`, so
there are no third-party requests.
