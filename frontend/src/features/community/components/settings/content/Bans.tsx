import SearchBar from "../../../../../ui/SearchBar";
import UserCard from "../../../../../ui/UserCard";
import { useBans } from "../../../contexts/useBans";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../../../../api/client";

export default function BansContent() {
  const { bans, setBans } = useBans();
  const [searchQuery, setSearchQuery] = useState("");
  const { communityId } = useParams();

  const filteredBans = bans.filter(
    (ban) =>
      ban.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ban.description ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUnBan = async (id: string) => {
    if (!communityId) return;
    try {
      const { data } = await api.bans.unban(communityId, id);
      if (data.success) {
        setBans(prev => prev.filter(ban => ban.id !== data.id));
      }
    } catch (error) {
      console.log("failed to unban: ", error);
    }
  };

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
            {filteredBans.map((ban, index) => (
              <UserCard
                key={index}
                title={ban.username}
                description={ban.description}
                imageUrl={ban.userImgUrl}
                joinedAtText={ban.createdAt}
                showStatus={false}
              >
                <button
                  onClick={() => handleUnBan(ban.id)}
                  className="text-gray-500 hover:text-gray-300 text-sm transition duration-300"
                >
                  Unban
                </button>
              </UserCard>
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