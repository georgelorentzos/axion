import UserCard from '../../../../ui/card/UserCard';
import SearchBar from '../../../../ui/SearchBar'
import { usePending } from '../../contexts/usePending';
import { useCurrentUser } from '../../../user/contexts/useCurrentUser';
import { useState } from 'react';
import { type User } from '../../../user/types/user';
import { api } from '../../../../api/client';
import { icons } from '../../../../constants/Icons';
import Icon from '../../../../ui/Icon';
import { useNavigate } from 'react-router-dom';

export default function Pending() {
    const { pending, setPending, loading } = usePending();
    const { currentUser } = useCurrentUser();
    const [searchQuery, setSearchQuery] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const navigate = useNavigate();

    const filtered = pending.filter(f => f.username.toLowerCase().startsWith(searchQuery.toLowerCase()));

    const handleAccept = async (user: User) => {
        if (!user.id || !currentUser?.id) return;
        setActionLoading(user.id);
        try {
            const { response } = await api.pending.accept(user.id);
            if (response.ok) {
                setPending(prev => prev.filter(p => p.id !== user.id));
            }
        } catch (error) {
            console.error('Error accepting request:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (user: User) => {
        if (!user.id || !currentUser?.id) return;
        setActionLoading(user.id);
        try {
            const { response } = await api.pending.reject(user.id);
            if (response.ok) {
                setPending(prev => prev.filter(p => p.id !== user.id));
            }
        } catch (error) {
            console.error('Error rejecting request:', error);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="p-2 flex gap-2 flex-col flex-1">
                {!loading && pending.length >= 1 && (
                    <SearchBar onSearch={(value: string) => setSearchQuery(value)} />
                )}
                
                {searchQuery && filtered.length === 0 && (
                    <div className='flex-1 flex flex-col justify-center items-center mb-[58px]'>
                        <div className="text-gray-400 text-sm">No results found</div>
                    </div>
                )}
                
                {!loading && !searchQuery && pending.length === 0 && (
                    <div className='flex-1 flex flex-col justify-center items-center'>
                        <div className="text-gray-400 text-sm">No pending found</div>
                    </div>
                )}

                {filtered.map(user => (
                    <UserCard 
                        key={user.id} 
                        user={user}
                        onClick={() => navigate(`/chat/${user.id}`, { state: { user } })}
                    >
                        <div className="flex gap-2">
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleAccept(user); }} 
                                disabled={actionLoading === user.id}
                                className="disabled:opacity-50"
                            >
                                <Icon svgPaths={icons.accept} className="size-5 text-emerald hover:text-forestgreen transition duration-300" />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleReject(user); }} 
                                disabled={actionLoading === user.id}
                                className="disabled:opacity-50"
                            >
                                <Icon svgPaths={icons.x} className="size-5 text-gray-500 hover:text-gray-300 transition duration-300" />
                            </button>
                        </div>
                    </UserCard>
                ))}
            </div>
        </div>
    );
}