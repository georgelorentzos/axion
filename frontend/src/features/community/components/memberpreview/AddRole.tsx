import { useState } from "react";
import SearchBar from "../../../../ui/SearchBar";
import { useRoles } from "../../contexts/useRoles";
import RoleCard from "../../../../ui/RoleCard";
import { api } from "../../../../api/client";
import { useParams } from "react-router-dom";
import { type User } from "../../../user/types/user";

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

    return (
        <div className="rounded-lg w-full h-auto bg-basalt z-50 flex gap-2 flex-col justify-between">
            <SearchBar onSearch={(e) => setSearchQuery(e)} bg="bg-onyx" />
            <div className="flex flex-col max-h-[200px] min-h-0 overflow-y-auto">
                {filtered.map(role => (
                    <RoleCard 
                    onClick={() => {
                        onClose();
                        if (!communityId) return;
                        api.communities.manageMemberRole(communityId, member.id, role.id);
                    }}
                    key={role.id} 
                    id={role.id} 
                    name={role.name} 
                    hover="hover:bg-outline" />
                ))}
            </div>
        </div>
    );
}