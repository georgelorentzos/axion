import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

interface Member {
    id: string;
    name: string;
    image: string;
    is_online: boolean;
    joined_at: string;
    created_at: string;
}

export function useCommunityMembers() {
    const [communityMembers, setCommunityMembers] = useState<Member[]>([]);
    const onlineMembers = communityMembers.filter(m => m.is_online);
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
            if (data.type === "user_joined") {
                setCommunityMembers(
                    prev => [
                        ...prev,
                        {
                            id: data.member_id,
                            name: data.member_name,
                            image: data.member_profile_image,
                            is_online: data.member_is_online,
                            joined_at: data.member_joined_at,
                            created_at: data.member_created_at,
                        }
                    ]
                );
            }
            if (data.type === "user_left") {
                setCommunityMembers(prev => prev.filter(m => m.id !== data.member_id));
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