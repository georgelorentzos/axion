import { useState, useEffect } from "react";

interface Community {
    community_id: string;
    community_name: string;
    community_image: string
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

                const data = await response.json()
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

    return { communities, setCommunities, loading }
}