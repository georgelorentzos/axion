import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../api/client";
import { useCurrentUser } from "../../user/contexts/useCurrentUser";
import { type Conversation } from "../types/conversation";

export function useConversations() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const { currentUser } = useCurrentUser();
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioRef.current = new Audio();
    }, []);

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const { data } = await api.conversations.getAll();
                setConversations(
                    (data.conversations || []).map((conversationData: any) => ({
                        user: {
                            id: conversationData.id,
                            username: conversationData.username,
                            image: conversationData.image,
                            isOnline: conversationData.isOnline,
                            createdAt: conversationData.createdAt,
                        },
                        latestMessage: conversationData.latestMessage,
                    }))
                );
            } catch (error) {
                console.error('Fetch conversations error:', error);
                setConversations([]);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchConversations();
    }, []);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const data = JSON.parse(event.data);

            if (data.type === 'conversationUpdated') {
                setConversations(previousConversations => {
                    const conversationExists = previousConversations.find(
                        conversation => conversation.user.id === data.id
                    );
                    
                    if (conversationExists) {
                        return previousConversations.map(conversation =>
                            conversation.user.id === data.id
                                ? { ...conversation, latestMessage: data.latestMessage }
                                : conversation
                        );
                    }
                    
                    return [
                        {
                            user: {
                                id: data.id,
                                username: data.username,
                                image: data.image,
                                isOnline: data.isOnline,
                                createdAt: data.createdAt,
                            },
                            latestMessage: data.latestMessage,
                        },
                        ...previousConversations,
                    ];
                });
            }

            if (data.type === 'conversationDeleted') {
                setConversations(previousConversations => 
                    previousConversations.filter(conversation => conversation.user.id !== data.id)
                );
                navigate('/');
            }

            if (data.type === 'userOnline') {
                setConversations(previousConversations =>
                    previousConversations.map(conversation =>
                        conversation.user.id === data.id
                            ? { ...conversation, user: { ...conversation.user, isOnline: true } }
                            : conversation
                    )
                );
            }

            if (data.type === 'userOffline') {
                setConversations(previousConversations =>
                    previousConversations.map(conversation =>
                        conversation.user.id === data.id
                            ? { ...conversation, user: { ...conversation.user, isOnline: false } }
                            : conversation
                    )
                );
            }
        };

        const webSocket = window._ws?.ws;
        if (webSocket) {
            webSocket.addEventListener('message', handleMessage);
            return () => webSocket.removeEventListener('message', handleMessage);
        }
    }, [currentUser?.id, navigate]);

    return { conversations, setConversations, isLoading };
}