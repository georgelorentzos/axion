import type React from "react";

type SettingsSectionProps = {
    children: React.ReactNode;
    title: string;
}

export default function SettingsSection({ children, title } : SettingsSectionProps) {
    return (
        <div className="flex flex-col gap-2 px-4">
        <div className="px-3 text-gray-500 text-[12px]">{title}</div>
        <div>
            {children}
        </div>
        </div>
    );
}