import { useEffect, useState } from "react";
import Button from "../../common/Button";
import Input from "../../common/Input";
import ModalCloseButton from "../../common/modals/ModalCloseButton";

type ChannelListModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (name: string) => void;
  isCreateChannel?: boolean;
  isCreateCategory?: boolean;
};

export default function ChannelListModal({
  isOpen,
  onClose,
  onCreate,
  isCreateChannel = false,
  isCreateCategory = false,
}: ChannelListModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showFade, setShowFade] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setTimeout(() => setShowFade(true), 10);
    } else {
      setShowFade(false);
      const timer = setTimeout(() => setIsVisible(false), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) setName("");
  }, [isOpen]);

  if (!isVisible) return null;

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate?.(trimmed);
    onClose();
  };

  if (isCreateChannel) {
    return (
      <div
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-black/50 flex justify-center items-center transition-opacity duration-200 ${
          showFade ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative bg-onyx w-[400px] rounded-3xl"
        >
         <ModalCloseButton onClose={onClose} />

          <div className="p-6 flex gap-4 flex-col items-center bg-onyx w-[400px] rounded-3xl">
            <div className="flex flex-col text-center">
              <div className="font-bold text-[20px]">Create Channel</div>
              <div className="text-gray-500">Channels keep conversations organized.</div>
            </div>

            <Input
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setName(e.target.value)
              }
              placeholder="Channel Name"
            />

            <Button text="Create" isGreen onClick={handleCreate} />
          </div>
        </div>
      </div>
    );
  }

  if (isCreateCategory) {
    return (
      <div
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-black/50 flex justify-center items-center transition-opacity duration-200 ${
          showFade ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative bg-onyx w-[400px] rounded-3xl"
        >
          <ModalCloseButton onClose={onClose} />

          <div className="p-6 flex gap-4 flex-col items-center bg-onyx w-[400px] rounded-3xl">
            <div className="flex flex-col text-center">
              <div className="font-bold text-[20px]">Create Category</div>
              <div className="text-gray-500">Categories help you group channels.</div>
            </div>

            <Input
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setName(e.target.value)
              }
              placeholder="Category Name"
            />

            <Button text="Create" isGreen onClick={handleCreate} />
          </div>
        </div>
      </div>
    );
  }

  return null;
}