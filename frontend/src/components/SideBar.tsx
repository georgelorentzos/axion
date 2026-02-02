import ImageProfile from "../components/common/ImageProfile"
import { useCurrentUser } from '../contexts/useCurrentUser'
import UserCard from '../components/common/UserCard'
import SearchBar from '../components/common/SearchBar'
import { useSearch } from '../hooks/useSearch';
import { useDirectMessages } from "../contexts/useDirectMessages";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from 'react';
import notificationSound from '../assets/sounds/notification.mp3';

export default function SideBar() {
    const { user } = useCurrentUser();
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
                    if (data.recipient_id === user?.user_id && audioRef.current) {
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
    }, [user?.user_id]);

    return (
        <div className="w-[370px] h-screen border-r border-outline flex flex-col">
            <audio ref={audioRef} preload="auto" />
            <div className="w-full h-[100px] border-b border-outline flex items-center px-6 gap-3 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 text-gray-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                </svg>
                <div className="text-gray-100">Direct Messages</div>
            </div>

            <div className="space-y-3 p-6 flex flex-col flex-1">
                <button 
                onClick={() => {
                    navigate('/');
                }}
                
                className={`transition duration-200 h-[60px] flex items-center hover:bg-field px-4 rounded-xl gap-2 ${
                    location.pathname === '/' ? 'bg-field' : 'bg-primary'
                }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 text-gray-500 ">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                    </svg>
                    <span className="text-gray-400">Friends</span>
                </button>
                {!loading && directMessages.length >= 1 && (
                <SearchBar value={searchQuery} onSearch={setSearchQuery} />
                )}
                {searchQuery && filtered.length === 0 && (
                <div className='flex-1 flex flex-col justify-center items-center mt-[100px]'>
                    <div className="text-gray-400 text-sm">No results found</div>
                </div>
                )}
                {!loading && !searchQuery && directMessages.length === 0 && (
                <div className='flex-1 flex flex-col justify-center items-center mt-[100px]'>
                    <div className="text-gray-400 text-sm">No messages yet</div>
                </div>
                )}
                {filtered.map(directmessage => (
                    <UserCard 
                    key={directmessage.user_id}
                    id={directmessage.user_id}
                    username={directmessage.username}
                    image={directmessage.profile_image}
                    optionsBtn
                    isOnline={directmessage.is_online}
                    removeDmBtn
                    showLatestMessage
                    latestMessage={directmessage.latest_message}
                    createdAt={directmessage.created_at}
                    />
                ))}
            </div>
            
            <div className="w-full h-[100px] border-t border-outline flex items-center flex-shrink-0">
             <div className="px-6 flex justify-between items-center w-full">
                    <div className="flex items-center gap-3">
                        <ImageProfile src={user?.profile_image} online />
                        <div className="flex flex-col leading-none gap-1">
                            <div className="text-gray-100">{user?.username}</div>
                            <div className="text-gray-500 text-[12px]">Online</div>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <button>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 text-gray-500 transition duration-1000 hover:rotate-[360deg] hover:text-gray-300">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}