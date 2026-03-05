import { useLayoutEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { type User } from "../../types/user";

export function useUser() {
    const { userId } = useParams();
    const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;
    const token = localStorage.getItem("token");
    const [user, setUser] = useState<User | null>(null);
    const navigate = useNavigate();

    useLayoutEffect(() => {
        if (!token) return;
        if (!userId) return;
        const fetchUser = async () => {
            try{
                const response = await fetch(`${apiUrl}/api/users/${userId}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-type": "application/json"
                    }
                });
                const data = await response.json();
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

    return { user, setUser };
}