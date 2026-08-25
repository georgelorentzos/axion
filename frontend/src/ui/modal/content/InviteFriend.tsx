import { useState, useRef } from "react";
import { useFriends } from "../../../features/home/hooks/useFriends";
import { useParams } from "react-router-dom";
import UserCard from "../../card/UserCard";
import Input from "../../../ui/Input";
import Button from "../../../ui/Button";
import SearchBar from "../../../ui/SearchBar";
import { api } from "../../../api/client";
import Icon from "../../Icon";
import { icons } from "../../../constants/Icons";

export default function InviteFriend() {
    const { friends } = useFriends();
    const [copied, setCopied] = useState(false);
    const sentIdsRef = useRef<Set<string>>(new Set());
    const [sentIds, setSentIds] = useState<Set<string>>(new Set());
    const { communityId } = useParams();
    const domainUrl =
        typeof window !== "undefined" ? window.location.origin : "";
    const [searchQuery, setSearchQuery] = useState("");
    const filtered = friends.filter(friend =>
        friend.username.startsWith(searchQuery.toLowerCase())
    );

    const handleCopy = () => {
        navigator.clipboard.writeText(`${domainUrl}/join/${communityId}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleInvite = async (userId: string) => {
        if (!communityId || sentIdsRef.current.has(userId)) return;
        try {
            await api.messages.send(userId, `${domainUrl}/join/${communityId}`);
            sentIdsRef.current.add(userId);
            setSentIds(new Set(sentIdsRef.current));
            setTimeout(() => {
                sentIdsRef.current.delete(userId);
                setSentIds(new Set(sentIdsRef.current));
            }, 3000);
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
            {friends && friends.length > 0 && (
                <>
                    <SearchBar onSearch={(value: string) => setSearchQuery(value)} />
                    <div className="w-full max-h-[200px] h-auto border border-outline rounded-xl overflow-y-auto flex flex-col gap-2">
                        {searchQuery && filtered.length === 0 && (
                            <div className="text-gray-400 text-sm text-center py-5">No results found</div>
                        )}
                        {filtered.map((friend) => (
                            <div key={friend.id} className="min-h-[50px] shrink-0">
                                <UserCard user={friend}>
                                    <button
                                        onClick={() => handleInvite(friend.id)}
                                        className={`text-gray-500 transition duration-200 ${sentIds.has(friend.id) ? "cursor-default" : "hover:text-gray-300 cursor-pointer"}`}
                                    >
                                        <Icon
                                            svgPaths={sentIds.has(friend.id) ? icons.accept : icons.send}
                                            className="w-5 h-5"
                                        />
                                    </button>
                                </UserCard>
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