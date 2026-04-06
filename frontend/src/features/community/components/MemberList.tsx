import { useMembers } from "../contexts/useMembers";
import UserCard from "../../../ui/UserCard";
import MemberPreview from "./memberpreview/MemberPreview";
import React, { useState, useEffect, useRef } from "react";
import ActionMenu from "../../../ui/actionmenu/ActionMenu";
import ActionMenuButton from "../../../ui/actionmenu/ActionMenuButton";
import { useCurrentUser } from "../../user/contexts/useCurrentUser";
import { useNavigate } from "react-router-dom";
import { useAllFriends } from "../../home/contexts/useAllFriends";
import { api } from "../../../api/client";
import { useCommunity } from "../contexts/useCommunity";
import Modal from "../../../ui/modal/Modal";
import MemberAction from "../../../ui/modal/content/MemberAction";
import { useRoles } from "../contexts/useRoles";
import type { User } from "../../user/types/user";
import { PERMISSIONS } from "../../../constants/permissions";

export default function MemberList() {
    const { onlineMembers, offlineMembers } = useMembers();
    const { roles } = useRoles();
    const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
    const [actionMenuMemberId, setActionMenuMemberId] = useState<string | null>(null);
    const memberRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const { currentUser } = useCurrentUser();
    const navigate = useNavigate();
    const { allFriends, setAllFriends } = useAllFriends();
    const { community } = useCommunity();
    const [actionUser, setActionUser] = useState<User | null>(null);
    const [isKickModalOpen, setIsKickModalOpen] = useState(false);
    const [isBanModalOpen, setIsBanModalOpen] = useState(false);

    const isOwner = currentUser?.id === community?.ownerId;
    const isAdmin = currentUser?.permissions?.includes(PERMISSIONS.ADMINISTRATOR);
    const canKick = isOwner || isAdmin || currentUser?.permissions?.includes(PERMISSIONS.KICK);
    const canBan = isOwner || isAdmin || currentUser?.permissions?.includes(PERMISSIONS.BAN);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            let clickedInsideAny = false;
            memberRefs.current.forEach((el) => {
                if (el.contains(e.target as Node)) {
                    clickedInsideAny = true;
                }
            });
            if (!clickedInsideAny) {
                setActiveMemberId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setActiveMemberId(null);
            }
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, []);

    const isMemberTargetable = (member: User) => {
        return member.id !== currentUser?.id && member.id !== community?.ownerId;
    };

    const renderUserCardActionContent = (member: User) => {
        const isFriend = allFriends.some(friend => friend.id === member.id);
        const isTargetable = isMemberTargetable(member);

        return (
            <>
                <UserCard
                    user={member}
                    onClick={() => {
                        setActiveMemberId(prev =>
                            prev === member.id ? null : member.id
                        );
                    }}
                    onContextMenu={(e: React.MouseEvent) => {
                        e.preventDefault();
                        setActionMenuMemberId(member.id);
                        setPos({ x: e.clientX, y: e.clientY });
                    }}
                />
                <MemberPreview
                    member={member}
                    isOpen={activeMemberId === member.id}
                />
                <ActionMenu
                    isActionMenuOpen={actionMenuMemberId === member.id && member.id !== currentUser?.id}
                    onClose={() => setActionMenuMemberId(null)}
                    position={pos}
                >
                    <ActionMenuButton
                        onClick={() => navigate(`/chat/${member.id}`)}
                        text="Message"
                        svgPaths={["M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"]}
                    />
                    {!isFriend ? (
                        <ActionMenuButton
                            onClick={() => {
                                if (!currentUser?.id) return;
                                api.friends.sendRequest(currentUser.id, member.id);
                                setActionMenuMemberId(null);
                            }}
                            text="Add Friend"
                            svgPaths={["M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"]}
                        />
                    ) : (
                        <ActionMenuButton
                            onClick={() => {
                                if (!currentUser?.id) return;
                                api.friends.remove(currentUser.id, member.id);
                                setAllFriends(friends => friends.filter(friend => friend.id !== member.id));
                                setActionMenuMemberId(null);
                            }}
                            text="Unfriend"
                            svgPaths={["M22 10.5h-6m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766Z"]}
                        />
                    )}
                    <ActionMenuButton
                        onClick={() => {
                            setActionUser(member);
                            setIsKickModalOpen(true);
                            setActionMenuMemberId(null);
                        }}
                        text={`Kick ${member.username}`}
                        isDanger
                        isVisible={isTargetable && canKick}
                        svgPaths={["M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"]}
                    />
                    <ActionMenuButton
                        onClick={() => {
                            setActionUser(member);
                            setIsBanModalOpen(true);
                            setActionMenuMemberId(null);
                        }}
                        text={`Ban ${member.username}`}
                        isDanger
                        isVisible={isTargetable && canBan}
                        svgPaths={["M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"]}
                    />
                </ActionMenu>
            </>
        );
    };

    return (
        <div className="w-[370px] h-screen border-l border-outline flex flex-col">
            <div className="w-full h-[60px] border-b border-outline flex items-center px-4 gap-2 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5 text-gray-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                </svg>
                Members
            </div>
            <div className="p-2">
                {(() => {
                    const assignedMemberIds = new Set<string>();
                    return (
                        <>
                            {roles.map(role => {
                                const roleMembers = onlineMembers.filter(member =>
                                    !assignedMemberIds.has(member.id) &&
                                    member.roles?.some(r => r.id === role.id)
                                );
                                roleMembers.forEach(m => assignedMemberIds.add(m.id));
                                if (roleMembers.length === 0) return null;
                                return (
                                    <div key={role.id}>
                                        <div className="text-gray-500 pl-2">
                                            {role.name} — {roleMembers.length}
                                        </div>
                                        {roleMembers.map(member => (
                                            <div
                                                key={member.id}
                                                className="relative"
                                                ref={(el) => {
                                                    if (el) memberRefs.current.set(member.id, el);
                                                    else memberRefs.current.delete(member.id);
                                                }}
                                            >
                                                {renderUserCardActionContent(member)}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                            {(() => {
                                const onlineNoRole = onlineMembers.filter(m => !assignedMemberIds.has(m.id));
                                if (onlineNoRole.length === 0) return null;
                                return (
                                    <>
                                        <div className="text-gray-500 pl-2">Online — {onlineNoRole.length}</div>
                                        {onlineNoRole.map(member => (
                                            <div
                                                key={member.id}
                                                className="relative"
                                                ref={(el) => {
                                                    if (el) memberRefs.current.set(member.id, el);
                                                    else memberRefs.current.delete(member.id);
                                                }}
                                            >
                                                {renderUserCardActionContent(member)}
                                            </div>
                                        ))}
                                    </>
                                );
                            })()}
                            {offlineMembers.length > 0 && (
                                <>
                                    <div className="text-gray-500 pl-2">Offline — {offlineMembers.length}</div>
                                    {offlineMembers.map(member => (
                                        <div
                                            key={member.id}
                                            className="relative"
                                            ref={(el) => {
                                                if (el) memberRefs.current.set(member.id, el);
                                                else memberRefs.current.delete(member.id);
                                            }}
                                        >
                                            {renderUserCardActionContent(member)}
                                        </div>
                                    ))}
                                </>
                            )}
                        </>
                    );
                })()}
            </div>
            <Modal isOpen={isKickModalOpen} onClose={() => setIsKickModalOpen(false)}>
                <MemberAction user={actionUser ?? undefined} onClose={() => setIsKickModalOpen(false)} action="kick" />
            </Modal>
            <Modal isOpen={isBanModalOpen} onClose={() => setIsBanModalOpen(false)}>
                <MemberAction user={actionUser ?? undefined} onClose={() => setIsBanModalOpen(false)} action="ban" />
            </Modal>
        </div>
    );
}