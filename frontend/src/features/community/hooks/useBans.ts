import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { type Ban } from "../types/ban";
import { api } from "../../../api/client";
import { useCurrentUser } from "../../user/contexts/useCurrentUser";
import { PERMISSIONS } from "../../../constants/permissions";
import { useCommunity } from "../contexts/useCommunity";

export function useBans() {
    const { communityId } = useParams();
    const [bans, setBans] = useState<Ban[]>([]);
    const { community } = useCommunity();
    const { currentUser } = useCurrentUser();

    const canViewBans = useMemo(() => {
        if (!currentUser || !community) return false;
        if (currentUser.id === community.ownerId) return true;
        if (currentUser.permissions?.includes(PERMISSIONS.BAN)) return true;
        if (currentUser.permissions?.includes(PERMISSIONS.ADMINISTRATOR)) return true;
        return false;
    }, [currentUser, community]);

    useEffect(() => {
        if (!communityId || !canViewBans) return;

        const fetchBans = async () => {
            try {
                const { data } = await api.bans.getAll(communityId);
                if (data.success) {
                    setBans(data.bans.reverse());
                }
            } catch (error) {
                console.log("error fetching bans: ", error);
            }
        };
        
        fetchBans();
    }, [communityId, canViewBans]);

    useEffect(() => {
        if (!communityId || !canViewBans) return;

        const handleMessage = (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            
            if (data.type === "newBan") {
                setBans(previousBans => [
                    {
                        id: data.id,
                        username: data.username,
                        image: data.image,
                        reason: data.reason,
                        createdAt: data.createdAt,
                    },
                    ...previousBans
                ]);
            }
        };
        
        const webSocket = window._ws?.ws;
        if (webSocket) {
            webSocket.addEventListener("message", handleMessage);
            return () => webSocket.removeEventListener("message", handleMessage);
        }
    }, [communityId, canViewBans]);

    return { bans, setBans, canViewBans };
}