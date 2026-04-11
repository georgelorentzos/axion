import ImageProfile from "./ImageProfile";
import { type Log } from "../features/community/types/log";

type LogCardProps = {
  log: Log;
};

export default function LogCard({ log }: LogCardProps) {
  return (
    <div className="transition duration-300 py-2.5 pl-2 pr-4 flex justify-between items-center w-full rounded-lg hover:bg-basalt">
      <div className="flex items-center gap-2">
        <ImageProfile src={log.image} showStatus={false} />
        <div className="flex flex-col leading-none gap-1">
          <div className="text-gray-100">{log.log}</div>
          {log.note && (
            <div className="text-gray-500 text-[12px] max-w-[600px]">{log.note}</div>
          )}
        </div>
      </div>
      {log.createdAt && <div className="text-gray-500 text-[12px]">{log.createdAt}</div>}
    </div>
  );
}