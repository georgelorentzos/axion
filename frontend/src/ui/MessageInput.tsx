import { useState, useRef } from 'react';
import { api } from '../api/client';
import notificationSound from '../assets/sounds/notification.mp3';
import { useParams } from 'react-router-dom';
import { icons } from '../constants/Icons';
import Icon from './Icon';

type MessageInputProps = {
    value?: string;
    recipient_id: string;
};

export default function MessageInput({ value: propValue, recipient_id }: MessageInputProps) {
    const [value, setValue] = useState(propValue || '');
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
                    setValue('');
                    playSendSound();
                }
            } else {
                const { data } = await api.directMessages.send(recipient_id, message);
                if (data.success) {
                    setValue('');
                    playSendSound();
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleKeyPressEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && value.trim()) {
            sendMessage(value);
        }
    };

    const handleSendClick = () => {
        sendMessage(value);
    };

    return (
        <div className='border border-outline flex items-center bg-basalt px-4 rounded-lg gap-2 w-full h-[60px]'>
            <audio ref={audioRef} preload="auto" />
            <button>
                <Icon svgPaths={icons.add} className="size-5 text-gray-500 hover:text-gray-300 transition duration-300" />
            </button>
            <input 
                type="text" 
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyPress={handleKeyPressEnter}
                className="bg-basalt text-gray-100 focus:outline-none h-full border-outline flex justify-between items-center w-full"
                placeholder="Message"  
            />
            <button onClick={handleSendClick}>
                <Icon svgPaths={icons.send} className="size-5 text-gray-500 hover:text-gray-300 transition duration-300" />
            </button>
        </div>
    );
}