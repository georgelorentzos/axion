import UserCard from '../../../ui/card/UserCard';
import SearchBar from '../../../ui/SearchBar'
import { useConversations } from '../contexts/useConversations';
import { useNavigate } from "react-router-dom";
import { useRef, useState } from 'react';
import CurrentUserCard from '../../../ui/card/CurrentUserCard';
import { api } from '../../../api/client';
import { icons } from '../../../constants/Icons';
import Icon from '../../../ui/Icon';

export default function ChatOverView() {
    const { conversations, isLoading } = useConversations();
    const [searchQuery, setSearchQuery] = useState('');
    const filtered = conversations.filter(dm => dm.user.username?.toLowerCase().startsWith(searchQuery.toLowerCase()));
    const navigate = useNavigate();
    const audioRef = useRef<HTMLAudioElement>(null);

    const handleDeleteConversation = async (userId: string) => {
        try {
            const { response } = await api.conversations.delete(userId);
            if (!response.ok) throw new Error(`Failed to delete conversation (${response.status})`);
        } catch (error) {
            console.error("Error deleting conversation:", error);
        }
    }; 

    return (
        <div className="w-[370px] h-screen border-r border-outline flex flex-col">
            <audio ref={audioRef} preload="auto" />
            <div className="w-full h-[60px] border-b border-outline flex items-center px-4 gap-2 flex-shrink-0">
                <div className="text-gray-100">Direct Messages</div>
            </div>

            {!isLoading && conversations.length >= 1 && (
                <div className='px-2 pt-2'>
                    <SearchBar onSearch={(value: string) => setSearchQuery(value)} />
                </div>
            )}
            <div className="p-2 flex gap-2 flex-col flex-1 overflow-y-auto">
                {searchQuery && filtered.length === 0 && (
                    <div className='flex-1 flex flex-col justify-center items-center mt-[22px]'>
                        <div className="text-gray-400 text-sm">No results found</div>
                    </div>
                )}
                {!isLoading && !searchQuery && conversations.length === 0 && (
                    <div className='flex-1 flex flex-col justify-center items-center mt-[68px]'>
                        <div className="text-gray-400 text-sm">No messages yet</div>
                    </div>
                )}
                {filtered.map(dm => (
                    <UserCard
                        key={dm.user.id}
                        user={dm.user}
                        onClick={() => navigate(`/chat/${dm.user.id}`, { state: { user: dm.user } })}
                        showLatestMessage
                        latestMessage={dm.latestMessage}
                    >
                        <button onClick={() => handleDeleteConversation(dm.user.id!)}>
                            <Icon svgPaths={icons.x} className="size-5 text-gray-500 hover:text-gray-300 transition duration-300" />
                        </button>
                    </UserCard>
                ))}
            </div>

            <div className="px-2 pb-2">
                <CurrentUserCard />
            </div>
        </div>
    );
}