type ImageProfileProps = {
    src?: string;
    online?: boolean;
    width?: number;
    height?: number;
    showStatus?: boolean;
};

export default function ImageProfile({ src, online, width = 40, height, showStatus = true }: ImageProfileProps) {
    const w = width;
    const h = height || w;
    const statusSize = Math.max(w * 0.3, 14);
    const borderSize = Math.max(w * 0.06, 2);

    return (
        <div
            className="relative"
            style={{ width: `${w}px`, height: `${h}px` }}
        >
            <img
                loading="eager"
                decoding="async"
                fetchPriority="high"
                src={src}
                alt=""
                className="w-full h-full object-contain border border-outline rounded-full transition-opacity duration-300 opacity-100"
                draggable="false"
            />
            {showStatus && (
                <span
                    className={`absolute rounded-full ${online ? "bg-emerald" : "bg-red-500"}`}
                    style={{
                        width: `${statusSize}px`,
                        height: `${statusSize}px`,
                        bottom: `${w * 0.03}px`,
                        right: `${w * -0.04}px`,
                        borderWidth: `${borderSize}px`,
                        borderColor: 'rgb(38 38 40 / var(--tw-border-opacity, 1))',
                        borderStyle: 'solid',
                    }}
                />
            )}
        </div>
    );
}