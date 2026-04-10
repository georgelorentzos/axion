import { useState, useRef, useEffect } from 'react';
import UserCard from '../../../../ui/UserCard';
import SearchBar from '../../../../ui/SearchBar';
import ActionMenu from '../../../../ui/action-menu/ActionMenu';
import ActionMenuButton from '../../../../ui/action-menu/ActionMenuButton';
import { useAllFriends } from '../../contexts/useAllFriends';
import { useCurrentUser } from '../../../user/contexts/useCurrentUser';
import { type User } from '../../../user/types/user';
import { api } from '../../../../api/client';
import { useNavigate } from 'react-router-dom';
import { icons } from '../../../../constants/Icons';
import Icon from '../../../../ui/Icon';

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
        <Icon svgPaths={icons.unfriend} className="size-5 text-gray-500 hover:text-gray-300 transition duration-300" />
      </button>
    );
  }

  return (
    <button onClick={handleSend} disabled={loading}>
      <Icon svgPaths={icons.addFriend} className="size-5 text-gray-500 hover:text-gray-300 transition duration-300" />
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
       <Icon svgPaths={icons.verticalDots} className="size-5 text-gray-500 hover:text-gray-300 transition duration-300" />
      </button>
      <ActionMenu isOpen={isOpen} onClose={() => setIsOpen(false)} buttonRef={buttonRef} position={pos}>
        <ActionMenuButton
          text="Unfriend"
          svgPaths={icons.unfriend}
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