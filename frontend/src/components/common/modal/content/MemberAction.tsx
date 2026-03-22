import { useState } from "react";
import Button from "../../Button";
import TextArea from "../../TextArea";
import { type User } from "../../../../types/user";
import { useParams } from "react-router-dom";
import { useMembers } from "../../../../contexts/community/useMembers";

type MemberActionProps = {
    onClose: () => void;
    user?: User;
    action: "kick" | "ban";
}

const config = {
    kick: { title: "Kick", endpoint: "kick", description: "Are you sure you want to kick this user?" },
    ban: { title: "Ban", endpoint: "ban", description: "Are you sure you want to ban this user?" },
};

export default function MemberAction({ user, onClose, action }: MemberActionProps) {
    const token = localStorage.getItem("token");
    const { communityId } = useParams();
    const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;
    const { setMembers } = useMembers();
    const [reason, setReason] = useState("");
    const { title, endpoint, description } = config[action];

    const handleAction = async () => {
        if (!user || !token || !communityId) return;
        try {
            const response = await fetch(
                `${apiUrl}/api/community/${communityId}/members/${user.id}/${endpoint}`,
                {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ reason: reason || "No Reason" }),
                }
            );
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
