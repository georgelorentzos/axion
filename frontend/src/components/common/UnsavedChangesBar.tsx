import Button from "./Button";
import { useEffect, useState } from "react";

type UnsavedChangesBarProps = {
    isVisible: boolean;
    onReset: () => void;
    onSave: () => void; 
}

export default function UnsavedChangesBar({ isVisible, onReset, onSave }: UnsavedChangesBarProps) {
    const [shouldRender, setShouldRender] = useState(false);
    const [showFade, setShowFade] = useState(false);

    useEffect(() => {
        if (isVisible) {
            setShouldRender(true);
            setTimeout(() => setShowFade(true), 10);
        } else {
            setShowFade(false);
            const timer = setTimeout(() => setShouldRender(false), 100);
            return () => clearTimeout(timer);
        }
    }, [isVisible])

    if (!shouldRender) return null;
    
    return (
        <div className={`rounded-lg fixed flex px-6 items-center justify-between bottom-5 left-1/2 -translate-x-1/2 bg-onyx w-[600px] h-[60px] border border-outline 
        transition-opacity duration-200
        ${showFade ? 'opacity-100' : 'opacity-0'}`}>
            <div>Careful — you have unsaved changes!</div>
            <div className="flex w-[200px] gap-2">
                <Button text="Reset" onClick={onReset} />
                <Button text="Save" isGreen onClick={onSave} />
            </div>
        </div>
    );
}