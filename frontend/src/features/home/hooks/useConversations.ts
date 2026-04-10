import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom";
import { api } from "../../../api/client";
import { useCurrentUser } from "../../user/contexts/useCurrentUser";
import { type Conversation } from "../types/conversation";

export function useConversations() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { currentUser } = useCurrentUser();
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioRef.current = new Audio();
    }, []);

    useEffect(() => {
        const loadConversations = async () => {
            try {
                const { data } = await api.directMessages.conversations();
                setConversations(
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
                console.error('Fetch conversations error:', error);
                setConversations([]);
            } finally {
                setLoading(false);
            }
        };
        loadConversations();
    }, []);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            if (data.type === 'conversationDeleted') {
                setConversations(prev => prev.filter(dm => dm.user.id !== data.id));
                navigate('/');
            }
            if (data.type === 'userOnline') {
                setConversations(prev =>
                    prev.map(dm =>
                        dm.user.id === data.id ? { ...dm, user: { ...dm.user, isOnline: true } } : dm
                    )
                );
            }
            if (data.type === 'userOffline') {
                setConversations(prev =>
                    prev.map(dm =>
                        dm.user.id === data.id ? { ...dm, user: { ...dm.user, isOnline: false } } : dm
                    )
                );
            }
        };
        const ws = window._ws?.ws;
        if (ws) {
            ws.addEventListener('message', handleMessage);
            return () => ws.removeEventListener('message', handleMessage);
        }
    }, [currentUser?.id, navigate]);

    return { conversations, setConversations, loading };
}