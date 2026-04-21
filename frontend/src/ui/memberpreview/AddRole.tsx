import { useState } from "react";
import SearchBar from "../SearchBar";
import { useRoles } from "../../features/community/contexts/useRoles";
import RoleCard from "../card/RoleCard";
import { api } from "../../api/client";
import { useParams } from "react-router-dom";
import { type User } from "../../features/user/types/user";
import { type Role } from "../../features/community/types/role";

type AddRoleProps = {
    member: User;
    isOpen: boolean;
    onClose: () => void;
}

export default function AddRole({ member, isOpen, onClose }: AddRoleProps) {
    const { roles } = useRoles();
    const [searchQuery, setSearchQuery] = useState('');
    const filtered = roles.filter(role => role.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const { communityId } = useParams();

    if (!isOpen) return null;

    const handleManageRole = async (role: Role) => {
        if (!communityId) return;
        onClose();
        try {
            await api.members.toggleRole(communityId, member.id, role.id);
        } catch (error) {
            console.log("error managing role: ", error);
        }
    };

    return (
        <div className="rounded-lg w-full h-auto bg-basalt z-50 flex gap-2 flex-col justify-between">
            <SearchBar onSearch={(e) => setSearchQuery(e)} bg="bg-onyx" />
            <div className="flex flex-col max-h-[200px] min-h-0 overflow-y-auto">
                {filtered.map(role => (
                    <RoleCard 
                    onClick={() => {
                        handleManageRole(role);
                    }}
                    key={role.id} 
                    role={role}
                    hover="hover:bg-outline" />
                ))}
            </div>
        </div>
    );
}