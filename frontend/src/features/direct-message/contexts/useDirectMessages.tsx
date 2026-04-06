import React, { useContext, createContext } from "react";
import { useDirectMessages as DirectMessages } from "../hooks/useDirectMessages";

type DirectMessagesProviderProps = {
    children: React.ReactNode;
};

const useDirectMessagesContext = createContext<ReturnType<typeof DirectMessages> | null>(null);

export function DirectMessagesProvider({ children }: DirectMessagesProviderProps) {
    const state = DirectMessages();

    return (
        <useDirectMessagesContext.Provider value={state}>
            {children}
        </useDirectMessagesContext.Provider>
    );
}

export function useDirectMessages() {
    const context = useContext(useDirectMessagesContext);
    if (!context) {
        throw new Error("useDirectMessages must be used inside DirectMessagesProvider");
    }
    return context;
}