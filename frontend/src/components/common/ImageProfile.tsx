type ImageProfileProps = {
    src?: string;
    online?: boolean;
    width?: string;
    height?: string;
    showStatus?: boolean;
};

export default function ImageProfile({ src, online, width , height, showStatus=true  }: ImageProfileProps) {
    
    return (
        <div className={`relative ${width ? `w-[${width}px]` : "w-[50px]"} ${height ? `h-[${height}px]` : "h-[50px]"} `}>
            <img
                src={src}
                alt=""
                className="w-full h-full object-contain border border-outline rounded-full"
                draggable="false"
            />

            {showStatus && (
                <>
                    <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border border-outline
                    ${online ? "bg-greenhover" : "bg-red-500"}`}
                    />
                </>
            )}

        </div>
    );
}
