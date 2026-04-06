import ImageProfile from '../../../ui/ImageProfile';
import MessageInput from '../../../ui/MessageInput';
import MessageBubble from '../../../ui/MessageBubble';
import { useParams } from "react-router-dom";
import { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { useCurrentUser } from '../../user/contexts/useCurrentUser';
import { useNavigate } from 'react-router-dom';
import { useDirectMessages } from '../contexts/useDirectMessages';
import { useUser } from '../contexts/useUser';

export default function Conversation() {
    const { userId } = useParams();
    const { currentUser } = useCurrentUser();
    const { user, setUser } = useUser();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const [showMessages, setShowMessages] = useState(false);
    const conversationRef = useRef<HTMLDivElement>(null);
    const prevScrollHeightRef = useRef(0);
    const { messages, setMessages, isMessagesLoaded, hasMore, isLoading, loadMore } = useDirectMessages();

    useEffect(() => {
        prevScrollHeightRef.current = 0;
    }, [userId]);

    useEffect(() => {
        if (isMessagesLoaded) {
            const timer = setTimeout(() => {
                setShowMessages(true);
            }, 10);
            return () => clearTimeout(timer);
        }
        setShowMessages(false);
    }, [isMessagesLoaded]);

    useEffect(() => {
        if (userId === currentUser?.id) {
            navigate("/");
        }
    }, [userId, currentUser]);

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
        if (messages.length > 0 && prevScrollHeightRef.current === 0) {
            requestAnimationFrame(() => {
                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
                }, 50);
            });
        }
    }, [messages]);

    useLayoutEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const newScrollHeight = container.scrollHeight;
        const diff = newScrollHeight - prevScrollHeightRef.current;
        if (diff > 0 && prevScrollHeightRef.current > 0) {
            container.scrollTop += diff;
        }
        prevScrollHeightRef.current = newScrollHeight;
    }, [messages]);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        let debounceTimer: ReturnType<typeof setTimeout>;

        const handleScroll = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const threshold = container.scrollHeight * 0.25;
                if (container.scrollTop < threshold && hasMore && !isLoading) {
                    prevScrollHeightRef.current = container.scrollHeight;
                    loadMore();
                }
            }, 200);
        };

        container.addEventListener('scroll', handleScroll);
        return () => {
            container.removeEventListener('scroll', handleScroll);
            clearTimeout(debounceTimer);
        };
    }, [hasMore, isLoading, loadMore]);

    return (
        <div ref={conversationRef} className="flex-1 h-screen border-r border-outline flex flex-col">
            <div className="h-[60px] border-b border-outline flex items-center px-4 gap-2 flex-shrink-0">
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

            <div ref={scrollContainerRef} className={`flex-1 w-full min-h-0 p-4 pb-3 space-y-3 ${showMessages ? "overflow-y-auto" : "overflow-hidden"}`}>
                <div className={`transition duration-300 ${showMessages ? "opacity-100" : "opacity-0 invisible"}`}>
                  {messages.map((message, index) => (
                        <div
                            key={message.id}
                            ref={index === messages.length - 1 ? messagesEndRef : null}
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
            </div>

            <div className="px-2 pb-2">
                <MessageInput
                    recipient_id={user?.id || ''}
                />
            </div>
        </div>
    );
}