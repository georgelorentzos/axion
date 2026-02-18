import CommunityPreview from "../components/communities/CommunityPreview";
import { useParams } from "react-router-dom";

export default function JoinCommunity() {
    const { communityId } = useParams();

    return(
        <div className="h-screen w-full flex flex-col justify-center items-center">
            <CommunityPreview joinBtn communityId={communityId} />
        </div>
    );
}