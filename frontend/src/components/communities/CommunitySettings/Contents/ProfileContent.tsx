import React, { useState } from "react";
import Input from "../../../common/Input";
import CommunityPreview from "../../CommunityPreview";
import Button from "../../../common/Button";
import UnsavedChangesBar from "../../../common/UnsavedChangesBar";
import { useCommunities } from "../../../../contexts/communities/useCommunities";
import { useNavigate, useLocation } from "react-router-dom";
import { useCommunityMembers } from "../../../../contexts/communities/useCommunityMembers";
import { type Community } from "../../../../types/community";

type ProfileContentProps = {
    community?: Community;
    onCommunityUpdate: (data: Community) => void;
}

export default function ProfileContent({ community, onCommunityUpdate }: ProfileContentProps) {
    const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;
    const navigate = useNavigate();
    const location = useLocation();
    const [name, setName] = useState(community?.name || null);
    const [communityImage, setCommunityImage] = useState<string | null>(
        community?.image ? community.image : null
    );
    const [communityImageFile, setCommunityImageFile] = useState<File | null>(null);
    const [imageChanged, setImageChanged] = useState(false);
    const [unsavedChangesBarIsVisible, setUnsavedChangesBarIsVisible] = useState(false);
    const { updateCommunity } = useCommunities();
    const { communityMembers, onlineMembers } = useCommunityMembers();

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
        const nameChanged = e.target.value !== community?.name;
        setUnsavedChangesBarIsVisible(nameChanged || imageChanged);
    };

    const handleReset = () => {
        setUnsavedChangesBarIsVisible(false);
        setImageChanged(false);
        setCommunityImageFile(null);
        setCommunityImage(community?.image ? community.image : null);
        setName(community?.name || null);
    };

    const handleSave = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const formData = new FormData();
            formData.append("community_name", name || "");

            if (communityImageFile) {
                formData.append("community_image", communityImageFile);
            } else if (communityImage === null && community?.image) {
                formData.append("remove_image", "true");
            }

            const response = await fetch(`${apiUrl}/api/community/${community?.id}`, {
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

                const updatedData: Community = {
                    id: data.id,
                    name: data.name,
                    image: data.image,
                    onlineMembers: data.onlineMembers,
                    totalMembers: data.totalMembers,
                    createdAt: data.createdAt,
                    ownerId: data.ownerId,
                };

                if (data.image) {
                    setCommunityImage(data.image);
                }

                onCommunityUpdate(updatedData);
                updateCommunity(updatedData);

                navigate(location.pathname, {
                    replace: true,
                    state: {
                        community: {
                            ...location.state?.community,
                            id: data.id,
                            name: data.name,
                            image: data.image,
                            onlineMembers: data.onlineMembers,
                            totalMembers: data.totalMembers,
                            ownerId: data.ownerId,
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
                    {(community?.image || communityImage) && (
                        <Button text="Remove Icon" onClick={handleRemoveIcon} />
                    )}
                </div>
            </div>
            <div className="pr-6">
                <CommunityPreview community={{
                    id: community?.id || "",
                    name: name || "",
                    image: communityImage ?? "",
                    onlineMembers: String(onlineMembers.length),
                    totalMembers: String(communityMembers.length),
                    createdAt: community?.createdAt || "",
                    ownerId: community?.ownerId || "",
                }} skipFetch />
            </div>
            <UnsavedChangesBar isVisible={unsavedChangesBarIsVisible} onReset={handleReset} onSave={handleSave} />
        </div>
    );
}