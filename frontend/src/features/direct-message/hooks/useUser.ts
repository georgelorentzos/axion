import { useLayoutEffect, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { type User } from "../../user/types/user";
import { api } from "../../../api/client";

export function useUser() {
    const { userId } = useParams();
    const [user, setUser] = useState<User | null>(null);
    const navigate = useNavigate();

    useLayoutEffect(() => {
        if (!userId) return;
        
        const fetchUserData = async () => {
            try {
                const { data } = await api.users.get(userId);
                if (!data.success) {
                    navigate("/");
                    return;
                }
                
                setUser({
                    id: data.id,
                    username: data.username,
                    image: data.image,
                    isOnline: data.isOnline,
                    createdAt: data.joinedAt,
                });
            } catch (error) {
                console.error('Error fetching user:', error);
            }
        };
        
        fetchUserData();
    }, [userId, navigate]);

    useEffect(() => {
        const handleMessage = async (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'userOnline') {
                setUser(previousUser => 
                    previousUser ? { ...previousUser, isOnline: true } : null
                );
            }
            
            if (data.type === 'userOffline') {
                setUser(previousUser => 
                    previousUser ? { ...previousUser, isOnline: false } : null
                );
            }
        };
        
        const webSocket = window._ws?.ws;
        if (webSocket) {
            webSocket.addEventListener("message", handleMessage);
            return () => webSocket.removeEventListener("message", handleMessage);
        }
    }, [userId]);

    return { user, setUser };
}