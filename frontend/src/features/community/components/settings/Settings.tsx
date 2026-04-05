import { useEffect, useState, useCallback } from "react";
import SettingsSection from "../settings/SettingsSection";
import SettingsItem from "../settings/SettingsItem";
import ProfileContent from "../settings/content/Profile";
import RolesContent from "../settings/content/Roles";
import MembersContent from "../settings/content/Members";
import LogsContent from "./content/Logs";
import BansContent from "./content/Bans";
import ModalCloseButton from "../../../../ui/modal/ModalCloseButton";
import Modal from "../../../../ui/modal/Modal";
import Delete from "../../../../ui/modal/content/Delete";
import { type Community } from "../../types/community";
import { useCurrentUser } from "../../../user/contexts/useCurrentUser";
import { PERMISSIONS } from "../../../../constants/permissions";
import { useNavigate } from "react-router-dom";
import { useCommunities } from "../../contexts/useCommunities";
import { api } from "../../../../api/client";

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
    const { currentUser } = useCurrentUser();
    const navigate = useNavigate();
    const { setCommunities } = useCommunities();
    const isOwner = currentUser?.id === community?.ownerId;
    const isAdmin = currentUser?.permissions?.includes(PERMISSIONS.ADMINISTRATOR);
    const canManageProfile = isOwner || isAdmin || currentUser?.permissions?.includes(PERMISSIONS.MANAGE_COMMUNITY);
    const canManageRoles = isOwner || isAdmin || currentUser?.permissions?.includes(PERMISSIONS.MANAGE_ROLES);
    const canKick = isOwner || isAdmin || currentUser?.permissions?.includes(PERMISSIONS.KICK);
    const canBan = isOwner || isAdmin || currentUser?.permissions?.includes(PERMISSIONS.BAN);
    const canViewLogs = isOwner || isAdmin || currentUser?.permissions?.includes(PERMISSIONS.VIEW_LOGS);
    const canManageMembers = canKick || canBan;

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

    const getDefaultTab = useCallback(() => {
        if (canManageProfile) return "Profile";
        if (canManageRoles) return "Roles";
        if (canManageMembers) return "Members";
        if (canViewLogs) return "Logs";
        if (canBan) return "Bans";
        return "Profile";
    }, [canManageProfile, canManageRoles, canManageMembers, canViewLogs, canBan]);

    useEffect(() => {
        setTimeout(() => setSelectedTab(getDefaultTab()), 200);
    }, [onClose, getDefaultTab]);

    useEffect(() => {
        if (!isOpen) return;
        if (isOwner) return;

        const hasAnyPermission = canManageProfile || canManageRoles || canManageMembers || canViewLogs || canBan;
        if (!hasAnyPermission) {
            onClose();
            return;
        }

        const tabAccess: Record<string, boolean> = {
            Profile: canManageProfile,
            Roles: canManageRoles,
            Members: canManageMembers,
            Logs: canViewLogs,
            Bans: canBan,
        };

        if (!tabAccess[selectedTab]) {
            setSelectedTab(getDefaultTab());
        }
    }, [isOpen, isOwner, canManageProfile, canManageRoles, canManageMembers, canViewLogs, canBan]);

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

    const handleDeleteCommunity = async () => {
        if (!community?.id) return;
        try {
            const { response, data } = await api.communities.delete(community.id, community.name);
            if (response.ok) {
                navigate("/");
                setCommunities(prev => prev?.filter(c => c.id !== data.id) || null);
                setIsDeleteCommunityModal(false);
                onClose();
            }
        } catch (error) {
            console.log("Error deleting community: ", error);
        }
    };

    if (!isVisible) return null;

    return (
        <div className={`fixed inset-0 z-50 flex justify-center bg-onyx transition-opacity duration-200 ${
            showFade ? "opacity-100" : "opacity-0"
        }`}>

            <div className="w-[270px] shrink-0 border-r border-outline flex flex-col pt-16 overflow-y-auto">

                <div className="flex flex-col gap-2">
                    {canManageProfile && (
                        <SettingsSection title="COMMUNITY">
                            <SettingsItem text="Profile" onClick={() => setSelectedTab("Profile")} isSelected={selectedTab === "Profile"} />
                        </SettingsSection>
                    )}

                    {(canManageRoles || canManageMembers) && (
                        <SettingsSection title="PEOPLE">
                            {canManageRoles && <SettingsItem text="Roles" onClick={() => setSelectedTab("Roles")} isSelected={selectedTab === "Roles"} />}
                            {canManageMembers && <SettingsItem text="Members" onClick={() => setSelectedTab("Members")} isSelected={selectedTab === "Members"} />}
                        </SettingsSection>
                    )}

                    {(canViewLogs || canBan) && (
                        <SettingsSection title="MODERATION">
                            {canViewLogs && <SettingsItem text="Logs" onClick={() => setSelectedTab("Logs")} isSelected={selectedTab === "Logs"} />}
                            {canBan && <SettingsItem text="Bans" onClick={() => setSelectedTab("Bans")} isSelected={selectedTab === "Bans"} />}
                        </SettingsSection>
                    )}

                    {isOwner && (
                        <SettingsSection title="DANGER ZONE">
                            <SettingsItem text="Delete Community" isDanger onClick={() => setIsDeleteCommunityModal(true)} />
                        </SettingsSection>
                    )}
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