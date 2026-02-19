import CheckBox from "../../../../../common/CheckBox";

type PermissionsItemProps = {
    text: string;
    description: string;
}

export default function PermissionsItem({ text, description }: PermissionsItemProps) {
    return (
        <div className="flex py-1 justify-between">
            <div className="flex flex-col py-1">
            <div className="text-[14px]">{text}</div>
            <div className="text-gray-500 text-[12px] max-w-[400px]">{description}</div>
            </div>

            <div>
                <CheckBox />
            </div>
        </div>
    );
}