import { useEffect, useState } from "react";
import { type User } from "../../user/types/user";
import { api } from "../../../api/client";

export function useOnlineFriends() {
  const [onlineFriends, setOnlineFriends] = useState<User[]>([]);
  const [loading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOnlineFriends = async () => {
      try {
        const { response, data } = await api.friends.online();
        if (!response.ok) throw new Error('Fetch online friends failed');
        setOnlineFriends(prev => {
          const newFriends = (data.friends || []).map((f: any) => ({
            id: f.id,
            username: f.username,
            image: f.image,
            isOnline: true,
            createdAt: f.createdAt,
          }));
          const combined = [...prev];
          for (const friend of newFriends) {
            if (!combined.find(f => f.id === friend.id)) {
              combined.push(friend);
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
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'userOnline') {
          setOnlineFriends(prev => {
            if (prev.find(p => p.id === data.id)) return prev;
            return [
              {
                id: data.id,
                username: data.username,
                image: data.image,
                isOnline: true,
                createdAt: data.createdAt
              },
              ...prev
            ];
          });
        } else if (data.type === 'userOffline') {
          setOnlineFriends(prev => prev.filter(p => p.id !== data.id));
        } else if (data.type === 'allyAcceptRequest') {
          if (data.isOnline) {
            setOnlineFriends(prev => {
              if (prev.find(p => p.id === data.id)) return prev;
              return [
                {
                  id: data.id,
                  username: data.username,
                  image: data.image,
                  isOnline: true,
                  createdAt: data.createdAt
                },
                ...prev
              ];
            });
          }
        } else if (data.type === 'allyRemoved') {
          setOnlineFriends(prev => prev.filter(p => p.id !== data.id));
        }
      } catch {}
    };
    const ws = window._ws?.ws;
    if (ws) {
      ws.addEventListener('message', handleMessage);
      return () => ws.removeEventListener('message', handleMessage);
    }
  }, []);

  return { onlineFriends, loading };
}
