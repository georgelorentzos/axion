import CommunityList from '../ui/sidebar/CommunityList';
import ChatOverView from '../features/home/components/ChatOverView';
import { Outlet } from 'react-router-dom';

export const HomeLayout = () => (
  <div className="h-screen w-full flex items-center">
    <CommunityList />
    <ChatOverView />
    <Outlet />
  </div>
);