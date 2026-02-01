type HeaderBtnProps = {
    text?: string;
    selected?: boolean;
    onClick?: () => void;
};

export default function HeaderBtn({ text, selected, onClick } : HeaderBtnProps) {
    return (
        <button onClick={onClick} className={`transition duration-300 ${selected ? "bg-green hover:bg-greenhover" : "hover:bg-primaryhover"} text-gray-100 border border-outline py-2 px-4 rounded-xl`}>{text}</button>
    );
}