import Icon from "../Icon";

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
                <Icon svgPaths={svgPaths} className="size-5 text-gray-500" />
                {text}
        </button>
    );
}