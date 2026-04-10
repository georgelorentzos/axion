import React, { useEffect, useRef, useState, useCallback } from "react";

type ActionMenuProps = {
  isOpen: boolean;
  canOpen?: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
  children: React.ReactNode;
};

export default function ActionMenu({
  isOpen,
  canOpen = true,
  position,
  onClose,
  buttonRef,
  children,
}: ActionMenuProps) {
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [measured, setMeasured] = useState(false);
  const [finalLeft, setFinalLeft] = useState(0);
  const [finalTop, setFinalTop] = useState(0);

  const updatePosition = useCallback(() => {
    if (!actionMenuRef.current) return false;

    const menu = actionMenuRef.current;
    const menuWidth = menu.offsetWidth;
    const menuHeight = menu.offsetHeight;
    const padding = 8;

    let left: number;
    let top: number;

    if (buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return false;
      left = rect.left;
      top = rect.bottom + 4;
    } else {
      left = position.x;
      top = position.y;
    }

    if (left + menuWidth + padding > window.innerWidth) {
      left = left - menuWidth;
    }

    if (top + menuHeight + padding > window.innerHeight) {
      top = top - menuHeight;
    }

    setFinalLeft(left);
    setFinalTop(top);
    setMeasured(true);
    return true;
  }, [buttonRef, position]);

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
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, buttonRef]);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setMeasured(false);
    } else {
      setMeasured(false);
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isVisible) return;

    if (updatePosition()) return;

    let attempt = 0;
    const maxAttempts = 20;
    const intervalId = setInterval(() => {
      attempt++;
      if (updatePosition() || attempt >= maxAttempts) {
        clearInterval(intervalId);
      }
    }, 50);

    return () => clearInterval(intervalId);
  }, [isOpen, isVisible, updatePosition]);

  useEffect(() => {
    if (!isOpen || !measured) return;

    const handleReposition = () => updatePosition();

    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [isOpen, measured, updatePosition]);

  if (!isVisible) return null;
  if (!canOpen) return null;

  return (
    <div
      ref={actionMenuRef}
      className={`fixed z-[2] bg-basalt border border-outline w-auto min-w-max rounded-xl shadow-lg overflow-hidden transition-opacity duration-200`}
      style={{
        left: measured ? finalLeft : -9999,
        top: measured ? finalTop : -9999,
        opacity: measured && isOpen ? 1 : 0,
      }}
    >
      {children}
    </div>
  );
}