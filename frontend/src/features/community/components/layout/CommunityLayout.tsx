import ChannelList from "./ChannelList";
import ChannelConversation from "./ChannelConversation";
import MemberList from "./MemberList";

export default function CommunityLayout() {
    return(
        <div className="flex w-full h-screen">
            <ChannelList />
            <ChannelConversation />
            <MemberList />
        </div>
    );
}