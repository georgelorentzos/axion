import { useState } from "react";
import SearchBar from "../../../../ui/SearchBar";
import { useRoles } from "../../contexts/useRoles";
import RoleCard from "../../../../ui/RoleCard";

type AddRoleProps = {
    isOpen: boolean;
}

export default function AddRole({ isOpen }: AddRoleProps) {
    const { roles } = useRoles();
    const [searchQuery, setSearchQuery] = useState('');
    const filtered = roles.filter(role => role.name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!isOpen) return null;

    return (
        <div className="rounded-lg w-full h-auto bg-basalt z-50 flex gap-2 flex-col justify-between">
            <SearchBar onSearch={(e) => setSearchQuery(e)} bg="bg-onyx" />
            <div className="flex flex-col max-h-[200px] min-h-0 overflow-y-auto">
                {filtered.map(role => (
                    <RoleCard key={role.id} id={role.id} name={role.name} hover="hover:bg-outline" />
                ))}
            </div>
        </div>
    );
}