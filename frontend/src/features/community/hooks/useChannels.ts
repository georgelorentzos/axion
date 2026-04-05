import { useEffect, useState } from "react";
import { type Channel } from "../types/channel";
import { useParams } from "react-router-dom";
import { api } from "../../../api/client";

export function useChannels() {
    const [channels, setChannels] = useState<Channel[] | null>(null);
    const { communityId } = useParams();

    useEffect(() => {
        if (!communityId) return;
        const handleChannels = async () => {
            try {
                const { data } = await api.channels.get(communityId);
                setChannels(data.channels);
            } catch (error) {
                console.log("error failed to fetch channels: ", error);
            }
        };
        handleChannels();
    }, [communityId])

    useEffect(() => {
        if (!communityId) return;
        const handleMessage = async (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            if (data.type === "channelCreated") {
                setChannels(prev => [
                    ...(prev || []), {
                        id: data.id,
                        name: data.name,
                        categoryId: data.categoryId
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

    return { channels, setChannels };
}