import { useState } from "react";
import ImageProfile from "./ImageProfile";
import CommunityPreview from "../features/community/components/CommunityPreview";
import Modal from "./modal/Modal";
import LinkAlert from "./modal/content/LinkAlert";

type MessageBubbleProps = {
  message: string;
  senderUsername: string;
  createdAt: string;
  senderProfileImage: string;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
};

export default function MessageBubble({
  message,
  senderUsername,
  createdAt,
  senderProfileImage,
  isFirstInGroup,
  isLastInGroup
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
      <div className={`rounded-tr rounded-br ${isLastInGroup && `mb-4`} py-1 px-4 flex items-start flex-row hover:bg-basalt group transition duration-200`}>
        {isFirstInGroup ? (
        <div className="flex-shrink-0">
          <ImageProfile src={senderProfileImage} showStatus={false} />
        </div>
        ): (
          <div className="min-w-[40px] max-w-[40px]">
          </div>
        )}

        <div className="relative w-full min-w-[120px] px-3 py-1 rounded-2xl">
          {isFirstInGroup && (
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-400 mb-0.5">
            <div>{senderUsername}</div>
            <div className="text-gray-500 text-xs">{createdAt}</div>
          </div>
          )}
          <CommunityPreview joinBtn community={communityData} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`rounded-tr rounded-br ${isLastInGroup && `mb-4`} px-4 flex items-center flex-row hover:bg-basalt group transition duration-200`}>
        {isFirstInGroup ? (
        <div className="flex-shrink-0">
          <ImageProfile src={senderProfileImage} showStatus={false} />
        </div>
        ): (
          <div className="min-w-[40px] max-w-[40px] flex justify-center">
            <div className="opacity-0 group-hover:opacity-100 text-xs text-gray-300 transition duration-200">{createdAt}</div>
          </div>
        )}

        <div className="relative w-full min-w-[120px] px-3 py-1 rounded-2xl">
          {isFirstInGroup && (
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400 mb-0.5">
            <div>{senderUsername}</div>
            <div className="text-gray-500 text-xs">{createdAt}</div>
          </div>
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
        </div>
      </div>

      <Modal
        isOpen={linkModal.isOpen}
        onClose={() => setLinkModal({ isOpen: false, link: "" })}
      >
        <LinkAlert onClose={() => setLinkModal({ isOpen: false, link: "" })} link={linkModal.link} />
      </Modal>
    </>
  );
}