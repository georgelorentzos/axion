import { useEffect, useState } from "react";
import Input from "../../common/Input";
import UploadImageProfile from "../../common/UploadImageProfile";
import Button from "../../common/Button";
import { useCommunities } from "../../../contexts/useCommunities";
import ModalCloseButton from "../../common/modals/ModalCloseButton";

type CreateCommunityModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

export default function CreateCommunityModal({ isOpen, onClose }: CreateCommunityModalProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [showFade, setShowFade] = useState(false);
    const [isCreateCommunity, setIsCreateCommunity] = useState(false);
    const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;
    const token = localStorage.getItem('token');
    const [communityName, setCommunityName] = useState('');
    const [communityImage, setCommunityImage] = useState<File | null>(null);
    const { setCommunities } = useCommunities();
    const [error, setError] = useState('');

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
        setTimeout(() => {setIsCreateCommunity(false);}, 200)
    }, [onClose]);

    const handleCreateCommunity = async () => {
        if (!token) return console.error("No token");

        setError("");
        
        try {
            const formData = new FormData();
            formData.append("community_name", communityName);
            if (communityImage) {
                formData.append("community_image", communityImage);
            }
            if (!communityName.trim()) {
                setError("Community name required.");
                return;
            }
            if (communityName.length == 0) {
                setError("Community name required.");
                return;
            }

            const response = await fetch(`${apiUrl}/api/community/create`, {
                method: 'POST',
                headers: {
                    "Authorization" : `Bearer ${token}`
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.detail || "Something went wrong.");
                console.error("Create community failed:", response.status, data);
                return;
            }           

            console.log("Community created!");
            setCommunities(prev => [
            {
            community_id: data.community_id,
            community_name: data.community_name,
            community_image: data.community_image,
            },
            ...(prev || []),
            ]);
            onClose();
            
        } catch (error) {
            console.error("failed to create community: ", {error})
        }
    };

    useEffect(() => {
        if (!error) return;
        const timer = setTimeout(() => {
            setError("");
        }, 3000);

        return () => clearTimeout(timer);
    }, [error])

    if (!isVisible) return null;

    return (
        <div
        onClick={onClose}
            className={`fixed inset-0 z-50 bg-black/50 flex justify-center items-center transition-opacity duration-200 ${
                showFade ? 'opacity-100' : 'opacity-0'
            }`}
        >
            <div onClick={(e) => e.stopPropagation()} className="relative bg-onyx w-[400px] rounded-3xl ">
                <ModalCloseButton onClose={onClose} />
                {!isCreateCommunity ? (
                    <>

                <div className="p-6 flex gap-4 flex-col items-center bg-onyx w-[400px] rounded-3xl">
                    <div className="flex flex-col text-center">
                        <div className="font-bold text-[20px]">Create Your Community</div>
                        <div className="text-gray-500">Your community is where you and your friends hangout. Make yours and start talking.</div>
                    </div>
                    <Button text="Create My Own" onClick={() => setIsCreateCommunity(true)} />
                    <Button text="Join a Community" isGreen />
                </div>
                </>
                ) : (
                <div className="p-6 flex gap-4 flex-col items-center bg-onyx w-[400px] rounded-3xl">
                    <div className="flex flex-col text-center">
                        <div className="font-bold text-[20px]">Customize Your Community</div>
                        <div className="text-gray-500">Give your community a new name and a cool icon. You can always change them later.</div>
                    </div>
                    
                    <UploadImageProfile onFileSelect={setCommunityImage} />
                    {error && (
                        <div className="text-red-500 text-[12px]">{ error }</div>
                    )}
                    <Input 
                    onChange={(e) => setCommunityName(e.target.value)} 
                    placeholder="Community Name" 
                    svgD="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6m-16.5-3a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3m-19.5 0a4.5 4.5 0 0 1 .9-2.7L5.737 5.1a3.375 3.375 0 0 1 2.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 0 1 .9 2.7m0 0a3 3 0 0 1-3 3m0 3h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Zm-3 6h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Z"
                    />
                    <div className="flex w-full gap-4">
                        <Button text="Back" onClick={() => setIsCreateCommunity(false)} />
                        <Button text="Create" isGreen onClick={handleCreateCommunity} />
                    </div>
                </div>
                )}
          
            </div>
        </div>
    );
}
