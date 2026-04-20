import CommunityList from '../ui/sidebar/CommunityList';
import ChannelList from '../features/community/components/ChannelList';
import ChannelChat from '../features/community/components/ChannelChat';

export const CommunityLayout = () => (
  <div className="h-screen w-screen flex overflow-hidden">
    <CommunityList />
    <ChannelList />
    <ChannelChat />
  </div>
);