import Button from "../../../../../ui/Button";
import Input from "../../../../../ui/Input";
import { useEffect, useState } from "react";
import PermissionItem from "../../../../../ui/permission/PermissionItem";
import PermissionsSection from "../../../../../ui/permission/PermissionSection";
import { PERMISSIONS } from "../../../../../constants/permissions";
import { useParams } from "react-router-dom";
import RoleCard from "../../../../../ui/card/RoleCard";
import UnsavedChangesBar from "../../../../../ui/UnsavedChangesBar";
import Modal from "../../../../../ui/modal/Modal";
import Delete from "../../../../../ui/modal/content/Delete";
import SearchBar from "../../../../../ui/SearchBar";
import { useRoles } from "../../../contexts/useRoles";
import { type Role } from "../../../types/role";
import { api } from "../../../../../api/client";
import Icon from "../../../../../ui/Icon";
import { icons } from "../../../../../constants/Icons";
import ColorSwatch from "../../../../../ui/color-picker/ColorSwatch";
import { colors } from "../../../../../constants/colors";
import ColorPalette from "../../../../../ui/color-picker/ColorPalette";

export default function RolesContent() {
    const [isCreateRole, setIsCreateRole] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [roleName, setRoleName] = useState('');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [error, setError] = useState('');
    const { communityId } = useParams();
    const { roles, setRoles } = useRoles();
    const [deletingRole, setDeletingRole] = useState<Role | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const filteredRoles = roles?.filter(role => role?.name?.startsWith(searchQuery.toLowerCase())) || []
    const [selectedColor, setSelectedColor] = useState("F3F4F6");
    const [showPicker, setShowPicker] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setError('');
        }, 3000)
        return () => clearTimeout(timer);
    }, [error])

    const togglePermission = (permission: string) => {
        setSelectedPermissions(prev => {
            const updated = prev.includes(permission)
                ? prev.filter(p => p !== permission)
                : [...prev, permission];
            checkForChanges(roleName, selectedColor, updated);
            return updated;
        });
    };

    const checkForChanges = (name: string, color: string , permissions: string[]) => {
        if (editingRole) {
            const nameChanged = name !== editingRole.name;
            const colorChanged = color !== editingRole.color;
            const originalPerms = Array.isArray(editingRole.permissions) ? editingRole.permissions : [];
            const permsChanged = permissions.length !== originalPerms.length ||
                permissions.some(p => !originalPerms.includes(p)) ||
                originalPerms.some(p => !permissions.includes(p));
            setHasUnsavedChanges(nameChanged || colorChanged || permsChanged);
        } else {
            setHasUnsavedChanges(name.trim() !== '' || permissions.length > 0);
        }
    };

    const validateRoleName = (name: string): boolean => {
        const trimmed = name.trim();
        if (trimmed.length < 1) {
            setError("Role name must be at least 1 characters.");
            return false;
        }
        if (trimmed.length > 20) {
            setError("Role name can't be longer than 20 characters.");
            return false;
        }
        return true;
    };

    const handleCreateRole = async () => {
        const trimmed = roleName.trim();
        if (!validateRoleName(roleName)) {
            return;
        }

        if (!communityId) return;

        try {
            const permissionString = selectedPermissions.join("|");
            const { data } = await api.roles.create(communityId, trimmed, selectedColor, permissionString);

            if (data.success) {
                setIsCreateRole(false);
                setEditingRole(null);
                setRoleName('');
                setSelectedColor("F3F4F6");
                setSelectedPermissions([]);
                setHasUnsavedChanges(false);
                setError('');
            } else {
                setError(data.detail || "Failed to create role.");
            }
        } catch (err) {
            console.log("failed to create role: ", err);
            setError("Failed to create role.");
        }
    };

    const handleUpdateRole = async () => {
        const trimmed = roleName.trim();
        if (!validateRoleName(roleName)) {
            return;
        }

        if (!communityId || !editingRole) return;

        try {
            const permissionString = selectedPermissions.join("|");
            const { data } = await api.roles.update(communityId, editingRole.id, trimmed, selectedColor, permissionString);

            if (data.success) {
                const updatedRole = { id: data.id, name: data.name, color: data.color, permissions: data.permissions };
                setEditingRole(updatedRole);
                setHasUnsavedChanges(false);
                setError('');
            } else {
                setError(data.detail || "Failed to update role.");
            }
        } catch (err) {
            console.log("failed to update role: ", err);
            setError("Failed to update role.");
        }
    };

    const handleSaveRole = async () => {
        if (editingRole) {
            await handleUpdateRole();
        } else {
            await handleCreateRole();
        }
    };

    const handleReset = () => {
        if (editingRole) {
            setRoleName(editingRole.name);
            setSelectedColor(editingRole.color || "F3F4F6");
            setSelectedPermissions(
                Array.isArray(editingRole.permissions) ? [...editingRole.permissions] : []
            );
        } else {
            setRoleName('');
            setSelectedColor("F3F4F6");
            setSelectedPermissions([]);
        }
        setHasUnsavedChanges(false);
        setError('');
    };

    const handleOpenCreateRole = () => {
        setIsCreateRole(true);
        setEditingRole(null);
        setRoleName('');
        setSelectedColor("F3F4F6");
        setSelectedPermissions([]);
        setHasUnsavedChanges(false);
        setError('');
    };

    const handleOpenEditRole = (role: Role) => {
        setIsCreateRole(true);
        setEditingRole(role);
        setRoleName(role.name);
        setSelectedColor(role.color || "F3F4F6");
        setSelectedPermissions(
            Array.isArray(role.permissions)
                ? [...role.permissions]
                : typeof role.permissions === 'string'
                    ? (role.permissions as string).split('|').filter(Boolean)
                    : []
        );
        setHasUnsavedChanges(false);
        setError('');
    };

    const handleBack = () => {
        setIsCreateRole(false);
        setEditingRole(null);
        setRoleName('');
        setSelectedColor("F3F4F6");
        setSelectedPermissions([]);
        setHasUnsavedChanges(false);
        setError('');
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setRoleName(newName);
        setError('');
        checkForChanges(newName, selectedColor, selectedPermissions);
    };

    const handleColorChange = (color: string) => {
        setSelectedColor(color);
        checkForChanges(roleName, color, selectedPermissions);
    };

    const createRoleContent = (
        <div className="px-6 flex flex-col gap-2 w-full h-full min-h-0">
            <div className="flex gap-2">
                <div>{editingRole ? "Edit Role" : "Create Role"}</div>
                <button
                    onClick={handleBack}
                    className="text-gray-500 hover:text-gray-100 transition duration-200 flex items-center"
                >
                    <Icon svgPaths={icons.arrowLeft} className="size-5" />
                    Back
                </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2">
                <div>Role Name</div>
                <div className="flex flex-col gap-1">
                    <Input
                        placeholder="Role Name"
                        value={roleName}
                        onChange={handleNameChange}
                        maxLength={20}
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <div>Role Color</div>
                    <div className="text-gray-500 text-xs">Members use the color of the highest role they have on the roles list.</div>
                    <div className="flex gap-2">
                        <div className="flex gap-2">
                            <div className="w-[66px] h-[50px]">
                                <ColorSwatch color="F3F4F6" onClick={() => handleColorChange("F3F4F6")} isSelected={selectedColor === "F3F4F6"} />
                            </div>
                        <div className="relative">
                            <div className="w-[66px] h-[50px]">
                                <ColorSwatch color={selectedColor && selectedColor !== "F3F4F6" ? selectedColor : ""} onClick={() => setShowPicker(true)} />
                            </div>
                            <ColorPalette
                                isOpen={showPicker}
                                initialColor={selectedColor}
                                onChange={(hex) => handleColorChange(hex)}
                                onClose={() => setShowPicker(false)}
                            />
                        </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            {colors.map((row, i) => (
                                <div key={i} className="flex gap-2">
                                    {row.map(color => (
                                        <div key={color} className="w-[20px] h-[20px] ">
                                            <ColorSwatch key={color} color={color} onClick={() => handleColorChange(color)} isSelected={selectedColor === color} />
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="rounded-lg flex flex-col">
                    <PermissionsSection title="GENERAL">
                        <PermissionItem
                            onClick={() => togglePermission(PERMISSIONS.MANAGE_CHANNELS)}
                            active={selectedPermissions.includes(PERMISSIONS.MANAGE_CHANNELS)}
                            text="Manage Channels"
                            description="Allows members to create, edit, or delete channels."
                        />
                        <PermissionItem
                            onClick={() => togglePermission(PERMISSIONS.MANAGE_ROLES)}
                            active={selectedPermissions.includes(PERMISSIONS.MANAGE_ROLES)}
                            text="Manage Roles"
                            description="Allows members to create, edit, or delete roles lower than their highest role."
                        />
                        <PermissionItem
                            onClick={() => togglePermission(PERMISSIONS.MANAGE_COMMUNITY)}
                            active={selectedPermissions.includes(PERMISSIONS.MANAGE_COMMUNITY)}
                            text="Manage Community"
                            description="Allows members to edit community settings, such as the community name and description."
                        />
                        <PermissionItem
                            onClick={() => togglePermission(PERMISSIONS.VIEW_LOGS)}
                            active={selectedPermissions.includes(PERMISSIONS.VIEW_LOGS)}
                            text="View Logs"
                            description="Allows members to view system logs."
                        />
                    </PermissionsSection>
                    <PermissionsSection title="MEMBERSHIP">
                        <PermissionItem
                            onClick={() => togglePermission(PERMISSIONS.KICK)}
                            active={selectedPermissions.includes(PERMISSIONS.KICK)}
                            text="Kick"
                            description="Allows members to remove other members from the community."
                        />
                        <PermissionItem
                            onClick={() => togglePermission(PERMISSIONS.BAN)}
                            active={selectedPermissions.includes(PERMISSIONS.BAN)}
                            text="Ban"
                            description="Allows members to permanently ban other members from the community."
                        />
                    </PermissionsSection>
                    <PermissionsSection title="TEXT CHANNEL">
                        <PermissionItem
                            onClick={() => togglePermission(PERMISSIONS.SEND_MESSAGES)}
                            active={selectedPermissions.includes(PERMISSIONS.SEND_MESSAGES)}
                            text="Send Messages"
                            description="Allows members to send messages in text channels."
                        />
                        <PermissionItem
                            onClick={() => togglePermission(PERMISSIONS.SEND_LINKS)}
                            active={selectedPermissions.includes(PERMISSIONS.SEND_LINKS)}
                            text="Send Links"
                            description="Allows members to send links that display embedded content."
                        />
                        <PermissionItem
                            onClick={() => togglePermission(PERMISSIONS.ATTACH_FILES)}
                            active={selectedPermissions.includes(PERMISSIONS.ATTACH_FILES)}
                            text="Attach Files"
                            description="Allows members to upload files and media in text channels."
                        />
                        <PermissionItem
                            onClick={() => togglePermission(PERMISSIONS.MANAGE_MESSAGES)}
                            active={selectedPermissions.includes(PERMISSIONS.MANAGE_MESSAGES)}
                            text="Manage Messages"
                            description="Allows members to delete or pin messages from other members."
                        />
                    </PermissionsSection>
                    <PermissionsSection title="ADVANCED">
                        <PermissionItem
                            onClick={() => togglePermission(PERMISSIONS.ADMINISTRATOR)}
                            active={selectedPermissions.includes(PERMISSIONS.ADMINISTRATOR)}
                            text="Administrator"
                            description="Grants all permissions and bypasses all channel-specific restrictions. This is a dangerous permission to grant."
                        />
                    </PermissionsSection>
                </div>
            </div>
            <UnsavedChangesBar isVisible={hasUnsavedChanges} onReset={handleReset} onSave={handleSaveRole} error={error} />
        </div>
    );

    const defaultContent = (
        <div className="px-6 flex flex-col gap-2 w-full h-full min-h-0">
            <div>Community Roles</div>
            <div className="text-[14px] w-[500px] text-gray-500">
                Use roles to group your server members and assign permissions.
            </div>
            <div className="flex flex-col flex-1 min-h-0">
                <div className="w-full flex gap-2 items-center">
                    {roles && roles.length > 0 && (
                        <SearchBar onSearch={(q) => setSearchQuery(q)} />
                    )}
                    <div className="w-[170.48px]">
                        <Button text="Create Role" isGreen onClick={handleOpenCreateRole} />
                    </div>
                </div>
                <br />
                {roles && roles.length > 0 && (
                    <>
                        <div className="text-gray-500 text-[12px] border-b border-outline pb-2">{roles.length && roles.length > 1 ? `${roles.length} Roles` : `${roles.length} Role`}</div>
                        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col py-2">
                            {filteredRoles.map((role) => (
                                <RoleCard
                                    key={role.id}
                                    role={role}
                                    onClick={() => handleOpenEditRole(role)}
                                    onDelete={() => setDeletingRole(role)}
                                />
                            ))}
                            {filteredRoles.length === 0 && searchQuery && (
                                <div className="text-gray-500 transition duration-300 py-2.5 px-4 flex justify-between items-center w-full rounded-lg hover:bg-basalt">
                                    No results found
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );

    return (
        <div className="flex gap-2 justify-start items-start h-full min-h-0">
            {isCreateRole ? createRoleContent : defaultContent}
            <Modal isOpen={!!deletingRole} onClose={() => setDeletingRole(null)}>
                <Delete
                    title={`Delete ${deletingRole?.name}`}
                    onConfirm={async () => {
                        if (!deletingRole?.id || !communityId) return;
                        const { data } = await api.roles.delete(communityId, deletingRole.id);
                        setRoles(prev => prev.filter(r => r.id !== data.id));
                        setDeletingRole(null);
                    }}
                />
            </Modal>
        </div>
    );
}