import React, { useContext, createContext } from "react";
import { useUser as User } from "../../hooks/conversation/useUser";

type UserProviderProps = {
    children: React.ReactNode;
}

const useUserContext = createContext<ReturnType<typeof User> | null>(null);

export function UserProvider({ children }: UserProviderProps) {
    const state = User();

    return(
        <useUserContext.Provider value={state}>
            { children }
        </useUserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(useUserContext);
    if (!context) {
        throw new Error('useUser must be used inside UserProvider');
    }
    return context;
}