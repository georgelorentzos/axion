import { useEffect, useRef, useState } from "react";

type DropdownProps = {
    isDropDownOpen: boolean;
    onClose: () => void;
    onRemoveFriend: () => void;
    onDeleteConversation?: () => void;
    removeDmBtn?: boolean;
}

export default function DropDown({ isDropDownOpen, onClose, onRemoveFriend, onDeleteConversation , removeDmBtn } : DropdownProps) {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isDropDownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isDropDownOpen, onClose]);

    useEffect(() => {
        if (isDropDownOpen) {
            setIsVisible(true);
        } else {
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [isDropDownOpen]);

    if (!isVisible) return null;
    
    return (
        <div 
            ref={dropdownRef}
            className={`z-[2] bg-field border border-outline w-max h-auto absolute right-2 top-7 rounded-xl shadow-lg transition-opacity duration-200 ${isDropDownOpen ? 'opacity-100' : 'opacity-0'}`}
        >
            <button onClick={onRemoveFriend} className="px-4 flex justify-start items-center w-full py-2 hover:bg-primaryhover gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 text-gray-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                </svg>
                Remove Friend
            </button>
            {removeDmBtn && (
                <>
                <div className="border-t border-outline" />
                <button onClick={onDeleteConversation} className="px-4 flex justify-start items-center w-full py-2 hover:bg-primaryhover gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 text-gray-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                    Delete
                </button>
                </>
            )}
            {/* <div className="border-t border-outline" />
            <button className="px-4 py-2.5 flex justify-start items-center w-full hover:bg-primaryhover transition-colors">
                Block User
            </button> */}
        </div>
    );
}