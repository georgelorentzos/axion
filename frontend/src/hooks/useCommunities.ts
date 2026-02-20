import { useState, useEffect } from "react";

interface Community {
    community_id: string;
    community_name: string;
    community_image: string;
    community_online_members: string;
    community_total_members: string;
    community_created_at: string;
}

export function useCommunities() {
    const [communities, setCommunities] = useState<Community[] | null>(null);
    const token = localStorage.getItem("token");
    const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;
    const [loading, setIsLoading] = useState(true);

    useEffect(() => {
        const handleCommunities = async () => {
            if (!token) return;

            try {
                const response = await fetch(`${apiUrl}/api/my/communities`, {
                    headers: {"Authorization": `Bearer ${token}`}
                });

                const data = await response.json();
                setCommunities(data.communities || []);
            } catch (error) {
                console.error('Fetch all friends error:', error);
                setCommunities([]);
            } finally {
                setIsLoading(false);
            }
        };
        handleCommunities();
    }, []);

    const updateCommunity = (updatedCommunity: {
        communityId: string;
        communityName: string;
        communityImage: string;
    }) => {
        setCommunities(prev => 
            prev?.map(c => 
                c.community_id === updatedCommunity.communityId 
                    ? { 
                        ...c, 
                        community_name: updatedCommunity.communityName,
                        community_image: updatedCommunity.communityImage 
                    }
                    : c
            ) || null
        );
    };

    useEffect(() => {
        const handleMessage = async (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            if (data.type == "community_deleted") {
                setCommunities(communities => communities?.filter(c => c.community_id !== data.community_id) || null);
            }
        }
        const ws = window._ws?.ws;
        if (ws) {
            ws.addEventListener("message", handleMessage);
            return () => ws.removeEventListener("message", handleMessage);
        }
    }, []);

    return { communities, setCommunities, loading, updateCommunity };
}