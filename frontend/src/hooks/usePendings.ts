import { useEffect, useState } from "react";

interface Pending {
  user_id: string;
  username: string;
  profile_image: string;
  is_online: boolean;
  created_at: string;
}

export function usePendings() {
  const [pendings, setPendings] = useState<Pending[]>([]);
  const [loading, setIsLoading] = useState(false);
  const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchPendings = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${apiUrl}/api/my/pendings`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();
        setPendings(data.pendings || []);
      } catch (err) {
        console.error('Failed to fetch pendings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendings();
  }, [apiUrl, token]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        setPendings(prev =>
          prev.map(p => {
            if (p.user_id === (data.user_id || data.requester_id)) {
              if (data.type === 'pending_online') return { ...p, is_online: true };
              if (data.type === 'pending_offline') return { ...p, is_online: false };
            }
            return p;
          })
        );

        if (data.type === 'ally_request') {
          setPendings(prev => {
            if (prev.find(p => p.user_id === data.requester_id)) return prev;
            return [
              {
                user_id: data.requester_id,
                username: data.requester_username,
                profile_image: data.requester_profile_image,
                is_online: true,
                created_at: data.created_at
              },
              ...prev
            ];
          });
        } else if (data.type === 'ally_cancel_request') {
          setPendings(prev => prev.filter(p => p.user_id !== data.requester_id));
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
    pendings,
    setPendings,
    loading
  };
}
