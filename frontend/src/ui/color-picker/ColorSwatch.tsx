import Icon from "../Icon";
import { icons } from "../../constants/Icons";

type ColorSwatchProps = {
    color: string;
    onClick: () => void;
    isSelected?: boolean;
};

export default function ColorSwatch({ color, onClick, isSelected }: ColorSwatchProps) {
    return(
        <button onClick={onClick} className={`flex items-center justify-center border border-outline bg-[#${color}] w-full h-full rounded`}>
            {isSelected && (
                <Icon svgPaths={icons.accept} className="size-5 color" />
            )}
        </button>
    );
}