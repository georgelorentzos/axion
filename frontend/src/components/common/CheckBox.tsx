import { useState } from "react";

export default function CheckBox() {
    const [isSelected, setIsSelected] = useState(false);

    return(
        <button onClick={() => setIsSelected(prev => !prev)} className={`flex items-center ${isSelected ? "bg-forestgreen" : ""} border border-outline w-[50px] h-[25px] rounded-full px-1 transition duration-200`}>
            <div className={`w-[18px] h-[18px] rounded-full transition-transform duration-200 ${isSelected ? "translate-x-[23px] bg-onyx" : "translate-x-0 bg-forestgreen"}`}></div>
        </button>
    );
}