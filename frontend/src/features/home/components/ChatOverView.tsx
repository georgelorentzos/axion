import { useCurrentUser } from '../../user/contexts/useCurrentUser'
import UserCard from '../../../ui/UserCard'
import SearchBar from '../../../ui/SearchBar'
import { useConversations } from '../contexts/useConversations';
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from 'react';
import notificationSound from '../../../assets/sounds/notification.mp3';
import CurrentUserCard from "../../../ui/CurrentUserCard";
import { api } from '../../../api/client';
import { icons } from '../../../constants/Icons';
import Icon from '../../../ui/Icon';

export default function ChatOverView() {
    const { currentUser } = useCurrentUser();
    const { conversations, setConversations, loading } = useConversations();
    const [searchQuery, setSearchQuery] = useState('');
    const filtered = conversations.filter(dm => dm.user.username.toLowerCase().startsWith(searchQuery.toLowerCase()));
    const navigate = useNavigate();
    const audioRef = useRef<HTMLAudioElement>(null);

    const handleDeleteConversation = async (userId: string) => {
        try {
            const { response } = await api.directMessages.deleteConversation(userId);
            if (!response.ok) throw new Error(`Failed to delete conversation (${response.status})`);
        } catch (error) {
            console.error("Error deleting conversation:", error);
        }
    };

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'newDirectMessage') {
                    setConversations(prev => {
                        const existing = prev.find(dm => dm.user.id === data.id);
                        if (existing) {
                            const updated = { ...existing, latestMessage: data.latestMessage };
                            return [updated, ...prev.filter(dm => dm.user.id !== data.id)];
                        }
                        return [
                            {
                                user: {
                                    id: data.id,
                                    username: data.username,
                                    image: data.image,
                                    isOnline: data.isOnline,
                                    createdAt: data.createdAt,
                                },
                                latestMessage: data.latestMessage,
                            },
                            ...prev
                        ];
                    });
                }
                if (data.type === 'conversationDeleted') {
                    setConversations(prev => prev.filter(dm => dm.user.id !== data.id));
                    navigate('/');
                }
                if (data.type === 'messageSent') {
                    if (data.senderId !== currentUser?.id && audioRef.current) {
                        audioRef.current.src = notificationSound;
                        audioRef.current.play().catch(() => {});
                    }
                }
                if (data.type === 'userOnline') {
                    setConversations(prev =>
                        prev.map(dm =>
                            dm.user.id === data.id ? { ...dm, user: { ...dm.user, isOnline: true } } : dm
                        )
                    );
                }
                if (data.type === 'userOffline') {
                    setConversations(prev =>
                        prev.map(dm =>
                            dm.user.id === data.id ? { ...dm, user: { ...dm.user, isOnline: false } } : dm
                        )
                    );
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };
        const ws = window._ws?.ws;
        if (ws) {
            ws.addEventListener('message', handleMessage);
            return () => ws.removeEventListener('message', handleMessage);
        }
    }, [currentUser?.id]);

    return (
        <div className="w-[370px] h-screen border-r border-outline flex flex-col">
            <audio ref={audioRef} preload="auto" />
            <div className="w-full h-[60px] border-b border-outline flex items-center px-4 gap-2 flex-shrink-0">
                <div className="text-gray-100">Direct Messages</div>
            </div>

            {!loading && conversations.length >= 1 && (
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
                {!loading && !searchQuery && conversations.length === 0 && (
                    <div className='flex-1 flex flex-col justify-center items-center mt-[80px]'>
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