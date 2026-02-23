import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { type User } from "../../types/user";

export function useCommunityMembers() {
    const [communityMembers, setCommunityMembers] = useState<User[]>([]);
    const onlineMembers = communityMembers.filter(m => m.isOnline);
    const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;
    const { communityId } = useParams();

    useEffect(() => {
            const token = localStorage.getItem("token");
            if (!token) return;
            if (!communityId) return;
            const fetchcommunityMembers = async () => {
                try {
                    const response = await fetch(`${apiUrl}/api/community/${communityId}/members`, {
                        headers: {"Authorization": `Bearer ${token}`}
                    });
                    const data = await response.json()
                    setCommunityMembers(data.members || []);
                } catch (error) {
                    console.log("error fetching communityMembers: ", error)
                }
            }
            fetchcommunityMembers();
    }, [communityId])

    useEffect(() => {
        const handleMessage = async (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            if (data.type === "userJoined") {
                setCommunityMembers(
                    prev => [
                        ...prev,
                        {
                            id: data.id,
                            username: data.username,
                            image: data.image,
                            isOnline: data.isOnline,
                            createdAt: data.createdAt,
                        }
                    ]
                );
            }
            if (data.type === "userLeft") {
                setCommunityMembers(prev => prev.filter(m => m.id !== data.id));
            }
        };

        const ws = window._ws?.ws;
        if (ws) {
            ws.addEventListener("message", handleMessage);
            return () => ws.removeEventListener("message", handleMessage);
        }
    }, [])

    return {communityMembers, setCommunityMembers, onlineMembers};
}