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
    const prevUserIdRef = useRef<string | undefined>(undefined);

    useLayoutEffect(() => {
        if (!userId) return;

        if (prevUserIdRef.current !== userId) {
            setMessages([]);
            setIsMessagesLoaded(false);
            setHasMore(true);
            setIsLoading(false);
            offsetRef.current = 0;
            prevUserIdRef.current = userId;
        }

        const fetchInitial = async () => {
            setIsLoading(true);
            try {
                const { response, data } = await api.directMessages.get(userId, 50, 0);
                if (!response.ok) return;
                const fetched = data.messages || [];
                setMessages(fetched);
                setIsMessagesLoaded(true);
                offsetRef.current = fetched.length;
                if (fetched.length < 50) setHasMore(false);
            } catch (error) {
                console.error('Error fetching direct messages:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitial();
    }, [userId]);

    const loadMore = useCallback(async () => {
        if (!userId || !hasMore || isLoading) return;

        setIsLoading(true);
        try {
            const { response, data } = await api.directMessages.get(userId, 10, offsetRef.current);
            if (!response.ok) {
                setHasMore(false);
                return;
            }
            const older = data.messages || [];

            if (older.length < 10) setHasMore(false);
            if (older.length > 0) {
                setMessages(prev => [...older, ...prev]);
                offsetRef.current += older.length;
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
                setMessages(currentMessages => {
                    return [
                        ...currentMessages,
                        {
                            id: data.id,
                            senderId: data.senderId,
                            recipientId: data.recipientId,
                            message: data.message,
                            createdAt: data.createdAt,
                            senderUsername: data.senderUsername,
                            senderImage: data.senderImage,
                        },
                    ];
                });
            }
            if (data.type === "directMessageDeleted") {
                setMessages(prev => prev.filter(m => m.id !== data.id));
            }
        };
        const ws = window._ws?.ws;
        if (ws) {
            ws.addEventListener("message", handleMessage);
            return () => ws.removeEventListener("message", handleMessage);
        }
    }, [userId]);

    return { messages, setMessages, isMessagesLoaded, hasMore, isLoading, loadMore };
}