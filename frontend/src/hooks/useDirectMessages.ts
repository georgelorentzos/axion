import { useState, useEffect } from "react"
import { type User } from "../types/user";

type ConversationItem = {
    user: User;
    latestMessage: string;
};

export function useDirectMessages() {
    const [directMessages, setDirectMessages] = useState<ConversationItem[]>([]);
    const token = localStorage.getItem('token');
    const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }

        const loadDirectMessages = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/my/conversations`, {
                    method: 'GET',
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                const data = await response.json();
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

    return { directMessages, setDirectMessages, loading };
}