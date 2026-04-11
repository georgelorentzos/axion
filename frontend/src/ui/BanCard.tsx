import ImageProfile from "./ImageProfile";
import { type Ban } from "../features/community/types/ban";

type BanCardProps = {
  ban: Ban;
  children?: React.ReactNode;
};

export default function BanCard({ ban, children }: BanCardProps) {
  return (
    <div className="transition duration-300 py-2.5 pl-2 pr-4 flex justify-between items-center w-full rounded-lg hover:bg-basalt">
      <div className="flex items-center gap-2">
        <ImageProfile src={ban.image} showStatus={false} />
        <div className="flex flex-col leading-none gap-1">
          <div className="text-gray-100">{ban.username}</div>
          {ban.note && (
            <div className="text-gray-500 text-[12px] max-w-[600px]">{ban.note}</div>
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