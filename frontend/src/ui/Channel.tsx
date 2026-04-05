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

type ChannelProps = {
    channel: Channel;
}

export default function Channel({ channel }: ChannelProps) {
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [pos, setPos] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
    const { communityId } = useParams();
    const { setChannels } = useChannels();
    const { currentUser } = useCurrentUser();
    const { community } = useCommunity();

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

    return (
        <>
            <button onContextMenu={handleContextMenu} className="rounded-lg w-full h-[40px] pl-2 pr-4 text-gray-500 flex gap-2 items-center hover:bg-basalt hover:text-gray-100 transition duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5 text-gray-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5" />
                </svg>
                {channel.name}
            </button>
            <ActionMenu canOpen={currentUser?.id === community?.ownerId || (currentUser?.permissions?.includes(PERMISSIONS.ADMINISTRATOR) || currentUser?.permissions?.includes(PERMISSIONS.MANAGE_CHANNELS))} isActionMenuOpen={isActionMenuOpen} onClose={() => setIsActionMenuOpen(false)} position={pos}>
                <ActionMenuButton
                    onClick={() => { setIsDeleteModalOpen(true); setIsActionMenuOpen(false); }}
                    text={`Delete ${channel.name}`}
                    isDanger
                    svgPaths={["m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"]}
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