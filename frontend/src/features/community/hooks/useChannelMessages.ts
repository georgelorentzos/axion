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
    const previousChannelIdRef = useRef<string | undefined>(undefined);

    useLayoutEffect(() => {
        if (!communityId || !channelId) return;

        if (previousChannelIdRef.current !== channelId) {
            setMessages([]);
            setIsMessagesLoaded(false);
            setHasMore(true);
            setIsLoading(false);
            offsetRef.current = 0;
            previousChannelIdRef.current = channelId;
        }

        const fetchInitialMessages = async () => {
            setIsLoading(true);
            try {
                const { response, data } = await api.channels.getMessages(communityId, channelId, 50, 0);
                if (!response.ok) return;
                
                const fetchedMessages = data.messages || [];
                setMessages(fetchedMessages);
                setIsMessagesLoaded(true);
                offsetRef.current = fetchedMessages.length;
                
                if (fetchedMessages.length < 50) {
                    setHasMore(false);
                }
            } catch (error) {
                console.error('Error fetching channel messages:', error);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchInitialMessages();
    }, [communityId, channelId]);

    const loadMoreMessages = useCallback(async () => {
        if (!communityId || !channelId || !hasMore || isLoading) return;

        setIsLoading(true);
        try {
            const { response, data } = await api.channels.getMessages(
                communityId, 
                channelId, 
                10, 
                offsetRef.current
            );
            
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
                setMessages(currentMessages => [
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
                ]);
            }
            
            if (data.type === "channelMessageDeleted") {
                setMessages(previousMessages => 
                    previousMessages.filter(message => message.id !== data.id)
                );
            }
            
            if (data.type === "channelMessageEdited") {
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
    }, [communityId]);

    return { 
        messages, 
        setMessages, 
        isMessagesLoaded, 
        hasMore, 
        isLoading, 
        loadMoreMessages 
    };
}