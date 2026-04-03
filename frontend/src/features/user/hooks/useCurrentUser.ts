import { useState, useEffect, useRef } from 'react';
import { type User } from '../types/user';
import { api } from '../../../api/client';
import { useParams } from 'react-router-dom';

interface UseCurrentUserReturn {
    currentUser: User | null;
}

export function useCurrentUser(): UseCurrentUserReturn {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const { communityId } = useParams();
    const fetchedPermissionsFor = useRef<string | null>(null);

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
        if (!communityId || !currentUser) return;
        if (fetchedPermissionsFor.current === communityId) return;

        fetchedPermissionsFor.current = communityId;

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
                console.log("Permissions: ", data.permissions);
            } catch (error) {
                setCurrentUser(prev => prev ? { ...prev, permissions: [] } : null);
            }
        };
        fetchCommunityPermissions();
    }, [communityId, currentUser]);

    useEffect(() => {
        if (!currentUser) return;
        const handleMessage = async (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            if (data.type === "permissionsUpdated" && data.communityId === communityId) {
                setCurrentUser(prev => {
                    if (!prev) return null;
                    return { ...prev, permissions: data.permissions };
                });
            }
        };
        const ws = window._ws?.ws;
        if (ws) {
            ws.addEventListener("message", handleMessage);
            return () => ws.removeEventListener("message", handleMessage);
        }
    }, [currentUser, communityId]);

    return { currentUser };
}