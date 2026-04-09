import { useRef, useState } from 'react';
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
                const { data } = await api.channelMessages.send(communityId, channelId, message);
                if (data.success) {
                    valueRef.current = '';
                    setClearCount(c => c + 1);
                    playSendSound();
                }
            } else {
                const { data } = await api.directMessages.send(recipient_id, message);
                if (data.success) {
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

    return (
        <div className='border border-outline flex items-center bg-basalt px-4 rounded-lg gap-2 w-full min-h-[60px] h-auto'>
            <audio ref={audioRef} preload="auto" />
            <button>
                <Icon svgPaths={icons.add} className="size-5 text-gray-500 hover:text-gray-300 transition duration-300" />
            </button>
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
    );
}