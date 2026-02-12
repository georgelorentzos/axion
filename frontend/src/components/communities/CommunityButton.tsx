import { useLocation } from 'react-router-dom';
import CreateCommunityModal from "./CreateCommunityModal";
import { useState } from 'react';

type CommunityButtonProps = {
    onClick?: () => void;
    isHome?: boolean;
    isCreate?: boolean;
    isCommunity?: boolean;
    communityId?: string;
    communityImage?: string;
    communityName?: string;
}

export default function CommunityButton({
    onClick,
    isHome,
    isCreate,
    isCommunity,
    communityId,
    communityImage,
    communityName
}: CommunityButtonProps) {
    const location = useLocation();
    const [createModalIsOpen, setCreateModalIsOpen] = useState(false);
    const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;

    const handleCreateCommunityModal = () => {
        setCreateModalIsOpen(prev => !prev);
    };

    if (isHome) {
        return (
            <button
                className={`transition duration-300 h-[50px] w-[50px] rounded-full flex justify-center items-center ${
                    location.pathname === '/'
                        ? "bg-forestgreen text-white"
                        : "bg-field text-gray-500 hover:bg-charcoal"
                }`}
                onClick={onClick}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="h-6 w-6"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                    />
                </svg>
            </button>
        );
    }

    if (isCreate) {
        return (
            <>
                <button
                    className="transition duration-300 bg-field hover:bg-charcoal h-[50px] w-[50px] rounded-full flex justify-center items-center text-gray-500 hover:text-gray-300"
                    onClick={handleCreateCommunityModal}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="h-6 w-6"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 4.5v15m7.5-7.5h-15"
                        />
                    </svg>
                </button>

                <CreateCommunityModal
                    isOpen={createModalIsOpen}
                    onClose={() => setCreateModalIsOpen(false)}
                />
            </>
        );
    }

    if (isCommunity) {
        const isSelected = location.pathname === `/community/${communityId}`;

        return (
            <button
                className={`transition duration-300 h-[50px] w-[50px] rounded-full flex justify-center items-center ${
                    isSelected
                        ? "bg-forestgreen text-white"
                        : "bg-field text-gray-500 hover:bg-charcoal"
                }`}
                onClick={onClick}
            >
                {communityImage && communityImage !== "null" ? (
                    <img
                        src={`${apiUrl}${communityImage}`}
                        alt=""
                        className="rounded-full w-full h-full object-cover"
                    />
                ) : (
                    <span className="text-lg font-semibold">
                        {communityName?.charAt(0).toUpperCase()}
                    </span>
                )}
            </button>
        );
    }

    return null;
}
