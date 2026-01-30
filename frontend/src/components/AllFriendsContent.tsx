import SearchBar from './SearchBar'
import UserCard from './UserCard'
import { useSearch } from '../hooks/useSearch';
import { useAllFriends} from '../contexts/useAllFriends';

export default function AllFriendsContent() {
    const { allFriends, isLoading } = useAllFriends();
    const { searchQuery, setSearchQuery, filtered } = useSearch(allFriends);

    return (
        <div className="h-full flex flex-col">
            <div className="space-y-3 p-6 flex flex-col flex-1">
                {!isLoading && allFriends.length >= 1 && (
                    <SearchBar value={searchQuery} onSearch={setSearchQuery} />
                )}
                {searchQuery && filtered.length === 0 && (
                    <div className='flex-1 flex flex-col justify-center items-center'>
                        <div className="text-gray-400 text-sm">No results found</div>
                    </div>
                )}
                {!isLoading && !searchQuery && allFriends.length === 0 && (
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
                    />
                ))}
            </div>
        </div>
    );
}