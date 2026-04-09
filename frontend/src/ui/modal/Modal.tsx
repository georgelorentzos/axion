import { useEffect, useState } from "react";
import ModalCloseButton from "./ModalCloseButton";
import { createPortal } from "react-dom";

type ModalProps = {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, children }: ModalProps) {
    const [showFade, setShowFade] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            const timer = setTimeout(() => setShowFade(true), 30);
            return () => clearTimeout(timer);
        } else {
            setShowFade(false);
            const timer = setTimeout(() => setIsVisible(false), 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible) return;

    return createPortal(
        <div
            onClick={onClose}
            className={`fixed inset-0 z-50 bg-black/50 flex justify-center items-center transition-opacity duration-200 ${
                showFade ? 'opacity-100' : 'opacity-0'
            }`}
        >
            <div onClick={(e) => e.stopPropagation()} className="border border-outline relative bg-onyx w-[400px] rounded-3xl">
                <ModalCloseButton onClose={onClose} />
                <div className="p-6 flex gap-4 flex-col items-center bg-onyx w-[400px] rounded-3xl">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
