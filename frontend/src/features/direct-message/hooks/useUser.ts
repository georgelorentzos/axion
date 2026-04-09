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
        const fetchUser = async () => {
            try{
                const { data } = await api.users.profile(userId);
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
        fetchUser();
    }, [userId]);

    useEffect(() => {
        const handleMessage = async (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            if (data.type === 'userOnline') {
                setUser(prev => prev ? { ...prev, isOnline: true } : null);
            }
            if (data.type === 'userOffline') {
                setUser(prev => prev ? { ...prev, isOnline: false } : null);
            }
        };
        const ws = window._ws?.ws;
        if (ws) {
            ws.addEventListener("message", handleMessage);
            return () => ws.removeEventListener("message", handleMessage);
        }
    }, [userId]);

    return { user, setUser };
}
