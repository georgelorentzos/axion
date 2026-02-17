import { useLocation } from "react-router-dom";
import CommunityProfile from "./CommunityProfile";
import Button from "../common/Button";

type CommunityPreviewProps = {
    joinBtn?: boolean;
    communityName?: string;
    communityImage?: string | null;
    communityOnlineMembers?: string;
    communityTotalMembers?: string;
    communityCreatedAt?: string;
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

export default function CommunityPreview({ joinBtn, communityName, communityImage, communityOnlineMembers, communityTotalMembers, communityCreatedAt  ,onJoin }: CommunityPreviewProps) {
    const location = useLocation();
    const communityData = (location.state as LocationState)?.communityData;

    return (
        <div className="bg-onyx border border-outline flex gap-2 flex-col justify-center items-start rounded-lg w-[300px] p-4">
            <div className="flex gap-2 items-center">
                {communityImage ? (
                    <CommunityProfile src={communityImage && communityImage ? communityImage : ""} />
                ) : (
                    <CommunityProfile name={(communityName || communityData?.communityName)?.charAt(0).toUpperCase()} isCommunityPreview />
                )}

                <div className="font-bold">{communityName ? communityName : communityData?.communityName}</div>
            </div>
            <div className="h-[40px] bg-basalt px-2 rounded-lg border border-outline flex justify-between items-center w-full">
                <div className="text-[12px] text-gray-500 flex items-center gap-2"><div className="w-3 h-3 bg-forestgreen rounded-full"></div> {communityData?.communityOnlineMembers ? communityData?.communityOnlineMembers : communityOnlineMembers} Online <div className="w-3 h-3 bg-red-500 border border-outline rounded-full"></div> {communityData?.communityTotalMembers ? communityData?.communityTotalMembers : communityTotalMembers} {String(communityData?.communityTotalMembers ? communityData?.communityTotalMembers : communityTotalMembers).trim() == "1" ? 'Member' : 'Members'}</div>
                <div className="text-[12px] text-gray-500">Est {communityData?.communityCreatedAt ? communityData?.communityCreatedAt : communityCreatedAt}</div>
            </div>
            {joinBtn && (
                <Button text="Join Community" isGreen onClick={onJoin} />
            )}
        </div>
    );
}