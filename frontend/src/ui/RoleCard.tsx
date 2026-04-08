import { icons } from "../constants/Icons";
import Icon from "./Icon";

type RoleCardProps = {
  id?: string;
  name: string;
  onDelete?: (id: string) => void;
  onClick?: () => void;
  hover?: string;
};
export default function RoleCard({
  id,
  name,
  onDelete,
  onClick,
  hover = "hover:bg-basalt",
}: RoleCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!id) return;
    onDelete?.(id);
  };
  return (
    <div
      onClick={onClick}
      className={`shrink-0 cursor-pointer transition duration-300 h-[60px] px-4 flex justify-between items-center w-full rounded-lg ${hover}`}
    >
      <div className="flex items-center gap-2">
        <div className="flex flex-col leading-none gap-1">
          <div className="text-gray-100">{name}</div>
        </div>
      </div>
      {onDelete && (
      <div className="flex items-center gap-1">
        <button onClick={handleDelete}>
          <Icon svgPaths={icons.delete} className="size-5 text-crimson hover:text-garnet transition duration-300" />
        </button>
      </div>
      )}
    </div>
  );
}