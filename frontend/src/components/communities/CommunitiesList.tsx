import CommunityButton from "./CommunityButton";
import { useNavigate } from "react-router-dom";
import { useCommunities } from "../../contexts/useCommunities";

export default function CommunitiesList() {
    const navigate = useNavigate();
    const { communities } = useCommunities();
    
    return (
        <div className="bg-prmary px-4 h-screen flex flex-col gap-2 items-center border-r border-outline">
            <div className="pt-3 flex items-center">
                <CommunityButton onClick={() => navigate('/')} isHome /> 
            </div>

            {communities?.map(community => (
                <CommunityButton
                    onClick={() => {
                        const communityData = {
                            communityId: community.community_id,
                            communityName: community.community_name,
                            communityImage: community.community_image,
                            communityOnlineMembers: community.community_online_members,
                            communityTotalMembers: community.community_total_members,
                            communityCreatedAt: community.community_created_at,
                        }
                        navigate(`/community/${community.community_id}`, { 
                            state: { communityData },
                            replace: true 
                        })
                    }} 
                    key={community.community_id}
                    isCommunity
                    communityId={community.community_id}
                    communityImage={community.community_image}
                    communityName={community.community_name}
                />
            ))}
  
            <div>
                <CommunityButton onClick={() => navigate('/')} isCreate /> 
            </div>
        </div>
    );
}