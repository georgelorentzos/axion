import UserCard from "../../../common/UserCard";
import SearchBar from "../../../common/SearchBar";
import { useCommunityMembers } from "../../../../contexts/communities/useCommunityMembers";
import { useState } from "react";
import { useCommunity } from "../../../../hooks/communities/useCommunity";
import { useCurrentUser } from "../../../../contexts/useCurrentUser";

export default function MembersContent() {
    const { communityMembers } = useCommunityMembers();
    const [searchQuery, setSearchQuery] = useState('');
    const filteredMembers = communityMembers.filter(member => member.username?.startsWith(searchQuery.toLowerCase()));
    const { community } = useCommunity();
    const { currentUser } = useCurrentUser();

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
                        {communityMembers.length && communityMembers.length > 1
                            ? `${communityMembers.length} Members`
                            : `${communityMembers.length} Member`}
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col py-2">
                        {filteredMembers.map(member => (
                            <UserCard
                                key={member.id}
                                user={member}
                                actions={{ options: member.id !== currentUser?.id && member.id !== community?.ownerId, admin: member.id !== currentUser?.id && member.id !== community?.ownerId }}
                                showStatus={false}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}