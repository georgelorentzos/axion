import { useRef, useState, useEffect } from 'react';
import { api } from '../api/client';
import notificationSound from '../assets/sounds/notification.mp3';
import { useParams } from 'react-router-dom';
import { icons } from '../constants/Icons';
import Icon from './Icon';
import TextArea from './TextArea';

type MessageInputProps = {
    value?: string;
    recipient_id: string;
};

export default function MessageInput({ value: propValue, recipient_id }: MessageInputProps) {
    const valueRef = useRef(propValue || '');
    const [clearCount, setClearCount] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);
    const { communityId, channelId } = useParams();
    const [replyInfo, setReplyInfo] = useState<{ id: string; senderUsername: string } | null>(null);
    
    const playSendSound = () => {
        if (audioRef.current) {
            audioRef.current.src = notificationSound;
            audioRef.current.play().catch(() => {});
        }
    };

    const sendMessage = async (message: string) => {
        if (!message.trim()) return;

        try {
            if (communityId && channelId) {
                const { data } = await api.channels.sendMessage(communityId, channelId, message, replyInfo?.id);
                if (data.success) {
                    window.dispatchEvent(new CustomEvent("cancelReply"));
                    valueRef.current = '';
                    setClearCount(c => c + 1);
                    playSendSound();
                }
            } else {
                const { data } = await api.messages.send(recipient_id, message, replyInfo?.id);
                if (data.success) {
                    window.dispatchEvent(new CustomEvent("cancelReply"));
                    valueRef.current = '';
                    setClearCount(c => c + 1);
                    playSendSound();
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleKeyPressEnter = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' && !event.shiftKey && valueRef.current.trim()) {
            sendMessage(valueRef.current);
        }
    };

    const handleSendClick = () => {
        sendMessage(valueRef.current);
    };

    useEffect(() => {
        const handleReplyToMessage = (event: CustomEvent) => {
            const { id, senderUsername } = event.detail;
            setReplyInfo({ id, senderUsername });
        };
        window.addEventListener("replyToMessage", handleReplyToMessage as EventListener);
        return () => window.removeEventListener("replyToMessage", handleReplyToMessage as EventListener);
    }, []);

    const handleCancelReply = () => {
        setReplyInfo(null);
        window.dispatchEvent(new CustomEvent("cancelReply"));
    };

    useEffect(() => {
      const cancelReply = () => setReplyInfo(null);
      window.addEventListener("cancelReply", cancelReply);
      return () => window.removeEventListener("cancelReply", cancelReply);
    }, []);

    return (
        <div className='flex flex-col'>
        {replyInfo && (
            <div className='px-4 text-xs flex items-center justify-between border border-outline border-b-0 w-full min-h-[30px] h-auto bg-basalt rounded-t'>
                <div className='text-gray-100'>Replying to <span className='font-bold text-emerald'>{replyInfo?.senderUsername}</span></div>
                <button onClick={handleCancelReply}>
                    <Icon svgPaths={icons.x} className='size-5 text-gray-500 hover:text-gray-300 transition duration-200' />
                </button>
            </div>
        )}
        <div className={`${replyInfo ? "rounded-b" : "rounded-lg"} border border-outline flex items-center bg-basalt pl-2 pr-4 gap-2 w-full min-h-[60px] h-auto`}>
            <audio ref={audioRef} preload="auto" />
            {/* <button>
                <Icon svgPaths={icons.add} className="size-5 text-gray-500 hover:text-gray-300 transition duration-300" />
            </button> */}
            <TextArea
                maxLength={2000}
                placeholder='Message'
                clearSignal={clearCount}
                onChange={(text) => { valueRef.current = text; }}
                onKeyDown={handleKeyPressEnter}
            />
            <button onClick={handleSendClick}>
                <Icon svgPaths={icons.send} className="size-5 text-gray-500 hover:text-gray-300 transition duration-300" />
            </button>
        </div>
        </div>
    );
}