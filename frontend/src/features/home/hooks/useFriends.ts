import { useEffect, useState } from 'react';
import { type User } from '../../user/types/user';
import { api } from '../../../api/client';

export function useFriends() {
  const [friends, setFriends] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const onlineFriends = friends.filter(friend => friend.isOnline);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const { data } = await api.friends.getAll();

        setFriends(
          (data.friends || []).map((friend: any) => ({
            id: friend.id,
            username: friend.username,
            bio: friend.bio,
            image: friend.image,
            isOnline: friend.isOnline,
            createdAt: friend.createdAt,
          }))
        );
      } catch (error) {
        console.error('Fetch all friends error:', error);
        setFriends([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFriends();
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);

      if (data.type === 'userOnline') {
        setFriends(prevFriends =>
          prevFriends.map(friend =>
            friend.id === data.id
              ? { ...friend, isOnline: true }
              : friend
          )
        );
      }

      if (data.type === 'userOffline') {
        setFriends(prevFriends =>
          prevFriends.map(friend =>
            friend.id === data.id
              ? { ...friend, isOnline: false }
              : friend
          )
        );
      }

      if (data.type === 'userProfileUpdated') {
        setFriends(prevFriends =>
          prevFriends.map(friend =>
            friend.id === data.id
              ? {
                  ...friend,
                  username: data.username,
                  bio: data.bio,
                  image: data.image,
                }
              : friend
          )
        );
      }

      if (data.type === 'allyRequestAccepted') {
        setFriends(prevFriends => [
          ...prevFriends,
          {
            id: data.id,
            username: data.username,
            bio: data.bio,
            image: data.image,
            isOnline: data.isOnline,
            createdAt: data.createdAt,
          },
        ]);
      }

      if (data.type === 'allyRequestDeleted') {
        setFriends(prevFriends =>
          prevFriends.filter(friend => friend.id !== data.id)
        );
      }
    };

    const webSocket = window._ws?.ws;

    if (webSocket) {
      webSocket.addEventListener('message', handleMessage);
      return () =>
        webSocket.removeEventListener('message', handleMessage);
    }
  }, []);

  return { friends, setFriends, onlineFriends, isLoading };
}