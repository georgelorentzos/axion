import CommunityButton from "./CommunityButton";
import { useNavigate } from "react-router-dom";
import { useCommunities } from "../../contexts/useCommunities";
// import { useState, useEffect } from "react";

// interface Community {
//     server_name: string;
//     server_image: string
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
                key={community.community_id}
                isServer
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