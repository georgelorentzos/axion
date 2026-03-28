import CommunityList from '../features/community/components/CommunityList';
import ChatOverView from '../features/chat/components/ChatOverView';
import { useLocation } from 'react-router-dom';
import CommunityLayout from '../features/community/components/CommunityLayout';

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const isCommunityPage = location.pathname.includes('/community');

  return (
    <div className="h-screen w-full flex items-center">
      <CommunityList />

      {isCommunityPage ? 
      <CommunityLayout/> 

      : 
      <ChatOverView/>
      }

      {children}
    </div>
  );
};
