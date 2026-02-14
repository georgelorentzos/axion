type ImageProfileProps = {
    src?: string;
    online?: boolean;
    width?: string;
    height?: string;
    showStatus?: boolean;
};

export default function ImageProfile({ src, online, width , height, showStatus=true  }: ImageProfileProps) {
    
    return (
        <div className={`relative ${width ? `w-[${width}px]` : "w-[40px]"} ${height ? `h-[${height}px]` : "h-[40px]"} `}>
            <img
                src={src}
                alt=""
                className="w-full h-full object-contain border border-outline rounded-full"
                draggable="false"
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
