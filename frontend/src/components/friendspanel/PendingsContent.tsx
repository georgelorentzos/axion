import UserCard from '../common/UserCard'
import SearchBar from '../common/SearchBar'
import { useSearch } from '../../hooks/useSearch';
import { usePendings } from '../../contexts/usePendings';

export default function PendingsContent() {
    const { pendings, setPendings, loading } = usePendings();
    const { searchQuery, setSearchQuery, filtered } = useSearch(pendings);

    const handleUserCardDeletion = (userId: string) => {
        setPendings(prev => prev.filter(p => p.user_id !== userId));
    };

    return (
        <div className="h-full flex flex-col">
            <div className="space-y-3 p-6 flex flex-col flex-1">
                {!loading && pendings.length >= 1 && (
                    <SearchBar value={searchQuery} onSearch={setSearchQuery} />
                )}
                {searchQuery && filtered.length === 0 && (
                    <div className='flex-1 flex flex-col justify-center items-center'>
                        <div className="text-gray-400 text-sm">No results found</div>
                    </div>
                )}
                {!loading && !searchQuery && pendings.length === 0 && (
                    <div className='flex-1 flex flex-col justify-center items-center'>
                        <div className="text-gray-400 text-sm">No pendings found</div>
                    </div>
                )}
                {filtered.map(pending => (
                    <UserCard 
                      key={pending.user_id} 
                      id={pending.user_id}
                      username={pending.username}
                      image={pending.profile_image}
                      isOnline={pending.is_online}
                      declinePendingBtn
                      acceptPendingBtn
                      onDecline={handleUserCardDeletion}
                      onAccept={handleUserCardDeletion}
                      createdAt={pending.created_at}
                    />
                ))}
            </div>
        </div>
    );
}