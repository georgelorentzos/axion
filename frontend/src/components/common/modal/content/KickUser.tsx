import Button from "../../Button";
import TextArea from "../../TextArea";
import { type User } from "../../../../types/user";
import { useParams } from "react-router-dom";
import { useCommunityMembers } from "../../../../contexts/communities/useCommunityMembers";

type KickUserProps = {
    onClose: () => void;
    user?: User;
}

export default function KickUser({ user, onClose }: KickUserProps) {
    const token = localStorage.getItem("token");
    const { communityId } = useParams();
    const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;
    const { setCommunityMembers } = useCommunityMembers();

    const handleKick = async () => {
        if (!user) return;
        if (!token) return;
        if (!communityId) return;
        try{
          const response = await fetch(`${apiUrl}/api/community/${communityId}/members/${user?.id}/kick`, {
            method: "DELETE",
            headers: {"Authorization": `Bearer ${token}`}
          });
          if (response.ok) {
            setCommunityMembers(prev => prev.filter(m => m.id !== user?.id));
            onClose();
          }
        } catch (error) {
          console.log(`error kicking ${user?.username}: `, error)
        }
    };

    return(
        <>
            <div className="flex flex-col text-center">
                <div className="font-bold text-[20px]">Kick {user?.username}</div>
                <div className="text-gray-500">Are you sure you want to kick this user?</div>
            </div>
            <TextArea placeholder="Reason?" />
            <Button text="Kick" isDanger onClick={handleKick} />
        </>
    );
}