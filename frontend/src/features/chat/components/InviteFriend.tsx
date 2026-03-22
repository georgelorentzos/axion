import { useState } from "react";
import { useAllFriends } from "../../friends/contexts/useAllFriends";
import { useParams } from "react-router-dom";
import UserCard from "../../../ui/UserCard";
import Input from "../../../ui/Input";
import Button from "../../../ui/Button";
import { useCurrentUser } from "../../user/contexts/useCurrentUser";
import SearchBar from "../../../ui/SearchBar";
import { api } from "../../../api/client";

export default function InviteFriend() {
  const { allFriends } = useAllFriends();
  const [copied, setCopied] = useState(false);
  const { communityId } = useParams();
  const { currentUser } = useCurrentUser();
  const domainUrl =
    typeof window !== "undefined" ? window.location.origin : "";
  const [searchQuery, setSearchQuery] = useState("");
  const filtered = allFriends.filter(friend => friend.username.startsWith(searchQuery.toLowerCase()));

  const handleCopy = () => {
    navigator.clipboard.writeText(`${domainUrl}/join/${communityId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = async (userId: string) => {
    const currentUserId = currentUser?.id;
    if (!currentUserId || !communityId) return;
    try {
      await api.messages.send(currentUserId, userId, `${domainUrl}/join/${communityId}`);
    } catch (error) {
      console.error("Error inviting user:", error);
    }
  };

  return (
    <>
      <div className="flex flex-col text-center">
        <div className="font-bold text-[20px]">Invite Friends</div>
        <div className="text-gray-500">Share this link with others.</div>
      </div>
      {allFriends && allFriends.length > 0 && (
        <>
        <SearchBar onSearch={(value: string) => setSearchQuery(value)} />
        <div className="w-full max-h-[200px] h-auto border border-outline rounded-xl overflow-y-auto flex flex-col gap-2 p-2">
          {searchQuery && filtered.length === 0 && (
            <div className="text-gray-400 text-sm text-center py-5">No results found</div>
          )}
          {filtered.map((friend) => (
            <div key={friend.id} className="min-h-[50px] shrink-0">
              <UserCard
                user={friend}
                actions={{ invite: true }}
                onInvite={() => handleInvite(friend.id)}
              />
            </div>
          ))}
        </div>
        </>
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