import ImageProfile from '../common/ImageProfile';
import MessageInput from './MessageInput';
import MessageBubble from './MessageBubble'
import { useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from 'react';
import { useCurrentUser } from '../../contexts/useCurrentUser';

interface User {
    success: boolean;
    user_id: string;
    username: string;
    profile_image: string;
    is_online: boolean;
    created_at: string;
}

interface LocationState {
    userData?: {
        user_id: string;
        username: string;
        profile_image: string;
        is_online: boolean;
        created_at?: string | number;
    };
}

interface Message {
    id: string;
    sender_id: string;
    recipient_id: string;
    message: string;
    created_at: string;
}

export default function Conversation() {
    const { userId } = useParams();
    const location = useLocation();
    const token = localStorage.getItem('token');
    const { user: currentUser } = useCurrentUser();
    const [user, setUser] = useState<User | null>(null);
    const [loadingJoinedAt, setLoadingJoinedAt] = useState(false);
    const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        const state = location.state as LocationState;
        
        if (state?.userData) {
            const userData = state.userData;
            
            setUser({
                success: true,
                user_id: userData.user_id,
                username: userData.username,
                profile_image: userData.profile_image,
                is_online: userData.is_online,
                created_at: userData.created_at?.toString() || ''
            });
            
            if (!userData.created_at) {
                fetchCreatedAt(userData.user_id);
            }
            
            load20Messages(userData.user_id);
            return;
        }
        
        loadUser();
    }, [userId, token, location]);

    const fetchCreatedAt = async (id: string): Promise<void> => {
        setLoadingJoinedAt(true);
        try {
            const response = await fetch(`${apiUrl}/api/users/${id}`, {
                method: 'GET',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-type": "application/json"
                }
            });
            if (response.ok) {
                const data = await response.json();
                setUser(prev => prev ? { ...prev, created_at: data.created_at } : null);
            }
        } catch (error) {
            console.error('Error fetching created_at:', error);
        } finally {
            setLoadingJoinedAt(false);
        }
    };

    const loadUser = async (): Promise<void> => {
        try {
            const response = await fetch(`${apiUrl}/api/users/${userId}`, {
                method: 'GET',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-type": "application/json"
                }
            });
            const data = await response.json();
            console.log('User data:', data); 
            setUser(data);
            load20Messages(userId);
        } catch (error) {
            console.error('Fetch error:', error);
        }
    };

    const load20Messages = async (recipientId: string | undefined): Promise<void> => {
        if (!recipientId) return;

        try {
            const response = await fetch(`${apiUrl}/api/messages/${recipientId}`, {
                method: 'GET',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-type": "application/json"
                }
            });
            const data = await response.json();
            setMessages(data.messages || []);
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };

    const formatCreatedAt = (date: string | undefined): string => {
        if (!date) return 'Unknown';
        
        try {
            if (!isNaN(Number(date))) {
                return date;
            }
            
            const dateObj = new Date(date);
            return dateObj.getFullYear().toString();
        } catch (error) {
            return 'Unknown';
        }
    };

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'message_sent') {
                    setMessages(currentMessages => {
                        return [
                            ...currentMessages,
                            {
                                id: data.id,
                                sender_id: data.sender_id,
                                recipient_id: data.recipient_id,
                                message: data.message,
                                created_at: data.created_at,
                            },
                        ];
                    });
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
    }, []);

    // useEffect(() => {
    //     const messagesContainer = document.querySelector('.flex-1.w-full.overflow-y-auto');
    //     const userCenteredInfo = document.querySelector('.pb-6');
        
    //     if (messagesContainer && messages.length > 0) {
    //         messagesContainer.scrollTop = messagesContainer.scrollHeight;
    //     }
        
    //     if (messages.length > 0) {
    //         userCenteredInfo?.classList.remove('hidden');
    //     }
    // }, [messages]);

    return (
        <div className="flex-1 h-screen border-r border-outline flex flex-col">
            <div className="h-[100px] border-b border-outline flex items-center px-6 gap-3 flex-shrink-0">
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-3">
                        <ImageProfile 
                            src={user?.profile_image || "https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg"} 
                            online={user?.is_online} 
                        />
                        <div className="flex flex-col leading-none gap-1">
                            <div className="text-gray-100">{user?.username}</div>
                            <div className="text-gray-500 text-[12px]">
                                {user?.is_online ? 'Online' : 'Offline'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 w-full overflow-y-auto min-h-0 p-6 space-y-3">
                <div className="pb-6">
                    <div className="flex flex-col items-center gap-3">
                        <ImageProfile 
                            src={user?.profile_image || "https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg"} 
                            width="80" 
                            height="80" 
                            showStatus={false} 
                        />
                        <div className="flex flex-col leading-none gap-1 justify-center items-center">
                            <div className="text-gray-100">{user?.username}</div>
                            <div className="text-gray-500 text-[12px]">
                                {loadingJoinedAt ? 'Loading...' : `Joined in ${formatCreatedAt(user?.created_at)}`}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.sender_id === currentUser?.user_id ? 'justify-end' : 'justify-start'}`}
                        >
                            <MessageBubble 
                                isCurrentUser={message.sender_id === currentUser?.user_id}
                                message={message.message}
                                sender_username={message.sender_id === currentUser?.user_id ? currentUser?.username || '' : user?.username || ''}
                                created_at={message.created_at}
                                sender_profile_image={message.sender_id === currentUser?.user_id ? currentUser?.profile_image || '' : user?.profile_image || ''}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="px-6 h-[100px] border-t border-outline flex items-center flex-shrink-0 justify-center">
                <MessageInput 
                    recipient_id={user?.user_id || ''} 
                />
            </div>
        </div>
    );
}