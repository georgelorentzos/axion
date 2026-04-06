import CommunityList from '../ui/sidebar/CommunityList';
import ChannelList from '../features/community/components/ChannelList';
import Conversation from '../features/community/components/Conversation';
import MemberList from '../features/community/components/MemberList';

export const CommunityLayout = () => (
  <div className="h-screen w-full flex items-center">
    <CommunityList />
    <ChannelList />
    <Conversation />
    <MemberList />
  </div>
);