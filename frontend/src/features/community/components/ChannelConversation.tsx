import { useParams, useLocation } from "react-router-dom";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { api } from "../../../api/client";
import { useCurrentUser } from "../../user/contexts/useCurrentUser";
import { useChannelMessages } from "../contexts/useChannelMessages";
import MessageInput from "../../../ui/MessageInput";
import MessageBubble from "../../../ui/MessageBubble";
import MemberList from "./MemberList";

export default function ChannelConversation() {
    const { communityId, channelId } = useParams();
    const location = useLocation();
    const { currentUser } = useCurrentUser();
    const [channel, setChannel] = useState(location.state?.channel || null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showMessages, setShowMessages] = useState(false);
    const prevScrollHeightRef = useRef(0);
    const [showMembers, setShowMembers] = useState(true);
    const { messages, setMessages, isMessagesLoaded, hasMore, isLoading, loadMore } = useChannelMessages();

    useEffect(() => {
        if (!channelId) {
            setChannel(null);
        }
        if (!channelId || !communityId) return;

        const getChannel = async () => {
            try {
                const { data } = await api.channels.getOne(communityId, channelId);
                if (data.success) {
                    setChannel({ id: data.id, name: data.name });
                }
            } catch (error) {
                console.log("failed to fetch channel information ", error);
            }
        };
        getChannel();
    }, [channelId]);

    useEffect(() => {
        if (location.state?.channel) {
            setChannel(location.state.channel);
        }
    }, [channelId]);

    useLayoutEffect(() => {
        prevScrollHeightRef.current = 0;
        setShowMessages(false);
    }, [channelId]);

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
        const handleMessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'newChannelMessage' && data.channelId === channelId) {
                    setMessages(currentMessages => {
                        return [
                            ...currentMessages,
                            {
                                id: data.id,
                                senderId: data.senderId,
                                channelId: data.channelId,
                                message: data.message,
                                createdAt: data.createdAt,
                                senderUsername: data.senderUsername,
                                senderImage: data.senderImage,
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
    }, [channelId]);

    useLayoutEffect(() => {
        if (messages.length > 0 && prevScrollHeightRef.current === 0) {
            requestAnimationFrame(() => {
                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
                }, 100);
            });
        }
    }, [messages, channelId]);

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
        <>
            {channelId && (
                <div className="flex-1 h-full flex flex-col">
                    <div className="w-full h-[60px] border-b border-outline flex items-center justify-between px-4 flex-shrink-0">
                        <div className="flex gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5 text-gray-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5" />
                            </svg>
                            {channel?.name}
                        </div>
                        <div className="flex">
                            <button onClick={() => setShowMembers(prev => !prev)}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5 text-gray-500 hover:text-gray-300 transition duration-200">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-1 min-h-0">
                        <div className="flex-1 flex flex-col min-w-0">
                            <div ref={scrollContainerRef} className={`flex-1 min-h-0 pr-3 pt-3 ${showMessages ? "overflow-y-auto" : "overflow-hidden"}`}>
                                <div className={showMessages ? "visible" : "invisible"}>
                                    {messages.map((message, index) => {
                                        const prevMessage = messages[index - 1];
                                        const nextMessage = messages[index + 1];
                                        const isFirstInGroup = !prevMessage || prevMessage.senderId !== message.senderId;
                                        const isLastInGroup = !nextMessage || nextMessage.senderId !== message.senderId;

                                        return (
                                            <MessageBubble
                                                key={message.id}
                                                message={message.message}
                                                senderUsername={message.senderUsername || ""}
                                                createdAt={message.createdAt}
                                                senderProfileImage={message.senderImage || ""}
                                                isFirstInGroup={isFirstInGroup}
                                                isLastInGroup={isLastInGroup}
                                            />
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>

                            <div className="px-2 pb-2">
                                <MessageInput recipient_id={channel?.id || ''} />
                            </div>
                        </div>

                        {showMembers && <MemberList />}
                    </div>
                </div>
            )}
            {!channelId && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="mt-[20px] flex flex-col items-center text-center max-w-[440px]">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-10 text-gray-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5" />
                        </svg>
                        <div className="text-gray-500 font-bold text-[18px]">NO TEXT CHANNELS</div>
                        <div className="text-gray-500">
                            You find yourself in a strange place. You dont have access to any text channels, or there are none in this server.
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}