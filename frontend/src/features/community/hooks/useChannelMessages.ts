import { useLayoutEffect, useState, useRef, useCallback, useEffect } from "react";
import { useParams } from "react-router-dom";
import { type Message } from "../../../types/message";
import { api } from "../../../api/client";

export function useChannelMessages() {
    const { communityId, channelId } = useParams();
    const [messages, setMessages] = useState<Message[]>([]);
    const [isMessagesLoaded, setIsMessagesLoaded] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const offsetRef = useRef(0);
    const prevChannelIdRef = useRef<string | undefined>(undefined);

    useLayoutEffect(() => {
        if (!communityId || !channelId) return;

        if (prevChannelIdRef.current !== channelId) {
            setMessages([]);
            setIsMessagesLoaded(false);
            setHasMore(true);
            setIsLoading(false);
            offsetRef.current = 0;
            prevChannelIdRef.current = channelId;
        }

        const fetchInitial = async () => {
            setIsLoading(true);
            try {
                const { response, data } = await api.channelMessages.get(communityId, channelId, 50, 0);
                if (!response.ok) return;
                const fetched = data.messages || [];
                setMessages(fetched);
                setIsMessagesLoaded(true);
                offsetRef.current = fetched.length;
                if (fetched.length < 50) setHasMore(false);
            } catch (error) {
                console.error('Error fetching channel messages:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitial();
    }, [communityId, channelId]);

    const loadMore = useCallback(async () => {
        if (!communityId || !channelId || !hasMore || isLoading) return;

        setIsLoading(true);
        try {
            const { response, data } = await api.channelMessages.get(communityId, channelId, 10, offsetRef.current);
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
            console.error('Error fetching older channel messages:', error);
            setHasMore(false);
        } finally {
            setIsLoading(false);
        }
    }, [communityId, channelId, hasMore, isLoading]);

    useEffect(() => {
        const handleMessage = async (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            if (data.type === "newChannelMessage") {
                setMessages(currentMessages => {
                    return [
                        ...currentMessages,
                        {
                            id: data.id,
                            senderId: data.senderId,
                            channelId: data.channelId,
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
                    ];
                });
            }
            if (data.type === "channelMessageDeleted") {
                setMessages(prev => prev.filter(m => m.id !== data.id));
            }
            if (data.type === "channelMessageEdited") {
                setMessages(prev => prev.map(
                    message => message.id === data.id ? {
                        ...message,
                        message: data.message,
                        isEdited: data.isEdited
                    } : message
                ));
            }
        };
        const ws = window._ws?.ws;
        if (ws) {
            ws.addEventListener("message", handleMessage);
            return () => ws.removeEventListener("message", handleMessage);
        }
    }, [communityId]);

    return { messages, setMessages, isMessagesLoaded, hasMore, isLoading, loadMore };
}