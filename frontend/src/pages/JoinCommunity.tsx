import CommunityPreview from "../components/communities/CommunityPreview";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

interface Community {
    communityId: string;
    communityName: string;
    communityImage: string;
    communityOnlineMembers: string;
    communityTotalMembers: string;
    communityCreatedAt: string;
}

export default function JoinCommunity() {
    const { communityId } = useParams();
    const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;
    const [community, setCommunity] = useState<Community | null>(null);

    useEffect(() => {
        const fetchCommunity = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/community/${communityId}`);
                const data = await response.json();
                setCommunity({
                    communityId: data.community_id,
                    communityName: data.community_name,
                    communityImage: data.community_image,
                    communityOnlineMembers: data.community_online_members,
                    communityTotalMembers: data.community_total_members,
                    communityCreatedAt: data.community_created_at,
                });

            } catch (error) {
                console.log("error failed to fetch community", error);
            }
        }
        fetchCommunity();
    }, []);

    return(
        <div className="h-screen w-full flex flex-col justify-center items-center">
            <CommunityPreview joinBtn communityName={community?.communityName} communityImage={community?.communityImage && community?.communityImage ? apiUrl + community?.communityImage : null } communityOnlineMembers={community?.communityOnlineMembers} communityTotalMembers={community?.communityTotalMembers} communityCreatedAt={community?.communityCreatedAt} />
        </div>
    );
}