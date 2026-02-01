import ImageProfile from "../common/ImageProfile";
import { useCurrentUser } from '../../contexts/useCurrentUser';
import DropDown from './DropDown';
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

type UserCardProps = {
  id?: string;
  username?: string;
  image?: string;
  isOnline: boolean;
  createdAt?: string;
  optionsBtn?: boolean;
  addFriendBtn?: boolean;
  acceptPendingBtn?: boolean;
  declinePendingBtn?: boolean;
  noBorderLRT?: boolean;
  onDecline?: (id: string) => void;
  onAccept?: (id: string) => void;
};

type Pending = {
  pending_user_id: string;
};

type PendingResponse = {
  success: boolean;
  pendings: Pending[];
};

export default function UserCard({
  id,
  username,
  image,
  isOnline,
  createdAt,
  optionsBtn,
  addFriendBtn,
  acceptPendingBtn,
  declinePendingBtn,
  onDecline,
  onAccept
}: UserCardProps) {
  const { user } = useCurrentUser();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;
  const [ isDropDownOpen, setisDropDownOpen ] = useState(false);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const isThisPending =
    id !== undefined && pendingIds.includes(id);

  useEffect(() => {
    const fetchPendingRequests = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/my/ally/requests`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.ok) {
          const data: PendingResponse = await response.json();
          setPendingIds(data.pendings.map(p => p.pending_user_id));
        }
      } finally {
        setPendingLoading(false);
      }
    };

    if (addFriendBtn) {
      fetchPendingRequests();
    }
  }, [addFriendBtn]);

  const handleAlly = async () => {
    if (!id || !user?.user_id) return;

    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/ally`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          requester_id: user.user_id,
          addressee_id: id
        })
      });

      if (!response.ok) throw new Error();

      setSent(true);
      setPendingIds(prev => [...prev, id]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePending = async () => {
    if (!id || !user?.user_id) return;

    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/ally/cancel`,
        {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            requester_id: user.user_id,
            addressee_id: id
          })
        }
      );

      if (response.status === 404) {
        setPendingIds(prev => prev.filter(pid => pid !== id));
        setSent(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      setPendingIds(prev => prev.filter(pid => pid !== id));
      setSent(false);
    } catch (error) {
      if (error instanceof Error && !error.message.includes('404')) {
        console.error('Error removing pending request:', error);
      }
    }finally {
      setLoading(false);
    }
  };

  const handlePendingDeclined = async () => {
    if (!id || !user?.user_id) return;

    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/ally/decline`, {
        method: "DELETE",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          requester_id: id,
          addressee_id: user.user_id
        })
      });

      if (!response.ok) throw new Error();
      onDecline?.(id);

    } catch (error) {
      console.error("Error declining request:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePendingAccept = async () => {
    if (!id || !user?.user_id) return;

    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/ally/accept`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          requester_id: id,
          addressee_id: user.user_id
        })
      });

      if (!response.ok) throw new Error();
      onAccept?.(id);

    } catch (error) {
      console.error("Error accepting request:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!id || !user?.user_id) return;

    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/ally/remove`, {
        method: 'DELETE',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-type": "application/json"
        },
        body: JSON.stringify({
            requester_id: user.user_id,
            addressee_id: id
        })
      });

      if (!response.ok) throw new Error();

      setisDropDownOpen(false);

    } catch (error) {
      console.error("Error removing friend:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToChat = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!id) return;
    if (!(e.target as HTMLDivElement).closest('button')) {
      const userData = {
        user_id: id,
        username: username,
        profile_image: image,
        is_online: isOnline,
        created_at: createdAt,
      };
      
      navigate(`/chat/${id}`, { state: { userData } });
    }
  }

  return (
    <div
      onClick={handleNavigateToChat}
      className="cursor-pointer transition duration-300 hover:bg-primaryhover h-[80px] border-outline px-6 flex justify-between items-center w-full rounded-xl"
    >
      <div className="flex items-center gap-3">
        <ImageProfile src={image} online={isOnline} />
        <div className="flex flex-col leading-none gap-1">
          <div className="text-gray-100">{username}</div>
          <div className="text-gray-500 text-[12px]">
            {isOnline ? "Online" : "Offline"}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {optionsBtn && (
          <div className="relative">
          <button 
          onClick={() => 
            setisDropDownOpen(prev => !prev)
          }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-6 text-gray-500 hover:text-gray-300 transition duration-300"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
              />
            </svg>
          </button>
          <DropDown isDropDownOpen={isDropDownOpen} onClose={() => setisDropDownOpen(false)} onRemoveFriend={handleRemoveFriend} />
          </div>
        )}

        {acceptPendingBtn && (
          <>
          <button onClick={handlePendingAccept} disabled={loading}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 text-gray-500 hover:text-gray-300 transition duration-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </button>
          </>
        )}

        {declinePendingBtn && (
          <>
          <button onClick={handlePendingDeclined} disabled={loading}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 text-gray-500 hover:text-gray-300 transition duration-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
          </>
        )}

        {addFriendBtn && !pendingLoading && (
          <>
            {!isThisPending && !sent && (
              <button onClick={handleAlly} disabled={loading}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-6 text-gray-500 hover:text-gray-300 transition duration-300"
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
                  className="size-6 text-gray-500 hover:text-gray-300 transition duration-300"
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
  );
}
