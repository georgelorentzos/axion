import HeaderButton from './HeaderButton'
import { useState } from 'react'
import AddFriendContent from './Contents/AddFriendContent'
import PendingContent from './Contents/PendingContent'
import AllFriendsContent from './Contents/AllFriendsContent'
import OnlineFriendsContent from './Contents/OnlineFriendsConten'
export default function FriendsPanel() {
    const [selectedTab, setSelectedTab] = useState('Online');
    const renderContent = () => {
        switch(selectedTab) {
            case 'Online':
                return <OnlineFriendsContent />;
            case 'All Friends':
                return <AllFriendsContent />;
            case 'Pending':
                return <PendingContent />;
            case 'Add Friend':
                return <AddFriendContent />;
            default:
                return null;
        }
    };
    return (
        <div className="flex-1 h-screen border-r border-outline flex flex-col">
            <div className="w-full h-[60px] border-b border-outline flex items-center px-6 gap-2 flex-shrink-0">
                <HeaderButton text="Online" selected={selectedTab === 'Online'} onClick={() => setSelectedTab('Online')} />
                <HeaderButton text="All Friends" selected={selectedTab === 'All Friends'} onClick={() => setSelectedTab('All Friends')} />
                <HeaderButton text="Pending" selected={selectedTab === 'Pending'} onClick={() => setSelectedTab('Pending')} />
                <HeaderButton text="Add Friend" selected={selectedTab === 'Add Friend'} onClick={() => setSelectedTab('Add Friend')} />
            </div>
            <div className="flex-1 overflow-y-auto">
                {renderContent()}
            </div>
        </div>
    );
}