import { type Category } from "../features/community/types/category";
import Modal from "./modal/Modal";
import Create from "./modal/content/Create";
import Delete from "./modal/content/Delete";
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import { useCurrentUser } from "../features/user/contexts/useCurrentUser";
import { useCommunity } from "../features/community/contexts/useCommunity";
import { PERMISSIONS } from "../constants/permissions";
import ActionMenu from "./action-menu/ActionMenu";
import ActionMenuButton from "./action-menu/ActionMenuButton";
import { useCategories } from "../features/community/contexts/useCategories";
import { useChannels } from "../features/community/contexts/useChannels";
import { icons } from "../constants/Icons";
import Icon from "./Icon";

type CategoryProps = {
    category: Category;
    children: React.ReactNode;
}

export default function Category({ category, children }: CategoryProps) {
    const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
    const [isCategoryCollapsed, setIsCategoryCollapsed] = useState(false);
    const { communityId } = useParams();
    const { currentUser } = useCurrentUser();
    const { community } = useCommunity();
    const [pos, setPos] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
    const { setCategories } = useCategories();
    const { setChannels } = useChannels();

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsActionMenuOpen(true);
        setPos({ x: e.clientX, y: e.clientY });
    };

    const handleCreateChannel = async (name: string) => {
        if (!communityId) return;
        const { data } = await api.channels.create(communityId, name, category.id);
        if (data.success) {
           setChannels(prev => [
            ...(prev || []), {
                id: data.id,
                name: data.name,
                categoryId: data.categoryId
            }
           ]);
        }
        setIsCreateChannelModalOpen(false);
    };

    const handleDeleteCategory = async () => {
        if (!communityId) return;
        const { data } = await api.categories.delete(communityId, category.id);
        setCategories(prev => prev?.filter(c => c.id !== data.id) || null);
        setChannels(prev => prev?.map(
            c => c.categoryId === category.id ? { ...c, categoryId: null } : c
        ) || null);
        setIsDeleteModalOpen(false);
    };

    return (
        <>
            <div className="flex flex-col gap-1 w-full" onContextMenu={handleContextMenu}>
                <div className="flex px-2 gap-2 justify-between">
                    <button onClick={() => setIsCategoryCollapsed(prev => !prev)} className="text-gray-500 hover:text-gray-300 transition duration-200 flex gap-1 items-center group">
                        {category.name}
                        <Icon svgPaths={icons.arrowDown} className={`size-3 transition-transform duration-200 ${isCategoryCollapsed ? "-rotate-90" : ""}`} />
                    </button>
                    {(currentUser?.id === community?.ownerId || currentUser?.permissions?.includes(PERMISSIONS.ADMINISTRATOR) || currentUser?.permissions?.includes(PERMISSIONS.MANAGE_CHANNELS)) && (
                        <button onClick={() => setIsCreateChannelModalOpen(true)}>
                            <Icon svgPaths={icons.add} className="size-5 text-gray-500 hover:text-gray-300 transition duration-200" />
                        </button>
                    )}
                </div>
                {!isCategoryCollapsed && children}
            </div>
            <Modal isOpen={isCreateChannelModalOpen} onClose={() => setIsCreateChannelModalOpen(false)}>
                <Create
                    title="Create Channel"
                    description="Channels keep conversations organized."
                    placeholder="Channel Name"
                    onSubmit={handleCreateChannel}
                />
            </Modal>
            <ActionMenu canOpen={currentUser?.id === community?.ownerId || (currentUser?.permissions?.includes(PERMISSIONS.ADMINISTRATOR) || currentUser?.permissions?.includes(PERMISSIONS.MANAGE_CHANNELS))} isOpen={isActionMenuOpen} onClose={() => setIsActionMenuOpen(false)} position={pos}>
                <ActionMenuButton
                    onClick={() => { setIsDeleteModalOpen(true); setIsActionMenuOpen(false); }}
                    text={`Delete ${category.name}`}
                    isDanger
                    svgPaths={icons.delete}
                />
            </ActionMenu>
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
                <Delete
                    title={`Delete ${category.name}`}
                    onConfirm={handleDeleteCategory}
                />
            </Modal>
        </>
    );
}