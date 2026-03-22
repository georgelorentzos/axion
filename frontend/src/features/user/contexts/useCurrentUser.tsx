import React, { createContext, useContext } from "react";
import { useCurrentUser as CurrentUser } from '../hooks/useCurrentUser';

type UserProviderProps = {
    children: React.ReactNode;
};

const UserContext = createContext<ReturnType<typeof CurrentUser> | null>(null);

export function UserProvider({ children }: UserProviderProps) {
    const userState = CurrentUser();

    return (
        <UserContext.Provider value={userState}>
          {children}
        </UserContext.Provider>
    );
}

export function useCurrentUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useCurrentUser must be used inside UserProvider');
  }
  return context;
}