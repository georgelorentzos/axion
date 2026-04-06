type HeaderBtnProps = {
    text?: string;
    selected?: boolean;
    onClick?: () => void;
};

export default function HeaderBtn({ text, selected, onClick } : HeaderBtnProps) {
    return (
        <button onClick={onClick} className={`transition duration-300 ${selected ? "bg-forestgreen" : "hover:bg-basalt"} text-gray-100 h-[35px] px-4 rounded-xl`}>{text}</button>
    );
}