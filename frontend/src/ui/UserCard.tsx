import ImageProfile from "./ImageProfile";
import { useCurrentUser } from '../features/user/contexts/useCurrentUser';
import { api } from '../api/client';
import ActionMenu from "./actionmenu/ActionMenu";
import ActionMenuButton from "./actionmenu/ActionMenuButton";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Modal from "./modal/Modal";
import MemberAction from "../features/community/components/MemberAction";
import { type User } from "../features/user/types/user";

type UserCardProps = {
  user?: User;

  actions?: {
    options?: boolean;
    unfriend?: boolean;
    admin?: boolean;
    addFriend?: boolean;
    acceptPending?: boolean;
    rejectPending?: boolean;
    invite?: boolean;
    deleteConversation?: boolean;
    unban?: boolean;
  };

  onReject?: (id: string) => void;
  onAccept?: (id: string) => void;
  onInvite?: () => void;
  onUnban?: () => void;
  onChildModalChange?: (isOpen: boolean) => void;
  onClick?: (e: React.MouseEvent) => void;

  showStatus?: boolean;
  showLatestMessage?: boolean;
  latestMessage?: string;
  joinedAtText?: string;

  title?: string;
  description?: string;
  imageUrl?: string;
};

type Pending = {
  pending_user_id: string;
};

type PendingResponse = {
  success: boolean;
  pending: Pending[];
};

export default function UserCard({
  user,
  actions,
  onReject,
  onAccept,
  onInvite,
  onUnban,
  onChildModalChange,
  onClick,
  showStatus = true,
  showLatestMessage,
  latestMessage,
  joinedAtText,
  title,
  description,
  imageUrl,
}: UserCardProps) {
  const { currentUser } = useCurrentUser();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [ isActionMenuOpen, setisActionMenuOpen ] = useState(false);
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const location = useLocation();
  const isSelected = location.pathname === `/chat/${user?.id}`;
  const isThisPending =
    user?.id !== undefined && pendingIds.includes(user?.id);
  const [isKickUserModalOpen, setIsKickUserModalOpen] = useState(false);
  const [isBanUserModalOpen, setIsBanUserModalOpen] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    onChildModalChange?.(isKickUserModalOpen);
  }, [isKickUserModalOpen]);

  useEffect(() => {
    const fetchPendingRequests = async () => {
      try {
        const { response, data } = await api.friends.myRequests() as { response: Response; data: PendingResponse };

        if (response.ok) {
          setPendingIds(data.pending.map(p => p.pending_user_id));
        }
      } finally {
        setPendingLoading(false);
      }
    };

    if (actions?.addFriend) {
      fetchPendingRequests();
    }
  }, [actions?.addFriend]);

  const handleAlly = async () => {
    if (!user?.id || !currentUser?.id) return;

    setLoading(true);
    try {
      const { response } = await api.friends.sendRequest(currentUser.id, user.id);

      if (!response.ok) throw new Error();

      setSent(true);
      setPendingIds(prev => [...prev, user?.id]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePending = async () => {
    if (!user?.id || !currentUser?.id) return;

    setLoading(true);
    try {
      const { response } = await api.friends.cancelRequest(currentUser.id, user.id);

      if (response.status === 404) {
        setPendingIds(prev => prev.filter(pid => pid !== user?.id));
        setSent(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      setPendingIds(prev => prev.filter(pid => pid !== user?.id));
      setSent(false);
    } catch (error) {
      if (error instanceof Error && !error.message.includes('404')) {
        console.error('Error removing pending request:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePendingReject = async () => {
    if (!user?.id || !currentUser?.id) return;

    setLoading(true);
    try {
      const { response } = await api.friends.rejectRequest(user.id, currentUser.id);

      if (!response.ok) throw new Error();
      onReject?.(user?.id);

    } catch (error) {
      console.error("Error declining request:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePendingAccept = async () => {
    if (!user?.id || !currentUser?.id) return;

    setLoading(true);
    try {
      const { response } = await api.friends.acceptRequest(user.id, currentUser.id);

      if (!response.ok) throw new Error();
      onAccept?.(user?.id);

    } catch (error) {
      console.error("Error accepting request:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!user?.id || !currentUser?.id) return;

    setLoading(true);
    try {
      const { response } = await api.friends.remove(currentUser.id, user.id);

      if (!response.ok) throw new Error();

      setisActionMenuOpen(false);

    } catch (error) {
      console.error("Error removing friend:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConversation = async () => {
    if (!user?.id || !currentUser?.id) return;

    setLoading(true);
    try {
      const { response } = await api.messages.deleteConversation(user.id);

      if (!response.ok) {
        throw new Error(`Failed to delete friend (${response.status})`);
      }

      setisActionMenuOpen(false);

    } catch (error) {
      console.error("Error removing friend:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToChat = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!user?.id) return;
    if (!(e.target as HTMLDivElement).closest('button')) {
      navigate(`/chat/${user?.id}`, { state: { user } });
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLDivElement).closest('button')) return;

    if (onClick) {
      onClick(e);
      return;
    }

    if (user && currentUser?.id !== user?.id) {
      handleNavigateToChat(e);
    }
  };

  const isClickable = !!(onClick || (user && currentUser?.id !== user?.id));

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "allyRejected" && data.addressee_id === user?.id) {
          setSent(false);
          setPendingIds(prev => prev.filter(pid => pid !== user?.id));
        }
      } catch (error) {
        console.error('Parse error:', error);
      }
    };

    const ws = window._ws?.ws;
    if (ws) {
      ws.addEventListener('message', handleMessage);
      return () => ws.removeEventListener('message', handleMessage);
    }
  }, [user?.id]);


  return (
    <>
      <div
        onClick={handleClick}
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
                With Reason: {description}
              </div>
            )}
            {showLatestMessage ? (
              <div className="text-gray-500 text-[12px] truncate w-[200px]">
                {latestMessage}
              </div>
            ) : (
              <>
                {showStatus && (
                  <div className="text-gray-500 text-[12px]">
                    {user?.isOnline ? "Online" : "Offline"}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {actions?.deleteConversation && (
            <button onClick={handleDeleteConversation}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5 text-gray-500 hover:text-gray-300 transition duration-300">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {actions?.acceptPending && (
            <button onClick={handlePendingAccept} disabled={loading}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5 text-gray-500 hover:text-gray-300 transition duration-300">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </button>
          )}

          {actions?.rejectPending && (
            <button onClick={handlePendingReject} disabled={loading}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5 text-gray-500 hover:text-gray-300 transition duration-300">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {joinedAtText && (
            <div className="text-gray-500 text-[12px]">{joinedAtText}</div>
          )}

          {actions?.options && (
            <div className="relative">
              <button
                ref={buttonRef}
                onClick={(e: any) => {
                  setPos({ x: e.clientX, y: e.clientY });
                  setisActionMenuOpen(prev => !prev);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-5 text-gray-500 hover:text-gray-300 transition duration-300"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
                  />
                </svg>
              </button>
            </div>
          )}

          {actions?.invite && (
            <button
              onClick={async () => {
                await onInvite?.();
                setSent(true);
                setTimeout(() => setSent(false), 2000);
              }}
              disabled={sent}
              className={`px-2 py-1 bg-forestgreen rounded-lg hover:bg-emerald text-white text-sm transition duration-300 ${
                sent ? "cursor-default" : "hover:text-gray-300"
              }`}
            >
              {sent ? "Sent" : "Send"}
            </button>
          )}

          {actions?.addFriend && !pendingLoading && (
            <>
              {!isThisPending && !sent && (
                <button onClick={handleAlly} disabled={loading}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="size-5 text-gray-500 hover:text-gray-300 transition duration-300"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
                    />
                  </svg>
                </button>
              )}

              {(isThisPending || sent) && (
                <button
                  onClick={handleRemovePending}
                  disabled={loading}
                  title="Cancel friend request"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="size-5 text-gray-500 hover:text-gray-300 transition duration-300"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
                    />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      </div>
      <ActionMenu
        isActionMenuOpen={isActionMenuOpen}
        onClose={() => setisActionMenuOpen(false)}
        buttonRef={buttonRef}
        position={pos}
      >
        <ActionMenuButton
          text="Unfriend"
          svgPaths={["M22 10.5h-6m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766Z"]}
          onClick={handleRemoveFriend}
          isVisible={!!actions?.unfriend}
        />
        <ActionMenuButton
          text={`Kick ${user?.username}`}
          svgPaths={["M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"]}
          isDanger
          isVisible={!!actions?.admin}
          onClick={() => { setIsKickUserModalOpen(true); setisActionMenuOpen(false); }}
        />
        <ActionMenuButton
          text={`Ban ${user?.username}`}
          svgPaths={["M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"]}
          isDanger
          isVisible={!!actions?.admin}
          onClick={() => { setIsBanUserModalOpen(true); setisActionMenuOpen(false); }}
        />
        <ActionMenuButton
          text="Unban"
          svgPaths={["M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"]}
          isVisible={!!actions?.unban}
          onClick={() => { onUnban?.(); setisActionMenuOpen(false); }}
        />
      </ActionMenu>
      <Modal isOpen={isKickUserModalOpen} onClose={() => setIsKickUserModalOpen(false)}>
        <MemberAction user={user} onClose={() => setIsKickUserModalOpen(false)} action="kick" />
      </Modal>
      <Modal isOpen={isBanUserModalOpen} onClose={() => setIsBanUserModalOpen(false)}>
        <MemberAction user={user} onClose={() => setIsBanUserModalOpen(false)} action="ban" />
      </Modal>
    </>
  );
}