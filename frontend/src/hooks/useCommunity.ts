import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

type Community = {
  communityId: string;
  communityName: string;
  communityImage: string;
  communityOnlineMembers: string;
  communityTotalMembers: string;
  communityCreatedAt: string;
  communityOwnerId: string;
};

export function useCommunity(){
    const token = localStorage.getItem("token");
    const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;
    const { communityId } = useParams();
    const [community, setCommunity] = useState<Community | undefined>(undefined);

    useEffect(() => {
        if (!token) return;
        if (!communityId) return;
        const fetchCommunityData = async () => {
          try {
            const response = await fetch(`${apiUrl}/api/community/${communityId}`, {
              headers: {"Authorization": `Bearer ${token}`}
            });
            const data = await response.json()
            setCommunity(
            {
              communityId: data.community_id,
              communityName: data.community_name,
              communityImage: data.community_image,
              communityOnlineMembers: data.community_online_members,
              communityTotalMembers: data.community_total_members,
              communityCreatedAt: data.community_created_at,
              communityOwnerId: data.community_owner_id,
            }
            );
          } catch (error) {
            console.log("failed to fetch community data: ", error);
          }
        };
        fetchCommunityData();
      }, [communityId])
      
      return { community, setCommunity };
}