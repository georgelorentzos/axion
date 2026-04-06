import { useCurrentUser } from '../../user/contexts/useCurrentUser'
import UserCard from '../../../ui/UserCard'
import SearchBar from '../../../ui/SearchBar'
import { useDirectMessages } from '../contexts/useDirectMessages';
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from 'react';
import notificationSound from '../../../assets/sounds/notification.mp3';
import CurrentUserCard from "../../../ui/CurrentUserCard";
import { api } from '../../../api/client';

export default function ChatOverView() {
    const { currentUser } = useCurrentUser();
    const { directMessages, setDirectMessages, loading } = useDirectMessages();
    const [searchQuery, setSearchQuery] = useState('');
    const filtered = directMessages.filter(dm => dm.user.username.toLowerCase().startsWith(searchQuery.toLowerCase()));
    const navigate = useNavigate();
    const audioRef = useRef<HTMLAudioElement>(null);

    const handleDeleteConversation = async (userId: string) => {
        try {
            const { response } = await api.messages.deleteConversation(userId);
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
                    setDirectMessages(prev => {
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
                    setDirectMessages(prev => prev.filter(dm => dm.user.id !== data.id));
                    navigate('/');
                }
                if (data.type === 'messageSent') {
                    if (data.senderId !== currentUser?.id && audioRef.current) {
                        audioRef.current.src = notificationSound;
                        audioRef.current.play().catch(() => {});
                    }
                }
                if (data.type === 'userOnline') {
                    setDirectMessages(prev =>
                        prev.map(dm =>
                            dm.user.id === data.id ? { ...dm, user: { ...dm.user, isOnline: true } } : dm
                        )
                    );
                }
                if (data.type === 'userOffline') {
                    setDirectMessages(prev =>
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
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5 text-gray-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                </svg>
                <div className="text-gray-100">Direct Messages</div>
            </div>

            {!loading && directMessages.length >= 1 && (
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
                {!loading && !searchQuery && directMessages.length === 0 && (
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
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5 text-gray-500 hover:text-gray-300 transition duration-300">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </UserCard>
                ))}
            </div>

            <div className="px-2 h-[80px] flex items-center flex-shrink-0 justify-center">
                <CurrentUserCard />
            </div>
        </div>
    );
}