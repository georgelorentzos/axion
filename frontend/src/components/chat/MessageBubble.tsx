import { useState } from "react";
import ImageProfile from "../common/ImageProfile";
import CommunityPreview from "../communities/CommunityPreview";
import Modal from "../common/modal/Modal";

type MessageBubbleProps = {
  isCurrentUser: boolean;
  message: string;
  senderUsername: string;
  createdAt: string;
  senderProfileImage: string;
};

export default function MessageBubble({
  isCurrentUser,
  message,
  senderUsername,
  createdAt,
  senderProfileImage,
}: MessageBubbleProps) {
  const joinPattern = /\/join\/[\w-]+/;
  const isInviteLink = joinPattern.test(message);
  const isLink = message?.startsWith("http://") || message?.startsWith("https://");
  const parts = message.split("/join/")[1]?.split("/");
  const communityId = parts?.[0];
  const [linkModal, setLinkModal] = useState({ isOpen: false, link: "" });

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
    e.preventDefault();
    setLinkModal({ isOpen: true, link: url });
  };

  const communityData = {
    id: communityId,
    name: "",
    image: "",
    onlineMembers: "",
    totalMembers: "",
    createdAt: "",
    ownerId: "",
  };

  if (isInviteLink) {
    return (
      <div
        className={`flex gap-2 items-end mb-2 ${
          isCurrentUser ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <div className="flex-shrink-0">
          <ImageProfile src={senderProfileImage} showStatus={false} />
        </div>
        <CommunityPreview joinBtn community={communityData} />
      </div>
    );
  }

  return (
    <>
      <div
        className={`flex gap-2 items-end mb-2 ${
          isCurrentUser ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <div className="flex-shrink-0">
          <ImageProfile src={senderProfileImage} showStatus={false} />
        </div>

        <div
          className={`relative max-w-[320px] min-w-[120px] px-3 py-2 rounded-2xl ${
            isCurrentUser ? "bg-forestgreen" : "bg-zinc-800"
          }`}
        >
          {!isCurrentUser && (
            <p className="text-[11px] font-semibold text-emerald-400 mb-0.5">
              {senderUsername}
            </p>
          )}
          {isLink ? (
            <a
              href={message}
              onClick={(e) => handleLinkClick(e, message)}
              className="text-[14px] text-blue-400 underline leading-snug break-words hover:text-blue-300 transition duration-300"
            >
              {message}
            </a>
          ) : (
            <p className="text-[14px] text-gray-100 leading-snug break-words">
              {message}
            </p>
          )}
          <p
            className={`text-[10px] mt-1 ${
              isCurrentUser ? "text-green-300" : "text-zinc-500"
            } text-right`}
          >
            {createdAt}
          </p>
        </div>
      </div>

      <Modal
        isOpen={linkModal.isOpen}
        onClose={() => setLinkModal({ isOpen: false, link: "" })}
        type="linkAlert"
        link={linkModal.link}
      />
    </>
  );
}