import CurrentUserCard from "../common/CurrentUserCard";
import { useLocation, useParams } from "react-router-dom";
import React, { useState, useRef, useEffect } from "react";
import ActionMenu from "../common/ActionMenu";
import ChannelListModal from "./modals/ChannelListModal";
import CommunitySettingsModal from "./CommunitySettings/CommunitySettings";
import CommunityInviteModal from "./modals/CommunityInviteModal";
import { useCommunities } from "../../contexts/useCommunities";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "../../contexts/useCurrentUser";

type CommunityData = {
  communityId: string;
  communityName: string;
  communityImage: string;
};

interface LocationState {
  communityData?: {
    communityId: string;
    communityName: string;
    communityImage: string;
  };
}

type Channel = {
  channelId: string;
  channelName: string;
};

type ModalMode = "channel" | "category" | null;

export default function ChannelList() {
  const location = useLocation();
  const { communityId } = useParams();
  const [communityData, setCommunityData] = useState<CommunityData | undefined>(undefined);
  const { communities, setCommunities ,loading } = useCommunities();
  const navigate = useNavigate();
  const { currentUser } = useCurrentUser();
  const token = localStorage.getItem("token");
  const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (!token) return;
    const fetchCommunityData = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/community/${communityId}`, {
          headers: {"Authorization": `Bearer ${token}`}
        });
        const data = await response.json();
        console.log("owner_id:", data.community_owner_id, "user_id:", currentUser?.user_id);
        setIsOwner(data.community_owner_id === currentUser?.user_id);
      } catch (error) {
        console.log("failed fetching community data: ", error);
      }
    };
    fetchCommunityData();
  }, [communityId, currentUser])

  useEffect(() => {
    if (loading) return;
    if (!communities) return;

    const isMember = communities.some(c => c.community_id === communityId);
    if (!isMember) {
      navigate("/");
    }
  }, [communities, loading, communityId]);

  useEffect(() => {
    const state = location.state as LocationState;
    if (state?.communityData) {
      setCommunityData(state.communityData);
    }
  }, [location.state, communityId]);

  const [channels, setChannels] = useState<Channel[]>([]);
  const [isChannelListMenuOpen, setIsChannelListMenuOpen] = useState(false);
  const [isServerOptionsMenuOpen, setIsServerOptionsMenuOpen] = useState(false);
  const [isCommunitySettingsModalOpen, setIsCommunitySettingsModalOpen] = useState(false);
  const [isCommunityInviteModalOpen, setIsCommunityInviteModalOpen] = useState(false);
  const serverOptionsButtonRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [isChannelListModalOpen, setIsChannelListModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setPos({ x: e.clientX, y: e.clientY });
    setIsChannelListMenuOpen(true);
  };

  const openCreateChannelModal = () => {
    setModalMode("channel");
    setIsChannelListModalOpen(true);
    setIsChannelListMenuOpen(false);
  };

  const openCreateCategoryModal = () => {
    setModalMode("category");
    setIsChannelListModalOpen(true);
    setIsChannelListMenuOpen(false);
  };

  const closeModal = () => {
    setIsChannelListModalOpen(false);
    setModalMode(null);
  };

  const handleCreate = (name: string) => {
    if (modalMode === "channel") {
      setChannels((prev) => [
        ...prev,
        { channelId: crypto.randomUUID(), channelName: name },
      ]);
    } else if (modalMode === "category") {
      console.log("Create category:", name);
    }
  };

  const handleCommunityUpdate = (updatedData: CommunityData) => {
    setCommunityData(updatedData); 
  };

  const handleCommunityLeave = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const response = await fetch(`${apiUrl}/api/community/${communityData?.communityId}/leave`, {
        method: "DELETE",
        headers: {"Authorization" : `Bearer ${token}`}
      });
      if (response.ok) {
        navigate("/");
        setCommunities(prev => prev?.filter(c => c.community_id !== communityData?.communityId) || null);
      }
    } catch (error) {
      console.log("error leaving community: ", error)
    }
  }

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.type === "community_updated") {
        
        const communityData = {
            communityId: data.community_id,
            communityName: data.community_name,
            communityImage: data.community_image,
        }
        navigate(`/community/${communityId}`, { state: {communityData}, replace: true });
      }
    }

    const ws = window._ws?.ws;
    if (ws) {
      ws.addEventListener("message", handleMessage);
      return () => ws.removeEventListener("message", handleMessage);
    }
  }, [])

  return (
    <div className="w-[370px] h-screen border-r border-outline flex flex-col">
      <audio preload="auto" />
      <CommunityInviteModal isOpen={isCommunityInviteModalOpen} onClose={() => setIsCommunityInviteModalOpen(false)} />
      <CommunitySettingsModal communityData={communityData} onCommunityUpdate={handleCommunityUpdate} isOpen={isCommunitySettingsModalOpen} onClose={() => setIsCommunitySettingsModalOpen(false)} />
      <div className="w-full h-[60px] border-b border-outline flex items-center justify-between px-6 gap-2 flex-shrink-0">
        <div className="flex gap-2">
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
              d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6m-16.5-3a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3m-19.5 0a4.5 4.5 0 0 1 .9-2.7L5.737 5.1a3.375 3.375 0 0 1 2.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 0 1 .9 2.7m0 0a3 3 0 0 1-3 3m0 3h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Zm-3 6h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Z"
            />
          </svg>
          <div className="text-gray-100">{communityData?.communityName}</div>
        </div>
        <div className="flex flex-col relative">
        <button onClick={() => setIsServerOptionsMenuOpen(prev => !prev)} ref={serverOptionsButtonRef}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className={`size-5 text-gray-500 hover:text-gray-300 transition-transform duration-200 ${
            isServerOptionsMenuOpen ? "rotate-180 text-gray-300" : ""
            }`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m19.5 8.25-7.5 7.5-7.5-7.5"
            />
          </svg>
        </button>

       <ActionMenu
          isActionMenuOpen={isServerOptionsMenuOpen}
          onClose={() => setIsServerOptionsMenuOpen(false)}
          buttonRef={serverOptionsButtonRef}
          isServerOptions
          leaveBtn={!isOwner}
          onCommunityLeave={handleCommunityLeave}
          communitySettingsBtn={isOwner}
          onCommunitySettings={() => {
            setIsCommunitySettingsModalOpen(true);
            setIsServerOptionsMenuOpen(false);
          }}
          onCommunityInvite={() => {
            setIsCommunityInviteModalOpen(true);
            setIsServerOptionsMenuOpen(false);
          }}
        />
        </div>
      </div>

      <div onContextMenu={handleContextMenu} className="relative space-y-3 p-2 flex flex-col flex-1">
        {channels.length === 0 && (
          <div className="flex-1 flex flex-col justify-center items-center mt-[80px]">
            <div className="text-gray-400 text-sm">No channels yet</div>
          </div>
        )}

        <ActionMenu
          isActionMenuOpen={isChannelListMenuOpen}
          onClose={() => setIsChannelListMenuOpen(false)}
          position={pos}
          isChannelList={isOwner}
          onCreateChannel={openCreateChannelModal}
          onCreateCategory={openCreateCategoryModal}
        />
      </div>

      <ChannelListModal
        isOpen={isChannelListModalOpen}
        onClose={closeModal}
        onCreate={handleCreate}
        isCreateChannel={modalMode === "channel"}
        isCreateCategory={modalMode === "category"}
      />

      <div className="px-2 h-[80px] flex items-center flex-shrink-0 justify-center">
          <CurrentUserCard />
      </div>
    </div>
  );
}