import { useEffect, useState } from "react";
import { type User } from "../types/user";

export function usePending() {
  const [pending, setPending] = useState<User[]>([]);
  const [loading, setIsLoading] = useState(false);
  const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchPending = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${apiUrl}/api/my/pending`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();
        setPending(data.pending || []);
      } catch (err) {
        console.error('Failed to fetch pending:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPending();
  }, [apiUrl, token]);

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
