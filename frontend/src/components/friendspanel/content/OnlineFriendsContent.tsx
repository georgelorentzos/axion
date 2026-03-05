import SearchBar from '../../common/SearchBar'
import UserCard from '../../common/UserCard'
import { useOnlineFriends } from '../../../contexts/friendspanel/useOnlineFriends';
import { useState } from 'react';

export default function OnlineFriendsContent() {
    const { onlineFriends, loading } = useOnlineFriends();
    const [searchQuery, setSearchQuery] = useState('');
    const filtered = onlineFriends.filter(f => f.username.toLowerCase().startsWith(searchQuery.toLowerCase()));

    return (
        <div className="h-full flex flex-col">
            <div className="p-2 flex gap-2 flex-col flex-1">
                {!loading && onlineFriends.length >= 1 && (
                    <SearchBar onSearch={(value: string) => setSearchQuery(value)} />
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
                        key={friend.id}
                        user={friend}
                        actions={{ options: true, unfriend: true}}
                    />
                ))}
            </div>
        </div>
    );
}