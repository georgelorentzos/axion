import { useEffect, useState } from "react";
import Input from "../common/Input";
import UploadImageProfile from "../common/UploadImageProfile";
import Button from "../common/Button";
import { useCommunities } from "../../contexts/useCommunities";

type CreateCommunityModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

export default function CreateCommunityModal({ isOpen, onClose }: CreateCommunityModalProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [showFade, setShowFade] = useState(false);
    const [isCreateServer, setIsCreateServer] = useState(false);
    const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;
    const token = localStorage.getItem('token');
    const [serverName, setServerName] = useState('');
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
        setTimeout(() => {setIsCreateServer(false);}, 200)
    }, [onClose]);

    const handleCreateServer = async () => {
        if (!token) return console.error("No token");

        setError("");
        
        try {
            const formData = new FormData();
            formData.append("community_name", serverName);
            if (communityImage) {
                formData.append("community_image", communityImage);
            }
            if (!serverName.trim()) {
                setError("Community name required.");
                return;
            }
            if (serverName.length == 0) {
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

            console.log("Server created!");
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
            console.error("failed to create server: ", {error})
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
            <div onClick={(e) => e.stopPropagation()} className="relative bg-onyx w-[400px] rounded-3xl border border-outline overflow-hidden">
                <button
                    className="absolute top-3 right-3 cursor-pointer text-white"
                    onClick={onClose}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="w-6 h-6 text-gray-500 hover:text-gray-300 transition duration-300"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                </button>
                {!isCreateServer ? (
                    <>

                <div className="p-6 flex gap-4 flex-col items-center bg-onyx w-[400px] rounded-3xl border border-outline">
                    <div className="flex flex-col text-center">
                        <div className="font-bold text-[20px]">Create Your Server</div>
                        <div className="text-gray-500">Your server is where you and your friends hangout. Make yours and start talking.</div>
                    </div>
                    <Button text="Create My Own" onClick={() => setIsCreateServer(true)} />
                    <Button text="Join a Server" isGreen />
                </div>
                </>
                ) : (
                <div className="p-6 flex gap-4 flex-col items-center bg-onyx w-[400px] rounded-3xl border border-outline">
                    <div className="flex flex-col text-center">
                        <div className="font-bold text-[20px]">Customize Your Server</div>
                        <div className="text-gray-500">Give your new server a personality with a name and an icon. You can always change it later.</div>
                    </div>
                    
                    <UploadImageProfile onFileSelect={setCommunityImage} />
                    {error && (
                        <div className="text-red-500 text-[12px]">{ error }</div>
                    )}
                    <Input onChange={(e) => setServerName(e.target.value)} />
                    <div className="flex w-full gap-4">
                        <Button text="Back" onClick={() => setIsCreateServer(false)} />
                        <Button text="Create" isGreen onClick={handleCreateServer} />
                    </div>
                </div>
                )}
          
            </div>
        </div>
    );
}
