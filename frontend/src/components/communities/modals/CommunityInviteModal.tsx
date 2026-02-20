import { useEffect, useState } from "react";
import Button from "../../common/Button";
import Input from "../../common/Input";
import ModalCloseButton from "../../common/modals/ModalCloseButton";
import { useCurrentUser } from "../../../contexts/useCurrentUser";
import { useAllFriends } from "../../../contexts/useAllFriends";
import UserCard from "../../common/UserCard";

type CommunityInviteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (name: string) => void;
  communityId?: string;
};


export default function CommunityInviteModal({
  isOpen,
  onClose,
  communityId,
}: CommunityInviteModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showFade, setShowFade] = useState(false);
  const [copied, setCopied] = useState(false);
  const domainUrl = window.GLOBAL_ENV.PRIMARY_DOMAIN;
  const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;
  const { currentUser } = useCurrentUser();
  const { allFriends } = useAllFriends();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      const timer = setTimeout(() => setShowFade(true), 30);
      return () => clearTimeout(timer);
    } else {
      setShowFade(false);
      const timer = setTimeout(() => setIsVisible(false), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`${domainUrl}/join/${communityId}/${currentUser?.user_id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = async (friendId: string) => {
    const inviteLink = `${domainUrl}/join/${communityId}/${currentUser?.user_id}`;

    try {
      const response = await fetch(`${apiUrl}/api/send/message`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender_id: currentUser?.user_id,
          recipient_id: friendId,
          message: inviteLink,
        }),
      });

      if (!response.ok) {
        console.error("Failed to send invite");
      }
    } catch (error) {
      console.error("Error sending invite:", error);
    }
  };

  if (!isVisible) return null;
  return (
    <div
      onClick={onClose}
      className={`fixed inset-0 z-50 bg-black/50 flex justify-center items-center transition-opacity duration-200 ${
        showFade ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="border border-outline relative bg-onyx w-[400px] rounded-3xl"
      >
        <ModalCloseButton onClose={onClose} />

        <div className="p-6 flex gap-4 flex-col items-center bg-onyx w-[400px] rounded-3xl">
          <div className="flex flex-col text-center">
            <div className="font-bold text-[20px]">Invite Friends</div>
            <div className="text-gray-500">Share this link with others.</div>
          </div>
          {allFriends && allFriends.length > 0 && (
            <div className="w-full max-h-[200px] h-auto border border-outline rounded-xl overflow-y-auto flex flex-col gap-2 justify-center p-2">
              {allFriends.map(friend => (
                <UserCard
                  key={friend.user_id}
                  id={friend.user_id}
                  isOnline={friend.is_online}
                  username={friend.username}
                  image={friend.profile_image}
                  createdAt={friend.created_at}
                  inviteBtn
                  onInvite={() => handleInvite(friend.user_id)}
                />
              ))}
            </div>
          )}
          <Input
            isLink
            readOnly
            value={`${domainUrl}/join/${communityId}/${currentUser?.user_id}`}
          />
          <Button text={copied ? "Copied" : "Copy Link"} isGreen onClick={handleCopy} />
        </div>
      </div>
    </div>
  );
}