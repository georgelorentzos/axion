import { useParams } from "react-router-dom";
import { type Role } from "../../types/role";
import { type User } from "../../../user/types/user";
import { useMembers } from "../../contexts/useMembers";
import { api } from "../../../../api/client";
import { useCurrentUser } from "../../../user/contexts/useCurrentUser";
import { PERMISSIONS } from "../../../../constants/permissions";
import { useCommunity } from "../../hooks/useCommunity";
import Icon from "../../../../ui/Icon";
import { icons } from "../../../../constants/Icons";

type RoleBadgeProps = {
    member: User;
    role: Role;
};

export default function RoleBadge({ member, role }: RoleBadgeProps) {
    const { communityId } = useParams();
    const { setMembers } = useMembers();
    const { currentUser } = useCurrentUser();
    const { community } = useCommunity();

    const handleRemoveRole = async (role: Role) => {
        if (!communityId) return;
        try {
            await api.members.toggleRole(communityId, member.id, role.id);
            setMembers(prev => prev.map(
                m => {
                    if (m.id !== member.id) return m;
                    return { ...m, roles: m.roles?.filter(r => r.id !== role.id) };
                }
            )
        );
        } catch (error) {
            console.log("error managing role: ", error);
        }
    };

    return (
        <div className="flex items-center gap-1 text-xs px-2 py-2 rounded bg-onyx text-gray-100">
            <div className={`w-[12px] h-[12px] bg-[#${role.color}] rounded-full`}></div>
            {role.name}
            {(currentUser?.id === community?.ownerId ||
            currentUser?.permissions?.includes(PERMISSIONS.ADMINISTRATOR) ||
            currentUser?.permissions?.includes(PERMISSIONS.MANAGE_ROLES)) && (
            <button className="cursor-pointer" onClick={() => handleRemoveRole(role)}>
                <Icon svgPaths={icons.x} className="size-5 text-gray-500 hover:text-gray-300 transition duration-200" />
            </button>
            )}
        </div>
    );
}
