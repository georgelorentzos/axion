import { useLocation } from 'react-router-dom';
import Modal from '../modal/Modal';
import AddCommunity from '../modal/content/AddCommunity';
import { useState } from 'react';
import CommunityProfile from '../../features/community/components/CommunityProfile';

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
            <div className='relative flex items-center group'>
                <div className={`absolute left-[-20px] bg-forestgreen w-[8px] rounded-full transition-all duration-200
                    ${location.pathname === '/' 
                        ? "h-[40px] opacity-100" 
                        : "h-[20px] opacity-0 group-hover:opacity-100"
                    }`} 
                />
    
                <button
                    className={`transition duration-300 h-[50px] w-[50px] rounded-2xl flex justify-center items-center ${
                        location.pathname === '/'
                            ? "bg-forestgreen text-white"
                            : "bg-basalt text-gray-500 hover:bg-basalt hover:text-gray-300"
                    }`}
                    onClick={onClick}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="size-5"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                        />
                    </svg>
                </button>
            </div>
        );
    }

    if (isCreate) {
        return (
            <>
                <button
                    className="transition duration-300 bg-basalt hover:bg-basalt h-[50px] w-[50px] rounded-2xl flex justify-center items-center text-gray-500 hover:text-gray-300"
                    onClick={handleCreateCommunityModal}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="size-5"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 4.5v15m7.5-7.5h-15"
                        />
                    </svg>
                </button>

                <Modal isOpen={createModalIsOpen} onClose={() => setCreateModalIsOpen(false)}>
                    <AddCommunity onClose={() => setCreateModalIsOpen(false)} />
                </Modal>
            </>
        );
    }

    if (isCommunity) {
        const isSelected = location.pathname.startsWith(`/community/${communityId}`);

        return (
            <div className='relative flex items-center group'>
                <div className={`absolute left-[-20px] bg-forestgreen w-[8px] rounded-full transition-all duration-200
                    ${isSelected 
                        ? "h-[40px] opacity-100" 
                        : "h-[20px] opacity-0 group-hover:opacity-100"
                    }`} 
                />

                <button
                    className={`rounded-2xl transition duration-300 flex justify-center items-center ${
                      isSelected
                        ? "bg-forestgreen text-white"
                        : "bg-basalt text-gray-500 hover:bg-basalt hover:text-gray-300"
                    }`}
                    onClick={onClick}
                >
                  {communityImage ? (
                    <CommunityProfile src={`${apiUrl}${communityImage}`} />
                  ) : (
                    <CommunityProfile name={communityName?.charAt(0).toUpperCase()} />
                  )}
                </button>
            </div>
        );
    }

    return null;
}
