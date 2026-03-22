import { useState, useEffect } from "react"
import { type User } from "../../user/types/user";
import { api } from "../../../api/client";

type ConversationItem = {
    user: User;
    latestMessage: string;
};

export function useDirectMessages() {
    const [directMessages, setDirectMessages] = useState<ConversationItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDirectMessages = async () => {
            try {
                const { data } = await api.messages.conversations();
                setDirectMessages(
                    (data.conversations || []).map((c: any) => ({
                        user: {
                            id: c.id,
                            username: c.username,
                            image: c.image,
                            isOnline: c.isOnline,
                            createdAt: c.createdAt,
                        },
                        latestMessage: c.latestMessage,
                    }))
                );
            } catch (error) {
                console.error('Fetch direct messages error:', error);
                setDirectMessages([]);
            } finally {
                setLoading(false);
            }
        };
        loadDirectMessages();
    }, []);

    useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            try {
                const data = JSON.parse(e.data);
                if (data.type === "conversationDeleted") {
                    setDirectMessages(prev =>
                        prev.filter(dm => dm.user.id !== data.conversationId)
                    );
                }
                if (data.type === "newDirectMessage") {
                    setDirectMessages(prev => {
                        const exists = prev.some(dm => dm.user.id === data.id);
                        if (exists) {
                            return prev.map(dm =>
                                dm.user.id === data.id
                                    ? { ...dm, latestMessage: data.latestMessage }
                                    : dm
                            );
                        }
                        return [{
                            user: {
                                id: data.id,
                                username: data.username,
                                image: data.image,
                                isOnline: data.isOnline,
                                createdAt: data.createdAt,
                            },
                            latestMessage: data.latestMessage,
                        }, ...prev];
                    });
                }
            } catch (error) {
                console.error('Parse error:', error);
            }
        };
        const ws = window._ws?.ws;
        if (ws) {
            ws.addEventListener('message', handleMessage);
            return () => ws.removeEventListener('message', handleMessage);
        }
    }, []);

    return { directMessages, setDirectMessages, loading };
}
