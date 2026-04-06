import React, { useContext, createContext } from "react";
import { useMessages as Messages } from "../hooks/useMessages";

type MessagesContextType = ReturnType<typeof Messages>;

type MessagesProviderProps = {
    children: React.ReactNode;
};

const MessagesContext = createContext<MessagesContextType | null>(null);

export function MessagesProvider({ children }: MessagesProviderProps) {
    const state = Messages();

    return (
        <MessagesContext.Provider value={state}>
            {children}
        </MessagesContext.Provider>
    );
}

export function useMessages() {
    const context = useContext(MessagesContext);
    if (!context) {
        throw new Error("useMessages must be used inside MessagesProvider");
    }
    return context;
}