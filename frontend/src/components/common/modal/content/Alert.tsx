import { useEffect, useState } from "react";
type AlertProps = {
    text?: string;
}

export default function Alert({ text }: AlertProps){
    const [cachedText, setcachedText] = useState(text);

    useEffect(() => {
        if (text) setcachedText(text);
    }, [text]);

    return(
        <>
            <div className="flex flex-col text-center gap-1">
                <div className="font-bold text-[20px]">Hold on!</div>
                <div className="text-gray-500">
                    {cachedText}
                </div>
            </div>
        </>
    );
}