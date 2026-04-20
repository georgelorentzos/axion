import { useState, useRef, useEffect } from 'react';
import UserCard from '../../../../ui/card/UserCard';
import SearchBar from '../../../../ui/SearchBar';
import ActionMenu from '../../../../ui/action-menu/ActionMenu';
import ActionMenuButton from '../../../../ui/action-menu/ActionMenuButton';
import { useFriends } from '../../hooks/useFriends';
import { type User } from '../../../user/types/user';
import { api } from '../../../../api/client';
import { useNavigate } from 'react-router-dom';
import { icons } from '../../../../constants/Icons';
import Icon from '../../../../ui/Icon';

export default function AddFriend() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [pendingIds, setPendingIds] = useState<string[]>([]);
    
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    
    const debounceTimer = useRef<number | null>(null);
    const { friends, setFriends } = useFriends();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPending = async () => {
            try {
                const { response, data } = await api.pending.getAll();
                if (response.ok) {
                    setPendingIds(data.pending.map((p: any) => p.pending_user_id || p.id));
                }
            } catch (error) {
                console.error('Error fetching pending:', error);
            }
        };
        fetchPending();
    }, []);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setSearchResults([]);
            setIsLoading(false);
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
            return;
        }

        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        setIsLoading(true);

        debounceTimer.current = window.setTimeout(async () => {
            try {
                const { response, data } = await api.users.search(query);
                if (response.ok) setSearchResults(data.users || []);
            } catch (error) {
                setSearchResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 300);
    };

    const handleAddFriend = async (userId: string) => {
        setActionLoading(userId);
        try {
            const { response } = await api.friends.add(userId);
            if (response.ok) setPendingIds(prev => [...prev, userId]);
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancelRequest = async (userId: string) => {
        setActionLoading(userId);
        try {
            const { response } = await api.friends.remove(userId);
            if (response.ok || response.status === 404) {
                setPendingIds(prev => prev.filter(id => id !== userId));
            }
        } finally {
            setActionLoading(null);
        }
    };

    const handleUnfriend = async () => {
        if (!selectedUser?.id) return;
        try {
            const { response } = await api.friends.remove(selectedUser.id);
            if (response.ok) {
                setFriends(prev => prev.filter(f => f.id !== selectedUser.id));
                setIsMenuOpen(false);
            }
        } catch (error) {
            console.error('Error removing friend:', error);
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="p-2 flex gap-2 flex-col flex-1">
                <SearchBar onSearch={handleSearch} />

                {!isLoading && searchQuery && searchResults.length === 0 && (
                    <div className="flex-1 flex flex-col justify-center items-center mb-[58px]">
                        <div className="text-gray-400 text-sm">No results found</div>
                    </div>
                )}

                {searchResults.map(user => {
                    const isFriend = friends.some(f => f.id === user.id);
                    const isPending = pendingIds.includes(user.id);
                    const isLoadingUser = actionLoading === user.id;

                    return (
                        <UserCard 
                            key={user.id} 
                            user={user} 
                            onClick={() => navigate(`/chat/${user.id}`, { state: { user } })}
                        >
                            <div className="flex items-center">
                                {isFriend ? (
                                    <button
                                        ref={selectedUser?.id === user.id ? buttonRef : null}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPos({ x: e.clientX, y: e.clientY });
                                            setSelectedUser(user);
                                            setIsMenuOpen(true);
                                        }}
                                    >
                                        <Icon svgPaths={icons.verticalDots} className="size-5 text-gray-500 hover:text-gray-300 transition duration-300" />
                                    </button>
                                ) : isPending ? (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleCancelRequest(user.id); }} 
                                        disabled={isLoadingUser}
                                        title="Cancel request"
                                    >
                                        <Icon svgPaths={icons.unfriend} className="size-5 text-gray-500 hover:text-gray-300 transition duration-300" />
                                    </button>
                                ) : (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleAddFriend(user.id); }} 
                                        disabled={isLoadingUser}
                                    >
                                        <Icon svgPaths={icons.addFriend} className="size-5 text-gray-500 hover:text-gray-300 transition duration-300" />
                                    </button>
                                )}
                            </div>
                        </UserCard>
                    );
                })}
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