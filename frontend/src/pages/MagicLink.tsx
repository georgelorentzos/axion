import { useEffect, useState } from "react";
import Button from "../components/common/Button";

export default function MagicLink() {
    const token = window.location.hash.substring(1);
    const [isExpired, setIsExpired] = useState<boolean | null>(null);
    
    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setIsExpired(true);
                return;
            }

            try {
                const response = await fetch('http://127.0.0.1:8000/api/verify-token', {
                    method: 'POST',
                    headers: {
                        "Content-type": "application/json"
                    },
                    body: JSON.stringify({ token, type: "Auth" })
                });

                const data = await response.json();

                if (!response.ok) {
                    setIsExpired(true);
                    return;
                }

                if (data.success) {
                    localStorage.setItem('token', data.token);
                    window.location.href = '/';
                } else {
                    setIsExpired(true);
                }

            } catch (error) {
                setIsExpired(true);
            }
        };

        verifyToken();
    }, [token]);

    const handleGoBack = () => {
        window.location.href = '/auth';
    };

    return (
        <div className="bg-onyx h-screen w-full flex justify-center items-center">
            {isExpired === null ? (
                <></>
            ) : isExpired ? (
                <div className="w-[420px] flex justify-center items-center flex-col gap-4 border border-[#4d4d4a] p-10 rounded-3xl">
                    <div className="text-white text-[30px]">
                        This link has expired
                    </div>
                    <Button text="Go Back" onClick={handleGoBack} isGreen />
                    <div className="text-[0.75rem] text-[#98968e] text-center">
                        If the problem persists, please <a href="/privacy-policy" className="underline underline-offset-3">contact support.</a>
                    </div>
                </div>
            ) : null}
        </div>
    );
}