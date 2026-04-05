import { useState, useRef, useEffect } from "react";
import Button from "../../../ui/Button";
import TextArea from "../../../ui/TextArea";
import { type User } from "../../../features/user/types/user";
import { useParams } from "react-router-dom";
import { useMembers } from "../../../features/community/contexts/useMembers";
import { api } from "../../../api/client";

type MemberActionProps = {
  onClose: () => void;
  user?: User;
  action: "kick" | "ban";
};

const config = {
  kick: { title: "Kick", description: "Are you sure you want to kick this user?" },
  ban: { title: "Ban", description: "Are you sure you want to ban this user?" },
};

export default function MemberAction({ user, onClose, action }: MemberActionProps) {
  const { communityId } = useParams();
  const { setMembers } = useMembers();
  const [reason, setReason] = useState("");
  const cached = useRef({ user, action, ...config[action] });

  useEffect(() => {
    if (user) cached.current = { user, action, ...config[action] };
  }, [user, action]);

  const handleAction = async () => {
    const cachedUser = cached.current.user;
    if (!cachedUser || !communityId) return;
    try {
      const apiCall = cached.current.action === "kick" ? api.members.kick : api.members.ban;
      const { response } = await apiCall(communityId, cachedUser.id, reason || "No Reason");
      if (response.ok) {
        setMembers(prev => prev.filter(m => m.id !== cachedUser.id));
        onClose();
      }
    } catch (error) {
      console.log(`error ${cached.current.action}ing ${cachedUser.username}: `, error);
    }
  };

  return (
    <>
      <div className="flex flex-col text-center">
        <div className="font-bold text-[20px]">{cached.current.title} {cached.current.user?.username}</div>
        <div className="text-gray-500">{cached.current.description}</div>
      </div>
      <TextArea
        placeholder="Reason?"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={100}
      />
      <Button text={cached.current.title} isDanger onClick={handleAction} />
    </>
  );
}