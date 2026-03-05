import { useLayoutEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { type Message } from "../../types/message";

export function useMessages() {
    const { userId } = useParams();
    const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;
    const token = localStorage.getItem("token");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isMessagesLoaded, setIsMessagesLoaded] = useState(false);

    useLayoutEffect(() => {
        if (!token) return;
        if (!userId) return;
        const fetchMessages = async () => {
            try{
                const response = await fetch(`${apiUrl}/api/messages/${userId}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-type": "application/json"
                    }
                });
                const data = await response.json();
                setMessages(data.messages || []);
                setIsMessagesLoaded(true);
            } catch (error) {
                console.error('Error fetching messages:', error);
                setIsMessagesLoaded(false);
            }
        };
        fetchMessages();
    }, [userId]);

    return { messages, setMessages, isMessagesLoaded };
}