import React, { useContext, createContext } from "react";
import { usePendings as Pendings } from "../hooks/usePendings";

type PendingsProviderProps = {
    children: React.ReactNode;
}

const PendingsContext = createContext<ReturnType<typeof Pendings> | null>(null);

export function PendingsProvider({ children }: PendingsProviderProps) {
    const state = Pendings();

    return (
        <PendingsContext.Provider value={state}>
            { children }
        </PendingsContext.Provider>
    );
}

export function usePendings() {
    const context = useContext(PendingsContext);
    if (!context) {
        throw new Error('usePendings must be used inside UserProvider');
    }
    return context;
}