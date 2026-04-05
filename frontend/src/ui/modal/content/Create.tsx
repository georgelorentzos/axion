import Input from "../../Input";
import Button from "../../Button";
import { useState, useRef, useEffect } from "react";

type CreateProps = {
  title: string;
  description: string;
  placeholder: string;
  buttonText?: string;
  onSubmit: (name: string) => void;
};

export default function Create({ title, description, placeholder, buttonText = "Create", onSubmit }: CreateProps) {
  const [name, setName] = useState("");
  const cached = useRef({ title, description, placeholder, buttonText });

  useEffect(() => {
    if (title) cached.current = { title, description, placeholder, buttonText };
  }, [title, description, placeholder, buttonText]);

  return (
    <>
      <div className="flex flex-col text-center">
        <div className="font-bold text-[20px]">{cached.current.title}</div>
        <div className="text-gray-500">{cached.current.description}</div>
      </div>
      <Input placeholder={cached.current.placeholder} value={name} onChange={(e) => setName(e.target.value)} />
      <Button text={cached.current.buttonText} isGreen onClick={() => name.trim() && onSubmit(name)} />
    </>
  );
}