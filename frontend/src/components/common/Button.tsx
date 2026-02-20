type ButtonProps = {
    text: string;
    onClick?: () => void;
    isGreen?: boolean;
    isDanger?: boolean;
    disabled?: boolean;
}

export default function Button({ text, onClick, isGreen, isDanger, disabled }: ButtonProps) {
    return (
        <button onClick={onClick} className={` ${isGreen ? "bg-forestgreen hover:bg-emerald" : "hover:bg-basalt border border-outline"} ${isDanger ? "bg-crimson hover:bg-garnet" : "hover:bg-basalt border border-outline"} transition duration-200 w-full h-[40px] rounded-lg`} disabled={disabled}>
            {text}
        </button>
    );
}