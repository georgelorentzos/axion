import { useState, useRef } from 'react';
import UserCard from '../../../../ui/UserCard';
import SearchBar from '../../../../ui/SearchBar';
import { useAllFriends } from '../../contexts/useAllFriends';
import { type User } from '../../../user/types/user';
import { api } from '../../../../api/client';

export default function AddFriendContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimer = useRef<number | null>(null);
  const { allFriends } = useAllFriends();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setIsLoading(false);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      return;
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    setIsLoading(true);

    debounceTimer.current = setTimeout(async () => {
      try {
        const { response, data } = await api.users.search(query);

        if (!response.ok) {
          throw new Error('Search failed');
        }

        setSearchResults(data.users || []);
        
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };


  return (
    <div className="h-full flex flex-col">
      
      <div className="p-2 flex gap-2 flex-col flex-1">
        <SearchBar onSearch={handleSearch} />

        {!isLoading && searchQuery && searchResults.length === 0 && (
          <div className='flex-1 flex flex-col justify-center items-center mb-[58px]'>
            <div className="text-gray-400 text-sm">No results found</div>
          </div>
        )}

        {searchResults.map(user => (
          <UserCard
            key={user.id}
            user={user}
            actions={{ options: allFriends.some(f => f.id === user.id), addFriend: !allFriends.some(f => f.id === user.id), unfriend: true }}
          />
        ))}
      </div>
    </div>
  );
}