import CurrentUserCard from "../../../ui/CurrentUserCard";
import { useLocation, useParams } from "react-router-dom";
import React, { useState, useRef, useEffect } from "react";
import CommunitySettingsModal from "./settings/Settings";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "../../user/contexts/useCurrentUser";
import ActionMenu from "../../../ui/actionmenu/ActionMenu";
import ActionMenuButton from "../../../ui/actionmenu/ActionMenuButton";
import { useCommunities } from "../contexts/useCommunities";
import { useCommunity } from "../contexts/useCommunity";
import Modal from "../../../ui/modal/Modal";
import InviteFriend from "../../chat/components/InviteFriend";
import CreateItem from "../../../ui/modal/content/CreateItem";
import { type Community } from "../types/community";
import { api } from "../../../api/client";
interface LocationState {
  community?: Community;
}

type Channel = {
  channelId: string;
  channelName: string;
};

export default function ChannelList() {
  const location = useLocation();
  const { communityId } = useParams();
  const { communities, setCommunities, loading } = useCommunities();
  const { community, setCommunity } = useCommunity();
  const navigate = useNavigate();
  const { currentUser } = useCurrentUser();
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    setIsOwner(community?.ownerId === currentUser?.id);
  }, [community, currentUser]);

  useEffect(() => {
    if (loading) return;
    if (!communities) return;
    const isMember = communities.some(c => c.id === communityId);
    if (!isMember) {
      navigate("/");
    }
  }, [communities, loading, communityId]);

  useEffect(() => {
    const state = location.state as LocationState;
    if (state?.community) {
      setCommunity(state.community);
    }
  }, [location.state, communityId]);

  const [channels, setChannels] = useState<Channel[]>([]);
  const [isChannelListMenuOpen, setIsChannelListMenuOpen] = useState(false);
  const [isServerOptionsMenuOpen, setIsServerOptionsMenuOpen] = useState(false);
  const [isCommunitySettingsModalOpen, setIsCommunitySettingsModalOpen] = useState(false);
  const [isCommunityInviteModalOpen, setIsCommunityInviteModalOpen] = useState(false);
  const serverOptionsButtonRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false);
  const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] = useState(false);

  useEffect(() => {
    setIsChannelListMenuOpen(false);
  }, [isCreateCategoryModalOpen, isCreateChannelModalOpen]);

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setPos({ x: e.clientX, y: e.clientY });
    setIsChannelListMenuOpen(true);
  };

  const handleServerOptionsMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    setPos({ x: e.clientX, y: e.clientY });
  };

  const handleCommunityUpdate = (updatedData: Community) => {
    setCommunity(updatedData);
  };

  const handleCommunityLeave = async () => {
    try {
      const { response } = await api.communities.leave(community?.id!);
      if (response.ok) {
        navigate("/");
        setCommunities(prev => prev?.filter(c => c.id !== community?.id) || null);
      }
    } catch (error) {
      console.log("error leaving community: ", error);
    }
  };

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      if (data.type === "communityUpdated") {
        setCommunity(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            id: data.id,
            name: data.name,
            image: data.image,
          };
        });
      }
    };
    const ws = window._ws?.ws;
    if (ws) {
      ws.addEventListener("message", handleMessage);
      return () => ws.removeEventListener("message", handleMessage);
    }
  }, [communityId, navigate, setCommunity]);

  return (
    <div className="w-[370px] h-screen border-r border-outline flex flex-col">
      <audio preload="auto" />
      <Modal isOpen={isCommunityInviteModalOpen} onClose={() => setIsCommunityInviteModalOpen(false)}>
        <InviteFriend />
      </Modal>
      <CommunitySettingsModal community={community} onCommunityUpdate={handleCommunityUpdate} isOpen={isCommunitySettingsModalOpen} onClose={() => setIsCommunitySettingsModalOpen(false)} />
      <div className="w-full h-[60px] border-b border-outline flex items-center justify-between px-4 gap-2 flex-shrink-0">
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
          <div className="text-gray-100">{community?.name}</div>
        </div>
        <div className="flex flex-col relative">
          <button onClick={(e: any) => {
            setIsServerOptionsMenuOpen(prev => !prev);
            handleServerOptionsMenu(e);
            }} ref={serverOptionsButtonRef}>
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
            position={pos}
            isActionMenuOpen={isServerOptionsMenuOpen}
            onClose={() => setIsServerOptionsMenuOpen(false)}
            buttonRef={serverOptionsButtonRef}
          >
            <ActionMenuButton
              text="Settings"
              svgPaths={["M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z", "M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"]}
              onClick={() => {
                setIsCommunitySettingsModalOpen(true);
                setIsServerOptionsMenuOpen(false);
              }}
              isVisible={isOwner}
            />
            <ActionMenuButton
              text="Invite Friends"
              svgPaths={["M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"]}
              onClick={() => {
                setIsCommunityInviteModalOpen(true);
                setIsServerOptionsMenuOpen(false);
              }}
            />
            <ActionMenuButton
              text="Leave"
              svgPaths={["M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"]}
              onClick={handleCommunityLeave}
              isVisible={!isOwner}
            />
          </ActionMenu>
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
          canOpen={isOwner}
        >
          <ActionMenuButton
            text="Create Category"
            svgPaths={["M12 4.5v15m7.5-7.5h-15"]}
            onClick={() => setIsCreateCategoryModalOpen(true)}
          />
          <ActionMenuButton
            text="Create Channel"
            svgPaths={["M12 4.5v15m7.5-7.5h-15"]}
            onClick={() => setIsCreateChannelModalOpen(true)}
          />
        </ActionMenu>
      </div>

      <Modal isOpen={isCreateCategoryModalOpen} onClose={() => setIsCreateCategoryModalOpen(false)}>
        <CreateItem item="category" />
      </Modal>
      <Modal isOpen={isCreateChannelModalOpen} onClose={() => setIsCreateChannelModalOpen(false)}>
        <CreateItem item="channel" />
      </Modal>

      <div className="px-2 h-[80px] flex items-center flex-shrink-0 justify-center">
        <CurrentUserCard />
      </div>
    </div>
  );
}