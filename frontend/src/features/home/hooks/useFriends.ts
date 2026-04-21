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
        const { response, data } = await api.friends.getAll();
        if (!response.ok) throw new Error('Fetch all friends failed');
        
        setFriends(
          (data.friends || []).map((data: any) => ({
            id: data.id,
            username: data.username,
            bio: data.bio,
            image: data.image,
            isOnline: data.isOnline,
            createdAt: data.createdAt,
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
      try {
        const data = JSON.parse(event.data);

        setFriends(previousFriends => {
          return previousFriends.map(friend => {
            if (friend.id === data.id) {
              if (data.type === 'userOnline') {
                return { ...friend, isOnline: true };
              }
              if (data.type === 'userOffline') {
                return { ...friend, isOnline: false };
              }
              if (data.type === 'allyRequestAccepted') {
                return {
                  ...friend,
                  username: data.username,
                  bio: data.bio,
                  image: data.image,
                  isOnline: data.isOnline,
                  createdAt: data.createdAt
                };
              }
            }
            return friend;
          });
        });

        if (data.type === 'allyRequestAccepted') {
          setFriends(previousFriends => {
            if (previousFriends.find(friend => friend.id === data.id)) {
              return previousFriends;
            }
            return [
              {
                id: data.id,
                username: data.username,
                bio: data.bio,
                image: data.image,
                isOnline: data.isOnline,
                createdAt: data.createdAt
              },
              ...previousFriends
            ];
          });
        }

        if (data.type === 'allyRequestDeleted') {
          setFriends(previousFriends => 
            previousFriends.filter(friend => friend.id !== data.id)
          );
        }

      } catch (error) {
        console.error('Parse error:', error);
      }
    };

    const webSocket = window._ws?.ws;
    if (webSocket) {
      webSocket.addEventListener('message', handleMessage);
      return () => webSocket.removeEventListener('message', handleMessage);
    }
  }, []);

  return { friends, setFriends, onlineFriends, isLoading };
}