import UserCard from '../../common/UserCard'
import SearchBar from '../../common/SearchBar'
import { useSearch } from '../../../hooks/useSearch';
import { usePending } from '../../../contexts/usePending';

export default function PendingContent() {
    const { pending, setPending, loading } = usePending();
    const { searchQuery, setSearchQuery, filtered } = useSearch(pending);

    const handleUserCardDeletion = (userId: string) => {
        setPending(prev => prev.filter(p => p.user_id !== userId));
    };

    return (
        <div className="h-full flex flex-col">
            <div className="p-2 flex gap-2 flex-col flex-1">
                {!loading && pending.length >= 1 && (
                    <SearchBar value={searchQuery} onSearch={setSearchQuery} />
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
                      key={pending.user_id} 
                      id={pending.user_id}
                      username={pending.username}
                      image={pending.profile_image}
                      isOnline={pending.is_online}
                      actions={{ acceptPending: true, rejectPending: true}}
                      onReject={handleUserCardDeletion}
                      onAccept={handleUserCardDeletion}
                      createdAt={pending.created_at}
                    />
                ))}
            </div>
        </div>
    );
}