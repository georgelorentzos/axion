import SearchBar from "../../../../../ui/SearchBar";
import BanCard from "../../../../../ui/BanCard";
import { useBans } from "../../../contexts/useBans";
import { useState } from "react";
import ActionMenu from "../../../../../ui/action-menu/ActionMenu";
import ActionMenuButton from "../../../../../ui/action-menu/ActionMenuButton";
import Icon from "../../../../../ui/Icon";
import { icons } from "../../../../../constants/Icons";
import Modal from "../../../../../ui/modal/Modal";
import MemberAction from "../../../../../ui/modal/content/MemberAction";
import { type Ban } from "../../../types/ban";

export default function BansContent() {
  const { bans } = useBans();
  const [searchQuery, setSearchQuery] = useState("");
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [pos, setPos] = useState<{ x:number, y:number }>({ x:0, y:0 });
  const [isUnBanConfirmModalOpen, setIsUnBanConfirmModalOpen] = useState(false);
  const [userToUnban, setUserToUnban] = useState<Ban>();

  const filteredBans = bans.filter(
    (ban) =>
      ban.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ban.note ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
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
            {filteredBans.map(ban => (
              <BanCard
                key={ban.id}
                ban={ban}
              >
                <button
                  onClick={(e: React.MouseEvent) => {
                    setPos({ x:e.clientX, y:e.clientY});
                    setUserToUnban(ban);
                    setIsActionMenuOpen(true)
                  }}
                >
                  <Icon svgPaths={icons.verticalDots} className="size-5 text-gray-500 hover:text-gray-300 transition duration-300" />
                </button>
              </BanCard>
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
    <Modal isOpen={isUnBanConfirmModalOpen} onClose={() => setIsUnBanConfirmModalOpen(false)}>
      <MemberAction onClose={() => {
        setIsUnBanConfirmModalOpen(false);
      }}
      action="unban"
      user={userToUnban}
       />
    </Modal>
    <ActionMenu isOpen={isActionMenuOpen} onClose={() => setIsActionMenuOpen(false)} position={pos}>
      <ActionMenuButton text="Unban" svgPaths={icons.ban} onClick={() => {
        setIsActionMenuOpen(false);
        setIsUnBanConfirmModalOpen(true);
      }} />
    </ActionMenu>
    </>
  );
}