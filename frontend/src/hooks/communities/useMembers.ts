import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { type User } from "../../types/user";

export function useMembers() {
    const [members, setMembers] = useState<User[]>([]);
    const onlineMembers = members.filter(m => m.isOnline);
    const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;
    const { communityId } = useParams();
    const token = localStorage.getItem("token");
    
    useEffect(() => {
            if (!token) return;
            if (!communityId) return;
            const fetchmembers = async () => {
                try {
                    const response = await fetch(`${apiUrl}/api/community/${communityId}/members`, {
                        headers: {"Authorization": `Bearer ${token}`}
                    });
                    const data = await response.json()
                    setMembers(data.members || []);
                } catch (error) {
                    console.log("error fetching members: ", error)
                }
            }
            fetchmembers();
    }, [communityId])

    useEffect(() => {
        const handleMessage = async (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            if (data.type === "userJoined") {
                setMembers(
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
                setMembers(prev => prev.filter(m => m.id !== data.memberId));
            }
        };

        const ws = window._ws?.ws;
        if (ws) {
            ws.addEventListener("message", handleMessage);
            return () => ws.removeEventListener("message", handleMessage);
        }
    }, [])

    return {members, setMembers, onlineMembers};
}