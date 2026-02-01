import { useState, useEffect } from "react"

interface DirectMessage {
    user_id: string;
    username: string;
    profile_image: string;
    is_online: boolean;
    created_at: string;
    latest_message: string;
}

export function useDirectMessages() {
    const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
    const token = localStorage.getItem('token');
    const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        if (!token) {
            setLoading(false);
            return;
        }

        const loadDirectMessages = async () => {
            try{
                const response = await fetch(`${apiUrl}/api/my/conversations`, {
                    method: 'GET',
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                const data = await response.json()
                setDirectMessages(data.conversations || [])
            }catch (error) {
                console.error('Fetch direct messages error:', error);
                setDirectMessages([]);
            } finally {
                setLoading(false);
            }
        };
        loadDirectMessages();
    }, []);

    return { directMessages, loading };
}