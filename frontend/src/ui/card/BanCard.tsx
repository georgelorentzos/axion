import UserAvatar from "../avatar/UserAvatar";
import { type Ban } from "../../features/community/types/ban";

type BanCardProps = {
  ban: Ban;
  children?: React.ReactNode;
};

export default function BanCard({ ban, children }: BanCardProps) {
  return (
    <div className="transition duration-300 py-2.5 pl-2 pr-4 flex justify-between items-center w-full rounded-lg hover:bg-basalt">
      <div className="flex items-center gap-2">
        <UserAvatar src={ban.image} showStatus={false} />
        <div className="flex flex-col leading-none gap-1">
          <div className="text-gray-100">{ban.username}</div>
          {ban.reason && (
            <div className="text-gray-500 text-[12px] max-w-[600px]">{ban.reason}</div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {ban.createdAt && <div className="text-gray-500 text-[12px]">{ban.createdAt}</div>}
        {children}
      </div>
    </div>
  );
}