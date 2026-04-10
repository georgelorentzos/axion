import UserCard from "../../../../../ui/UserCard";
import SearchBar from "../../../../../ui/SearchBar";
import ActionMenu from "../../../../../ui/action-menu/ActionMenu";
import ActionMenuButton from "../../../../../ui/action-menu/ActionMenuButton";
import Modal from "../../../../../ui/modal/Modal";
import MemberAction from "../../../../../ui/modal/content/MemberAction";
import { useMembers } from "../../../contexts/useMembers";
import { useState, useRef } from "react";
import { useCommunity } from "../../../contexts/useCommunity";
import { useCurrentUser } from "../../../../user/contexts/useCurrentUser";
import { PERMISSIONS } from "../../../../../constants/permissions";
import type { User } from "../../../../user/types/user";
import { icons } from "../../../../../constants/Icons";
import Icon from "../../../../../ui/Icon";

type MembersContentProps = {
    onChildModalChange?: (isOpen: boolean) => void;
};

function MemberOptionsButton({
    member,
    onModalChange,
}: {
    member: User;
    onModalChange?: (isOpen: boolean) => void;
}) {
    const { currentUser } = useCurrentUser();
    const { community } = useCommunity();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [isKickModalOpen, setIsKickModalOpen] = useState(false);
    const [isBanModalOpen, setIsBanModalOpen] = useState(false);

    const isOwner = currentUser?.id === community?.ownerId;
    const isAdmin = currentUser?.permissions?.includes(PERMISSIONS.ADMINISTRATOR);
    const canKick = isOwner || isAdmin || currentUser?.permissions?.includes(PERMISSIONS.KICK);
    const canBan = isOwner || isAdmin || currentUser?.permissions?.includes(PERMISSIONS.BAN);

    const handleModalChange = (isOpen: boolean) => {
        onModalChange?.(isOpen);
    };

    return (
        <>
            <button
                ref={buttonRef}
                onClick={(e) => {
                    setPos({ x: e.clientX, y: e.clientY });
                    setIsMenuOpen(prev => !prev);
                }}
            >
                <Icon svgPaths={icons.verticalDots} className="size-5 text-gray-500 hover:text-gray-300 transition duration-300" />
            </button>
            <ActionMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} buttonRef={buttonRef} position={pos}>
                {canKick && (
                    <ActionMenuButton
                        text={`Kick ${member.username}`}
                        isDanger
                        svgPaths={icons.kick}
                        onClick={() => { setIsKickModalOpen(true); setIsMenuOpen(false); handleModalChange(true); }}
                    />
                )}
                {canBan && (
                    <ActionMenuButton
                        text={`Ban ${member.username}`}
                        isDanger
                        svgPaths={icons.ban}
                        onClick={() => { setIsBanModalOpen(true); setIsMenuOpen(false); handleModalChange(true); }}
                    />
                )}
            </ActionMenu>
            <Modal isOpen={isKickModalOpen} onClose={() => { setIsKickModalOpen(false); handleModalChange(false); }}>
                <MemberAction user={member} onClose={() => { setIsKickModalOpen(false); handleModalChange(false); }} action="kick" />
            </Modal>
            <Modal isOpen={isBanModalOpen} onClose={() => { setIsBanModalOpen(false); handleModalChange(false); }}>
                <MemberAction user={member} onClose={() => { setIsBanModalOpen(false); handleModalChange(false); }} action="ban" />
            </Modal>
        </>
    );
}

export default function MembersContent({ onChildModalChange }: MembersContentProps) {
    const { members } = useMembers();
    const [searchQuery, setSearchQuery] = useState('');
    const filteredMembers = members.filter(member => member.username?.startsWith(searchQuery.toLowerCase()));
    const { community } = useCommunity();
    const { currentUser } = useCurrentUser();

    const isOwner = currentUser?.id === community?.ownerId;
    const isAdmin = currentUser?.permissions?.includes(PERMISSIONS.ADMINISTRATOR);
    const canManage = isOwner || isAdmin || currentUser?.permissions?.includes(PERMISSIONS.KICK) || currentUser?.permissions?.includes(PERMISSIONS.BAN);

    return (
        <div className="flex gap-2 justify-start items-start h-full min-h-0">
            <div className="px-6 flex flex-col gap-2 w-full h-full min-h-0">
                <div>Community Members</div>
                <div className="text-[14px] w-[500px] text-gray-500">
                    See who's recently joined your server.
                </div>
                <div className="flex flex-col flex-1 min-h-0">
                    <SearchBar onSearch={(q) => setSearchQuery(q)} />
                    <br />
                    <div className="text-gray-500 text-[12px] border-b border-outline pb-2">
                        {members.length > 1
                            ? `${members.length} Members`
                            : `${members.length} Member`}
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col py-2">
                        {filteredMembers.map(member => {
                            const isTarget = member.id !== currentUser?.id && member.id !== community?.ownerId;
                            return (
                                <UserCard key={member.id} user={member}>
                                    {isTarget && canManage && (
                                        <MemberOptionsButton
                                            member={member}
                                            onModalChange={onChildModalChange}
                                        />
                                    )}
                                </UserCard>
                            );
                        })}
                        {filteredMembers.length === 0 && searchQuery && (
                            <div className="text-gray-500 transition duration-300 py-2.5 px-4 flex justify-between items-center w-full rounded-lg hover:bg-basalt">
                                No results found
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}