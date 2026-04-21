import { useEffect, useState } from "react";
import SettingsSection from "../../../../ui/settings/SettingsSection";
import SettingsItem from "../../../../ui/settings/SettingsItem";
import ModalCloseButton from "../../../../ui/modal/ModalCloseButton";
import AccountContent from "./content/Account";

type UserSettingsModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

export default function UserSettingsModal({
    isOpen,
    onClose,
}: UserSettingsModalProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [showFade, setShowFade] = useState(false);
    const [selectedTab, setSelectedTab] = useState("Account");

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            const timer = setTimeout(() => setShowFade(true), 30);
            return () => clearTimeout(timer);
        } else {
            setShowFade(false);
            const timer = setTimeout(() => setIsVisible(false), 200);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const renderContent = () => {
        switch (selectedTab) {
            case "Account":
                return <AccountContent />;
        }
    };

    if (!isVisible) return null;

    return (
        <div
            className={`fixed inset-0 z-50 flex justify-center bg-onyx transition-opacity duration-200 ${
                showFade ? "opacity-100" : "opacity-0"
            }`}
        >
            <div className="w-[270px] shrink-0 border-r border-outline flex flex-col pt-16 overflow-y-auto">
                <div className="flex flex-col gap-2">
                    <SettingsSection title="User Settings" isVisible={true}>
                        <SettingsItem text="My Account" onClick={() => setSelectedTab("Account")} isSelected={selectedTab === "Account"} isVisible={true} />
                    </SettingsSection>
                </div>
            </div>
            <div className="pt-16 w-[920px]">
                {renderContent()}
                <ModalCloseButton onClose={onClose} top="top-4" right="right-4" />
            </div>
        </div>
    );
}