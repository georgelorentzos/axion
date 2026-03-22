import CommunityList from '../features/community/components/CommunityList';
import ChatOverView from '../features/chat/components/ChatOverView';
import ChannelList from '../features/community/components/ChannelList';
import { useLocation } from 'react-router-dom';

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const isCommunityPage = location.pathname.includes('/community');

  return (
    <div className="h-screen w-full flex items-center">
      <CommunityList />

      {isCommunityPage ? <ChannelList/> : <ChatOverView/>}

      {children}
    </div>
  );
};
