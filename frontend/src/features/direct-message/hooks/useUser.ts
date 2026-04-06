import { useLayoutEffect, useState } from "react";
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

    return { user, setUser };
}
