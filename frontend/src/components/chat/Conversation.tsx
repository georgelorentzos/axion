import ImageProfile from '../common/ImageProfile';
import MessageInput from './MessageInput';
import MessageBubble from './MessageBubble'
import { useParams, useLocation } from "react-router-dom";
import { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { useCurrentUser } from '../../contexts/useCurrentUser';
import { useNavigate } from 'react-router-dom';
import { type User } from '../../types/user';

interface LocationState {
    user?: User;
}

interface Message {
    id: string;
    senderId: string;
    recipientId: string;
    message: string;
    createdAt: string;
}

export default function Conversation() {
    const { userId } = useParams();
    const location = useLocation();
    const token = localStorage.getItem('token');
    const { currentUser } = useCurrentUser();
    const [user, setUser] = useState<User | null>(null);
    const [loadingJoinedAt, setLoadingJoinedAt] = useState(false);
    const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;
    const [messages, setMessages] = useState<Message[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const [loadingMessages, setLoadingMessages] = useState(true);

    useEffect(() => {
        if (userId === currentUser?.id) {
            navigate("/");
        }
    }, [userId, currentUser]);

    useLayoutEffect(() => {
        const state = location.state as LocationState;

        if (state?.user) {
            setUser(state.user);

            if (!state.user.createdAt) {
                fetchCreatedAt(state.user.id);
            }

            load20Messages(state.user.id);
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
                setUser(prev => prev ? { ...prev, createdAt: data.joined_at?.toString() || '' } : null);
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
            if (!data.success) {
                navigate("/");
                return;
            }
            setUser({
                id: data.user_id,
                username: data.username,
                image: data.profile_image,
                isOnline: data.is_online,
                createdAt: data.joined_at?.toString() || '',
            });
            load20Messages(userId);
        } catch (error) {
            console.error('Fetch error:', error);
        }
    };

    const load20Messages = async (recipientId: string | undefined): Promise<void> => {
        if (!recipientId) return;
        setLoadingMessages(true);
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
        } finally {
            setTimeout(() => {
                setLoadingMessages(false);
            }, 100);
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
                if (data.type === 'messageSent') {
                    setMessages(currentMessages => {
                        return [
                            ...currentMessages,
                            {
                                id: data.id,
                                senderId: data.senderId,
                                recipientId: data.recipientId,
                                message: data.message,
                                createdAt: data.createdAt,
                            },
                        ];
                    });
                }
                if (data.type === 'userOnline') {
                    setUser(prev => prev ? { ...prev, isOnline: true } : null);
                }
                if (data.type === 'userOffline') {
                    setUser(prev => prev ? { ...prev, isOnline: false } : null);
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

    useLayoutEffect(() => {
        if (messages.length > 0) {
            
            requestAnimationFrame(() => {
                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
                }, 50);
            });
        }
    }, [messages]);

    
    const conversationRef = useRef<HTMLDivElement>(null);

    return (
        <div ref={conversationRef} className="flex-1 h-screen border-r border-outline flex flex-col">
            <div className="h-[60px] border-b border-outline flex items-center px-6 gap-2 flex-shrink-0">
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-2">
                        <ImageProfile
                            src={user?.image}
                            online={user?.isOnline}
                        />
                        <div className="flex flex-col leading-none gap-1">
                            <div className="text-gray-100">{user?.username}</div>
                            <div className="text-gray-500 text-[12px]">
                                {user?.isOnline ? 'Online' : 'Offline'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div ref={scrollContainerRef} className={`flex-1 w-full min-h-0 p-6 pb-3 space-y-3 ${loadingMessages ? "overflow-hidden" : "overflow-y-auto"}`}>
                <div className={`${loadingMessages ? "opacity-0" : "pb-6"}`}>
                    <div className="flex flex-col items-center gap-2">
                        <ImageProfile
                            src={user?.image}
                            width="80"
                            height="80"
                            showStatus={false}
                        />
                        <div className="flex flex-col leading-none gap-1 justify-center items-center">
                            <div className="text-gray-100">{user?.username}</div>
                            <div className="text-gray-500 text-[12px]">
                                {loadingJoinedAt ? 'Loading...' : `Joined in ${formatCreatedAt(user?.createdAt)}`}
                            </div>
                        </div>
                    </div>
                </div>
                <div className={`${loadingMessages ? "opacity-0" : ""}`}>
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${
                                message.senderId === currentUser?.id
                                    ? "justify-end"
                                    : "justify-start"
                            }`}
                        >
                            <MessageBubble
                                isCurrentUser={message.senderId === currentUser?.id}
                                message={message.message}
                                senderUsername={
                                    message.senderId === currentUser?.id
                                        ? currentUser?.username || ""
                                        : user?.username || ""
                                }
                                createdAt={message.createdAt}
                                senderProfileImage={
                                    message.senderId === currentUser?.id
                                        ? currentUser?.image || ""
                                        : user?.image || ""
                                }
                            />
                        </div>
                    ))}
                </div>
                <div ref={messagesEndRef} />
            </div>

            <div className="px-2 h-[80px] flex items-center flex-shrink-0 justify-center">
                <MessageInput
                    recipient_id={user?.id || ''}
                />
            </div>
        </div>
    );
}