import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { type Role } from "../types/role";
import { api } from "../../../api/client";

export function useRoles() {
    const [roles, setRoles] = useState<Role[]>([]);
    const { communityId } = useParams();

    useEffect(() => {
        if (!communityId) return;
        
        const fetchRoles = async () => {
            try {
                const { response, data } = await api.roles.getAll(communityId);
                if (response.ok) {
                    setRoles(data.roles);
                }
            } catch (error) {
                console.log("failed to fetch roles: ", error);
            }
        };
        
        fetchRoles();
    }, [communityId]);

    useEffect(() => {
        if (!communityId) return;

        const webSocket = window._ws?.ws;
        if (!webSocket) return;

        const handleMessage = (event: MessageEvent) => {
            const data = JSON.parse(event.data);

            if (data.type === "roleCreated") {
                setRoles(previousRoles => [
                    ...previousRoles, 
                    { 
                        id: data.id, 
                        name: data.name, 
                        color: data.color, 
                        permissions: data.permissions 
                    }
                ]);
            }

            if (data.type === "roleUpdated") {
                setRoles(previousRoles => 
                    previousRoles.map(role => 
                        role.id === data.id
                            ? { 
                                ...role, 
                                name: data.name, 
                                color: data.color, 
                                permissions: data.permissions 
                              }
                            : role
                    )
                );
            }

            if (data.type === "roleDeleted") {
                setRoles(previousRoles => 
                    previousRoles.filter(role => role.id !== data.id)
                );
            }
        };

        webSocket.addEventListener("message", handleMessage);
        return () => webSocket.removeEventListener("message", handleMessage);
    }, [communityId]);

    return { roles, setRoles };
}