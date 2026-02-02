import HeaderButton from './HeaderButton'
import { useState } from 'react'
import AddFriendContent from './AddFriendContent'
import PendingContent from './PendingContent'
import AllFriendsContent from './AllFriendsContent'
import OnlineFriendsContent from './OnlineFriendsConten'

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
        <div className="flex-1 w-[330px] h-screen border-r border-outline relative">
            <div className="w-full h-[100px] border-b border-outline flex items-center absolute top-0 px-6 gap-3">
                <HeaderButton text="Online" selected={selectedTab === 'Online'} onClick={() => setSelectedTab('Online')} />
                <HeaderButton text="All Friends" selected={selectedTab === 'All Friends'} onClick={() => setSelectedTab('All Friends')} />
                <HeaderButton text="Pending" selected={selectedTab === 'Pending'} onClick={() => setSelectedTab('Pending')} />
                <HeaderButton text="Add Friend" selected={selectedTab === 'Add Friend'} onClick={() => setSelectedTab('Add Friend')} />
            </div>

            <div className="absolute top-[100px] w-full h-[calc(100%-100px)] overflow-y-auto">
                {renderContent()}
            </div>
        </div>
    );
}