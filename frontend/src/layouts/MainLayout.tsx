import SideBar from '../components/SideBar';

export const MainLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="h-screen w-full flex items-center">
    <SideBar />
    {children}
  </div>
);