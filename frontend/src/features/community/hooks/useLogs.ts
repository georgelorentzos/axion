import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { type Log } from "../types/log";
import { api } from "../../../api/client";
import { useCurrentUser } from "../../user/contexts/useCurrentUser";
import { PERMISSIONS } from "../../../constants/permissions";
import { useCommunity } from "../contexts/useCommunity";

export function useLogs() {
    const { communityId } = useParams();
    const [logs, setLogs] = useState<Log[]>([]);
    const { community } = useCommunity();
    const { currentUser } = useCurrentUser();

    const canViewLogs = useMemo(() => {
        if (!currentUser || !community) return false;
        if (currentUser.id === community.ownerId) return true;
        if (currentUser.permissions?.includes(PERMISSIONS.VIEW_LOGS)) return true;
        if (currentUser.permissions?.includes(PERMISSIONS.ADMINISTRATOR)) return true;
        return false;
    }, [currentUser, community]);

    useEffect(() => {
        if (!communityId || !canViewLogs) return;

        const fetchLogs = async () => {
            try {
                const { data } = await api.logs.getAll(communityId);
                if (data.success) {
                    setLogs(data.logs.reverse());
                }
            } catch (error) {
                console.log("error fetching logs: ", error);
            }
        };
        
        fetchLogs();
    }, [communityId, canViewLogs]);

    useEffect(() => {
        if (!communityId || !canViewLogs) return;

        const handleMessage = (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            
            if (data.type === "newLog") {
                setLogs(previousLogs => [
                    {
                        title: data.title,
                        image: data.image,
                        note: data.note,
                        createdAt: data.createdAt,
                    },
                    ...previousLogs
                ]);
            }
        };

        const webSocket = window._ws?.ws;
        if (webSocket) {
            webSocket.addEventListener("message", handleMessage);
            return () => webSocket.removeEventListener("message", handleMessage);
        }
    }, [communityId, canViewLogs]);

    return { logs, setLogs, canViewLogs };
}