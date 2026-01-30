import { useEffect, useState } from "react";

interface User {
  user_id: string;
  username: string;
  profile_image: string;
  is_online?: boolean;
}

export function useOnlineFriends() {
  const [onlineFriends, setOnlineFriends] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;

  useEffect(() => {
    const fetchOnlineFriends = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await fetch(`${apiUrl}/api/my/friends/online`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Fetch online friends failed');

        const data = await response.json();
        setOnlineFriends(prev => {
          const newFriends = data.friends || [];
          const combined = [...prev];
          for (const friend of newFriends) {
            if (!combined.find(f => f.user_id === friend.user_id)) {
              combined.push({ ...friend, is_online: true });
            }
          }
          return combined;
        });
      } catch {
        setOnlineFriends(prev => [...prev]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOnlineFriends();
  }, [apiUrl]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'user_online') {
          setOnlineFriends(prev => {
            if (prev.find(p => p.user_id === data.user_id)) return prev;
            return [
              {
                user_id: data.user_id,
                username: data.username,
                profile_image: data.profile_image,
                is_online: true
              },
              ...prev
            ];
          });
        } else if (data.type === 'user_offline') {
          setOnlineFriends(prev => prev.filter(p => p.user_id !== data.user_id));
        } else if (data.type === 'ally_accept_request') {
          if (data.is_online) {
            setOnlineFriends(prev => {
            if (prev.find(p => p.user_id === data.user_id)) return prev;
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
        } else if (data.type === 'ally_remove_request') {
          setOnlineFriends(prev => prev.filter(p => p.user_id !== data.requester_id));
        } 
      } catch {}
    };

    const ws = window._ws?.ws;
    if (ws) {
      ws.addEventListener('message', handleMessage);
      return () => ws.removeEventListener('message', handleMessage);
    }
  }, []);

  return { onlineFriends, isLoading };
}
