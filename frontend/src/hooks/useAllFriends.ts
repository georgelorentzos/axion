import { useEffect, useState } from 'react';

interface User {
  user_id: string;
  username: string;
  profile_image: string;
  is_online: boolean;
}

export function useAllFriends() {
  const [allFriends, setAllFriends] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;

  useEffect(() => {
    const fetchAllFriends = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await fetch(`${apiUrl}/api/my/friends/all`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Fetch all friends failed');
        const data = await response.json();
        setAllFriends(data.friends || []);
      } catch (error) {
        console.error('Fetch all friends error:', error);
        setAllFriends([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllFriends();
  }, [apiUrl]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        setAllFriends(prev => {
          return prev.map(friend => {
            if (friend.user_id === (data.requester_id || data.user_id)) {
              if (data.type === 'user_online') return { ...friend, is_online: true };
              if (data.type === 'user_offline') return { ...friend, is_online: false };
              if (data.type === 'ally_accept_request') {
                return {
                  ...friend,
                  username: data.requester_username,
                  profile_image: data.requester_profile_image,
                  is_online: data.is_online
                };
              }
            }
            return friend;
          });
        });

        if (data.type === 'ally_accept_request') {
          setAllFriends(prev => {
            if (prev.find(f => f.user_id === data.requester_id)) return prev;
            return [
              {
                user_id: data.requester_id,
                username: data.requester_username,
                profile_image: data.requester_profile_image,
                is_online: data.is_online
              },
              ...prev
            ];
          });
        }

        if (data.type === 'ally_removed') {
          setAllFriends(prev => prev.filter(p => p.user_id !== data.requester_id));
        } 

      } catch (error) {
        console.error('Parse error:', error);
      }
    };

    const ws = window._ws?.ws;
    if (ws) {
      ws.addEventListener('message', handleMessage);
      return () => ws.removeEventListener('message', handleMessage);
    }
  }, []);

  return { allFriends, isLoading };
}
