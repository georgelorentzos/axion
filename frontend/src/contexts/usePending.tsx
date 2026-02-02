import React, { useContext, createContext } from "react";
import { usePending as Pending } from "../hooks/usePending";

type PendingProviderProps = {
    children: React.ReactNode;
}

const PendingContext = createContext<ReturnType<typeof Pending> | null>(null);

export function PendingProvider({ children }: PendingProviderProps) {
    const state = Pending();

    return (
        <PendingContext.Provider value={state}>
            { children }
        </PendingContext.Provider>
    );
}

export function usePending() {
    const context = useContext(PendingContext);
    if (!context) {
        throw new Error('usePending must be used inside UserProvider');
    }
    return context;
}