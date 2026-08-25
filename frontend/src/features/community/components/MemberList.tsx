import { useMembers } from "../contexts/useMembers";
import UserCard from "../../../ui/card/UserCard";
import MemberPreview from "../../../ui/memberpreview/MemberPreview";
import React, { useState, useEffect, useRef } from "react";
import ActionMenu from "../../../ui/action-menu/ActionMenu";
import ActionMenuButton from "../../../ui/action-menu/ActionMenuButton";
import { useCurrentUser } from "../../user/contexts/useCurrentUser";
import { useNavigate } from "react-router-dom";
import { useFriends } from "../../home/hooks/useFriends";
import { api } from "../../../api/client";
import { useCommunity } from "../contexts/useCommunity";
import Modal from "../../../ui/modal/Modal";
import MemberAction from "../../../ui/modal/content/MemberAction";
import { useRoles } from "../contexts/useRoles";
import type { User } from "../../user/types/user";
import { PERMISSIONS } from "../../../constants/permissions";
import { icons } from "../../../constants/Icons";

export default function MemberList() {
    const { onlineMembers, offlineMembers } = useMembers();
    const { roles } = useRoles();
    const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
    const [actionMenuMemberId, setActionMenuMemberId] = useState<string | null>(null);
    const memberRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const { currentUser } = useCurrentUser();
    const navigate = useNavigate();
    const { friends, setFriends } = useFriends();
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

    const renderUserCardActionContent = (member: User, color?: string) => {
        const isFriend = friends.some(friend => friend.id === member.id);
        const isTargetable = isMemberTargetable(member);

        return (
            <>
                <UserCard
                    user={member}
                    usernameColor={color}
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
                <div className="absolute right-full mr-2 top-0">

                <MemberPreview
                    member={member}
                    isOpen={activeMemberId === member.id}
                />
                </div>
                <ActionMenu
                    isOpen={actionMenuMemberId === member.id && member.id !== currentUser?.id}
                    onClose={() => setActionMenuMemberId(null)}
                    position={pos}
                >
                    <ActionMenuButton
                        onClick={() => navigate(`/chat/${member.id}`)}
                        text="Message"
                        svgPaths={icons.send}
                    />
                    {!isFriend ? (
                        <ActionMenuButton
                            onClick={() => {
                                if (!currentUser?.id) return;
                                api.friends.add(member.id);
                                setActionMenuMemberId(null);
                            }}
                            text="Add Friend"
                            svgPaths={icons.addFriend}
                        />
                    ) : (
                        <ActionMenuButton
                            onClick={() => {
                                if (!currentUser?.id) return;
                                api.friends.remove(member.id);
                                setFriends(friends => friends.filter(friend => friend.id !== member.id));
                                setActionMenuMemberId(null);
                            }}
                            text="Unfriend"
                            svgPaths={icons.unfriend}
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
                        svgPaths={icons.kick}
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
                        svgPaths={icons.ban}
                    />
                </ActionMenu>
            </>
        );
    };

    return (
        <div className="w-[370px] h-full border-l border-outline flex flex-col">
            <div className="p-2">
                {(() => {
                    const assignedMemberIds = new Set<string>();
                    return (
                        <>
                            {roles.map(role => {
                                const roleMembers = onlineMembers.filter(member =>
                                    !assignedMemberIds.has(member.id) &&
                                    member.roles?.some(memberRole => memberRole.id === role.id)
                                );
                                roleMembers.forEach(member => assignedMemberIds.add(member.id));
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
                                                {renderUserCardActionContent(member, role.color)}
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