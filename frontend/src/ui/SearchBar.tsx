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
        <div className={`border border-outline bg-basalt hover:bg-basalt transition duration-300 flex items-center px-2 rounded-lg gap-2 w-full h-[40px]`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5 text-gray-500 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input 
                type="text" 
                value={value}
                onChange={handleChange}
                className="bg-transparent text-gray-100 focus:outline-none w-full h-full"
                placeholder="Search"  
            />
        </div>
    );
}


