import CommunityList from '../ui/sidebar/CommunityList';
import ChannelList from '../features/community/components/ChannelList';
import ChannelConversation from '../features/community/components/ChannelConversation';
import MemberList from '../features/community/components/MemberList';

export const CommunityLayout = () => (
  <div className="h-screen w-full flex items-center">
    <CommunityList />
    <ChannelList />
    <ChannelConversation />
    <MemberList />
  </div>
);