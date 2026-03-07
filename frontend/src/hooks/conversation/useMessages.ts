import { useLayoutEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { type Message } from "../../types/message";

export function useMessages() {
    const { userId } = useParams();
    const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;
    const token = localStorage.getItem("token");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isMessagesLoaded, setIsMessagesLoaded] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const offsetRef = useRef(0);
    const prevUserIdRef = useRef<string | undefined>(undefined);

    useLayoutEffect(() => {
        if (!token || !userId) return;

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
                const response = await fetch(`${apiUrl}/api/messages/${userId}?limit=50&offset=0`, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-type": "application/json"
                    }
                });
                if (!response.ok) return;
                const data = await response.json();
                const fetched = data.messages || [];
                setMessages(fetched);
                setIsMessagesLoaded(true);
                offsetRef.current = fetched.length;
                if (fetched.length < 50) setHasMore(false);
            } catch (error) {
                console.error('Error fetching messages:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitial();
    }, [userId]);

    const loadMore = useCallback(async () => {
        if (!token || !userId || !hasMore || isLoading) return;

        setIsLoading(true);
        try {
            const response = await fetch(
                `${apiUrl}/api/messages/${userId}?limit=10&offset=${offsetRef.current}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-type": "application/json"
                }
            });
            if (!response.ok) {
                setHasMore(false);
                return;
            }
            const data = await response.json();
            const older = data.messages || [];

            if (older.length < 10) setHasMore(false);
            if (older.length > 0) {
                setMessages(prev => [...older, ...prev]);
                offsetRef.current += older.length;
            }
        } catch (error) {
            console.error('Error fetching older messages:', error);
            setHasMore(false);
        } finally {
            setIsLoading(false);
        }
    }, [userId, hasMore, isLoading]);

    return { messages, setMessages, isMessagesLoaded, hasMore, isLoading, loadMore };
}