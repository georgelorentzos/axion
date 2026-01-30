import { useState, useEffect } from 'react';

interface User {
    user_id: string;
    username: string;
    email: string;
    profile_image: string;
}

interface UseCurrentUserReturn {
    user: User | null;
    loading: boolean;
    error: string | null;
}

export function useCurrentUser(): UseCurrentUserReturn {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
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

                if (!response.ok) {
                    throw new Error('Failed to fetch user');
                }

                const data = await response.json();
                
                if (data.success) {
                    setUser({
                        user_id: data.user_id,
                        username: data.username,
                        email: data.email,
                        profile_image: data.profile_image
                    });
                }
            } catch (error) {
                setError(error instanceof Error ? error.message : 'Unknown error');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    return { user, loading, error };
}