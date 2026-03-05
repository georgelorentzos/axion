import React, { createContext, useContext } from "react";
import { useCommunity as Community } from "../../hooks/community/useCommunity";

type CommunityProviderProps = {
    children: React.ReactNode;  
}

const useCommunityProviderContext = createContext<ReturnType<typeof Community> | null>(null);

export function CommunityProvider({ children }: CommunityProviderProps) {
    const state = Community();

    return(
        <useCommunityProviderContext.Provider value={state}>
            { children }
        </useCommunityProviderContext.Provider>
    );
}

export function useCommunity() {
    const context = useContext(useCommunityProviderContext);
    if (!context) {
        throw new Error('useCommunity must be used inside UserProvider');
    }
    return context;
}