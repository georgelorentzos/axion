import { useState } from "react";
import Icon from "../Icon";
import { icons } from "../../constants/Icons";

type UploadAvatarProps = {
  onFileSelect: (file: File | null) => void;
};

export default function UploadAvatar({ onFileSelect }: UploadAvatarProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const handleClick = () => {
    const newInput = document.createElement("input");
    newInput.type = "file";
    newInput.accept = "image/*";
    newInput.addEventListener("change", (e) => {
      const file = (e.target as HTMLInputElement).files?.[0] || null;
      if (file) {
        setPreview(URL.createObjectURL(file));
        onFileSelect(file);
      }
    });
    newInput.click();
  };

  return (
    <div onClick={handleClick} className="relative w-[80px] h-[80px] cursor-pointer">
      <div className="w-full h-full border border-outline rounded-full flex items-center justify-center overflow-hidden">
        {preview ? (
          <img src={preview} alt="Server Icon" className="w-full h-full object-cover" />
        ) : (
          <Icon svgPaths={icons.picture} className="w-6 h-6 text-gray-500" />
        )}
      </div>
      <div className="w-7 h-7 bg-forestgreen absolute bottom-0 right-0 rounded-full border border-outline flex items-center justify-center">
        <Icon svgPaths={icons.add} className="w-4 h-4 text-white" />
      </div>
    </div>
  );
}
