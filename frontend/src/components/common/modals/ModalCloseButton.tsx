import { useEffect } from "react";

type ModalCloseButtonProps = {
    onClose: () => void;
    top?: string;
    right?: string;
}

export default function ModalCloseButton({ onClose, top = "-top-2", right = "-right-2" }: ModalCloseButtonProps) {
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onClose])

    return (
        <div className={`absolute ${top} ${right} z-10 flex justify-center items-center flex-col gap-1`}>
        <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 border border-outline bg-onyx hover:bg-basalt transition duration-200 rounded-full text-white"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth="1.5" stroke="currentColor" className="size-5 text-gray-100">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
        </button>
        <div className="text-gray-100 text-[12px] border border-outline bg-onyx px-2 rounded-full">ESC</div>
        </div>
    );
}