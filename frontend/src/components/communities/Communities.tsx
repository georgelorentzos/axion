import CommunityButton from "./CommunityButton";
import { useNavigate } from "react-router-dom";
import { useCommunities } from "../../contexts/useCommunities";
// import { useState, useEffect } from "react";

// interface Community {
//     Community_name: string;
//     Community_image: string
// }

export default function Communities() {
    const navigate = useNavigate();
    const { communities } = useCommunities();
    // const [communities, setCommunities] = useState<Community[] | null>(null);

    return (
        <div className="bg-prmary w-[80px] h-screen flex flex-col gap-3 items-center border-r border-outline">
            <div className="pt-7 flex items-center">
                <CommunityButton onClick={
                    () => {
                    navigate('/');
                    }
                } isHome /> 
            </div>

            {communities?.map(community => (
                <CommunityButton
                onClick={() => {
                    const communityData = {
                        "communityName": community.community_name
                    }
                    navigate(`/community/${community.community_id}`, { state: { communityData }})
                }} 
                key={community.community_id}
                isCommunity
                communityId={community.community_id}
                communityImage={community.community_image}
                communityName={community.community_name}
                />
            ))}
  
            <div>
                <CommunityButton onClick={
                    () => {
                    navigate('/');
                    }
                } isCreate /> 
            </div>
           
        </div>
    );
}