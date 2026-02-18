import { useEffect, useState } from "react";
import Button from "../../common/Button";
import ModalCloseButton from "../../common/modals/ModalCloseButton";
import Input from "../Input";

type LinkAlertModalProps = {
    isOpen: boolean;
    onClose: () => void;
    link: string;
};

export default function LinkAlertModal({ isOpen, onClose, link }: LinkAlertModalProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [showFade, setShowFade] = useState(false);
    const [cachedLink, setCachedLink] = useState(link);

    useEffect(() => {
        if (link) setCachedLink(link);
    }, [link]);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            setTimeout(() => setShowFade(true), 10);
        } else {
            setShowFade(false);
            const timer = setTimeout(() => setIsVisible(false), 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleConfirm = () => {
        window.open(link, "_blank", "noopener,noreferrer");
        onClose();
    };

    if (!isVisible) return null;

    return (
        <div
            onClick={onClose}
            className={`fixed inset-0 z-50 bg-black/50 flex justify-center items-center transition-opacity duration-200 ${
                showFade ? "opacity-100" : "opacity-0"
            }`}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="border border-outline relative bg-onyx w-[400px] rounded-3xl"
            >
                <ModalCloseButton onClose={onClose} />
                <div className="p-6 flex gap-4 flex-col items-center bg-onyx w-[400px] rounded-3xl">
                    <div className="flex flex-col text-center gap-1">
                        <div className="font-bold text-[20px]">Hold on!</div>
                        <div className="text-gray-500">
                            Are you sure you want to open this link? It will take you to an external website.
                        </div>
                    </div>

                    <Input value={cachedLink} isLink />

                    <div className="flex w-full gap-4">
                        <Button text="Cancel" onClick={onClose} />
                        <Button text="Open Link" isGreen onClick={handleConfirm} />
                    </div>
                </div>
            </div>
        </div>
    );
}