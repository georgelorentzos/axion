type SettingsSectionProps = {
    children: React.ReactNode;
    title: string;
    isVisible?: boolean;
}

export default function SettingsSection({ children, title, isVisible } : SettingsSectionProps) {
    if (!isVisible) return null;
    return (
        <div className="flex flex-col gap-2 px-4">
        <div className="px-3 text-gray-500 text-[12px]">{title}</div>
        <div className="flex flex-col gap-1">
            {children}
        </div>
        </div>
    );
}