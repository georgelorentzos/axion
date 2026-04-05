import { type Channel } from "../features/community/types/channel";

type ChannelProps = {
    channel: Channel;
}

export default function Channel({ channel }: ChannelProps) {
    return(
        <button className="rounded-lg w-full h-[40px] pl-2 pr-4 text-gray-500 flex gap-2 items-center hover:bg-basalt hover:text-gray-100 transition duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5 text-gray-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5">
            </path></svg>
            {channel.name}
        </button>
    );
}