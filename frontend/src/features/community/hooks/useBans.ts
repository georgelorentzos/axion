import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { type Ban } from "../types/ban";
import { api } from "../../../api/client";

export function useBans() {
    const { communityId } = useParams();
    const [bans, setBans] = useState<Ban[]>([]);

    useEffect(() => {
        if (!communityId) return;
        const fetchBans = async () => {
            try{
                const { data } = await api.bans.get(communityId);
                if (data.success) {
                    setBans(data.bans.reverse());
                }
            } catch (error) {
                console.log("error fetching bans ", error)
            }
        };
        fetchBans();
    }, [communityId]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            if (data.type === "newBan") {
                setBans(prev => [
                    {
                        id: data.id,
                        username: data.username,
                        description: data.description,
                        createdAt: data.createdAt,
                        userImgUrl: data.userImgUrl,
                    },
                    ...prev
                ] )
            }
        }
        const ws = window._ws?.ws;
        if (ws) {
            ws.addEventListener("message", handleMessage);
            return () => ws.removeEventListener("message", handleMessage);
        }
    }, []);

    return { bans, setBans };
}
