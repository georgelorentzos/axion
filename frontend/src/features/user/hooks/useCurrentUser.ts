import { useState, useEffect } from 'react';
import { type User } from '../types/user';
import { api } from '../../../api/client';
import { useParams } from 'react-router-dom';

interface UseCurrentUserReturn {
    currentUser: User | null;
}

export function useCurrentUser(): UseCurrentUserReturn {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const { communityId } = useParams();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data } = await api.users.me();

                if (data.success) {
                    setCurrentUser({
                        id: data.id,
                        username: data.username,
                        image: data.image,
                        isOnline: data.isOnline,
                        createdAt: data.createdAt,
                    });
                }
            } catch (error) {
                setCurrentUser(null);
            }
        };

        fetchUser();
    }, []);

    useEffect(() => {
        if (!communityId) return;
        if (!currentUser) return;

        const fetchCommunityPermissions = async () => {
            try {   
                const { data } = await api.communities.getPermissions(communityId);
                setCurrentUser(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        permissions: data.permissions || []
                    };
                });
            } catch (error) {
                setCurrentUser(prev => prev ? { ...prev, permissions: [] } : null);
            }
        };
        fetchCommunityPermissions();
    }, [communityId, currentUser]);

    return { currentUser };
}
