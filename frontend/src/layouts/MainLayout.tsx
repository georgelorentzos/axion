import ChatOverView from '../components/ChatOverView';
import Communities from '../components/communities/Communities';

export const MainLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="h-screen w-full flex items-center">
    <Communities />
    <ChatOverView />
    {children}
  </div>
);