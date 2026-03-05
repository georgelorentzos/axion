import React, { useContext, createContext } from "react";
import { useLogs as Logs } from "../../hooks/community/useLogs";

type useLogsProviderProps = {
    children: React.ReactNode;
}

const useLogsProviderContext = createContext<ReturnType<typeof Logs> | null>(null);

export function LogsProvider({ children }: useLogsProviderProps) {
    const state = Logs();

    return(
        <useLogsProviderContext.Provider value={state}>
            {children}
        </useLogsProviderContext.Provider>
    );
}

export function useLogs() {
    const context = useContext(useLogsProviderContext);
    if (!context) {
        throw new Error('useLogs must be used inside UserProvider');
    }
    return context;
}