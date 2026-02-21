import { useCurrentUser } from '../contexts/useCurrentUser'
import UserCard from '../components/common/UserCard'
import SearchBar from '../components/common/SearchBar'
import { useSearch } from '../hooks/useSearch';
import { useDirectMessages } from "../contexts/useDirectMessages";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from 'react';
import notificationSound from '../assets/sounds/notification.mp3';
import CurrentUserCard from "./common/CurrentUserCard";

export default function ChatOverView() {
    const { currentUser } = useCurrentUser();
    const { directMessages, setDirectMessages, loading } = useDirectMessages();
    const { searchQuery, setSearchQuery, filtered } = useSearch(directMessages);
    const navigate = useNavigate();
    const audioRef = useRef<HTMLAudioElement>(null);
    
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'new_direct_message') {
                    setDirectMessages(directmessages => {
                        if (directmessages.find(dm => dm.user_id === data.user_id)) {
                            return directmessages.map(dm => dm.user_id === data.user_id ? { ...dm, latest_message: data.latest_message } : dm)
                        }
                        return [
                            {
                                user_id: data.user_id,
                                username: data.username,
                                profile_image: data.profile_image,
                                is_online: data.is_online,
                                latest_message: data.latest_message,
                                created_at: data.created_at,
                            },
                            ...directmessages
                        ];
                    });
                }

                if (data.type == 'conversation_deleted') {
                    setDirectMessages(directmessages => {
                        return directmessages.filter(dm => dm.user_id !== data.conversation_id);
                    });
                    navigate('/');
                }

                if (data.type === 'message_sent') {
                    if (data.recipient_id === currentUser?.user_id && audioRef.current) {
                        audioRef.current.src = notificationSound;
                        audioRef.current.play().catch(() => {});
                    }
                }

                if (data.type === 'user_online') {
                    setDirectMessages(directmessages => 
                        directmessages.map(directmessage => 
                            directmessage.user_id === data.user_id ? { ...directmessage, is_online: true } : directmessage
                        )
                     );
                }

                if (data.type === 'user_offline') {
                    setDirectMessages(directmessages => 
                        directmessages.map(directmessage =>
                            directmessage.user_id === data.user_id ? { ...directmessage, is_online: false } : directmessage
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
    }, [currentUser?.user_id]);

    return (
        <div className="w-[370px] h-screen border-r border-outline flex flex-col">
            <audio ref={audioRef} preload="auto" />
            <div className="w-full h-[60px] border-b border-outline flex items-center px-6 gap-2 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5 text-gray-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                </svg>
                <div className="text-gray-100">Direct Messages</div>
            </div>

            <div className="p-2 flex gap-2 flex-col flex-1">
                {!loading && directMessages.length >= 1 && (
                <SearchBar value={searchQuery} onSearch={setSearchQuery} />
                )}
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
                {filtered.map(directmessage => (
                    <UserCard 
                    key={directmessage.user_id}
                    id={directmessage.user_id}
                    username={directmessage.username}
                    image={directmessage.profile_image}
                    actions={{ deleteConversation: true }}
                    isOnline={directmessage.is_online}
                    showLatestMessage
                    latestMessage={directmessage.latest_message}
                    createdAt={directmessage.created_at}
                    />
                ))}
            </div>
            
            <div className="px-2 h-[80px] flex items-center flex-shrink-0 justify-center">
                <CurrentUserCard />
            </div>
        </div>
    );
}