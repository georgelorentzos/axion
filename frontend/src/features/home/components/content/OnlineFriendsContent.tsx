import SearchBar from '../../../../ui/SearchBar'
import UserCard from '../../../../ui/UserCard'
import ActionMenu from '../../../../ui/actionmenu/ActionMenu';
import ActionMenuButton from '../../../../ui/actionmenu/ActionMenuButton';
import { useOnlineFriends } from '../../contexts/useOnlineFriends';
import { useCurrentUser } from '../../../user/contexts/useCurrentUser';
import { useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import { type User } from '../../../user/types/user';
import { api } from '../../../../api/client';

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
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5 text-gray-500 hover:text-gray-300 transition duration-300">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                </svg>
            </button>
            <ActionMenu isActionMenuOpen={isOpen} onClose={() => setIsOpen(false)} buttonRef={buttonRef} position={pos}>
                <ActionMenuButton
                    text="Unfriend"
                    svgPaths={["M22 10.5h-6m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766Z"]}
                    onClick={handleUnfriend}
                />
            </ActionMenu>
        </>
    );
}

export default function OnlineFriendsContent() {
    const { onlineFriends, loading } = useOnlineFriends();
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();
    const filtered = onlineFriends.filter(f => f.username.toLowerCase().startsWith(searchQuery.toLowerCase()));

    return (
        <div className="h-full flex flex-col">
            <div className="p-2 flex gap-2 flex-col flex-1">
                {!loading && onlineFriends.length >= 1 && (
                    <SearchBar onSearch={(value: string) => setSearchQuery(value)} />
                )}
                {searchQuery && filtered.length === 0 && (
                    <div className='flex-1 flex flex-col justify-center items-center mb-[58px]'>
                        <div className="text-gray-400 text-sm">No results found</div>
                    </div>
                )}
                {!loading && !searchQuery && onlineFriends.length === 0 && (
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
                        <FriendOptionsButton user={friend} />
                    </UserCard>
                ))}
            </div>
        </div>
    );
}