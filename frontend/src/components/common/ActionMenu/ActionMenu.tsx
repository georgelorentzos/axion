import React, { useEffect, useRef, useState } from "react";

type ActionMenuProps = {
  isActionMenuOpen: boolean;
  canOpen?: boolean;
  position?: { x: number; y: number };
  onClose: () => void;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
  children: React.ReactNode
};

export default function ActionMenu({
  isActionMenuOpen,
  canOpen = true,
  onClose,
  buttonRef,
  position,
  children,
}: ActionMenuProps) {
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef?.current?.contains(event.target as Node)) return;

      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isActionMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isActionMenuOpen, onClose, buttonRef]);

  useEffect(() => {
    if (isActionMenuOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isActionMenuOpen]);

  if (!isVisible) return null;
  if (!canOpen) return null;

  const hasPos =
    typeof position?.x === "number" && typeof position?.y === "number";

  return (
    <div
      ref={actionMenuRef}
      className={`z-[2] bg-basalt border border-outline w-auto min-w-max rounded-xl shadow-lg overflow-hidden transition-opacity duration-200 ${
        isActionMenuOpen ? "opacity-100" : "opacity-0"
      } ${hasPos ? "fixed" : "absolute right-[-15px] top-7"}`}
      style={hasPos ? { left: position!.x, top: position!.y } : undefined}
    >
      {children}
    </div>
  );
}
