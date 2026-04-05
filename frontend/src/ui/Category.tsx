import { type Category } from "../features/community/types/category";

type CategoryProps = {
    category: Category;
}

export default function Category({ category }: CategoryProps) {
    return(
        <div className="flex gap-2 justify-between w-full pr-2 h-[24px]">
            <div className="text-gray-500 hover:text-gray-300 transition duration-200">{category.name}</div>
            <button>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5 text-gray-500 hover:text-gray-300 transition duration-200">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
            </button>
        </div>
    );
}