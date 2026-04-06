import React, { useContext, createContext } from "react";
import { useOnlineFriends as OnlineFriends } from "../hooks/useOnlineFriends";

type OnlineFriendsProviderProps = {
    children: React.ReactNode;
};

const useOnlineFriendsContext = createContext<ReturnType<typeof OnlineFriends> | null>(null);

export function OnlineFriendsProvider({ children }: OnlineFriendsProviderProps) {
    const state = OnlineFriends();

    return (
        <useOnlineFriendsContext.Provider value={state}>
            {children}
        </useOnlineFriendsContext.Provider>
    );
}

export function useOnlineFriends() {
    const context = useContext(useOnlineFriendsContext);
    if (!context) {
        throw new Error('useOnlineFriends must be used inside OnlineFriendsProvider');
    }
    return context;
}