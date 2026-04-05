import ImageProfile from "./ImageProfile";
import React from "react";
import { useLocation } from "react-router-dom";

type UserCardProps = {
  user?: { id?: string; username?: string; image?: string; isOnline?: boolean };
  onClick?: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  showStatus?: boolean;
  showLatestMessage?: boolean;
  latestMessage?: string;
  joinedAtText?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  children?: React.ReactNode;
};

export default function UserCard({
  user,
  onClick,
  onContextMenu,
  showStatus = true,
  showLatestMessage,
  latestMessage,
  joinedAtText,
  title,
  description,
  imageUrl,
  children,
}: UserCardProps) {
  const location = useLocation();
  const isSelected = location.pathname === `/chat/${user?.id}`;
  const isClickable = !!onClick;

  return (
    <div
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) return;
        onClick?.(e);
      }}
      onContextMenu={onContextMenu}
      className={`${isClickable ? "cursor-pointer" : "cursor-default"} transition duration-300 py-2.5 pl-2 pr-4 flex justify-between items-center w-full rounded-lg ${
        isSelected ? "bg-basalt" : "hover:bg-basalt"
      }`}
    >
      <div className="flex items-center gap-2">
        <ImageProfile src={imageUrl ?? user?.image} online={user?.isOnline} showStatus={showStatus} />
        <div className="flex flex-col leading-none gap-1">
          <div className="text-gray-100">{title ?? user?.username}</div>
          {description && (
            <div className="text-gray-500 text-[12px] max-w-[600px]">
              {title?.includes("created the role") ? (
                <span>With Permissions: {description}</span>
              ) : (
                <span>With Reason: {description}</span>
              )}
            </div>
          )}
          {showLatestMessage ? (
            <div className="text-gray-500 text-[12px] truncate w-[200px]">{latestMessage}</div>
          ) : (
            showStatus && (
              <div className="text-gray-500 text-[12px]">
                {user?.isOnline ? "Online" : "Offline"}
              </div>
            )
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {joinedAtText && <div className="text-gray-500 text-[12px]">{joinedAtText}</div>}
        {children}
      </div>
    </div>
  );
}