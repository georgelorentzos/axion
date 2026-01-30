import HeaderBtn from './RightPanelHeaderBtn'
import { useState } from 'react'
import AddFriendContent from './AddFriendContent'
import PendingsContent from './PendingsContent'
import AllFriendsContent from './AllFriendsContent'
import OnlineFriendsContent from './OnlineFriendsConten'

export default function RightPanel() {
    const [selectedTab, setSelectedTab] = useState('Online');

    const renderContent = () => {
        switch(selectedTab) {
            case 'Online':
                return <OnlineFriendsContent />;
            case 'All Friends':
                return <AllFriendsContent />;
            case 'Pendings':
                return <PendingsContent />;
            case 'Add Friend':
                return <AddFriendContent />;
            default:
                return null;
        }
    };

    return (
        <div className="flex-1 w-[330px] h-screen border-r border-outline relative">
            <div className="w-full h-[100px] border-b border-outline flex items-center absolute top-0 px-6 gap-3">
                <HeaderBtn text="Online" selected={selectedTab === 'Online'} onClick={() => setSelectedTab('Online')} />
                <HeaderBtn text="All Friends" selected={selectedTab === 'All Friends'} onClick={() => setSelectedTab('All Friends')} />
                <HeaderBtn text="Pendings" selected={selectedTab === 'Pendings'} onClick={() => setSelectedTab('Pendings')} />
                <HeaderBtn text="Add Friend" selected={selectedTab === 'Add Friend'} onClick={() => setSelectedTab('Add Friend')} />
            </div>

            <div className="absolute top-[100px] w-full h-[calc(100%-100px)] overflow-y-auto">
                {renderContent()}
            </div>
        </div>
    );
}