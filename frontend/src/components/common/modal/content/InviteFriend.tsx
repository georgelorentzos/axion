import { useState } from "react";
import { useAllFriends } from "../../../../contexts/useAllFriends";
import { useParams } from "react-router-dom";
import UserCard from "../../UserCard";
import Input from "../../Input";
import Button from "../../Button";

export default function InviteFriend({
  onInvite,
}: {
  onInvite?: (userId: string) => void;
}) {
  const { allFriends } = useAllFriends();
  const [copied, setCopied] = useState(false);
  const { communityId } = useParams();

  const domainUrl =
    typeof window !== "undefined" ? window.location.origin : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(`${domainUrl}/join/${communityId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = (userId: string) => {
    onInvite?.(userId);
  };

  return (
    <>
      <div className="flex flex-col text-center">
        <div className="font-bold text-[20px]">Invite Friends</div>
        <div className="text-gray-500">Share this link with others.</div>
      </div>
      {allFriends && allFriends.length > 0 && (
        <div className="w-full max-h-[200px] h-auto border border-outline rounded-xl overflow-y-auto flex flex-col gap-2 justify-center p-2">
          {allFriends.map((friend) => (
            <UserCard
              key={friend.user_id}
              id={friend.user_id}
              isOnline={friend.is_online}
              username={friend.username}
              image={friend.profile_image}
              createdAt={friend.created_at}
              actions={{ invite: true }}
              onInvite={() => handleInvite(friend.user_id)}
            />
          ))}
        </div>
      )}
      <Input
        isLink
        readOnly
        value={`${domainUrl}/join/${communityId}`}
      />
      <Button
        text={copied ? "Copied" : "Copy Link"}
        isGreen
        onClick={handleCopy}
      />
    </>
  );
}