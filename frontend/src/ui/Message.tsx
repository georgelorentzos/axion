import { useState, useEffect } from "react";
import ImageProfile from "./ImageProfile";
import CommunityPreview from "../features/community/components/CommunityPreview";
import Modal from "./modal/Modal";
import LinkAlert from "./modal/content/LinkAlert";
import ActionMenu from "./action-menu/ActionMenu";
import ActionMenuButton from "./action-menu/ActionMenuButton";
import { icons } from "../constants/Icons";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import { type Message } from "../types/message";
import { useCurrentUser } from "../features/user/contexts/useCurrentUser";
import TextArea from "./TextArea";
import Icon from "./Icon";
import { useRoles } from "../features/community/contexts/useRoles";
import { useMembers } from "../features/community/contexts/useMembers";

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
  const isLink =
    message.message?.startsWith("http://") ||
    message.message?.startsWith("https://");
  const parts = message.message?.split("/join/")[1]?.split("/");
  const messageCommunityId = parts?.[0];

  const [linkModal, setLinkModal] = useState({ isOpen: false, link: "" });
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const { communityId, channelId, userId } = useParams();
  const { currentUser } = useCurrentUser();
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [isReplyMessage, setIsReplyMessage] = useState(false);
  const [newMessage, setNewMessage] = useState(message.message);
  const { onlineMembers, offlineMembers } = useMembers();
  const { roles } = useRoles();
  const [senderColor, setSenderColor] = useState("");

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    url: string
  ) => {
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
    setPos({ x: e.clientX, y: e.clientY });
    setIsActionMenuOpen(true);
  };

  const handleCopyText = () => {
    setIsActionMenuOpen(false);
    navigator.clipboard.writeText(message.message);
  };

  const handleDeleteMessage = () => {
    setIsActionMenuOpen(false);
    if (communityId && channelId) {
      api.channelMessages.delete(communityId, channelId, message.id);
    } else {
      if (message.recipientId) {
        api.directMessages.delete(message.recipientId, message.id);
      }
    }
  };

  const handleEditMessage = () => {
    setIsActionMenuOpen(false);
    setNewMessage(message.message);
    window.dispatchEvent(new CustomEvent("closeAllEdits"));
    window.dispatchEvent(new CustomEvent("cancelReply"));
    setIsEditingMessage(true);
  };

  useEffect(() => {
    const handleCloseAll = () => setIsEditingMessage(false);
    window.addEventListener("closeAllEdits", handleCloseAll);
    return () => window.removeEventListener("closeAllEdits", handleCloseAll);
  }, []);

  useEffect(() => {
    if (!isEditingMessage) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsEditingMessage(false);
      }
    };
    
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    }
  }, [isEditingMessage]);


  useEffect(() => {
    if (!isReplyMessage) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsReplyMessage(false);
        window.dispatchEvent(new CustomEvent("cancelReply"));
      }
    };
    
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    }
  }, [isReplyMessage]);

  useEffect(() => {
      const cancelReply = () => setIsReplyMessage(false);
      window.addEventListener("cancelReply", cancelReply);
      return () => window.removeEventListener("cancelReply", cancelReply);
  }, []);

  const handleEditSave = () => {
    setIsEditingMessage(false);
    if (communityId && channelId) {
      api.channelMessages.edit(
        communityId,
        channelId,
        message.id,
        newMessage
      );
    } else {
      if (!message.recipientId) return;
      api.directMessages.edit(message.recipientId, message.id, newMessage);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEditSave();
    }
  };

  const handleReply = () => {
    setIsActionMenuOpen(false);
    window.dispatchEvent(new CustomEvent("closeAllEdits"));
    window.dispatchEvent(new CustomEvent("replyToMessage", {
      detail: {
        id: message.id,
        senderUsername: message.senderUsername
      }
    }));
    setIsReplyMessage(true);
  };

  useEffect(() => {
    if (!communityId) {
      setSenderColor("");
      return;
    }

    const allMembers = [...onlineMembers, ...offlineMembers];
    const sender = allMembers.find(m => m.id === message.senderId);
    if (!sender?.roles?.length) {
      setSenderColor("");
      return;
    }

    for (const role of roles) {
      if (sender.roles.some(r => r.id === role.id) && role.color) {
        setSenderColor(role.color);
        return;
      }
    }
    setSenderColor("");
  }, [communityId, onlineMembers, offlineMembers, roles, message.senderId])

  return (
    <div onContextMenu={handleContextMenu} className={`${isReplyMessage && "bg-basalt"} rounded-tr rounded-br ${isLastInGroup && "mb-4"} px-4 flex flex-col items-start flex-row ${isEditingMessage && "bg-basalt"} hover:bg-basalt group transition duration-200`}>
    {message.replyToId && isFirstInGroup && (
        <div className="flex items-center gap-1 ml-[52px] text-xs mt-1">
          <Icon svgPaths={icons.reply} className="size-3 text-gray-500" />
          <ImageProfile showStatus={false} src={message.replyToImage} height={16} width={16} />
          <span className="font-semibold text-emerald">{message.replyToUsername}</span>
          <span className="truncate max-w-[300px] text-gray-100">{message.replyToMessage}</span>
        </div>
      )}
      <div
        className={`flex items-start flex-row w-full overflow-hidden`}
      >
        {isFirstInGroup ? (
          <div className="flex-shrink-0 mt-1">
            <ImageProfile src={message.senderImage} showStatus={false} />
          </div>
        ) : (
          <div className="min-w-[40px] max-w-[40px] flex justify-center items-center h-[22px] mt-[2px]">
            {!isInviteLink && (
              <div className="opacity-0 group-hover:opacity-100 text-xs text-gray-300 transition duration-200">
                {message.createdAt}
              </div>
            )}
          </div>
        )}
        
        <div className="relative flex-1 min-w-0 overflow-hidden px-3 py-1 rounded-2xl">
          {isFirstInGroup && (
            <div
              className={`flex items-center gap-2 text-sm text-emerald-400 mb-0.5 ${isInviteLink ? "mb-2" : ""}`}
            >
              <div className={`font-semibold ${senderColor ? `text-[#${senderColor}]` : `text-gray-100` }`}>{message.senderUsername}</div>
              <div className="text-gray-500 text-xs">{message.createdAt}</div>
              </div>
          )}

          {isInviteLink ? (
            <>
              {isEditingMessage ? (
                <div className="flex flex-col gap-1">
                  <TextArea
                    className="border border-outline"
                    defaultValue={message.message}
                    onChange={(text) => setNewMessage(text)}
                    onKeyDown={(e) => handleKeyDown(e)}
                    maxLength={2000}
                  />
                  <div className="text-xs">
                    escape to{" "}
                    <button
                      onClick={() => setIsEditingMessage(false)}
                      className="text-blue-400 hover:underline"
                    >
                      cancel
                    </button>{" "}
                    • enter to{" "}
                    <button
                      onClick={() => handleEditSave()}
                      className="text-blue-400 hover:underline"
                    >
                      save
                    </button>
                  </div>
                </div>
              ) : (
                <CommunityPreview joinBtn community={communityData} />
              )}
            </>
          ) : isLink ? (
            <>
              {isEditingMessage ? (
                <div className="flex flex-col gap-1">
                  <TextArea
                    className="border border-outline"
                    defaultValue={message.message}
                    onChange={(text) => setNewMessage(text)}
                    onKeyDown={(e) => handleKeyDown(e)}
                    maxLength={2000}
                  />
                  <div className="text-xs">
                    escape to{" "}
                    <button
                      onClick={() => setIsEditingMessage(false)}
                      className="text-blue-400 hover:underline"
                    >
                      cancel
                    </button>{" "}
                    • enter to{" "}
                    <button
                      onClick={() => handleEditSave()}
                      className="text-blue-400 hover:underline"
                    >
                      save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <a
                    href={message.message}
                    onClick={(e) => handleLinkClick(e, message.message)}
                    className="text-[14px] text-blue-400 underline leading-snug break-words hover:text-blue-300 transition duration-300"
                  >
                    {message.message}
                  </a>
                  {message.isEdited && (
                    <span className="text-gray-500 text-xs pl-1">
                      (edited)
                    </span>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              {isEditingMessage ? (
                <div className="flex flex-col gap-1">
                  <TextArea
                    className="border border-outline"
                    defaultValue={message.message}
                    onChange={(text) => setNewMessage(text)}
                    onKeyDown={(e) => handleKeyDown(e)}
                    maxLength={2000}
                  />
                  <div className="text-xs">
                    escape to{" "}
                    <button
                      onClick={() => setIsEditingMessage(false)}
                      className="text-blue-400 hover:underline"
                    >
                      cancel
                    </button>{" "}
                    • enter to{" "}
                    <button
                      onClick={() => handleEditSave()}
                      className="text-blue-400 hover:underline"
                    >
                      save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="select-text w-full text-[14px] text-gray-100 leading-snug break-words whitespace-pre-wrap">
                  {message.message}
                  {message.isEdited && (
                    <span className="text-gray-500 text-xs pl-1">
                      (edited)
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {!isInviteLink && (
        <Modal
          isOpen={linkModal.isOpen}
          onClose={() => setLinkModal({ isOpen: false, link: "" })}
        >
          <LinkAlert
            onClose={() => setLinkModal({ isOpen: false, link: "" })}
            link={linkModal.link}
          />
        </Modal>
      )}

      <ActionMenu
        isOpen={isActionMenuOpen}
        onClose={() => setIsActionMenuOpen(false)}
        position={pos}
      >
        <ActionMenuButton
          text="Edit Message"
          svgPaths={icons.pen}
          onClick={handleEditMessage}
          isVisible={currentUser?.id === message.senderId}
        />
        <ActionMenuButton 
        text="Reply" 
        svgPaths={icons.reply} 
        onClick={handleReply}
        />
        <ActionMenuButton
          text="Copy Text"
          svgPaths={icons.copy}
          onClick={handleCopyText}
        />
        <ActionMenuButton
          text="Delete Message"
          isDanger
          svgPaths={icons.delete}
          onClick={handleDeleteMessage}
          isVisible={currentUser?.id === message.senderId}
        />
      </ActionMenu>
    </div>
  );
}