import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { type User } from "../../user/types/user";
import { api } from "../../../api/client";

export function useMembers() {
    const [members, setMembers] = useState<User[]>([]);
    const onlineMembers = members.filter(m => m.isOnline);
    const offlineMembers = members.filter(m => !m.isOnline);
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
        if (!communityId) return;
        
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
            if (data.type === "roleDeleted") {
                setMembers(prev => prev.map(m => ({
                    ...m,
                    roles: m.roles?.filter(r => r.id !== data.id)
                })));
            }
            if (data.type === "roleUpdated") {
                setMembers(prev => prev.map(
                    m => ({
                        ...m,
                        roles: m.roles?.map(r => r.id === data.id
                            ? { ...r, name: data.name, color: data.color, permissions: data.permissions } : r
                    )
                })));
            }
            if (data.type === "memberOnline") {
                setMembers(prev => prev.map(m =>
                    m.id === data.memberId ? { ...m, isOnline: true } : m
                ));
            }
            if (data.type === "memberOffline") {
                setMembers(prev => prev.map(m =>
                    m.id === data.memberId ? { ...m, isOnline: false } : m
                ));
            }
        };

        const ws = window._ws?.ws;
        if (ws) {
            ws.addEventListener("message", handleMessage);
            return () => ws.removeEventListener("message", handleMessage);
        }
    }, [communityId]);

    return { members, setMembers, onlineMembers, offlineMembers };
}