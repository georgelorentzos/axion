import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { type Role } from "../../types/role";

export function useCommunityRoles(){
    const [roles, setRoles] = useState<Role[]>([]);
    const { communityId } = useParams();
    const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;

    useEffect(() => {
        if (!communityId) return;
        const handleFetchRoles = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;
            try {
                const response = await fetch(
                    `${apiUrl}/api/community/${communityId}/roles`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                if (response.ok) {
                    const data = await response.json();
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