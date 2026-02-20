import { useNavigate } from "react-router-dom";
import CommunityProfile from "./CommunityProfile";
import Button from "../common/Button";
import { useEffect, useState } from "react";
import { useCommunities } from "../../contexts/useCommunities";
import { useParams } from "react-router-dom";

type CommunityData = {
    communityId: string;
    communityName: string;
    communityImage: string;
    communityOnlineMembers: string;
    communityTotalMembers: string;
    communityCreatedAt: string;
}

type CommunityPreviewProps = {
    joinBtn?: boolean;
    communityData?: CommunityData;
}

interface Community {
    communityId: string;
    communityName: string;
    communityImage: string;
    communityOnlineMembers: string;
    communityTotalMembers: string;
    communityCreatedAt: string;
}

export default function CommunityPreview({ joinBtn, communityData }: CommunityPreviewProps) {
    const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;
    const [community, setCommunity] = useState<Community | null>(null);
    const [doesNotExist, setDoesNotExist] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { setCommunities } = useCommunities();
    const { communityId } = useParams();

    const joinCommunity = async (communityId: string) => {
        const token = localStorage.getItem("token");
        if (!token) navigate("/auth");
        try {
            const response = await fetch(`${apiUrl}/api/community/${communityId}/join`, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!response.ok) {
                navigate("/auth");
                return;
            }
            if (response.ok) {
                const communityData = {
                    communityId: communityId,
                    communityName: community?.communityName || name,
                    communityImage: community?.communityImage || image,
                    communityOnlineMembers: community?.communityOnlineMembers || onlineMembers,
                    communityTotalMembers: community?.communityTotalMembers || totalMembers,
                    communityCreatedAt: community?.communityCreatedAt || createdAt
                }

                setCommunities(prev => {
                    const already = prev?.some(c => c.community_id === communityId);
                    if (already) return prev;
                                
                    return [
                        ...(prev || []),
                        {
                            community_id: communityId,
                            community_name: community?.communityName || name || "",
                            community_image: community?.communityImage || image || "",
                            community_online_members: community?.communityOnlineMembers || onlineMembers || "0",
                            community_total_members: community?.communityTotalMembers || totalMembers || "0",
                            community_created_at: community?.communityCreatedAt || createdAt || "",
                        },
                    ];
                });

                navigate(`/community/${communityId}`, { state: { communityData } });
            }
        } catch (error) {
            console.error("Join community error:", error);
        }
    };

    useEffect(() => {
        const id = communityData?.communityId || communityId;
        if (!id) {
            setDoesNotExist(true);
            setLoading(false);
            return;
        }
        const fetchCommunity = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/community/${id}`);
                if (!response.ok) {
                    setDoesNotExist(true);
                    return;
                }
                const data = await response.json();
                if (!data || !data.community_id) {
                    setDoesNotExist(true);
                    return;
                }
                setCommunity({
                    communityId: data.community_id,
                    communityName: data.community_name,
                    communityImage: data.community_image,
                    communityOnlineMembers: data.community_online_members,
                    communityTotalMembers: data.community_total_members,
                    communityCreatedAt: data.community_created_at,
                });
            } catch (error) {
                setDoesNotExist(true);
                console.log("error failed to fetch community", error);
            } finally {
                setLoading(false);
            }
        }
        fetchCommunity();
    }, [communityData?.communityId, communityId]);

    if (loading) return null;

    if (doesNotExist) {
        return (
            <div className="bg-onyx border border-outline flex gap-2 flex-col justify-center items-start rounded-2xl w-[300px] p-4">
                <div className="flex gap-2 items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-[50px] h-[50px] text-gray-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>

                    <div className="font-bold text-gray-500">Community doesn't exist</div>
                </div>
            </div>
        );
    }

    const id = communityData?.communityId || community?.communityId;
    const name = communityData?.communityName || community?.communityName;
    const image = communityData?.communityImage !== undefined ? communityData?.communityImage : community?.communityImage;
    const onlineMembers = communityData?.communityOnlineMembers || community?.communityOnlineMembers;
    const totalMembers = communityData?.communityTotalMembers || community?.communityTotalMembers;
    const createdAt = communityData?.communityCreatedAt || community?.communityCreatedAt;

    const getImageSrc = (image: string) => {
        if (image.startsWith("blob:") || image.startsWith("http")) return image;
        return apiUrl + image;
    };

    return (
        <div className="bg-onyx border border-outline flex gap-2 flex-col justify-center items-start rounded-2xl w-[300px] p-4">
            <div className="flex gap-2 items-center">
                {image ? (
                    <CommunityProfile src={getImageSrc(image)} />
                ) : (
                    <CommunityProfile name={name?.charAt(0).toUpperCase()} isCommunityPreview />
                )}
                <div className="font-bold">{name}</div>
            </div>

            <div className="h-[40px] px-2 flex justify-between items-center w-full">
                <div className="text-[12px] text-gray-500 flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                    <div className="w-3 h-3 bg-forestgreen rounded-full"></div>
                    {onlineMembers || 0} Online
                    </div>
                    <div className="flex items-center gap-0.5">
                    <div className="w-3 h-3 bg-emerald border border-outline rounded-full"></div>
                    {totalMembers} {String(totalMembers).trim() === "1" ? "Member" : "Members"}
                    </div>
                </div>
                <div className="text-[12px] text-gray-500">Est. {createdAt}</div>
            </div>

            {joinBtn && (
                <Button text="Join Community" isGreen onClick={() => id && joinCommunity(id)} bold />
            )}
        </div>
    );
}