import SearchBar from "../../../common/SearchBar";
import LogCard from "./Logs/LogCard";
import { useLogs } from "../../../../contexts/communities/useLogs";
import { useState } from "react";

export default function LogsContent() {
  const { logs } = useLogs();
  const [serchQuery, setSearchQuery] = useState("");

  const filtered = logs.filter(
    (log) =>
      log.log.toLowerCase().includes(serchQuery.toLowerCase()) ||
      (log.description ?? "").toLowerCase().includes(serchQuery.toLowerCase())
  );

  return (
    <div className="flex gap-2 justify-start items-start h-full min-h-0">
      <div className="px-6 flex flex-col gap-2 w-full h-full min-h-0">
        <div>Community Logs</div>
        <div className="text-[14px] w-[500px] text-gray-500">
          See recent activity on your server.
        </div>
        <div className="flex flex-col flex-1 min-h-0">
          <SearchBar onSearch={(value: string) => setSearchQuery(value)} />
          <br />
          <div className="text-gray-500 text-[12px] border-b border-outline pb-2">
            Logs
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col py-2">
            {filtered.map((log, index) => (
              <LogCard
                key={index}
                log={log.log}
                description={log.description}
                createdAt={log.createdAt}
                userImgUrl={log.userImgUrl}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}