import { useEffect, useState } from "react";
import SettingsSection from "../CommunitySettings/SettingsSection";
import SettingsItem from "../CommunitySettings/SettingsItem";
import ProfileContent from "../CommunitySettings/Contents/ProfileContent";
import RolesContent from "../CommunitySettings/Contents/RolesContent";
import MembersContent from "../CommunitySettings/Contents/MembersContent";
import ModalCloseButton from "../../common/modals/ModalCloseButton";

type CommunityData = {
    communityId: string;
    communityName: string;
    communityImage: string;
}

type CommunitySettingsModalProps = {
    isOpen: boolean;
    onClose: () => void;
    communityData?: CommunityData;
    onCommunityUpdate: (data: CommunityData) => void;
}

export default function CommunitySettingsModal(
    { isOpen, onClose, communityData, onCommunityUpdate }: CommunitySettingsModalProps
) {
    const [isVisible, setIsVisible] = useState(false);
    const [showFade, setShowFade] = useState(false);
    const [selectedTab, setSelectedTab] = useState("Profile");

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            setTimeout(() => setShowFade(true), 10);
        } else {
            setShowFade(false);
            const timer = setTimeout(() => setIsVisible(false), 200);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    useEffect(() => {
        setTimeout(() => setSelectedTab("Profile"), 200);
    }, [onClose]);

    const renderContent = () => {
        switch (selectedTab) {
            case "Profile":
                return <ProfileContent communityData={communityData} onCommunityUpdate={onCommunityUpdate} />;
            case "Roles":
                return <RolesContent />;
            case "Members":
                return <MembersContent />;
        }
    }

    if (!isVisible) return null;

    return (
        <div className={`fixed inset-0 z-50 flex justify-center bg-onyx transition-opacity duration-200 ${
            showFade ? "opacity-100" : "opacity-0"
        }`}>

            <div className="w-[270px] shrink-0 border-r border-outline flex flex-col pt-16 overflow-y-auto">

                <div className="flex flex-col gap-2">
                    <SettingsSection title="COMMUNITY">
                        <SettingsItem text="Profile" onClick={() => setSelectedTab("Profile")} isSelected={selectedTab === "Profile"} />
                    </SettingsSection>
                        
                    <SettingsSection title="PEOPLE">
                        <SettingsItem text="Roles" onClick={() => setSelectedTab("Roles")} isSelected={selectedTab === "Roles"} />
                        <SettingsItem text="Members" onClick={() => setSelectedTab("Members")} isSelected={selectedTab === "Members"} />
                        <SettingsItem text="Access" onClick={() => setSelectedTab("Access")} isSelected={selectedTab === "Access"} />
                        <SettingsItem text="Bans" onClick={() => setSelectedTab("Bans")} isSelected={selectedTab === "Bans"} />
                    </SettingsSection>
                        
                    <SettingsSection title="DANGER ZONE">
                        <SettingsItem text="Delete Community" isDanger />
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