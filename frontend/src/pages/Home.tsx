import SideBar from '../components/SideBar';
import RightPanel from '../components/RightPanel';

export default function Home() {
    return (
        <div className="h-screen w-full flex items-center">
            <SideBar />
            <RightPanel />
        </div>
    );
}
