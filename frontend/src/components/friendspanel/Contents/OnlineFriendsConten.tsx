import SearchBar from '../../common/SearchBar'
import UserCard from '../../common/UserCard'
import { useSearch } from '../../../hooks/useSearch';
import { useOnlineFriends } from '../../../contexts/useOnlineFriends';

export default function OnlineFriendsContent() {
    const { onlineFriends, loading } = useOnlineFriends();
    const { searchQuery, setSearchQuery, filtered } = useSearch(onlineFriends);

    return (
        <div className="h-full flex flex-col">
            <div className="p-2 flex gap-2 flex-col flex-1">
                {!loading && onlineFriends.length >= 1 && (
                    <SearchBar value={searchQuery} onSearch={setSearchQuery} />
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
                        key={friend.user_id}
                        id={friend.user_id}
                        username={friend.username}
                        image={friend.profile_image}
                        actions={{ options: true, unfriend: true}}
                        isOnline={true}
                        createdAt={friend.created_at}
                    />
                ))}
            </div>
        </div>
    );
}