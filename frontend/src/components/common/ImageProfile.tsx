import { useState } from "react";

type ImageProfileProps = {
    src?: string;
    online?: boolean;
    width?: string;
    height?: string;
    showStatus?: boolean;
    noLoadingAnimation?: boolean;
};

export default function ImageProfile({ src, online, width , height, showStatus=true, noLoadingAnimation }: ImageProfileProps) {
    const [loaded, setLoaded] = useState(noLoadingAnimation ? noLoadingAnimation : false);

    return (
        <div className={`relative ${width ? `w-[${width}px]` : "w-[40px]"} ${height ? `h-[${height}px]` : "h-[40px]"} `}>
            <img
                loading="eager"
                decoding="async"
                fetchPriority="high"
                src={src}
                alt=""
                className={`w-full h-full object-contain border border-outline rounded-full transition-opacity duration-300 ${loaded ? "blur-0 opacity-100" : "blur-sm opacity-0"} `}
                draggable="false"
                onLoad={() => setLoaded(true)}
            />

            {showStatus && (
                <>
                    <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-outline
                    ${online ? "bg-emerald" : "bg-red-500"}`}
                    />
                </>
            )}

        </div>
    );
}
