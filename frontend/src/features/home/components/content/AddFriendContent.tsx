import { useState, useRef, useEffect } from 'react';
import UserCard from '../../../../ui/UserCard';
import SearchBar from '../../../../ui/SearchBar';
import ActionMenu from '../../../../ui/actionmenu/ActionMenu';
import ActionMenuButton from '../../../../ui/actionmenu/ActionMenuButton';
import { useAllFriends } from '../../contexts/useAllFriends';
import { useCurrentUser } from '../../../user/contexts/useCurrentUser';
import { type User } from '../../../user/types/user';
import { api } from '../../../../api/client';
import { useNavigate } from 'react-router-dom';

function AddFriendButton({ userId }: { userId: string }) {
  const { currentUser } = useCurrentUser();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const { response, data } = await api.friends.myRequests();
        if (response.ok) {
          setIsPending(data.pending.some((p: { pending_user_id: string }) => p.pending_user_id === userId));
        }
      } catch (error) {
        console.error('Error fetching pending:', error);
      }
    };
    fetchPending();
  }, [userId]);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'allyRejected' && data.addressee_id === userId) {
          setSent(false);
          setIsPending(false);
        }
      } catch {}
    };
    const ws = window._ws?.ws;
    if (ws) {
      ws.addEventListener('message', handleMessage);
      return () => ws.removeEventListener('message', handleMessage);
    }
  }, [userId]);

  const handleSend = async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    try {
      const { response } = await api.friends.sendRequest(currentUser.id, userId);
      if (!response.ok) throw new Error();
      setSent(true);
      setIsPending(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    try {
      const { response } = await api.friends.cancelRequest(currentUser.id, userId);
      if (response.ok || response.status === 404) {
        setSent(false);
        setIsPending(false);
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isPending || sent) {
    return (
      <button onClick={handleCancel} disabled={loading} title="Cancel friend request">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5 text-gray-500 hover:text-gray-300 transition duration-300">
          <path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
        </svg>
      </button>
    );
  }

  return (
    <button onClick={handleSend} disabled={loading}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5 text-gray-500 hover:text-gray-300 transition duration-300">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
      </svg>
    </button>
  );
}

function FriendOptionsButton({ user }: { user: User }) {
  const { currentUser } = useCurrentUser();
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const handleUnfriend = async () => {
    if (!currentUser?.id || !user.id) return;
    try {
      const { response } = await api.friends.remove(currentUser.id, user.id);
      if (!response.ok) throw new Error();
      setIsOpen(false);
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={(e) => {
          setPos({ x: e.clientX, y: e.clientY });
          setIsOpen(prev => !prev);
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5 text-gray-500 hover:text-gray-300 transition duration-300">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
        </svg>
      </button>
      <ActionMenu isActionMenuOpen={isOpen} onClose={() => setIsOpen(false)} buttonRef={buttonRef} position={pos}>
        <ActionMenuButton
          text="Unfriend"
          svgPaths={["M22 10.5h-6m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766Z"]}
          onClick={handleUnfriend}
        />
      </ActionMenu>
    </>
  );
}

export default function AddFriendContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimer = useRef<number | null>(null);
  const { allFriends } = useAllFriends();
  const navigate = useNavigate();

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      setIsLoading(false);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setIsLoading(true);

    debounceTimer.current = setTimeout(async () => {
      try {
        const { response, data } = await api.users.search(query);
        if (!response.ok) throw new Error('Search failed');
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
          <div className="flex-1 flex flex-col justify-center items-center mb-[58px]">
            <div className="text-gray-400 text-sm">No results found</div>
          </div>
        )}

        {searchResults.map(user => {
          const isFriend = allFriends.some(f => f.id === user.id);
          return (
            <UserCard key={user.id} user={user} onClick={() => navigate(`/chat/${user.id}`, { state: { user: user } })}>
              {isFriend ? (
                <FriendOptionsButton user={user} />
              ) : (
                <AddFriendButton userId={user.id} />
              )}
            </UserCard>
          );
        })}
      </div>
    </div>
  );
}