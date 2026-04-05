import UserCard from '../../../../ui/UserCard'
import SearchBar from '../../../../ui/SearchBar'
import { usePending } from '../../contexts/usePending';
import { useCurrentUser } from '../../../user/contexts/useCurrentUser';
import { useState } from 'react';
import { type User } from '../../../user/types/user';
import { api } from '../../../../api/client';

function PendingActions({ user, onRemove }: { user: User; onRemove: (id: string) => void }) {
    const { currentUser } = useCurrentUser();
    const [loading, setLoading] = useState(false);

    const handleAccept = async () => {
        if (!user.id || !currentUser?.id) return;
        setLoading(true);
        try {
            const { response } = await api.friends.acceptRequest(user.id, currentUser.id);
            if (!response.ok) throw new Error();
            onRemove(user.id);
        } catch (error) {
            console.error('Error accepting request:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        if (!user.id || !currentUser?.id) return;
        setLoading(true);
        try {
            const { response } = await api.friends.rejectRequest(user.id, currentUser.id);
            if (!response.ok) throw new Error();
            onRemove(user.id);
        } catch (error) {
            console.error('Error rejecting request:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button onClick={handleAccept} disabled={loading}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5 text-gray-500 hover:text-gray-300 transition duration-300">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
            </button>
            <button onClick={handleReject} disabled={loading}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5 text-gray-500 hover:text-gray-300 transition duration-300">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
            </button>
        </>
    );
}

export default function PendingContent() {
    const { pending, setPending, loading } = usePending();
    const [searchQuery, setSearchQuery] = useState('');
    const filtered = pending.filter(f => f.username.toLowerCase().startsWith(searchQuery.toLowerCase()));

    const handleRemove = (userId: string) => {
        setPending(prev => prev.filter(p => p.id !== userId));
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
                {filtered.map(p => (
                    <UserCard key={p.id} user={p}>
                        <PendingActions user={p} onRemove={handleRemove} />
                    </UserCard>
                ))}
            </div>
        </div>
    );
}