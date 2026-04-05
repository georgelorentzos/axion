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
        const handleCategories = async () => {
            try {
                const { data } = await api.categories.get(communityId);
                setCategories(data.categories);
            } catch (error) {
                console.log("error failed to fetch categories: ", error);
            }
        };
        handleCategories();
    }, [communityId])

    useEffect(() => {
        if (!communityId) return;
        const handleMessage = async (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            if (data.type === "categoryCreated") {
                setCategories(prev => [
                    ...(prev || []), {
                        id: data.id,
                        name: data.name
                    }
                ]);
            }
            if (data.type === "categoryDeleted") {
                setCategories(prev => prev?.filter(c => c.id !== data.id) || null);
                setChannels(prev => prev?.map(
                    c => c.categoryId === data.id ? { ...c, categoryId: null } : c 
                ) || null);
            }
        };
        const ws = window._ws?.ws;
        if (ws) {
            ws.addEventListener("message", handleMessage);
            return () => ws.removeEventListener("message", handleMessage);
        }
    }, [communityId]);

    return { categories, setCategories };
}