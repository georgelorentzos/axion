type CheckBoxProps = {
    onClick: () => void;
    active?: boolean;
}

export default function CheckBox({ onClick, active = false }: CheckBoxProps) {
    return (
        <button onClick={onClick} className={`flex items-center ${active ? "bg-forestgreen" : ""} border border-outline w-[50px] h-[25px] rounded-full px-1 transition duration-200`}>
            <div className={`w-[18px] h-[18px] rounded-full transition-transform duration-200 ${active ? "translate-x-[23px] bg-onyx" : "translate-x-0 bg-forestgreen"}`}></div>
        </button>
    );
}