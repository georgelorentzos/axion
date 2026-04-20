import UserCard from "../../../../../ui/card/UserCard";
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

export default function MembersContent() {
    const { members } = useMembers();
    const { community } = useCommunity();
    const { currentUser } = useCurrentUser();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [selectedMember, setSelectedMember] = useState<User | null>(null);
    const [isKickModalOpen, setIsKickModalOpen] = useState(false);
    const [isBanModalOpen, setIsBanModalOpen] = useState(false);
    
    const buttonRef = useRef<HTMLButtonElement | null>(null);

    const filteredMembers = members.filter(member => 
        member.username?.toLowerCase().startsWith(searchQuery.toLowerCase())
    );

    const isOwner = currentUser?.id === community?.ownerId;
    const isAdmin = currentUser?.permissions?.includes(PERMISSIONS.ADMINISTRATOR);
    const canKick = isOwner || isAdmin || currentUser?.permissions?.includes(PERMISSIONS.KICK);
    const canBan = isOwner || isAdmin || currentUser?.permissions?.includes(PERMISSIONS.BAN);
    const canManage = canKick || canBan;

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
                        {members.length === 1 ? '1 Member' : `${members.length} Members`}
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col py-2">
                        {filteredMembers.map(member => {
                            const isTarget = member.id !== currentUser?.id && member.id !== community?.ownerId;
                            
                            return (
                                <UserCard key={member.id} user={member}>
                                    {isTarget && canManage && (
                                        <button
                                            ref={selectedMember?.id === member.id ? buttonRef : null}
                                            onClick={(e) => {
                                                setPos({ x: e.clientX, y: e.clientY });
                                                setSelectedMember(member);
                                                setIsMenuOpen(true);
                                            }}
                                        >
                                            <Icon svgPaths={icons.verticalDots} className="size-5 text-gray-500 hover:text-gray-300 transition duration-300" />
                                        </button>
                                    )}
                                </UserCard>
                            );
                        })}
                        {filteredMembers.length === 0 && searchQuery && (
                            <div className="text-gray-500 py-2.5 px-4">No results found</div>
                        )}
                    </div>
                </div>
            </div>

            <ActionMenu 
                isOpen={isMenuOpen} 
                onClose={() => setIsMenuOpen(false)} 
                buttonRef={buttonRef} 
                position={pos}
            >
                {canKick && (
                    <ActionMenuButton
                        text={`Kick ${selectedMember?.username}`}
                        isDanger
                        svgPaths={icons.kick}
                        onClick={() => { setIsKickModalOpen(true); setIsMenuOpen(false); }}
                    />
                )}
                {canBan && (
                    <ActionMenuButton
                        text={`Ban ${selectedMember?.username}`}
                        isDanger
                        svgPaths={icons.ban}
                        onClick={() => { setIsBanModalOpen(true); setIsMenuOpen(false); }}
                    />
                )}
            </ActionMenu>

            <Modal isOpen={isKickModalOpen} onClose={() => setIsKickModalOpen(false)}>
                {selectedMember && (
                    <MemberAction 
                        user={selectedMember} 
                        onClose={() => setIsKickModalOpen(false)} 
                        action="kick" 
                    />
                )}
            </Modal>
            
            <Modal isOpen={isBanModalOpen} onClose={() => setIsBanModalOpen(false)}>
                {selectedMember && (
                    <MemberAction 
                        user={selectedMember} 
                        onClose={() => setIsBanModalOpen(false)} 
                        action="ban" 
                    />
                )}
            </Modal>
        </div>
    );
}