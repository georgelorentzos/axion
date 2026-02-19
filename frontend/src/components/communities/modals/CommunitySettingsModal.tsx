import { useEffect, useState } from "react";
import SettingsSection from "../CommunitySettings/SettingsSection";
import SettingsItem from "../CommunitySettings/SettingsItem";
import ModalCloseButton from "../../common/modals/ModalCloseButton";
import ProfileContent from "../CommunitySettings/Contents/ProfileContent";
import RolesContent from "../CommunitySettings/Contents/RolesContent";
import MembersContent from "../CommunitySettings/Contents/MembersContent";

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
    { isOpen, onClose, communityData, onCommunityUpdate } : CommunitySettingsModalProps
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
            const timer = setTimeout(() => setIsVisible(false), 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    useEffect(() => {
        setTimeout(() => setSelectedTab("Profile"), 200);
    }, [onClose]);

    const renderContent = () => {
        switch(selectedTab) {
            case "Profile":
                return <ProfileContent communityData={communityData} onCommunityUpdate={onCommunityUpdate} />;
            case "Roles":
                return <RolesContent />;
            case "Members":
                return <MembersContent />;
        }
    }

    if (!isVisible) return null;

    return(
        <div onClick={onClose} className={`p-10 fixed inset-0 z-50 bg-black/50 flex justify-center items-center transition-opacity duration-200 ${
          showFade ? "opacity-100" : "opacity-0"
        }`}>
        
        
        <div
          onClick={(e) => e.stopPropagation()}
          className="h-[480px] flex py-16 border border-outline flex relative bg-onyx rounded-3xl"
        >

        <ModalCloseButton onClose={onClose} />
        
        <div className="w-[200px] shrink-0 border-r border-outline flex items-start justify-end">
            <div className="w-full flex flex-col gap-2">
                <SettingsSection title="COMMUNITY">
                    <SettingsItem text="Profile" onClick={() => setSelectedTab("Profile")} />
                </SettingsSection>

                <SettingsSection title="PEOPLE">
                    <SettingsItem text="Roles" onClick={() => setSelectedTab("Roles")} />
                    <SettingsItem text="Members" onClick={() => setSelectedTab("Members")} />
                    <SettingsItem text="Access" onClick={() => setSelectedTab("Access")} />
                    <SettingsItem text="Bans" onClick={() => setSelectedTab("Bans")} />
                </SettingsSection>

                <SettingsSection title="DANGER ZONE">
                    <SettingsItem text="Delete Community" isDanger />
                </SettingsSection>
            </div>
        </div>

        <div className="w-[880px] shrink-0 rounded-br-3xl rounded-tr-3xl">
            {renderContent()}
        </div>

        </div>
        </div>
    );
}