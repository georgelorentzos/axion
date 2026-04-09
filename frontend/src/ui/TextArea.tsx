import { useRef, useEffect } from "react";
import type React from "react";
import Icon from "./Icon";

type TextAreaProps = {
    onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onKeyDown?: (e: React.KeyboardEvent) => void;
    placeholder?: string;
    svgPaths?: string[];
    value?: string;
    defaultValue: string;
    maxLength?: number;
    readOnly?: boolean;
    isLink?: boolean;
}

export default function TextArea({ onChange, onKeyDown, placeholder, svgPaths, value, defaultValue, maxLength, readOnly, isLink }: TextAreaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const autoResize = () => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
    };

    useEffect(() => {
        autoResize();
    }, [defaultValue, value]);

    return (
        <div className='border border-outline flex bg-basalt px-2 rounded-lg gap-2 w-full'>
            {svgPaths && (
                <Icon svgPaths={svgPaths} className="size-5 text-gray-500 hover:text-gray-300 transition duration-300 mt-3" />
            )}
            <textarea
                ref={textareaRef}
                readOnly={readOnly}
                value={value}
                defaultValue={defaultValue}
                onChange={(e) => {
                    autoResize();
                    onChange?.(e);
                }}
                onKeyDown={onKeyDown}
                maxLength={maxLength}
                className={`${isLink ? "text-blue-400 cursor-default pointer-events-none" : "text-gray-100"} bg-basalt focus:outline-none py-1 border-outline w-full resize-none overflow-hidden`}
                placeholder={placeholder}
            />
        </div>
    );
}