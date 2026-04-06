import CommunityButton from "./CommunityButton";
import { useNavigate } from "react-router-dom";
import { useCommunities } from "./contexts/useCommunities";
import { useEffect, useState, useRef } from "react";
import { type Conversation } from "../../features/direct-message/types/conversation";
import ConversationButton from "./ConversationButton";
import { useLocation } from "react-router-dom";
import notificationSound from '../../assets/sounds/notification.mp3';

export default function CommunityList() {
    const navigate = useNavigate();
    const { communities } = useCommunities();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const location = useLocation();
    const locationRef = useRef(location.pathname);
    const audioRef = useRef<HTMLAudioElement>(null);
    
    useEffect(() => {
        locationRef.current = location.pathname;
    }, [location.pathname]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            if (data.type === "newDirectMessage") {
                if (locationRef.current.startsWith(`/chat/${data.id}`)) return;
                if (audioRef.current) {
                    audioRef.current.src = notificationSound;
                    audioRef.current.play().catch(() => {});
                }
                setConversations(prev => {
                    const existing = prev.find(c => c.id === data.id);
                    if (existing) {
                        const updated = { ...existing, unreadCount: existing.unreadCount + 1 };
                        return [updated, ...prev.filter(c => c.id !== data.id)];
                    }
                    return [
                    {
                        id: data.id,
                        username: data.username,
                        image: data.image,
                        isOnline: data.isOnline,
                        createdAt: data.createdAt,
                        unreadCount: 1,
                    },
                ...prev,];
                });
            }
        };
        const ws = window._ws?.ws;
        if (ws) {
            ws.addEventListener("message", handleMessage);
            return () => ws.removeEventListener("message", handleMessage);
        }
    }, []);
    
    return (
        <div className="bg-prmary px-4 h-screen flex flex-col gap-2 items-center border-r border-outline">
            <audio ref={audioRef} preload="auto" />
            <div className="pt-3 flex items-center">
                <CommunityButton onClick={() => navigate('/')} isHome /> 
            </div>

            {conversations && conversations.length > 0 && (
                conversations.map((dm, index) => (
                    <ConversationButton key={index} conversation={dm} onClick={() => {
                        navigate(`/chat/${dm.id}`);
                        setConversations(prev => prev.filter(c => c.id !== dm.id));
                    }}/>
                ))
            )}

            {communities?.map(c => (
                <CommunityButton
                    onClick={() => {
                        const community = {
                            id: c.id,
                            name: c.name,
                            image: c.image,
                            createdAt: c.createdAt,
                            ownerId: c.ownerId,
                        }
                        navigate(`/community/${c.id}`, { 
                            state: { community }
                        })
                    }} 
                    key={c.id}
                    isCommunity
                    communityId={c.id}
                    communityImage={c.image}
                    communityName={c.name}
                />
            ))}
  
            <div>
                <CommunityButton onClick={() => navigate('/')} isCreate /> 
            </div>
        </div>
    );
}