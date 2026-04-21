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
        const { data } = await api.pending.getAll();
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
          prev.map(pending => {
            if (pending.id === (data.id)) {
              if (data.type === 'pendingOnline') return { ...pending, isOnline: true };
              if (data.type === 'pendingOffline') return { ...pending, isOnline: false };
            }
            return pending;
          })
        );

        if (data.type === 'allyRequestSent') {
          setPending(prev => {
            if (prev.find(p => p.id === data.id)) return prev;
            return [
              {
                id: data.id,
                username: data.username,
                bio: data.bio,
                image: data.image,
                isOnline: data.isOnline,
                createdAt: data.createdAt
              },
              ...prev
            ];
          });
        } else if (data.type === 'allyRequestDeleted') {
          setPending(prev => prev.filter(pending => pending.id !== data.id));
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
