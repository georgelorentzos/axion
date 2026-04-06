import SearchBar from "../../../../../ui/SearchBar";
import LogCard from "../../../../../ui/LogCard";
import { useLogs } from "../../../contexts/useLogs";
import { useState } from "react";

export default function LogsContent() {
  const { logs } = useLogs();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLogs = logs.filter(
    (log) =>
      log.log.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.description ?? "").toLowerCase().includes(searchQuery.toLowerCase())
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
            {logs.length && logs.length > 1
            ? `${logs.length} Logs`
            : `${logs.length} Log`}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col py-2">
            {filteredLogs.map((log, index) => (
              <LogCard
                key={index}
                log={log.log}
                description={log.description}
                userImgUrl={log.userImgUrl}
                createdAt={log.createdAt}
              />
            ))}
            {filteredLogs.length === 0 && searchQuery && (
              <div className="text-gray-500 transition duration-300 py-2.5 px-4 flex justify-between items-center w-full rounded-lg hover:bg-basalt"> 
                  No results found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}