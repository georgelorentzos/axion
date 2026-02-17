type ButtonProps = {
    text: string;
    onClick?: () => void;
    isGreen?: boolean;
    disabled?: boolean;
}

export default function Button({ text, onClick, isGreen, disabled }: ButtonProps) {
    return (
        <button onClick={onClick} className={` ${isGreen ? "bg-forestgreen hover:bg-emerald" : "hover:bg-basalt border border-outline"} transition duration-200 w-full h-[40px] rounded-lg`} disabled={disabled}>
            {text}
        </button>
    );
}