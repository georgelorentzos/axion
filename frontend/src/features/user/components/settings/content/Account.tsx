import { useState } from "react";
import Input from "../../../../../ui/Input";
import Button from "../../../../../ui/Button";
import UnsavedChangesBar from "../../../../../ui/UnsavedChangesBar";
import { api } from "../../../../../api/client";
import { useCurrentUser } from "../../../contexts/useCurrentUser";
import MemberPreview from "../../../../../ui/memberpreview/MemberPreview";
import TextArea from "../../../../../ui/TextArea";

export default function AccountContent() {
    const { currentUser, setCurrentUser } = useCurrentUser();
    if (!currentUser) return null;

    const [username, setUsername] = useState(currentUser.username);
    const [email, setEmail] = useState(currentUser.email);
    const [bio, setBio] = useState(currentUser.bio || "");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(currentUser.image || null);
    const [imageChanged, setImageChanged] = useState(false);
    const [imageRemoved, setImageRemoved] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [resetSignal, setResetSignal] = useState(0);

    const checkUnsaved = (u: string, e: string, b: string, ic: boolean, ir: boolean) => {
        const changed =
            u !== currentUser.username ||
            e !== currentUser.email ||
            b !== (currentUser.bio || "") ||
            ic ||
            ir;
        setHasUnsavedChanges(changed);
    };

    const handleFileUpload = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (e: any) => {
            const file = e.target.files?.[0];
            if (file) {
                const previewUrl = URL.createObjectURL(file);
                setImageFile(file);
                setImagePreview(previewUrl);
                setImageChanged(true);
                setImageRemoved(false);
                checkUnsaved(username, email, bio, true, false);
            }
        };
        input.click();
    };

    const handleRemoveIcon = () => {
        setImageFile(null);
        setImagePreview(null);
        setImageRemoved(true);
        setImageChanged(true);
        checkUnsaved(username, email, bio, true, true);
    };

    const handleReset = () => {
        setUsername(currentUser.username);
        setEmail(currentUser.email);
        setBio(currentUser.bio || "");
        setImageFile(null);
        setImagePreview(currentUser.image || null);
        setImageChanged(false);
        setImageRemoved(false);
        setHasUnsavedChanges(false);
        setResetSignal(prev => prev + 1);
    };

    const handleSave = async () => {
        try {
            if (imageRemoved) {
                await api.users.removeImage();
            }

            const formData = new FormData();
            formData.append("username", username);
            formData.append("email", email);
            formData.append("bio", bio);
            
            if (imageFile) {
                formData.append("image", imageFile);
            }

            const { data } = await api.users.update(formData);
            if (!data.success) return;

            setCurrentUser(prev => prev ? {
                ...prev,
                username,
                email,
                bio,
                image: imageRemoved ? null : (data.user?.image || imagePreview),
            } : prev);

            setHasUnsavedChanges(false);
            setImageFile(null);
            setImageChanged(false);
            setImageRemoved(false);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="flex gap-2 justify-between items-start">
            <div className="px-6 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <div>Display Name</div>
                    <Input
                        value={username}
                        onChange={(e) => {
                            setUsername(e.target.value);
                            checkUnsaved(e.target.value, email, bio, imageChanged, imageRemoved);
                        }}
                        maxLength={32}
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <div>Email</div>
                    <Input
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            checkUnsaved(username, e.target.value, bio, imageChanged, imageRemoved);
                        }}
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <div>Bio</div>
                    <div className="bg-basalt rounded-lg h-[100px] overflow-y-auto py-1 max-w-[500px]">
                        <TextArea
                            defaultValue={currentUser.bio || ""}
                            clearSignal={resetSignal}
                            className="h-full"
                            onChange={(val) => {
                                setBio(val);
                                checkUnsaved(username, email, val, imageChanged, imageRemoved);
                            }}
                            maxLength={200}
                        />
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <div>Icon</div>
                    <div className="text-[14px] w-[500px] text-gray-500">We recommend 512x512.</div>
                    <div className="max-w-[350px] flex gap-2">
                        <div className="max-w-[170.48px] w-full">
                            <Button text="Change Icon" isGreen onClick={handleFileUpload} />
                        </div>
                        {(!imageRemoved && (imagePreview || currentUser.image)) && (
                            <Button text="Remove Icon" onClick={handleRemoveIcon} />
                        )}
                    </div>
                </div>
            </div>
            <div className="pr-12">
                <MemberPreview member={{ ...currentUser, username, bio, image: imagePreview }} isOpen={true} isExample={true} static />
            </div>
            <UnsavedChangesBar isVisible={hasUnsavedChanges} onReset={handleReset} onSave={handleSave} />
        </div>
    );
}