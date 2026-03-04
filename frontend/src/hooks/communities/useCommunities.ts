import { useState, useEffect } from "react";
import { type Community } from "../../types/community";

export function useCommunities() {
    const [communities, setCommunities] = useState<Community[] | null>(null);
    const token = localStorage.getItem("token");
    const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;
    const [loading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!token) return;
        const handleCommunities = async () => {
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
        id: string;
        name: string;
        image: string;
    }) => {
        setCommunities(prev => 
            prev?.map(c => 
                c.id === updatedCommunity.id 
                    ? { 
                        ...c, 
                        name: updatedCommunity.name,
                        image: updatedCommunity.image 
                    }
                    : c
            ) || null
        );
    };

    useEffect(() => {
        const handleMessage = async (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            if (data.type === "communityDeleted") {
                setCommunities(communities => communities?.filter(c => c.id !== data.id) || null);
            }
            if (data.type === "communityUpdated") {
                setCommunities(prev => prev?.map(c =>
                    c.id === data.id ? { ...c, name: data.name, image: data.image } : c
                ) || null);
            }
            if (data.type === "memberKicked") {
                setCommunities(prev => prev?.filter(c => c.id !== data.id) || null);
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