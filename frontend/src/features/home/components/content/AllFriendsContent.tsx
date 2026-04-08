import SearchBar from '../../../../ui/SearchBar'
import UserCard from '../../../../ui/UserCard'
import ActionMenu from '../../../../ui/actionmenu/ActionMenu';
import ActionMenuButton from '../../../../ui/actionmenu/ActionMenuButton';
import { useAllFriends } from '../../contexts/useAllFriends';
import { useCurrentUser } from '../../../user/contexts/useCurrentUser';
import { useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import { type User } from '../../../user/types/user';
import { api } from '../../../../api/client';
import { icons } from '../../../../constants/Icons';
import Icon from '../../../../ui/Icon';

function FriendOptionsButton({ user }: { user: User }) {
    const { currentUser } = useCurrentUser();
    const [isOpen, setIsOpen] = useState(false);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);

    const handleUnfriend = async () => {
        if (!currentUser?.id || !user.id) return;
        try {
            const { response } = await api.friends.remove(currentUser.id, user.id);
            if (!response.ok) throw new Error();
            setIsOpen(false);
        } catch (error) {
            console.error('Error removing friend:', error);
        }
    };

    return (
        <>
            <button
                ref={buttonRef}
                onClick={(e) => {
                    setPos({ x: e.clientX, y: e.clientY });
                    setIsOpen(prev => !prev);
                }}
            >
                <Icon svgPaths={icons.verticalDots} className="size-5 text-gray-500 hover:text-gray-300 transition duration-300" />
            </button>
            <ActionMenu isOpen={isOpen} onClose={() => setIsOpen(false)} buttonRef={buttonRef} position={pos}>
                <ActionMenuButton
                    text="Unfriend"
                    svgPaths={icons.unfriend}
                    onClick={handleUnfriend}
                />
            </ActionMenu>
        </>
    );
}

export default function AllFriendsContent() {
    const { allFriends, loading } = useAllFriends();
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();
    const filtered = allFriends.filter(f => f.username.toLowerCase().startsWith(searchQuery.toLowerCase()));

    return (
        <div className="h-full flex flex-col">
            <div className="p-2 flex gap-2 flex-col flex-1">
                {!loading && allFriends.length >= 1 && (
                    <SearchBar onSearch={(value: string) => setSearchQuery(value)} />
                )}
                {searchQuery && filtered.length === 0 && (
                    <div className='flex-1 flex flex-col justify-center items-center mb-[58px]'>
                        <div className="text-gray-400 text-sm">No results found</div>
                    </div>
                )}
                {!loading && !searchQuery && allFriends.length === 0 && (
                    <div className='flex-1 flex flex-col justify-center items-center'>
                        <div className="text-gray-400 text-sm">No friends yet</div>
                    </div>
                )}
                {filtered.map(friend => (
                    <UserCard
                        key={friend.id}
                        user={friend}
                        onClick={() => navigate(`/chat/${friend.id}`, { state: { user: friend } })}
                    >
                        <FriendOptionsButton user={friend} />
                    </UserCard>
                ))}
            </div>
        </div>
    );
}