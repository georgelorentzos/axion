import { useLocation } from "react-router-dom";
import CommunityProfile from "./CommunityProfile";
import Button from "../common/Button";
import { useEffect, useState } from "react";

type CommunityPreviewProps = {
    joinBtn?: boolean;
    communityId?: string;
    communitySettingsName?: string;
    communitySettingsImage?: string | null;
    onJoin?: () => void;
}

interface LocationState {
    communityData?: {
        communityName: string;
        communityImage: string;
        communityOnlineMembers: string;
        communityTotalMembers: string;
        communityCreatedAt: string;
    };
}

interface Community {
    communityId: string;
    communityName: string;
    communityImage: string;
    communityOnlineMembers: string;
    communityTotalMembers: string;
    communityCreatedAt: string;
}

export default function CommunityPreview({ joinBtn, communityId, communitySettingsName, communitySettingsImage, onJoin }: CommunityPreviewProps) {
    const location = useLocation();
    const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;
    const locationData = (location.state as LocationState)?.communityData;
    const [community, setCommunity] = useState<Community | null>(null);

    useEffect(() => {
        if (!communityId) return;
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
    }, [communityId]);

    const name = communitySettingsName || community?.communityName || locationData?.communityName;
    const image = communitySettingsImage !== undefined ? communitySettingsImage : community?.communityImage ?? locationData?.communityImage;
    const onlineMembers = community?.communityOnlineMembers || locationData?.communityOnlineMembers;
    const totalMembers = community?.communityTotalMembers || locationData?.communityTotalMembers;
    const createdAt = community?.communityCreatedAt || locationData?.communityCreatedAt;

    const getImageSrc = (image: string) => {
        if (image.startsWith("blob:") || image.startsWith("http")) return image;
        return apiUrl + image;
    };

    return (
        <div className="bg-onyx border border-outline flex gap-2 flex-col justify-center items-start rounded-lg w-[300px] p-4">
            <div className="flex gap-2 items-center">
                {image ? (
                    <CommunityProfile src={getImageSrc(image)} />
                ) : (
                    <CommunityProfile name={name?.charAt(0).toUpperCase()} isCommunityPreview />
                )}
                <div className="font-bold">{name}</div>
            </div>

            <div className="h-[40px] bg-basalt px-2 rounded-lg border border-outline flex justify-between items-center w-full">
                <div className="text-[12px] text-gray-500 flex items-center gap-2">
                    <div className="w-3 h-3 bg-forestgreen rounded-full"></div>
                    {onlineMembers} Online
                    <div className="w-3 h-3 bg-red-500 border border-outline rounded-full"></div>
                    {totalMembers} {String(totalMembers).trim() === "1" ? "Member" : "Members"}
                </div>
                <div className="text-[12px] text-gray-500">Est {createdAt}</div>
            </div>

            {joinBtn && (
                <Button text="Join Community" isGreen onClick={onJoin} />
            )}
        </div>
    );
}