import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { type Community } from "../../types/community";

export function useCommunity() {
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
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();
        setCommunity({
          id: data.community_id,
          name: data.community_name,
          image: data.community_image,
          onlineMembers: data.community_online_members,
          totalMembers: data.community_total_members,
          createdAt: data.community_created_at,
          ownerId: data.community_owner_id,
        });
      } catch (error) {
        console.log("failed to fetch community data: ", error);
      }
    };
    fetchCommunityData();
  }, [communityId]);

  return { community, setCommunity };
}