import React, { useContext, createContext } from 'react';
import { useConversations as Conversations } from '../hooks/useConversations';

type ConversationsProviderProps = {
    children: React.ReactNode;
};

const useConversationsContext = createContext<ReturnType<typeof Conversations> | null>(null);

export function ConversationsProvider({ children }: ConversationsProviderProps) {
    const state = Conversations();

    return (
        <useConversationsContext.Provider value={state}>
            {children}
        </useConversationsContext.Provider>
    );
}

export function useConversations() {
    const context = useContext(useConversationsContext);
    if (!context) {
        throw new Error('useConversations must be used inside ConversationsProvider');
    }
    return context;
}