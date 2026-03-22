import React, { useContext, createContext } from "react";
import { useBans as Bans } from "../hooks/useBans";

type useBansProviderProps = {
    children: React.ReactNode;
}

const useBansProviderContext = createContext<ReturnType<typeof Bans> | null>(null);

export function BansProvider({ children }: useBansProviderProps) {
    const state = Bans();

    return(
        <useBansProviderContext.Provider value={state}>
            {children}
        </useBansProviderContext.Provider>
    );
}

export function useBans() {
    const context = useContext(useBansProviderContext);
    if (!context) {
        throw new Error('useBans must be used inside UserProvider');
    }
    return context;
}