import { useEffect, useState } from "react";
import ModalCloseButton from "./ModalCloseButton";
import InviteFriend from "./content/InviteFriend";
import AddCommunity from "./content/AddCommunity";
import DeleteCommunity from "./content/DeleteCommunity";
import CreateCategory from "./content/CreateCategory";
import CreateChannel from "./content/CreateChannel";
import DeleteRole from "./content/DeleteRole";
import LinkAlert from "./content/LinkAlert";
import KickUser from "./content/KickUser";
import BanUser from "./content/BanUser";
import Alert from "./content/Alert";
import { type Community } from "../../../types/community";
import { type Role } from "../../../types/role";
import { type User } from "../../../types/user";

type ModalType =
  | "inviteFriend"
  | "addCommunity"
  | "deleteCommunity"
  | "createCategory"
  | "createChannel"
  | "deleteRole"
  | "linkAlert"
  | "kickUser"
  | "banUser"
  | "alert";

type ModalProps = {
    isOpen: boolean;
    onClose: () => void;
    type: ModalType;
    community?: Community;
    user?: User;
    role?: Role;
    link?: string;
    text?: string;
}

export default function Modal({ isOpen, onClose, type, community, user, role, link, text }: ModalProps){
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
    }, [isOpen])
    

    const renderContent = () => {
        switch(type) {
            case "inviteFriend":
                return <InviteFriend />;
            case "addCommunity":
                return <AddCommunity onClose={onClose} />;
            case "deleteCommunity":
                return <DeleteCommunity community={community} />;
            case "createCategory":
                return <CreateCategory />;
            case "createChannel":
                return <CreateChannel />;
            case "deleteRole":
                return <DeleteRole onClose={onClose} role={role} />;
            case "linkAlert":
                return <LinkAlert onClose={onClose} link={link} />;
            case "kickUser":
                return <KickUser user={user} onClose={onClose} />;
            case "banUser":
                return <BanUser user={user} onClose={onClose} />
            case "alert":
                return <Alert text={text} />
            default:
                return null;
        }
    };

    if (!isVisible) return;

    return(
        <div
        onClick={onClose}
            className={`fixed inset-0 z-50 bg-black/50 flex justify-center items-center transition-opacity duration-200 ${
                showFade ? 'opacity-100' : 'opacity-0'
            }`}
        >
            <div onClick={(e) => e.stopPropagation()} className="border border-outline relative bg-onyx w-[400px] rounded-3xl ">
                <ModalCloseButton onClose={onClose} />
                <div className="p-6 flex gap-4 flex-col items-center bg-onyx w-[400px] rounded-3xl">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}