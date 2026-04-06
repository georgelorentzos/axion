import { useEffect, useState, useCallback } from "react";
import SettingsSection from "../../../../ui/settings/SettingsSection";
import SettingsItem from "../../../../ui/settings/SettingsItem";
import ProfileContent from "../settings/content/Profile";
import RolesContent from "../settings/content/Roles";
import MembersContent from "../settings/content/Members";
import LogsContent from "./content/Logs";
import BansContent from "./content/Bans";
import ModalCloseButton from "../../../../ui/modal/ModalCloseButton";
import Modal from "../../../../ui/modal/Modal";
import Delete from "../../../../ui/modal/content/Delete";
import { type Community } from "../../types/community";
import { useNavigate } from "react-router-dom";
import { useCommunities } from "../../../../ui/sidebar/contexts/useCommunities";
import { api } from "../../../../api/client";
import { useCurrentUser } from "../../../user/contexts/useCurrentUser";
import { PERMISSIONS } from "../../../../constants/permissions";

type CommunitySettingsModalProps = {
    isOpen: boolean;
    onClose: () => void;
    community?: Community;
    onCommunityUpdate: (data: Community) => void;
};

export default function CommunitySettingsModal({
    isOpen,
    onClose,
    community,
    onCommunityUpdate,
}: CommunitySettingsModalProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [showFade, setShowFade] = useState(false);
    const [selectedTab, setSelectedTab] = useState("Profile");
    const [isDeleteCommunityModal, setIsDeleteCommunityModal] = useState(false);
    const [childModalCount, setChildModalCount] = useState(0);
    const navigate = useNavigate();
    const { setCommunities } = useCommunities();
    const { currentUser } = useCurrentUser();

    const isOwner = community?.ownerId === currentUser?.id;
    const isAdmin = currentUser?.permissions?.includes(PERMISSIONS.ADMINISTRATOR);
    const canManageCommunity = isOwner || isAdmin || currentUser?.permissions?.includes(PERMISSIONS.MANAGE_COMMUNITY);
    const canManageRoles = isOwner || isAdmin || currentUser?.permissions?.includes(PERMISSIONS.MANAGE_ROLES);
    const canKick = isOwner || isAdmin || currentUser?.permissions?.includes(PERMISSIONS.KICK);
    const canBan = isOwner || isAdmin || currentUser?.permissions?.includes(PERMISSIONS.BAN);
    const canViewLogs = isOwner || isAdmin || currentUser?.permissions?.includes(PERMISSIONS.VIEW_LOGS);

    const hasChildModalOpen = isDeleteCommunityModal || childModalCount > 0;

    const registerChildModal = useCallback((isOpen: boolean) => {
        setChildModalCount((prev) => (isOpen ? prev + 1 : Math.max(0, prev - 1)));
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
    };

    const handleDeleteCommunity = async () => {
        if (!community?.id) return;
        try {
            const { response, data } = await api.communities.delete(community.id, community.name);
            if (response.ok) {
                navigate("/");
                setCommunities((prev) => prev?.filter((c) => c.id !== data.id) || null);
                setIsDeleteCommunityModal(false);
                onClose();
            }
        } catch (error) {
            console.log("Error deleting community: ", error);
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
                    <SettingsSection isVisible={canManageCommunity} title="COMMUNITY">
                        <SettingsItem isVisible={canManageCommunity} text="Profile" onClick={() => setSelectedTab("Profile")} isSelected={selectedTab === "Profile"} />
                    </SettingsSection>
                    <SettingsSection isVisible={canManageRoles || canKick || canBan} title="PEOPLE">
                        <SettingsItem isVisible={canManageRoles} text="Roles" onClick={() => setSelectedTab("Roles")} isSelected={selectedTab === "Roles"} />
                        <SettingsItem isVisible={canKick || canBan} text="Members" onClick={() => setSelectedTab("Members")} isSelected={selectedTab === "Members"} />
                    </SettingsSection>
                    <SettingsSection isVisible={canViewLogs || canBan} title="MODERATION">
                        <SettingsItem isVisible={canViewLogs} text="Logs" onClick={() => setSelectedTab("Logs")} isSelected={selectedTab === "Logs"} />
                        <SettingsItem isVisible={canBan} text="Bans" onClick={() => setSelectedTab("Bans")} isSelected={selectedTab === "Bans"} />
                    </SettingsSection>
                    <SettingsSection isVisible={isOwner} title="DANGER ZONE">
                        <SettingsItem isVisible={isOwner} text="Delete Community" isDanger onClick={() => setIsDeleteCommunityModal(true)} />
                    </SettingsSection>
                </div>
            </div>
            <div className="pt-16 w-[920px]">
                {renderContent()}
                <ModalCloseButton onClose={hasChildModalOpen ? () => {} : onClose} top="top-4" right="right-4" />
            </div>
            <Modal isOpen={isDeleteCommunityModal} onClose={() => setIsDeleteCommunityModal(false)}>
                <Delete
                    title={`Delete ${community?.name}`}
                    confirmText={community?.name}
                    onConfirm={handleDeleteCommunity}
                />
            </Modal>
        </div>
    );
}