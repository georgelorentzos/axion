import React, { useContext, createContext } from "react";
import { useAllFriends as AllFriends } from "../../hooks/friendspanel/useAllFriends";

type AllFriendsProviderProps = {
    children: React.ReactNode;
};

const AllFriendsContext = createContext<ReturnType<typeof AllFriends> | null>(null);

export function AllFriendsProvider({ children }: AllFriendsProviderProps) {
    const state = AllFriends();

    return (
        <AllFriendsContext.Provider value={state}>
            { children }
        </AllFriendsContext.Provider>
    );
}

export function useAllFriends() {
    const context = useContext(AllFriendsContext);
    if (!context) {
        throw new Error('useAllFriends must be used inside UserProvider');
    }
    return context;
}

