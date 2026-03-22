import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Auth from "./features/auth/pages/Auth";
import NotFound from "./features/auth/pages/NotFound";
import MagicLink from "./features/auth/pages/MagicLink";
import Logout from "./features/auth/pages/Logout";
import FriendsPanel from "./features/friends/components/FriendsPanel";
import Conversation from "./features/chat/components/Conversation";
import JoinCommunity from "./features/community/pages/JoinCommunity";

import { ProtectedRoute, PublicRoute } from "./features/user/hooks/useRouteGuards";
import { UserProvider } from "./features/user/contexts/useCurrentUser";
import { MainLayout } from "./layouts/MainLayout";
import { MainWithProviders } from "./layouts/Providers";
import { CommunitiesProvider } from "./features/community/contexts/useCommunities";

function App() {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener("contextmenu", handleContextMenu);
    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  return (
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
          path="/community/:communityId"
          element={
            <ProtectedRoute>
              <MainWithProviders>
                <MainLayout>
                  <></>
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
        <Route
        path="/join/:communityId"
        element={
          <CommunitiesProvider>
            <JoinCommunity />
          </CommunitiesProvider>
        }/>
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
