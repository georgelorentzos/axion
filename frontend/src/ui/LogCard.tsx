import ImageProfile from "./ImageProfile";

type LogCardProps = {
  log: string;
  description?: string | null;
  userImgUrl?: string;
  createdAt?: string;
};

export default function LogCard({ log, description, userImgUrl, createdAt }: LogCardProps) {
  return (
    <div className="transition duration-300 py-2.5 pl-2 pr-4 flex justify-between items-center w-full rounded-lg hover:bg-basalt">
      <div className="flex items-center gap-2">
        <ImageProfile src={userImgUrl} showStatus={false} />
        <div className="flex flex-col leading-none gap-1">
          <div className="text-gray-100">{log}</div>
          {description && (
            <div className="text-gray-500 text-[12px] max-w-[600px]">{description}</div>
          )}
        </div>
      </div>
      {createdAt && <div className="text-gray-500 text-[12px]">{createdAt}</div>}
    </div>
  );
}