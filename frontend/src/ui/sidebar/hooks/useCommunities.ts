import { useState, useEffect } from "react";
import { type Community } from "../../../features/community/types/community";
import { api } from "../../../api/client";

export function useCommunities() {
    const [communities, setCommunities] = useState<Community[] | null>(null);
    const [loading, setIsLoading] = useState(true);

    useEffect(() => {
        const handleCommunities = async () => {
            try {
                const { data } = await api.communities.getAll();
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
        id: string;
        name: string;
        image: string;
    }) => {
        setCommunities(prev =>
            prev?.map(community =>
                community.id === updatedCommunity.id
                    ? {
                        ...community,
                        name: updatedCommunity.name,
                        image: updatedCommunity.image
                    }
                    : community
            ) || null
        );
    };

    useEffect(() => {
        const handleMessage = async (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            if (data.type === "communityDeleted") {
                setCommunities(communities => communities?.filter(community => community.id !== data.id) || null);
            }
            if (data.type === "communityUpdated") {
                setCommunities(prev => prev?.map(community =>
                    community.id === data.id ? { ...community, name: data.name, image: data.image } : community
                ) || null);
            }
            if (data.type === "memberKicked" || data.type === "memberBanned") {
                setCommunities(prev => prev?.filter(community => community.id !== data.id) || null);
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
