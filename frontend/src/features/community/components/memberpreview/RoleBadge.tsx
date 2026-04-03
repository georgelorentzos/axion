import { useParams } from "react-router-dom";
import { type Role } from "../../types/role";
import { type User } from "../../../user/types/user";
import { useMembers } from "../../contexts/useMembers";
import { api } from "../../../../api/client";

type RoleBadgeProps = {
    member: User;
    role: { id: string; name: string };
};

export default function RoleBadge({ member, role }: RoleBadgeProps) {
    const { communityId } = useParams();
    const { setMembers } = useMembers();
    
    const handleRemoveRole = async (role: Role) => {
        if (!communityId) return;
        try {
            await api.communities.manageMemberRole(communityId, member.id, role.id);
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
        <div className="flex items-center gap-2 text-xs px-2 py-2 rounded bg-onyx text-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4 text-gray-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
            {role.name}
            <button className="cursor-pointer" onClick={() => handleRemoveRole(role)}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5 text-gray-500 hover:text-gray-300 transition duration-200 ">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}
