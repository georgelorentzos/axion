import type React from "react";

type InputProps = {
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    svgD?: string;
    value?: string;
    maxLength?: number;
}

export default function Input({ onChange, placeholder, svgD, value, maxLength } : InputProps) {
    return (
        <div className='border border-outline flex items-center bg-basalt px-4 rounded-lg gap-2 w-full'>

            {svgD && (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 text-gray-500 hover:text-gray-300 transition duration-300">
                    <path strokeLinecap="round" strokeLinejoin="round" d={svgD} />
                </svg>
            )}

            <input 
                value={value}
                onChange={onChange}
                type="text" 
                maxLength={maxLength}
                className="bg-basalt text-gray-100 focus:outline-none h-[40px] border-outline flex justify-between items-center w-full"
                placeholder={placeholder} 
            />
        </div>
    );
}