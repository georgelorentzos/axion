import { useLocation } from "react-router-dom";
import CommunityProfile from "./CommunityProfile";
import Button from "../common/Button";

type CommunityPreviewProps = {
    joinBtn?: boolean;
    communityName?: string;
    communityImage?: string | null;
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

export default function CommunityPreview({ joinBtn, communityName, communityImage }: CommunityPreviewProps) {
    const location = useLocation();
    const { communityData } = location.state as LocationState;

    return (
        <div className="bg-basalt border border-outline flex gap-2 flex-col justify-center items-start rounded-lg w-[300px] p-4">
            <div className="flex gap-2 items-center">
                {communityImage ? (
                    <CommunityProfile src={communityImage} />
                ) : (
                    <CommunityProfile name={(communityName || communityData?.communityName)?.charAt(0).toUpperCase()} isCommunityPreview />
                )}

                <div className="font-bold">{communityName ? communityName : communityData?.communityName}</div>
            </div>
            <div className="h-[40px] bg-onyx px-2 rounded-lg border border-outline flex justify-between items-center w-full">
                <div className="text-[12px] text-gray-500 flex items-center gap-2"><div className="w-3 h-3 bg-forestgreen rounded-full"></div> {communityData?.communityOnlineMembers} Online <div className="w-3 h-3 bg-red-500 border border-outline rounded-full"></div> {communityData?.communityTotalMembers} {String(communityData?.communityTotalMembers).trim() == "1" ? 'Member' : 'Members'}</div>
                <div className="text-[12px] text-gray-500">Est {communityData?.communityCreatedAt}</div>
            </div>
            {joinBtn && (
                <Button text="Join Community" isGreen />
            )}
        </div>
    );
}