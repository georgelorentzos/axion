import { useEffect, useRef } from "react";

type TextAreaProps = {
    onChange?: (value: string) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
    placeholder?: string;
    value?: string;
    defaultValue?: string;
    maxLength?: number;
    className?: string;
};

export default function TextArea({ onChange, onKeyDown, placeholder, defaultValue, value, maxLength, className }: TextAreaProps) {
    const editableRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (editableRef.current && defaultValue) {
            editableRef.current.textContent = defaultValue;
        }
    }, []);

    useEffect(() => {
        if (editableRef.current && value === '') {
            editableRef.current.innerHTML = '';
        }
    }, [value]);

    const handleInput = () => {
        const el = editableRef.current;
        if (!el) return;
        let text = el.textContent || "";

        if (text.trim() === "") {
            el.innerHTML = "";
        }

        if (maxLength && text.length > maxLength) {
            text = text.slice(0, maxLength);
            el.textContent = text;
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(el);
            range.collapse(false);
            sel?.removeAllRanges();
            sel?.addRange(range);
        }
        onChange?.(text);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
        }
        onKeyDown?.(e);
    };

    return (
        <div
            ref={editableRef}
            onInput={handleInput}
            contentEditable={true}
            suppressContentEditableWarning
            onKeyDown={handleKeyDown}
            data-placeholder={placeholder}
            className={`${className} text-[14px] text-gray-100 bg-transparent focus:outline-none px-3 py-1 w-full break-words outline-none leading-snug min-w-0 overflow-hidden rounded-2xl empty:before:content-[attr(data-placeholder)] empty:before:text-gray-500`}
        />
    );
}