import { useState, useEffect, useRef } from 'react';
import { type CurrentUser } from '../types/user';
import { api } from '../../../api/client';
import { useParams } from 'react-router-dom';

export function useCurrentUser() {
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
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
                        email: data.email,
                        bio: data.bio,
                        image: data.image,
                        isOnline: true,
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
                const { data } = await api.permissions.getAll(communityId);
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
        if (!currentUser || !communityId) return;
        const handleMessage = async (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            if (data.type === "permissionsUpdated" && data.communityId === communityId) {
                const { data: response } = await api.permissions.getAll(communityId);
                setCurrentUser(prev => {
                    if (!prev) return null;
                    return { ...prev, permissions: response.permissions || [] };
                });
            }
        };
        const ws = window._ws?.ws;
        if (ws) {
            ws.addEventListener("message", handleMessage);
            return () => ws.removeEventListener("message", handleMessage);
        }
    }, [currentUser, communityId]);

    return { currentUser, setCurrentUser };
}