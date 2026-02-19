import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import UserCard from "../../../common/UserCard";

interface Member {
    member_id: string;
    member_name: string;
    member_image: string;
    member_is_online: boolean;
    member_joined_at: string;
}

export default function MembersContent() {
    const [members, setMembers] = useState<Member[]>([]);
    const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;
    const { communityId } = useParams();

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
             
                <div className="text-gray-500 text-[12px] border-b border-outline pb-2">Members</div>

         
                {members.map(member => (
                        <UserCard key={member.member_id} id={member.member_id} joinedAtText={`Joined ${member.member_joined_at}`} isOnline={member.member_is_online} username={member.member_name} image={member.member_image} />
                ))}
            </div>
        </div>
    );
}