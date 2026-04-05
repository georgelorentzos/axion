import { type Category } from "../features/community/types/category";
import Modal from "./modal/Modal";
import CreateChannel from "./modal/content/CreateChannel";
import React, { useState } from "react";

type CategoryProps = {
    category: Category;
    children: React.ReactNode;
}

export default function Category({ category, children }: CategoryProps) {
    const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] = useState(false);
    const [isCategoryCollapsed, setIsCategoryCollapsed] = useState(false);
    
    return(
        <>
        <div className="flex flex-col gap-1 w-full">
            <div className="flex px-2 gap-2 justify-between">
            <button onClick={() => setIsCategoryCollapsed(prev => !prev)} className="text-gray-500 hover:text-gray-300 transition duration-200 flex gap-1 items-center group">
                {category.name}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={`size-3 transition-transform duration-200 ${isCategoryCollapsed ? "-rotate-90" : ""}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
            </button>
            <button onClick={() => setIsCreateChannelModalOpen(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5 text-gray-500 hover:text-gray-300 transition duration-200">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
            </button>
            </div>
            {!isCategoryCollapsed && children}
        </div>
        <Modal isOpen={isCreateChannelModalOpen} onClose={() => setIsCreateChannelModalOpen(false)}>
            <CreateChannel onClose={() => setIsCreateChannelModalOpen(false)} categoryId={category.id} />
        </Modal>
        </>
    );
}