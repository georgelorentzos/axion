import React, { useContext, createContext } from "react";
import { useChannelMessages as ChannelMessages } from "../hooks/useChannelMessages";

type ChannelMessagesProviderProps = {
    children: React.ReactNode;
};

const useChannelMessagesContext = createContext<ReturnType<typeof ChannelMessages> | null>(null);

export function ChannelMessagesProvider({ children }: ChannelMessagesProviderProps) {
    const state = ChannelMessages();

    return (
        <useChannelMessagesContext.Provider value={state}>
            {children}
        </useChannelMessagesContext.Provider>
    );
}

export function useChannelMessages() {
    const context = useContext(useChannelMessagesContext);
    if (!context) {
        throw new Error("useChannelMessages must be used inside ChannelMessagesProvider");
    }
    return context;
}