import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Button from "../../../ui/Button";
import { useRoles } from "../contexts/useRoles";
import { type Role } from "../types/role";
import { api } from "../../../api/client";

type DeleteRoleProps = {
    onClose: () => void;
    role?: Role;
}

export default function DeleteRole({ onClose, role }: DeleteRoleProps) {
    const { communityId } = useParams();
    const [cachedName, setCachedName] = useState(role?.name);
    const { setRoles } = useRoles();

    useEffect(() => {
        if (role?.name) setCachedName(role?.name);
    }, [role?.name]);

    const handleDeleteRole = async () => {
        if (!role?.id) return;
        try {
            const { data } = await api.roles.delete(communityId!, role.id);
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