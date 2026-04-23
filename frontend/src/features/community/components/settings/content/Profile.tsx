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
    const { setCommunities } = useCommunities();
    const { members, onlineMembers } = useMembers();

    const [name, setName] = useState(community?.name || "");
    const [image, setImage] = useState<string | null>(community?.image || null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageChanged, setImageChanged] = useState(false);
    const [imageRemoved, setImageRemoved] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const checkUnsaved = (newName: string, imgChanged: boolean, imgRemoved: boolean) => {
        const changed = newName !== community?.name || imgChanged || imgRemoved;
        setHasUnsavedChanges(changed);
    };

    const handleFileUpload = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (e: any) => {
            const file = e.target.files?.[0];
            if (file) {
                setImageFile(file);
                setImage(URL.createObjectURL(file));
                setImageChanged(true);
                setImageRemoved(false);
                checkUnsaved(name, true, false);
            }
        };
        input.click();
    };

    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const val = event.target.value;
        setName(val);
        checkUnsaved(val, imageChanged, imageRemoved);
    };

    const handleRemoveIcon = () => {
        setImage(null);
        setImageFile(null);
        setImageRemoved(true);
        setImageChanged(false);
        checkUnsaved(name, false, true);
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

            if (!response.ok) {
                return;
            }

            const finalImage = imageRemoved ? "" : (data.image || image || "");

            const updatedCommunity: Community = {
                ...community!,
                name: name,
                image: finalImage,
            };

            setImage(finalImage || null);
            setHasUnsavedChanges(false);
            setImageFile(null);
            setImageChanged(false);
            setImageRemoved(false);

            onCommunityUpdate(updatedCommunity);
            setCommunities(prev =>
                prev.map(c =>
                    c.id === updatedCommunity.id
                        ? {
                              ...c,
                              name: updatedCommunity.name,
                              image: updatedCommunity.image,
                          }
                        : c
                )
            );

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
            console.error(error);
        }
    };

    return (
        <div className="flex gap-2 justify-between items-start">
            <div className="px-6 flex flex-col gap-2">
                <div>Community Profile</div>
                <div className="text-[14px] w-[500px] text-gray-500">
                    Customize how your server appears in invite links and discovery.
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
                    {(!imageRemoved && (image || community?.image)) && (
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
                }} skipFetch isExample={true} />
            </div>
            <UnsavedChangesBar isVisible={hasUnsavedChanges} onReset={handleReset} onSave={handleSave} />
        </div>
    );
}