import React, { useContext, createContext } from "react";
import { usePending as Pending } from "../hooks/usePending";

type PendingProviderProps = {
    children: React.ReactNode;
};

const usePendingContext = createContext<ReturnType<typeof Pending> | null>(null);

export function PendingProvider({ children }: PendingProviderProps) {
    const state = Pending();

    return (
        <usePendingContext.Provider value={state}>
            {children}
        </usePendingContext.Provider>
    );
}

export function usePending() {
    const context = useContext(usePendingContext);
    if (!context) {
        throw new Error('usePending must be used inside PendingProvider');
    }
    return context;
}