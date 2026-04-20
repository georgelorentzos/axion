import { useCurrentUser } from "../../features/user/contexts/useCurrentUser";
import UserAvatar from "../avatar/UserAvatar";
import Icon from "../Icon";
import { icons } from "../../constants/Icons";

export default function CurrentUserCard() {
    const { currentUser } = useCurrentUser();
    return(
        <div className="border border-outline flex items-center bg-basalt rounded-lg gap-2 w-full h-[60px]">
         <div className="pl-2 pr-4 flex justify-between items-center w-full">
                <div className="flex items-center gap-2">
                    <UserAvatar src={currentUser?.image} online />
                    <div className="flex flex-col leading-none gap-1">
                        <div className="text-gray-100">{currentUser?.username}</div>
                        <div className="text-gray-500 text-[12px]">Online</div>
                    </div>
                </div>
                <div className="flex items-center">
                    <button>
                        <Icon svgPaths={icons.settings} className="size-5 text-gray-500 transition duration-1000 hover:rotate-[360deg] hover:text-gray-300" />
                    </button>
                </div>
            </div>
        </div>
    );
}