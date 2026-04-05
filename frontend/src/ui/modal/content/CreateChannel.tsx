import Input from "../../Input";
import Button from "../../Button";
import { api } from "../../../api/client";
import { useParams } from "react-router-dom";
import { useState } from "react";
import { useChannels } from "../../../features/community/contexts/useChannels";

type CreateChannelProps = {
  onClose: () => void;
  categoryId?: string;
};

export default function CreateChannel({ onClose, categoryId }: CreateChannelProps) {
  const { communityId } = useParams();
  const [name, setName] = useState("");
  const { setChannels } = useChannels();

  const handleCreate = async () => {
    if (!communityId || !name.trim()) return;
    const { data } = await api.channels.create(communityId, name, categoryId);
    if (data.success) {
      setChannels(prev => [
        ...(prev || []),{
          id: data.id,
          name: data.name,
          categoryId: data.categoryId
        }
      ]);
    }
    onClose();
  };

  return (
    <>
      <div className="flex flex-col text-center">
        <div className="font-bold text-[20px]">Create Channel</div>
        <div className="text-gray-500">Channels keep conversations organized.</div>
      </div>
      <Input placeholder="Channel Name" onChange={(e) => setName(e.target.value)} />
      <Button text="Create" isGreen onClick={handleCreate} />
    </>
  );
}