import type React from "react";
import Icon from "./Icon";

type InputProps = {
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    placeholder?: string;
    svgPaths?: string[];
    value?: string;
    maxLength?: number;
    readOnly?: boolean;
    isLink?: boolean;
    bg?: string;
}
export default function Input({ onChange, onKeyDown, placeholder, svgPaths, value, maxLength, readOnly, isLink, bg = "bg-basalt" } : InputProps) {
    return (
        <div className={`border border-outline flex items-center ${bg} px-2 rounded-lg gap-2 w-full`}>
            {svgPaths && (
                <Icon svgPaths={svgPaths} className="size-5 text-gray-500" />
            )}
            <input 
                readOnly={readOnly}
                value={value}
                onChange={onChange}
                onKeyDown={onKeyDown}
                type="text" 
                maxLength={maxLength}
                className={`${isLink ? "text-blue-400 cursor-default pointer-events-none" : "text-gray-100"} ${bg} focus:outline-none h-[40px] border-outline flex justify-between items-center w-full`}
                placeholder={placeholder} 
            />
        </div>
    );
}