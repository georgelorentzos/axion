import ImageProfile from "../common/ImageProfile";

type MessageBubblePros = {
    isCurrentUser: boolean;
    message: string;
    sender_username: string;
        created_at: string;
    sender_profile_image: string;
}

export default function MessageBubble({ isCurrentUser, message, sender_username, created_at, sender_profile_image  } : MessageBubblePros) {
    return (
        <div className={`flex gap-2 items-start ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}>
            <div className="flex-shrink-0 self-start relative">
                <ImageProfile src={sender_profile_image} showStatus={false} />
         

            </div>
            <div className={`flex flex-col w-auto py-3 rounded-3xl max-w-[350px]`}>   
                <div className={`text-gray-100 text-[12px] ${isCurrentUser ? "bg-outline" : "bg-emerald"} py-2 px-3 rounded-xl flex ${isCurrentUser ? "flex-row-reverse" : "flex-row"} justify-between rounded-b-none`}>
                    <div className={`text-gray-100 text-[12px] ${isCurrentUser ? "ml-[50px]" : "mr-[50px]"}`}>{ sender_username }</div>
                    <div className="text-gray-100 text-[12px]">{ created_at }</div>
                </div>
                <div className={`text-gray-100 ${isCurrentUser ? "bg-basalt" : "bg-forestgreen"} px-3 py-1 rounded-xl rounded-t-none`}>
                    { message }
                    </div>
            </div>
        </div>
    );
}