import { useState, useEffect } from 'react';
import { type User } from '../types/user';
import { api } from '../../../api/client';

interface UseCurrentUserReturn {
    currentUser: User | null;
}

export function useCurrentUser(): UseCurrentUserReturn {
    const [currentUser, setCurrentUser] = useState<User | null>(null);

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

    return { currentUser };
}
