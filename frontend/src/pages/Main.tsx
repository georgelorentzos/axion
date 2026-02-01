import { Routes, Route } from 'react-router-dom';
import SideBar from '../components/SideBar';
import FriendsPanel from '../components/friendspanel/FriendsPanel';
import Conversation from '../components/chat/Conversation';

export default function Main() {
    return (
        <div className="h-screen w-full flex items-center">
            <SideBar />
            <div className="flex-1">
                <Routes>
                    <Route path="/" element={<FriendsPanel />} />
                    <Route path="/chat/:userId" element={<Conversation />} />
                </Routes>
            </div>
        </div>
    );
}