import { useEffect } from "react";
import { icons } from "../../constants/Icons";
import Icon from "../Icon";

type ModalCloseButtonProps = {
    onClose: () => void;
    top?: string;
    right?: string;
}

const modalStack: (() => void)[] = [];

export default function ModalCloseButton({ onClose, top = "-top-2", right = "-right-2" }: ModalCloseButtonProps) {
    
    useEffect(() => {
        modalStack.push(onClose);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (modalStack[modalStack.length - 1] === onClose) {
                    onClose();
                }
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            const index = modalStack.indexOf(onClose);
            if (index > -1) {
                modalStack.splice(index, 1);
            }
        };
    }, [onClose]);

    return (
        <div className={`absolute ${top} ${right} z-50 flex justify-center items-center flex-col gap-1`}>
            <button
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 border border-outline bg-onyx hover:bg-basalt transition duration-200 rounded-full text-white"
            >
                <Icon svgPaths={icons.x} className="size-5 text-gray-100" />
            </button>
            <div className="text-gray-100 text-[12px] border border-outline bg-onyx px-2 rounded-full shadow-sm">
                ESC
            </div>
        </div>
    );
}