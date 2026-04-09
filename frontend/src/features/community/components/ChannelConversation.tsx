import { useParams, useLocation } from "react-router-dom";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { api } from "../../../api/client";
import { useChannelMessages } from "../contexts/useChannelMessages";
import MessageInput from "../../../ui/MessageInput";
import Message from "../../../ui/Message";
import MemberList from "./MemberList";
import { icons } from "../../../constants/Icons";
import Icon from "../../../ui/Icon";

export default function ChannelConversation() {
    const { communityId, channelId } = useParams();
    const location = useLocation();
    const [channel, setChannel] = useState(location.state?.channel || null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showMessages, setShowMessages] = useState(false);
    const prevScrollHeightRef = useRef(0);
    const [showMembers, setShowMembers] = useState(true);
    const { messages, isMessagesLoaded, hasMore, isLoading, loadMore } = useChannelMessages();

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
                            <Icon svgPaths={icons.hashtag} className="size-5 text-gray-500" />
                            {channel?.name}
                        </div>
                        <div className="flex">
                            <button onClick={() => setShowMembers(prev => !prev)}>
                                <Icon svgPaths={icons.users} className="size-5 text-gray-500 hover:text-gray-300 transition duration-200" />
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
                        <Icon svgPaths={icons.hashtag} className="size-10 text-gray-500" />
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