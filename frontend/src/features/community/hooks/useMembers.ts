import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { type User } from "../../user/types/user";
import { api } from "../../../api/client";

export function useMembers() {
    const [members, setMembers] = useState<User[]>([]);
    const onlineMembers = members.filter(m => m.isOnline);
    const { communityId } = useParams();

    useEffect(() => {
        if (!communityId) return;
        const fetchmembers = async () => {
            try {
                const { data } = await api.members.get(communityId);
                setMembers(data.members || []);
            } catch (error) {
                console.log("error fetching members: ", error);
            }
        };
        fetchmembers();
    }, [communityId]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            if (data.type === "userJoined") {
                setMembers(prev => [
                    ...prev,
                    {
                        id: data.id,
                        username: data.username,
                        image: data.image,
                        isOnline: data.isOnline,
                        createdAt: data.createdAt,
                    }
                ]);
            }
            if (data.type === "userLeft") {
                setMembers(prev => prev.filter(m => m.id !== data.memberId));
            }
            if (data.type === "memberRolesUpdated") {
                setMembers(prev => prev.map(m => {
                    if (m.id !== data.memberId) return m;
                    return { ...m, roles: data.roles };
                }));
            }
        };

        const ws = window._ws?.ws;
        if (ws) {
            ws.addEventListener("message", handleMessage);
            return () => ws.removeEventListener("message", handleMessage);
        }
    }, []);

    return { members, setMembers, onlineMembers };
}