import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { type User } from "../../user/types/user";
import { api } from "../../../api/client";

export function useMembers() {
    const [members, setMembers] = useState<User[]>([]);
    const onlineMembers = members.filter(member => member.isOnline);
    const offlineMembers = members.filter(member => !member.isOnline);
    const { communityId } = useParams();

    useEffect(() => {
        if (!communityId) return;
        
        const fetchMembers = async () => {
            try {
                const { data } = await api.members.getAll(communityId);
                setMembers(data.members || []);
            } catch (error) {
                console.log("error fetching members: ", error);
            }
        };
        
        fetchMembers();
    }, [communityId]);

    useEffect(() => {
        if (!communityId) return;
        
        const handleMessage = (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            
            if (data.type === "memberJoined") {
                setMembers(previousMembers => [
                    ...previousMembers,
                    {
                        id: data.id,
                        username: data.username,
                        image: data.image,
                        isOnline: data.isOnline,
                        createdAt: data.createdAt,
                    }
                ]);
            }
            
            if (data.type === "memberLeft") {
                setMembers(previousMembers => 
                    previousMembers.filter(member => member.id !== data.id)
                );
            }
            
            if (data.type === "memberRolesUpdated") {
                setMembers(previousMembers => 
                    previousMembers.map(member => {
                        if (member.id !== data.id) return member;
                        return { ...member, roles: data.roles };
                    })
                );
            }
            
            if (data.type === "roleDeleted") {
                setMembers(previousMembers => 
                    previousMembers.map(member => ({
                        ...member,
                        roles: member.roles?.filter(role => role.id !== data.id)
                    }))
                );
            }
            
            if (data.type === "roleUpdated") {
                setMembers(previousMembers => 
                    previousMembers.map(member => ({
                        ...member,
                        roles: member.roles?.map(role => 
                            role.id === data.id
                                ? { 
                                    ...role, 
                                    name: data.name, 
                                    color: data.color, 
                                    permissions: data.permissions 
                                  }
                                : role
                        )
                    }))
                );
            }
            
            if (data.type === "memberOnline") {
                setMembers(previousMembers => 
                    previousMembers.map(member =>
                        member.id === data.id 
                            ? { ...member, isOnline: true } 
                            : member
                    )
                );
            }
            
            if (data.type === "memberOffline") {
                setMembers(previousMembers => 
                    previousMembers.map(member =>
                        member.id === data.id 
                            ? { ...member, isOnline: false } 
                            : member
                    )
                );
            }
        };

        const webSocket = window._ws?.ws;
        if (webSocket) {
            webSocket.addEventListener("message", handleMessage);
            return () => webSocket.removeEventListener("message", handleMessage);
        }
    }, [communityId]);

    return { members, setMembers, onlineMembers, offlineMembers };
}