import { useEffect, useState } from "react";
import Input from "../../Input";
import Button from "../../Button";
import UploadImageProfile from "../../UploadImageProfile";
import { useCommunities } from "../../../../contexts/communities/useCommunities";
import { useNavigate } from "react-router-dom";

type AddCommunityProps = {
    onClose: () => void;
}

export default function AddCommunity({ onClose }: AddCommunityProps) {
    const [isCreateCommunity, setIsCreateCommunity] = useState(false);
    const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;
    const token = localStorage.getItem('token');
    const [communityName, setCommunityName] = useState('');
    const [communityImage, setCommunityImage] = useState<File | null>(null);
    const { setCommunities } = useCommunities();
    const [error, setError] = useState('');
    const [isJoinCommunity, setIsJoinCommunity] = useState(false);
    const domainUrl = window.GLOBAL_ENV.PRIMARY_DOMAIN;
    const [joinCommunityId, setJoinCommunityId] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        setTimeout(() => { setIsCreateCommunity(false); }, 200);
    }, [onClose]);

    const handleCreateCommunity = async () => {
        if (!token) return;

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
                    "Authorization": `Bearer ${token}`
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
                ...(prev || []),
                {
                    id: data.id,
                    name: data.name,
                    image: data.image,
                    createdAt: data.createdAt,
                    ownerId: data.ownerId,
                },
            ]);
            onClose();
            setCommunityImage(null);

        } catch (error) {
            console.error("failed to create community: ", { error });
        }
    };

    const handleJoinCommunity = async () => {
        if (!token) return;
        if (!joinCommunityId) return;
        setError("");
        let finalId = joinCommunityId;
        if (finalId.startsWith("http")) {
            finalId = joinCommunityId.split("/").pop() || "";
        }
        try{
            const response = await fetch(`${apiUrl}/api/community/${finalId}/join`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (!response.ok) {
                setError(data.detail || "Something went wrong.");
                console.error("Join community failed:", response.status, data);
                return;
            }
            const navData = {
                communityId: data.id,
                communityName: data.name || "",
                communityImage: data.image || "",
                communityCreatedAt: data.createdAt || "",
                communityOwnerId: data.community?.ownerId || "",
            };
            setCommunities((prev) => {
              const already = prev?.some((c) => c.id === data.id);
              if (already) return prev;
              return [
                ...(prev || []),
                {
                  id: data.id || "",
                  name: data.name || "",
                  image: data.image || "",
                  createdAt: data.createdAt || "",
                  ownerId: data.community?.ownerId || "",
                },
              ];
            });
            navigate(`/community/${finalId}`, { state: { community: navData } });
            onClose();
            setJoinCommunityId('');
        } catch (error) {
            console.error("failed to join community: ", { error });
        }
    }

    useEffect(() => {
        if (!error) return;
        const timer = setTimeout(() => {
            setError("");
        }, 3000);

        return () => clearTimeout(timer);
    }, [error]);

    return (
        <>
            {!isCreateCommunity && !isJoinCommunity && (
                <>
                    <div className="flex flex-col text-center">
                        <div className="font-bold text-[20px]">Create Your Community</div>
                        <div className="text-gray-500">Your community is where you and your friends hangout. Make yours and start talking.</div>
                    </div>
                    <Button text="Create My Own" onClick={() => setIsCreateCommunity(true)} />
                    <Button text="Join a Community" isGreen onClick={() => setIsJoinCommunity(true)} />
                </>
            )}

            {isCreateCommunity && (
                <>
                    <div className="flex flex-col text-center">
                        <div className="font-bold text-[20px]">Customize Your Community</div>
                        <div className="text-gray-500">Give your community a new name and a cool icon. You can always change them later.</div>
                    </div>

                    <UploadImageProfile onFileSelect={setCommunityImage} />
                    {error && (
                        <div className="text-red-500 text-[12px]">{error}</div>
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
                </>
            )}

            {isJoinCommunity && (
                <>
                <div className="flex flex-col text-center">
                    <div className="font-bold text-[20px]">Join a Community</div>
                    <div className="text-gray-500">Enter an invite to join a community.</div>
                </div>
                {error && (
                    <div className="text-red-500 text-[12px]">{error}</div>
                )}
                <Input placeholder="Enter invite" onChange={(e) => setJoinCommunityId(e.target.value)} />
                <div className="flex items-start w-full flex-col gap-2">
                <div className="text-[12px] text-gray-500">Invites shoud looks like</div>
                <div className="bg-basalt text-[12px] text-gray-100 p-2 rounded-lg">{domainUrl}/join/41458281816465879008</div>
                <div className="bg-basalt text-[12px] text-gray-100 p-2 rounded-lg">41458281816465879008</div>
                </div>
                <div className="flex w-full gap-4">
                    <Button text="Back" onClick={() => setIsJoinCommunity(false)} />
                    <Button text="Join" isGreen onClick={handleJoinCommunity} />
                </div>
                </>
            )}
        </>
    );
}