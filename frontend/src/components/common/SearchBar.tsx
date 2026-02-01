import { useState } from 'react';

type SearchBarProps = {
    value?: string;
    onSearch?: (query: string) => void;
};

export default function SearchBar({ value: propValue, onSearch }: SearchBarProps) {
    const [value, setValue] = useState(propValue || '');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setValue(newValue);
        onSearch?.(newValue);
    };

    return (
        <div className='flex items-center bg-field px-4 rounded-xl gap-2'>

        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 text-gray-500 ">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>

        <input 
            type="text" 
            value={value}
            onChange={handleChange}
            className="bg-field text-gray-100 focus:outline-none h-[60px] border-outline flex justify-between items-center w-full"
            placeholder="Search"  
        />
        </div>
    );
}