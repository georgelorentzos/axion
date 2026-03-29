import { useEffect, useState } from "react";
import ImageProfile from "../../../../ui/ImageProfile";
import Button from "../../../../ui/Button";
import Input from "../../../../ui/Input";
import { api } from "../../../../api/client";
import { useCurrentUser } from "../../../user/contexts/useCurrentUser";
import { useNavigate } from "react-router-dom";
import AddRole from "./AddRole";
import { type User } from "../../../user/types/user";

type MemberPreviewProps = {
    member: User;
    isOpen: boolean;
};

export default function MemberPreview({ member, isOpen }: MemberPreviewProps) {
    const [showFade, setShowFade] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [messageValue, setMessageValue] = useState<string>("");
    const { currentUser } = useCurrentUser();
    const navigate = useNavigate();
    const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            const timer = setTimeout(() => setShowFade(true), 30);
            return () => clearTimeout(timer);
        } else {
            setShowFade(false);
            const timer = setTimeout(() => setIsVisible(false), 200);
            return () => {clearTimeout(timer); setIsAddRoleOpen(false);};
        }
    }, [isOpen]);

    if (!isVisible) return null;

    const handleSendMessage = async () => {
        if (!messageValue.trim() || !currentUser) return;
        try {
            await api.messages.send(currentUser.id, member.id, messageValue);
            navigate(`/chat/${member.id}`);
            setMessageValue("");
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    return (
        <div
            className={`mr-4 p-4 absolute top-0 right-full mr-2 rounded-lg w-[300px] h-auto bg-basalt border border-outline z-50 flex gap-2 flex-col justify-between transition duration-200 ${
                showFade ? "opacity-100" : "opacity-0"
            }`}
        >
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <ImageProfile
                        width={70}
                        height={70}
                        src={member.image}
                        online={member.isOnline}
                    />
                    <div className="font-bold">{member.username}</div>
                </div>
                <Button text="+ Add Role" isGreen onClick={() => setIsAddRoleOpen(prev => !prev)} />
            </div>


                <AddRole member={member} isOpen={isAddRoleOpen} onClose={() => setIsAddRoleOpen(false)} />

                {member.id !== currentUser?.id && (
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