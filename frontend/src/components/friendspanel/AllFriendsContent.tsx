import SearchBar from '../common/SearchBar'
import UserCard from '../common/UserCard'
import { useSearch } from '../../hooks/useSearch';
import { useAllFriends} from '../../contexts/useAllFriends';

export default function AllFriendsContent() {
    const { allFriends, loading } = useAllFriends();
    const { searchQuery, setSearchQuery, filtered } = useSearch(allFriends);

    return (
        <div className="h-full flex flex-col">
            <div className="p-2 flex gap-2 flex-col flex-1">
                {!loading && allFriends.length >= 1 && (
                    <SearchBar value={searchQuery} onSearch={setSearchQuery} />
                )}
                {searchQuery && filtered.length === 0 && (
                    <div className='flex-1 flex flex-col justify-center items-center'>
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
                        key={friend.user_id}
                        id={friend.user_id}
                        username={friend.username}
                        image={friend.profile_image}
                        optionsBtn
                        isOnline={friend.is_online}
                        createdAt={friend.created_at}
                    />
                ))}
            </div>
        </div>
    );
}