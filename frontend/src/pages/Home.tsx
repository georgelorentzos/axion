import SideBar from '../components/SideBar';
import FriendsPanel from '../components/friendspanel/FriendsPanel';

export default function Home() {
    return (
        <div className="h-screen w-full flex items-center">
            <SideBar />
            <FriendsPanel />
        </div>
    );
}
