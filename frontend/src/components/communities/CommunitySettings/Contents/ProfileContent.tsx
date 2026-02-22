import React, { useState } from "react";
import Input from "../../../common/Input";
import CommunityPreview from "../../CommunityPreview";
import Button from "../../../common/Button";
import UnsavedChangesBar from "../../../common/UnsavedChangesBar";
import { useCommunities } from "../../../../contexts/useCommunities";
import { useNavigate, useLocation } from "react-router-dom";

type CommunityData = {
    communityId: string;
    communityName: string;
    communityImage: string;
    communityOnlineMembers: string;
    communityTotalMembers: string;
    communityCreatedAt: string;
    communityOwnerId: string;
}

type ProfileContentProps = {
    communityData?: CommunityData;
    onCommunityUpdate: (data: CommunityData) => void;
}

export default function ProfileContent({ communityData, onCommunityUpdate }: ProfileContentProps) {
    const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;
    const navigate = useNavigate();
    const location = useLocation();

    const [name, setName] = useState(communityData?.communityName || null);
    const [communityImage, setCommunityImage] = useState<string | null>(
        communityData?.communityImage ? communityData.communityImage : null
    );
    const [communityImageFile, setCommunityImageFile] = useState<File | null>(null);
    const [imageChanged, setImageChanged] = useState(false);
    const [unsavedChangesBarIsVisible, setUnsavedChangesBarIsVisible] = useState(false);

    const { updateCommunity } = useCommunities();

    const handleFileUpload = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.className = "hidden";

        input.click();

        input.addEventListener("change", () => {
            const file = input.files?.[0] || null;
            if (file) {
                setCommunityImageFile(file);
                setCommunityImage(URL.createObjectURL(file));
                setImageChanged(true);
                setUnsavedChangesBarIsVisible(true);
            }
        });
    };

    const handleNewName = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
        const nameChanged = e.target.value !== communityData?.communityName;
        setUnsavedChangesBarIsVisible(nameChanged || imageChanged);
    };

    const handleReset = () => {
        setUnsavedChangesBarIsVisible(false);
        setImageChanged(false);
        setCommunityImageFile(null);
        setCommunityImage(communityData?.communityImage ? communityData.communityImage : null);
        setName(communityData?.communityName || null);
    };

    const handleSave = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const formData = new FormData();
            formData.append("community_name", name || "");

            if (communityImageFile) {
                formData.append("community_image", communityImageFile);
            } else if (communityImage === null && communityData?.communityImage) {
                formData.append("remove_image", "true");
            }

            const response = await fetch(`${apiUrl}/api/community/${communityData?.communityId}`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                setUnsavedChangesBarIsVisible(false);
                setCommunityImageFile(null);
                setImageChanged(false);

                const updatedData = {
                    communityId: data.community_id,
                    communityName: data.community_name,
                    communityImage: data.community_image,
                    communityOnlineMembers: data.community_online_members,
                    communityTotalMembers: data.community_total_members,
                    communityCreatedAt: data.community_created_at,
                    communityOwnerId: data.community_owner_id,
                };

                if (data.community_image) {
                    setCommunityImage(data.community_image);
                }

                onCommunityUpdate(updatedData);
                updateCommunity(updatedData);

                navigate(location.pathname, {
                    replace: true,
                    state: {
                        communityData: {
                            ...location.state?.communityData,
                            communityId: data.community_id,
                            communityName: data.community_name,
                            communityImage: data.community_image,
                            community_online_members: data.community_online_members,
                            community_total_members: data.community_total_members,
                            community_created_at: data.community_created_at,
                        }
                    }
                });
            }
        } catch (error) {
            console.log("error update community: ", error);
        }
    };

    const handleRemoveIcon = () => {
        setCommunityImage(null);
        setImageChanged(true);
        setUnsavedChangesBarIsVisible(true);
    };

    return (
        <div className="flex gap-2 justify-start items-start">
            <div className="px-6 flex flex-col gap-2">
                <div>Community Profile</div>
                <div className="text-[14px] w-[500px] text-gray-500">
                    Customize how your server appears in invite links and, if enabled, in Server Discovery and Announcement Channel messages.
                </div>
                <br />
                <div>Name</div>
                <Input
                    placeholder="Community Name"
                    value={name || ""}
                    onChange={handleNewName}
                    maxLength={20}
                />
                <br />
                <div>Icon</div>
                <div className="text-[14px] w-[500px] text-gray-500">
                    We recommend an image of at least 512x512.
                </div>
                <div className="max-w-[350px] flex gap-2">
                    <div className="max-w-[170.48px] w-full">
                    <Button text="Change Icon" isGreen onClick={handleFileUpload} />
                    </div>
                    {(communityData?.communityImage || communityImage) && (
                        <Button text="Remove Icon" onClick={handleRemoveIcon} />
                    )}
                </div>
            </div>
            <div className="pr-6">
                <CommunityPreview communityData={{
                    communityId: communityData?.communityId || "",
                    communityName: name || "",
                    communityImage: communityImage ?? "",
                    communityOnlineMembers: communityData?.communityOnlineMembers || "",
                    communityTotalMembers: communityData?.communityTotalMembers || "",
                    communityCreatedAt: communityData?.communityCreatedAt || "",
                }} skipFetch />
            </div>
            <UnsavedChangesBar isVisible={unsavedChangesBarIsVisible} onReset={handleReset} onSave={handleSave} />
        </div>
    );
}