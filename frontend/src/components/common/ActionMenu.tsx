import React, { useEffect, useRef, useState } from "react";

type ActionMenuProps = {
  isActionMenuOpen: boolean;
  position?: { x: number; y: number };
  onClose: () => void;
  onRemoveFriend?: () => void;
  onCreateChannel?: () => void;
  onCreateCategory?: () => void;
  onCommunitySettings?: () => void;
  onCommunityInvite?: () => void;
  onCommunityLeave?: () => void;
  removeFriendBtn?: boolean;
  isChannelList?: boolean;
  isServerOptions?: boolean;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
};

export default function ActionMenu({
  isActionMenuOpen,
  onClose,
  onRemoveFriend,
  onCreateChannel,
  onCreateCategory,
  onCommunitySettings,
  onCommunityInvite,
  onCommunityLeave,
  buttonRef,
  position,
  isChannelList,
  removeFriendBtn,
  isServerOptions,
}: ActionMenuProps) {
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef?.current?.contains(event.target as Node)) return;

      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isActionMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isActionMenuOpen, onClose, buttonRef]);

  useEffect(() => {
    if (isActionMenuOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isActionMenuOpen]);

  if (!isVisible) return null;

  const hasPos =
    typeof position?.x === "number" && typeof position?.y === "number";

  const baseButtonStyle =
    "w-full px-4 py-2 flex items-center gap-2 text-left hover:bg-slate transition-colors";

  return (
    <div
      ref={actionMenuRef}
      className={`z-[2] bg-basalt border border-outline w-auto min-w-max rounded-xl shadow-lg overflow-hidden transition-opacity duration-200 ${
        isActionMenuOpen ? "opacity-100" : "opacity-0"
      } ${hasPos ? "fixed" : "absolute right-[-20px] top-7"}`}
      style={hasPos ? { left: position!.x, top: position!.y } : undefined}
    >
      {removeFriendBtn && (
        <button onClick={onRemoveFriend} className={baseButtonStyle}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="size-5 text-gray-500"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
            />
          </svg>
          UnFriend
        </button>
      )}

      {isChannelList && (
        <>
          <button onClick={onCreateCategory} className={baseButtonStyle}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-5 text-gray-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Create Category
          </button>

          <div className="border-t border-outline" />

          <button onClick={onCreateChannel} className={baseButtonStyle}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-5 text-gray-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Create Channel
          </button>
        </>
      )}

      {isServerOptions && (
        <>
          <button onClick={onCommunitySettings} className={baseButtonStyle}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-5 text-gray-500"
            >
              <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            Settings
          </button>

          <div className="border-t border-outline" />

          <button onClick={onCommunityInvite} className={baseButtonStyle}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-5 text-gray-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
              />
            </svg>
            Invite Friends
          </button>


          <button onClick={onCommunityLeave} className={baseButtonStyle}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-5 text-gray-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
              />
            </svg>
            Leave
          </button>
        </>
      )}

    </div>
  );
}
