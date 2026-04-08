import CurrentUserCard from "../../../ui/CurrentUserCard";
import { useLocation, useParams } from "react-router-dom";
import React, { useState, useRef, useEffect } from "react";
import CommunitySettingsModal from "./settings/Settings";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "../../user/contexts/useCurrentUser";
import ActionMenu from "../../../ui/actionmenu/ActionMenu";
import ActionMenuButton from "../../../ui/actionmenu/ActionMenuButton";
import { useCommunities } from "../../../ui/sidebar/contexts/useCommunities";
import { useCommunity } from "../contexts/useCommunity";
import Modal from "../../../ui/modal/Modal";
import InviteFriend from "../../../ui/modal/content/InviteFriend";
import Create from "../../../ui/modal/content/Create";
import { type Community } from "../types/community";
import { api } from "../../../api/client";
import { PERMISSIONS } from "../../../constants/permissions";
import { useCategories } from "../contexts/useCategories";
import Category from "../../../ui/Category";
import { useChannels } from "../contexts/useChannels";
import Channel from "../../../ui/Channel";
import Icon from "../../../ui/Icon";
import { icons } from "../../../constants/Icons";

interface LocationState {
  community?: Community;
}

export default function ChannelList() {
  const location = useLocation();
  const { communityId } = useParams();
  const { communities, setCommunities, loading } = useCommunities();
  const { community, setCommunity } = useCommunity();
  const navigate = useNavigate();
  const { currentUser } = useCurrentUser();
  const { categories, setCategories } = useCategories();
  const { channels, setChannels } = useChannels();

  const isOwner = community?.ownerId === currentUser?.id;
  const isAdmin = currentUser?.permissions?.includes(PERMISSIONS.ADMINISTRATOR);
  const canManageCommunity = isOwner || isAdmin || currentUser?.permissions?.includes(PERMISSIONS.MANAGE_COMMUNITY);
  const canManageRoles = isOwner || isAdmin || currentUser?.permissions?.includes(PERMISSIONS.MANAGE_ROLES);
  const canManageChannels = isOwner || isAdmin || currentUser?.permissions?.includes(PERMISSIONS.MANAGE_CHANNELS);
  const canKick = isOwner || isAdmin || currentUser?.permissions?.includes(PERMISSIONS.KICK);
  const canBan = isOwner || isAdmin || currentUser?.permissions?.includes(PERMISSIONS.BAN);
  const canViewLogs = isOwner || isAdmin || currentUser?.permissions?.includes(PERMISSIONS.VIEW_LOGS);
  const canAccessSettings = canManageCommunity || canManageRoles || canKick || canBan || canViewLogs;

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

  const handleCreateCategory = async (name: string) => {
    if (!communityId) return;
    const { data } = await api.categories.create(communityId, name);
    if (data.success) {
      setCategories(prev => [...(prev || []), { id: data.id, name: data.name }]);
    }
    setIsCreateCategoryModalOpen(false);
  };

  const handleCreateChannel = async (name: string) => {
    if (!communityId) return;
    const { data } = await api.channels.create(communityId, name);
    if (data.success) {
      setChannels(prev => [...(prev || []), { id: data.id, name: data.name, categoryId: data.categoryId }]);
    }
    setIsCreateChannelModalOpen(false);
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
          <div className="text-gray-100">{community?.name}</div>
        </div>
        <div className="flex flex-col relative">
          <button onClick={(e: any) => {
            setIsServerOptionsMenuOpen(prev => !prev);
            handleServerOptionsMenu(e);
            }} ref={serverOptionsButtonRef}>
            <Icon svgPaths={icons.arrowDown} 
            className={`size-5 text-gray-500 hover:text-gray-300 transition duration-200 ${
                isServerOptionsMenuOpen ? "rotate-180 text-gray-300" : ""
              }`} />
          </button>
          <ActionMenu
            position={pos}
            isOpen={isServerOptionsMenuOpen}
            onClose={() => setIsServerOptionsMenuOpen(false)}
            buttonRef={serverOptionsButtonRef}
          >
            <ActionMenuButton
              text="Settings"
              svgPaths={icons.settings}
              onClick={() => {
                setIsCommunitySettingsModalOpen(true);
                setIsServerOptionsMenuOpen(false);
              }}
              isVisible={canAccessSettings}
            />
            <ActionMenuButton
              text="Invite Friends"
              svgPaths={icons.invite}
              onClick={() => {
                setIsCommunityInviteModalOpen(true);
                setIsServerOptionsMenuOpen(false);
              }}
            />
            <ActionMenuButton
              text="Leave"
              svgPaths={icons.leave}
              onClick={handleCommunityLeave}
              isVisible={!isOwner}
            />
          </ActionMenu>
        </div>
      </div>

      <div onContextMenu={handleContextMenu} className="relative p-2 flex flex-col flex-1 overflow-y-auto">
        <div className="flex flex-col gap-1 flex-shrink-0">
          {channels?.map(channel => channel.categoryId === null && (
            <Channel key={channel.id} channel={channel} />
          ))}
          {categories?.map(category => (
            <Category key={category.id} category={category}>
              {channels?.map(channel => channel.categoryId === category.id && (
                <Channel key={channel.id} channel={channel} />
              ))}
            </Category>
          ))}
        </div>
        <ActionMenu
          isOpen={isChannelListMenuOpen}
          onClose={() => setIsChannelListMenuOpen(false)}
          position={pos}
          canOpen={canManageChannels}
        >
          <ActionMenuButton
            text="Create Category"
            svgPaths={icons.add}
            onClick={() => setIsCreateCategoryModalOpen(true)}
          />
          <ActionMenuButton
            text="Create Channel"
            svgPaths={icons.add}
            onClick={() => setIsCreateChannelModalOpen(true)}
          />
        </ActionMenu>
      </div>

      <Modal isOpen={isCreateCategoryModalOpen} onClose={() => setIsCreateCategoryModalOpen(false)}>
        <Create
          title="Create Category"
          description="Categories help you group channels."
          placeholder="Category Name"
          onSubmit={handleCreateCategory}
        />
      </Modal>
      <Modal isOpen={isCreateChannelModalOpen} onClose={() => setIsCreateChannelModalOpen(false)}>
        <Create
          title="Create Channel"
          description="Channels keep conversations organized."
          placeholder="Channel Name"
          onSubmit={handleCreateChannel}
        />
      </Modal>

      <div className="px-2 pb-2">
        <CurrentUserCard />
      </div>
    </div>
  );
}