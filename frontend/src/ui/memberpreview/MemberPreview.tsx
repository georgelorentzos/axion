import { useEffect, useState } from "react";
import UserAvatar from "../avatar/UserAvatar";
import Button from "../Button";
import Input from "../Input";
import { api } from "../../api/client";
import { useCurrentUser } from "../../features/user/hooks/useCurrentUser";
import { useNavigate } from "react-router-dom";
import AddRole from "./AddRole";
import { type User } from "../../features/user/types/user";
import RoleBadge from "./RoleBadge";
import { type Role } from "../../features/community/types/role";
import { useCommunity } from "../../features/community/contexts/useCommunity";
import { PERMISSIONS } from "../../constants/permissions";

type MemberPreviewProps = {
    member: User;
    isOpen: boolean;
    isExample?: boolean;
    static?: boolean;
};

export default function MemberPreview({ member, isOpen, isExample, static: isStatic = false }: MemberPreviewProps) {
    const [showFade, setShowFade] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [messageValue, setMessageValue] = useState<string>("");
    const { currentUser } = useCurrentUser();
    const navigate = useNavigate();
    const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
    const { community } = useCommunity();

    useEffect(() => {
        if (isStatic) {
            setIsVisible(true);
            setShowFade(true);
            return;
        }
        if (isOpen) {
            setIsVisible(true);
            const timer = setTimeout(() => setShowFade(true), 30);
            return () => clearTimeout(timer);
        } else {
            setShowFade(false);
            const timer = setTimeout(() => setIsVisible(false), 200);
            return () => { clearTimeout(timer); setIsAddRoleOpen(false); };
        }
    }, [isOpen, isStatic]);

    if (!isVisible) return null;

    const handleSendMessage = async () => {
        if (!messageValue.trim() || !currentUser) return;
        try {
            await api.messages.send(member.id, messageValue);
            navigate(`/chat/${member.id}`);
            setMessageValue("");
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div
            className={`p-4 rounded-lg w-[300px] h-auto bg-basalt border border-outline z-50 flex gap-2 flex-col justify-between transition duration-200 ${
                isStatic ? "relative" : "absolute top-0 right-full mr-2"
            } ${showFade ? "opacity-100" : "opacity-0"}`}
        >
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <UserAvatar
                        src={member.image}
                        isOnline={member.isOnline}
                        size={65}
                        showStatus
                    />
                    <div className="font-bold">{member.username}</div>
                </div>
                {member?.bio && member.bio.length > 0 && (
                    <div className="w-full text-sm">
                        {member.bio}
                    </div>
                )}

                {/* Example Button Logic */}
                {isExample ? (
                    <Button text="Example Button" isGreen bold onClick={() => {}} />
                ) : (
                    <>
                        {(currentUser?.id === community?.ownerId ||
                            currentUser?.permissions?.includes(PERMISSIONS.ADMINISTRATOR) ||
                            currentUser?.permissions?.includes(PERMISSIONS.MANAGE_ROLES)
                        ) && (
                            <Button text="+ Add Role" isGreen onClick={() => setIsAddRoleOpen(prev => !prev)} />
                        )}
                        
                        {member.roles && member.roles.length > 0 && (
                            <div className="flex flex-wrap gap-2 w-full">
                                {member.roles?.map((role: Role) => (
                                    <RoleBadge key={role.id} member={member} role={role} />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {!isExample && (
                currentUser?.id === community?.ownerId ||
                currentUser?.permissions?.includes(PERMISSIONS.ADMINISTRATOR) ||
                currentUser?.permissions?.includes(PERMISSIONS.MANAGE_ROLES)
            ) && (
                <AddRole member={member} isOpen={isAddRoleOpen} onClose={() => setIsAddRoleOpen(false)} />
            )}

            {!isExample && member.id !== currentUser?.id && (
                <Input
                    onChange={(e) => setMessageValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder={`Message ${member.username}`}
                    bg="bg-onyx"
                />
            )}
        </div>
    );
}