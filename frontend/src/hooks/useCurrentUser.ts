import { useState, useEffect } from 'react';
import { type User } from '../types/user';

interface UseCurrentUserReturn {
    currentUser: User | null;
}

export function useCurrentUser(): UseCurrentUserReturn {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('token');
            
            if (!token) {
                return;
            }

            try {
                const response = await fetch(`${apiUrl}/api/me`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });

                const data = await response.json();
                
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