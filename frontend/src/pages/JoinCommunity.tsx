import CommunityPreview from "../components/communities/CommunityPreview";

export default function JoinCommunity() {

    return(
        <div className="h-screen w-full flex flex-col justify-center items-center">
            <CommunityPreview joinBtn />
        </div>
    );
}