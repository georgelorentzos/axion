import React, { useContext, createContext } from "react";
import { useAllFriends as AllFriends } from "../hooks/useAllFriends";

type AllFriendsProviderProps = {
    children: React.ReactNode;
};

const useAllFriendsContext = createContext<ReturnType<typeof AllFriends> | null>(null);

export function AllFriendsProvider({ children }: AllFriendsProviderProps) {
    const state = AllFriends();

    return (
        <useAllFriendsContext.Provider value={state}>
            {children}
        </useAllFriendsContext.Provider>
    );
}

export function useAllFriends() {
    const context = useContext(useAllFriendsContext);
    if (!context) {
        throw new Error('useAllFriends must be used inside AllFriendsProvider');
    }
    return context;
}