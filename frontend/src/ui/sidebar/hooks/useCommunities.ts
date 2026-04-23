import { useState, useEffect } from "react";
import { type Community } from "../../../features/community/types/community";
import { api } from "../../../api/client";

export function useCommunities() {
    const [communities, setCommunities] = useState<Community[]>([]);
    const [loading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCommunities = async () => {
            try {
                const { data } = await api.communities.getAll();
                setCommunities(data.communities || []);
            } catch (error) {
                console.log("error fetching communities:", error);
                setCommunities([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCommunities();
    }, []);

    useEffect(() => {
        const webSocket = window._ws?.ws;
        if (!webSocket) return;

        const handleMessage = (event: MessageEvent) => {
            const data = JSON.parse(event.data);

            if (data.type === "communityCreated") {
                setCommunities(prev => [
                    ...prev,
                    {
                        id: data.id,
                        name: data.name,
                        image: data.image,
                        description: data.description,
                        createdAt: data.createdAt,
                        ownerId: data.ownerId,
                    },
                ]);
            }

            if (data.type === "communityDeleted") {
                setCommunities(prev =>
                    prev.filter(c => c.id !== data.id)
                );
            }

            if (data.type === "communityUpdated") {
                setCommunities(prev =>
                    prev.map(c =>
                        c.id === data.id
                            ? {
                                  ...c,
                                  name: data.name,
                                  image: data.image,
                              }
                            : c
                    )
                );
            }

            if (
                data.type === "memberKicked" ||
                data.type === "memberBanned"
            ) {
                setCommunities(prev =>
                    prev.filter(c => c.id !== data.id)
                );
            }
        };

        webSocket.addEventListener("message", handleMessage);

        return () => {
            webSocket.removeEventListener("message", handleMessage);
        };
    }, []);

    return { communities, setCommunities, loading };
}