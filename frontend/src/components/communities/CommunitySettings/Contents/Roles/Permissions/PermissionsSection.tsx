import type React from "react";
type PermissionsSectionProps = {
    children: React.ReactNode;
    title: string;
}
export default function PermissionsSection({ children, title } : PermissionsSectionProps) {
    return (
        <div className="flex flex-col py-2">
            <div className="text-gray-500 text-[12px] mb-2">{title}</div>
            <div className="flex flex-col gap-2">
                {children}
            </div>
        </div>
    );
}