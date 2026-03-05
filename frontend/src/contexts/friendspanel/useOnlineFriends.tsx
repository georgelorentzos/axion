import React, { useContext, createContext } from "react";
import { useOnlineFriends as OnlineFriends } from "../../hooks/friendspanel/useOnlineFriends";

type OnlineFriendsProviderProps = {
    children: React.ReactNode;
}

const OnlineFriendsContext = createContext<ReturnType<typeof OnlineFriends> | null>(null);

export function OnlineFriendsProvider({ children } : OnlineFriendsProviderProps) {
    const state = OnlineFriends();
    return (
        <OnlineFriendsContext.Provider value={state}>
            { children }
        </OnlineFriendsContext.Provider>
    );
}

export function useOnlineFriends() {
    const context = useContext(OnlineFriendsContext);
    if (!context) {
        throw new Error('useOnlineFriends must be used inside UserProvider');
    }
    return context;
}