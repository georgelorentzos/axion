import ImageProfile from '../../../ui/ImageProfile';
import MessageInput from '../../../ui/MessageInput';
import Message from '../../../ui/Message';
import { useParams } from "react-router-dom";
import { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { useCurrentUser } from '../../user/contexts/useCurrentUser';
import { useNavigate } from 'react-router-dom';
import { useDirectMessages } from '../contexts/useDirectMessages';
import { useUser } from '../contexts/useUser';

export default function DirectMessageConversation() {
    const { userId } = useParams();
    const { currentUser } = useCurrentUser();
    const { user } = useUser();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const [showMessages, setShowMessages] = useState(false);
    const conversationRef = useRef<HTMLDivElement>(null);
    const prevScrollHeightRef = useRef(0);
    const { messages, isMessagesLoaded, hasMore, isLoading, loadMore } = useDirectMessages();

    useEffect(() => {
        prevScrollHeightRef.current = 0;
    }, [userId]);

    useEffect(() => {
        if (isMessagesLoaded) {
            requestAnimationFrame(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
                setShowMessages(true);
            });
        } else {
            setShowMessages(false);
        }
    }, [isMessagesLoaded]);

    useEffect(() => {
        if (userId === currentUser?.id) {
            navigate("/");
        }
    }, [userId, currentUser]);

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
        <div ref={conversationRef} className="flex-1 min-w-0 h-screen border-r border-outline flex flex-col overflow-hidden">
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

            <div ref={scrollContainerRef} className={`flex-1 w-full min-h-0 pr-3 pt-3 space-y-3 ${showMessages ? "overflow-y-auto" : "overflow-hidden"}`}>
                <div className={showMessages ? "visible" : "invisible"}>
                  {messages.map((message, index) => {
                    const prevMessage = messages[index - 1];
                    const nextMessage = messages[index + 1];
                    const isReply = !!message.replyToId;
                    const prevIsReply = !!prevMessage?.replyToId;
                    const nextIsReply = !!nextMessage?.replyToId;

                    const isFirstInGroup = isReply || prevIsReply || !prevMessage || prevMessage.senderId !== message.senderId;
                    const isLastInGroup = isReply || nextIsReply || !nextMessage || nextMessage.senderId !== message.senderId;

                    return (
                            <Message
                                key={message.id}
                                message={message}
                                isFirstInGroup={isFirstInGroup}
                                isLastInGroup={isLastInGroup}
                            />
                        );
                    })}
                    <div ref={messagesEndRef} />
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