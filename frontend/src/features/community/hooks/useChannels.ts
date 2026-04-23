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
                const { data } = await api.channels.getAll(communityId);
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
                setChannels(prevChannels => [
                    ...(prevChannels || []), {
                        id: data.id,
                        name: data.name,
                        categoryId: data.categoryId
                    }
                ]);
            }
            if (data.type === "channelDeleted") {
                setChannels(prevChannels => prevChannels?.filter(channel => channel.id !== data.id) || null);
            }
        };

        const webSocket = window._ws?.ws;
        if (webSocket) {
            webSocket.addEventListener("message", handleMessage);
            return () => webSocket.removeEventListener("message", handleMessage);
        }
    }, [communityId]);

    return { channels, setChannels };
}