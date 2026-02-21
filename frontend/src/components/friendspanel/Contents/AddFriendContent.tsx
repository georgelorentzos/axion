import { useState, useRef } from 'react';
import UserCard from '../../common/UserCard';
import SearchBar from '../../common/SearchBar';
import { useAllFriends } from '../../../contexts/useAllFriends';

interface User {
  user_id: string;
  username: string;
  profile_image: string;
  is_online: boolean;
  created_at?: string;
}

export default function AddFriendContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimer = useRef<number | null>(null);
  const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;
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
        const token = localStorage.getItem('token');
        const response = await fetch(`${apiUrl}/api/users/search?search=${encodeURIComponent(query)}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Search failed');
        }
        
        const data = await response.json();
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
            key={user.user_id}
            id={user.user_id}
            username={user.username}
            image={user.profile_image}
            actions={{ options: allFriends.some(f => f.user_id === user.user_id), addFriend: !allFriends.some(f => f.user_id === user.user_id), unfriend: true }}
            isOnline={user.is_online}
            createdAt={user.created_at}
          />
        ))}
      </div>
    </div>
  );
}