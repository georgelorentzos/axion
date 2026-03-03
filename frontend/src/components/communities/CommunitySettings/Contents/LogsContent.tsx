import SearchBar from "../../../common/SearchBar";
import LogCard from "./Logs/LogCard";
import { useLogs } from "../../../../contexts/communities/useLogs";
import { useState } from "react";

export default function LogsContent() {
    const { logs } = useLogs();
    const [serchQuery, setSearchQuery] = useState('');
    const filtered = logs.filter(log => 
        log.log.toLowerCase().startsWith(serchQuery.toLowerCase()) || 
        (log.reason ?? "").toLowerCase().startsWith(serchQuery.toLowerCase())
    );

    return(
    <div className="flex gap-2 justify-start items-start">
        <div className="px-6 flex flex-col gap-2 w-full">
            <div>Community Logs</div>
            <div className="text-[14px] w-[500px] text-gray-500">
                See recent activity on your server.
            </div>
            <SearchBar onSearch={(value: string) => setSearchQuery(value)} />
            <br />
             <div className="text-gray-500 text-[12px] border-b border-outline pb-2">
                Logs
             </div>
            {filtered.map((log, index) => (
                <LogCard key={index} log={log.log} reason={log.reason} createdAt={log.createdAt} userImgUrl={log.userImgUrl} />
             ))}
        </div>
    </div>
    );
}