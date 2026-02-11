import type React from "react";

type InputProps = {
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function Input({ onChange } : InputProps) {
    return (
        <div className='flex items-center bg-field px-4 rounded-xl gap-2 w-full'>
            <button>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 text-gray-500 hover:text-gray-300 transition duration-300">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6m-16.5-3a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3m-19.5 0a4.5 4.5 0 0 1 .9-2.7L5.737 5.1a3.375 3.375 0 0 1 2.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 0 1 .9 2.7m0 0a3 3 0 0 1-3 3m0 3h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Zm-3 6h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Z" />
                </svg>
            </button>
            <input 
                onChange={onChange}
                type="text" 
                // onChange={(e) => setValue(e.target.value)}
                // onKeyPress={handleKeyPressEnter}
                className="bg-field text-gray-100 focus:outline-none h-[52px] border-outline flex justify-between items-center w-full"
                placeholder="Server Name"  
            />
        </div>
    );
}