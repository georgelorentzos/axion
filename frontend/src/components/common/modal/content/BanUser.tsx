import { useState } from "react";
import Button from "../../Button";
import TextArea from "../../TextArea";
import { type User } from "../../../../types/user";
import { useParams } from "react-router-dom";
import { useMembers } from "../../../../contexts/community/useMembers";

type BanUserProps = {
    onClose: () => void;
    user?: User;
}

export default function BanUser({ user, onClose }: BanUserProps) {
    const token = localStorage.getItem("token");
    const { communityId } = useParams();
    const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;
    const { setMembers } = useMembers();
    const [reason, setReason] = useState("");

    const handleBan = async () => {
        if (!user) return;
        if (!token) return;
        if (!communityId) return;
        try {
            const response = await fetch(
                `${apiUrl}/api/community/${communityId}/members/${user.id}/ban`,
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
            console.log(`error banning ${user.username}: `, error);
        }
    };

    return (
        <>
            <div className="flex flex-col text-center">
                <div className="font-bold text-[20px]">Ban {user?.username}</div>
                <div className="text-gray-500">Are you sure you want to ban this user?</div>
            </div>
            <TextArea
                placeholder="Reason?"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={100}
            />
            <Button text="Ban" isDanger onClick={handleBan} />
        </>
    );
}