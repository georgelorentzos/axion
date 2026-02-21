import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import UserCard from "../../../common/UserCard";
import SearchBar from "../../../common/SearchBar";

interface Member {
    id: string;
    name: string;
    image: string;
    is_online: boolean;
    joined_at: string;
    created_at: string;
}

export default function MembersContent() {
    const [members, setMembers] = useState<Member[]>([]);
    const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;
    const { communityId } = useParams();
    const [searchQuery, setSearchQuery] = useState('');
    const filteredMembers = members.filter(member => member.name.startsWith(searchQuery.toLowerCase()));

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;
        const fetchMembers = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/community/${communityId}/members`, {
                    headers: {"Authorization": `Bearer ${token}`}
                });
                const data = await response.json()
                setMembers(data.members || []);
            } catch (error) {
                console.log("error fetching members: ", error)
            }
        }
        fetchMembers();
    }, [communityId])
    return(
        <div className="flex gap-2 justify-start items-start">
            <div className="px-6 flex flex-col gap-2 w-full">
                <div>Community Members</div>
                <div className="text-[14px] w-[500px] text-gray-500">
                    See who's recently joined your server.
                </div>
                <SearchBar onSearch={(q) => setSearchQuery(q)} />
                <br />
                <div className="text-gray-500 text-[12px] border-b border-outline pb-2">{members.length && members.length > 1 ? `${members.length} Members` : `${members.length} Member`}</div>
                {filteredMembers.map(member => (
                        <UserCard 
                        key={member.id} 
                        id={member.id} 
                        joinedAtText={`Joined ${member.joined_at}`} 
                        isOnline={member.is_online} 
                        username={member.name} 
                        image={member.image} 
                        createdAt={member.created_at} 
                        actions={{ options:true, admin:true }}
                        />
                ))}
            </div>
        </div>
    );
}