import { useChannels as Channels } from "../hooks/useChannels";
import React, { createContext, useContext } from "react";

const useChannelsContext = createContext<ReturnType<typeof Channels> | null>(null);

type ChannelsProviderProps = {
    children: React.ReactNode;
}

export function ChannelsProvider({ children }: ChannelsProviderProps) {
    const state = Channels();
    return (
        <useChannelsContext.Provider value={state}>
            {children}
        </useChannelsContext.Provider>
    );
}

export function useChannels() {
    const context = useContext(useChannelsContext);
    if (!context) {
        throw new Error("useChannels must be inside a UserProvider.");
    }
    return context;
}