import { useState, useEffect } from "react";

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
    }, [error, alert])

    const handleLogin = async () => {

        if (!email) {
            setError('Please enter an email');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email');
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
        <div className="bg-[#141414] h-screen w-full flex flex-col justify-center items-center">
            <div className="border border-outline w-[420px] h-[290px] flex justify-center items-center flex-col gap-4 p-10 rounded-3xl">
            <div className="text-white text-[30px]">Continue</div>
                {error && <div className="text-red-400 text-sm text-center">{error}</div>}
                {!completed ? (
                <>
                <input 
                type="email" 
                className="transition duration-200 focus:outline-none pl-4 text-[#98968e] bg-field h-[52px] w-[21rem] rounded-xl" 
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                />
                <div className="flex flex-col gap-2">
                    <button 
                    className="transition duration-200 bg-forestgreen hover:bg-emerald text-white h-[52px] w-[21rem] rounded-xl cursor-pointer"
                    onClick={handleLogin}
                    disabled={loading}
                    >Continue with email</button>
                    <div className="text-[0.75rem] text-[#98968e] text-center">By continuing, you acknowledge Company’s <a href="/privacy-policy" className="underline underline-offset-3">Privacy Policy.</a></div>
                </div>
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