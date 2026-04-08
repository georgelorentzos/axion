import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Auth from "./features/auth/Auth";
import NotFound from "./features/auth/NotFound";
import MagicLink from "./features/auth/MagicLink";
import Logout from "./features/auth/Logout";
import FriendsPanel from "./features/home/components/FriendsPanel";
import DirectMessageConversation from "./features/direct-message/components/DirectMessageConversation";
import JoinCommunity from "./features/community/pages/JoinCommunity";

import { ProtectedRoute, PublicRoute } from "./features/user/hooks/useRouteGuards";
import { UserProvider } from "./features/user/contexts/useCurrentUser";
import { HomeLayout } from "./layouts/HomeLayout";
import { CommunityLayout } from "./layouts/CommunityLayout";
import { MainWithProviders } from "./layouts/Providers";
import { CommunitiesProvider } from "./ui/sidebar/contexts/useCommunities";

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
          element={
            <ProtectedRoute>
              <MainWithProviders>
                <HomeLayout />
              </MainWithProviders>
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<FriendsPanel />} />
          <Route path="/chat/:userId" element={<DirectMessageConversation />} />
        </Route>

        <Route
          path="/community/:communityId/:channelId?"
          element={
            <ProtectedRoute>
              <MainWithProviders>
                <CommunityLayout />
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
        <Route
          path="/join/:communityId"
          element={
            <CommunitiesProvider>
              <JoinCommunity />
            </CommunitiesProvider>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);