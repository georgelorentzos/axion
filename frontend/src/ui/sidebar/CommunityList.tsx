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
                const exists = prev.some(community => community.id === data.id);
                if (exists) {
                    return prev.map(community =>
                        community.id === data.id
                            ? { ...community, unreadCount: community.unreadCount + 1 }
                            : community
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
                        setConversations(prev => prev.filter(community => community.id !== dm.id));
                    }}/>
                ))
            )}

            {communities?.map(community => (
                <CommunityButton
                    onClick={() => {
                        const communityState = {
                            id: community.id,
                            name: community.name,
                            image: community.image,
                            createdAt: community.createdAt,
                            ownerId: community.ownerId,
                        }
                        const stored = JSON.parse(localStorage.getItem("communities") || "[]");
                        const match = stored.find((item: { communityId: string }) => item.communityId === community.id);

                        navigate(match?.channelId 
                            ? `/community/${community.id}/${match.channelId}` 
                            : `/community/${community.id}`, 
                            { state: { communityState } }
                        );
                    }} 
                    key={community.id}
                    isCommunity
                    community={community}
                />
            ))}
  
            <div>
                <CommunityButton onClick={() => navigate('/')} isCreate /> 
            </div>
        </div>
    );
}