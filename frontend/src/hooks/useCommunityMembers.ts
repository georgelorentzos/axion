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

    return {communityMembers, setCommunityMembers};
}