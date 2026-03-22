import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { type Role } from "../types/role";
import { api } from "../../../api/client";

export function useRoles(){
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

    return { roles, setRoles };
}