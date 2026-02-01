import SideBar from "../components/SideBar";
import Conversation from '../components/chat/Conversation'

export default function DirectMessage() {
    return (
        <div className="h-screen w-full flex items-center">
            <SideBar />
            <Conversation />
        </div>
    );
}