import Button from "../../../common/Button";
import Input from "../../../common/Input";
import { useState } from "react";
import PermissionsItem from "./Roles/Permissions/PermissionsItem";
import PermissionsSection from "./Roles/Permissions/PermissionsSection";

export default function RolesContent() {
    const [isCreateRole, setIsCreateRole] = useState(false);
    
    const createRoleContent = (
        <div className="px-6 flex flex-col gap-2 w-full">
            <div className="flex gap-2">
                <button onClick={() => setIsCreateRole(false)} className="text-gray-500 hover:text-gray-100 transtition duration-200 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                    Back
                    </button>
            </div>
            <div>Role Name</div>
            <div className="flex gap-2">
            <Input placeholder="Role Name" />
            <div className="flex w-full max-w-[170.48px]">
                <Button text="Create Role" isGreen />
            </div>
            </div>
            <div className="flex flex-col max-h-[260px] overflow-y-auto">
            <PermissionsSection title="GENERAL">
                <PermissionsItem text="Manage Channels" description="Allows members to create, edit, or delete channels." />
                <PermissionsItem text="Manage Roles" description="Allows members to create, edit, or delete roles lower than their highest role." />
                <PermissionsItem text="Manage Community" description="Allows members to edit community settings, such as the community name and description." />
            </PermissionsSection>
            <PermissionsSection title="MEMBERSHIP">
                <PermissionsItem text="Kick" description="Allows members to remove other members from the community." />
                <PermissionsItem text="Ban" description="Allows members to permanently ban other members from the community." />
            </PermissionsSection>
            <PermissionsSection title="TEXT CHANNEL">
                <PermissionsItem text="Send Messages" description="Allows members to send messages in text channels." />
                <PermissionsItem text="Send Links" description="Allows members to send links that display embedded content." />
                <PermissionsItem text="Attach Files" description="Allows members to upload files and media in text channels." />
                <PermissionsItem text="Manage Messages" description="Allows members to delete or pin messages from other members." />
            </PermissionsSection>
            <PermissionsSection title="ADVANCED">
                <PermissionsItem text="Administrator" description="Grants all permissions and bypasses all channel-specific restrictions. This is a dangerous permission to grant." />
            </PermissionsSection>
            </div>
        </div>
    );

    const defaultContent = (
        <div className="px-6 flex flex-col gap-2">
            <div>Community Roles</div>
            <div className="text-[14px] w-[500px] text-gray-500">
                Use roles to group your server members and assign permissions.
            </div>
            <div className="max-w-[170.48px]">
                <Button text="Create Role" isGreen onClick={() => setIsCreateRole(true)} />
            </div>
        </div>
    );

    return(
        <div className="flex gap-2 justify-start items-start">
            {isCreateRole ? createRoleContent : defaultContent}
        </div>
    );
}