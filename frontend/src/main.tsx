import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Auth from './pages/Auth';
import NotFound from './pages/NotFound';
import MagicLink from './pages/MagicLink';
import Logout from './pages/Logout';
import FriendsPanel from './components/friendspanel/FriendsPanel';
import Conversation from './components/chat/Conversation';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from './hooks/useRouteGuards';
import { UserProvider } from './contexts/useCurrentUser';
import { MainLayout } from './layouts/MainLayout';
import { MainWithProviders } from './layouts/Providers';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route
          path="/auth"
          element={
            <PublicRoute>
              <Auth />
            </PublicRoute>
          }
        />
        <Route
          path="/magic-link"
          element={
            <PublicRoute>
              <MagicLink />
            </PublicRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainWithProviders>
                <MainLayout>
                  <FriendsPanel />
                </MainLayout>
              </MainWithProviders>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:userId"
          element={
            <ProtectedRoute>
              <MainWithProviders>
                <MainLayout>
                  <Conversation />
                </MainLayout>
              </MainWithProviders>
            </ProtectedRoute>
          }
        />
        <Route
          path="/logout"
          element={
            <ProtectedRoute>
              <UserProvider>
                <Logout />
              </UserProvider>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);