import React, { useState } from "react";
import { type Channel } from "../features/community/types/channel";
import ActionMenu from "./actionmenu/ActionMenu";
import ActionMenuButton from "./actionmenu/ActionMenuButton";
import { api } from "../api/client";
import { useParams } from "react-router-dom";
import { useChannels } from "../features/community/contexts/useChannels";
import Modal from "./modal/Modal";
import Delete from "./modal/content/Delete";
import { useCurrentUser } from "../features/user/contexts/useCurrentUser";
import { PERMISSIONS } from "../constants/permissions";
import { useCommunity } from "../features/community/contexts/useCommunity";
import { useNavigate } from "react-router-dom";
import { icons } from "../constants/Icons";
import Icon from "./Icon";

type ChannelProps = {
    channel: Channel;
}

export default function Channel({ channel }: ChannelProps) {
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [pos, setPos] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
    const { communityId, channelId } = useParams();
    const { setChannels } = useChannels();
    const { currentUser } = useCurrentUser();
    const { community } = useCommunity();
    const navigate = useNavigate();

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsActionMenuOpen(true);
        setPos({ x: e.clientX, y: e.clientY });
    };

    const handleDeleteChannel = async () => {
        if (!communityId) return;
        const { data } = await api.channels.delete(communityId, channel.id);
        setChannels(prev => prev?.filter(c => c.id !== data.id) || null);
        setIsDeleteModalOpen(false);
    };

    const handleClick = () => { 
        const stored = JSON.parse(localStorage.getItem("communities") || "[]");
        const filtered = stored.filter((item: { communityId: string }) => item.communityId !== community?.id);
        filtered.push({ communityId: community?.id, channelId: channel.id });
        localStorage.setItem("communities", JSON.stringify(filtered));
        navigate(`/community/${community?.id}/${channel.id}`, { state: { channel: channel } });
    };

    return (
        <>
            <button onClick={handleClick} onContextMenu={handleContextMenu} className={` ${channelId === channel.id ? `bg-basalt text-gray-100` : `text-gray-500 hover:bg-basalt hover:text-gray-100`} rounded-lg w-full h-[40px] pl-2 pr-4 flex gap-2 items-center transition duration-200`}>
                <Icon svgPaths={icons.hashtag} className="size-5 text-gray-500" />
                {channel.name}
            </button>
            <ActionMenu canOpen={currentUser?.id === community?.ownerId || (currentUser?.permissions?.includes(PERMISSIONS.ADMINISTRATOR) || currentUser?.permissions?.includes(PERMISSIONS.MANAGE_CHANNELS))} isOpen={isActionMenuOpen} onClose={() => setIsActionMenuOpen(false)} position={pos}>
                <ActionMenuButton
                    onClick={() => { setIsDeleteModalOpen(true); setIsActionMenuOpen(false); }}
                    text={`Delete ${channel.name}`}
                    isDanger
                    svgPaths={icons.delete}
                />
            </ActionMenu>
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
                <Delete
                    title={`Delete ${channel.name}`}
                    onConfirm={handleDeleteChannel}
                />
            </Modal>
        </>
    );
}