import React, { useEffect, useRef, useState, useLayoutEffect, useCallback } from "react";

type ActionMenuProps = {
  isActionMenuOpen: boolean;
  canOpen?: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  children: React.ReactNode;
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
  const [measured, setMeasured] = useState(false);
  const [finalLeft, setFinalLeft] = useState(0);
  const [finalTop, setFinalTop] = useState(0);

  const updatePosition = useCallback(() => {
    if (!actionMenuRef.current || !buttonRef.current) return false;

    const menu = actionMenuRef.current;
    const menuWidth = menu.offsetWidth;
    const menuHeight = menu.offsetHeight;
    const padding = 8;

    const rect = buttonRef.current.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;

    let left = rect.left;
    let top = rect.bottom + 4;

    if (left + menuWidth + padding > window.innerWidth) {
      left = rect.right - menuWidth;
    }

    if (top + menuHeight + padding > window.innerHeight) {
      top = rect.top - menuHeight - 4;
    }

    setFinalLeft(left);
    setFinalTop(top);
    setMeasured(true);
    return true;
  }, [buttonRef]);

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
      setMeasured(false);
    } else {
      setMeasured(false);
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isActionMenuOpen]);

  useEffect(() => {
    if (!isActionMenuOpen || !isVisible) return;

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
  }, [isActionMenuOpen, isVisible, updatePosition]);

  useEffect(() => {
    if (!isActionMenuOpen || !measured) return;

    const handleReposition = () => updatePosition();

    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [isActionMenuOpen, measured, updatePosition]);

  if (!isVisible) return null;
  if (!canOpen) return null;

  return (
    <div
      ref={actionMenuRef}
      className={`fixed z-[2] bg-basalt border border-outline w-auto min-w-max rounded-xl shadow-lg overflow-hidden transition-opacity duration-200`}
      style={{
        left: measured ? finalLeft : -9999,
        top: measured ? finalTop : -9999,
        opacity: measured && isActionMenuOpen ? 1 : 0,
      }}
    >
      {children}
    </div>
  );
}