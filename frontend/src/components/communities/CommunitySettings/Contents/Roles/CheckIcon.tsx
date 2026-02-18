type CheckIconProps = {
    isChecked: boolean;
}

export default function CheckIcon({ isChecked }: CheckIconProps) {
    return (
        <div
            className={`
                flex items-center justify-center
                transition-all duration-300 ease-out
                ${isChecked
                    ? "opacity-100"
                    : "opacity-0"
                }
            `}
        >
            <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="size-5 text-gray-100 transition-all duration-300 ease-out"
            >
                <path
                    d="M5 13l4 4L19 7"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={24}
                    strokeDashoffset={isChecked ? 0 : 24}
                />
            </svg>
        </div>
    );
}