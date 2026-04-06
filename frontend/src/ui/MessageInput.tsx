import { useState, useRef } from 'react';
import { api } from '../api/client';
import notificationSound from '../assets/sounds/notification.mp3';
import { useParams } from 'react-router-dom';

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
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5 text-gray-500 hover:text-gray-300 transition duration-300">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
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
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5 text-gray-500 hover:text-gray-300 transition duration-300">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
            </button>
        </div>
    );
}