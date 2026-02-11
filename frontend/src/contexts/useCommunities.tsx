import { useCommunities as Communities } from "../hooks/useCommunities";
import React, { createContext, useContext } from "react";

type CommunitiesProviderProps = {
    children: React.ReactNode;
}

const useCommunitiesContext = createContext<ReturnType<typeof Communities> | null>(null);

export function CommunitiesProvider({ children }: CommunitiesProviderProps) {
    const state = Communities();

    return(
        <useCommunitiesContext.Provider value={state}>
            { children }
        </useCommunitiesContext.Provider>
    );
}

export function useCommunities() {
    const context = useContext(useCommunitiesContext);
    if (!context) {
        throw new Error('useCommunities must be used inside UserProvider');
    }
    return context;
}
