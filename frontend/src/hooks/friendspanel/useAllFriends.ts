import { useEffect, useState } from 'react';
import { type User } from '../../types/user';

export function useAllFriends() {
  const [allFriends, setAllFriends] = useState<User[]>([]);
  const [loading, setIsLoading] = useState(true);
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
        setAllFriends(
          (data.friends || []).map((f: any) => ({
            id: f.id,
            username: f.username,
            image: f.image,
            isOnline: f.isOnline,
            createdAt: f.createdAt,
          }))
        );
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
            if (friend.id === (data.id)) {
              if (data.type === 'userOnline') return { ...friend, isOnline: true };
              if (data.type === 'userOffline') return { ...friend, isOnline: false };
              if (data.type === 'allyAcceptRequest') {
                return {
                  ...friend,
                  username: data.username,
                  image: data.image,
                  isOnline: data.isOnline,
                  createdAt: data.createdAt
                };
              }
            }
            return friend;
          });
        });

        if (data.type === 'allyAcceptRequest') {
          setAllFriends(prev => {
            if (prev.find(f => f.id === data.id)) return prev;
            return [
              {
                id: data.id,
                username: data.username,
                image: data.image,
                isOnline: data.isOnline,
                createdAt: data.createdAt
              },
              ...prev
            ];
          });
        }

        if (data.type === 'allyRemoved') {
          setAllFriends(prev => prev.filter(p => p.id !== data.requesterId));
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

  return { allFriends, loading };
}