import { icons } from "../../constants/Icons";
import Icon from "../Icon";
import { type Role } from "../../features/community/types/role";

type RoleCardProps = {
  role: Role;
  onDelete?: (id: string) => void;
  onClick?: () => void;
  hover?: string;
};
export default function RoleCard({
  role,
  onDelete,
  onClick,
  hover = "hover:bg-basalt",
}: RoleCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!role.id) return;
    onDelete?.(role.id);
  };
  return (
    <div
      onClick={onClick}
      className={`shrink-0 cursor-pointer transition duration-300 h-[40px] px-4 flex justify-between items-center w-full rounded-lg ${hover}`}
    >
      <div className="flex items-center gap-2">
        <div className={`w-[12px] h-[12px] bg-[#${role.color}] rounded-full`}></div>
        <div className="flex flex-col leading-none gap-1">
          <div className="text-gray-100">{role.name}</div>
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