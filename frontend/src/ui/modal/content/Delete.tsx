import { useState, useRef, useEffect } from "react";
import Button from "../../Button";
import Input from "../../Input";

type DeleteProps = {
  title: string;
  description?: string;
  onConfirm: () => void;
  confirmText?: string;
};

export default function Delete({ title, description = "Are you sure? This action cannot be undone.", onConfirm, confirmText }: DeleteProps) {
  const [input, setInput] = useState("");
  const cached = useRef({ title, description, confirmText });

  useEffect(() => {
    if (title && !title.includes("undefined")) cached.current = { title, description, confirmText };
  }, [title, description, confirmText]);

  return (
    <>
      <div className="flex flex-col text-center">
        <div className="font-bold text-[20px]">{cached.current.title}</div>
        <div className="text-gray-500">{cached.current.description}</div>
      </div>
      {cached.current.confirmText && (
        <Input placeholder={`Type "${cached.current.confirmText}" to confirm`} value={input} onChange={(e) => setInput(e.target.value)} />
      )}
      <Button text="Delete" isDanger onClick={onConfirm} disabled={cached.current.confirmText ? input !== cached.current.confirmText : false} />
    </>
  );
}