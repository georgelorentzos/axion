import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Auth from './pages/Auth';
import NotFound from './pages/NotFound';
import MagicLink from './pages/MagicLink';
import Home from './pages/Home';
import Logout from './pages/Logout';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from './hooks/useRouteGuards';
import { UserProvider } from './contexts/useCurrentUser';
import { OnlineFriendsProvider } from "./contexts/useOnlineFriends";
import { AllFriendsProvider } from './contexts/useAllFriends';
import { PendingsProvider } from './contexts/usePendings';

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
              <UserProvider>
                <OnlineFriendsProvider>
                  <AllFriendsProvider>
                    <PendingsProvider>
                      <Home />
                    </PendingsProvider>
                  </AllFriendsProvider>
                </OnlineFriendsProvider>
              </UserProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/logout"
          element={
            <ProtectedRoute>
              <Logout />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);