type ActionMenuButtonProps = {
  text: string;
  svgPaths?: string[];
  onClick?: () => void;
  isVisible?: boolean;
  isDanger?: boolean;
}

export default function ActionMenuButton({ text, svgPaths = [], onClick, isVisible = true, isDanger }: ActionMenuButtonProps) {
  if (!isVisible) return null;  
  return(
        <button onClick={onClick} className={`${isDanger ? "text-crimson" : "text-gray-100"} w-full px-4 py-2 flex items-center gap-2 text-left hover:bg-slate transition-colors`}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-5 text-gray-500"
                >
                  {svgPaths.map((d, i) => (
                    <path
                      key={i}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d={d}
                    />
                  ))}
                </svg>
                {text}
        </button>
    );
}