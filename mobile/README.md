# Quad — mobile app

React Native (Expo SDK 58, Expo Router) client for the same Express/MongoDB API
the web app uses. Every call is async `fetch` with JSON bodies (`src/lib/api.js`).

## Run it on your phone

1. Install **Expo Go** from the App Store / Play Store.
2. Point the app at the deployed API: create `mobile/.env` with
   ```
   EXPO_PUBLIC_API_URL=https://your-domain.com
   ```
   (no trailing slash; it must be the remote server, not localhost).
3. ```bash
   cd mobile
   npm install
   npx expo start
   ```
4. Scan the QR code with your phone camera (iOS) or the Expo Go app (Android).
   If your phone and laptop are on different networks (e.g. UCF Wi-Fi), use
   `npx expo start --tunnel`.

## Screens

| Screen | File | API calls |
|---|---|---|
| Log in | `src/app/login.js` | `POST /api/login` (401 wrong password, 403 unverified email) |
| Create account | `src/app/register.js` | `POST /api/register`, `POST /api/resend-verification` |
| Reset password | `src/app/forgot-password.js` | `POST /api/forgot-password` |
| Events tab (All campus / My clubs / Going / Past) | `src/app/(tabs)/index.js` | `GET /api/events?userId&view` |
| Clubs tab (search) | `src/app/(tabs)/clubs.js` | `GET /api/clubs?userId&search` |
| Profile tab (my clubs, log out) | `src/app/(tabs)/profile.js` | `GET /api/clubs?mine=member` |
| Event details: RSVP, +1s, guest list, comments | `src/app/event/[code].js` | `GET /api/events/:code`, `POST …/rsvp`, `GET/POST …/comments` |
| Club details: join/leave, events, members | `src/app/club/[id].js` | `GET /api/clubs/:id`, `POST …/join`, `POST …/leave` |

Creating and editing clubs and events is done on the web app (officer tools).

The logged-in user `{ id, FirstName, LastName }` is saved with AsyncStorage, so
the app stays logged in between launches. `src/app/_layout.js` uses
`Stack.Protected` to show only the login screens until someone logs in.
