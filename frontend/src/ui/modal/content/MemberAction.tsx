import { useState, useRef, useEffect } from "react";
import Button from "../../../ui/Button";
import TextArea from "../../../ui/TextArea";
import { type User } from "../../../features/user/types/user";
import { useParams } from "react-router-dom";
import { useMembers } from "../../../features/community/contexts/useMembers";
import { useBans } from "../../../features/community/contexts/useBans";
import { api } from "../../../api/client";
import { type Ban } from "../../../features/community/types/ban";

type MemberActionProps = {
  onClose: () => void;
  user?: User | Ban;
  action: "kick" | "ban" | "unban";
};

const config = {
  kick: { title: "Kick", description: "Are you sure you want to kick this user?" },
  ban: { title: "Ban", description: "Are you sure you want to ban this user?" },
  unban: { title: "Unban", description: "Are you sure you want to unban this user?" },
};

export default function MemberAction({ user, onClose, action }: MemberActionProps) {
  const { communityId } = useParams();
  const { setMembers } = useMembers();
  const { setBans } = useBans();
  const [reason, setReason] = useState("");
  const cached = useRef({ user, action, ...config[action] });

  useEffect(() => {
    if (user) cached.current = { user, action, ...config[action] };
  }, [user, action]);

  const handleAction = async () => {
    const cachedUser = cached.current.user;
    if (!cachedUser || !communityId) return;
    try {
      if (cached.current.action === "unban") {
        const { data } = await api.bans.unban(communityId, cachedUser.id);
        if (data.success) {
          setBans(prev => prev.filter(ban => ban.id !== data.id));
          onClose();
        }
        return;
      }
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
      {cached.current.action !== "unban" && (
        <TextArea
          placeholder="Reason?"
          className="border border-outline py-2 h-[80px] rounded-lg"
          onChange={(text) => setReason(text)}
          maxLength={100}
        />
      )}
      <Button text={cached.current.title} isDanger onClick={handleAction} />
    </>
  );
}