type IconProps = {
    svgPaths: string[];
    className: string;
    filled?: boolean;
}

export default function Icon({ svgPaths, className, filled = false }: IconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill={filled ? "currentColor" : "none"}
            viewBox="0 0 24 24"
            strokeWidth={filled ? "0" : "1.5"}
            stroke={filled ? "none" : "currentColor"}
            className={className}
        >
            {svgPaths.map((svgPath, index) => (
                <path key={index} strokeLinecap="round" strokeLinejoin="round" d={svgPath} />
            ))}
        </svg>
    );
}