import Button from "../../../ui/Button";

export default function NotFound() {
    const handleGoBack = () => {
        window.history.back();
    };

    return (
        <div className="h-screen w-full flex justify-center items-center">
            <div className="w-[420px] flex justify-center items-center flex-col gap-6 p-10 rounded-3xl">
                
                <div className="flex flex-col gap-4 justify-center items-center text-center">
                    <div className="text-white text-[72px] font-bold">404</div>
                    <div className="text-[#98968e] text-[20px]">Page Not Found</div>
                    <div className="text-[#98968e] text-sm">
                        The page you're looking for doesn't exist.
                    </div>
                </div>

                <Button text="Go Back" onClick={handleGoBack} isGreen />

            </div>
        </div>
    );
}