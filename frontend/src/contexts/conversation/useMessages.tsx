import React, { useContext, createContext } from "react";
import { useMessages as Messages } from "../../hooks/conversation/useMessages";

type MessagesProviderProps = {
    children: React.ReactNode;
}

const useMessagesContext = createContext<ReturnType<typeof Messages> | null>(null);

export function MessagesProvider({ children }: MessagesProviderProps) {
    const state = Messages();

    return(
        <useMessagesContext.Provider value={state}>
            { children }
        </useMessagesContext.Provider>
    );
}

export function useMessages() {
    const context = useContext(useMessagesContext);
    if (!context) {
        throw new Error('useMessages must be used inside UserProvider');
    }
    return context;
}