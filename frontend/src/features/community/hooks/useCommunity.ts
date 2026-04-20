import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { type Community } from "../types/community";
import { api } from "../../../api/client";

export function useCommunity() {
  const { communityId } = useParams();
  const [community, setCommunity] = useState<Community | undefined>(undefined);

  useEffect(() => {
    if (!communityId) return;
    
    const fetchCommunityData = async () => {
      try {
        const { data } = await api.communities.get(communityId);
        setCommunity({
          id: data.id,
          name: data.name,
          image: data.image,
          onlineMembers: data.onlineMembers,
          totalMembers: data.totalMembers,
          createdAt: data.createdAt,
          ownerId: data.ownerId,
        });
      } catch (error) {
        console.log("failed to fetch community data: ", error);
      }
    };
    
    fetchCommunityData();
  }, [communityId]);

  return { community, setCommunity };
}