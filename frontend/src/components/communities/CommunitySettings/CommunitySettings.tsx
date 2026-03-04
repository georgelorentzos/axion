import { useEffect, useState, useCallback } from "react";
import SettingsSection from "../CommunitySettings/SettingsSection";
import SettingsItem from "../CommunitySettings/SettingsItem";
import ProfileContent from "../CommunitySettings/Contents/ProfileContent";
import RolesContent from "../CommunitySettings/Contents/RolesContent";
import MembersContent from "../CommunitySettings/Contents/MembersContent";
import LogsContent from "./Contents/LogsContent";
import BansContent from "./Contents/BansContent";
import ModalCloseButton from "../../common/modal/ModalCloseButton";
import Modal from "../../common/modal/Modal";
import { type Community } from "../../../types/community";

type CommunitySettingsModalProps = {
    isOpen: boolean;
    onClose: () => void;
    community?: Community;
    onCommunityUpdate: (data: Community) => void;
}

export default function CommunitySettingsModal(
    { isOpen, onClose, community, onCommunityUpdate }: CommunitySettingsModalProps
) {
    const [isVisible, setIsVisible] = useState(false);
    const [showFade, setShowFade] = useState(false);
    const [selectedTab, setSelectedTab] = useState("Profile");
    const [isDeleteCommunityModal, setIsDeleteCommunityModal] = useState(false);
    const [childModalCount, setChildModalCount] = useState(0);

    const hasChildModalOpen = isDeleteCommunityModal || childModalCount > 0;

    const registerChildModal = useCallback((isOpen: boolean) => {
        setChildModalCount(prev => isOpen ? prev + 1 : Math.max(0, prev - 1));
    }, []);

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

    useEffect(() => {
        setTimeout(() => setSelectedTab("Profile"), 200);
    }, [onClose]);

    const renderContent = () => {
        switch (selectedTab) {
            case "Profile":
                return <ProfileContent community={community} onCommunityUpdate={onCommunityUpdate} />;
            case "Roles":
                return <RolesContent onChildModalChange={registerChildModal} />;
            case "Members":
                return <MembersContent onChildModalChange={registerChildModal} />;
            case "Logs":
                return <LogsContent />;
            case "Bans":
                return <BansContent />;
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
                    </SettingsSection>

                    <SettingsSection title="MODERATION">
                        <SettingsItem text="Logs" onClick={() => setSelectedTab("Logs")} isSelected={selectedTab === "Logs"} />
                        <SettingsItem text="Bans" onClick={() => setSelectedTab("Bans")} isSelected={selectedTab === "Bans"} />
                    </SettingsSection>
                        
                    <SettingsSection title="DANGER ZONE">
                        <SettingsItem text="Delete Community" isDanger onClick={() => setIsDeleteCommunityModal(true)} />
                    </SettingsSection>
                </div>
            </div>

            <div className="pt-16 w-[920px]">
                {renderContent()}

                <ModalCloseButton onClose={hasChildModalOpen ? () => {} : onClose} top="top-4" right="right-4" />
            </div>

            <Modal isOpen={isDeleteCommunityModal} onClose={() => setIsDeleteCommunityModal(false)} type="deleteCommunity" community={community} />

        </div>
    );
}