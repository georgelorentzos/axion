import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Auth from './pages/Auth';
import NotFound from './pages/NotFound';
import MagicLink from './pages/MagicLink';
import Home from './pages/Home';
import DirectMessage from './pages/DirectMessage';
import Logout from './pages/Logout';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from './hooks/useRouteGuards';
import { UserProvider } from './contexts/useCurrentUser';
import { OnlineFriendsProvider } from "./contexts/useOnlineFriends";
import { AllFriendsProvider } from './contexts/useAllFriends';
import { PendingsProvider } from './contexts/usePendings';
import { DirectMessagesProvider } from './contexts/useDirectMessages';

const HomeWithProviders = () => (
  <UserProvider>
    <OnlineFriendsProvider>
      <AllFriendsProvider>
        <PendingsProvider>
          <DirectMessagesProvider>
            <Home />
          </DirectMessagesProvider>
        </PendingsProvider>
      </AllFriendsProvider>
    </OnlineFriendsProvider>
  </UserProvider>
);

const DirectMessageWithProviders = () => (
  <UserProvider>
    <DirectMessagesProvider>
      <DirectMessage />
    </DirectMessagesProvider>
  </UserProvider>
);

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
              <HomeWithProviders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:userId"
          element={
            <ProtectedRoute>
              <DirectMessageWithProviders />
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