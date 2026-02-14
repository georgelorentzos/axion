import ImageProfile from "../common/ImageProfile";

type MessageBubbleProps = {
  isCurrentUser: boolean;
  message: string;
  sender_username: string;
  created_at: string;
  sender_profile_image: string;
};

export default function MessageBubble({
  isCurrentUser,
  message,
  sender_username,
  created_at,
  sender_profile_image,
}: MessageBubbleProps) {
  return (
    <div
      className={`flex gap-2 items-end mb-1 ${
        isCurrentUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      <div className="flex-shrink-0">
        <ImageProfile src={sender_profile_image} showStatus={false} />
      </div>

      <div
        className={`relative max-w-[320px] min-w-[120px] px-3 py-2 rounded-2xl ${
          isCurrentUser
            ? "bg-forestgreen rounded-br-sm"
            : "bg-zinc-800 rounded-bl-sm"
        }`}
      >
        {!isCurrentUser && (
          <p className="text-[11px] font-semibold text-emerald-400 mb-0.5">
            {sender_username}
          </p>
        )}

        <p className="text-[14px] text-gray-100 leading-snug break-words">
          {message}
        </p>

        <p
          className={`text-[10px] mt-1 ${
            isCurrentUser ? "text-green-300" : "text-zinc-500"
          } text-right`}
        >
          {created_at}
        </p>
      </div>
    </div>
  );
}
