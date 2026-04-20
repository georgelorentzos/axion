import { useEffect, useState } from "react";
import { type Category } from "../types/category";
import { useParams } from "react-router-dom";
import { api } from "../../../api/client";
import { useChannels } from "../contexts/useChannels";

export function useCategories() {
    const [categories, setCategories] = useState<Category[] | null>(null);
    const { communityId } = useParams();
    const { setChannels } = useChannels();

    useEffect(() => {
        if (!communityId) return;
        
        const fetchCategories = async () => {
            try {
                const { data } = await api.categories.getAll(communityId);
                setCategories(data.categories);
            } catch (error) {
                console.log("error failed to fetch categories: ", error);
            }
        };
        
        fetchCategories();
    }, [communityId]);

    useEffect(() => {
        if (!communityId) return;
        
        const handleMessage = async (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            
            if (data.type === "categoryCreated") {
                setCategories(previousCategories => [
                    ...(previousCategories || []), 
                    {
                        id: data.id,
                        name: data.name
                    }
                ]);
            }
            
            if (data.type === "categoryDeleted") {
                setCategories(previousCategories => 
                    previousCategories?.filter(category => category.id !== data.id) || null
                );
                setChannels(previousChannels => 
                    previousChannels?.map(channel => 
                        channel.categoryId === data.id 
                            ? { ...channel, categoryId: null } 
                            : channel 
                    ) || null
                );
            }
        };
        
        const webSocket = window._ws?.ws;
        if (webSocket) {
            webSocket.addEventListener("message", handleMessage);
            return () => webSocket.removeEventListener("message", handleMessage);
        }
    }, [communityId, setChannels]);

    return { categories, setCategories };
}