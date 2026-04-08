import { useState } from 'react';
import { icons } from '../constants/Icons';
import Icon from './Icon';

type SearchBarProps = {
    value?: string;
    onSearch?: (query: string) => void;
    bg?: string;
};

export default function SearchBar({ value: propValue, onSearch, bg = "bg-basalt" }: SearchBarProps) {
    const [value, setValue] = useState(propValue || '');
    const isDefaultBg = bg === "bg-basalt";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setValue(newValue);
        onSearch?.(newValue);
    };

    return (
        <div className={`border border-outline ${bg} ${isDefaultBg ? "hover:bg-basalt" : ""} transition duration-300 flex items-center px-2 rounded-lg gap-2 w-full h-[40px]`}>
            <Icon svgPaths={icons.search} className="size-5 text-gray-500 flex-shrink-0" />
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