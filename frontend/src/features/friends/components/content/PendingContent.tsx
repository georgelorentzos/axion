import UserCard from '../../../../ui/UserCard'
import SearchBar from '../../../../ui/SearchBar'
import { usePending } from '../../contexts/usePending';
import { useState } from 'react';

export default function PendingContent() {
    const { pending, setPending, loading } = usePending();
    const [searchQuery, setSearchQuery] = useState('');
    const filtered = pending.filter(f => f.username.toLowerCase().startsWith(searchQuery.toLowerCase()));

    const handleUserCardDeletion = (userId: string) => {
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
                {filtered.map(pending => (
                    <UserCard 
                      key={pending.id} 
                      user={pending}
                      actions={{ acceptPending: true, rejectPending: true}}
                      onReject={handleUserCardDeletion}
                      onAccept={handleUserCardDeletion}
                    />
                ))}
            </div>
        </div>
    );
}