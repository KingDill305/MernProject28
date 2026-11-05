import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import '@fontsource-variable/figtree/index.css';
import '@fontsource-variable/bricolage-grotesque/index.css';
import './styles.css';
import { AuthProvider, RequireAuth } from './auth.jsx';

// Each page is its own chunk, so a guest opening an invite link only downloads the event page.
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail.jsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'));
const Events = lazy(() => import('./pages/Events.jsx'));
const Clubs = lazy(() => import('./pages/Clubs.jsx'));
const ClubPage = lazy(() => import('./pages/ClubPage.jsx'));
const ClubEditor = lazy(() => import('./pages/ClubEditor.jsx'));
const EventEditor = lazy(() => import('./pages/EventEditor.jsx'));
const EventPage = lazy(() => import('./pages/EventPage.jsx'));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={null}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/events" element={<RequireAuth><Events /></RequireAuth>} />
          <Route path="/clubs" element={<RequireAuth><Clubs /></RequireAuth>} />
          <Route path="/clubs/new" element={<RequireAuth><ClubEditor /></RequireAuth>} />
          <Route path="/clubs/:id" element={<RequireAuth><ClubPage /></RequireAuth>} />
          <Route path="/clubs/:id/edit" element={<RequireAuth><ClubEditor /></RequireAuth>} />
          <Route path="/events/new" element={<RequireAuth><EventEditor /></RequireAuth>} />
          <Route path="/e/:code" element={<EventPage />} />
          <Route path="/e/:code/edit" element={<RequireAuth><EventEditor /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/events" replace />} />
        </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
