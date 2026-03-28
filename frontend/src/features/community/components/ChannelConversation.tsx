import { useParams } from "react-router-dom";

export default function ChannelConversation() {
    const { channelId } = useParams();

    return(
        <>
        {channelId && (
            <div className="flex-1">
                <div className="w-full h-[60px] border-b border-outline">

                </div>
            </div>
        )}
        {!channelId && (
            <div className="flex-1 flex items-center justify-center">
                <div className="mt-[20px] flex flex-col items-center text-center max-w-[440px]">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-10 text-gray-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5" />
                </svg>

                <div className="text-gray-500 font-bold text-[18px]">NO TEXT CHANNELS</div>
                <div className="text-gray-500">
                    You find yourself in a strange place. You dont have access to any text channels, or there are none in this server.
                </div>
                </div>
            </div>
        )}
        </>
    );
}