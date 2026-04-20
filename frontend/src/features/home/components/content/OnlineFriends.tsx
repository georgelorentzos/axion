import SearchBar from '../../../../ui/SearchBar'
import UserCard from '../../../../ui/card/UserCard';
import ActionMenu from '../../../../ui/action-menu/ActionMenu';
import ActionMenuButton from '../../../../ui/action-menu/ActionMenuButton';
import { useCurrentUser } from '../../../user/contexts/useCurrentUser';
import { useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import { type User } from '../../../user/types/user';
import { api } from '../../../../api/client';
import { icons } from '../../../../constants/Icons';
import Icon from '../../../../ui/Icon';
import { useFriends } from '../../contexts/useFriends';

export default function OnlineFriends() {
    const { onlineFriends, isLoading, setFriends } = useFriends();
    const { currentUser } = useCurrentUser();
    const navigate = useNavigate();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [selectedFriend, setSelectedFriend] = useState<User | null>(null);
    
    const buttonRef = useRef<HTMLButtonElement | null>(null);

    const filtered = onlineFriends.filter(friend => 
        friend.username.toLowerCase().startsWith(searchQuery.toLowerCase())
    );

    const handleUnfriend = async () => {
        if (!currentUser?.id || !selectedFriend?.id) return;
        try {
            const { response } = await api.friends.remove(selectedFriend.id);
            if (response.ok) {
                setFriends(prev => prev.filter(f => f.id !== selectedFriend.id));
                setIsMenuOpen(false);
            }
        } catch (error) {
            console.error('Error removing friend:', error);
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="p-2 flex gap-2 flex-col flex-1">
                {!isLoading && onlineFriends.length >= 1 && (
                    <SearchBar onSearch={(value: string) => setSearchQuery(value)} />
                )}
                
                {searchQuery && filtered.length === 0 && (
                    <div className='flex-1 flex flex-col justify-center items-center mb-[58px]'>
                        <div className="text-gray-400 text-sm">No results found</div>
                    </div>
                )}
                
                {!isLoading && !searchQuery && onlineFriends.length === 0 && (
                    <div className='flex-1 flex flex-col justify-center items-center'>
                        <div className="text-gray-400 text-sm">No online friends</div>
                    </div>
                )}

                {filtered.map(friend => (
                    <UserCard
                        key={friend.id}
                        user={friend}
                        onClick={() => navigate(`/chat/${friend.id}`, { state: { user: friend } })}
                    >
                        <button
                            ref={selectedFriend?.id === friend.id ? buttonRef : null}
                            onClick={(e) => {
                                e.stopPropagation();
                                setPos({ x: e.clientX, y: e.clientY });
                                setSelectedFriend(friend);
                                setIsMenuOpen(true);
                            }}
                        >
                            <Icon svgPaths={icons.verticalDots} className="size-5 text-gray-500 hover:text-gray-300 transition duration-300" />
                        </button>
                    </UserCard>
                ))}
            </div>

            <ActionMenu 
                isOpen={isMenuOpen} 
                onClose={() => setIsMenuOpen(false)} 
                buttonRef={buttonRef} 
                position={pos}
            >
                <ActionMenuButton
                    text="Unfriend"
                    isDanger
                    svgPaths={icons.unfriend}
                    onClick={handleUnfriend}
                />
            </ActionMenu>
        </div>
    );
}