import Input from "../../Input";
import Button from "../../Button";
// import { api } from "../../../api/client";
import { useParams } from "react-router-dom";
import { useState } from "react";

export default function CreateChannel({ onClose }: { onClose: () => void }) {
  const { communityId } = useParams();
  const [name, setName] = useState("");

  const handleCreate = async () => {
    if (!communityId || !name.trim()) return;
    // await api.channels.create(communityId, name);
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