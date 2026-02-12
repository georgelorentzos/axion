import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import MagicLink from "./pages/MagicLink";
import Logout from "./pages/Logout";
import FriendsPanel from "./components/friendspanel/FriendsPanel";
import Conversation from "./components/chat/Conversation";

import { ProtectedRoute, PublicRoute } from "./hooks/useRouteGuards";
import { UserProvider } from "./contexts/useCurrentUser";
import { MainLayout } from "./layouts/MainLayout";
import { MainWithProviders } from "./layouts/Providers";

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
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
