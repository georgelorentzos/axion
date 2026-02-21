import { useState, useEffect } from "react";
import ModalCloseButton from "../../common/modals/ModalCloseButton";
import Button from "../../common/Button";
import { useParams } from "react-router-dom";

type DeleteRoleModalProps = {
    isOpen?: boolean;
    onClose: () => void;
    roleId?: string;
    roleName?: string;
    onDeleted?: (roleId: string) => void;
}

export default function DeleteRoleModal({ isOpen, onClose, roleId, roleName, onDeleted }: DeleteRoleModalProps) {
    const [showFade, setShowFade] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;
    const { communityId } = useParams();
    const [cachedName, setCachedName] = useState(roleName);

    useEffect(() => {
        if (roleName) setCachedName(roleName);
    }, [roleName]);

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

    const handleDeleteRole = async () => {
        if (!roleId) return;
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            const response = await fetch(`${apiUrl}/api/community/${communityId}/roles/${roleId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                onDeleted?.(roleId);
                onClose();
            }
        } catch (error) {
            console.log("Error deleting role: ", error)
        }
    }

    if (!isVisible) return null;

    return (
        <div
            onClick={onClose}
            className={`fixed inset-0 z-50 bg-black/50 flex justify-center items-center transition-opacity duration-200 ${showFade ? 'opacity-100' : 'opacity-0'}`}
        >
            <div onClick={(e) => e.stopPropagation()} className="border border-outline relative bg-onyx w-[400px] rounded-3xl">
                <ModalCloseButton onClose={onClose} />
                <div className="p-6 flex gap-4 flex-col items-center bg-onyx w-[400px] rounded-3xl">
                    <div className="flex flex-col text-center">
                        <div className="font-bold text-[20px]">Delete {cachedName}</div>
                        <div className="text-gray-500">Are you sure you want to delete this role? This action cannot be undone.</div>
                    </div>
                    <Button text="Delete" isDanger onClick={handleDeleteRole} />
                </div>
            </div>
        </div>
    );
}