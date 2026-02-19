import { useState } from "react";

export default function CheckBox() {
    const [isSelected, setIsSelected] = useState(false);

    return(
        <button onClick={() => setIsSelected(prev => !prev)} className={`flex items-center ${isSelected ? "bg-basalt" : ""} border border-outline w-[50px] h-[25px] rounded-full px-1 transition duration-200`}>
            <div className={`w-[18px] h-[18px] rounded-full bg-forestgreen transition-transform duration-200 ${isSelected ? "translate-x-[23px]" : "translate-x-0"}`}></div>
        </button>
    );
}