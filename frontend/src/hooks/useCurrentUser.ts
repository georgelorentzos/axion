import { useState, useEffect } from 'react';

interface User {
    user_id: string;
    username: string;
    email: string;
    profile_image: string;
}

interface UseCurrentUserReturn {
    currentUser: User | null;
    loading: boolean;
}

export function useCurrentUser(): UseCurrentUserReturn {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('token');
            
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${apiUrl}/api/me`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });

                const data = await response.json();
                
                if (data.success) {
                    setCurrentUser({
                        user_id: data.user_id,
                        username: data.username,
                        email: data.email,
                        profile_image: data.profile_image
                    });
                }
            } catch (error) {
                setCurrentUser(null);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    return { currentUser, loading };
}