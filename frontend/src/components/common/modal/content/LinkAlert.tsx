import { useEffect, useState } from "react";
import Button from "../../Button";
import Input from "../../Input";

type LinkAlertProps = {
    onClose: () => void;
    link?: string;
}

export default function LinkAlert({ onClose, link }: LinkAlertProps){
    const [cachedLink, setCachedLink] = useState(link);

    useEffect(() => {
        if (link) setCachedLink(link);
    }, [link]);

    const handleConfirm = () => {
        window.open(link, "_blank", "noopener,noreferrer");
        onClose();
    };

    return(
        <>
            <div className="flex flex-col text-center gap-1">
                <div className="font-bold text-[20px]">Hold on!</div>
                <div className="text-gray-500">
                    Are you sure you want to open this link? It will take you to an external website.
                </div>
            </div>
            
            <Input value={cachedLink} isLink />

            <div className="flex w-full gap-4">
                <Button text="Cancel" onClick={onClose} />
                <Button text="Open Link" isGreen onClick={handleConfirm} />
            </div>
        </>
    );
}