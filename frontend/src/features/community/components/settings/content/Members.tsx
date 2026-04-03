import UserCard from "../../../../../ui/UserCard";
import SearchBar from "../../../../../ui/SearchBar";
import { useMembers } from "../../../contexts/useMembers";
import { useEffect, useState } from "react";
import { useCommunity } from "../../../contexts/useCommunity";
import { useCurrentUser } from "../../../../user/contexts/useCurrentUser";

type MembersContentProps = {
    onChildModalChange?: (isOpen: boolean) => void;
}

export default function MembersContent({ onChildModalChange }: MembersContentProps) {
    const { members } = useMembers();
    const [searchQuery, setSearchQuery] = useState('');
    const filteredMembers = members.filter(member => member.username?.startsWith(searchQuery.toLowerCase()));
    const { community } = useCommunity();
    const { currentUser } = useCurrentUser();
    const [manageUser, setManageUser] = useState(false);

    useEffect(() => {
        onChildModalChange?.(manageUser);
    }, [manageUser]);

    return (
        <div className="flex gap-2 justify-start items-start h-full min-h-0">
            <div className="px-6 flex flex-col gap-2 w-full h-full min-h-0">
                <div>Community Members</div>
                <div className="text-[14px] w-[500px] text-gray-500">
                    See who's recently joined your server.
                </div>
                <div className="flex flex-col flex-1 min-h-0">
                    <SearchBar onSearch={(q) => setSearchQuery(q)} />
                    <br />
                    <div className="text-gray-500 text-[12px] border-b border-outline pb-2">
                        {members.length && members.length > 1
                            ? `${members.length} Members`
                            : `${members.length} Member`}
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col py-2">
                        {filteredMembers.map(member => (
                            <UserCard
                                key={member.id}
                                user={member}
                                actions={{ options: member.id !== currentUser?.id && member.id !== community?.ownerId, admin: member.id !== currentUser?.id && member.id !== community?.ownerId }}
                                onChildModalChange={(isOpen) => {
                                    setManageUser(isOpen);
                                }}
                            />
                        ))}
                        {filteredMembers.length === 0 && searchQuery && (
                            <div className="text-gray-500 transition duration-300 py-2.5 px-4 flex justify-between items-center w-full rounded-lg hover:bg-basalt"> 
                                No results found
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}