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
                            id: c.id,
                            name: c.name,
                            image: c.image,
                            onlineMembers: c.onlineMembers,
                            totalMembers: c.totalMembers,
                            createdAt: c.createdAt,
                            ownerId: c.ownerId,
                        }
                        navigate(`/community/${c.id}`, { 
                            state: { community },
                            replace: true 
                        })
                    }} 
                    key={c.id}
                    isCommunity
                    communityId={c.id}
                    communityImage={c.image}
                    communityName={c.name}
                />
            ))}
  
            <div>
                <CommunityButton onClick={() => navigate('/')} isCreate /> 
            </div>
        </div>
    );
}