import { useEffect, useState } from "react";
import SettingsSection from "../CommunitySettings/SettingsSection";
import SettingsItem from "../CommunitySettings/SettingsItem";
import ModalCloseButton from "../../common/modals/ModalCloseButton";

type CommunitySettingsModalProps = {
    isOpen: boolean;
    onClose: () => void;
}

export default function CommunitySettingsModal(
    { isOpen, onClose } : CommunitySettingsModalProps
) {
    const [isVisible, setIsVisible] = useState(false);
    const [showFade, setShowFade] = useState(false);
    
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

    if (!isVisible) return null;

    return(
        <div onClick={onClose} className={`p-12 fixed inset-0 z-50 bg-black/50 flex justify-center items-center transition-opacity duration-200 ${
          showFade ? "opacity-100" : "opacity-0"
        }`}>
        
        
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex w-full h-full relative bg-onyx rounded-3xl"
        >

        <ModalCloseButton onClose={onClose} />
        
        <div className="flex-1 border-r border-outline flex items-center justify-end mr-4">
            <div className="pr-3 w-full max-w-[200px] flex flex-col gap-2">
                <SettingsSection title="SERVER">
                    <SettingsItem text="Server Profile" />
                </SettingsSection>

                <SettingsSection title="PEOPLE">
                    <SettingsItem text="Roles" />
                    <SettingsItem text="Members" />
                    <SettingsItem text="Invites" />
                    <SettingsItem text="Access" />
                    <SettingsItem text="Bans" />
                </SettingsSection>

                  <SettingsSection title="DANGER ZONE">
                    <SettingsItem text="Delete Server" isDanger />
                </SettingsSection>
            </div>
        </div>
        <div className="flex-1 rounded-br-3xl rounded-tr-3xl">

        </div>

        </div>

        </div>
    );
}