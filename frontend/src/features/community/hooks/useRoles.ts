import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { type Role } from "../types/role";
import { api } from "../../../api/client";

export function useRoles() {
    const [roles, setRoles] = useState<Role[]>([]);
    const { communityId } = useParams();

    useEffect(() => {
        if (!communityId) return;
        
        const handleFetchRoles = async () => {
            try {
                const { response, data } = await api.roles.get(communityId);
                if (response.ok) {
                    setRoles(data.roles);
                }
            } catch (error) {
                console.log("failed to fetch roles: ", error);
            }
        };
        handleFetchRoles();
    }, [communityId]);

    useEffect(() => {
        if (!communityId) return;

        const ws = window._ws?.ws;
        if (!ws) return;

        const handleMessage = (event: MessageEvent) => {
            const data = JSON.parse(event.data);

            if (data.type === "roleCreated") {
                setRoles(prev => [...prev, { id: data.id, name: data.name, color: data.color, permissions: data.permissions }]);
            }
            if (data.type === "roleUpdated") {
                setRoles(prev => prev.map(r => r.id === data.id
                    ? { ...r, name: data.name, color: data.color, permissions: data.permissions }
                    : r
                ));
            }

            if (data.type === "roleDeleted") {
                setRoles(prev => prev.filter(r => r.id !== data.id));
            }
        };

        ws.addEventListener("message", handleMessage);
        return () => ws.removeEventListener("message", handleMessage);
    }, [communityId]);

    return { roles, setRoles };
}