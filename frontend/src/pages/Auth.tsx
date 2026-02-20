import { useState, useEffect } from "react";
import Input from "../components/common/Input";
import Button from "../components/common/Button";

export default function Auth() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [completed, setCompleted] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (error) {
                setError('');
            }
        }, 3000);
        return () => clearTimeout(timer);
    }, [error])

    const handleLogin = async () => {

        if (!email) {
            setError('Please enter an email address.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }

        setLoading(true);
        setError('');
        setCompleted(false);
        
        try {
            const response = await fetch('http://127.0.0.1:8000/api/auth', {
                method: 'POST', headers: {'Content-type': 'application/json'}, body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.detail);
                return;
            }

            if (data.success) {
                setCompleted(true);
            } else{
                setError(data.message);
            }

        } catch (error) {
            setError('Connection error.');
        } finally {
            setLoading(false);
        }
        
    };

    return (
        <div className="h-screen w-full flex flex-col justify-center items-center">
            <div className="border border-outline w-[420px] flex justify-center items-center flex-col gap-4 p-10 rounded-3xl">
            <div className="text-white text-[30px]">Continue</div>
                {error && <div className="text-red-400 text-sm text-center">{error}</div>}
                {!completed ? (
                <>
                <Input placeholder="Enter your email" onChange={(e) => setEmail(e.target.value)} />
                <Button text="Continue with email" onClick={handleLogin} isGreen disabled={loading} />
                <div className="text-[0.75rem] text-[#98968e] text-center">By continuing, you acknowledge Company’s <a href="/privacy-policy" className="underline underline-offset-3">Privacy Policy.</a></div>
                </>
                ) : (
                    <div className="flex flex-col gap-2 justify-center items-center">
                         <div className="text-[#98968e]">To continue, click the link sent to</div>
                         <div className="text-[#98968e]">{email}</div>
                         <br />
                         <div className="text-[#98968e] text-[0.75rem]">Not seeing the email in your inbox? Try <button className="underline underline-offset-3">sending again.</button></div>
                    </div>
                )}
            </div>
        </div>
    );
}