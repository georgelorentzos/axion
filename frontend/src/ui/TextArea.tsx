import { useEffect, useRef } from "react";

type TextAreaProps = {
    onChange?: (value: string) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
    placeholder?: string;
    defaultValue?: string;
    clearSignal?: number;
    maxLength?: number;
    className?: string;
};

export default function TextArea({ onChange, onKeyDown, placeholder, defaultValue, clearSignal, maxLength, className }: TextAreaProps) {
    const editableRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (editableRef.current && defaultValue) {
            editableRef.current.textContent = defaultValue;
        }
    }, []);

    useEffect(() => {
        if (clearSignal && editableRef.current) {
            editableRef.current.innerHTML = '';
        }
    }, [clearSignal]);

    const handleInput = () => {
        const el = editableRef.current;
        if (!el) return;

        let text = el.innerText || "";

        if (text.trim() === "") {
            el.innerHTML = "";
            onChange?.("");
            return;
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

        if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();

            const sel = window.getSelection();
            if (!sel?.rangeCount) return;

            const range = sel.getRangeAt(0);
            range.deleteContents();

            const br = document.createElement('br');
            range.insertNode(br);

            const isAtEnd = !br.nextSibling ||
                (br.nextSibling.nodeType === Node.TEXT_NODE && br.nextSibling.textContent === '');

            if (isAtEnd) {
                const anchor = document.createElement('br');
                br.after(anchor);
            }

            range.setStartAfter(br);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);

            handleInput();
        }

        onKeyDown?.(e);
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    };

    return (
        <div
            ref={editableRef}
            onInput={handleInput}
            onPaste={handlePaste}
            contentEditable={true}
            suppressContentEditableWarning
            onKeyDown={handleKeyDown}
            role="textbox"
            aria-multiline="true"
            aria-placeholder={placeholder}
            data-placeholder={placeholder}
            className={`${className} text-[14px] text-gray-100 bg-transparent focus:outline-none px-3 py-1 w-full break-words outline-none leading-snug min-w-0 overflow-hidden rounded-2xl whitespace-pre-wrap empty:before:content-[attr(data-placeholder)] empty:before:text-gray-500`}
        />
    );
}