import SearchBar from '../../common/SearchBar'
import UserCard from '../../common/UserCard'
import { useAllFriends } from '../../../contexts/useAllFriends';
import { useState } from 'react';

export default function AllFriendsContent() {
    const { allFriends, loading } = useAllFriends();
    const [searchQuery, setSearchQuery] = useState('');
    const filtered = allFriends.filter(f => f.username.toLowerCase().startsWith(searchQuery.toLowerCase()));

    return (
        <div className="h-full flex flex-col">
            <div className="p-2 flex gap-2 flex-col flex-1">
                {!loading && allFriends.length >= 1 && (
                    <SearchBar onSearch={(value: string) => setSearchQuery(value)} />
                )}
                {searchQuery && filtered.length === 0 && (
                    <div className='flex-1 flex flex-col justify-center items-center mb-[58px]'>
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
                        key={friend.id}
                        user={friend}
                        actions={{ options: true, unfriend: true}}
                    />
                ))}
            </div>
        </div>
    );
}