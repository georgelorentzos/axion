import CurrentUserCard from "../common/CurrentUserCard";
import { useLocation } from "react-router-dom";
import { useState, useRef } from "react";
import ActionMenu from "../common/ActionMenu";
import ChannelListModal from "./modals/ChannelListModal";

interface LocationState {
  communityData?: {
    communityName: string;
  };
}

type Channel = {
  channelId: string;
  channelName: string;
};

type ModalMode = "channel" | "category" | null;

export default function ChannelList() {
  const location = useLocation();
  const { communityData } = location.state as LocationState;

  const [channels, setChannels] = useState<Channel[]>([]);
  const [isChannelListMenuOpen, setIsChannelListMenuOpen] = useState(false);
  const [isServerOptionsMenuOpen, setIsServerOptionsMenuOpen] = useState(false);
  const serverOptionsButtonRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [isChannelListModalOpen, setIsChannelListModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setPos({ x: e.clientX, y: e.clientY });
    setIsChannelListMenuOpen(true);
  };

  const openCreateChannelModal = () => {
    setModalMode("channel");
    setIsChannelListModalOpen(true);
    setIsChannelListMenuOpen(false);
  };

  const openCreateCategoryModal = () => {
    setModalMode("category");
    setIsChannelListModalOpen(true);
    setIsChannelListMenuOpen(false);
  };

  const closeModal = () => {
    setIsChannelListModalOpen(false);
    setModalMode(null);
  };

  const handleCreate = (name: string) => {
    if (modalMode === "channel") {
      setChannels((prev) => [
        ...prev,
        { channelId: crypto.randomUUID(), channelName: name },
      ]);
    } else if (modalMode === "category") {
      console.log("Create category:", name);
    }
  };

  return (
    <div
      className="w-[370px] h-screen border-r border-outline flex flex-col"
    >
      <audio preload="auto" />
      <div className="w-full h-[100px] border-b border-outline flex items-center justify-between px-6 gap-3 flex-shrink-0">
        <div className="flex gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="size-6 text-gray-500"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6m-16.5-3a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3m-19.5 0a4.5 4.5 0 0 1 .9-2.7L5.737 5.1a3.375 3.375 0 0 1 2.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 0 1 .9 2.7m0 0a3 3 0 0 1-3 3m0 3h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Zm-3 6h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Z"
            />
          </svg>
          <div className="text-gray-100">{communityData?.communityName}</div>
        </div>
        <div className="flex flex-col relative">
        <button onClick={() => setIsServerOptionsMenuOpen(prev => !prev)} ref={serverOptionsButtonRef}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className={`size-6 text-gray-500 hover:text-gray-300 transition-transform duration-200 ${
            isServerOptionsMenuOpen ? "rotate-180 text-gray-300" : ""
            }`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m19.5 8.25-7.5 7.5-7.5-7.5"
            />
          </svg>
        </button>

       <ActionMenu
          isActionMenuOpen={isServerOptionsMenuOpen}
          onClose={() => setIsServerOptionsMenuOpen(false)}
          buttonRef={serverOptionsButtonRef}
          isServerOptions
        />
        </div>
      </div>

      <div onContextMenu={handleContextMenu} className="relative space-y-3 p-6 flex flex-col flex-1">
        {channels.length === 0 && (
          <div className="flex-1 flex flex-col justify-center items-center mt-[100px]">
            <div className="text-gray-400 text-sm">No channels yet</div>
          </div>
        )}

        <ActionMenu
          isActionMenuOpen={isChannelListMenuOpen}
          onClose={() => setIsChannelListMenuOpen(false)}
          position={pos}
          isChannelList
          onCreateChannel={openCreateChannelModal}
          onCreateCategory={openCreateCategoryModal}
        />
      </div>

      <ChannelListModal
        isOpen={isChannelListModalOpen}
        onClose={closeModal}
        onCreate={handleCreate}
        isCreateChannel={modalMode === "channel"}
        isCreateCategory={modalMode === "category"}
      />

      <CurrentUserCard />
    </div>
  );
}
