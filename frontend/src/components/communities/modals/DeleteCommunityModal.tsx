import { useState, useEffect } from "react";
import ModalCloseButton from "../../common/modals/ModalCloseButton";
import Button from "../../common/Button";
import Input from "../../common/Input";
import { useCommunities } from "../../../contexts/useCommunities";
import { useNavigate } from "react-router-dom";

type CommunityData = {
    communityId: string;
    communityName: string;
    communityImage: string;
}

type DeleteCommunityModalProps = {
    isOpen?: boolean;
    onClose: () => void;
    communityData?: CommunityData;
}

export default function DeleteCommunityModal({ isOpen, onClose, communityData }: DeleteCommunityModalProps) {
    const [showFade, setShowFade] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [confirmInput, setConfirmInput] = useState('');
    const [error, setError] = useState('');
    const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;
    const { setCommunities } = useCommunities();
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            if (error) {
                setError('');
            }
        }, 3000)
        return () => clearTimeout(timer);
    }, [error]);

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

    const handleDeleteCommunity = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            const response = await fetch(`${apiUrl}/api/community/${communityData?.communityId}?community_name=${encodeURIComponent(confirmInput)}`, {
                method: "DELETE",
                headers: {"Authorization": `Bearer ${token}`}
            });
            const data = await response.json();
            if (!response.ok) {
                setError(data.detail);
                return;
            }
            navigate("/");
            setCommunities(communities => communities?.filter(c => c.community_id !== data.community_id) || null);
        } catch (error) {
            setError('Connection error.');
        }
    }

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
                    <div className="flex flex-col text-center">
                        <div className="font-bold text-[20px]">Delete {communityData?.communityName}</div>
                        <div className="text-gray-500">Are you sure you want to delete this community? This action cannot be undone.</div>
                    </div>
                    {error && <div className="text-crimson text-sm text-center">{error}</div>}
                    <Input placeholder="Enter community name" onChange={(e) => setConfirmInput(e.target.value)} />
                    <Button text="Delete" isDanger onClick={handleDeleteCommunity} />
                </div>
        </div>
    </div>
    );
}