import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Button from "../../Button";
import { useCommunityRoles } from "../../../../contexts/communities/useCommunityRoles";
import { type Role } from "../../../../types/role";

type DeleteRoleProps = {
    onClose: () => void;
    role?: Role;
}

export default function DeleteRole({ onClose, role }: DeleteRoleProps) {
    const { communityId } = useParams();
    const [cachedName, setCachedName] = useState(role?.name);
    const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;
    const { setRoles } = useCommunityRoles();

    useEffect(() => {
        if (role?.name) setCachedName(role?.name);
    }, [role?.name]);

    const handleDeleteRole = async () => {
        if (!role?.id) return;
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            const response = await fetch(`${apiUrl}/api/community/${communityId}/roles/${role?.id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            setRoles(prev => prev.filter(r => r.id !== data.id));
            onClose();
        } catch (error) {
            console.log("Error deleting role: ", error)
        }
    }

    return(
        <>
            <div className="flex flex-col text-center">
                <div className="font-bold text-[20px]">Delete {cachedName}</div>
                <div className="text-gray-500">Are you sure you want to delete this role? This action cannot be undone.</div>
            </div>
            <Button text="Delete" isDanger onClick={handleDeleteRole} />
        </>
    );
}