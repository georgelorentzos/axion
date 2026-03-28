import { useEffect, useState } from "react";
import ImageProfile from "../../../ui/ImageProfile";
import Button from "../../../ui/Button";
import Input from "../../../ui/Input";

type MemberPreviewProps = {
    member: { username: string; image: string };
    isOpen: boolean;
};

export default function MemberPreview({ member, isOpen }: MemberPreviewProps) {
    const [showFade, setShowFade] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            const timer = setTimeout(() => setShowFade(true), 30);
            return () => clearTimeout(timer);
        } else {
            setShowFade(false);
            const timer = setTimeout(() => setIsVisible(false), 200);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible) return null;

    return (
        <div
            className={`mr-4 p-4 absolute top-0 right-full mr-2 rounded-lg w-[300px] h-auto bg-basalt border border-outline z-50 flex gap-2 flex-col justify-between transition-opacity duration-200 ${
                showFade ? "opacity-100" : "opacity-0"
            }`}
        >
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <ImageProfile
                        width={70}
                        height={70}
                        src={member.image}
                    />
                    <div className="font-bold">{member.username}</div>
                </div>
                <Button text="+ Add Role" isGreen />
            </div>
            <Input
                svgD="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                placeholder={`Message ${member.username}`}
                bg="bg-onyx"
            />
        </div>
    );
}