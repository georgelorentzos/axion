import CommunityList from '../components/communitylist/CommunityList';
import ChatOverView from '../components/ChatOverView';
import ChannelList from '../components/community/ChannelList';
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
