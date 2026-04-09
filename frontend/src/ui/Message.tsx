import React, { useState } from "react";
import ImageProfile from "./ImageProfile";
import CommunityPreview from "../features/community/components/CommunityPreview";
import Modal from "./modal/Modal";
import LinkAlert from "./modal/content/LinkAlert";
import ActionMenu from "./actionmenu/ActionMenu";
import ActionMenuButton from "./actionmenu/ActionMenuButton";
import { icons } from "../constants/Icons";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import { type Message } from "../types/message";
import { useCurrentUser } from "../features/user/contexts/useCurrentUser";

type MessageProps = {
  message: Message;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
};

export default function Message({
  message,
  isFirstInGroup,
  isLastInGroup,
}: MessageProps) {
  const joinPattern = /\/join\/[\w-]+/;
  const isInviteLink = joinPattern.test(message.message);
  const isLink = message.message?.startsWith("http://") || message.message?.startsWith("https://");
  const parts = message.message.split("/join/")[1]?.split("/");
  const messageCommunityId = parts?.[0];
  const [linkModal, setLinkModal] = useState({ isOpen: false, link: "" });
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [pos, setPos] = useState<{ x:number, y:number}>({ x:0, y:0});
  const { communityId, channelId } = useParams();
  const { currentUser } = useCurrentUser();

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
    e.preventDefault();
    setLinkModal({ isOpen: true, link: url });
  };

  const communityData = {
    id: messageCommunityId,
    name: "",
    image: "",
    onlineMembers: "",
    totalMembers: "",
    createdAt: "",
    ownerId: "",
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    setPos({ x:e.clientX, y:e.clientY });
    setIsActionMenuOpen(true);
  };

  const handleCopyText = () => {
    setIsActionMenuOpen(false);
    navigator.clipboard.writeText(message.message);
  };

  const handleDeleteMessage = () => {
    setIsActionMenuOpen(false);
    if (communityId && channelId) {
      api.channelMessages.delete(communityId, channelId, message.id)
    } else {
      if (message.recipientId) {
        api.directMessages.delete(message.recipientId, message.id);
      }
  }
  };

  return (
    <>
      <div
        onContextMenu={handleContextMenu}
        className={`rounded-tr rounded-br ${isLastInGroup && "mb-4"} px-4 flex ${
          isInviteLink ? "items-start" : "items-center"
        } flex-row hover:bg-basalt group transition duration-200`}
      >
        {isFirstInGroup ? (
          <div className="flex-shrink-0">
            <ImageProfile src={message.senderImage} showStatus={false} />
          </div>
        ) : (
          <div className="min-w-[40px] max-w-[40px] flex justify-center">
            {!isInviteLink && (
              <div className="opacity-0 group-hover:opacity-100 text-xs text-gray-300 transition duration-200">
                {message.createdAt}
              </div>
            )}
          </div>
        )}

        <div className="relative w-full min-w-[120px] px-3 py-1 rounded-2xl">
          {isFirstInGroup && (
            <div className={`flex items-center gap-2 text-sm font-semibold text-emerald-400 mb-0.5 ${isInviteLink ? "mb-2" : ""}`}>
              <div>{message.senderUsername}</div>
              <div className="text-gray-500 text-xs">{message.createdAt}</div>
            </div>
          )}

          {isInviteLink ? (
            <CommunityPreview joinBtn community={communityData} />
          ) : isLink ? (
            <a
              href={message.message}
              onClick={(e) => handleLinkClick(e, message.message)}
              className="text-[14px] text-blue-400 underline leading-snug break-words hover:text-blue-300 transition duration-300"
            >
              {message.message}
            </a>
          ) : (
            <p className="text-[14px] text-gray-100 leading-snug break-words">
              {message.message}
            </p>
          )}
        </div>
      </div>

      {!isInviteLink && (
        <Modal
          isOpen={linkModal.isOpen}
          onClose={() => setLinkModal({ isOpen: false, link: "" })}
        >
          <LinkAlert onClose={() => setLinkModal({ isOpen: false, link: "" })} link={linkModal.link} />
        </Modal>
      )}
      <ActionMenu isOpen={isActionMenuOpen} onClose={() => setIsActionMenuOpen(false)} position={pos}>
        <ActionMenuButton text="Edit Message" svgPaths={icons.pen} isVisible={currentUser?.id === message.senderId} />
        <ActionMenuButton text="Reply" svgPaths={icons.reply} />
        <ActionMenuButton text="Copy Text" svgPaths={icons.copy} onClick={handleCopyText} />
        {/* <ActionMenuButton text="Pin Message" svgPaths={icons.pen} /> */}
        <ActionMenuButton text="Delete Message" isDanger svgPaths={icons.delete} onClick={handleDeleteMessage} isVisible={currentUser?.id === message.senderId} />
      </ActionMenu>
    </>
  );
}


