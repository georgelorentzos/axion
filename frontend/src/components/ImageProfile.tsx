type ImageProfileProps = {
    src?: string;
    online: boolean;
};

export default function ImageProfile({ src, online }: ImageProfileProps) {
    
    return (
        <div className="relative w-[50px] h-[50px]">
            <img
                src={src}
                alt=""
                className="w-full h-full object-contain border border-outline rounded-3xl"
            />

            <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border border-outline
                    ${online ? "bg-greenhover" : "bg-red-500"}`}
            />
        </div>
    );
}
