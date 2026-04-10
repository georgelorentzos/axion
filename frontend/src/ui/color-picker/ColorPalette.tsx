import { useState, useRef, useCallback, useEffect } from "react";

type ColorPaletteProps = {
  isOpen: boolean;
  initialColor?: string;
  onChange?: (hex: string) => void;
  onClose?: () => void;
};

export default function ColorPalette({ isOpen, initialColor = "F3F4F6", onChange, onClose }: ColorPaletteProps) {
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [hexInput, setHexInput] = useState(initialColor.replace("#", ""));
  const [isDraggingPalette, setIsDraggingPalette] = useState(false);
  const [isDraggingHue, setIsDraggingHue] = useState(false);
  const [showFade, setShowFade] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const initialColorRef = useRef(initialColor);
  const isInitializing = useRef(false);

  initialColorRef.current = initialColor;

  const PALETTE_WIDTH = 236;
  const PALETTE_HEIGHT = 160;

  const hsvToRgb = (h: number, s: number, v: number): [number, number, number] => {
    s /= 100;
    v /= 100;
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    return [
      Math.round((r + m) * 255),
      Math.round((g + m) * 255),
      Math.round((b + m) * 255)
    ];
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return [r, g, b].map(x => x.toString(16).padStart(2, "0")).join("").toUpperCase();
  };

  const hsvToHex = (h: number, s: number, v: number) => {
    const [r, g, b] = hsvToRgb(h, s, v);
    return rgbToHex(r, g, b);
  };

  const hexToHsv = (hex: string) => {
    hex = hex.replace("#", "");
    if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
    if (hex.length !== 6) return null;
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    if (d !== 0) {
      if (max === r) h = ((g - b) / d + 6) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    const s = max === 0 ? 0 : (d / max) * 100;
    const v = max * 100;
    return { h, s, v };
  };

  const drawPalette = useCallback((currentHue: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const s = (x / (width - 1)) * 100;
        const v = (1 - y / (height - 1)) * 100;
        const [r, g, b] = hsvToRgb(currentHue, s, v);
        const i = (y * width + x) * 4;
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, []);

  useEffect(() => {
    if (isVisible) {
      drawPalette(hue);
    }
  }, [hue, isVisible, drawPalette]);

  useEffect(() => {
    if (isOpen) {
      isInitializing.current = true;
      const color = initialColorRef.current.replace("#", "");
      const hsv = hexToHsv(color);
      if (hsv) {
        setHue(hsv.h);
        setSaturation(hsv.s);
        setBrightness(hsv.v);
      }
      setHexInput(color);
      setIsVisible(true);
      const timer = setTimeout(() => {
        setShowFade(true);
        isInitializing.current = false;
      }, 30);
      return () => clearTimeout(timer);
    } else {
      setShowFade(false);
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const currentHex = hsvToHex(hue, saturation, brightness);

  useEffect(() => {
    setHexInput(currentHex);
  }, [currentHex]);

  useEffect(() => {
    if (isVisible && !isDraggingPalette && !isDraggingHue && !isInitializing.current) {
      onChange?.(currentHex);
    }
  }, [currentHex]);

  const handlePaletteInteraction = useCallback((e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(clientY - rect.top, rect.height));
    const s = (x / rect.width) * 100;
    const v = (1 - y / rect.height) * 100;
    setSaturation(s);
    setBrightness(v);
  }, []);

  const handleHueInteraction = useCallback((e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    const rect = hueRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setHue((x / rect.width) * 360);
  }, []);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (isDraggingPalette) handlePaletteInteraction(e);
      if (isDraggingHue) handleHueInteraction(e);
    };
    const handleUp = () => {
      if (isDraggingPalette || isDraggingHue) {
        onChange?.(hsvToHex(hue, saturation, brightness));
      }
      setIsDraggingPalette(false);
      setIsDraggingHue(false);
    };
    if (isDraggingPalette || isDraggingHue) {
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
      window.addEventListener("touchmove", handleMove);
      window.addEventListener("touchend", handleUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [isDraggingPalette, isDraggingHue, hue, saturation, brightness, handlePaletteInteraction, handleHueInteraction]);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace("#", "").slice(0, 6);
    setHexInput(val);
    if (val.length === 6) {
      const hsv = hexToHsv(val);
      if (hsv) {
        setHue(hsv.h);
        setSaturation(hsv.s);
        setBrightness(hsv.v);
        onChange?.(val.toUpperCase());
      }
    }
  };

  if (!isVisible) return null;

  return (
    <div className="absolute top-0 left-full ml-2" style={{ zIndex: 50 }}>
      <div onClick={onClose} className="fixed inset-0 z-40" />
      <div
        className={`relative z-50 transition-opacity duration-200 ${showFade ? "opacity-100" : "opacity-0"}`}
        style={{
          width: 260,
          background: "#1e1f22",
          borderRadius: 8,
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          userSelect: "none",
        }}
      >
        <div
          style={{ position: "relative", width: PALETTE_WIDTH, height: PALETTE_HEIGHT, borderRadius: 6, overflow: "hidden", cursor: "crosshair" }}
          onMouseDown={(e) => { setIsDraggingPalette(true); handlePaletteInteraction(e); }}
          onTouchStart={(e) => { setIsDraggingPalette(true); handlePaletteInteraction(e); }}
        >
          <canvas
            ref={canvasRef}
            width={PALETTE_WIDTH}
            height={PALETTE_HEIGHT}
            style={{ width: PALETTE_WIDTH, height: PALETTE_HEIGHT, display: "block" }}
          />
          <div
            style={{
              position: "absolute",
              left: `${saturation}%`,
              top: `${100 - brightness}%`,
              width: 14,
              height: 14,
              borderRadius: "50%",
              border: "2px solid #fff",
              boxShadow: "0 0 2px rgba(0,0,0,0.8), inset 0 0 2px rgba(0,0,0,0.4)",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
            }}
          />
        </div>

        <div
          ref={hueRef}
          onMouseDown={(e) => { setIsDraggingHue(true); handleHueInteraction(e); }}
          onTouchStart={(e) => { setIsDraggingHue(true); handleHueInteraction(e); }}
          style={{
            position: "relative",
            width: "100%",
            height: 14,
            borderRadius: 7,
            cursor: "pointer",
            background: "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: `${(hue / 360) * 100}%`,
              top: "50%",
              width: 16,
              height: 16,
              borderRadius: "50%",
              border: "2px solid #fff",
              boxShadow: "0 0 2px rgba(0,0,0,0.8)",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              background: `hsl(${hue}, 100%, 50%)`,
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: `#${currentHex}`,
              border: "1px solid rgba(255,255,255,0.1)",
              flexShrink: 0,
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "#2b2d31",
              borderRadius: 6,
              padding: "6px 8px",
              flex: 1,
              gap: 4,
            }}
          >
            <span style={{ color: "#72767d", fontSize: 14 }}>#</span>
            <input
              value={hexInput}
              onChange={handleHexChange}
              maxLength={6}
              spellCheck={false}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#dcddde",
                fontSize: 14,
                fontFamily: "monospace",
                width: "100%",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}