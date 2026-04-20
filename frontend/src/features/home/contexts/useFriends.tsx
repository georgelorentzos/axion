import React, { useContext, createContext } from "react";
import { useFriends as Friends } from "../hooks/useFriends";

type FriendsProviderProps = {
    children: React.ReactNode;
};

const useFriendsContext = createContext<ReturnType<typeof Friends> | null>(null);

export function FriendsProvider({ children }: FriendsProviderProps) {
    const state = Friends();

    return (
        <useFriendsContext.Provider value={state}>
            {children}
        </useFriendsContext.Provider>
    );
}

export function useFriends() {
    const context = useContext(useFriendsContext);
    if (!context) {
        throw new Error('useFriends must be used inside FriendsProvider');
    }
    return context;
}