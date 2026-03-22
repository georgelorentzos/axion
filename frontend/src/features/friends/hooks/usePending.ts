import { useEffect, useState } from "react";
import { type User } from "../../user/types/user";
import { api } from "../../../api/client";

export function usePending() {
  const [pending, setPending] = useState<User[]>([]);
  const [loading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPending = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.friends.pending();
        setPending(data.pending || []);
      } catch (err) {
        console.error('Failed to fetch pending:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPending();
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        setPending(prev =>
          prev.map(p => {
            if (p.id === (data.id)) {
              if (data.type === 'pendingOnline') return { ...p, isOnline: true };
              if (data.type === 'pendingOffline') return { ...p, isOnline: false };
            }
            return p;
          })
        );

        if (data.type === 'allyRequest') {
          setPending(prev => {
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
        } else if (data.type === 'allyCancelRequest') {
          setPending(prev => prev.filter(p => p.id !== data.id));
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

  return {
    pending,
    setPending,
    loading
  };
}
