import { useState } from "react";
import Button from "../../../ui/Button";
import TextArea from "../../../ui/TextArea";
import { type User } from "../../user/types/user";
import { useParams } from "react-router-dom";
import { useMembers } from "../contexts/useMembers";
import { api } from "../../../api/client";

type MemberActionProps = {
    onClose: () => void;
    user?: User;
    action: "kick" | "ban";
}

const config = {
    kick: { title: "Kick", description: "Are you sure you want to kick this user?" },
    ban: { title: "Ban", description: "Are you sure you want to ban this user?" },
};

export default function MemberAction({ user, onClose, action }: MemberActionProps) {
    const { communityId } = useParams();
    const { setMembers } = useMembers();
    const [reason, setReason] = useState("");
    const { title, description } = config[action];

    const handleAction = async () => {
        if (!user || !communityId) return;
        try {
            const apiCall = action === "kick" ? api.members.kick : api.members.ban;
            const { response } = await apiCall(communityId, user.id, reason || "No Reason");
            if (response.ok) {
                setMembers(prev => prev.filter(m => m.id !== user.id));
                onClose();
            }
        } catch (error) {
            console.log(`error ${action}ing ${user.username}: `, error);
        }
    };

    return (
        <>
            <div className="flex flex-col text-center">
                <div className="font-bold text-[20px]">{title} {user?.username}</div>
                <div className="text-gray-500">{description}</div>
            </div>
            <TextArea
                placeholder="Reason?"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={100}
            />
            <Button text={title} isDanger onClick={handleAction} />
        </>
    );
}
