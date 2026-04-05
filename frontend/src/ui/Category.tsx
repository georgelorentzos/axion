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
import ActionMenu from "./actionmenu/ActionMenu";
import ActionMenuButton from "./actionmenu/ActionMenuButton";
import { useCategories } from "../features/community/contexts/useCategories";
import { useChannels } from "../features/community/contexts/useChannels";

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
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={`size-3 transition-transform duration-200 ${isCategoryCollapsed ? "-rotate-90" : ""}`}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                    </button>
                    {(currentUser?.id === community?.ownerId || currentUser?.permissions?.includes(PERMISSIONS.ADMINISTRATOR) || currentUser?.permissions?.includes(PERMISSIONS.MANAGE_CHANNELS)) && (
                        <button onClick={() => setIsCreateChannelModalOpen(true)}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5 text-gray-500 hover:text-gray-300 transition duration-200">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
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
            <ActionMenu canOpen={currentUser?.id === community?.ownerId || (currentUser?.permissions?.includes(PERMISSIONS.ADMINISTRATOR) || currentUser?.permissions?.includes(PERMISSIONS.MANAGE_CHANNELS))} isActionMenuOpen={isActionMenuOpen} onClose={() => setIsActionMenuOpen(false)} position={pos}>
                <ActionMenuButton
                    onClick={() => { setIsDeleteModalOpen(true); setIsActionMenuOpen(false); }}
                    text={`Delete ${category.name}`}
                    isDanger
                    svgPaths={["m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"]}
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