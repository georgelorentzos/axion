type HeaderBtnProps = {
    text?: string;
    selected?: boolean;
    special?: boolean;
    onClick?: () => void;
};

export default function HeaderBtn({ text, selected, special, onClick } : HeaderBtnProps) {
    return (
        <button onClick={onClick} className={`transition duration-300 ${selected ? "bg-green hover:bg-greenhover" : "hover:bg-primaryhover"} ${special ? "bg-white text-black" : ""} text-gray-100 border border-outline py-2 px-4 rounded-xl`}>{text}</button>
    );
}