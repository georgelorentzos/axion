import { useLocation } from 'react-router-dom';
import Modal from '../modal/Modal';
import AddCommunity from '../modal/content/AddCommunity';
import { useState } from 'react';
import CommunityAvatar from '../avatar/CommunityAvatar';
import { icons } from '../../constants/Icons';
import Icon from '../Icon';
import { type Community } from '../../features/community/types/community';

type CommunityButtonProps = {
    onClick?: () => void;
    isHome?: boolean;
    isCreate?: boolean;
    isCommunity?: boolean;
    community?: Community;
}

export default function CommunityButton({
    onClick,
    isHome,
    isCreate,
    isCommunity,
    community
}: CommunityButtonProps) {
    const location = useLocation();
    const [createModalIsOpen, setCreateModalIsOpen] = useState(false);

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
                    <Icon svgPaths={icons.home} className="size-5" />
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
                    <Icon svgPaths={icons.add} className="size-5" />
                </button>

                <Modal isOpen={createModalIsOpen} onClose={() => setCreateModalIsOpen(false)}>
                    <AddCommunity onClose={() => setCreateModalIsOpen(false)} />
                </Modal>
            </>
        );
    }

    if (isCommunity) {
        if (!community) return null;
        const isSelected = location.pathname.startsWith(`/community/${community?.id}`);

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

                <CommunityAvatar community={community} />
                </button>
            </div>
        );
    }

    return null;
}
