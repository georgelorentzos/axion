import SearchBar from "../../../common/SearchBar";
import LogCard from "./Logs/LogCard";
import { useBans } from "../../../../contexts/communities/useBans";
import { useState } from "react";

export default function BansContent() {
  const { bans } = useBans();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBans = bans.filter(
    (log) =>
      log.log.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.description ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex gap-2 justify-start items-start h-full min-h-0">
      <div className="px-6 flex flex-col gap-2 w-full h-full min-h-0">
        <div>Community Bans</div>
        <div className="text-[14px] w-[500px] text-gray-500">
          Manage bans on your server.
        </div>
        <div className="flex flex-col flex-1 min-h-0">
          <SearchBar onSearch={(value: string) => setSearchQuery(value)} />
          <br />
          <div className="text-gray-500 text-[12px] border-b border-outline pb-2">
          {bans.length === 0
            ? '0 Bans'
            : bans.length > 1
                ? `${bans.length} Bans`
                : `${bans.length} Ban`}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col py-2">
            {filteredBans.map((log, index) => (
              <LogCard
                key={index}
                log={log.log}
                description={log.description}
                createdAt={log.createdAt}
                userImgUrl={log.userImgUrl}
              />
            ))}
           {filteredBans.length === 0 && searchQuery && (
              <div className="text-gray-500 transition duration-300 py-2.5 px-4 flex justify-between items-center w-full rounded-lg hover:bg-basalt"> 
                  No results found
              </div>
            )}
            {filteredBans.length === 0 && !searchQuery && (
              <div className="text-gray-500 transition duration-300 py-2.5 px-4 flex justify-between items-center w-full rounded-lg hover:bg-basalt"> 
                  No bans yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}