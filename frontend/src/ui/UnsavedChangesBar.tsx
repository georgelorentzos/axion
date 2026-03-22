import Button from "./Button";
import { useEffect, useState } from "react";

type UnsavedChangesBarProps = {
    isVisible: boolean;
    onReset: () => void;
    onSave: () => void;
    error?: string;
}

export default function UnsavedChangesBar({ isVisible, onReset, onSave, error }: UnsavedChangesBarProps) {
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
        <div className={`rounded-lg fixed flex px-6 items-center justify-between bottom-5 left-1/2 -translate-x-1/2 bg-onyx w-[600px] py-2.5 border border-outline 
        transition-opacity duration-200
        ${showFade ? 'opacity-100' : 'opacity-0'}`}>
            <div className={`whitespace-nowrap transition-colors duration-300 ${error ? 'text-red-500' : ''}`}>
                {error || "Careful — you have unsaved changes!"}
            </div>
            <div className="flex w-[200px] gap-2 shrink-0">
                <Button text="Reset" onClick={onReset} />
                <Button text="Save" isGreen onClick={onSave} />
            </div>
        </div>
    );
}