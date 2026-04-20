import { useLayoutEffect, useState, useRef, useCallback, useEffect } from "react";
import { useParams } from "react-router-dom";
import { type Message } from "../../../types/message";
import { api } from "../../../api/client";

export function useDirectMessages() {
    const { userId } = useParams();
    const [messages, setMessages] = useState<Message[]>([]);
    const [isMessagesLoaded, setIsMessagesLoaded] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const offsetRef = useRef(0);
    const previousUserIdRef = useRef<string | undefined>(undefined);
    
    useLayoutEffect(() => {
        if (!userId) return;

        if (previousUserIdRef.current !== userId) {
            setMessages([]);
            setIsMessagesLoaded(false);
            setHasMore(true);
            setIsLoading(false);
            offsetRef.current = 0;
            previousUserIdRef.current = userId;
        }

        const fetchInitialMessages = async () => {
            setIsLoading(true);
            try {
                const { response, data } = await api.messages.get(userId, 50, 0);
                if (!response.ok) return;
                
                const fetchedMessages = data.messages || [];
                setMessages(fetchedMessages);
                setIsMessagesLoaded(true);
                offsetRef.current = fetchedMessages.length;
                
                if (fetchedMessages.length < 50) {
                    setHasMore(false);
                }
            } catch (error) {
                console.error('Error fetching direct messages:', error);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchInitialMessages();
    }, [userId]);

    const loadMoreMessages = useCallback(async () => {
        if (!userId || !hasMore || isLoading) return;

        setIsLoading(true);
        try {
            const { response, data } = await api.messages.get(userId, 10, offsetRef.current);
            if (!response.ok) {
                setHasMore(false);
                return;
            }
            
            const olderMessages = data.messages || [];

            if (olderMessages.length < 10) {
                setHasMore(false);
            }
            
            if (olderMessages.length > 0) {
                setMessages(previousMessages => [...olderMessages, ...previousMessages]);
                offsetRef.current += olderMessages.length;
            }
        } catch (error) {
            console.error('Error fetching older direct messages:', error);
            setHasMore(false);
        } finally {
            setIsLoading(false);
        }
    }, [userId, hasMore, isLoading]);

    useEffect(() => {
        const handleMessage = async (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            
            if (data.type === "newDirectMessage") {
                setMessages(currentMessages => [
                    ...currentMessages,
                    {
                        id: data.id,
                        senderId: data.senderId,
                        recipientId: data.recipientId,
                        message: data.message,
                        isEdited: data.isEdited,
                        createdAt: data.createdAt,
                        senderUsername: data.senderUsername,
                        senderImage: data.senderImage,
                        replyToId: data.replyToId,
                        replyToUsername: data.replyToUsername,
                        replyToImage: data.replyToImage,
                        replyToMessage: data.replyToMessage,
                    },
                ]);
            }
            
            if (data.type === "unreadDirectMessages") {
                window.dispatchEvent(new CustomEvent("unreadDirectMessages", {
                    detail: {
                        id: data.id,
                        username: data.username,
                        image: data.image,
                        isOnline: data.isOnline,
                        createdAt: data.createdAt,
                        unreadCount: 1,
                    }
                }));
            }
            
            if (data.type === "directMessageDeleted") {
                setMessages(previousMessages => 
                    previousMessages.filter(message => message.id !== data.id)
                );
            }
            
            if (data.type === "directMessageEdited") {
                setMessages(previousMessages => 
                    previousMessages.map(message => 
                        message.id === data.id 
                            ? {
                                ...message,
                                message: data.message,
                                isEdited: data.isEdited
                              }
                            : message
                    )
                );
            }
        };
        
        const webSocket = window._ws?.ws;
        if (webSocket) {
            webSocket.addEventListener("message", handleMessage);
            return () => webSocket.removeEventListener("message", handleMessage);
        }
    }, [userId]);

    return { 
        messages, 
        setMessages, 
        isMessagesLoaded, 
        hasMore, 
        isLoading, 
        loadMoreMessages 
    };
}