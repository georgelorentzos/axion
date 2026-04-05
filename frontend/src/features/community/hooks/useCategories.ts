import { useEffect, useState } from "react";
import { type Category } from "../types/category";
import { useParams } from "react-router-dom";
import { api } from "../../../api/client";

export function useCategories() {
    const [categories, setCategories] = useState<Category[] | null>(null);
    const { communityId } = useParams();

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
        };
        const ws = window._ws?.ws;
        if (ws) {
            ws.addEventListener("message", handleMessage);
            return () => ws.removeEventListener("message", handleMessage);
        }
    }, [communityId]);

    return { categories, setCategories };
}