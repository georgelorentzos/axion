import { useDirectMessages as DirectMessages } from '../../hooks/chatoverview/useDirectMessages';
import React, { useContext, createContext } from 'react';

type DirectMessagesProviderProps = {
    children: React.ReactNode;
};

const directMessagesContext = createContext<ReturnType<typeof DirectMessages> | null>(null);

export function DirectMessagesProvider( { children } : DirectMessagesProviderProps ) {
    const state = DirectMessages();

    return (
        <directMessagesContext.Provider value={state}>
            { children }
        </directMessagesContext.Provider>
    );
}

export function useDirectMessages() {
    const context = useContext(directMessagesContext);
    if (!context) {
        throw new Error('useDirectMessages must be used inside UserProvider');
    }
    return context
}