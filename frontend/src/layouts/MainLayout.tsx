import CommunitiesList from '../components/communities/CommunitiesList';
import ChatOverView from '../components/ChatOverView';
import ChannelList from '../components/communities/ChannelList';
import { useLocation } from 'react-router-dom';

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const isCommunityPage = location.pathname.includes('/community');

  return (
    <div className="h-screen w-full flex items-center">
      <CommunitiesList />

      {isCommunityPage ? <ChannelList /> : <ChatOverView />}

      {children}
    </div>
  );
};
