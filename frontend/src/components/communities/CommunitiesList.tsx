import CommunityButton from "./CommunityButton";
import { useNavigate } from "react-router-dom";
import { useCommunities } from "../../contexts/communities/useCommunities";

export default function CommunitiesList() {
    const navigate = useNavigate();
    const { communities } = useCommunities();
    
    return (
        <div className="bg-prmary px-4 h-screen flex flex-col gap-2 items-center border-r border-outline">
            <div className="pt-3 flex items-center">
                <CommunityButton onClick={() => navigate('/')} isHome /> 
            </div>

            {communities?.map(c => (
                <CommunityButton
                    onClick={() => {
                        const community = {
                            id: c.community_id,
                            name: c.community_name,
                            image: c.community_image,
                            onlineMembers: c.community_online_members,
                            totalMembers: c.community_total_members,
                            createdAt: c.community_created_at,
                            ownerId: c.community_owner_id,
                        }
                        navigate(`/community/${c.community_id}`, { 
                            state: { community },
                            replace: true 
                        })
                    }} 
                    key={c.community_id}
                    isCommunity
                    communityId={c.community_id}
                    communityImage={c.community_image}
                    communityName={c.community_name}
                />
            ))}
  
            <div>
                <CommunityButton onClick={() => navigate('/')} isCreate /> 
            </div>
        </div>
    );
}