import React, { useState } from "react";
import Input from "../../../../../ui/Input";
import CommunityCard from "../../../../../ui/card/CommunityCard";
import Button from "../../../../../ui/Button";
import UnsavedChangesBar from "../../../../../ui/UnsavedChangesBar";
import { useCommunities } from "../../../../../ui/sidebar/contexts/useCommunities";
import { useNavigate, useLocation } from "react-router-dom";
import { useMembers } from "../../../contexts/useMembers";
import { type Community } from "../../../types/community";
import { api } from "../../../../../api/client";

type ProfileContentProps = {
    community?: Community;
    onCommunityUpdate: (community: Community) => void;
}

export default function ProfileContent({ community, onCommunityUpdate }: ProfileContentProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { updateCommunity } = useCommunities();
    const { members, onlineMembers } = useMembers();

    const [name, setName] = useState(community?.name || "");
    const [image, setImage] = useState<string | null>(community?.image || null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageChanged, setImageChanged] = useState(false);
    const [imageRemoved, setImageRemoved] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const handleFileUpload = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.className = "hidden";
        input.click();
        input.addEventListener("change", () => {
            const file = input.files?.[0] || null;
            if (file) {
                setImageFile(file);
                setImage(URL.createObjectURL(file));
                setImageChanged(true);
                setImageRemoved(false);
                setHasUnsavedChanges(true);
            }
        });
    };

    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setName(event.target.value);
        const nameChanged = event.target.value !== community?.name;
        setHasUnsavedChanges(nameChanged || imageChanged || imageRemoved);
    };

    const handleRemoveIcon = () => {
        setImage(null);
        setImageFile(null);
        setImageRemoved(true);
        setImageChanged(true);
        setHasUnsavedChanges(true);
    };

    const handleReset = () => {
        setName(community?.name || "");
        setImage(community?.image || null);
        setImageFile(null);
        setImageChanged(false);
        setImageRemoved(false);
        setHasUnsavedChanges(false);
    };

    const handleSave = async () => {
        try {
            if (imageRemoved) {
                await api.communities.removeImage(community?.id!);
            }

            const formData = new FormData();
            formData.append("name", name);

            if (imageFile) {
                formData.append("image", imageFile);
            }

            const { response, data } = await api.communities.update(community?.id!, formData);

            if (!response.ok) return;

            const newImage = imageRemoved ? "" : (data.image || image || "");

            const updatedCommunity: Community = {
                id: community?.id || "",
                name: name,
                image: newImage,
                createdAt: community?.createdAt || "",
                ownerId: community?.ownerId || "",
            };

            setImage(newImage || null);
            setHasUnsavedChanges(false);
            setImageFile(null);
            setImageChanged(false);
            setImageRemoved(false);

            onCommunityUpdate(updatedCommunity);
            updateCommunity(updatedCommunity);

            navigate(location.pathname, {
                replace: true,
                state: {
                    community: {
                        ...location.state?.community,
                        ...updatedCommunity,
                    }
                }
            });
        } catch (error) {
            console.error("Failed to update community:", error);
        }
    };

    return (
        <div className="flex gap-2 justify-between items-start">
            <div className="px-6 flex flex-col gap-2">
                <div>Community Profile</div>
                <div className="text-[14px] w-[500px] text-gray-500">
                    Customize how your server appears in invite links and, if enabled, in Server Discovery and Announcement Channel messages.
                </div>
                <br />
                <div>Name</div>
                <Input
                    placeholder="Community Name"
                    value={name}
                    onChange={handleNameChange}
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
                    {image && (
                        <Button text="Remove Icon" onClick={handleRemoveIcon} />
                    )}
                </div>
            </div>
            <div className="pr-12">
                <CommunityCard community={{
                    id: community?.id || "",
                    name: name,
                    image: image || "",
                    onlineMembers: String(onlineMembers.length),
                    totalMembers: String(members.length),
                    createdAt: community?.createdAt || "",
                    ownerId: community?.ownerId || "",
                }} skipFetch />
            </div>
            <UnsavedChangesBar isVisible={hasUnsavedChanges} onReset={handleReset} onSave={handleSave} />
        </div>
    );
}