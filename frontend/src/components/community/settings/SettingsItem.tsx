type SettingsItemProps = {
    text: string;
    onClick?: () => void;
    isDanger?: boolean;
    isSelected?: boolean;
}

export default function SettingsItem({ text, onClick, isDanger, isSelected }: SettingsItemProps) {
    return (
        <button onClick={onClick} className={`${isDanger ? "text-red-400" : ""} ${isSelected ? "bg-basalt" : ""} hover:bg-basalt transition duration-200 w-full h-[40px] rounded-md text-left px-3 text-gray-100`}>
            {text}
        </button>
    );
}