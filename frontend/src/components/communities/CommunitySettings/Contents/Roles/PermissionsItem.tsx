import { useState } from "react";
import CheckIcon from "./CheckIcon";

type PermissionsItemProps = {
    text: string;
    icon?: React.ReactNode;
    onClick?: () => void;
    isDanger?: boolean;
}

export default function PermissionsItem({ text, icon, onClick, isDanger }: PermissionsItemProps) {
    const [isSelected, setIsSelected] = useState(false);

    return (
        <button
            onClick={() => {
                onClick?.();
                setIsSelected(prev => !prev);
            }}
            className={`
                ${isSelected
                    ? "bg-forestgreen text-gray-100 hover:bg-forestgreen"
                    : "bg-transparent border-transparent hover:bg-basalt text-gray-300"
                }
                ${isDanger ? "text-red-400" : ""}
                transition-all duration-200 w-full h-[44px] rounded-md
                text-left px-3 flex items-center justify-between
            `}
        >
            <div className="flex items-center gap-3">
                {icon && <span className="text-[16px] opacity-70">{icon}</span>}
                <span className="text-[14px]">{text}</span>
            </div>
            <CheckIcon isChecked={isSelected} />
        </button>
    );
}