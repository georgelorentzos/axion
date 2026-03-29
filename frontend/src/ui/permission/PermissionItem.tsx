import CheckBox from "../CheckBox";

type PermissionItemProps = {
    text: string;
    description: string;
    onClick: () => void;
    active?: boolean;
}

export default function PermissionItem({ text, description, onClick, active = false }: PermissionItemProps) {
    return (
        <div className="flex py-1 justify-between">
            <div className="flex flex-col py-1">
                <div className="text-[14px]">{text}</div>
                <div className="text-gray-500 text-[12px] max-w-[400px]">{description}</div>
            </div>
            <div>
                <CheckBox onClick={onClick} active={active} />
            </div>
        </div>
    );
}