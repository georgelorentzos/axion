import Input from "../../Input";
import Button from "../../Button";
import { api } from "../../../api/client";
import { useParams } from "react-router-dom";
import { useState } from "react";
import { useCategories } from "../../../features/community/contexts/useCategories";

type CreateCategoryProps = {
  onClose: () => void;
};

export default function CreateCategory({ onClose }: CreateCategoryProps) {
  const { communityId } = useParams();
  const [name, setName] = useState("");
  const { setCategories } = useCategories();

  const handleCreate = async () => {
    if (!communityId || !name.trim()) return;
    const { data } = await api.categories.create(communityId, name);
    if (data.success) {
      setCategories(prev => [...(prev || []), { id: data.id, name: data.name }]);
    }
    onClose();
  };

  return (
    <>
      <div className="flex flex-col text-center">
        <div className="font-bold text-[20px]">Create Category</div>
        <div className="text-gray-500">Categories help you group channels.</div>
      </div>
      <Input placeholder="Category Name" onChange={(e) => setName(e.target.value)} />
      <Button text="Create" isGreen onClick={handleCreate} />
    </>
  );
}