import type React from "react";
import Icon from "./Icon";

type TextAreaProps = {
    onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    svgPaths?: string[];
    value?: string;
    maxLength?: number;
    readOnly?: boolean;
    isLink?: boolean;
}

export default function TextArea({ onChange, placeholder, svgPaths, value, maxLength, readOnly, isLink } : TextAreaProps) {
    return (
        <div className='border border-outline flex bg-basalt px-2 rounded-lg gap-2 w-full'>

            {svgPaths && (
                <Icon svgPaths={svgPaths} className="size-5 text-gray-500 hover:text-gray-300 transition duration-300 mt-3" />
            )}

            <textarea 
                readOnly={readOnly}
                value={value}
                onChange={onChange}
                maxLength={maxLength}
                className={` ${isLink ? "text-blue-400 cursor-default pointer-events-none" : "text-gray-100"} bg-basalt focus:outline-none min-h-[80px] py-2 border-outline flex justify-between items-center w-full resize-none`}
                placeholder={placeholder} 
            />
        </div>
    );
}