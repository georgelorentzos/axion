import { useEffect, useRef, useState } from "react";

type DropdownProps = {
    isDropDownOpen: boolean;
    onClose: () => void;
    onRemoveFriend: () => void;
}

export default function DropDown({ isDropDownOpen, onClose, onRemoveFriend } : DropdownProps) {
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
            {/* <div className="border-t border-outline" />
            <button className="px-4 py-2.5 flex justify-start items-center w-full hover:bg-primaryhover transition-colors">
                Block User
            </button> */}
        </div>
    );
}