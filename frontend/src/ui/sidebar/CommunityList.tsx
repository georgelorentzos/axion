import CommunityButton from "./CommunityButton";
import { useNavigate } from "react-router-dom";
import { useCommunities } from "./contexts/useCommunities";
import { useEffect, useRef, useState } from "react";
import ConversationButton from "./ConversationButton";
import { useLocation } from "react-router-dom";
import { type Conversation } from "./types/conversation";
import { useParams } from "react-router-dom";
import notificationSound from '../../assets/sounds/notification.mp3';

export default function CommunityList() {
    const navigate = useNavigate();
    const { communities } = useCommunities();
    const location = useLocation();
    const locationRef = useRef(location.pathname);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const { userId } = useParams();
    
    const playReceiveSound = () => {
        if (audioRef.current) {
            audioRef.current.src = notificationSound;
            audioRef.current.play().catch(() => {});
        }
    };

    useEffect(() => {
        locationRef.current = location.pathname;
    }, [location.pathname]);
    
    useEffect(() => {
        const handleUnreadDirectMessages = (event: CustomEvent) => {
            const data = event.detail;
            if (userId) return;
            playReceiveSound();
            setConversations(prev => {
                const exists = prev.some(c => c.id === data.id);
                if (exists) {
                    return prev.map(c =>
                        c.id === data.id
                            ? { ...c, unreadCount: c.unreadCount + 1 }
                            : c
                    );
                } else {
                    return [...prev, data];
                }
            });
        }
        window.addEventListener("unreadDirectMessages", handleUnreadDirectMessages as EventListener);
        return () => window.removeEventListener("unreadDirectMessages", handleUnreadDirectMessages as EventListener);
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
                        const stored = JSON.parse(localStorage.getItem("communities") || "[]");
                        const match = stored.find((item: { communityId: string }) => item.communityId === c.id);

                        navigate(match?.channelId 
                            ? `/community/${c.id}/${match.channelId}` 
                            : `/community/${c.id}`, 
                            { state: { community } }
                        );
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