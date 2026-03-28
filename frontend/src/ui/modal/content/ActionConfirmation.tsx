import { useState, useEffect } from "react";
import Button from "../../Button";

type ActionConfirmationProps = {
    data: {
        username: string;
    };
    action: {
        title: string,
        description: string;
    }
    onClick: () => void;
}

export default function ActionConfirmation({ data, onClick, action }: ActionConfirmationProps){
    const [error, setError] = useState('');
    useEffect(() => {
        const timer = setTimeout(() => {
            if (error) {
                setError('');
            }
        }, 3000)
        return () => clearTimeout(timer);
    }, [error]);

    return(
        <>
            <div className="flex flex-col text-center">
                <div className="font-bold text-[20px]">{action.title} {data?.username}</div>
                <div className="text-gray-500">{action.description}</div>
            </div>
            {error && <div className="text-crimson text-sm text-center">{error}</div>}
            <Button text={action.title} isDanger onClick={onClick} />
        </>
    );
}