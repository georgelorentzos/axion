import { useEffect, useState } from "react";

type InfoProps = {
    text?: string;
}

export default function Info({ text }: InfoProps){
    const [cachedText, setCachedText] = useState(text);

    useEffect(() => {
        if (text) setCachedText(text);
    }, [text]);

    return(
        <>
            <div className="flex flex-col text-center gap-1">
                <div className="font-bold text-[20px]">Info</div>
                <div className="text-gray-500">
                    {cachedText}
                </div>
            </div>
        </>
    );
}