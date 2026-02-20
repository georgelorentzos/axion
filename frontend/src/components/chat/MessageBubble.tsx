import { useState } from "react";
import ImageProfile from "../common/ImageProfile";
import CommunityPreview from "../communities/CommunityPreview";
import LinkAlertModal from "../common/modals/LinkAlertModal";

type MessageBubbleProps = {
  isCurrentUser: boolean;
  message: string;
  sender_username: string;
  created_at: string;
  sender_profile_image: string;
};

export default function MessageBubble({
  isCurrentUser,
  message,
  sender_username,
  created_at,
  sender_profile_image,
}: MessageBubbleProps) {
  const domainUrl = window.GLOBAL_ENV.PRIMARY_DOMAIN;
  const isInviteLink = message?.startsWith(`${domainUrl}/join/`);
  const isLink = message?.startsWith("http://") || message?.startsWith("https://");
  const parts = message.split("/join/")[1]?.split("/");
  const communityId = parts?.[0];
  const [linkModal, setLinkModal] = useState({ isOpen: false, link: "" });
  
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
    e.preventDefault();
    setLinkModal({ isOpen: true, link: url });
  };

  const communityData = {
    communityId: communityId,
    communityName: "",
    communityImage: "",
    communityOnlineMembers: "",
    communityTotalMembers: "",
    communityCreatedAt: "",
  }

  if (isInviteLink) {
    return (
      <div
        className={`flex gap-2 items-end mb-1 ${
          isCurrentUser ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <div className="flex-shrink-0">
          <ImageProfile src={sender_profile_image} showStatus={false} />
        </div>
        <CommunityPreview joinBtn communityData={communityData} />
      </div>
    );
  }

  return (
    <>
      <div
        className={`flex gap-2 items-end mb-1 ${
          isCurrentUser ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <div className="flex-shrink-0">
          <ImageProfile src={sender_profile_image} showStatus={false} />
        </div>

        <div
          className={`relative max-w-[320px] min-w-[120px] px-3 py-2 rounded-2xl ${
            isCurrentUser
              ? "bg-forestgreen"
              : "bg-zinc-800"
          }`}
        >
          {!isCurrentUser && (
            <p className="text-[11px] font-semibold text-emerald-400 mb-0.5">
              {sender_username}
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
            {created_at}
          </p>
        </div>
      </div>

      <LinkAlertModal
        isOpen={linkModal.isOpen}
        link={linkModal.link}
        onClose={() => setLinkModal({ isOpen: false, link: "" })}
      />
    </>
  );
}